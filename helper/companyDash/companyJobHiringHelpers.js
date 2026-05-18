import mongoose from "mongoose";
import {
  EmployeeModel,
  jobsModel,
  UserApplyingJobModel,
  InterviewModel,
  JobInvitationModel,
} from "../../models/index.js";

import {
  fail,
  isValidObjectId,
  normalizeApplication,
  normalizeInterview,
  normalizeJob,
} from "./companyDashHelpers.js";

export const APPLICATION_STATUSES = new Set([
  "waiting",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "accepted",
  "hired",
  "rejected",
  "withdrawn",
  "auto_cancel",
]);

export const INTERVIEW_STATUSES = new Set([
  "scheduled",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show",
  "accepted",
  "rejected",
]);

export const INTERVIEW_TYPES = new Set(["online", "in_office", "phone", "on_app"]);
export const INVITATION_STATUSES = new Set(["sent", "seen", "accepted", "declined", "expired", "cancelled"]);

export const cleanText = (value = "") => String(value || "").trim();

export const toNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isMongoId = (value) => isValidObjectId(value);

export const ensureObjectId = (res, value, message = "invalid_id") => {
  if (!isMongoId(value)) {
    fail(res, message, 400);
    return false;
  }
  return true;
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getOwnedJobOrFail = async (req, res, companyId, jobId, select = null) => {
  if (!ensureObjectId(res, jobId, "invalid_job_id")) return null;

  let query = jobsModel.findOne({ _id: jobId, company_id: companyId });
  if (select) query = query.select(select);

  const job = await query;
  if (!job) {
    fail(res, "job_not_found", 404);
    return null;
  }

  return job;
};

export const getOwnedApplicationOrFail = async (req, res, companyId, applicationId) => {
  if (!ensureObjectId(res, applicationId, "invalid_application_id")) return null;

  const application = await UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyId });
  if (!application) {
    fail(res, "application_not_found", 404);
    return null;
  }

  return application;
};

export const getOwnedInterviewOrFail = async (req, res, companyId, interviewId) => {
  if (!ensureObjectId(res, interviewId, "invalid_interview_id")) return null;

  const interview = await InterviewModel.findOne({ _id: interviewId, company_id: companyId });
  if (!interview) {
    fail(res, "interview_not_found", 404);
    return null;
  }

  return interview;
};

export const getOwnedInvitationOrFail = async (req, res, companyId, invitationId) => {
  if (!ensureObjectId(res, invitationId, "invalid_invitation_id")) return null;

  const invitation = await JobInvitationModel.findOne({ _id: invitationId, company_id: companyId });
  if (!invitation) {
    fail(res, "job_invitation_not_found", 404);
    return null;
  }

  return invitation;
};

export const findEmployeeForInvitationOrFail = async (req, res) => {
  const employeeId = req.body.employee_id || req.params.employeeId;
  const userId = req.body.user_id || req.params.userId;

  let employee = null;

  if (employeeId) {
    if (!ensureObjectId(res, employeeId, "invalid_employee_id")) return null;
    employee = await EmployeeModel.findById(employeeId).populate({
      path: "user_id",
      select: "first_name mid_name last_name email image phone_code phone_national",
    });
  } else if (userId) {
    if (!ensureObjectId(res, userId, "invalid_user_id")) return null;
    employee = await EmployeeModel.findOne({ user_id: userId }).populate({
      path: "user_id",
      select: "first_name mid_name last_name email image phone_code phone_national",
    });
  }

  if (!employee) {
    fail(res, "employee_not_found", 404);
    return null;
  }

  return employee;
};

export const buildApplicationsFilter = (companyId, query = {}) => {
  const filter = { company_id: companyId };

  if (query.job_id && isMongoId(query.job_id)) filter.job_id = query.job_id;
  if (query.status && APPLICATION_STATUSES.has(String(query.status))) filter.status = String(query.status);
  if (query.employee_id && isMongoId(query.employee_id)) filter.employee_id = query.employee_id;
  if (query.user_id && isMongoId(query.user_id)) filter.user_id = query.user_id;

  const from = toDateOrNull(query.from || query.dateFrom);
  const to = toDateOrNull(query.to || query.dateTo);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const search = cleanText(query.search || query.q);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { first_name: regex },
      { last_name: regex },
      { email: regex },
      { phone_national: regex },
      { cover_letter: regex },
    ];
  }

  return filter;
};

export const buildApplicationsSort = (query = {}) => {
  const allowed = new Set(["createdAt", "updatedAt", "status_changed_at", "last_activity_at"]);
  const sortText = cleanText(query.sort);
  if (!sortText) return { createdAt: -1, _id: -1 };

  const [field, dir = "desc"] = sortText.split(":");
  if (!allowed.has(field)) return { createdAt: -1, _id: -1 };

  const direction = dir === "asc" ? 1 : -1;
  return { [field]: direction, _id: direction };
};

export const buildInterviewsFilter = (companyId, query = {}) => {
  const filter = { company_id: companyId };

  if (query.job_id && isMongoId(query.job_id)) filter.job_id = query.job_id;
  if (query.application_id && isMongoId(query.application_id)) filter.application_id = query.application_id;
  if (query.status && INTERVIEW_STATUSES.has(String(query.status))) filter.status = String(query.status);
  if (query.type && INTERVIEW_TYPES.has(String(query.type))) filter.type = String(query.type);
  if (query.upcoming === "true") filter.start_at = { $gte: new Date() };

  const from = toDateOrNull(query.from || query.dateFrom);
  const to = toDateOrNull(query.to || query.dateTo);
  if (from || to) {
    filter.start_at = { ...(filter.start_at || {}) };
    if (from) filter.start_at.$gte = from;
    if (to) filter.start_at.$lte = to;
  }

  return filter;
};

export const buildInvitationsFilter = (companyId, query = {}) => {
  const filter = { company_id: companyId };

  if (query.job_id && isMongoId(query.job_id)) filter.job_id = query.job_id;
  if (query.employee_id && isMongoId(query.employee_id)) filter.employee_id = query.employee_id;
  if (query.user_id && isMongoId(query.user_id)) filter.user_id = query.user_id;
  if (query.status && INVITATION_STATUSES.has(String(query.status))) filter.status = String(query.status);

  const from = toDateOrNull(query.from || query.dateFrom);
  const to = toDateOrNull(query.to || query.dateTo);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  return filter;
};

export const buildInterviewPayload = ({ body = {}, companyData, application, oldInterview = null }) => {
  const startAt = toDateOrNull(body.start_at || body.startAt);
  if (!startAt && !oldInterview) return { error: "start_at_required" };

  const endAt = toDateOrNull(body.end_at || body.endAt);
  const finalStartAt = startAt || oldInterview?.start_at;

  if (endAt && finalStartAt && endAt <= finalStartAt) {
    return { error: "end_at_must_be_after_start_at" };
  }

  const type = cleanText(body.type || oldInterview?.type || "online");
  if (!INTERVIEW_TYPES.has(type)) return { error: "invalid_interview_type" };

  const status = cleanText(body.status || oldInterview?.status || "scheduled");
  if (!INTERVIEW_STATUSES.has(status)) return { error: "invalid_interview_status" };

  const payload = {
    application_id: application._id,
    job_id: application.job_id,
    company_id: companyData.company._id,
    employee_user_id: application.user_id,
    scheduled_by: companyData.userId,
    type,
    status,
    timezone: cleanText(body.timezone || oldInterview?.timezone || companyData.company?.timezone || "UTC"),
    meet_link: cleanText(body.meet_link || body.meetLink || oldInterview?.meet_link || ""),
    office_address: cleanText(body.office_address || body.officeAddress || oldInterview?.office_address || ""),
    company_note: cleanText(body.company_note || body.companyNote || oldInterview?.company_note || ""),
    candidate_note: cleanText(body.candidate_note || body.candidateNote || oldInterview?.candidate_note || ""),
    result_note: cleanText(body.result_note || body.resultNote || oldInterview?.result_note || ""),
    longitude: toNumber(body.longitude, oldInterview?.longitude ?? null),
    latitude: toNumber(body.latitude, oldInterview?.latitude ?? null),
  };

  if (startAt) payload.start_at = startAt;
  if (endAt) payload.end_at = endAt;
  if (body.rating !== undefined) payload.rating = toNumber(body.rating, null);

  return { payload };
};

export const normalizeApplicant = (application) => {
  const employee = application.employee_id || null;
  const user = application.user_id || null;

  return {
    application: normalizeApplication(application),
    applicant: {
      user_id: user?._id || application.user_id || null,
      employee_id: employee?._id || null,
      first_name: user?.first_name || application.first_name || "",
      mid_name: user?.mid_name || "",
      last_name: user?.last_name || application.last_name || "",
      email: user?.email || application.email || "",
      image: user?.image || null,
      phone_code: application.phone_code || user?.phone_code || "",
      phone_national: application.phone_national || user?.phone_national || "",
      profile_headline: employee?.profile_headline || "",
      current_job_title: employee?.current_job_title || "",
      about_me: employee?.about_me || "",
      candidate_stage: employee?.candidate_stage || "unknown",
      experience_years: employee?.experience_years || 0,
      profile_completion: employee?.profile_completion || 0,
      expected_salary: employee?.expected_salary || null,
      is_free_for_work: Boolean(employee?.is_free_for_work),
      skills: employee?.skills || [],
      languages: employee?.languages || [],
      education: employee?.education || [],
      experience: employee?.experience || [],
      cvs: employee?.cvs || [],
      links: employee?.links || [],
    },
  };
};

export const populateApplicationQuery = (query) =>
  query
    .populate({
      path: "job_id",
      select:
        "job_name publish_status status is_accepted city cities salary work_mode_info job_type_info job_time_info company_id createdAt",
    })
    .populate({
      path: "employee_id",
      select:
        "user_id profile_headline current_job_title about_me candidate_stage experience_years profile_completion skills languages education experience cvs links expected_salary work_location is_free_for_work",
      populate: [
        { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
        { path: "skills.skill_id" },
        { path: "languages.language_id" },
        { path: "education.education_level_id" },
      ],
    })
    .populate({
      path: "user_id",
      select: "first_name mid_name last_name email image phone_code phone_national",
    });

export const paginateApplications = async (req, filter, sort) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit || req.query.paginate) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const query = populateApplicationQuery(UserApplyingJobModel.find(filter)).sort(sort).skip(skip).limit(limit).lean();
  const [items, total] = await Promise.all([query, UserApplyingJobModel.countDocuments(filter)]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  };
};

export const normalizeCompanyInvitation = (invitation) => ({
  _id: invitation._id,
  status: invitation.status,
  message: invitation.message || "",
  salary_offer: invitation.salary_offer || null,
  starts_at: invitation.starts_at || null,
  expires_at: invitation.expires_at || null,
  responded_at: invitation.responded_at || null,
  job: normalizeJob(invitation.job_id),
  employee: invitation.employee_id || null,
  user: invitation.user_id || invitation.employee_id?.user_id || null,
  sent_by: invitation.sent_by || null,
  createdAt: invitation.createdAt,
  updatedAt: invitation.updatedAt,
});

export const normalizeCompanyReviewItem = (review) => ({
  _id: review._id,
  message: review.message || review.review || "",
  status: review.status || "published",
  job: normalizeJob(review.job_id),
  user: review.user_id || null,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

export const normalizeCompanyJobActivitySummary = (stats = {}) => ({
  applications: stats.applications || 0,
  waiting_applications: stats.waiting || 0,
  interview_applications: stats.interview || 0,
  offer_applications: stats.offer || 0,
  accepted_applications: stats.accepted || 0,
  rejected_applications: stats.rejected || 0,
  interviews: stats.interviews || 0,
  upcoming_interviews: stats.upcomingInterviews || 0,
  invitations: stats.invitations || 0,
  sent_invitations: stats.sentInvitations || 0,
  accepted_invitations: stats.acceptedInvitations || 0,
});
