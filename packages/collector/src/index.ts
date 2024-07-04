import cron from 'node-cron'
import { fetchAndProcessEventsForAllMarkets } from './marketEventHandler'

// Schedule the cron job to run at second 20 of every 2 minutes
cron.schedule('20 */2 * * * *', fetchAndProcessEventsForAllMarkets)

// run fetchAndProcessEventsForAllMarkets() once to fetch events for all markets
// fetchAndProcessEventsForAllMarkets()