import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.SEARCH_HISTORY_RETENTION_DAYS = "30";
process.env.EMAIL_LOG_RETENTION_DAYS = "30";
process.env.ANALYTICS_EVENT_RETENTION_DAYS = "30";
process.env.READ_NOTIFICATION_RETENTION_DAYS = "30";
process.env.UNREAD_NOTIFICATION_RETENTION_DAYS = "30";
process.env.JOB_INVITATION_RETENTION_DAYS = "30";

const objectId = () => new mongoose.Types.ObjectId();

function userSeed(suffix, overrides = {}) {
  return {
    first_name: "Retention",
    last_name: suffix,
    email: `retention.${suffix}@example.com`,
    gender: "female",
    role_id: objectId(),
    password: "not-used",
    status: true,
    phone: `+155501${suffix}`,
    phone_e164: `+155501${suffix}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `55501${suffix}`,
    ...overrides,
  };
}

let mongo;

try {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { serverSelectionTimeoutMS: 10000 });

  const {
    AnalyticsEventModel,
    EmailLogModel,
    JobInvitationModel,
    NotificationModel,
    SearchHistoryModel,
    UserModel,
  } = await import("../models/index.js");
  const { runDataRetentionCleanup } = await import("../jobs/dataRetention.jobs.js");

  await Promise.all([
    AnalyticsEventModel.syncIndexes(),
    EmailLogModel.syncIndexes(),
    JobInvitationModel.syncIndexes(),
    NotificationModel.syncIndexes(),
    SearchHistoryModel.syncIndexes(),
  ]);

  const now = new Date("2026-06-28T12:00:00.000Z");
  const oldDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const expiredAt = new Date(now.getTime() - 60 * 1000);
  const freshExpiry = new Date(now.getTime() + 60 * 60 * 1000);

  const [expiredUser, freshUser, invitationUser] = await UserModel.create([
    userSeed("1001", {
      passcode: "12345",
      passcode_active: true,
      passcode_attempts: 4,
      can_update_password: true,
      passcode_expires_at: expiredAt,
      otp_last_sent_at: oldDate,
      another_device_code: "54321",
      another_device_expires_at: expiredAt,
      pending_device: {
        brand: "Test",
        model_name: "Expired",
        is_device: true,
      },
    }),
    userSeed("1002", {
      passcode: "22222",
      passcode_active: true,
      passcode_attempts: 1,
      passcode_expires_at: freshExpiry,
      another_device_code: "33333",
      another_device_expires_at: freshExpiry,
      pending_device: {
        brand: "Test",
        model_name: "Fresh",
        is_device: true,
      },
    }),
    userSeed("1003"),
  ]);

  await SearchHistoryModel.create([
    { user_id: expiredUser._id, query: "old", createdAt: oldDate, updatedAt: oldDate },
    { user_id: freshUser._id, query: "recent", createdAt: recentDate, updatedAt: recentDate },
  ]);

  await EmailLogModel.create([
    { recipientEmail: "old@example.com", createdAt: oldDate, updatedAt: oldDate },
    { recipientEmail: "recent@example.com", createdAt: recentDate, updatedAt: recentDate },
  ]);

  await AnalyticsEventModel.create([
    { event: "currency_selected", group: "global", createdAt: oldDate, updatedAt: oldDate },
    { event: "currency_selected", group: "global", createdAt: recentDate, updatedAt: recentDate },
  ]);

  await NotificationModel.create([
    { user_id: expiredUser._id, title: "old read", body: "body", read: true, createdAt: oldDate, updatedAt: oldDate },
    { user_id: expiredUser._id, title: "old unread", body: "body", read: false, createdAt: oldDate, updatedAt: oldDate },
    { user_id: freshUser._id, title: "recent read", body: "body", read: true, createdAt: recentDate, updatedAt: recentDate },
  ]);

  const closedOldInvitation = await JobInvitationModel.create({
    company_id: objectId(),
    job_id: objectId(),
    employee_id: objectId(),
    user_id: invitationUser._id,
    sent_by: invitationUser._id,
    status: "declined",
    expires_at: oldDate,
    createdAt: oldDate,
    updatedAt: oldDate,
  });

  const activeExpiredInvitation = await JobInvitationModel.create({
    company_id: objectId(),
    job_id: objectId(),
    employee_id: objectId(),
    user_id: invitationUser._id,
    sent_by: invitationUser._id,
    status: "sent",
    expires_at: expiredAt,
    createdAt: recentDate,
    updatedAt: recentDate,
  });

  const result = await runDataRetentionCleanup(now);

  const cleanedUser = await UserModel.findById(expiredUser._id).lean();
  assert.equal(cleanedUser.passcode, null, "expired passcode should be cleared without deleting user");
  assert.equal(cleanedUser.passcode_active, false);
  assert.equal(cleanedUser.passcode_attempts, 0);
  assert.equal(cleanedUser.can_update_password, false);
  assert.equal(cleanedUser.another_device_code, null);
  assert.equal(cleanedUser.pending_device, null);
  assert.equal(cleanedUser.otp_last_sent_at, null);

  const untouchedUser = await UserModel.findById(freshUser._id).lean();
  assert.equal(untouchedUser.passcode, "22222", "fresh passcode should remain");
  assert.equal(untouchedUser.another_device_code, "33333", "fresh device verification should remain");

  assert.equal(await SearchHistoryModel.countDocuments({ query: "old" }), 0);
  assert.equal(await SearchHistoryModel.countDocuments({ query: "recent" }), 1);
  assert.equal(await EmailLogModel.countDocuments({ recipientEmail: "old@example.com" }), 0);
  assert.equal(await EmailLogModel.countDocuments({ recipientEmail: "recent@example.com" }), 1);
  assert.equal(await AnalyticsEventModel.countDocuments({ createdAt: oldDate }), 0);
  assert.equal(await AnalyticsEventModel.countDocuments({ createdAt: recentDate }), 1);
  assert.equal(await NotificationModel.countDocuments({ title: /^old/ }), 0);
  assert.equal(await NotificationModel.countDocuments({ title: "recent read" }), 1);
  assert.equal(await JobInvitationModel.countDocuments({ _id: closedOldInvitation._id }), 0);

  const closedActiveInvitation = await JobInvitationModel.findById(activeExpiredInvitation._id).lean();
  assert.equal(closedActiveInvitation.status, "expired", "sent expired invitations should close before pruning");

  assert.ok(result.expired_passcodes_cleared >= 1);
  assert.ok(result.expired_device_codes_cleared >= 1);
  assert.ok(result.old_search_history_deleted >= 1);
  assert.ok(result.expired_invitations_closed >= 1);

  console.log("Data-retention contract verified for TTL indexes, OTP cleanup, invitation expiry, and operational pruning.");
} finally {
  await mongoose.connection.close(false).catch(() => {});
  if (mongo) await mongo.stop();
}
