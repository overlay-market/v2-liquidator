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
async function processEvents(network: Networks, events: ethers.Event[]) {
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
      event.address,
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
  log(`Events processed for network: ${chalk.bold.blue(network)}
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
      pipeline.hset(`positions:${network}:${marketAddress.toLowerCase()}`, positionId, owner)
      pipeline.zadd(`position_index:${network}:${marketAddress.toLowerCase()}`, positionId, positionId)
      status = PositionStatus.New
      break

    case EventType.Unwind:
      // event.args[0] = sender
      // event.args[1] = positionId
      // event.args[2] = fraction
      positionId = ethers.BigNumber.from(event.args[1]).toString()
      const fraction = ethers.BigNumber.from(event.args[2]).toString()
      if (fraction === '1000000000000000000') {
        pipeline.hdel(`positions:${network}:${marketAddress.toLowerCase()}`, positionId)
        pipeline.zrem(`position_index:${network}:${marketAddress.toLowerCase()}`, positionId)
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
      pipeline.hdel(`positions:${network}:${marketAddress.toLowerCase()}`, positionId)
      pipeline.zrem(`position_index:${network}:${marketAddress.toLowerCase()}`, positionId)
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
// Fetch events for all enabled markets in a network
async function fetchEvents(network: Networks, rpcUrl: string, useFork = false) {
  const networkConfig = networksConfig[network]
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const latestBlock = await provider.getBlockNumber()

  log(chalk.blue(`Latest block from RPC for network ${network} is ${latestBlock}`))

  const marketAddresses: string[] = []
  const marketMap: Record<string, { name: string; initBlock: number; lastProcessedBlock?: number }> = {}

  // 1. Gather all market data
  for (const [name, market] of Object.entries(networkConfig.markets)) {
    const address = market.address
    const lastBlock = await redis.get(`latest_block_processed:${network}:${address.toLowerCase()}`)

    marketMap[address] = {
      name,
      initBlock: parseInt(market.init_block),
      lastProcessedBlock: lastBlock ? parseInt(lastBlock) : undefined
    }
    marketAddresses.push(address)
  }

  // 2. Determine milestones (sorted unique start blocks)
  const milestonesSet = new Set<number>()
  for (const m of Object.values(marketMap)) {
    const start = m.lastProcessedBlock ? m.lastProcessedBlock + 1 : m.initBlock
    milestonesSet.add(start)
  }
  milestonesSet.add(latestBlock + 1)
  const milestones = Array.from(milestonesSet).sort((a, b) => a - b)

  const blockStep = networkConfig.blockStep - 1
  const marketInterface = new ethers.utils.Interface(networkConfig.useOldMarketAbi ? market_old_abi : market_abi)

  // 3. Process intervals between milestones
  for (let i = 0; i < milestones.length - 1; i++) {
    const intervalFrom = milestones[i]
    if (intervalFrom > latestBlock) break
    const intervalTo = milestones[i + 1] - 1

    // Markets that need to be queried in this interval (those whose progress is behind or at intervalFrom)
    const currentAddresses = marketAddresses.filter(addr => {
      const m = marketMap[addr]
      const start = m.lastProcessedBlock ? m.lastProcessedBlock + 1 : m.initBlock
      return start <= intervalFrom
    })

    if (currentAddresses.length === 0) continue

    log(`Processing interval: ${chalk.green(intervalFrom)} to ${chalk.green(intervalTo)} for ${chalk.bold.blue(currentAddresses.length)} markets`)

    for (let block = intervalFrom; block <= intervalTo; block += blockStep + 1) {
      const fromBlock = block
      const toBlock = Math.min(block + blockStep, intervalTo)

      try {
        log(chalk.gray(`  Fetching range: ${fromBlock} to ${toBlock}`))
        // Ethers v5 getLogs doesn't support array for 'address' field in its Filter type/validation.
        // We use provider.send to bypass this and call eth_getLogs directly.
        const rawLogs = await provider.send('eth_getLogs', [{
          address: currentAddresses,
          fromBlock: ethers.utils.hexStripZeros(ethers.utils.hexlify(fromBlock)),
          toBlock: ethers.utils.hexStripZeros(ethers.utils.hexlify(toBlock)),
        }])

        const logs: ethers.providers.Log[] = rawLogs.map((l: any) => (provider.formatter as any).filterLog(l))

        const events: ethers.Event[] = logs.map((log: ethers.providers.Log) => {
          try {
            const parsed = marketInterface.parseLog(log)
            return {
              ...log,
              event: parsed.name,
              args: parsed.args,
            } as unknown as ethers.Event
          } catch (e) {
            return null as unknown as ethers.Event
          }
        }).filter((e: ethers.Event | null) => e !== null)

        if (events.length > 0) {
          await processEvents(network, events)
        }

        const pipeline = redis.pipeline()
        for (const addr of currentAddresses) {
          const key = `latest_block_processed:${network}:${addr.toLowerCase()}`
          pipeline.set(key, toBlock.toString())
        }
        await pipeline.exec()

      } catch (error) {
        log(chalk.bold.red(`Error processing range ${fromBlock}-${toBlock} on network ${network}: ${error}`))
        // Abort the entire network processing to avoid skipping events or advancing block height incorrectly
        return
      }
    }
  }
}

export async function fetchAndProcessEventsForAllMarkets(network: Networks) {
  const networkConfig = networksConfig[network]

  if (!networkConfig.enabled) {
    log(chalk.bold.red(`Network ${network} is not enabled. Skipping...`))
    return
  }

  log(chalk.bold.blue('Collector module is running for network:', network))
  log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))

  try {
    if (networkConfig.useFork) {
      console.log('Starting Anvil fork for network', network, 'using RPC URL', networkConfig.fork_rpc_url)
      startAnvil(networkConfig.fork_rpc_url)
      await fetchEvents(network, 'http://localhost:8545', true)
      stopAnvil()
    } else {
      await fetchEvents(network, networkConfig.rpc_url)
    }
  } catch (error) {
    log(chalk.bold.red(`Critical error in collector for network ${network}: ${error}`))
    if (networkConfig.useFork) stopAnvil()
  }

  await redis.set(`${network}:first_collector_run`, 'true')
  log(chalk.bgGreen('All markets processed successfully for network:', network))
}

export const __test = {
  fetchEvents,
  processEvents,
  processEvent
}
