import cron from 'node-cron'
import { markets, markets_block } from './constants'
import market_abi from './abis/market_abi.json'
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import Redis from 'ioredis'

dotenv.config()

const redis = new Redis({
  password: process.env.REDIS_PASSWORD,
})

let taskRunning = false

enum EventType {
  Build = 'Build',
  Unwind = 'Unwind',
  Liquidate = 'Liquidate',
}

enum PositionStatus {
  New = 'New',
  Updated = 'Updated',
  Removed = 'Removed',
  Error = 'Error',
}

// Process events for a given market. Count new, updated, and removed positions
async function processEvents(marketName: string, events: ethers.Event[]) {
  let newPositions = 0
  let updatedPositions = 0
  let removedPositions = 0

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
        break
    }
  }

  console.log(`Events processed for market: ${marketName}
  Total events: ${events.length}
  New positions: ${newPositions}
  Updated positions: ${updatedPositions}
  Removed positions: ${removedPositions}`)
}

// Process a single event and update the Redis cache
async function processEvent(marketAddress: string, event: ethers.Event) {
  const eventName = event.event

  // validate necessary arguments
  if (!event.args || !event.args[0] || !event.args[1] || !event.args[2]) {
    console.log('Cannot process event:', event)
    return PositionStatus.Error
  }

  let positionId,
    key = ''

  switch (eventName) {
    case EventType.Build:
      // event.args[0] = sender
      // event.args[1] = positionId
      positionId = ethers.BigNumber.from(event.args[1]).toString()
      key = `${marketAddress}:${positionId}`
      const data = {
        owner: event.args[0],
        positionId,
      }
      await redis.hset(`positions`, key, JSON.stringify(data))
      return PositionStatus.New

    case EventType.Unwind:
      // event.args[0] = sender
      // event.args[1] = positionId
      // event.args[2] = fraction
      positionId = ethers.BigNumber.from(event.args[1]).toString()
      key = `${marketAddress}:${positionId}`
      // if the position is fully unwound, remove it from the cache
      if (event.args[2] === '1000000000000000000') {
        await redis.hdel(`positions`, key)
        return PositionStatus.Removed
      }
      return PositionStatus.Updated

    case EventType.Liquidate:
      // event.args[0] = sender
      // event.args[1] = owner
      // event.args[2] = positionId
      positionId = ethers.BigNumber.from(event.args[2]).toString()
      key = `${marketAddress}:${positionId}`
      await redis.hdel(`positions`, key)
      return PositionStatus.Removed

    default:
      console.log(`Unhandled event type: ${eventName}`)
      return PositionStatus.Error
  }
}

// Fetch events for a given market
async function fetchEvents(marketName: string) {
  const marketAddress = markets[marketName]
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
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

    console.log(
      `Getting events from block: ${startBlock} to block: ${latestBlock} for market: ${marketName}`
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
    console.log('Getting events from block:', startBlock, 'to block:', latestBlock)
    allEvents = await ovlMarketContract.queryFilter('*', parseInt(startBlock), latestBlock)
  }

  console.log(`Events fetched for market ${marketName}:`, allEvents.length)
  await redis.set(`LatestBlockProcessed:${marketAddress}`, (latestBlock + 1).toString())
  // console.log('events:', JSON.stringify(allEvents))

  return allEvents
}

async function fetchAndProcessEventsForAllMarkets() {
  if (!process.env.RPC_URL) {
    console.error('RPC_URL is not defined in the .env file')
    return
  }

  if (taskRunning) {
    console.log('Previous task still running. Skipping...')
    return
  }

  taskRunning = true
  console.log('Cron job started at:', new Date().toLocaleString())
  console.log('Collector module is running...')

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

    console.log('All markets processed successfully')
  } catch (error) {
    console.error('Error during the cron job:', error)
  } finally {
    taskRunning = false
  }
}

// Schedule the cron job to run every 5 minutes
//cron.schedule('* * * * *', fetchAndProcessEventsForAllMarkets)

// run fetchAndProcessEventsForAllMarkets() once to fetch events for all markets
fetchAndProcessEventsForAllMarkets()
