import cron from 'node-cron'
import { liquidationChecker } from './liquidatorCheckerHandler'
import dotenv from 'dotenv';

dotenv.config();

const cronSchedule = process.env.CRON_SCHEDULE || '*/30 * * * * *';

cron.schedule(cronSchedule, liquidationChecker);

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
