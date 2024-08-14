import cron from "node-cron";
import { config } from "./config";
import { sendLiquidatorReport } from "./monitorHandler";

// Schedule the cron job
cron.schedule(config.cron_schedule, sendLiquidatorReport);
// sendLiquidatorReport()
