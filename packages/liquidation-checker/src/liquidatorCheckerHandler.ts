import { markets } from './constants'
import dotenv from 'dotenv'
import chalk from 'chalk'
import { selectRpc } from './rpcHandler'
import redis from './redisHandler'
import { config } from './config'
import { ethers } from 'ethers'
import { multicall2_address, olv_state_address } from './constants'
import market_state_abi from './abis/market_state_abi.json'
import multicall2_abi from './abis/multicall2_abi.json'

dotenv.config()

interface Position {
  positionId: string
  owner: string
}

interface MulticallResult {
  blockNumber: number
  returnData: string[]
}

interface LiquidatableResult {
  position: Position
  isLiquidatable: boolean
}

const log = console.log

export class LiquidatorCheckerHandler {
  private MAX_RETRIES = 3 // maximum number of retries for each worker
  private MULTICALL_BATCH_SIZE!: number
  private POSITIONS_PER_RUN!: number

  constructor() {
    if (!process.env.MARKET || !markets[process.env.MARKET]) {
      log(chalk.bold.red('MARKET must be provided'))
      return
    }

    this.MULTICALL_BATCH_SIZE = config[process.env.MARKET || 'default'].multicall_batch_size
    this.POSITIONS_PER_RUN = config[process.env.MARKET || 'default'].positions_per_run
  }

  async checkLiquidations(
    positions: Position[],
    marketAddress: string,
    batchSize: number,
    rpcUrl: string
  ) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const ovlMarketStateContract = new ethers.Contract(
      olv_state_address,
      market_state_abi,
      provider
    )
    const multicall2Contract = new ethers.Contract(multicall2_address, multicall2_abi, provider)

    const calls = positions.map((position) => ({
      target: ovlMarketStateContract.address,
      callData: ovlMarketStateContract.interface.encodeFunctionData('liquidatable', [
        marketAddress,
        position.owner,
        parseInt(position.positionId),
      ]),
    }))

    const batchPromises: Promise<LiquidatableResult[]>[] = []

    for (let i = 0; i < positions.length; i += batchSize) {
      const batchPositions = positions.slice(i, i + batchSize)

      // Add the multicall batch promise to the array
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
                  position: batchPositions[index],
                  isLiquidatable: isLiquidatable,
                }
              })
              .filter((result: LiquidatableResult) => result.isLiquidatable)
          })
          .catch((error: Error) => {
            console.error(
              chalk.bold.red(`Error processing batch from ${i} to ${i + batchSize}:`),
              error
            )
            return []
          })
      )

      batchPositions.length = 0
    }

    calls.length = 0

    const results = await Promise.allSettled(batchPromises)
    const liquidatableResults = results
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => (result as PromiseFulfilledResult<LiquidatableResult[]>).value)
    results.length = 0

    for (const result of liquidatableResults) {
      const { positionId, owner } = result.position

      const isNew = await redis.sadd('unique_positions', `${marketAddress}:${positionId}`)
      if (isNew) {
        console.log(
          `${chalk.green('Liquidatable position found => ')} ${chalk.yellow(
            'positionId:'
          )} ${positionId} ${chalk.yellow('owner:')} ${owner} ${chalk.yellow(
            'market:'
          )} ${marketAddress}`
        )
        await redis.lpush(
          'liquidatable_positions',
          JSON.stringify({
            positionId,
            owner,
            marketAddress,
          })
        )
        // add counter for liquidatable positions
        await redis.incr(`liquidatable_positions_found`)
        await redis.incr(`liquidatable_positions_found:${marketAddress.toLowerCase()}`)
      } else {
        console.log('Position already found in the liquidatable_positions list')
      }
    }

    // return the amount of liquidatable positions
    return liquidatableResults.length
  }

  // distribute work to a single checkLiquidations call
  async distributeWork(marketAddress: string, positions: Position[]) {
    const rpcUrls = process.env.RPC_URLS?.split(',') ?? []
    if (rpcUrls.length === 0) {
      throw new Error('At least one RPC_URLS must be provided')
    }

    // Seleccionamos el RPC saludable
    const rpcUrl = await selectRpc(rpcUrls)
    if (!rpcUrl) {
      throw new Error('No healthy RPC found')
    }

    // Llamada directa a checkLiquidations sin usar workers
    try {
      const liquidatableCount = await this.checkLiquidations(
        positions,
        marketAddress,
        this.MULTICALL_BATCH_SIZE,
        rpcUrl
      )
      log(chalk.bgBlue(`Found ${liquidatableCount} liquidatable positions.`))
    } catch (error) {
      log(chalk.red('Error in checkLiquidations:', error))
    }
  }

  // fetch positions from redis
  async fetchPositions(
    marketAddress: string,
    currentIndex: number,
    endIndex: number
  ): Promise<Position[]> {
    const pipeline = redis.pipeline()

    pipeline.zrange(`position_index:${marketAddress}`, currentIndex, endIndex)
    const results = await pipeline.exec()
    if (!results || results.length === 0 || results[0][1] === null) {
      return []
    }
    const positionIds = results[0][1] as string[]
    if (positionIds.length === 0) {
      return []
    }

    const ownerPipeline = redis.pipeline()
    ownerPipeline.hmget(`positions:${marketAddress}`, ...positionIds)
    const ownerResults = await ownerPipeline.exec()
    if (!ownerResults || ownerResults.length === 0 || ownerResults[0][1] === null) {
      return []
    }

    const owners = ownerResults[0][1] as string[]
    const positions: Position[] = positionIds.map((id, index) => ({
      positionId: id,
      owner: owners[index],
    }))

    positionIds.length = 0
    owners.length = 0

    return positions
  }

  async run() {
    if (!process.env.MARKET || !markets[process.env.MARKET]) {
      log(chalk.bold.red('MARKET must be provided'))
      return
    }

    if (!process.env.RPC_URLS) {
      log(chalk.bold.red('At least one RPC_URLS must be provided'))
      return
    }

    log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))
    const startTime = Date.now()

    const marketAddress = markets[process.env.MARKET]
    log(
      'Liquidation Checker module is running for market:',
      process.env.MARKET,
      'with address:',
      marketAddress
    )

    const totalPositions = await redis.zcard(`position_index:${marketAddress}`)

    const currentIndexKey = `current-index:${marketAddress}`
    let currentIndexValue = await redis.get(currentIndexKey)
    let currentIndex = currentIndexValue ? parseInt(currentIndexValue) : 0

    let endIndex = currentIndex + this.POSITIONS_PER_RUN

    let positions: Position[] = []

    if (endIndex >= totalPositions) {
      endIndex = totalPositions - 1
      const positionsLeft = this.POSITIONS_PER_RUN - (endIndex - currentIndex)

      positions = await this.fetchPositions(marketAddress, currentIndex, endIndex)

      log('Processing positions from', currentIndex, 'to', endIndex)

      currentIndex = 0
      endIndex = currentIndex + positionsLeft

      positions = positions.concat(await this.fetchPositions(marketAddress, currentIndex, endIndex))

      log('Processing remaining positions from', currentIndex, 'to', endIndex)
    } else {
      positions = await this.fetchPositions(marketAddress, currentIndex, endIndex)
      log('Processing positions from', currentIndex, 'to', endIndex)
    }

    await this.distributeWork(marketAddress, positions)
    positions.length = 0

    // update the current index
    currentIndex = endIndex + 1
    await redis.set(currentIndexKey, currentIndex)

    log(
      chalk.bgGreen(
        'All positions scanned successfully! time taken: ',
        Date.now() - startTime,
        'ms'
      )
    )
  }
}
