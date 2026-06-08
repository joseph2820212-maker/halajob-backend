"use strict";

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import logger from "./config/logger.js";
import app from "./app.js";
import { startScheduledJobs, stopScheduledJobs } from "./jobs/scheduler.js";

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 3000;

let server;
let scheduledJobs;

if (!CONNECTION_URL) {
  logger.error("CONNECTION_URL is missing");
  process.exit(1);
}

mongoose.set("strictQuery", true);

if (process.env.NODE_ENV !== "production") {
  mongoose.set("debug", true);
}

const startServer = async () => {
  try {
    await mongoose.connect(CONNECTION_URL, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 20,
    });

    logger.info("Connected to MongoDB");

    scheduledJobs = startScheduledJobs();

    server = app.listen(PORT, () => {
      logger.info(`Listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

const exitHandler = async (code = 1) => {
  try {
    if (scheduledJobs?.started) {
      stopScheduledJobs();
      logger.info("Scheduled jobs stopped");
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info("HTTP server closed");
    }

    await mongoose.connection.close(false);
    logger.info("MongoDB connection closed");

    process.exit(code);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler(1);
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  exitHandler(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received");
  exitHandler(0);
});