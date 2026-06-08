import cron from "node-cron";
import logger from "../config/logger.js";
import { withScheduledJobLock, jobOwner } from "./jobLock.js";
import {
  closeExpiredJobs,
  sendJobDeadlineReminders,
  syncCompanyActiveJobCounts,
} from "./jobLifecycle.jobs.js";

const enabled = () => String(process.env.SCHEDULED_JOBS_ENABLED ?? "true").toLowerCase() !== "false";
const timezone = () => process.env.SCHEDULED_JOBS_TIMEZONE || "UTC";
const boolEnv = (key, fallback = true) => {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return !["false", "0", "no", "off"].includes(String(value).toLowerCase());
};

const definitions = [
  {
    key: "close-expired-jobs",
    envKey: "CLOSE_EXPIRED_JOBS_CRON",
    defaultCron: "*/15 * * * *",
    lockTtlMs: 14 * 60 * 1000,
    handler: closeExpiredJobs,
  },
  {
    key: "send-job-deadline-reminders",
    envKey: "JOB_DEADLINE_REMINDERS_CRON",
    defaultCron: "0 * * * *",
    lockTtlMs: 55 * 60 * 1000,
    handler: sendJobDeadlineReminders,
  },
  {
    key: "sync-company-active-job-counts",
    envKey: "SYNC_COMPANY_ACTIVE_JOB_COUNTS_CRON",
    defaultCron: "10 * * * *",
    lockTtlMs: 50 * 60 * 1000,
    handler: syncCompanyActiveJobCounts,
  },
];

let scheduledTasks = [];
let hasStarted = false;

async function runDefinition(definition, reason = "cron") {
  const startedAt = Date.now();

  try {
    const result = await withScheduledJobLock(
      definition.key,
      () => definition.handler(),
      { ttlMs: definition.lockTtlMs }
    );

    logger.info(`[scheduled-jobs] ${definition.key} ${reason} finished`, {
      owner: jobOwner,
      duration_ms: Date.now() - startedAt,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error(`[scheduled-jobs] ${definition.key} ${reason} failed: ${error?.message || error}`);
    return { error: String(error?.message || error) };
  }
}

export function startScheduledJobs() {
  if (hasStarted) return { started: false, reason: "already_started" };

  if (!enabled()) {
    logger.info("[scheduled-jobs] disabled by SCHEDULED_JOBS_ENABLED=false");
    return { started: false, reason: "disabled" };
  }

  const tz = timezone();

  scheduledTasks = definitions.map((definition) => {
    const expression = process.env[definition.envKey] || definition.defaultCron;

    if (!cron.validate(expression)) {
      logger.error(`[scheduled-jobs] invalid cron expression for ${definition.key}: ${expression}`);
      return null;
    }

    const task = cron.schedule(
      expression,
      () => runDefinition(definition),
      {
        scheduled: true,
        timezone: tz,
      }
    );

    logger.info(`[scheduled-jobs] registered ${definition.key} (${expression})`, { timezone: tz, owner: jobOwner });
    return task;
  }).filter(Boolean);

  hasStarted = true;

  if (boolEnv("SCHEDULED_JOBS_RUN_ON_STARTUP", true)) {
    definitions.forEach((definition) => {
      setTimeout(() => runDefinition(definition, "startup"), 1000);
    });
  }

  return { started: true, count: scheduledTasks.length };
}

export function stopScheduledJobs() {
  scheduledTasks.forEach((task) => {
    try {
      task.stop();
    } catch (error) {
      logger.error(`[scheduled-jobs] failed to stop task: ${error?.message || error}`);
    }
  });

  scheduledTasks = [];
  hasStarted = false;
  return { stopped: true };
}

export async function runScheduledJobNow(key) {
  const definition = definitions.find((item) => item.key === key);
  if (!definition) throw new Error(`unknown_scheduled_job:${key}`);
  return runDefinition(definition, "manual");
}

export default {
  startScheduledJobs,
  stopScheduledJobs,
  runScheduledJobNow,
};
