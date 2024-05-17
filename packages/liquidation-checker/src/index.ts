import cron from 'node-cron'
import { Worker } from 'worker_threads'
import { markets } from './constants'
import dotenv from 'dotenv'
import Redis from 'ioredis'
import chalk from 'chalk'

dotenv.config()

const redis = new Redis({
  password: process.env.REDIS_PASSWORD,
})

const log = console.log

let taskRunning = false

interface Position {
  positionId: string
  owner: string
}

// create a promise for each worker
function createWorkerPromise(
  marketAddress: string,
  positions: Position[],
  workerIndex: number,
  rpcUrls: string[],
  rpcIndex: number = 0
) {
  return new Promise((resolve, reject) => {
    const rpcUrl = rpcUrls[rpcIndex % rpcUrls.length]

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
      reject(new Error('Worker timeout ' + workerIndex + ' ' + rpcUrl))
    }, 29000) // 29 seconds

    worker.on('message', (result: number) => {
      clearTimeout(timeoutId)
      log(chalk.bgBlue(`Worker ${workerIndex} completed with results:`, result))
      resolve(result)
    })

    worker.on('error', (error) => {
      clearTimeout(timeoutId)
      console.error(`Worker ${workerIndex} error:`, error)
      // Retry with next RPC
      if (rpcUrls.length > 1) {
        resolve(createWorkerPromise(marketAddress, positions, workerIndex, rpcUrls, rpcIndex + 1))
      } else {
        reject(error)
      }
    })

    worker.on('exit', (code) => {
      clearTimeout(timeoutId)
      if (code !== 0) {
        console.error(`Worker ${workerIndex} stopped with exit code ${code}`)
        // Retry with next RPC
        if (rpcUrls.length > 1) {
          resolve(createWorkerPromise(marketAddress, positions, workerIndex, rpcUrls, rpcIndex + 1))
        } else {
          reject(new Error(`Worker ${workerIndex} stopped with exit code ${code}`))
        }
      }
    })
  })
}

// distribute work to workers
async function distributeWorkToWorkers(marketAddress: string, positions: Position[]) {
  const WORKERS_AMOUNT = parseInt(process.env.WORKERS_AMOUNT ?? '4')

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
    const workerPositions = positions.slice(startPos, endPos)
    workerPromises.push(createWorkerPromise(marketAddress, workerPositions, i, rpcUrls))
  }

  return Promise.all(workerPromises)
}

// fetch positions from redis
async function fetchPositions(
  marketAddress: string,
  currentIndex: number,
  endIndex: number
): Promise<Position[]> {
  const positionIds = await redis.zrange(`position_index:${marketAddress}`, currentIndex, endIndex)
  const positions: Position[] = await Promise.all(
    positionIds.map(async (id) => ({
      positionId: id,
      owner: (await redis.hget(`positions:${marketAddress}`, id)) as string,
    }))
  )
  return positions
}

async function liquidationChecker() {
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

// Schedule the cron job to run every 30 seconds
cron.schedule('*/30 * * * * *', liquidationChecker)

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
