import market_abi from './abis/market_abi.json'
import market_old_abi from './abis/market_old_abi.json'
import dotenv from 'dotenv'
import chalk from 'chalk'
import { ethers } from 'ethers'
import redis from './redisHandler'
import { networksConfig, Position } from './constants'
import TelegramBot from 'node-telegram-bot-api'

dotenv.config()

const log = console.log

let bot: TelegramBot

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
  log(chalk.green('Telegram bot initialized'))
} else {
  log(chalk.bold.red('TELEGRAM_BOT_TOKEN must be provided'))
}

const MAX_RETRIES = 3

async function initializeCounters() {
  if (!process.env.PRIVATE_KEYS) {
    log(chalk.bold.red('At least one private key is required'))
    return
  }

  const privateKeys = process.env.PRIVATE_KEYS.split(',')
  const networks = Object.keys(networksConfig)

  for (const network of networks) {
    // Initialize counters for each executor
    for (const privateKey of privateKeys) {
      const wallet = new ethers.Wallet(privateKey)
      const executorKey = `total_liquidated_positions_by_executor:${network}:${wallet.address}`
      if (!(await redis.exists(executorKey))) {
        await redis.set(executorKey, '0')
      }
    }
  }
}

/**
 * Check if an error is a market-specific error (OVLV1:!data)
 * These errors indicate the market is not in a state to process liquidations
 * but may become available later
 */
export async function isMarketError(error: any): Promise<boolean> {
  if (error?.message?.includes('OVLV1:!data')) {
    return true
  }
  if (error?.error?.message?.includes('OVLV1:!data')) {
    return true
  }
  return false
}

/**
 * Remove position from all Redis data structures
 * Used when position is no longer liquidatable or successfully liquidated
 */
export async function removePositionFromRedis(position: Position) {
  const { positionId, marketAddress, network } = position
  await redis.hdel(`positions:${network}:${marketAddress}`, positionId)
  await redis.zrem(`position_index:${network}:${marketAddress}`, positionId)
}

/**
 * Check if a position is still liquidatable by querying the market state contract
 * This prevents us from retrying positions that are no longer valid
 */
export async function checkIfPositionStillLiquidatable(position: Position): Promise<boolean> {
  try {
    const { marketAddress, network, positionId, owner } = position
    
    const provider = new ethers.providers.JsonRpcProvider(networksConfig[network].rpc_url)
    
    // Use the same market state contract that liquidation-checker uses
    const ovlMarketStateContract = new ethers.Contract(
      '0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238', // ovl_state_address from config
      [
        'function liquidatable(address market, address owner, uint256 positionId) view returns (bool)'
      ],
      provider
    )
    
    // Check if position is still liquidatable
    const isLiquidatable = await ovlMarketStateContract.liquidatable(marketAddress, owner, parseInt(positionId))
    
    log(chalk.blue(`Position ${positionId} liquidatability check: ${isLiquidatable}`))
    return isLiquidatable
    
  } catch (error) {
    // If we can't check liquidatability, assume it's not liquidatable to be safe
    log(chalk.red(`Failed to check liquidatability for position ${position.positionId}:`, error))
    return false
  }
}

async function sendTelegramMessage(message: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    log(chalk.bold.red('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be provided'))
    return
  }

  try {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' })
    log(chalk.green('Error report sent to Telegram'))
  } catch (error) {
    log(chalk.red('Failed to send Telegram message:', error))
  }
}

async function reportLiquidationError(position: Position, retries: number, errorType: string) {
  const message = `❌ *Liquidation Failed* ❌\n\n` +
    `*Position ID:* \`${position.positionId}\`\n` +
    `*Owner:* \`${position.owner}\`\n` +
    `*Market:* \`${position.marketAddress}\`\n` +
    `*Network:* ${position.network}\n` +
    `*Retries:* ${retries}/${MAX_RETRIES}\n` +
    `*Error Type:* ${errorType}\n\n` +
    `Check logs for detailed error information.`

  await sendTelegramMessage(message)
}

export async function liquidatePosition(position: Position) {
  const { positionId, owner, marketAddress, network } = position

  try {
    const privateKeys = process.env.PRIVATE_KEYS?.split(',') ?? []

    const provider = new ethers.providers.JsonRpcProvider(networksConfig[network].rpc_url)
    const marketContract = new ethers.Contract(marketAddress, networksConfig[network].useOldMarketAbi ? market_old_abi : market_abi, provider)

    for (const privateKey of privateKeys) {
      const wallet = new ethers.Wallet(privateKey, provider)

      const [nonce, pendingNonce] = await Promise.all([
        provider.getTransactionCount(wallet.address, 'latest'),
        provider.getTransactionCount(wallet.address, 'pending'),
      ])

      if (nonce !== pendingNonce) {
        log(chalk.red(`Nonce conflict for wallet ${wallet.address}, trying next...`))
        continue
      }

      log(
        `${chalk.green('Starting liquidation for position =>')} ${chalk.yellow(
          'positionId:'
        )} ${positionId} ${chalk.yellow('owner:')} ${owner} ${chalk.yellow(
          'market:'
        )} ${marketAddress} ${chalk.yellow('network:')} ${network}`
      )

      // attempt to liquidate
      const liquidateTx = await marketContract.connect(wallet).liquidate(owner, positionId)
      const receipt = await liquidateTx.wait()

      if (receipt.status === 1) {
        log(
          `${chalk.bgGreen('Position liquidated successfully! =>')} ${chalk.yellow('network:')} ${network} ${chalk.yellow(
            'positionId:'
          )} ${positionId} ${chalk.yellow('executed by:')} ${wallet.address} ${chalk.yellow(
            'txHash:'
          )} ${receipt.transactionHash}`
        )

        // remove position from Redis
        await removePositionFromRedis(position)

        // track on redis total liquidated positions by executor
        const executorKey = `total_liquidated_positions_by_executor:${network}:${wallet.address}`
        await redis.incr(executorKey)
        // add counter to track total liquidated positions
        await redis.incr(`total_liquidated_positions:${network}:total`)
        // add counter to track total liquidated positions
        await redis.incr(`total_liquidated_positions:${network}:${marketAddress.toLowerCase()}`)
        // add total liquidated positions by executor by session
        await redis.incr(`liquidated_positions_by_executor:${network}:${wallet.address}`)
        // add total liquidated positions by session
        await redis.incr(`liquidated_positions:${network}:total`)
        // add total liquidated positions by session
        await redis.incr(`liquidated_positions:${network}:${marketAddress.toLowerCase()}`)


        return
      } else {
        log(
          `${chalk.bgRed('Transaction failed! =>')} ${chalk.yellow('network:')} ${network} ${chalk.yellow(
            'positionId:'
          )} ${positionId} ${chalk.yellow('executed by:')} ${wallet.address}`
        )
      }

      // if we reach here, the transaction failed, break the loop
      break
    }

    log(chalk.bold.red('No private keys available to liquidate position'))
  } catch (error) {
    log(`${chalk.bgRed('Transaction failed! =>')} ${chalk.yellow('network:')} ${network} ${chalk.yellow('positionId:')} ${positionId}`)
    log(chalk.red(error))
    
    // Check if position is still liquidatable before deciding what to do
    const isStillLiquidatable = await checkIfPositionStillLiquidatable(position)
    
    if (isStillLiquidatable) {
      // Determine wait time based on error type
      const waitMinutes = await isMarketError(error) ? 7 : 3
      const waitTime = Date.now() + (waitMinutes * 60 * 1000)
      
      log(chalk.yellow(`Position ${positionId} failed but still liquidatable, retrying in ${waitMinutes} minutes`))
      
      // Use separate delayed queue to avoid infinite loop
      await redis.zadd('delayed_positions', waitTime, JSON.stringify(position))
      return // Exit without incrementing retry count
    } else {
      // Position is no longer liquidatable - notify and remove immediately
      log(chalk.red(`Position ${positionId} no longer liquidatable, removing from queue`))
      
      // Notify only when position is removed (no spam)
      const errorType = 'Position No Longer Liquidatable'
      await reportLiquidationError(position, 0, errorType)
      await removePositionFromRedis(position)
      return
    }
  }
}

export async function liquidablePositionsListener() {
  if (!process.env.PRIVATE_KEYS) {
    log(chalk.bold.red('At least one private key is required'))
    return
  }

  // Initialize all executor counters
  await initializeCounters()

  log(chalk.bold.blue('Executor started at:', new Date().toLocaleString()))
  log(chalk.blue('Listening for liquidatable positions...'))

  while (true) {
    try {
      // 1. Process delayed positions that are ready to retry (immediate, non-blocking)
      const now = Date.now()
      const readyDelayed = await redis.zrangebyscore('delayed_positions', 0, now, 'LIMIT', 0, 1)
      
      if (readyDelayed.length > 0) {
        const positionData = readyDelayed[0]
        const delayedPosition: Position = JSON.parse(positionData)
        
        // Remove first, then process (atomic operation)
        await redis.zrem('delayed_positions', positionData)
        
        log(chalk.blue(`Retrying delayed position ${delayedPosition.positionId} after backoff period`))
        await liquidatePosition(delayedPosition)
      }
      
      // 2. Check for new liquidatable positions (with 1 second timeout to avoid blocking)
      const result = await redis.brpop('liquidatable_positions', 1)
      if (result) {
        const [key, positionData] = result
        const position: Position = JSON.parse(positionData)

        log(chalk.bold.blue('New liquidatable position found!'))
        log(
          chalk.blue(
            `Processing position: marketAddress: ${position.marketAddress}, positionId: ${position.positionId}, network: ${position.network}`
          )
        )

        await liquidatePosition(position)
      }
      
      // 3. Wait 1 second before next iteration to process both queues independently
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('Error processing position:', error)
      await new Promise((resolve) => setTimeout(resolve, 10000)) // wait 10 seconds before retrying
    }
  }
}