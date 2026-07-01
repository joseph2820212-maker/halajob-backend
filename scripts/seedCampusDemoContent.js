import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  seedCampusDemoContent,
  teardownCampusDemoContent,
  verifyCampusDemoContentSeeded,
} from "./utils/campusDemoContentSeed.js";

dotenv.config();

const CONNECTION_URL =
  process.env.CONNECTION_URL ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/halajob";

const isTeardown = process.argv.includes("--teardown");
const log = (...args) => console.log("[campus-demo-seed]", ...args);

(async () => {
  if (!process.env.CONNECTION_URL && !process.env.MONGODB_URI) {
    log("WARNING: CONNECTION_URL not set; falling back to local mongo at 127.0.0.1.");
  }

  await mongoose.connect(CONNECTION_URL);
  try {
    if (isTeardown) {
      const result = await teardownCampusDemoContent();
      log(`Removed campus demo content documents: ${result.deletedCount}.`);
      return;
    }

    const doc = await seedCampusDemoContent();
    const verified = await verifyCampusDemoContentSeeded();
    log(
      `Seeded ${doc.key} (${doc.version}) into backend DB with ` +
        `${verified.counts.opportunities} opportunities, ` +
        `${verified.counts.events} events, ` +
        `${verified.counts.resources} resources.`,
    );
  } finally {
    await mongoose.connection.close();
  }
})().catch((error) => {
  console.error("[campus-demo-seed] failed:", error?.message || error);
  process.exitCode = 1;
});
