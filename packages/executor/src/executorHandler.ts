import market_abi from './abis/market_abi.json'
import dotenv from 'dotenv'
import chalk from 'chalk'
import { ethers } from 'ethers'
import redis from './redisHandler'

dotenv.config()

const log = console.log

interface Position {
  positionId: string
  owner: string
  marketAddress: string
}

const MAX_RETRIES = 3

async function incrementRetryCount(position: Position): Promise<number> {
  const retryKey = `retry:${position.marketAddress}:${position.positionId}`
  const retries = await redis.incr(retryKey)
  return retries
}

async function resetRetryCount(position: Position) {
  const retryKey = `retry:${position.marketAddress}:${position.positionId}`
  await redis.del(retryKey)
}

async function liquidatePosition(position: Position) {
  const { positionId, owner, marketAddress } = position

  try {
    const privateKeys = process.env.PRIVATE_KEYS?.split(',') ?? []

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URLS?.split(',')[0])
    const marketContract = new ethers.Contract(marketAddress, market_abi, provider)

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
        )} ${marketAddress}`
      )

      // attempt to liquidate
      const liquidateTx = await marketContract.connect(wallet).liquidate(owner, positionId)
      const receipt = await liquidateTx.wait()

      if (receipt.status === 1) {
        log(
          `${chalk.bgGreen('Position liquidated successfully! =>')} ${chalk.yellow(
            'positionId:'
          )} ${positionId} ${chalk.yellow('executed by:')} ${wallet.address} ${chalk.yellow(
            'txHash:'
          )} ${receipt.transactionHash}`
        )

        // remove position from Redis
        await redis.hdel(`positions:${marketAddress}`, positionId)
        await redis.zrem(`position_index:${marketAddress}`, positionId)
        await resetRetryCount(position)

        // track on redis total liquidated positions by executor
        await redis.incr(`total_liquidated_positions:${wallet.address}`)
        log(chalk.green(`Total liquidated positions by ${wallet.address}:`), await redis.get(`total_liquidated_positions:${wallet.address}`))

        return
      } else {
        log(
          `${chalk.bgRed('Transaction failed! =>')} ${chalk.yellow(
            'positionId:'
          )} ${positionId} ${chalk.yellow('executed by:')} ${wallet.address}`
        )
      }

      // if we reach here, the transaction failed, break the loop
      break
    }

    log(chalk.bold.red('No private keys available to liquidate position'))
  } catch (error) {
    log(`${chalk.bgRed('Transaction failed! =>')} ${chalk.yellow('positionId:')} ${positionId}`)
    log(chalk.red(error))
  }

  // increment retry count and check if it exceeds the max retries
  const retries = await incrementRetryCount(position);

  if (retries > MAX_RETRIES) {
    log(chalk.bold.red(`Position ${position.positionId} exceeded max retries, removing from queue`));
    await redis.hdel(`positions:${marketAddress}`, position.positionId)
    await redis.zrem(`position_index:${marketAddress}`, position.positionId)
  } else {
    log(chalk.bgBlue(`Re-queuing position ${position.positionId} for retry ${retries} of ${MAX_RETRIES}`))
    await redis.lpush('liquidatable_positions', JSON.stringify(position))
  }
}

export async function liquidablePositionsListener() {
  if (!process.env.RPC_URLS) {
    log(chalk.bold.red('At least one RPC_URLS must be provided'))
    return
  }

  if (!process.env.PRIVATE_KEYS) {
    log(chalk.bold.red('At least one private key is required'))
    return
  }

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
            `Processing position: marketAddress: ${position.marketAddress}, positionId: ${position.positionId}`
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