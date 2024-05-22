import { parentPort, workerData } from 'worker_threads'
import { ethers } from 'ethers'
import { multicall2_address, olv_state_address } from './constants'
import market_state_abi from './abis/market_state_abi.json'
import multicall2_abi from './abis/multicall2_abi.json'
import { Redis } from 'ioredis'
import chalk from 'chalk'

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

const redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
})

const checkLiquidations = async (
  positions: Position[],
  marketAddress: string,
  batchSize: number,
  rpcUrl: string
) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const ovlMarketStateContract = new ethers.Contract(olv_state_address, market_state_abi, provider)
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
    )
  }

  const results = await Promise.all(batchPromises)
  const liquidatableResults = results.flat()

  for (const result of liquidatableResults) {
    const { positionId, owner } = result.position

    const isNew = await redis.sadd('unique_positions', `${marketAddress}:${positionId}`)
    // If the position is new, add it to the liquidatable_positions list to avoid duplicates
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
    } else {
      console.log('Position already found in the liquidatable_positions list')
    }
  }

  // return the amount of liquidatable positions
  return liquidatableResults ? liquidatableResults.length : 0
}

checkLiquidations(
  workerData.positions,
  workerData.marketAddress,
  workerData.batchSize,
  workerData.rpcUrl
)
  .then((results) => {
    if (parentPort) parentPort.postMessage(results)
  })
  .catch((error) => {
    if (parentPort) parentPort.postMessage({ error: error.message })
  })
