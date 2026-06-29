import mongoose from "mongoose";
import {
  EmployeeModel,
  JobAlertLogModel,
  SavedSearchModel,
  jobsModel,
} from "../../models/index.js";
import { sendCommunicationEvent } from "../communication/communication.service.js";

const { Types } = mongoose;

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const objectId = (value) => (isObjectId(value) ? new Types.ObjectId(String(value)) : null);
const escapeRegex = (value) => cleanText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const boolOrNull = (value) => {
  if (value === true || value === false) return value;
  const text = cleanText(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return null;
};
const numberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const normalizeFilters = (input = {}) => ({
  keyword: cleanText(input.keyword || input.q || input.search),
  city: cleanText(input.city),
  country: cleanText(input.country),
  category: cleanText(input.category),
  job_type_id: objectId(input.job_type_id),
  work_mode_id: objectId(input.work_mode_id),
  experience_level_id: objectId(input.experience_level_id),
  salary_min: numberOrNull(input.salary_min),
  salary_max: numberOrNull(input.salary_max),
  currency_code: cleanText(input.currency_code).toUpperCase(),
  is_remote: boolOrNull(input.is_remote),
  is_for_students: boolOrNull(input.is_for_students),
  is_for_fresh_graduates: boolOrNull(input.is_for_fresh_graduates),
  company_id: objectId(input.company_id),
});

export const normalizeChannels = (input = {}) => ({
  in_app: input.in_app === false ? false : true,
  push: input.push === false ? false : true,
  email: input.email === true,
  sms: input.sms === true,
  manual_whatsapp: input.manual_whatsapp === true,
});

export const serializeSavedSearch = (search = {}) => ({
  id: String(search._id || search.id || ""),
  user_id: search.user_id ? String(search.user_id?._id || search.user_id) : "",
  employee_id: search.employee_id ? String(search.employee_id?._id || search.employee_id) : null,
  name: search.name || "",
  scope: search.scope || "seeker",
  filters: search.filters || {},
  frequency: search.frequency || "daily",
  channels: search.channels || {},
  is_active: search.is_active !== false,
  last_checked_at: search.last_checked_at || null,
  last_sent_at: search.last_sent_at || null,
  created_from: search.created_from || "search",
  legacy_alert_id: search.legacy_alert_id || "",
});

export const serializeAlertLog = (log = {}) => ({
  id: String(log._id || log.id || ""),
  saved_search_id: log.saved_search_id ? String(log.saved_search_id?._id || log.saved_search_id) : "",
  user_id: log.user_id ? String(log.user_id?._id || log.user_id) : "",
  job_id: log.job_id ? String(log.job_id?._id || log.job_id) : "",
  channel: log.channel || "in_app",
  status: log.status || "queued",
  reason: log.reason || "",
  sent_at: log.sent_at || null,
  createdAt: log.createdAt || null,
});

export const resolveEmployeeForUser = async (userId) => {
  if (!userId) return null;
  return EmployeeModel.findOne({ user_id: userId }).sort({ updatedAt: -1 }).lean();
};

const migrationLookup = (userId, employee, alert) => ({
  user_id: userId,
  employee_id: employee._id,
  created_from: "migration",
  legacy_alert_id: String(alert._id || `${alert.keyword || ""}:${(alert.countries || []).join(",")}`),
});

export const migrateEmployeeJobAlertsForUser = async ({ userId, employee = null, scope = "seeker" }) => {
  const profile = employee || (await resolveEmployeeForUser(userId));
  const alerts = Array.isArray(profile?.job_alerts) ? profile.job_alerts : [];
  if (!userId || !profile?._id || !alerts.length) return { migrated: 0 };

  let migrated = 0;
  for (const alert of alerts) {
    const legacyId = String(alert._id || `${alert.keyword || ""}:${(alert.countries || []).join(",")}`);
    if (!legacyId) continue;
    const existing = await SavedSearchModel.findOne(migrationLookup(userId, profile, alert)).lean();
    if (existing) continue;
    const countries = Array.isArray(alert.countries) ? alert.countries.map(cleanText).filter(Boolean) : [];
    await SavedSearchModel.create({
      user_id: userId,
      employee_id: profile._id,
      name: cleanText(alert.keyword) || "Migrated job alert",
      scope,
      filters: normalizeFilters({
        keyword: alert.keyword,
        country: countries[0] || "",
        job_type_id: alert.job_type_id,
        work_mode_id: alert.work_mode_id,
      }),
      frequency: alert.is_active === false ? "off" : "daily",
      channels: normalizeChannels({ in_app: true, push: true }),
      is_active: alert.is_active !== false,
      created_from: "migration",
      legacy_alert_id: legacyId,
    });
    migrated += 1;
  }
  return { migrated };
};

export const savedSearchFilterForUser = (userId) => ({ user_id: userId });

export const buildJobQueryForSavedSearch = (search = {}, { since = null } = {}) => {
  const filters = search.filters || {};
  const query = {
    status: true,
    is_accepted: true,
    publish_status: "published",
    deleted_at: null,
  };
  if (since) query.createdAt = { $gt: since };
  if (filters.city) query.$or = [{ city: new RegExp(escapeRegex(filters.city), "i") }, { cities: filters.city }];
  if (filters.country) query.countries = filters.country;
  if (filters.job_type_id) query.job_type_id = filters.job_type_id;
  if (filters.work_mode_id) query.work_mode_id = filters.work_mode_id;
  if (filters.experience_level_id) query.experience_level_id = filters.experience_level_id;
  if (filters.company_id) query.company_id = filters.company_id;
  if (filters.currency_code) query["salary.currency_code"] = filters.currency_code;
  if (filters.salary_min !== null && filters.salary_min !== undefined) {
    query["salary.max"] = { ...(query["salary.max"] || {}), $gte: filters.salary_min };
  }
  if (filters.salary_max !== null && filters.salary_max !== undefined) {
    query["salary.min"] = { ...(query["salary.min"] || {}), $lte: filters.salary_max };
  }
  if (filters.is_remote !== null && filters.is_remote !== undefined) query.is_remote = filters.is_remote;
  if (filters.is_for_students !== null && filters.is_for_students !== undefined) {
    query.is_for_students = filters.is_for_students;
  }
  if (filters.is_for_fresh_graduates !== null && filters.is_for_fresh_graduates !== undefined) {
    query.is_for_fresh_graduates = filters.is_for_fresh_graduates;
  }

  const keyword = cleanText(filters.keyword || filters.category);
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    const keywordOr = [
      { job_name: regex },
      { description: regex },
      { job_keywords: regex },
      { keywords_norm: regex },
      { "search_index.text_norm": regex },
      { "search_index.title_norm": regex },
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: keywordOr }];
      delete query.$or;
    } else {
      query.$or = keywordOr;
    }
  }

  return query;
};

const alertIntervalMs = (frequency = "daily") => {
  if (frequency === "instant") return 5 * 60 * 1000;
  if (frequency === "weekly") return 7 * 24 * 60 * 60 * 1000;
  if (frequency === "daily") return 24 * 60 * 60 * 1000;
  return Infinity;
};

export const isSavedSearchDue = (search = {}, now = new Date()) => {
  if (search.is_active === false || search.frequency === "off") return false;
  if (!search.last_checked_at) return true;
  return now.getTime() - new Date(search.last_checked_at).getTime() >= alertIntervalMs(search.frequency);
};

export const runSavedSearchAlertsForSearch = async (searchOrId, { limit = 20, since = undefined } = {}) => {
  const search =
    typeof searchOrId === "object" && searchOrId?._id
      ? searchOrId
      : await SavedSearchModel.findById(searchOrId).lean();
  if (!search || search.is_active === false || search.frequency === "off") {
    return { checked: 0, matched: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const checkedAt = new Date();
  const sinceDate = since === undefined
    ? search.last_checked_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : since;
  const jobs = await jobsModel
    .find(buildJobQueryForSavedSearch(search, { since: sinceDate }))
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    let log;
    try {
      const existingLog = await JobAlertLogModel.findOne({
        saved_search_id: search._id,
        user_id: search.user_id,
        job_id: job._id,
        channel: "in_app",
      }).lean();
      if (existingLog) {
        skipped += 1;
        continue;
      }
      log = await JobAlertLogModel.create({
        saved_search_id: search._id,
        user_id: search.user_id,
        job_id: job._id,
        channel: "in_app",
        status: "queued",
      });
    } catch (error) {
      if (error?.code === 11000) {
        skipped += 1;
        continue;
      }
      failed += 1;
      continue;
    }

    if (search.channels?.in_app === false) {
      await JobAlertLogModel.updateOne(
        { _id: log._id },
        { $set: { status: "skipped", reason: "in_app_channel_disabled" } },
      );
      skipped += 1;
      continue;
    }

    try {
      const delivery = await sendCommunicationEvent({
        userId: search.user_id,
        eventKey: "job_alert",
        category: "jobs",
        channels: search.channels,
        templateKey: "job_alert_matching_jobs",
        variables: {
          title: "New job match",
          body: `${job.job_name || "A new job"} matches ${search.name || "your saved search"}.`,
          message: `${job.job_name || "A new job"} matches ${search.name || "your saved search"}.`,
          job_name: job.job_name || "",
          saved_search_name: search.name || "your saved search",
          actionUrl: `/jobs/${job._id}`,
          actionLabel: "View job",
        },
        route: {
          audience: "employee",
          route_key: "job_detail",
          params: { id: String(job._id) },
          data: {
            saved_search_id: String(search._id),
            job_id: String(job._id),
            job_name: job.job_name || "",
          },
        },
      });
      const sentOrQueued = delivery.sent + delivery.queued;
      if (sentOrQueued <= 0) {
        const reason = delivery.results.map((item) => item.reason).filter(Boolean).join("; ") || "communication_skipped";
        await JobAlertLogModel.updateOne(
          { _id: log._id },
          { $set: { status: delivery.failed > 0 ? "failed" : "skipped", reason } },
        );
        if (delivery.failed > 0) failed += 1;
        else skipped += 1;
        continue;
      }
      await JobAlertLogModel.updateOne(
        { _id: log._id },
        { $set: { status: "sent", reason: "", sent_at: new Date() } },
      );
      sent += 1;
    } catch (error) {
      await JobAlertLogModel.updateOne(
        { _id: log._id },
        { $set: { status: "failed", reason: String(error?.message || error) } },
      );
      failed += 1;
    }
  }

  await SavedSearchModel.updateOne(
    { _id: search._id },
    {
      $set: {
        last_checked_at: checkedAt,
        ...(sent > 0 ? { last_sent_at: checkedAt } : {}),
      },
    },
  );

  return { checked: 1, matched: jobs.length, sent, skipped, failed };
};

export const runDueSavedSearchAlerts = async ({ now = new Date(), limit = 20 } = {}) => {
  const searches = await SavedSearchModel.find({
    is_active: true,
    frequency: { $ne: "off" },
  }).lean();
  const due = searches.filter((search) => isSavedSearchDue(search, now));
  const totals = { checked: 0, matched: 0, sent: 0, skipped: 0, failed: 0 };

  for (const search of due) {
    const result = await runSavedSearchAlertsForSearch(search, { limit });
    totals.checked += result.checked;
    totals.matched += result.matched;
    totals.sent += result.sent;
    totals.skipped += result.skipped;
    totals.failed += result.failed;
  }

  return { ...totals, due: due.length };
};

export default {
  buildJobQueryForSavedSearch,
  isSavedSearchDue,
  migrateEmployeeJobAlertsForUser,
  normalizeChannels,
  normalizeFilters,
  resolveEmployeeForUser,
  runDueSavedSearchAlerts,
  runSavedSearchAlertsForSearch,
  savedSearchFilterForUser,
  serializeAlertLog,
  serializeSavedSearch,
};
