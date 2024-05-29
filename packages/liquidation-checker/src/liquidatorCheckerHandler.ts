import { Worker } from 'worker_threads'
import { markets } from './constants'
import dotenv from 'dotenv'
import chalk from 'chalk'
import { selectRpc } from './rpcHandler'
import redis from './redisHandler'

dotenv.config()

const MAX_RETRIES = 3 // maximum number of retries for each worker
const WORKER_TIMEOUT_MS = 15000

const log = console.log

let taskRunning = false

interface Position {
  positionId: string
  owner: string
}

// create a promise for each worker
async function createWorkerPromise(
  marketAddress: string,
  positions: Position[],
  workerIndex: number,
  rpcUrls: string[],
  retryCount: number = 0
): Promise<number> {
  const rpcUrl = await selectRpc(rpcUrls)

  if (!rpcUrl) {
    const error = new Error('No healthy RPC found')
    log(chalk.red(`Error: ${error.message}`))
    throw error
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker('./dist/worker.js', {
      workerData: {
        positions,
        marketAddress,
        batchSize: parseInt(process.env.MULTICALL_BATCH_SIZE ?? '100'),
        rpcUrl,
      },
    })

    const timeoutId = setTimeout(() => {
      worker.terminate()
      const timeoutError = new Error(`Worker timeout: ${workerIndex} at RPC ${rpcUrl}`)
      log(chalk.red(`Error: ${timeoutError.message}`))
      reject(timeoutError)
    }, WORKER_TIMEOUT_MS)

    worker.on('message', (result: number) => {
      clearTimeout(timeoutId)
      log(chalk.bgBlue(`Worker ${workerIndex} completed with results:`, result))
      resolve(result)
    })

    worker.on('error', (error) => {
      clearTimeout(timeoutId)
      log(chalk.red(`Worker ${workerIndex} error: ${error}`))
      if (retryCount < MAX_RETRIES) {
        log(
          chalk.yellow(
            `Retrying worker ${workerIndex}... attempt ${retryCount + 1} of ${MAX_RETRIES}`
          )
        )
        setTimeout(() => {
          resolve(
            createWorkerPromise(marketAddress, positions, workerIndex, rpcUrls, retryCount + 1)
          )
        }, 1000 * Math.pow(2, retryCount)) // Exponential backoff
      } else {
        reject(new Error(`Worker ${workerIndex} failed after ${MAX_RETRIES} retries`))
      }
    })

    worker.on('exit', (code) => {
      clearTimeout(timeoutId)
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
            resolve(
              createWorkerPromise(marketAddress, positions, workerIndex, rpcUrls, retryCount + 1)
            )
          }, 1000 * Math.pow(2, retryCount)) // Exponential backoff
        } else {
          reject(new Error(`Worker ${workerIndex} failed after ${MAX_RETRIES} retries`))
        }
      }
    })
  })
}

// distribute work to workers
async function distributeWorkToWorkers(marketAddress: string, positions: Position[]) {
  const WORKERS_AMOUNT = parseInt(process.env.WORKERS_AMOUNT ?? '2')

  const rpcUrls = process.env.RPC_URLS?.split(',') ?? []
  if (rpcUrls.length === 0) {
    throw new Error('At least one RPC_URLS must be provided')
  }

  // distribute positions to workers
  const positionsPerWorker = Math.ceil(positions.length / WORKERS_AMOUNT)
  let workerPromises: Promise<unknown>[] = []

  for (let i = 0; i < WORKERS_AMOUNT; i++) {
    const startPos = i * positionsPerWorker
    const endPos = Math.min(startPos + positionsPerWorker, positions.length)
    workerPromises.push(
      createWorkerPromise(marketAddress, positions.slice(startPos, endPos), i, rpcUrls)
    )
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
async function fetchPositions(
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

  positionIds.length = 0;
  owners.length = 0;

  return positions
}

export async function liquidationChecker() {
  if (!process.env.MARKET || !markets[process.env.MARKET]) {
    log(chalk.bold.red('MARKET must be provided'))
    return
  }

  if (!process.env.RPC_URLS) {
    log(chalk.bold.red('At least one RPC_URLS must be provided'))
    return
  }

  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  // number of positions to process per run
  const POSITIONS_PER_RUN = parseInt(process.env.POSITIONS_PER_RUN ?? '30000')

  taskRunning = true
  log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))
  const startTime = Date.now()

  const marketAddress = markets[process.env.MARKET]
  log(
    'Liquidation Checker module is running for market:',
    process.env.MARKET,
    'with address:',
    marketAddress
  )

  try {
    const totalPositions = await redis.zcard(`position_index:${marketAddress}`)

    const currentIndexKey = `current-index:${marketAddress}`
    let currentIndexValue = await redis.get(currentIndexKey)
    let currentIndex = currentIndexValue ? parseInt(currentIndexValue) : 0

    let endIndex = currentIndex + POSITIONS_PER_RUN

    let positions: Position[] = []

    if (endIndex >= totalPositions) {
      endIndex = totalPositions - 1
      const positionsLeft = POSITIONS_PER_RUN - (endIndex - currentIndex)

      positions = await fetchPositions(marketAddress, currentIndex, endIndex)

      log('Processing positions from', currentIndex, 'to', endIndex)

      currentIndex = 0
      endIndex = currentIndex + positionsLeft

      positions = positions.concat(await fetchPositions(marketAddress, currentIndex, endIndex))

      log('Processing remaining positions from', currentIndex, 'to', endIndex)
    } else {
      positions = await fetchPositions(marketAddress, currentIndex, endIndex)
      log('Processing positions from', currentIndex, 'to', endIndex)
    }

    await distributeWorkToWorkers(marketAddress, positions)

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
  } catch (error) {
    console.error('Error during the cron job:', error)
  } finally {
    taskRunning = false
  }
}