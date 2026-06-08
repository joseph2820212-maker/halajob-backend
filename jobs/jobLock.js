import os from "os";
import { ScheduledJobLockModel } from "../models/index.js";

const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;
const OWNER = `${os.hostname()}-${process.pid}`;

export const jobOwner = OWNER;

export async function withScheduledJobLock(key, worker, options = {}) {
  const ttlMs = Number(options.ttlMs || DEFAULT_LOCK_TTL_MS);
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ttlMs);

  const lock = await ScheduledJobLockModel.findOneAndUpdate(
    {
      key,
      $or: [
        { locked_until: { $exists: false } },
        { locked_until: null },
        { locked_until: { $lte: now } },
        { owner: OWNER },
      ],
    },
    {
      $set: {
        key,
        owner: OWNER,
        locked_until: lockedUntil,
        last_started_at: now,
        last_error: "",
      },
      $inc: { run_count: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean().catch((error) => {
    if (error?.code === 11000) return null;
    throw error;
  });

  if (!lock || String(lock.owner) !== OWNER) {
    return { skipped: true, reason: "locked_by_another_process" };
  }

  try {
    const result = await worker();
    await ScheduledJobLockModel.updateOne(
      { key, owner: OWNER },
      {
        $set: {
          locked_until: new Date(),
          last_finished_at: new Date(),
          last_success_at: new Date(),
          last_stats: result || {},
          last_error: "",
        },
      }
    );
    return { skipped: false, ...(result || {}) };
  } catch (error) {
    await ScheduledJobLockModel.updateOne(
      { key, owner: OWNER },
      {
        $set: {
          locked_until: new Date(),
          last_finished_at: new Date(),
          last_error: String(error?.stack || error?.message || error),
        },
        $inc: { fail_count: 1 },
      }
    );
    throw error;
  }
}

export default { withScheduledJobLock, jobOwner };
