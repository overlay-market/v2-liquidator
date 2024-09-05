import dotenv from 'dotenv'
import chalk from 'chalk'
import redis from './redisHandler'
import { config, MarketConfig, networkConfig } from './config'
import { LiquidatableResult, MulticallResult, Networks, Position } from './constants'
import { selectRpc } from './rpcHandler'
import { ethers } from 'ethers'
import market_state_abi from './abis/market_state_abi.json'
import multicall2_abi from './abis/multicall2_abi.json'

dotenv.config()

const log = console.log

export class LiquidatorCheckerHandler {
  constructor() {
    if (!process.env.MARKET || !config[process.env.MARKET]) {
      log(chalk.bold.red('MARKET must be provided'))
      return
    }
  }

  async checkLiquidations(market: MarketConfig, positions: Partial<Record<Networks, Position[]>>) {
    const batchPromises: Promise<LiquidatableResult[]>[] = []

    for (const network of Object.keys(positions) as Networks[]) {
      const marketNetwork = market.networks[network]
      if (!marketNetwork) {
        continue
      }

      const calls: { target: string; callData: string }[] = []
      const {
        rpcUrls,
        multicall2_address,
        ovl_state_address,
        multicall_batch_size,
        rpc_first_probability,
      } = networkConfig[network]

      const rpcUrl = await selectRpc(rpcUrls, rpc_first_probability)
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      const ovlMarketStateContract = new ethers.Contract(
        ovl_state_address,
        market_state_abi,
        provider
      )
      const multicall2Contract = new ethers.Contract(multicall2_address, multicall2_abi, provider)

      console.log(`Checking liquidations for ${network} network`)
      console.log('batch size:', multicall_batch_size)

      for (const position of positions[network] as Position[]) {
        calls.push({
          target: ovlMarketStateContract.address,
          callData: ovlMarketStateContract.interface.encodeFunctionData('liquidatable', [
            marketNetwork.address,
            position.owner,
            parseInt(position.positionId),
          ]),
        })
      }

      const batchSize = multicall_batch_size

      for (let i = 0; i < calls.length; i += batchSize) {
        batchPromises.push(
          multicall2Contract
            .aggregate(calls.slice(i, i + batchSize))
            .then((result: MulticallResult) => {
              return result.returnData
                .map((data, index) => {
                  const isLiquidatable = ovlMarketStateContract.interface.decodeFunctionResult(
                    'liquidatable',
                    data
                  )[0]
                  return {
                    position: (positions[network] as Position[]).slice(i, i + batchSize)[index],
                    isLiquidatable: isLiquidatable,
                    network,
                  }
                })
                .filter((result: LiquidatableResult) => result.isLiquidatable)
            })
            .catch((error: Error) => {
              console.error(
                chalk.bold.red(
                  `Error processing batch from ${i} to ${
                    i + batchSize
                  } for ${network} network. RpcUrl: ${rpcUrl}`
                )
              )
              return []
            })
        )
      }
    }

    const results = await Promise.allSettled(batchPromises)
    const liquidatableResults = results
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => (result as PromiseFulfilledResult<LiquidatableResult[]>).value)
    results.length = 0

    for (const result of liquidatableResults) {
      const marketNetwork = market.networks[result.network]
      if (!marketNetwork) continue

      const { positionId, owner } = result.position
      const marketAddress = marketNetwork.address

      const isNew = await redis.sadd(
        'unique_positions',
        `${result.network}:${marketAddress}:${positionId}`
      )
      if (isNew) {
        console.log(
          `${chalk.green('Liquidatable position found => ')} ${chalk.yellow(
            'positionId:'
          )} ${positionId} ${chalk.yellow('owner:')} ${owner} ${chalk.yellow(
            'market:'
          )} ${marketAddress} ${chalk.yellow('network:')} ${result.network}`
        )
        await redis.lpush(
          'liquidatable_positions',
          JSON.stringify({
            positionId,
            owner,
            marketAddress,
            network: result.network,
          })
        )

        // add counter for liquidatable positions
        await redis.incr(`liquidatable_positions_found:${result.network}:total`)
        await redis.incr(`liquidatable_positions_found:${result.network}:${marketAddress.toLowerCase()}`)
      } else {
        console.log('Position already found in the liquidatable_positions list')
      }
    }

    // return the amount of liquidatable positions
    return liquidatableResults.length
  }

  // fetch positions from redis
  async fetchPositionsByNetwork(
    marketAddress: string,
    network: Networks,
    currentIndex: number,
    endIndex: number
  ): Promise<Position[]> {
    const pipeline = redis.pipeline()

    pipeline.zrange(`position_index:${network}:${marketAddress}`, currentIndex, endIndex)
    const results = await pipeline.exec()
    if (!results || results.length === 0 || results[0][1] === null) {
      return []
    }
    const positionIds = results[0][1] as string[]
    if (positionIds.length === 0) {
      return []
    }

    const ownerPipeline = redis.pipeline()
    ownerPipeline.hmget(`positions:${network}:${marketAddress}`, ...positionIds)
    const ownerResults = await ownerPipeline.exec()
    if (!ownerResults || ownerResults.length === 0 || ownerResults[0][1] === null) {
      return []
    }

    const owners = ownerResults[0][1] as string[]
    const positions: Position[] = positionIds.map((id, index) => ({
      positionId: id,
      owner: owners[index],
      network,
    }))

    positionIds.length = 0
    owners.length = 0

    return positions
  }

  async fetchAllPositions(market: MarketConfig): Promise<Partial<Record<Networks, Position[]>>> {
    let allPositions: Partial<Record<Networks, Position[]>> = {}

    for (const network of Object.keys(market.networks) as Networks[]) {
      const marketNetwork = market.networks[network]
      if (!marketNetwork) continue

      const marketAddress = marketNetwork.address
      const positionsPerRun = marketNetwork.positions_per_run
      const totalPositions = await redis.zcard(`position_index:${network}:${marketAddress}`)
      console.log('Total positions:', totalPositions)
      console.log('Network:', network)

      const currentIndexKey = `current-index:${network}:${marketAddress}`
      let currentIndexValue = await redis.get(currentIndexKey)
      let currentIndex = currentIndexValue ? parseInt(currentIndexValue) : 0

      let endIndex = currentIndex + positionsPerRun

      let positions: Position[] = []

      if (endIndex >= totalPositions) {
        endIndex = totalPositions - 1
        const positionsLeft = positionsPerRun - (endIndex - currentIndex)

        positions = await this.fetchPositionsByNetwork(
          marketAddress,
          network,
          currentIndex,
          endIndex
        )

        log('Processing positions from', currentIndex, 'to', endIndex, 'for network', network)

        currentIndex = 0
        endIndex = currentIndex + positionsLeft

        positions = positions.concat(
          await this.fetchPositionsByNetwork(marketAddress, network, currentIndex, endIndex)
        )

        log(
          'Processing remaining positions from',
          currentIndex,
          'to',
          endIndex,
          'for network',
          network
        )
      } else {
        positions = await this.fetchPositionsByNetwork(
          marketAddress,
          network,
          currentIndex,
          endIndex
        )
        log('Processing positions from', currentIndex, 'to', endIndex, 'for network', network)
      }

      // update the current index
      currentIndex = endIndex + 1
      await redis.set(currentIndexKey, currentIndex)

      allPositions[network] = positions
    }

    return allPositions
  }

  async run() {
    if (!process.env.MARKET || !config[process.env.MARKET]) {
      log(chalk.bold.red('MARKET must be provided'))
      return
    }

    log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))
    const startTime = Date.now()

    const market = config[process.env.MARKET]

    for (const network of Object.keys(market.networks) as Networks[]) {
      const firstRun = !(await redis.get(`${network}:first_collector_run`))
      if (firstRun) {
        log(chalk.bold.red('Waiting for collector to finish first run'))
        return
      }
    }

    log('Liquidation Checker module is running for market:', process.env.MARKET)

    let positions = await this.fetchAllPositions(market)
    await this.checkLiquidations(market, positions)
    positions = {}

    log(
      chalk.bgGreen(
        'All positions scanned successfully! time taken: ',
        Date.now() - startTime,
        'ms'
      )
    )
  }
}
