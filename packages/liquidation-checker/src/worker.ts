import { parentPort, workerData } from 'worker_threads'
import { ethers } from 'ethers'
import { olv_state_address } from './constants'
import { multicall_liquidatable } from './constants'
import multicall_liquidatable_abi from './abis/multicall_liquidatable_abi.json'
import chalk from 'chalk'
import redis from './redisHandler'

interface Position {
  positionId: string
  owner: string
}

interface LiquidatableResult {
  position: Position
  isLiquidatable: boolean
}

const checkLiquidations = async (
  positions: Position[],
  marketAddress: string,
  batchSize: number,
  rpcUrl: string
) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const multicallLiquidatableContract = new ethers.Contract(
    multicall_liquidatable,
    multicall_liquidatable_abi,
    provider
  )

  const batchPromises: Promise<LiquidatableResult[]>[] = []

  for (let i = 0; i < positions.length; i += batchSize) {
    const batchPositions = positions.slice(i, i + batchSize)

    const calls = batchPositions.map((position) => ({
      market: marketAddress,
      owner: position.owner,
      id: parseInt(position.positionId),
    }))

    // Add the multicall batch promise to the array
    batchPromises.push(
      multicallLiquidatableContract
        .multiCallLiquidatable(olv_state_address, calls)
        .then((result: boolean[]) => {
          return result
            .map((isLiquidatable, index) => ({
              position: batchPositions[index],
              isLiquidatable,
            }))
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
  }

  const results = await Promise.allSettled(batchPromises)
  const liquidatableResults = results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => (result as PromiseFulfilledResult<LiquidatableResult[]>).value)

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
    } else {
      console.log('Position already found in the liquidatable_positions list')
    }
  }

  // return the amount of liquidatable positions
  return liquidatableResults.length
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
