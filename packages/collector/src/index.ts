import cron from 'node-cron'
import { EventType, PositionStatus, markets, markets_block } from './constants'
import market_abi from './abis/market_abi.json'
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import Redis from 'ioredis'
import chalk from 'chalk'

dotenv.config()

const redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
})

const log = console.log

let taskRunning = false

// Process events for a given market. Count new, updated, and removed positions
async function processEvents(marketName: string, events: ethers.Event[]) {
  let newPositions = 0
  let updatedPositions = 0
  let removedPositions = 0
  let errorPositions = 0

  for (const event of events) {
    const status = await processEvent(markets[marketName], event)
    switch (status) {
      case PositionStatus.New:
        newPositions++
        break
      case PositionStatus.Updated:
        updatedPositions++
        break
      case PositionStatus.Removed:
        removedPositions++
        break
      case PositionStatus.Error:
        errorPositions++
        break
    }
  }

  log(`Events processed for market: ${chalk.bold.blue(marketName)}
  ${chalk.bold(`Total events:`)}      ${chalk.bold(events.length)}
  ${chalk.bold(`New positions:`)}     ${chalk.green(newPositions)}
  ${chalk.bold(`Updated positions:`)} ${chalk.yellow(updatedPositions)}
  ${chalk.bold(`Removed positions:`)} ${chalk.red(removedPositions)}
  ${chalk.bold(`Error positions:`)}   ${chalk.red(errorPositions)}`)
}

// Process a single event and update the Redis cache
async function processEvent(marketAddress: string, event: ethers.Event) {
  const eventName = event.event

  // validate necessary arguments
  if (!event.args || !event.args[0] || !event.args[1] || !event.args[2]) {
    log(chalk.bold.red('Cannot process event:', event))
    return PositionStatus.Error
  }

  let positionId = ''
  let status: PositionStatus

  switch (eventName) {
    case EventType.Build:
      // event.args[0] = sender
      // event.args[1] = positionId
      positionId = ethers.BigNumber.from(event.args[1]).toString()
      const owner = event.args[0]
      await redis.hset(`positions:${marketAddress}`, positionId, owner);
      await redis.zadd(`position_index:${marketAddress}`, positionId, positionId);
      status = PositionStatus.New
      break

    case EventType.Unwind:
      // event.args[0] = sender
      // event.args[1] = positionId
      // event.args[2] = fraction
      positionId = ethers.BigNumber.from(event.args[1]).toString()
      // if the position is fully unwound, remove it from the cache
      if (event.args[2] === '1000000000000000000') {
        await redis.hdel(`positions:${marketAddress}`, positionId)
        await redis.zrem(`position_index:${marketAddress}`, positionId);
        status = PositionStatus.Removed
      } else {
        status = PositionStatus.Updated;
      }
      break

    case EventType.Liquidate:
      // event.args[0] = sender
      // event.args[1] = owner
      // event.args[2] = positionId
      positionId = ethers.BigNumber.from(event.args[2]).toString()
      await redis.hdel(`positions:${marketAddress}`, positionId)
      await redis.zrem(`position_index:${marketAddress}`, positionId);
      status = PositionStatus.Removed
      break

    default:
      log(chalk.bold.red(`Unhandled event type: ${eventName}`))
      status = PositionStatus.Error
      break
  }

  await redis.set(`LatestBlockProcessed:${marketAddress}`, (event.blockNumber + 1).toString())
  return status
}

// Fetch events for a given market
async function fetchEvents(marketName: string) {
  const marketAddress = markets[marketName]
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URLS?.split(',')[0])
  const ovlMarketContract = new ethers.Contract(marketAddress, market_abi, provider)

  // get the latest block processed for the market
  let startBlock = await redis.get(`LatestBlockProcessed:${marketAddress}`)
  // get the latest block from the RPC provider
  const latestBlock = await provider.getBlockNumber()
  // current block step to fetch events
  const blockStep = 45000 // adjust as per your RPC limitations

  let allEvents: ethers.Event[] = []

  // if the start block is not found in Redis, get events from the block where the market was deployed to the latest block
  // or if the difference between the latest block and the start block is greater than the block step
  if (!startBlock || latestBlock - parseInt(startBlock) > blockStep) {
    startBlock = startBlock || markets_block[marketName]

    log(
      `Getting events from block: ${chalk.green(startBlock)} to block: ${chalk.green(latestBlock)} for market: ${chalk.bold.blue(marketName)}`
    )

    // create an array to hold promises for each block range
    const promises = []
    for (let block = parseInt(startBlock); block < latestBlock; block += blockStep + 1) {
      const fromBlock = block
      const toBlock = Math.min(block + blockStep, latestBlock)
      promises.push(ovlMarketContract.queryFilter('*', fromBlock, toBlock))
    }

    // execute all promises in parallel
    const eventsArrays = await Promise.all(promises)
    allEvents = eventsArrays.flat() // Flatten the array of arrays into a single array of events
  } else {
    // if the start block is found in Redis, get events from the last processed block to the latest block
    log(
      `Getting events from block: ${chalk.green(startBlock)} to block: ${chalk.green(latestBlock)} for market: ${chalk.bold.blue(marketName)}`
    )
    allEvents = await ovlMarketContract.queryFilter('*', parseInt(startBlock), latestBlock)
  }

  return allEvents
}

async function fetchAndProcessEventsForAllMarkets() {
  if (!process.env.RPC_URLS) {
    log(chalk.bold.red('At least one RPC_URLS must be provided'))
    return
  }

  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  taskRunning = true
  log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))
  log('Collector module is running...')

  try {
    // due to the rate limits of the RPC provider, at the first run, we will fetch events for all markets running market by market
    // after the first run, we will fetch events for all markets in parallel
    const firstRun = !(await redis.get('FirstRun'))

    if (firstRun) {
      for (const [marketName, address] of Object.entries(markets)) {
        const events = await fetchEvents(marketName)
        await processEvents(marketName, events)
      }

      await redis.set('FirstRun', 'false')
    } else {
      const promises: Promise<unknown>[] = []

      Object.entries(markets).forEach(([marketName, address]) => {
        promises.push(
          fetchEvents(marketName).then(async (events) => {
            await processEvents(marketName, events)
          })
        )
      })

      await Promise.all(promises)
    }

    log(chalk.bgGreen('All markets processed successfully!'))
  } catch (error) {
    console.error('Error during the cron job:', error)
  } finally {
    taskRunning = false
  }
}

// Schedule the cron job to run every 2 minutes
cron.schedule('*/2 * * * *', fetchAndProcessEventsForAllMarkets)

// run fetchAndProcessEventsForAllMarkets() once to fetch events for all markets
// fetchAndProcessEventsForAllMarkets()
