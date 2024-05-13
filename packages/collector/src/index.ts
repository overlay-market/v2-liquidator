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

async function fetchAllEvents() {
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

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
  const ovlMarketContract = new ethers.Contract(markets['ETH Dominance'], market_abi, provider)

  try {
    let startBlock = await redis.get('LatestBlockProcessed')
    const latestBlock = await provider.getBlockNumber()
    const blockStep = 45000 // current rpc supports 45000 blocks per request

    let allEvents: ethers.Event[] = []

    // if the start block is not found in Redis, get events from the block where the market was deployed to the latest block
    // or if the difference between the latest block and the start block is greater than the block step
    if (!startBlock || latestBlock - parseInt(startBlock) > blockStep) {
      if (!startBlock) {
        startBlock = markets_block['ETH Dominance'].toString()
      }

      console.log('Getting events from block:', startBlock, 'to block:', latestBlock)

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

    console.log('Total events fetched:', allEvents.length)
    // console.log(JSON.stringify(allEvents))

    await redis.set('LatestBlockProcessed', latestBlock)
  } catch (error) {
    console.error('Error during the cron job:', error)
  } finally {
    taskRunning = false
  }
}

// Schedule the cron job to run every minute
cron.schedule('* * * * *', fetchAllEvents)
