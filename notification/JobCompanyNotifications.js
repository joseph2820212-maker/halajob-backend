// notifications/jobs.js
import { sendToTokens } from "./SendNotification.js";
import tt from "./Translate.js";
import { FcmTokenModel, NotificationModel } from "../models/index.js";
import screen from "./screen.js";
import { Types, isValidObjectId } from "mongoose";

// قسّم مصفوفة إلى دفعات
const chunk = (arr, n = 500) => {
  if (!Array.isArray(arr) || n <= 0) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

// علِّم التوكنات غير الصالحة كموقوفة
async function revokeBadTokens(tokens = [], responses = []) {
  const BAD = [
    "messaging/registration-token-not-registered",
    "messaging/invalid-argument",
  ];
  const badTokens = responses
    .map((r, i) => (!r?.success && BAD.includes(r?.error?.code)) ? tokens[i] : null)
    .filter(Boolean);

  if (!badTokens.length) return 0;

  await FcmTokenModel.updateMany(
    { token: { $in: badTokens } },
    { $set: { revoked: true, last_error: "token_invalid" } }
  );
  return badTokens.length;
}

// خريطة الأنواع ↔ مفاتيح الترجمة
const TYPE_MAP = {
  job_saved:    { i18n: "job_saved",    screen: "employer_applicants" },
  job_created:  { i18n: "job_created",  screen: "employer_applicants" },
  job_reviewed: { i18n: "job_reviewed", screen: "employer_applicants" },
  job_applied:  { i18n: "job_applied",  screen: "employer_applicants" },
  job_updated:  { i18n: "job_updated",  screen: "employer_applicants" },
  job_deleted:  { i18n: "job_deleted",  screen: "employer_applicants" },
  job_stopped:  { i18n: "job_stopped",  screen: "employer_applicants" },
};

// مُرسِل عام
async function notifyJob(type, job = {}) {
  try {
    const cfg = TYPE_MAP[type];
    if (!cfg) return { success: 0, failure: 0, note: `unknown type: ${type}` };

    // 1) تطبيع المعرّف من أكثر من اسم
    const rawUserId =
      job.user_id || job.user || job.created_by || job.owner_id || null;
    if (!rawUserId) return { success: 0, failure: 0, note: "no user_id" };

    const userId = isValidObjectId(rawUserId)
      ? new Types.ObjectId(String(rawUserId))
      : rawUserId;

    // 2) اجلب التوكنات بالدعم لكلا الحقلين user / user_id
    const docs = await FcmTokenModel.find({
      $or: [{ user: userId }, { user_id: userId }],
      revoked: false,
    })
      .select("token _id")
      .lean();
    const tokens = docs.map((d) => d.token);

    // 3) خزّن الإشعار بالحقل المطلوب من المخطط (user_id)
    const title = tt("ar", cfg.i18n);
    const body = job.title ?? job.job_name ?? "";
    const scr = screen(cfg.screen);
    const jobId = job._id ?? null;

    const notif = await NotificationModel.create({
      user_id: userId,              // <-- كان user
      title,
      body,
      screen: scr,
      order_id: jobId,
      type,
      data: { job_id: jobId },
    });

    if (!tokens.length) {
      return {
        success: 0,
        failure: 0,
        revoked: 0,
        saved: notif?._id,
        note: "no tokens",
      };
    }

    let success = 0,
      failure = 0,
      revoked = 0;

    for (const batch of chunk(tokens, 500)) {
      const res = await sendToTokens(batch, {
        title,
        body,
        screen: scr,
        id: jobId,
        extraData: { order_id: jobId },
      });

      success += res?.successCount ?? 0;
      failure += res?.failureCount ?? 0;
      revoked += await revokeBadTokens(batch, res?.responses ?? []);
    }

    return { success, failure, revoked, saved: notif?._id };
  } catch (err) {
    console.error(`notifyJob(${type}) error:`, err);
    return { success: 0, failure: 0, error: String(err?.message || err) };
  }
}

// واجهات نوعية رفيعة
export const job_seeker_saved_notification = (job) => notifyJob("job_saved", job);
export const Job_created_notification      = (job) => notifyJob("job_created", job);
export const job_reviewed_notification     = (job) => notifyJob("job_reviewed", job);
export const job_applied_notification      = (job) => notifyJob("job_applied", job);
export const job_updated_notification      = (job) => notifyJob("job_updated", job);
export const job_deleted_notification      = (job) => notifyJob("job_deleted", job);
export const job_stopped_notification      = (job) => notifyJob("job_stopped", job);
export const job_rated_notification        = (job) => notifyJob("job_rated", job);

export default {
  job_seeker_saved_notification,
  Job_created_notification,
  job_reviewed_notification,
  job_applied_notification,
  job_updated_notification,
  job_deleted_notification,
  job_stopped_notification,
  job_rated_notification,
};
