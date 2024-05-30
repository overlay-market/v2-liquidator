import cron from 'node-cron'
import { liquidationChecker } from './liquidatorCheckerHandler'
import dotenv from 'dotenv';
import { config } from './config';

dotenv.config();

const cronSchedule = config[process.env.MARKET || 'default'].cron_schedule;

cron.schedule(cronSchedule, async () => {
  try {
    await liquidationChecker();
    // free up memory with garbage collection
    if (global.gc) {
      global.gc();
    } else {
      console.warn('Garbage collection is not exposed');
    }
  } catch (error) {
    console.error('Error in liquidationChecker:', error);
  }
});

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
