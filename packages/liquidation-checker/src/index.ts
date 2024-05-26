import cron from 'node-cron'
import { liquidationChecker } from './liquidatorCheckerHandler'

// generate a random delay between 0 and 30 seconds
const randomDelay = Math.floor(Math.random() * 30000)

setTimeout(() => {
  cron.schedule('*/30 * * * * *', liquidationChecker)
  liquidationChecker()
}, randomDelay)

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
