// notifications/jobs.js
import { sendToTokens } from "./SendNotification.js";
import tt from "./Translate.js";
import { FcmTokenModel, NotificationModel } from "../models/index.js";
import screen from "./screen.js";

// تقسيم دفعات
const chunk = (arr, n = 500) => {
  if (!Array.isArray(arr) || n <= 0) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

// تعليم التوكنات السيئة كموقوفة
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

// حالات الطلب
const StatusTypeMap = {
  waiting:     { i18n: "job_waiting",     screen: "employer_applicants" },
  accepted:    { i18n: "job_accepted",    screen: "employer_applicants" },
  rejected:    { i18n: "job_rejected",    screen: "employer_applicants" },
  auto_cancel: { i18n: "job_auto_cancel", screen: "employer_applicants" },
};

// أنواع المقابلات
const InterviewTypeMap = {
  is_online:    { i18n: "meet_in_online", screen: "employer_applicants" },
  is_on_app:    { i18n: "meet_on_app",     screen: "employer_applicants" },
  is_in_office: { i18n: "meet_in_office",  screen: "employer_applicants" },
};

// إرسال إشعار حالة الطلب
export async function changeJobStatus(status, job = {}) {
  try {
    const cfg = StatusTypeMap[status];
    if (!cfg) return { success: 0, failure: 0, note: `unknown status: ${status}` };

    const user_id = job.user_id;
    if (!user_id) return { success: 0, failure: 0, note: "no user_id" };

    const docs = await FcmTokenModel.find({ user: user_id, revoked: false })
      .select("token _id").lean();
    const tokens = docs.map(d => d.token);

    const title = tt(cfg.i18n);
    const body  = job.title ?? job.job_name ?? "";
    const scr   = screen(cfg.screen);
    const jobId = job._id ?? null;

    const notif = await NotificationModel.create({
      user_id,
      title,
      body,
      screen: scr,
      order_id: jobId,
      type: status,
      data: { job_id: jobId },
    });

    if (!tokens.length) {
      return { success: 0, failure: 0, revoked: 0, saved: notif?._id, note: "no tokens" };
    }

    let success = 0, failure = 0, revoked = 0;

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
    console.error(`changeJobStatus(${status}) error:`, err);
    return { success: 0, failure: 0, error: String(err?.message || err) };
  }
}

// إرسال إشعار تفاصيل المقابلة
export async function SendInterViewNotification(job = {}) {
  try {
    const user_id = job.user_id;
    if (!user_id) return { success: 0, failure: 0, note: "no user_id" };

    const docs = await FcmTokenModel.find({ user: user_id, revoked: false })
      .select("token _id").lean();
    const tokens = docs.map(d => d.token);

    // حدّد نوع المقابلة حسب الأعلام الممررة
    const kind =
      job.is_in_office ? "is_in_office" :
      job.is_on_app    ? "is_on_app"    :
      job.is_online    ? "is_online"    : "is_online"; // افتراضي

    const cfg = InterviewTypeMap[kind];
    const title = tt(cfg.i18n);
    const body  = job.title ?? job.job_name ?? "";
    const scr   = screen(cfg.screen);
    const jobId = job.job_id ?? job._id ?? null;

    const payloadData = {
      job_id: jobId,
      application_id: job.application_id ?? null,
      meet_link: job.meet_link ?? "",
      date: job.date ? String(new Date(job.date).toISOString()) : "",
      is_online: !!job.is_online,
      is_on_app: !!job.is_on_app,
      is_in_office: !!job.is_in_office,
      office_address: job.office_address ?? "",
      note: job.note ?? "",
      longitude: job.longitude != null ? String(job.longitude) : "",
      latitude: job.latitude != null ? String(job.latitude) : "",
    };

    const notif = await NotificationModel.create({
      user_id,
      title,
      body,
      screen: scr,
      order_id: jobId,
      type: "interview",
      data: payloadData,
    });

    if (!tokens.length) {
      return { success: 0, failure: 0, revoked: 0, saved: notif?._id, note: "no tokens" };
    }

    let success = 0, failure = 0, revoked = 0;

    for (const batch of chunk(tokens, 500)) {
      const res = await sendToTokens(batch, {
        title,
        body,
        screen: scr,
        id: jobId,
        extraData: payloadData,
      });
      success += res?.successCount ?? 0;
      failure += res?.failureCount ?? 0;
      revoked += await revokeBadTokens(batch, res?.responses ?? []);
    }

    return { success, failure, revoked, saved: notif?._id };
  } catch (err) {
    console.error("SendInterViewNotification error:", err);
    return { success: 0, failure: 0, error: String(err?.message || err) };
  }
}

export default { changeJobStatus, SendInterViewNotification };
