import cron from 'node-cron'
import { LiquidatorCheckerHandler } from './liquidatorCheckerHandler'
import dotenv from 'dotenv'
import { config } from './config'
import chalk from 'chalk'

dotenv.config()

const cronSchedule = config[process.env.MARKET || 'default'].cron_schedule
let taskRunning = false

cron.schedule(cronSchedule, async () => {
  if (taskRunning) {
    console.log(chalk.bold.red('Task is already running. Skipping this run...'))
    return
  }

  taskRunning = true
  try {
    const checker = new LiquidatorCheckerHandler()
    await checker.run()
  } catch (error) {
    console.error('Error in liquidationChecker:', error)
  } finally {
    taskRunning = false
  }
})

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
