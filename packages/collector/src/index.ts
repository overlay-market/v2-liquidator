import cron from 'node-cron'
import { fetchAndProcessEventsForAllMarkets } from './marketEventHandler'
import { Networks, networksConfig } from './constants'
import chalk from 'chalk'
import dotenv from 'dotenv'
import redis from './redisHandler'

dotenv.config()

const log = console.log

let taskRunning = false
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000 // 2 segundos de espera entre reintentos

async function firstRunForSomeNetwork(): Promise<boolean> {
  for (const network of Object.values(Networks)) {
    const networkConfig = networksConfig[network]

    if (!networkConfig.enabled) {
      continue
    }

    const firstRun = await redis.get(`${network}:first_collector_run`)

    if (!firstRun && networkConfig.useFork) {
      return true
    }
  }

  return false
}

async function fetchWithRetries(network: Networks) {
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      await fetchAndProcessEventsForAllMarkets(network)
      log(chalk.green(`Successfully processed events for network: ${network}`))
      return // Si la operación fue exitosa, salir de la función
    } catch (error) {
      retries++
      log(
        chalk.bold.red(
          `Error fetching events for network: ${network} (Attempt ${retries} of ${MAX_RETRIES})`
        )
      )
      console.error(error)

      if (retries < MAX_RETRIES) {
        log(chalk.yellow(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`))
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      } else {
        log(chalk.bold.red(`Max retries reached for network: ${network}. Skipping...`))
      }
    }
  }
}

async function start() {
  if (taskRunning) {
    log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  taskRunning = true

  for (const network of Object.values(Networks)) {
    await fetchWithRetries(network)
  }

  taskRunning = false
}

async function init() {
  const shouldRunImmediately = await firstRunForSomeNetwork()

  if (shouldRunImmediately) {
    log(chalk.bold.blue('First run required for some networks, running start immediately...'))
    await start()
  }

  log(chalk.bold.green('Scheduling cron job to run every 10 minutes...'))
  cron.schedule('*/10 * * * *', start)
}

if (process.env.NODE_ENV === 'dev') {
  log(chalk.bold.green('Running in dev mode'))
  start()
} else {
  log(chalk.bold.green('Running in prod mode'))
  init()
}