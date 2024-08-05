import cron from 'node-cron'
import { fetchAndProcessEventsForAllMarkets } from './marketEventHandler'
import { Networks } from './constants'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

const log = console.log

let taskRunning = false

async function start() {
  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  taskRunning = true

  for (const network of Object.values(Networks)) {
    try {
      await fetchAndProcessEventsForAllMarkets(network)
    } catch (error) {
      log(chalk.bold.red(`Error fetching events for network: ${network} `))
      console.error(error)
    }
  }

  taskRunning = false
}

if (process.env.NODE_ENV === 'dev') {
  log(chalk.bold.green('Running in dev mode'))
  start()
} else {
  log(chalk.bold.green('Running in prod mode'))
  // Schedule the cron job to run every 2 minutes
  cron.schedule('*/2 * * * *', start)
}