import cron from 'node-cron'
import redis from './redisHandler'
import { healthCheckAnvil, restartAnvil, startAnvil, stopAnvil } from './anvilForkHandler'
import dotenv from 'dotenv'
import chalk from 'chalk'

dotenv.config()

const log = console.log

let taskRunning = false
let forkRunning = false

async function main() {
  if (!process.env.FORK_RPC_URL) {
    log(chalk.bold.red('FORK_RPC_URL must be set in the environment variables'))
    return
  }

  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  log('Fork module is running...')

  try {
    if (!forkRunning) {
      forkRunning = true
      startAnvil()

      if (!await healthCheckAnvil()) {
        throw new Error('Anvil is not running')
      }
      
      await redis.set('forkRunning', 'true')
      log(chalk.bgGreen('Anvil is running'))
    } else {
      log(chalk.bold.yellow('Restarting Anvil...'))
      await redis.set('forkRunning', 'false')
      await restartAnvil()
      
      if (!await healthCheckAnvil()) {
        throw new Error('Anvil is not running')
      }

      await redis.set('forkRunning', 'true')
      log(chalk.bgGreen('Anvil is restarted'))
    }
  } catch (error) {
    console.error('Error during the cron job:', error)
    process.exit(1)
  } finally {
    taskRunning = false
  }
}

// Schedule the cron job to run at second 0 of every minute
cron.schedule('0 * * * * *', main)
// main()