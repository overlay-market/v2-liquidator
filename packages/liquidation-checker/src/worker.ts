import { parentPort, workerData } from 'worker_threads'
import { ethers } from 'ethers'
import { LiquidatableResult, MulticallResult, Networks, Position } from './constants'
import market_state_abi from './abis/market_state_abi.json'
import multicall2_abi from './abis/multicall2_abi.json'
import chalk from 'chalk'
import redis from './redisHandler'
import { MarketConfig, networkConfig } from './config'
import { selectRpc } from './rpcHandler'

const checkLiquidations = async (
  market: MarketConfig,
  positions: Partial<Record<Networks, Position[]>>
) => {
  // const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  // const ovlMarketStateContract = new ethers.Contract(olv_state_address, market_state_abi, provider)
  // const multicall2Contract = new ethers.Contract(multicall2_address, multicall2_abi, provider)

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
                `Error processing batch from ${i} to ${i + batchSize} for ${network} network. RpcUrl: ${rpcUrl}`
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
      await redis.incr(`liquidatable_positions_found`)
      await redis.incr(`liquidatable_positions_found:${result.network}:${marketAddress}`)
    } else {
      console.log('Position already found in the liquidatable_positions list')
    }
  }

  // return the amount of liquidatable positions
  return liquidatableResults.length
}

checkLiquidations(workerData.market, workerData.positions)
  .then((results) => {
    if (parentPort) parentPort.postMessage(results)
  })
  .catch((error) => {
    if (parentPort) parentPort.postMessage({ error: error.message })
  })
