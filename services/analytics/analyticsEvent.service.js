import mongoose from "mongoose";
import { AnalyticsEventModel } from "../../models/index.js";

export const ANALYTICS_EVENT_GROUPS = Object.freeze({
  activation: [
    "signup_completed",
    "login_completed",
    "account_context_switched",
    "profile_completed",
    "notification_opened",
    "career_passport_updated",
    "career_passport_share_enabled",
    "career_passport_share_revoked",
  ],
  ai: [
    "ai_copilot_used",
    "ai_score_generated",
    "ai_cv_rewritten",
    "ai_job_match_viewed",
    "ai_cover_letter_generated",
    "ai_interview_practiced",
    "ai_shortlist_generated",
    "ai_job_draft_generated",
    "ai_hiring_message_generated",
    "ai_job_translation_generated",
    "ai_cv_translation_generated",
  ],
  jobs: [
    "job_viewed",
    "job_saved",
    "job_applied",
    "job_reported",
    "job_trust_marked_safe",
    "job_trust_suspended",
    "job_trust_documents_requested",
    "remote_filter_used",
    "hybrid_filter_used",
  ],
  company: [
    "company_profile_updated",
    "job_created",
    "job_published",
    "candidate_shortlisted",
    "interview_scheduled",
    "cv_exported",
  ],
  campus: [
    "campus_verification_started",
    "campus_verification_approved",
    "event_joined",
    "readiness_viewed",
  ],
  global: [
    "country_changed",
    "currency_selected",
    "job_translated",
    "cv_translated",
  ],
});

export const ANALYTICS_EVENTS = Object.freeze(
  Object.entries(ANALYTICS_EVENT_GROUPS).reduce((acc, [group, events]) => {
    events.forEach((event) => {
      acc[event] = group;
    });
    return acc;
  }, {})
);

const clean = (value = "") => String(value || "").trim();

const objectIdOrNull = (value) => {
  const id = clean(value?._id || value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const metadataFrom = (value = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value));
};

export const analyticsGroupForEvent = (event) => ANALYTICS_EVENTS[clean(event)] || null;

export const assertSupportedAnalyticsEvent = (event, group = "") => {
  const normalizedEvent = clean(event);
  const inferredGroup = analyticsGroupForEvent(normalizedEvent);
  const normalizedGroup = clean(group).toLowerCase();

  if (!inferredGroup) {
    const error = new Error("unsupported_analytics_event");
    error.statusCode = 422;
    error.code = "unsupported_analytics_event";
    error.supported = ANALYTICS_EVENT_GROUPS;
    throw error;
  }

  if (normalizedGroup && normalizedGroup !== inferredGroup) {
    const error = new Error("analytics_event_group_mismatch");
    error.statusCode = 422;
    error.code = "analytics_event_group_mismatch";
    error.expectedGroup = inferredGroup;
    throw error;
  }

  return { event: normalizedEvent, group: inferredGroup };
};

export const recordAnalyticsEvent = async ({
  req = null,
  event,
  group = "",
  userId = null,
  companyId = null,
  activeContext = null,
  entityType = "other",
  entityId = null,
  jobId = null,
  applicationId = null,
  sessionId = "",
  platform = "",
  appVersion = "",
  metadata = {},
} = {}) => {
  const checked = assertSupportedAnalyticsEvent(event, group);
  const context = activeContext || req?.activeContext || null;

  return AnalyticsEventModel.create({
    event: checked.event,
    group: checked.group,
    user_id: objectIdOrNull(userId || req?.user?._id || req?.user?.id),
    company_id: objectIdOrNull(companyId),
    active_context_id: objectIdOrNull(context?.id || context?._id),
    context_type: clean(context?.context_type),
    entity_type: clean(entityType) || "other",
    entity_id: objectIdOrNull(entityId),
    job_id: objectIdOrNull(jobId),
    application_id: objectIdOrNull(applicationId),
    session_id: clean(sessionId || req?.body?.session_id || req?.headers?.["x-session-id"]),
    platform: clean(platform || req?.body?.platform || req?.headers?.["x-platform"]),
    app_version: clean(appVersion || req?.body?.app_version || req?.headers?.["x-app-version"]),
    ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    user_agent: req?.headers?.["user-agent"] || "",
    metadata: metadataFrom(metadata),
  });
};

export default {
  ANALYTICS_EVENT_GROUPS,
  ANALYTICS_EVENTS,
  analyticsGroupForEvent,
  assertSupportedAnalyticsEvent,
  recordAnalyticsEvent,
};
