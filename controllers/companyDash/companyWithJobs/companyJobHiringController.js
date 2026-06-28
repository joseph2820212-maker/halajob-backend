import mongoose from "mongoose";
import ExcelJS from "exceljs";
import {
  ApplicationStatusHistoryModel,
  EmployeeModel,
  InterviewModel,
  JobInvitationModel,
  UserApplyingJobModel,
  UserReviewJobModel,
  jobsModel,
} from "../../../models/index.js";

import {
  fail,
  getCompanyUserIdOrFail,
  normalizeApplication,
  normalizeInterview,
  paginate,
  success,
} from "../../../helper/companyDash/companyDashHelpers.js";

import {
  collectApplicationCvEntries,
  createZipBuffer,
  findCvEntry,
  makeZipEntryName,
  sanitizeCvEntries,
  sendCvFile,
} from "../../../helper/companyDash/secureCvDownloadHelpers.js";

import {
  APPLICATION_STATUSES,
  INTERVIEW_STATUSES,
  INVITATION_STATUSES,
  buildApplicationsFilter,
  buildApplicationsSort,
  buildInterviewPayload,
  buildInterviewsFilter,
  buildInvitationsFilter,
  cleanText,
  ensureObjectId,
  findEmployeeForInvitationOrFail,
  getOwnedApplicationOrFail,
  getOwnedInterviewOrFail,
  getOwnedInvitationOrFail,
  getOwnedJobOrFail,
  normalizeApplicant,
  normalizeCompanyInvitation,
  normalizeCompanyJobActivitySummary,
  normalizeCompanyReviewItem,
  paginateApplications,
  populateApplicationQuery,
  toDateOrNull,
  toNumber,
} from "../../../helper/companyDash/companyJobHiringHelpers.js";
import {
  SendInterViewNotification,
  SendInterviewCancelledNotification,
  SendInterviewUpdatedNotification,
  SendJobInvitationCancelledNotification,
  SendJobInvitationNotification,
  changeJobStatus,
} from "../../../notification/JobEmployeeNotifications.js";

import {
  checkCompanyFeature,
  recordCompanyUsage,
} from "../../../services/subscriptions/companySubscription.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";


const failSubscription = (res, check) => fail(res, check.message || "subscription_not_allowed", check.status || 403, {
  feature: check.feature,
  metric: check.metric,
  limit: check.limit,
  used: check.used,
  requested: check.requested,
});

const recordCompanyHiringAnalytics = ({
  req,
  event,
  companyData,
  entityType = "application",
  entityId = null,
  jobId = null,
  applicationId = null,
  metadata = {},
}) => {
  if (!companyData?.company?._id) return;
  recordAnalyticsEvent({
    req,
    event,
    userId: companyData.userId,
    companyId: companyData.company._id,
    entityType,
    entityId,
    jobId,
    applicationId,
    metadata,
  }).catch(() => null);
};

const companyActorType = (req) =>
  req.companyAccess?.role === "owner" ? "company_owner" : "company_member";

const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

// This project is deployed on environments that may use a standalone MongoDB server.
// MongoDB transactions require a replica set, so the hiring flow uses safe sequential
// writes instead of session.withTransaction to avoid 500 errors in production.

const normalizeStatusPatch = ({ application, status, body = {} }) => {
  const now = new Date();
  const visibleStatusMap = {
    waiting: "received",
    new: "received",
    screening: "reviewing",
    reviewing: "reviewing",
    shortlisted: "reviewing",
    initial_match: "reviewing",
    not_match: "reviewing",
    contacted: "reviewing",
    interview: "interview_scheduled",
    interview_scheduled: "interview_scheduled",
    interview_completed: "reviewing",
    offer: "accepted",
    accepted: "accepted",
    hired: "accepted",
    rejected: "not_selected",
    auto_cancel: "not_selected",
    withdrawn: "not_selected",
    offer_declined: "not_selected",
    archived: "reviewing",
  };
  const patch = {
    status,
    visible_status: visibleStatusMap[status] || "reviewing",
    status_changed_at: now,
    last_activity_at: now,
  };

  if (application.status === "archived" && status !== "archived") {
    patch.archived_at = null;
    patch.restored_at = now;
  }

  if (status === "archived") {
    patch.archived_at = now;
    patch.archive_reason = cleanText(body.archive_reason || body.reason || body.note || application.archive_reason || "");
  }

  if (status === "rejected" || status === "not_match") {
    patch.rejected_at = now;
    patch.rejection_reason_code = cleanText(body.reason_code || body.rejection_reason_code || "other") || "other";
    patch.rejection_reason = cleanText(body.reason || body.rejection_reason || application.rejection_reason || "");
    patch.internal_rejection_note = cleanText(body.internal_note || body.internal_rejection_note || "");
    patch.candidate_rejection_message = cleanText(body.candidate_message || body.candidate_rejection_message || "");
    patch.rejection_message_visible_to_candidate = [true, "true", "1", 1].includes(body.visible_to_candidate || body.rejection_message_visible_to_candidate);
  }

  if (status === "hired" || status === "accepted") patch.hired_at = application.hired_at || now;
  if (status === "withdrawn" || status === "offer_declined") patch.withdrawn_at = application.withdrawn_at || now;

  return patch;
};

const createStatusHistory = async ({ application, oldStatus, newStatus, companyData, note = "", action = "status_changed", metadata = {}, visibleToCandidate = false, rejectionReasonCode = "" }) => {
  try {
    const [history] = await ApplicationStatusHistoryModel.create([
      {
        application_id: application._id,
        job_id: application.job_id,
        company_id: application.company_id,
        user_id: application.user_id,
        old_status: oldStatus || null,
        new_status: newStatus,
        changed_by: companyData?.userId || null,
        actor_type: "company",
        action,
        note,
        visible_to_candidate: Boolean(visibleToCandidate),
        rejection_reason_code: rejectionReasonCode || "",
        metadata,
      },
    ]);
    return history;
  } catch (error) {
    // History is useful for auditing, but it should never break the primary action
    // (creating an interview, changing status, blocking applicant).
    console.error("application_status_history_error", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      application_id: String(application?._id || ""),
      new_status: newStatus,
    });
    return null;
  }
};

const updateApplicationStatusFields = async ({ application, status, body = {}, extraPatch = {} }) => {
  const patch = { ...normalizeStatusPatch({ application, status, body }), ...extraPatch };
  const result = await UserApplyingJobModel.updateOne(
    { _id: application._id, company_id: application.company_id },
    { $set: patch },
    { runValidators: true }
  );

  if (!result?.matchedCount && !result?.n) {
    const err = new Error("application_status_update_failed");
    err.statusCode = 404;
    throw err;
  }

  Object.assign(application, patch);
};

const parseArrayBody = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    }
  }
  return [value];
};

const parsePlainObjectBody = (value, fallback = {}) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const applicationCvFiles = (application) => sanitizeCvEntries(collectApplicationCvEntries(application));

const normalizeApplicationWithCvMeta = (application) => {
  const normalized = normalizeApplication(application);
  const cvFiles = applicationCvFiles(application);
  return {
    ...normalized,
    has_cv: cvFiles.length > 0,
    cv_files_count: cvFiles.length,
    cv_files: cvFiles,
  };
};

const normalizeApplicantWithCvMeta = (application) => {
  const normalized = normalizeApplicant(application);
  const cvFiles = applicationCvFiles(application);
  return {
    ...normalized,
    application: {
      ...normalized.application,
      has_cv: cvFiles.length > 0,
      cv_files_count: cvFiles.length,
      cv_files: cvFiles,
    },
    cv_files_count: cvFiles.length,
    cv_files: cvFiles,
  };
};

const applicationExportRow = (application, index = 1) => {
  const applicant = application.user_id || {};
  const employee = application.employee_id || {};
  const answers = (application.answers || [])
    .map((item, answerIndex) => `${answerIndex + 1}. ${item.question || ""}: ${Array.isArray(item.answer) ? item.answer.join(", ") : item.answer ?? ""}`)
    .join("\n");

  return {
    "#": index,
    application_id: String(application._id || ""),
    job_name: application.job_id?.job_name || "",
    status: application.status || "",
    applied_at: application.createdAt ? new Date(application.createdAt).toISOString() : "",
    applicant_name: [applicant.first_name || application.first_name, applicant.mid_name, applicant.last_name || application.last_name].filter(Boolean).join(" "),
    email: application.email || applicant.email || "",
    phone: [application.phone_code || applicant.phone_code, application.phone_national || applicant.phone_national].filter(Boolean).join(" "),
    candidate_stage: employee.candidate_stage || "",
    experience_years: employee.experience_years ?? "",
    profile_headline: employee.profile_headline || "",
    current_job_title: employee.current_job_title || "",
    cover_letter: application.cover_letter || "",
    answers,
    cv_files_count: applicationCvFiles(application).length,
  };
};

const buildBulkApplicationsFilter = async (req, res, companyData) => {
  const body = req.body || {};
  const rawIds = parseArrayBody(
    body.application_ids ||
      body.applicationIds ||
      body.applications ||
      body.ids ||
      req.query.application_ids ||
      req.query.applicationIds ||
      req.query.ids
  );
  const ids = rawIds.map((id) => String(id?._id || id || "").trim()).filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (rawIds.length && ids.length !== rawIds.length) {
    fail(res, "invalid_application_ids", 400);
    return null;
  }

  if (ids.length) {
    return { _id: { $in: ids }, company_id: companyData.company._id };
  }

  const filter = buildApplicationsFilter(companyData.company._id, { ...req.query, ...body });
  const jobId = body.job_id || body.jobId || req.query.job_id || req.query.jobId || req.params.jobId;
  if (jobId) {
    const job = await getOwnedJobOrFail(req, res, companyData.company._id, jobId, "_id");
    if (!job) return null;
    filter.job_id = job._id;
  }

  return filter;
};

export const getHiringSummary = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const companyId = companyData.company._id;
    const now = new Date();

    const [applications, waiting, interview, offer, accepted, rejected, interviews, upcomingInterviews, invitations, sentInvitations, acceptedInvitations] = await Promise.all([
      UserApplyingJobModel.countDocuments({ company_id: companyId }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["waiting", "new", "reviewing"] } }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["interview", "interview_scheduled", "interview_completed"] } }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["offer", "initial_match"] } }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["accepted", "hired"] } }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["rejected", "not_match"] } }),
      InterviewModel.countDocuments({ company_id: companyId }),
      InterviewModel.countDocuments({ company_id: companyId, start_at: { $gte: now }, status: { $in: ["scheduled", "rescheduled"] } }),
      JobInvitationModel.countDocuments({ company_id: companyId }),
      JobInvitationModel.countDocuments({ company_id: companyId, status: "sent" }),
      JobInvitationModel.countDocuments({ company_id: companyId, status: "accepted" }),
    ]);

    return success(
      res,
      normalizeCompanyJobActivitySummary({
        applications,
        waiting,
        interview,
        offer,
        accepted,
        rejected,
        interviews,
        upcomingInterviews,
        invitations,
        sentInvitations,
        acceptedInvitations,
      }),
      "company_hiring_summary"
    );
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildApplicationsFilter(companyData.company._id, req.query);

    if (req.params.jobId) {
      const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.params.jobId, "_id");
      if (!job) return;
      filter.job_id = job._id;
    }

    const result = await paginateApplications(req, filter, buildApplicationsSort(req.query));
    return success(res, result.items.map(normalizeApplicationWithCvMeta), "applications", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getApplicants = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildApplicationsFilter(companyData.company._id, req.query);

    if (req.params.jobId) {
      const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.params.jobId, "_id");
      if (!job) return;
      filter.job_id = job._id;
    }

    const result = await paginateApplications(req, filter, buildApplicationsSort(req.query));
    return success(res, result.items.map(normalizeApplicantWithCvMeta), "applicants", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getApplicationDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!ensureObjectId(res, applicationId, "invalid_application_id")) return;

    const application = await populateApplicationQuery(
      UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id })
    ).lean();

    if (!application) return fail(res, "application_not_found", 404);

    const [interviews, invitation, histories] = await Promise.all([
      InterviewModel.find({ application_id: applicationId, company_id: companyData.company._id }).sort({ start_at: -1 }).lean(),
      JobInvitationModel.findOne({
        job_id: application.job_id?._id || application.job_id,
        user_id: application.user_id?._id || application.user_id,
        company_id: companyData.company._id,
      })
        .sort({ createdAt: -1 })
        .lean(),
      ApplicationStatusHistoryModel.find({ application_id: applicationId, company_id: companyData.company._id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return success(
      res,
      {
        ...normalizeApplicantWithCvMeta(application),
        interviews: interviews.map(normalizeInterview),
        invitation: invitation ? normalizeCompanyInvitation(invitation) : null,
        histories,
      },
      "application_details"
    );
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.params.applicationId);
    if (!application) return;

    const status = cleanText(req.body.status);
    if (!APPLICATION_STATUSES.has(status)) return fail(res, "invalid_application_status", 422);

    const oldStatus = application.status;

    await updateApplicationStatusFields({ application, status, body: req.body });
    await createStatusHistory({
      application,
      oldStatus,
      newStatus: status,
      companyData,
      note: cleanText(req.body.note || req.body.reason || req.body.rejection_reason),
      action: "status_changed",
      visibleToCandidate: application.rejection_message_visible_to_candidate,
      rejectionReasonCode: application.rejection_reason_code,
      metadata: {
        rejection_reason: application.rejection_reason || "",
        archive_reason: application.archive_reason || "",
        candidate_message: application.candidate_rejection_message || "",
      },
    });
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: req.companyAccess?.role === "owner" ? "company_owner" : "company_member",
      action: "application_status_changed",
      entityType: "application",
      entityId: application._id,
      jobId: application.job_id,
      applicationId: application._id,
      oldValue: { status: oldStatus },
      newValue: { status },
      note: cleanText(req.body.note || req.body.reason || ""),
    });

    const job = await jobsModel.findById(application.job_id).select("_id job_name").lean().catch(() => null);
    changeJobStatus(status, {
      user_id: application.user_id,
      application_id: application._id,
      job_id: application.job_id,
      job_name: job?.job_name || "",
    }).catch?.(console.error);
    if (status === "shortlisted") {
      recordCompanyHiringAnalytics({
        req,
        event: "candidate_shortlisted",
        companyData,
        entityId: application._id,
        jobId: application.job_id,
        applicationId: application._id,
        metadata: {
          old_status: oldStatus,
          new_status: status,
        },
      });
    }

    return success(res, normalizeApplication(application), "application_status_updated");
  } catch (error) {
    next(error);
  }
};

export const createInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_schedule_interviews", "interviews", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.body.application_id || req.params.applicationId);
    if (!application) return;

    const { payload, error } = buildInterviewPayload({ body: req.body, companyData, application });
    if (error) return fail(res, error, 422);

    const interview = await InterviewModel.create(payload);

    const oldStatus = application.status;
    await updateApplicationStatusFields({ application, status: "interview_scheduled", body: req.body });

    await createStatusHistory({
      application,
      oldStatus,
      newStatus: "interview_scheduled",
      companyData,
      note: cleanText(req.body.company_note || req.body.note || "interview_scheduled"),
      action: "interview_scheduled",
      metadata: { interview_id: interview._id },
    });
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: req.companyAccess?.role === "owner" ? "company_owner" : "company_member",
      action: "interview_scheduled",
      entityType: "interview",
      entityId: interview._id,
      jobId: application.job_id,
      applicationId: application._id,
      note: cleanText(req.body.company_note || req.body.note || ""),
    });

    const populated = await InterviewModel.findById(interview._id)
      .populate({ path: "job_id", select: "job_name city salary" })
      .populate({ path: "application_id", select: "first_name last_name email phone_code phone_national status" })
      .populate({ path: "employee_user_id", select: "first_name mid_name last_name email image" })
      .lean();

    SendInterViewNotification({
      user_id: application.user_id,
      job_id: application.job_id,
      application_id: application._id,
      interview_id: interview._id,
      job_name: populated?.job_id?.job_name || "",
      meet_link: interview.meet_link,
      start_at: interview.start_at,
      end_at: interview.end_at,
      date: interview.start_at,
      type: interview.type,
      office_address: interview.office_address,
      note: interview.candidate_note || interview.company_note || "",
    }).catch?.(console.error);

    await recordCompanyUsage(companyData.company._id, "interviews", 1);
    recordCompanyHiringAnalytics({
      req,
      event: "interview_scheduled",
      companyData,
      entityType: "interview",
      entityId: interview._id,
      jobId: application.job_id,
      applicationId: application._id,
      metadata: {
        type: interview.type,
        start_at: interview.start_at,
        end_at: interview.end_at,
      },
    });
    return success(res, normalizeInterview(populated || interview), "interview_created", 201);
  } catch (error) {
    next(error);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildInterviewsFilter(companyData.company._id, req.query);

    const result = await paginate(InterviewModel, filter, req, {
      sort: { start_at: req.query.upcoming === "true" ? 1 : -1, _id: -1 },
      populate: [
        { path: "job_id", select: "job_name city salary" },
        { path: "application_id", select: "first_name last_name email phone_code phone_national status" },
        { path: "employee_user_id", select: "first_name mid_name last_name email image" },
      ],
      lean: true,
    });

    return success(res, result.items.map(normalizeInterview), "interviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const interview = await getOwnedInterviewOrFail(req, res, companyData.company._id, req.params.interviewId);
    if (!interview) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, interview.application_id);
    if (!application) return;

    const { payload, error } = buildInterviewPayload({ body: req.body, companyData, application, oldInterview: interview });
    if (error) return fail(res, error, 422);

    const oldInterview = interview.toObject?.() || { ...interview };
    const willReschedule = payload.start_at && String(payload.start_at) !== String(interview.start_at);
    Object.assign(interview, payload);
    if (willReschedule) {
      interview.status = "rescheduled";
      interview.reschedule_count = Number(interview.reschedule_count || 0) + 1;
    }

    await interview.save();

    if (willReschedule) {
      await createStatusHistory({
        application,
        oldStatus: application.status,
        newStatus: application.status,
        companyData,
        note: cleanText(req.body.company_note || req.body.note || "interview_rescheduled"),
        action: "interview_rescheduled",
        metadata: { interview_id: interview._id, start_at: interview.start_at },
      });
    }
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: willReschedule ? "interview_rescheduled" : "interview_updated",
      entityType: "interview",
      entityId: interview._id,
      jobId: interview.job_id,
      applicationId: interview.application_id,
      oldValue: {
        status: oldInterview.status,
        start_at: oldInterview.start_at,
        end_at: oldInterview.end_at,
        type: oldInterview.type,
      },
      newValue: {
        status: interview.status,
        start_at: interview.start_at,
        end_at: interview.end_at,
        type: interview.type,
      },
      note: cleanText(req.body.company_note || req.body.note || ""),
    });
    recordCompanyHiringAnalytics({
      req,
      event: "interview_updated",
      companyData,
      entityType: "interview",
      entityId: interview._id,
      jobId: interview.job_id,
      applicationId: interview.application_id,
      metadata: {
        rescheduled: Boolean(willReschedule),
        status: interview.status,
        start_at: interview.start_at,
      },
    });

    const job = await jobsModel.findById(interview.job_id).select("_id job_name").lean().catch(() => null);
    SendInterviewUpdatedNotification({
      user_id: interview.employee_user_id,
      job_id: interview.job_id,
      application_id: interview.application_id,
      interview_id: interview._id,
      job_name: job?.job_name || "",
      meet_link: interview.meet_link,
      start_at: interview.start_at,
      end_at: interview.end_at,
      type: interview.type,
      office_address: interview.office_address,
    }).catch?.(console.error);

    return success(res, normalizeInterview(interview), "interview_updated");
  } catch (error) {
    next(error);
  }
};

export const changeInterviewStatus = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const interview = await getOwnedInterviewOrFail(req, res, companyData.company._id, req.params.interviewId);
    if (!interview) return;

    const status = cleanText(req.body.status);
    if (!INTERVIEW_STATUSES.has(status)) return fail(res, "invalid_interview_status", 422);

    const oldInterviewStatus = interview.status;
    interview.status = status;
    if (req.body.result_note !== undefined) interview.result_note = cleanText(req.body.result_note);
    if (req.body.rating !== undefined) interview.rating = toNumber(req.body.rating, null);
    if (req.body.cancelled_reason !== undefined) interview.cancelled_reason = cleanText(req.body.cancelled_reason);
    const scorecardPatch = parsePlainObjectBody(req.body.scorecard, null);
    if (scorecardPatch) interview.scorecard = { ...(interview.scorecard || {}), ...scorecardPatch };
    if (status === "completed") interview.completed_at = new Date();
    await interview.save();

    const application = await UserApplyingJobModel.findOne({ _id: interview.application_id, company_id: companyData.company._id });
    if (application && status === "completed") {
      const oldStatus = application.status;
      await updateApplicationStatusFields({ application, status: "interview_completed", body: req.body });
      await createStatusHistory({
        application,
        oldStatus,
        newStatus: "interview_completed",
        companyData,
        note: cleanText(req.body.result_note || req.body.note || "interview_completed"),
        action: "interview_completed",
        metadata: { interview_id: interview._id, scorecard: interview.scorecard || null, rating: interview.rating || null },
      });
    }

    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: req.companyAccess?.role === "owner" ? "company_owner" : "company_member",
      action: `interview_${status}`,
      entityType: "interview",
      entityId: interview._id,
      jobId: interview.job_id,
      applicationId: interview.application_id,
      oldValue: { status: oldInterviewStatus },
      newValue: { status, rating: interview.rating || null, scorecard: interview.scorecard || null },
      note: cleanText(req.body.result_note || req.body.note || req.body.cancelled_reason || ""),
    });
    recordCompanyHiringAnalytics({
      req,
      event: "interview_status_changed",
      companyData,
      entityType: "interview",
      entityId: interview._id,
      jobId: interview.job_id,
      applicationId: interview.application_id,
      metadata: {
        old_status: oldInterviewStatus,
        new_status: status,
        rating: interview.rating || null,
      },
    });

    const job = await jobsModel.findById(interview.job_id).select("_id job_name").lean().catch(() => null);
    if (status === "cancelled") {
      SendInterviewCancelledNotification({
        user_id: interview.employee_user_id,
        job_id: interview.job_id,
        application_id: interview.application_id,
        interview_id: interview._id,
        job_name: job?.job_name || "",
        status,
        note: interview.result_note || interview.cancelled_reason || "",
      }).catch?.(console.error);
    } else {
      SendInterviewUpdatedNotification({
        user_id: interview.employee_user_id,
        job_id: interview.job_id,
        application_id: interview.application_id,
        interview_id: interview._id,
        job_name: job?.job_name || "",
        status,
      }).catch?.(console.error);
    }

    return success(res, normalizeInterview(interview), "interview_status_updated");
  } catch (error) {
    next(error);
  }
};

export const sendJobInvitation = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_invite_candidates", "invitations", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.body.job_id || req.params.jobId, "_id job_name company_id");
    if (!job) return;

    const employee = await findEmployeeForInvitationOrFail(req, res);
    if (!employee) return;

    const userId = employee.user_id?._id || employee.user_id;
    if (!userId) return fail(res, "employee_user_not_found", 422);

    const expiresAt = toDateOrNull(req.body.expires_at || req.body.expiresAt);
    const existingInvitation = await JobInvitationModel.findOne({ job_id: job._id, employee_id: employee._id })
      .select("_id status")
      .lean();
    const shouldCountInvitationUsage = !existingInvitation || !["sent", "seen"].includes(existingInvitation.status);

    const invitation = await JobInvitationModel.findOneAndUpdate(
      { job_id: job._id, employee_id: employee._id },
      {
        $set: {
          company_id: companyData.company._id,
          job_id: job._id,
          employee_id: employee._id,
          user_id: userId,
          sent_by: companyData.userId,
          status: "sent",
          message: cleanText(req.body.message),
          salary_offer: req.body.salary_offer || req.body.salaryOffer || undefined,
          starts_at: toDateOrNull(req.body.starts_at || req.body.startsAt),
          expires_at: expiresAt,
          responded_at: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate({ path: "job_id", select: "job_name city salary company_id" })
      .populate({ path: "employee_id", select: "user_id profile_headline current_job_title experience_years" })
      .populate({ path: "user_id", select: "first_name mid_name last_name email image" });

    if (shouldCountInvitationUsage) {
      await recordCompanyUsage(companyData.company._id, "invitations", 1);
    }
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: existingInvitation ? "job_invitation_updated" : "job_invitation_sent",
      entityType: "job_invitation",
      entityId: invitation._id,
      jobId: job._id,
      oldValue: existingInvitation ? { status: existingInvitation.status } : null,
      newValue: { status: invitation.status, employee_id: employee._id, user_id: userId },
      note: cleanText(req.body.message || ""),
      metadata: {
        counted_usage: shouldCountInvitationUsage,
      },
    });
    recordCompanyHiringAnalytics({
      req,
      event: "job_invitation_sent",
      companyData,
      entityType: "job_invitation",
      entityId: invitation._id,
      jobId: job._id,
      metadata: {
        employee_id: employee._id,
        user_id: userId,
        existing: Boolean(existingInvitation),
        counted_usage: shouldCountInvitationUsage,
      },
    });
    SendJobInvitationNotification({
      ...(invitation.toObject?.() || invitation),
      company: companyData.company,
    }).catch?.(console.error);
    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_sent", 201);
  } catch (error) {
    if (error?.code === 11000) return fail(res, "job_invitation_already_exists", 409);
    next(error);
  }
};

export const getJobInvitations = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildInvitationsFilter(companyData.company._id, req.query);

    const result = await paginate(JobInvitationModel, filter, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [
        { path: "job_id", select: "job_name city salary company_id" },
        { path: "employee_id", select: "user_id profile_headline current_job_title experience_years" },
        { path: "user_id", select: "first_name mid_name last_name email image" },
      ],
      lean: true,
    });

    return success(res, result.items.map(normalizeCompanyInvitation), "job_invitations", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getJobInvitationDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const invitation = await JobInvitationModel.findOne({ _id: req.params.invitationId, company_id: companyData.company._id })
      .populate({ path: "job_id", select: "job_name city salary company_id" })
      .populate({
        path: "employee_id",
        select: "user_id profile_headline current_job_title about_me candidate_stage experience_years profile_completion skills languages education experience cvs links expected_salary",
        populate: [
          { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
          { path: "skills.skill_id" },
          { path: "languages.language_id" },
          { path: "education.education_level_id" },
        ],
      })
      .populate({ path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" })
      .lean();

    if (!invitation) return fail(res, "job_invitation_not_found", 404);

    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_details");
  } catch (error) {
    next(error);
  }
};

export const cancelJobInvitation = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const invitation = await getOwnedInvitationOrFail(req, res, companyData.company._id, req.params.invitationId);
    if (!invitation) return;

    if (!["sent", "seen"].includes(invitation.status)) {
      return fail(res, "only_pending_invitation_can_be_cancelled", 422);
    }

    invitation.status = "cancelled";
    invitation.responded_at = new Date();
    await invitation.save();

    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "job_invitation_cancelled",
      entityType: "job_invitation",
      entityId: invitation._id,
      jobId: invitation.job_id,
      oldValue: { status: "sent_or_seen" },
      newValue: { status: invitation.status },
      note: cleanText(req.body.note || req.body.reason || ""),
    });
    recordCompanyHiringAnalytics({
      req,
      event: "job_invitation_cancelled",
      companyData,
      entityType: "job_invitation",
      entityId: invitation._id,
      jobId: invitation.job_id,
      metadata: {
        reason: cleanText(req.body.note || req.body.reason || ""),
      },
    });

    const job = await jobsModel.findById(invitation.job_id).select("_id job_name").lean().catch(() => null);
    SendJobInvitationCancelledNotification({
      ...(invitation.toObject?.() || invitation),
      job_id: job || invitation.job_id,
    }).catch?.(console.error);

    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_cancelled");
  } catch (error) {
    next(error);
  }
};


export const getApplicationCv = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_download_cvs", "cv_downloads", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const { applicationId } = req.params;
    if (!ensureObjectId(res, applicationId, "invalid_application_id")) return;

    const application = await populateApplicationQuery(
      UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id })
    ).lean();

    if (!application) return fail(res, "application_not_found", 404);

    const entries = collectApplicationCvEntries(application);
    const selectedCv = findCvEntry(entries, req.query);

    if (!selectedCv) return fail(res, "cv_not_found", 404);

    const sent = await sendCvFile({
      res,
      cvEntry: selectedCv,
      fallbackName: selectedCv.fileName || `application-${applicationId}.pdf`,
      inline: req.query.inline === "true",
    });

    if (!sent) return fail(res, "cv_file_not_found", 404);

    await UserApplyingJobModel.updateOne(
      { _id: application._id, company_id: companyData.company._id },
      { $set: { cv_download: true, last_activity_at: new Date() } }
    );
    await recordCompanyUsage(companyData.company._id, "cv_downloads", 1);
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "application_cv_downloaded",
      entityType: "application",
      entityId: application._id,
      jobId: application.job_id?._id || application.job_id,
      applicationId: application._id,
      metadata: {
        source: "single_cv_download",
        file_name: selectedCv.fileName || selectedCv.filename || "",
        cv_id: selectedCv.id || "",
        cv_source: selectedCv.source || "",
        inline: req.query.inline === "true",
      },
    });
    recordCompanyHiringAnalytics({
      req,
      event: "cv_exported",
      companyData,
      entityId: application._id,
      jobId: application.job_id?._id || application.job_id,
      applicationId: application._id,
      metadata: {
        source: "single_cv_download",
        file_name: selectedCv.fileName || selectedCv.filename || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const blockApplicationApplicant = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.params.applicationId);
    if (!application) return;

    const employeeId = application.employee_id || req.body.employee_id;
    const note = cleanText(req.body.note || "blocked_by_company");

    let employee = null;
    if (employeeId && mongoose.Types.ObjectId.isValid(String(employeeId))) {
      employee = await EmployeeModel.findByIdAndUpdate(
        employeeId,
        { $addToSet: { blocked_companies: companyData.company._id } },
        { new: true }
      );
    }

    const oldStatus = application.status;

    await updateApplicationStatusFields({ application, status: "rejected" });
    await createStatusHistory({
      application,
      oldStatus,
      newStatus: "rejected",
      companyData,
      note,
    });

    const job = await jobsModel.findById(application.job_id).select("_id job_name").lean().catch(() => null);
    changeJobStatus("rejected", {
      user_id: application.user_id,
      application_id: application._id,
      job_id: application.job_id,
      job_name: job?.job_name || "",
    }).catch?.(console.error);

    return success(res, {
      application: normalizeApplication(application),
      employee_blocked: Boolean(employee),
      employee_id: employee?._id || employeeId || null,
    }, "applicant_blocked");
  } catch (error) {
    next(error);
  }
};


export const bulkApplicationCvs = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_download_cvs", "cv_downloads", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const filter = await buildBulkApplicationsFilter(req, res, companyData);
    if (!filter) return;

    const limit = parseIntBounded(req.body?.limit || req.query.limit, 500, 1, 1000);
    const applications = await populateApplicationQuery(
      UserApplyingJobModel.find(filter).sort(buildApplicationsSort({ ...req.query, ...req.body })).limit(limit)
    ).lean();

    const zipFiles = [];
    applications.forEach((application, appIndex) => {
      const entries = collectApplicationCvEntries(application);
      entries.forEach((entry, cvIndex) => {
        zipFiles.push({
          ...entry,
          zipName: makeZipEntryName({
            application,
            cvEntry: entry,
            index: zipFiles.length + 1 || appIndex + cvIndex + 1,
          }),
        });
      });
    });

    if (!zipFiles.length) return fail(res, "cv_not_found", 404);

    const zipBuffer = await createZipBuffer(zipFiles);
    if (!zipBuffer.length) return fail(res, "cv_file_not_found", 404);

    const applicationIds = applications.map((application) => application._id);
    if (applicationIds.length) {
      await UserApplyingJobModel.updateMany(
        { _id: { $in: applicationIds }, company_id: companyData.company._id },
        { $set: { cv_download: true, last_activity_at: new Date() } }
      );
    }
    await recordCompanyUsage(companyData.company._id, "cv_downloads", Math.max(zipFiles.length, 1));
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "application_cvs_bulk_exported",
      entityType: "company",
      entityId: companyData.company._id,
      metadata: {
        source: "bulk_cv_zip",
        applications_count: applications.length,
        files_count: zipFiles.length,
        application_ids: applicationIds.map((id) => String(id)),
      },
    });
    recordCompanyHiringAnalytics({
      req,
      event: "cv_exported",
      companyData,
      entityType: "company",
      entityId: companyData.company._id,
      metadata: {
        source: "bulk_cv_zip",
        applications_count: applications.length,
        files_count: zipFiles.length,
      },
    });

    const fileName = `halajob-cvs-${Date.now()}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader("Content-Length", zipBuffer.length);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

export const bulkExportApplications = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_export_applications", "application_exports", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const filter = await buildBulkApplicationsFilter(req, res, companyData);
    if (!filter) return;

    const limit = parseIntBounded(req.body?.limit || req.query.limit, 500, 1, 1000);
    const applications = await populateApplicationQuery(
      UserApplyingJobModel.find(filter).sort(buildApplicationsSort({ ...req.query, ...req.body })).limit(limit)
    ).lean();
    const exportFormat = String(req.query.format || req.body?.format || "xlsx").trim().toLowerCase();
    if (!["xlsx", "json"].includes(exportFormat)) {
      return fail(res, "invalid_export_format", 400, { supported: ["xlsx", "json"] });
    }

    await recordCompanyUsage(companyData.company._id, "application_exports", 1);
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "applications_exported",
      entityType: "company",
      entityId: companyData.company._id,
      metadata: {
        source: "applications_export",
        applications_count: applications.length,
        format: exportFormat,
        application_ids: applications.map((application) => String(application._id)),
      },
    });
    recordCompanyHiringAnalytics({
      req,
      event: "cv_exported",
      companyData,
      entityType: "company",
      entityId: companyData.company._id,
      metadata: {
        source: "applications_export",
        applications_count: applications.length,
        format: exportFormat,
      },
    });

    if (exportFormat === "json") {
      return success(
        res,
        {
          count: applications.length,
          items: applications.map((application) => ({
            ...normalizeApplicantWithCvMeta(application),
            cv_files: applicationCvFiles(application),
          })),
        },
        "applications_export"
      );
    }

    const rows = applications.map(applicationExportRow);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("applications");
    const headers = Object.keys(rows[0] || { empty: "" });
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length + 4, 14), 42),
    }));
    worksheet.addRows(rows);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const fileName = `halajob-applications-${Date.now()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};


export const getAtsPipeline = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildApplicationsFilter(companyData.company._id, req.query);
    if (req.params.jobId || req.query.job_id || req.query.jobId) {
      const jobId = req.params.jobId || req.query.job_id || req.query.jobId;
      const job = await getOwnedJobOrFail(req, res, companyData.company._id, jobId, "_id");
      if (!job) return;
      filter.job_id = job._id;
    }

    const statuses = ["new", "reviewing", "initial_match", "not_match", "contacted", "interview_scheduled", "interview_completed", "offer", "accepted", "hired", "rejected", "archived", "withdrawn", "offer_declined"];
    const limit = parseIntBounded(req.query.limit, 500, 1, 1000);
    const applications = await populateApplicationQuery(
      UserApplyingJobModel.find(filter).sort({ stage_order: 1, ats_score: -1, createdAt: -1 }).limit(limit)
    ).lean();

    const grouped = Object.fromEntries(statuses.map((status) => [status, []]));
    applications.forEach((application) => {
      const status = grouped[application.status] ? application.status : "new";
      grouped[status].push(normalizeApplicantWithCvMeta(application));
    });

    const counts = await UserApplyingJobModel.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).catch(() => []);
    const countMap = Object.fromEntries(counts.map((item) => [item._id || "new", item.count]));

    return success(res, statuses.map((status) => ({ status, count: countMap[status] || grouped[status].length, items: grouped[status] })), "ats_pipeline");
  } catch (error) {
    next(error);
  }
};

export const getTalentPool = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildApplicationsFilter(companyData.company._id, { ...req.query, status: req.query.status || "archived" });
    const archivedOr = [{ status: "archived" }, { archived_at: { $ne: null } }];
    if (filter.$or) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: filter.$or }, { $or: archivedOr });
      delete filter.$or;
    } else {
      filter.$or = archivedOr;
    }

    const result = await paginateApplications(req, filter, buildApplicationsSort({ ...req.query, sort: req.query.sort || "match" }));
    return success(res, result.items.map(normalizeApplicantWithCvMeta), "talent_pool", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const restoreApplication = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.params.applicationId);
    if (!application) return;

    const oldStatus = application.status;
    const status = cleanText(req.body.status || "reviewing");
    if (!APPLICATION_STATUSES.has(status) || status === "archived") return fail(res, "invalid_restore_status", 422);

    await updateApplicationStatusFields({
      application,
      status,
      body: req.body,
      extraPatch: { archived_at: null, restored_at: new Date(), archive_reason: "" },
    });
    await createStatusHistory({ application, oldStatus, newStatus: status, companyData, note: cleanText(req.body.note || "application_restored"), action: "application_restored" });
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: req.companyAccess?.role === "owner" ? "company_owner" : "company_member",
      action: "application_restored",
      entityType: "application",
      entityId: application._id,
      jobId: application.job_id,
      applicationId: application._id,
      oldValue: { status: oldStatus },
      newValue: { status },
      note: cleanText(req.body.note || ""),
    });

    return success(res, normalizeApplication(application), "application_restored");
  } catch (error) {
    next(error);
  }
};

export const sendApplicationMessage = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.params.applicationId);
    if (!application) return;

    const message = cleanText(req.body.message || req.body.body || req.body.note);
    if (!message) return fail(res, "message_required", 422);

    application.communication_log.push({
      channel: cleanText(req.body.channel || "app"),
      message,
      created_by: companyData.userId,
    });
    application.last_activity_at = new Date();
    if (req.body.change_status && APPLICATION_STATUSES.has(cleanText(req.body.change_status))) {
      application.status = cleanText(req.body.change_status);
      application.status_changed_at = new Date();
    }
    await application.save();

    await createStatusHistory({
      application,
      oldStatus: application.status,
      newStatus: application.status,
      companyData,
      note: message,
      action: "message_sent",
      visibleToCandidate: true,
      metadata: { channel: cleanText(req.body.channel || "app") },
    });
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: req.companyAccess?.role === "owner" ? "company_owner" : "company_member",
      action: "application_message_sent",
      entityType: "application",
      entityId: application._id,
      jobId: application.job_id,
      applicationId: application._id,
      note: message,
      metadata: { channel: cleanText(req.body.channel || "app") },
    });

    return success(res, normalizeApplication(application), "application_message_sent");
  } catch (error) {
    next(error);
  }
};

export const getCompanyJobReviews = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const requestedJobId = req.params.jobId || req.query.job_id || req.query.jobId;
    const job = requestedJobId
      ? await getOwnedJobOrFail(req, res, companyData.company._id, requestedJobId, "_id")
      : null;
    if (requestedJobId && !job) return;

    const jobIds = requestedJobId
      ? [job._id]
      : await jobsModel.distinct("_id", { company_id: companyData.company._id });

    const filter = { job_id: { $in: jobIds } };
    const result = await paginate(UserReviewJobModel, filter, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [
        { path: "job_id", select: "job_name company_id" },
        { path: "user_id", select: "first_name mid_name last_name email image" },
      ],
      lean: true,
    });

    return success(res, result.items.map(normalizeCompanyReviewItem), "company_job_reviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export default {
  getHiringSummary,
  getJobApplications,
  getApplicants,
  getApplicationDetails,
  updateApplicationStatus,
  getAtsPipeline,
  getTalentPool,
  restoreApplication,
  sendApplicationMessage,
  getApplicationCv,
  bulkApplicationCvs,
  bulkExportApplications,
  blockApplicationApplicant,
  createInterview,
  getInterviews,
  updateInterview,
  changeInterviewStatus,
  sendJobInvitation,
  getJobInvitations,
  getJobInvitationDetails,
  cancelJobInvitation,
  getCompanyJobReviews,
};
