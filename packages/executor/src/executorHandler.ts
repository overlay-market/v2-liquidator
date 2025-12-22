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
const BASE_RETRY_BACKOFF_MS = 5000
const MAX_RETRY_BACKOFF_MS = 60000

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

async function incrementRetryCount(position: Position): Promise<number> {
  const retryKey = `retry:${position.network}:${position.marketAddress}:${position.positionId}`
  const retries = await redis.incr(retryKey)
  return retries
}

async function resetRetryCount(position: Position) {
  const retryKey = `retry:${position.network}:${position.marketAddress}:${position.positionId}`
  await redis.del(retryKey)
}

function getRetryBackoffMs(retries: number) {
  return Math.min(MAX_RETRY_BACKOFF_MS, BASE_RETRY_BACKOFF_MS * retries)
}

function scheduleRetry(position: Position, retries: number) {
  const backoffMs = getRetryBackoffMs(retries)
  log(chalk.bgBlue(`Re-queuing position ${position.positionId} for retry ${retries} in ${backoffMs / 1000}s`))

  return setTimeout(() => {
    redis
      .lpush('liquidatable_positions', JSON.stringify(position))
      .catch((error) => log(chalk.red(`Failed to re-queue position ${position.positionId}:`, error)))
  }, backoffMs)
}

async function isPositionStillLiquidatable(position: Position): Promise<boolean> {
  try {
    const provider = new ethers.providers.JsonRpcProvider(networksConfig[position.network].rpc_url)
    const marketContract = new ethers.Contract(
      position.marketAddress,
      networksConfig[position.network].useOldMarketAbi ? market_old_abi : market_abi,
      provider
    )

    const [firstKey] = process.env.PRIVATE_KEYS?.split(',') ?? []
    const signerOrProvider = firstKey ? new ethers.Wallet(firstKey, provider) : provider

    await marketContract.connect(signerOrProvider).callStatic.liquidate(position.owner, position.positionId)
    return true
  } catch (error) {
    const code = (error as any)?.code
    // treat call reverts as no longer liquidatable; keep retrying if verification failed for other reasons
    if (code === 'CALL_EXCEPTION' || (error as any)?.reason || (error as any)?.error?.reason) {
      log(chalk.blue(`Position ${position.positionId} not liquidatable anymore (callStatic reverted)`))
      return false
    }

    log(
      chalk.yellow(
        `Could not verify liquidation status for position ${position.positionId}, will keep retrying. Error: ${error}`
      )
    )
    return true
  }
}

let liquidatableCheck = isPositionStillLiquidatable

function setLiquidatableCheck(fn: (position: Position) => Promise<boolean>) {
  liquidatableCheck = fn
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
    `*Retries:* ${retries} (window size ${MAX_RETRIES})\n` +
    `*Error Type:* ${errorType}\n\n` +
    `Check logs for detailed error information.`

  await sendTelegramMessage(message)
}

let reportErrorFn = reportLiquidationError

function setReportLiquidationError(fn: typeof reportLiquidationError) {
  reportErrorFn = fn
}

async function liquidatePosition(position: Position) {
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
        await redis.hdel(`positions:${network}:${marketAddress}`, positionId)
        await redis.zrem(`position_index:${network}:${marketAddress}`, positionId)
        await resetRetryCount(position)

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
    
    // Store error type in local variable for final reporting
    let errorType = 'Transaction Failed'
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        errorType = 'Insufficient Funds'
      } else if (error.message.includes('nonce')) {
        errorType = 'Nonce Error'
      } else if (error.message.includes('revert')) {
        errorType = 'Transaction Reverted'
      } else if (error.message.includes('gas')) {
        errorType = 'Gas Error'
      }
    }
    
    // Store in a simple variable for the final report
    position.lastErrorType = errorType
  }

  await handleFailedAttempt(position)
}

async function handleFailedAttempt(position: Position) {
  const { network, marketAddress } = position

  const retries = await incrementRetryCount(position)
  const completedRetryWindow = retries % MAX_RETRIES === 0
  const uniquePositionKey = `${network}:${marketAddress}:${position.positionId}`

  if (completedRetryWindow) {
    const stillLiquidatable = await liquidatableCheck(position)

    if (!stillLiquidatable) {
      log(chalk.green(`Position ${position.positionId} is no longer liquidatable, returning to open positions`))
      await resetRetryCount(position)
      await redis.srem('unique_positions', uniquePositionKey)
      return
    }

    const errorType = position.lastErrorType || 'Still liquidatable after failed attempts'
    await reportErrorFn(position, retries, errorType)
  }

  scheduleRetry(position, retries)
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
      const result = await redis.brpop('liquidatable_positions', 0)
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
    } catch (error) {
      console.error('Error processing position:', error)
      await new Promise((resolve) => setTimeout(resolve, 10000)) // wait 10 seconds before retrying
    }
  }
}

// Exports for tests
export const __test = {
  MAX_RETRIES,
  getRetryBackoffMs,
  scheduleRetry,
  isPositionStillLiquidatable,
  handleFailedAttempt,
  resetRetryCount,
  reportLiquidationError,
  setLiquidatableCheck,
  setReportLiquidationError,
}
