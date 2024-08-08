import { Worker } from 'worker_threads'
import dotenv from 'dotenv'
import chalk from 'chalk'
import redis from './redisHandler'
import { config, MarketConfig } from './config'
import { Networks, Position } from './constants'

dotenv.config()

const MAX_RETRIES = 3 // maximum number of retries for each worker
const WORKER_TIMEOUT_MS = 15000

const log = console.log

// create a promise for each worker
async function createWorkerPromise(
  market: MarketConfig,
  positions: Partial<Record<Networks, Position[]>>,
  workerIndex: number,
  retryCount: number = 0
): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./dist/worker.js', {
      workerData: {
        market,
        positions,
      },
    })

    // const timeoutId = setTimeout(() => {
    //   worker.terminate()
    //   const timeoutError = new Error(`Worker timeout: ${workerIndex}`)
    //   log(chalk.red(`Error: ${timeoutError.message}`))
    //   reject(timeoutError)
    // }, WORKER_TIMEOUT_MS)

    worker.on('message', (result: number) => {
      // clearTimeout(timeoutId)
      log(chalk.bgBlue(`Worker ${workerIndex} completed with results:`, result))
      resolve(result)
    })

    worker.on('error', (error) => {
      // clearTimeout(timeoutId)
      log(chalk.red(`Worker ${workerIndex} error: ${error}`))
      if (retryCount < MAX_RETRIES) {
        log(
          chalk.yellow(
            `Retrying worker ${workerIndex}... attempt ${retryCount + 1} of ${MAX_RETRIES}`
          )
        )
        setTimeout(() => {
          resolve(createWorkerPromise(market, positions, workerIndex, retryCount + 1))
        }, 1000 * Math.pow(2, retryCount)) // Exponential backoff
      } else {
        reject(new Error(`Worker ${workerIndex} failed after ${MAX_RETRIES} retries`))
      }
    })

    worker.on('exit', (code) => {
      // clearTimeout(timeoutId)
      worker.unref()
      if (code !== 0) {
        const exitError = new Error(`Worker ${workerIndex} stopped with exit code ${code}`)
        log(chalk.red(`Error: ${exitError.message}`))
        if (retryCount < MAX_RETRIES) {
          log(
            chalk.yellow(
              `Retrying worker ${workerIndex}... attempt ${retryCount + 1} of ${MAX_RETRIES}`
            )
          )
          setTimeout(() => {
            resolve(createWorkerPromise(market, positions, workerIndex, retryCount + 1))
          }, 1000 * Math.pow(2, retryCount)) // Exponential backoff
        } else {
          reject(new Error(`Worker ${workerIndex} failed after ${MAX_RETRIES} retries`))
        }
      }
    })
  })
}

// distribute work to workers
async function distributeWorkToWorkers(
  market: MarketConfig,
  positions: Partial<Record<Networks, Position[]>>
) {
  let workerPromises: Promise<unknown>[] = []

  if (market.workers === 1) {
    workerPromises.push(createWorkerPromise(market, positions, 0))
  } else {
    // distribute positions to workers
    const positionsPerWorkerPerNetwork: Partial<Record<Networks, number>> = {}

    for (const network of Object.keys(positions) as Networks[]) {
      const tempPositions = positions[network]
      if (!tempPositions) continue
      positionsPerWorkerPerNetwork[network] = Math.ceil(tempPositions.length / market.workers)
    }

    for (let i = 0; i < market.workers; i++) {
      const tempPositions: Partial<Record<Networks, Position[]>> = {}
      for (const network of Object.keys(positions) as Networks[]) {
        const positionsPerWorker = positionsPerWorkerPerNetwork[network]
        const networkPositions = positions[network]
        if (!networkPositions || !positionsPerWorkerPerNetwork[network] || !positionsPerWorker) continue
        const startPos = i * positionsPerWorker
        const endPos = Math.min(startPos + positionsPerWorker, networkPositions.length)
        tempPositions[network] = networkPositions.slice(startPos, endPos)
      }
      workerPromises.push(createWorkerPromise(market, tempPositions, i))
    }
  }

  const results = await Promise.allSettled(workerPromises)

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      log(chalk.red(`Worker ${index} failed with error:`, result.reason))
    }
  })

  return results
}

// fetch positions from redis
async function fetchPositionsByNetwork(
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

async function fetchAllPositions(
  market: MarketConfig
): Promise<Partial<Record<Networks, Position[]>>> {
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

      positions = await fetchPositionsByNetwork(marketAddress, network, currentIndex, endIndex)

      log('Processing positions from', currentIndex, 'to', endIndex, 'for network', network)

      currentIndex = 0
      endIndex = currentIndex + positionsLeft

      positions = positions.concat(
        await fetchPositionsByNetwork(marketAddress, network, currentIndex, endIndex)
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
      positions = await fetchPositionsByNetwork(marketAddress, network, currentIndex, endIndex)
      log('Processing positions from', currentIndex, 'to', endIndex, 'for network', network)
    }

    // update the current index
    currentIndex = endIndex + 1
    await redis.set(currentIndexKey, currentIndex)

    allPositions[network] = positions
  }

  console.log('All positions:', allPositions.movement?.length)
  return allPositions
}

export async function liquidationChecker() {
  if (!process.env.MARKET || !config[process.env.MARKET]) {
    log(chalk.bold.red('MARKET must be provided'))
    return
  }

  log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))
  const startTime = Date.now()

  const market = config[process.env.MARKET]
  log('Liquidation Checker module is running for market:', process.env.MARKET)

  const positions = await fetchAllPositions(market)
  await distributeWorkToWorkers(market, positions)

  log(
    chalk.bgGreen(
      'All positions scanned successfully! time taken: ',
      Date.now() - startTime,
      'ms'
    )
  )
}
