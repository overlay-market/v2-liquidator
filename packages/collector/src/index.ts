import cron from 'node-cron'
import { fetchAndProcessEventsForAllMarkets } from './marketEventHandler'

// Schedule the cron job to run every 10 minutes
cron.schedule('*/10 * * * *', fetchAndProcessEventsForAllMarkets)

// run fetchAndProcessEventsForAllMarkets() once to fetch events for all markets
// fetchAndProcessEventsForAllMarkets()