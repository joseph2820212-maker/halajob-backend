import mongoose from "mongoose";
import { NotificationPreferenceModel } from "../../models/index.js";

const VALID_LANGS = new Set(["ar", "en"]);
const CHANNEL_KEYS = ["in_app", "push", "email", "sms"];
const CATEGORY_KEYS = ["jobs", "applications", "interviews", "campus", "company", "ai", "system", "marketing"];

export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  channels: Object.freeze({
    in_app: true,
    push: true,
    email: false,
    sms: false,
  }),
  categories: Object.freeze({
    jobs: true,
    applications: true,
    interviews: true,
    campus: true,
    company: true,
    ai: true,
    system: true,
    marketing: false,
  }),
  quiet_hours: Object.freeze({
    enabled: false,
    start: "22:00",
    end: "07:00",
    timezone: "UTC",
  }),
  lang: "en",
});

const clean = (value = "") => String(value || "").trim();

const objectIdOrNull = (value) => {
  const id = clean(value?._id || value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const parseBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = clean(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return undefined;
};

const withDefaults = (preferences = {}) => ({
  channels: {
    ...DEFAULT_NOTIFICATION_PREFERENCES.channels,
    ...(preferences.channels || {}),
  },
  categories: {
    ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
    ...(preferences.categories || {}),
  },
  quiet_hours: {
    ...DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours,
    ...(preferences.quiet_hours || {}),
  },
  lang: VALID_LANGS.has(preferences.lang) ? preferences.lang : DEFAULT_NOTIFICATION_PREFERENCES.lang,
});

export const normalizeNotificationPreferences = (preferences = {}) => {
  const merged = withDefaults(preferences);
  return {
    user_id: preferences.user_id,
    channels: merged.channels,
    categories: merged.categories,
    quiet_hours: merged.quiet_hours,
    lang: merged.lang,
    updated_by: preferences.updated_by || null,
    createdAt: preferences.createdAt,
    updatedAt: preferences.updatedAt,
  };
};

const mergeBooleanObject = (base, source, allowedKeys) => {
  const output = { ...base };
  if (!source || typeof source !== "object" || Array.isArray(source)) return output;
  allowedKeys.forEach((key) => {
    const parsed = parseBool(source[key]);
    if (parsed !== undefined) output[key] = parsed;
  });
  return output;
};

const normalizeQuietHoursPatch = (current = {}, source = {}) => {
  const output = { ...DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours, ...current };
  if (!source || typeof source !== "object" || Array.isArray(source)) return output;

  const enabled = parseBool(source.enabled);
  if (enabled !== undefined) output.enabled = enabled;
  if (source.start !== undefined) output.start = clean(source.start) || output.start;
  if (source.end !== undefined) output.end = clean(source.end) || output.end;
  if (source.timezone !== undefined) output.timezone = clean(source.timezone) || output.timezone;
  return output;
};

export const normalizePreferencePatch = (body = {}, current = {}) => {
  const base = withDefaults(current);
  const next = {
    channels: mergeBooleanObject(base.channels, body.channels, CHANNEL_KEYS),
    categories: mergeBooleanObject(base.categories, body.categories, CATEGORY_KEYS),
    quiet_hours: normalizeQuietHoursPatch(base.quiet_hours, body.quiet_hours),
    lang: base.lang,
  };

  CHANNEL_KEYS.forEach((key) => {
    const aliases = [key, `${key}_enabled`];
    aliases.forEach((alias) => {
      const parsed = parseBool(body[alias]);
      if (parsed !== undefined) next.channels[key] = parsed;
    });
  });

  CATEGORY_KEYS.forEach((key) => {
    const parsed = parseBool(body[key]);
    if (parsed !== undefined) next.categories[key] = parsed;
  });

  const lang = clean(body.lang || body.language).toLowerCase();
  if (VALID_LANGS.has(lang)) next.lang = lang;

  return next;
};

export const categoryForNotificationEvent = (eventKey = "") => {
  const event = clean(eventKey).toLowerCase();
  if (!event) return "system";
  if (event.startsWith("application_status_") || event.startsWith("job_invitation_")) return "applications";
  if (event.startsWith("interview_")) return "interviews";
  if (event.startsWith("campus_") || event === "event_joined") return "campus";
  if (event.startsWith("company_")) return "company";
  if (event.startsWith("ai_") || event === "ai_result_ready") return "ai";
  if (event.startsWith("job_") || event.startsWith("saved_job_") || event === "new_matching_job") return "jobs";
  if (event.includes("marketing") || event.includes("promotion")) return "marketing";
  return "system";
};

export const getOrCreateNotificationPreferences = async (userId) => {
  const userObjectId = objectIdOrNull(userId);
  if (!userObjectId) {
    const error = new Error("invalid_user_id");
    error.statusCode = 400;
    error.code = "invalid_user_id";
    throw error;
  }

  const preferences = await NotificationPreferenceModel.findOneAndUpdate(
    { user_id: userObjectId },
    {
      $setOnInsert: {
        user_id: userObjectId,
        channels: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels },
        categories: { ...DEFAULT_NOTIFICATION_PREFERENCES.categories },
        quiet_hours: { ...DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours },
        lang: DEFAULT_NOTIFICATION_PREFERENCES.lang,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return normalizeNotificationPreferences(preferences);
};

export const updateNotificationPreferences = async ({ userId, body = {}, actorUserId = null }) => {
  const current = await getOrCreateNotificationPreferences(userId);
  const patch = normalizePreferencePatch(body, current);
  const preferences = await NotificationPreferenceModel.findOneAndUpdate(
    { user_id: objectIdOrNull(userId) },
    {
      $set: {
        channels: patch.channels,
        categories: patch.categories,
        quiet_hours: patch.quiet_hours,
        lang: patch.lang,
        updated_by: objectIdOrNull(actorUserId),
      },
    },
    { new: true, runValidators: true }
  ).lean();

  return normalizeNotificationPreferences(preferences);
};

export const notificationDeliveryDecision = async ({ userId, eventKey = "", push = true, save = true } = {}) => {
  const preferences = await getOrCreateNotificationPreferences(userId);
  const category = categoryForNotificationEvent(eventKey);
  const categoryEnabled = preferences.categories?.[category] !== false;
  const inAppAllowed = Boolean(save && preferences.channels?.in_app !== false && categoryEnabled);
  const pushAllowed = Boolean(push && preferences.channels?.push !== false && categoryEnabled);
  const reason = categoryEnabled ? "" : `category_${category}_disabled`;

  return {
    preferences,
    category,
    in_app: inAppAllowed,
    push: pushAllowed,
    reason: reason || (!inAppAllowed && !pushAllowed ? "notification_disabled" : ""),
  };
};

export default {
  DEFAULT_NOTIFICATION_PREFERENCES,
  categoryForNotificationEvent,
  getOrCreateNotificationPreferences,
  normalizeNotificationPreferences,
  normalizePreferencePatch,
  notificationDeliveryDecision,
  updateNotificationPreferences,
};
