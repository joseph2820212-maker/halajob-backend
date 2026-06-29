import {
  AnalyticsEventModel,
  EmailLogModel,
  JobInvitationModel,
  NotificationModel,
  SearchHistoryModel,
  UserModel,
} from "../models/index.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function retentionDays(key, fallback) {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cutoffDate(now, days) {
  if (!Number.isFinite(days) || days <= 0) return null;
  return new Date(now.getTime() - days * DAY_MS);
}

async function deleteOlderThan(model, filter, now, envKey, fallbackDays) {
  const cutoff = cutoffDate(now, retentionDays(envKey, fallbackDays));
  if (!cutoff) return { deletedCount: 0, disabled: true };

  const result = await model.deleteMany({
    ...filter,
    createdAt: { $lt: cutoff },
  });
  return { deletedCount: result.deletedCount || 0, cutoff };
}

export async function clearExpiredUserVerificationState(now = new Date()) {
  const [passcodeResult, deviceResult] = await Promise.all([
    UserModel.updateMany(
      { passcode_expires_at: { $ne: null, $lte: now } },
      {
        $set: {
          passcode: null,
          passcode_active: false,
          passcode_expires_at: null,
          passcode_attempts: 0,
          can_update_password: false,
        },
      }
    ),
    UserModel.updateMany(
      { another_device_expires_at: { $ne: null, $lte: now } },
      {
        $set: {
          another_device_code: null,
          another_device_expires_at: null,
          pending_device: null,
        },
      }
    ),
  ]);

  const otpSentResult = await UserModel.updateMany(
    {
      otp_last_sent_at: { $lt: new Date(now.getTime() - 30 * DAY_MS) },
      passcode: null,
      another_device_code: null,
    },
    { $set: { otp_last_sent_at: null } }
  );

  return {
    expired_passcodes_cleared: passcodeResult.modifiedCount || 0,
    expired_device_codes_cleared: deviceResult.modifiedCount || 0,
    stale_otp_timestamps_cleared: otpSentResult.modifiedCount || 0,
  };
}

export async function closeExpiredInvitations(now = new Date()) {
  const result = await JobInvitationModel.updateMany(
    {
      status: { $in: ["sent", "seen"] },
      expires_at: { $ne: null, $lte: now },
    },
    {
      $set: {
        status: "expired",
        responded_at: now,
      },
    }
  );

  return { expired_invitations_closed: result.modifiedCount || 0 };
}

export async function pruneOperationalData(now = new Date()) {
  const [
    searchHistory,
    emailLogs,
    analyticsEvents,
    readNotifications,
    unreadNotifications,
    invitations,
  ] = await Promise.all([
    deleteOlderThan(SearchHistoryModel, {}, now, "SEARCH_HISTORY_RETENTION_DAYS", 180),
    deleteOlderThan(EmailLogModel, {}, now, "EMAIL_LOG_RETENTION_DAYS", 365),
    deleteOlderThan(AnalyticsEventModel, {}, now, "ANALYTICS_EVENT_RETENTION_DAYS", 400),
    deleteOlderThan(NotificationModel, { read: true }, now, "READ_NOTIFICATION_RETENTION_DAYS", 365),
    deleteOlderThan(NotificationModel, { read: false }, now, "UNREAD_NOTIFICATION_RETENTION_DAYS", 730),
    deleteOlderThan(
      JobInvitationModel,
      { status: { $in: ["expired", "declined", "cancelled"] } },
      now,
      "JOB_INVITATION_RETENTION_DAYS",
      730
    ),
  ]);

  return {
    old_search_history_deleted: searchHistory.deletedCount,
    old_email_logs_deleted: emailLogs.deletedCount,
    old_analytics_events_deleted: analyticsEvents.deletedCount,
    old_read_notifications_deleted: readNotifications.deletedCount,
    old_unread_notifications_deleted: unreadNotifications.deletedCount,
    old_closed_invitations_deleted: invitations.deletedCount,
  };
}

export async function runDataRetentionCleanup(now = new Date()) {
  const [verification, invitations, pruning] = await Promise.all([
    clearExpiredUserVerificationState(now),
    closeExpiredInvitations(now),
    pruneOperationalData(now),
  ]);

  return {
    ...verification,
    ...invitations,
    ...pruning,
  };
}

export default {
  clearExpiredUserVerificationState,
  closeExpiredInvitations,
  pruneOperationalData,
  runDataRetentionCleanup,
};
