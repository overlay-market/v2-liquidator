import cron from 'node-cron'
import { Worker } from 'worker_threads'
import {
  markets,
  multicall2_address,
  olv_state_address,
} from './constants'
import { ethers } from 'ethers'
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

interface MulticallResult {
  blockNumber: number;
  returnData: string[];
}

interface LiquidatableResult {
  position: Position;
  isLiquidatable: boolean;
}

// scan positions for a given marketAddress
async function scanPositions(marketAddress: string) {
  const positions: Position[] = []
  const entries = await redis.hgetall(`positions:${marketAddress}`)

  for (const [key, value] of Object.entries(entries)) {
    try {
      positions.push({
        positionId: key,
        owner: value
      })
    } catch (error) {
      console.error('Error parsing position data:', error)
    }
  }

  // return 20k positions for now
  return positions
}

async function distributeWorkToWorkers(marketAddress: string, positions: Position[]) {
  const numWorkers = 10;
  const positionsPerWorker = Math.ceil(positions.length / numWorkers);
  let workerPromises = [];

  for (let i = 0; i < numWorkers; i++) {
    const startPos = i * positionsPerWorker;
    const endPos = Math.min(startPos + positionsPerWorker, positions.length);
    const workerPositions = positions.slice(startPos, endPos);

    const workerPromise = new Promise((resolve, reject) => {
      const worker = new Worker('./dist/worker.js', {
        workerData: {
          positions: workerPositions,
          marketAddress,
          multicall2_address,
          olv_state_address
        }
      });

      worker.on('message', (results) => {
        log(chalk.bgBlue(`Worker ${i} completed with results:`, results.length));
        resolve(results);
      });
      worker.on('error', (error) => {
        log(chalk.bold.red(`Worker ${i} error:`, error.message));
        reject(error);
      });
      worker.on('exit', (code) => {
        if (code !== 0) {
          log(chalk.bold.red(`Worker ${i} stopped with exit code ${code}`));
          reject(new Error(`Worker ${i} stopped with exit code ${code}`));
        }
      });
    });

    workerPromises.push(workerPromise);
  }

  return Promise.all(workerPromises);
}

async function liquidationChecker() {
  if (!process.env.RPC_URL) {
    log(chalk.bold.red('RPC_URL is not set in the environment variables. Exiting...'))
    return
  }

  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  taskRunning = true
  log(chalk.bold.blue('Cron job started at:', new Date().toLocaleString()))
  log('Liquidation Checker module is running...')

  try {
    const marketAddress = markets['ETH Dominance'];
    const positions = await scanPositions(marketAddress);
    log('total positions for market:', 'ETH Dominance', positions.length);
  
    await distributeWorkToWorkers(marketAddress, positions);
    log(chalk.bgGreen('All positions scanned successfully!'));
  } catch (error) {
    console.error('Error during the cron job:', error);
  } finally {
    taskRunning = false;
  }
}

// Schedule the cron job to run every 5 minutes
//cron.schedule('* * * * *', liquidationChecker)

// run liquidationChecker() once to fetch events for all markets
liquidationChecker()
