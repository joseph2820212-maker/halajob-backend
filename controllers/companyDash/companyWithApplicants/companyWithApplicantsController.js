import {
  UserApplyingJobModel,
  ApplicationStatusHistoryModel,
  InterviewModel,
  jobsModel,
} from "../../../models/index.js";

import {
  SendInterViewNotification,
  SendInterviewCancelledNotification,
  SendInterviewUpdatedNotification,
  changeJobStatus,
} from "../../../notification/JobEmployeeNotifications.js";

import {
  getCompanyUserIdOrFail,
  success,
  fail,
  paginate,
  isValidObjectId,
  companyJobPopulate,
  normalizeApplication,
  normalizeInterview,
} from "../../../helper/companyDash/companyDashHelpers.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const applicationPopulate = [
  { path: "job_id", populate: companyJobPopulate },
  { path: "employee_id" },
  { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national gender" },
  { path: "country_id" },
];

const interviewPopulate = [
  { path: "job_id", populate: companyJobPopulate },
  { path: "application_id" },
  { path: "employee_user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
];

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const APPLICATION_STATUSES = new Set([
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
  "new",
  "reviewing",
  "initial_match",
  "not_match",
  "contacted",
  "interview_scheduled",
  "interview_completed",
  "archived",
  "offer_declined",
]);
const INTERVIEW_STATUSES = new Set(["scheduled", "rescheduled", "completed", "cancelled", "no_show", "accepted", "rejected"]);
const INTERVIEW_TYPES = new Set(["online", "in_office", "phone", "on_app"]);
const INTERVIEW_PATCH_FIELDS = new Set([
  "type",
  "status",
  "start_at",
  "end_at",
  "timezone",
  "meet_link",
  "office_address",
  "company_note",
  "candidate_note",
  "result_note",
  "rating",
  "cancelled_reason",
  "scorecard",
]);

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const visibleStatusForApplicationStatus = (status) => ({
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
}[status] || "reviewing");

const applyApplicationFilters = (filter, query = {}) => {
  if (query.status) filter.status = query.status;
  if (query.job_id && isValidObjectId(query.job_id)) filter.job_id = query.job_id;

  if (query.search || query.q) {
    const regex = new RegExp(escapeRegex(query.search || query.q), "i");
    filter.$or = [
      { application_no: regex },
      { first_name: regex },
      { last_name: regex },
      { email: regex },
      { phone_national: regex },
    ];
  }

  const scoreMin = toNumber(query.score_min || query.match_min);
  const scoreMax = toNumber(query.score_max || query.match_max);
  if (scoreMin != null || scoreMax != null) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { ats_score: { ...(scoreMin != null ? { $gte: scoreMin } : {}), ...(scoreMax != null ? { $lte: scoreMax } : {}) } },
        { "filter_result.score": { ...(scoreMin != null ? { $gte: scoreMin } : {}), ...(scoreMax != null ? { $lte: scoreMax } : {}) } },
      ],
    });
  }

  if (query.knockout_failed !== undefined) {
    filter["knockout_result.has_failed"] = [true, "true", "1", 1].includes(query.knockout_failed);
  }

  if (query.has_interview !== undefined) {
    filter.status = [true, "true", "1", 1].includes(query.has_interview)
      ? { $in: ["interview", "interview_scheduled", "interview_completed"] }
      : { $nin: ["interview", "interview_scheduled", "interview_completed"] };
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  return filter;
};

const getApplicationSort = (query = {}) => {
  const sort = String(query.sort || "newest");
  if (sort === "oldest") return { createdAt: 1, _id: 1 };
  if (sort === "match" || sort === "match_desc") return { ats_score: -1, "filter_result.score": -1, createdAt: -1 };
  if (sort === "match_asc") return { ats_score: 1, "filter_result.score": 1, createdAt: -1 };
  return { createdAt: -1, _id: -1 };
};

export const getJobApplicants = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const job = await jobsModel.exists({ _id: jobId, company_id: companyData.company._id });
    if (!job) return fail(res, "job_not_found", 404);

    const filter = applyApplicationFilters({ company_id: companyData.company._id, job_id: jobId }, req.query);

    const result = await paginate(UserApplyingJobModel, filter, req, { populate: applicationPopulate, sort: getApplicationSort(req.query) });
    return success(res, result.items.map(normalizeApplication), "job_applicants", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = applyApplicationFilters({ company_id: companyData.company._id }, req.query);

    const result = await paginate(UserApplyingJobModel, filter, req, { populate: applicationPopulate, sort: getApplicationSort(req.query) });
    return success(res, result.items.map(normalizeApplication), "company_applications", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getApplicationDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const application = await UserApplyingJobModel
      .findOne({ _id: applicationId, company_id: companyData.company._id })
      .populate(applicationPopulate)
      .lean();

    if (!application) return fail(res, "application_not_found", 404);

    const [history, interviews] = await Promise.all([
      ApplicationStatusHistoryModel.find({ application_id: applicationId }).sort({ createdAt: -1 }).lean().catch(() => []),
      InterviewModel.find({ application_id: applicationId, company_id: companyData.company._id }).sort({ start_at: -1 }).populate(interviewPopulate).lean(),
    ]);

    return success(res, { application: normalizeApplication(application), history, interviews: interviews.map(normalizeInterview) }, "application_details");
  } catch (error) {
    next(error);
  }
};

export const changeApplicationStatus = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const newStatus = String(req.body.status || "").trim();
    if (!newStatus) return fail(res, "application_status_required", 422);
    if (!APPLICATION_STATUSES.has(newStatus)) return fail(res, "invalid_application_status", 422);

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id });
    if (!application) return fail(res, "application_not_found", 404);

    const oldStatus = application.status;
    const now = new Date();
    application.status = newStatus;
    application.visible_status = visibleStatusForApplicationStatus(newStatus);
    application.status_changed_at = now;
    application.last_activity_at = now;
    if (oldStatus === "archived" && newStatus !== "archived") {
      application.archived_at = null;
      application.restored_at = now;
    }
    if (newStatus === "archived") {
      application.archived_at = now;
      application.archive_reason = req.body.archive_reason || req.body.reason || application.archive_reason || "";
    }
    if (newStatus === "rejected" || newStatus === "not_match") {
      application.rejected_at = now;
      application.rejection_reason_code = req.body.reason_code || req.body.rejection_reason_code || "other";
      application.rejection_reason = req.body.reason || req.body.rejection_reason || application.rejection_reason || "";
      application.internal_rejection_note = req.body.internal_note || req.body.internal_rejection_note || "";
      application.candidate_rejection_message = req.body.candidate_message || req.body.candidate_rejection_message || "";
      application.rejection_message_visible_to_candidate = [true, "true", "1", 1].includes(req.body.visible_to_candidate || req.body.rejection_message_visible_to_candidate);
    }
    if (newStatus === "hired" || newStatus === "accepted") application.hired_at = application.hired_at || now;
    if (newStatus === "withdrawn" || newStatus === "offer_declined") application.withdrawn_at = application.withdrawn_at || now;
    if (req.body.message) {
      application.communication_log.push({
        channel: req.body.channel || "internal",
        message: req.body.message,
        created_by: companyData.userId,
      });
    }
    await application.save();

    await ApplicationStatusHistoryModel.create({
      application_id: application._id,
      job_id: application.job_id,
      company_id: companyData.company._id,
      user_id: application.user_id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: companyData.userId,
      actor_type: "company",
      action: "status_changed",
      note: req.body.note || req.body.reason || "Status changed by company",
      rejection_reason_code: application.rejection_reason_code || "",
      visible_to_candidate: Boolean(application.rejection_message_visible_to_candidate),
      metadata: { archive_reason: application.archive_reason || "", candidate_message: application.candidate_rejection_message || "" },
    }).catch(() => null);
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
      newValue: { status: newStatus },
      note: req.body.note || req.body.reason || "",
    });

    const job = await jobsModel.findById(application.job_id).select("_id job_name").lean().catch(() => null);
    changeJobStatus(newStatus, {
      user_id: application.user_id,
      application_id: application._id,
      job_id: application.job_id,
      job_name: job?.job_name || "",
    }).catch?.(console.error);

    return success(res, application, "application_status_updated");
  } catch (error) {
    next(error);
  }
};

export const addApplicationNote = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id });
    if (!application) return fail(res, "application_not_found", 404);

    application.company_note = req.body.note || req.body.company_note || "";
    application.last_activity_at = new Date();
    await application.save();
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: req.companyAccess?.role === "owner" ? "company_owner" : "company_member",
      action: "application_note_added",
      entityType: "application",
      entityId: application._id,
      jobId: application.job_id,
      applicationId: application._id,
      note: application.company_note,
    });

    return success(res, application, "application_note_added");
  } catch (error) {
    next(error);
  }
};

export const rateApplicant = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return fail(res, "invalid_rating", 422);

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id });
    if (!application) return fail(res, "application_not_found", 404);

    application.company_rating = rating;
    application.company_rating_note = req.body.note || "";
    application.last_activity_at = new Date();
    await application.save();

    return success(res, application, "applicant_rated");
  } catch (error) {
    next(error);
  }
};

export const getCompanyInterviews = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = { company_id: companyData.company._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.job_id && isValidObjectId(req.query.job_id)) filter.job_id = req.query.job_id;

    const result = await paginate(InterviewModel, filter, req, { populate: interviewPopulate });
    return success(res, result.items.map(normalizeInterview), "company_interviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const scheduleInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { application_id, job_id, employee_user_id, start_at, end_at } = req.body;
    if (!application_id || !isValidObjectId(application_id)) return fail(res, "invalid_application_id", 400);
    if (!job_id || !isValidObjectId(job_id)) return fail(res, "invalid_job_id", 400);
    if (!employee_user_id || !isValidObjectId(employee_user_id)) return fail(res, "invalid_employee_user_id", 400);
    if (!start_at || !end_at) return fail(res, "interview_time_required", 422);

    const application = await UserApplyingJobModel.findOne({ _id: application_id, company_id: companyData.company._id, job_id });
    if (!application) return fail(res, "application_not_found", 404);
    const type = req.body.type || "online";
    const status = req.body.status || "scheduled";
    if (!INTERVIEW_TYPES.has(type)) return fail(res, "invalid_interview_type", 422);
    if (!INTERVIEW_STATUSES.has(status)) return fail(res, "invalid_interview_status", 422);

    const interview = await InterviewModel.create({
      application_id,
      job_id,
      company_id: companyData.company._id,
      employee_user_id,
      type,
      status,
      start_at,
      end_at,
      timezone: req.body.timezone || companyData.company.timezone || "UTC",
      meet_link: req.body.meet_link || "",
      office_address: req.body.office_address || "",
      company_note: req.body.company_note || "",
      candidate_note: req.body.candidate_note || "",
    });

    const oldStatus = application.status;
    application.status = "interview_scheduled";
    application.visible_status = "interview_scheduled";
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();
    await application.save();

    await ApplicationStatusHistoryModel.create({
      application_id: application._id,
      job_id: application.job_id,
      company_id: companyData.company._id,
      user_id: application.user_id,
      old_status: oldStatus,
      new_status: "interview_scheduled",
      changed_by: companyData.userId,
      actor_type: "company",
      action: "interview_scheduled",
      note: req.body.company_note || "Interview scheduled",
      metadata: { interview_id: interview._id },
    }).catch(() => null);

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
      note: req.body.company_note || "",
    });

    const job = await jobsModel.findById(job_id).select("_id job_name").lean().catch(() => null);
    SendInterViewNotification({
      user_id: employee_user_id,
      job_id,
      application_id,
      interview_id: interview._id,
      job_name: job?.job_name || "",
      meet_link: interview.meet_link,
      date: interview.start_at,
      start_at: interview.start_at,
      end_at: interview.end_at,
      type: interview.type,
      office_address: interview.office_address,
      note: interview.candidate_note || interview.company_note || "",
    }).catch?.(console.error);

    return success(res, interview, "interview_scheduled", 201);
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { interviewId } = req.params;
    if (!isValidObjectId(interviewId)) return fail(res, "invalid_interview_id", 400);

    const patch = Object.entries(req.body || {}).reduce((acc, [key, value]) => {
      if (INTERVIEW_PATCH_FIELDS.has(key)) acc[key] = value;
      return acc;
    }, {});
    if (patch.type && !INTERVIEW_TYPES.has(patch.type)) return fail(res, "invalid_interview_type", 422);
    if (patch.status && !INTERVIEW_STATUSES.has(patch.status)) return fail(res, "invalid_interview_status", 422);
    if (!Object.keys(patch).length) return fail(res, "no_update_fields", 400);
    const update = { $set: patch };
    if (patch.start_at || patch.end_at) update.$inc = { reschedule_count: 1 };

    const interview = await InterviewModel.findOneAndUpdate(
      { _id: interviewId, company_id: companyData.company._id },
      update,
      { new: true, runValidators: true }
    ).populate(interviewPopulate);

    if (!interview) return fail(res, "interview_not_found", 404);

    if (req.body.status === "completed") {
      await UserApplyingJobModel.updateOne(
        { _id: interview.application_id, company_id: companyData.company._id },
        { $set: { status: "interview_completed", visible_status: "reviewing", status_changed_at: new Date(), last_activity_at: new Date() } }
      );
    }

    SendInterviewUpdatedNotification({
      user_id: interview.employee_user_id,
      job_id: interview.job_id,
      application_id: interview.application_id,
      interview_id: interview._id,
      job_name: interview.job_id?.job_name || "",
      start_at: interview.start_at,
      end_at: interview.end_at,
      meet_link: interview.meet_link,
      type: interview.type,
      office_address: interview.office_address,
    }).catch?.(console.error);

    return success(res, normalizeInterview(interview), "interview_updated");
  } catch (error) {
    next(error);
  }
};

export const cancelInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { interviewId } = req.params;
    if (!isValidObjectId(interviewId)) return fail(res, "invalid_interview_id", 400);

    const interview = await InterviewModel.findOneAndUpdate(
      { _id: interviewId, company_id: companyData.company._id },
      { $set: { status: "cancelled", cancelled_reason: req.body.reason || "" } },
      { new: true }
    );

    if (!interview) return fail(res, "interview_not_found", 404);

    const job = await jobsModel.findById(interview.job_id).select("_id job_name").lean().catch(() => null);
    SendInterviewCancelledNotification({
      user_id: interview.employee_user_id,
      job_id: interview.job_id,
      application_id: interview.application_id,
      interview_id: interview._id,
      job_name: job?.job_name || "",
      status: interview.status,
      reason: interview.cancelled_reason || "",
    }).catch?.(console.error);

    return success(res, interview, "interview_cancelled");
  } catch (error) {
    next(error);
  }
};

export default {
  getJobApplicants,
  getAllApplications,
  getApplicationDetails,
  changeApplicationStatus,
  addApplicationNote,
  rateApplicant,
  getCompanyInterviews,
  scheduleInterview,
  updateInterview,
  cancelInterview,
};
