import dotenv from "dotenv";
import mongoose from "mongoose";

import { RefreshTokenModel } from "../models/index.js";

dotenv.config();

const connectionUrl =
  process.env.CONNECTION_URL ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/halajob";
const dryRun = process.argv.includes("--dry-run");
const refreshTokenDays = Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || 30);

const expiresAtForToken = (token) => {
  if (token.expiresAt) return new Date(token.expiresAt);
  const base = token.loginTime || token.createdAt || new Date();
  return new Date(new Date(base).getTime() + refreshTokenDays * 24 * 60 * 60 * 1000);
};

const run = async () => {
  await mongoose.connect(connectionUrl);

  const cursor = RefreshTokenModel.collection.find(
    {
      $or: [
        { userRef: { $type: "string" } },
        { expiresAt: { $exists: false } },
      ],
    },
    { projection: { _id: 1, userRef: 1, loginTime: 1, createdAt: 1, expiresAt: 1 } }
  );

  let scanned = 0;
  let converted = 0;
  let expirationBackfilled = 0;
  let invalidDeleted = 0;

  for await (const token of cursor) {
    scanned += 1;
    const userRef = token.userRef;
    const userRefString = String(userRef || "").trim();
    if (!mongoose.Types.ObjectId.isValid(userRefString)) {
      invalidDeleted += 1;
      if (!dryRun) {
        await RefreshTokenModel.collection.deleteOne({ _id: token._id });
      }
      continue;
    }

    const set = {};
    if (typeof userRef === "string") {
      set.userRef = new mongoose.Types.ObjectId(userRefString);
      converted += 1;
    }
    if (!token.expiresAt) {
      set.expiresAt = expiresAtForToken(token);
      expirationBackfilled += 1;
    }

    if (!dryRun) {
      await RefreshTokenModel.collection.updateOne(
        { _id: token._id, userRef: token.userRef },
        { $set: set }
      );
    }
  }

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        status: "ok",
        dryRun,
        scanned,
        converted,
        expirationBackfilled,
        invalidDeleted,
      },
      null,
      2
    )
  );
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // Best-effort cleanup before exiting.
  }
  process.exitCode = 1;
});
