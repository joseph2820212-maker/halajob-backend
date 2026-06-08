import mongoose from "mongoose";
import {
  CompanyModel,
  jobsModel,
  UserApplyingJobModel,
  UserSavedJobModel,
} from "../models/index.js";
import { notifyUser } from "../notification/notificationService.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const BATCH_SIZE = toInt(process.env.SCHEDULED_JOB_BATCH_SIZE, 100);
const MAX_SAVED_REMINDER_RECIPIENTS_PER_JOB = toInt(process.env.JOB_REMINDER_MAX_SAVED_USERS_PER_JOB, 500);
const MAX_APPLICANT_CLOSE_RECIPIENTS_PER_JOB = toInt(process.env.JOB_CLOSE_MAX_APPLICANTS_PER_JOB, 500);
const NOTIFICATION_CONCURRENCY = toInt(process.env.SCHEDULED_JOB_NOTIFICATION_CONCURRENCY, 10);

const cleanId = (value) => String(value?._id || value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(cleanId(value));
const uniqueIds = (values = []) => [...new Set(values.map(cleanId).filter(isObjectId))];
const jobTitle = (job = {}) => String(job.job_name || job.title || "Job").trim();
const iso = (date) => (date instanceof Date ? date.toISOString() : String(date || ""));

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
        console.error("scheduled notification error", error?.message || error);
      }
    }
  });

  await Promise.all(runners);
  return { done, failed };
}

const activePublishedJobFilter = (now = new Date()) => ({
  publish_status: "published",
  status: true,
  is_accepted: true,
  $or: [
    { apply_deadline: { $exists: true, $ne: null, $gt: now } },
    { end_date: { $exists: true, $ne: null, $gt: now } },
  ],
});

const deadlineFilter = (from, to) => ({
  ...activePublishedJobFilter(from),
  apply_deadline: { $exists: true, $ne: null, $gt: from, $lte: to },
});

export async function syncCompanyActiveJobCounts() {
  const active = await jobsModel.aggregate([
    { $match: { publish_status: "published", status: true, is_accepted: true } },
    { $group: { _id: "$company_id", count: { $sum: 1 } } },
  ]);

  const companyIds = active.map((row) => row._id).filter(Boolean);
  let updated = 0;

  for (const row of active) {
    await CompanyModel.updateOne(
      { _id: row._id },
      {
        $set: {
          active_jobs_count: row.count,
          "search_filters.hiring.active_jobs_count": row.count,
        },
      }
    );
    updated += 1;
  }

  const resetResult = await CompanyModel.updateMany(
    companyIds.length ? { _id: { $nin: companyIds } } : {},
    {
      $set: {
        active_jobs_count: 0,
        "search_filters.hiring.active_jobs_count": 0,
      },
    }
  );

  return {
    updated_companies: updated,
    reset_companies: resetResult.modifiedCount || 0,
  };
}

async function notifyCompanyDeadline(job, hours) {
  const userId = job.user_id || job.company?.owner_user_id;
  if (!isObjectId(userId)) return { sent: 0, failed: 0 };

  const res = await notifyUser({
    userId,
    eventKey: `job_deadline_company_${hours}h`,
    audience: "company",
    routeKey: "jobs.details",
    routeParams: { id: job._id },
    params: { job: jobTitle(job), hours, deadline: iso(job.apply_deadline) },
    data: {
      job_id: cleanId(job._id),
      company_id: cleanId(job.company_id),
      deadline: job.apply_deadline,
      hours,
    },
    dedupeKey: `job:${cleanId(job._id)}:company-deadline-${hours}h`,
  });

  return { sent: res?.saved ? 1 : 0, failed: res?.error ? 1 : 0 };
}

async function notifySavedEmployeesDeadline(job, hours) {
  const savedUserIds = await UserSavedJobModel.find({ job_id: job._id })
    .select("user_id")
    .limit(MAX_SAVED_REMINDER_RECIPIENTS_PER_JOB)
    .lean();

  const userIds = uniqueIds(savedUserIds.map((row) => row.user_id));
  if (!userIds.length) return { sent: 0, failed: 0, skipped: 0 };

  const alreadyAppliedIds = await UserApplyingJobModel.distinct("user_id", {
    job_id: job._id,
    user_id: { $in: userIds },
  });
  const appliedSet = new Set(uniqueIds(alreadyAppliedIds));
  const targets = userIds.filter((id) => !appliedSet.has(id));

  const stats = await runLimited(targets, NOTIFICATION_CONCURRENCY, async (userId) => notifyUser({
    userId,
    eventKey: `saved_job_deadline_employee_${hours}h`,
    audience: "employee",
    routeKey: "jobs.saved",
    params: { job: jobTitle(job), hours, deadline: iso(job.apply_deadline) },
    data: {
      job_id: cleanId(job._id),
      company_id: cleanId(job.company_id),
      deadline: job.apply_deadline,
      hours,
    },
    dedupeKey: `job:${cleanId(job._id)}:saved-user:${userId}:deadline-${hours}h`,
  }));

  return { sent: stats.done, failed: stats.failed, skipped: userIds.length - targets.length };
}

async function markReminderSent(jobId, marker, now = new Date()) {
  await jobsModel.updateOne(
    { _id: jobId },
    {
      $set: {
        [`job_lifecycle.reminders.${marker}`]: now,
        "job_lifecycle.last_deadline_checked_at": now,
      },
    }
  );
}

async function sendDeadlineReminderWindow({ hours, minHours, maxHours, companyMarker, savedMarker }) {
  const now = new Date();
  const from = new Date(now.getTime() + minHours * HOUR_MS);
  const to = new Date(now.getTime() + maxHours * HOUR_MS);

  const jobs = await jobsModel.find({
    ...deadlineFilter(from, to),
    $or: [
      { [`job_lifecycle.reminders.${companyMarker}`]: { $exists: false } },
      { [`job_lifecycle.reminders.${companyMarker}`]: null },
      { [`job_lifecycle.reminders.${savedMarker}`]: { $exists: false } },
      { [`job_lifecycle.reminders.${savedMarker}`]: null },
    ],
  })
    .select("job_name apply_deadline company_id user_id job_lifecycle")
    .sort({ apply_deadline: 1 })
    .limit(BATCH_SIZE)
    .lean();

  const stats = {
    hours,
    scanned_jobs: jobs.length,
    company_notifications: 0,
    employee_notifications: 0,
    employee_skipped: 0,
    failed_notifications: 0,
  };

  for (const job of jobs) {
    const hasCompanyReminder = Boolean(job.job_lifecycle?.reminders?.[companyMarker]);
    const hasSavedReminder = Boolean(job.job_lifecycle?.reminders?.[savedMarker]);

    if (!hasCompanyReminder) {
      const result = await notifyCompanyDeadline(job, hours);
      stats.company_notifications += result.sent;
      stats.failed_notifications += result.failed;
      await markReminderSent(job._id, companyMarker);
    }

    if (!hasSavedReminder) {
      const result = await notifySavedEmployeesDeadline(job, hours);
      stats.employee_notifications += result.sent;
      stats.employee_skipped += result.skipped;
      stats.failed_notifications += result.failed;
      await markReminderSent(job._id, savedMarker);
    }
  }

  return stats;
}

export async function sendJobDeadlineReminders() {
  const reminder7d = await sendDeadlineReminderWindow({
    hours: 168,
    minHours: 72,
    maxHours: 168,
    companyMarker: "company_7d_at",
    savedMarker: "saved_7d_at",
  });

  const reminder3d = await sendDeadlineReminderWindow({
    hours: 72,
    minHours: 24,
    maxHours: 72,
    companyMarker: "company_3d_at",
    savedMarker: "saved_3d_at",
  });

  const reminder24h = await sendDeadlineReminderWindow({
    hours: 24,
    minHours: 0,
    maxHours: 24,
    companyMarker: "company_24h_at",
    savedMarker: "saved_24h_at",
  });

  return { reminder7d, reminder3d, reminder24h };
}

const expiredJobFilter = (now = new Date()) => ({
  publish_status: "published",
  status: true,
  is_accepted: true,
  $or: [
    { apply_deadline: { $exists: true, $ne: null, $lte: now } },
    { end_date: { $exists: true, $ne: null, $lte: now } },
  ],
});

function closeReason(job = {}, now = new Date()) {
  if (job.apply_deadline && new Date(job.apply_deadline).getTime() <= now.getTime()) return "apply_deadline_expired";
  if (job.end_date && new Date(job.end_date).getTime() <= now.getTime()) return "end_date_expired";
  return "expired";
}

async function notifyCompanyJobClosed(job, reason) {
  const userId = job.user_id || job.company?.owner_user_id;
  if (!isObjectId(userId)) return { sent: 0, failed: 0 };

  const res = await notifyUser({
    userId,
    eventKey: "job_auto_closed_company",
    audience: "company",
    routeKey: "jobs.details",
    routeParams: { id: job._id },
    params: { job: jobTitle(job), reason },
    data: {
      job_id: cleanId(job._id),
      company_id: cleanId(job.company_id),
      reason,
    },
    dedupeKey: `job:${cleanId(job._id)}:auto-closed-company`,
  });

  return { sent: res?.saved ? 1 : 0, failed: res?.error ? 1 : 0 };
}

async function notifyApplicantsJobClosed(job, reason) {
  const applications = await UserApplyingJobModel.find({ job_id: job._id })
    .select("user_id status")
    .limit(MAX_APPLICANT_CLOSE_RECIPIENTS_PER_JOB)
    .lean();

  const userIds = uniqueIds(applications.map((row) => row.user_id));
  if (!userIds.length) return { sent: 0, failed: 0 };

  const stats = await runLimited(userIds, NOTIFICATION_CONCURRENCY, async (userId) => notifyUser({
    userId,
    eventKey: "job_auto_closed_employee",
    audience: "employee",
    routeKey: "applications.status",
    params: { job: jobTitle(job), reason },
    data: {
      job_id: cleanId(job._id),
      company_id: cleanId(job.company_id),
      reason,
    },
    dedupeKey: `job:${cleanId(job._id)}:applicant:${userId}:auto-closed`,
  }));

  return { sent: stats.done, failed: stats.failed };
}

export async function closeExpiredJobs() {
  const now = new Date();
  const jobs = await jobsModel.find(expiredJobFilter(now))
    .select("job_name apply_deadline end_date company_id user_id job_lifecycle")
    .sort({ apply_deadline: 1, end_date: 1 })
    .limit(BATCH_SIZE)
    .lean();

  const stats = {
    scanned_jobs: jobs.length,
    closed_jobs: 0,
    company_notifications: 0,
    employee_notifications: 0,
    failed_notifications: 0,
    company_counts_synced: 0,
  };

  const touchedCompanyIds = [];

  for (const job of jobs) {
    const reason = closeReason(job, now);
    const updated = await jobsModel.findOneAndUpdate(
      { _id: job._id, publish_status: "published", status: true, is_accepted: true },
      {
        $set: {
          publish_status: "closed",
          status: false,
          "job_lifecycle.auto_closed_at": now,
          "job_lifecycle.auto_close_reason": reason,
          "job_lifecycle.last_deadline_checked_at": now,
        },
      },
      { new: true }
    ).select("_id company_id").lean();

    if (!updated) continue;

    stats.closed_jobs += 1;
    touchedCompanyIds.push(cleanId(job.company_id));

    const companyResult = await notifyCompanyJobClosed(job, reason);
    stats.company_notifications += companyResult.sent;
    stats.failed_notifications += companyResult.failed;
    await markReminderSent(job._id, "closed_company_at", now);

    const applicantResult = await notifyApplicantsJobClosed(job, reason);
    stats.employee_notifications += applicantResult.sent;
    stats.failed_notifications += applicantResult.failed;
    await markReminderSent(job._id, "closed_applicants_at", now);
  }

  const uniqueCompanyIds = uniqueIds(touchedCompanyIds);
  for (const companyId of uniqueCompanyIds) {
    const count = await jobsModel.countDocuments({ company_id: companyId, publish_status: "published", status: true, is_accepted: true });
    await CompanyModel.updateOne(
      { _id: companyId },
      {
        $set: {
          active_jobs_count: count,
          "search_filters.hiring.active_jobs_count": count,
        },
      }
    );
    stats.company_counts_synced += 1;
  }

  return stats;
}

export async function runJobLifecycleMaintenance() {
  const closed = await closeExpiredJobs();
  const reminders = await sendJobDeadlineReminders();
  return { closed, reminders };
}

export default {
  closeExpiredJobs,
  sendJobDeadlineReminders,
  syncCompanyActiveJobCounts,
  runJobLifecycleMaintenance,
};
