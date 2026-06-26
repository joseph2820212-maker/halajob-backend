import { CampusEventRegistrationModel } from "../models/index.js";
import { campusEventReminderNotification } from "../notification/CampusNotifications.js";

const HOUR_MS = 60 * 60 * 1000;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const BATCH_SIZE = toInt(process.env.CAMPUS_EVENT_REMINDER_BATCH_SIZE, 200);
const REMINDER_WINDOW_HOURS = toInt(process.env.CAMPUS_EVENT_REMINDER_WINDOW_HOURS, 24);
const NOTIFICATION_CONCURRENCY = toInt(process.env.SCHEDULED_JOB_NOTIFICATION_CONCURRENCY, 10);

async function runLimited(items = [], limit = NOTIFICATION_CONCURRENCY, worker) {
  const queue = [...items];
  let done = 0;
  let failed = 0;

  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        await worker(item);
        done += 1;
      } catch (error) {
        failed += 1;
        console.error("campus event reminder error", error?.message || error);
      }
    }
  });

  await Promise.all(runners);
  return { done, failed };
}

export async function sendCampusEventReminders() {
  const now = new Date();
  const to = new Date(now.getTime() + REMINDER_WINDOW_HOURS * HOUR_MS);

  const registrations = await CampusEventRegistrationModel.find({
    status: "registered",
    start_at: { $exists: true, $ne: null, $gt: now, $lte: to },
    $or: [
      { reminder_sent_at: { $exists: false } },
      { reminder_sent_at: null },
    ],
  })
    .sort({ start_at: 1, _id: 1 })
    .limit(BATCH_SIZE)
    .lean();

  const stats = {
    scanned_registrations: registrations.length,
    reminders_sent: 0,
    failed_notifications: 0,
    window_hours: REMINDER_WINDOW_HOURS,
  };

  const results = await runLimited(registrations, NOTIFICATION_CONCURRENCY, async (registration) => {
    await campusEventReminderNotification(registration);
    await CampusEventRegistrationModel.updateOne(
      { _id: registration._id, reminder_sent_at: null },
      { $set: { reminder_sent_at: now } }
    );
  });

  stats.reminders_sent = results.done;
  stats.failed_notifications = results.failed;
  return stats;
}

export default { sendCampusEventReminders };
