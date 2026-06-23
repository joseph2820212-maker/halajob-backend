import "../config/loadEnv.js";

import mongoose from "mongoose";
import logger from "../config/logger.js";
import { runScheduledJobNow } from "../jobs/scheduler.js";

const CONNECTION_URL = process.env.CONNECTION_URL;
const jobKey = process.argv[2];

if (!CONNECTION_URL) {
  logger.error("CONNECTION_URL is missing");
  process.exit(1);
}

if (!jobKey) {
  console.error("Usage: npm run scheduled:run -- <job-key>");
  console.error("Available keys: close-expired-jobs, send-job-deadline-reminders, sync-company-active-job-counts");
  process.exit(1);
}

try {
  mongoose.set("strictQuery", true);
  await mongoose.connect(CONNECTION_URL, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  const result = await runScheduledJobNow(jobKey);
  console.log(JSON.stringify(result, null, 2));
  await mongoose.connection.close(false);
  process.exit(0);
} catch (error) {
  logger.error(error);
  await mongoose.connection.close(false).catch(() => {});
  process.exit(1);
}
