import "../config/loadEnv.js";

import mongoose from "mongoose";
import logger from "../config/logger.js";
import { EmployeeModel } from "../models/index.js";
import { migrateEmployeeJobAlertsForUser } from "../services/jobAlerts/savedSearch.service.js";

const CONNECTION_URL = process.env.CONNECTION_URL;

if (!CONNECTION_URL) {
  logger.error("CONNECTION_URL is missing");
  process.exit(1);
}

try {
  mongoose.set("strictQuery", true);
  await mongoose.connect(CONNECTION_URL, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });

  const cursor = EmployeeModel.find({ "job_alerts.0": { $exists: true }, user_id: { $ne: null } }).cursor();
  let scanned = 0;
  let migrated = 0;

  for await (const employee of cursor) {
    scanned += 1;
    const result = await migrateEmployeeJobAlertsForUser({
      userId: employee.user_id,
      employee,
      scope: employee.is_student ? "campus" : "seeker",
    });
    migrated += result.migrated || 0;
  }

  console.log(JSON.stringify({ scanned, migrated }, null, 2));
  await mongoose.connection.close(false);
  process.exit(0);
} catch (error) {
  logger.error(error);
  await mongoose.connection.close(false).catch(() => {});
  process.exit(1);
}
