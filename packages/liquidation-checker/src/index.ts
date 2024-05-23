import cron from 'node-cron'
import { liquidationChecker } from './liquidatorCheckerHandler'

// Schedule the cron job to run every 30 seconds
cron.schedule('*/30 * * * * *', liquidationChecker)

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
