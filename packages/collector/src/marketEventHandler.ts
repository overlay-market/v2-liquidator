import { EventType, Networks, PositionStatus, networksConfig } from './constants'
import market_abi from './abis/market_abi.json'
import market_old_abi from './abis/market_old_abi.json'
import { ethers } from 'ethers'
import chalk from 'chalk'
import { startAnvil, stopAnvil } from './anvilForkHandler'
import redis from './redisHandler'
import { ChainableCommander } from 'ioredis'

const log = console.log

// Process events for a given market. Count new, updated, and removed positions
async function processEvents(network: Networks, marketName: string, events: ethers.Event[]) {
  let newPositions = 0
  let updatedPositions = 0
  let removedPositions = 0
  let errorPositions = 0
  let otherEvents = 0
  // create a pipeline to execute multiple commands in a single step
  const pipeline = redis.pipeline()

  for (const event of events) {
    const status = await processEvent(
      pipeline,
      network,
      networksConfig[network].markets[marketName].address,
      event
    )
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
      case PositionStatus.OtherEvent:
        otherEvents++
        break
      case PositionStatus.Error:
        errorPositions++
        break
    }
  }

  // execute all operations in the pipeline
  await pipeline.exec()
  events.length = 0 // clear the events array
  log(`Events processed for market: ${chalk.bold.blue(`${network} - ${marketName}`)}
  ${chalk.bold(`Total events:`)}      ${chalk.bold(events.length)}
  ${chalk.bold(`New positions:`)}     ${chalk.green(newPositions)}
  ${chalk.bold(`Updated positions:`)} ${chalk.yellow(updatedPositions)}
  ${chalk.bold(`Removed positions:`)} ${chalk.red(removedPositions)}
  ${chalk.bold(`Other events:`)}      ${chalk.blue(otherEvents)}
  ${chalk.bold(`Error positions:`)}   ${chalk.red(errorPositions)}`)
}

// Process a single event and update the Redis cache
async function processEvent(
  pipeline: ChainableCommander,
  network: Networks,
  marketAddress: string,
  event: ethers.Event
) {
  const eventName = event.event

  if (
    eventName !== EventType.Build &&
    eventName !== EventType.Unwind &&
    eventName !== EventType.Liquidate
  ) {
    return PositionStatus.OtherEvent
  }

  // validate necessary arguments
  if (!event.args || !event.args[0] || !event.args[1] || !event.args[2]) {
    log(chalk.bold.red('Cannot process event:', JSON.stringify(event)))
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
      pipeline.hset(`positions:${network}:${marketAddress}`, positionId, owner)
      pipeline.zadd(`position_index:${network}:${marketAddress}`, positionId, positionId)
      status = PositionStatus.New
      break

    case EventType.Unwind:
      // event.args[0] = sender
      // event.args[1] = positionId
      // event.args[2] = fraction
      positionId = ethers.BigNumber.from(event.args[1]).toString()
      const fraction = ethers.BigNumber.from(event.args[2]).toString()
      if (fraction === '1000000000000000000') {
        pipeline.hdel(`positions:${network}:${marketAddress}`, positionId)
        pipeline.zrem(`position_index:${network}:${marketAddress}`, positionId)
        status = PositionStatus.Removed
      } else {
        status = PositionStatus.Updated
      }
      break

    case EventType.Liquidate:
      // event.args[0] = sender
      // event.args[1] = owner
      // event.args[2] = positionId
      positionId = ethers.BigNumber.from(event.args[2]).toString()
      pipeline.hdel(`positions:${network}:${marketAddress}`, positionId)
      pipeline.zrem(`position_index:${network}:${marketAddress}`, positionId)
      status = PositionStatus.Removed
      break

    default:
      log(chalk.bold.red(`Unhandled event type: ${eventName}`))
      status = PositionStatus.Error
      break
  }

  return status
}

// Fetch events for a given market
async function fetchEvents(network: Networks, marketName: string, rpcUrl: string) {
  const marketAddress = networksConfig[network].markets[marketName].address
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const ovlMarketContract = new ethers.Contract(marketAddress, networksConfig[network].useOldMarketAbi ? market_old_abi : market_abi, provider)

  // get the latest block processed for the market
  let startBlock = await redis.get(`latest_block_processed:${network}:${marketAddress}`) 
  // get the latest block from the RPC provider
  const latestBlock = await provider.getBlockNumber()
  // current block step to fetch events
  const blockStep = networksConfig[network].blockStep

  let events: ethers.Event[] = []

  // if the start block is not found in Redis, get events from the block where the market was deployed to the latest block
  // or if the difference between the latest block and the start block is greater than the block step
  if (startBlock === null || latestBlock - parseInt(startBlock) > blockStep) {
    startBlock = startBlock || networksConfig[network].markets[marketName].init_block

    log(
      `Getting events from block: ${chalk.green(startBlock)} to block: ${chalk.green(
        latestBlock
      )} for market: ${chalk.bold.blue(`${network} - ${marketName}`)}`
    )

    // create an array to hold promises for each block range
    let promises = []
    let batchInitBlock = parseInt(startBlock)
    
    for (let block = parseInt(startBlock); block < latestBlock; block += blockStep + 1) {
      const fromBlock = block
      const toBlock = Math.min(block + blockStep, latestBlock)
      promises.push(ovlMarketContract.queryFilter('*', fromBlock, toBlock))

      if (promises.length === 50 || toBlock === latestBlock) {
        // execute 100 promises in parallel
        log(
          `Fetching events for market: ${chalk.bold.blue(
            `${network} - ${marketName}`
          )} from block: ${batchInitBlock} to block: ${toBlock}`
        )
        const eventsArrays = await Promise.all(promises)
        events = events.concat(eventsArrays.flat()) // Flatten the array of arrays into a single array of events

        await processEvents(network, marketName, events)
        events = []
        promises = []
        batchInitBlock = toBlock + 1
      }
    }
  } else {
    // if the start block is found in Redis, get events from the last processed block to the latest block
    log(
      `Getting events from block: ${chalk.green(startBlock)} to block: ${chalk.green(
        latestBlock
      )} for market: ${chalk.bold.blue(`${network} - ${marketName}`)}`
    )
    events = await ovlMarketContract.queryFilter('*', parseInt(startBlock), latestBlock)
    await processEvents(network, marketName, events)
  }

  // update the latest block processed for the market
  await redis.set(`latest_block_processed:${network}:${marketAddress}`, latestBlock)
}

export async function fetchAndProcessEventsForAllMarkets(network: Networks) {
  const networkConfig = networksConfig[network]

  if (!networkConfig.enabled) {
    log(chalk.bold.red(`Network ${network} is not enabled. Skipping...`))
    return
  }

  log(chalk.bold.blue('Collector module is running for network:', network))
  log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))

  // due to the rate limits of the RPC provider, at the first run, we will fetch events for all markets running market by market
  // after the first run, we will fetch events for all markets in parallel
  const firstRun = await redis.get(`${network}:first_collector_run`)

  if (!firstRun && networkConfig.useFork) {
    startAnvil(networkConfig.fork_rpc_url)

    for (const [marketName] of Object.entries(networkConfig.markets)) {
      await fetchEvents(network, marketName, 'http://localhost:8545')
    }

    await redis.set(`${network}:first_collector_run`, 'true')

    stopAnvil()
  } else {
    for (const [marketName] of Object.entries(networkConfig.markets)) {
      await fetchEvents(network, marketName, networkConfig.rpc_url)
    }
  }

  log(chalk.bgGreen('All markets processed successfully for network:', network))
}
