import cron from 'node-cron'
import {
  EventType,
  PositionStatus,
  markets,
  markets_block,
  multicall2_address,
  olv_state_address,
} from './constants'
import market_state_abi from './abis/market_state_abi.json'
import multicall2_abi from './abis/multicall2_abi.json'
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import Redis from 'ioredis'
import chalk from 'chalk'

dotenv.config()

const redis = new Redis({
  password: process.env.REDIS_PASSWORD,
})

const log = console.log

const BATCH_SIZE = 400; // number of positions to check in a single multicall batch

let taskRunning = false

interface Position {
  positionId: string
  owner: string
  txHash: string
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
      const position = JSON.parse(value)
      positions.push({
        positionId: key,
        owner: position.owner,
        txHash: position.txHash,
      })
    } catch (error) {
      console.error('Error parsing position data:', error)
    }
  }

  // return 20k positions for now
  return positions.slice(10000, 15000)
}

// check liquidatable positions for a given market
async function checkLiquidations(marketAddress: string, positions: Position[]) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
  const ovlMarketStateContract = new ethers.Contract(olv_state_address, market_state_abi, provider)
  const multicall2Contract = new ethers.Contract(multicall2_address, multicall2_abi, provider)

  const calls = positions.map(position => ({
    target: ovlMarketStateContract.address,
    callData: ovlMarketStateContract.interface.encodeFunctionData("liquidatable", [
      marketAddress,
      position.owner,
      parseInt(position.positionId)
    ])
  }));

  const batchPromises: Promise<LiquidatableResult[]>[] = [];

  for (let i = 0; i < positions.length; i += BATCH_SIZE) {
    const batchPositions = positions.slice(i, i + BATCH_SIZE);
    
    // Add the multicall batch promise to the array
    batchPromises.push(
      multicall2Contract.aggregate(calls.slice(i, i + BATCH_SIZE)).then((result: MulticallResult) => {
        return result.returnData.map((data, index) => {
          const isLiquidatable = ovlMarketStateContract.interface.decodeFunctionResult("liquidatable", data)[0];
          return {
            position: batchPositions[index],
            isLiquidatable: isLiquidatable
          };
        }).filter((result: LiquidatableResult) => result.isLiquidatable);
      })
    );
  }

  const results = await Promise.all(batchPromises);
  const liquidatableResults = results.flat();

  console.log('Liquidatable positions:', JSON.stringify(liquidatableResults));
  return liquidatableResults;
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
    const marketPromises = Object.entries(markets).map(async ([marketName, address]) => {
      const positions = await scanPositions(address);
      console.log('total positions for market:', marketName, positions.length);
      return checkLiquidations(address, positions);
    });

    await Promise.all(marketPromises);

    log(chalk.bgGreen('All positions scanned successfully!'))
    // code ts to end process
    process.exit(0)
  } catch (error) {
    console.error('Error during the cron job:', error)
  } finally {
    taskRunning = false
  }
}

// Schedule the cron job to run every 5 minutes
//cron.schedule('* * * * *', liquidationChecker)

// run liquidationChecker() once to fetch events for all markets
liquidationChecker()
