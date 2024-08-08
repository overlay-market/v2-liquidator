import cron from 'node-cron'
import { liquidationChecker } from './liquidatorCheckerHandler'
import dotenv from 'dotenv'
import { config } from './config'
import chalk from 'chalk'

dotenv.config()

let taskRunning = false

const log = console.log

async function start() {
  if (!process.env.MARKET || !config[process.env.MARKET]) {
    log(chalk.bold.red('MARKET must be provided'))
    return
  }
  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  taskRunning = true

  try {
    await liquidationChecker()
  } catch (error) {
    log(chalk.bold.red(`Error running liquidation checker for market: ${process.env.MARKET}`))
    console.error(error)
  } finally {
    taskRunning = false
  }
}

function getSchedule() {
  if (!process.env.MARKET || !config[process.env.MARKET]) {
    log(chalk.bold.red('MARKET must be provided'))
    process.exit(1)
  }
  return config[process.env.MARKET].cron_schedule
}

if (process.env.NODE_ENV === 'dev') {
  log(chalk.bold.green('Running in dev mode'))
  start()
} else {
  log(chalk.bold.green('Running in prod mode'))
  // Schedule the cron job to run every 2 minutes
  cron.schedule(getSchedule(), async () => {
    await start()
    // free up memory with garbage collection
    if (global.gc) {
      global.gc()
    } else {
      console.warn('Garbage collection is not exposed')
    }
  })
}
