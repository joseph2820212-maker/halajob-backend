import {
  UserApplyingJobModel,
  ApplicationStatusHistoryModel,
  InterviewModel,
  jobsModel,
} from "../../../models/index.js";

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

export const getJobApplicants = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const job = await jobsModel.exists({ _id: jobId, company_id: companyData.company._id });
    if (!job) return fail(res, "job_not_found", 404);

    const filter = { company_id: companyData.company._id, job_id: jobId };
    if (req.query.status) filter.status = req.query.status;

    const result = await paginate(UserApplyingJobModel, filter, req, { populate: applicationPopulate });
    return success(res, result.items.map(normalizeApplication), "job_applicants", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = { company_id: companyData.company._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.job_id && isValidObjectId(req.query.job_id)) filter.job_id = req.query.job_id;

    const result = await paginate(UserApplyingJobModel, filter, req, { populate: applicationPopulate });
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

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id });
    if (!application) return fail(res, "application_not_found", 404);

    const oldStatus = application.status;
    application.status = newStatus;
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();
    await application.save();

    await ApplicationStatusHistoryModel.create({
      application_id: application._id,
      job_id: application.job_id,
      company_id: companyData.company._id,
      user_id: application.user_id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: companyData.userId,
      note: req.body.note || "Status changed by company",
    }).catch(() => null);

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

    const interview = await InterviewModel.create({
      application_id,
      job_id,
      company_id: companyData.company._id,
      employee_user_id,
      type: req.body.type || "online",
      status: req.body.status || "scheduled",
      start_at,
      end_at,
      timezone: req.body.timezone || companyData.company.timezone || "UTC",
      meet_link: req.body.meet_link || "",
      office_address: req.body.office_address || "",
      company_note: req.body.company_note || "",
      candidate_note: req.body.candidate_note || "",
    });

    application.status = "interview";
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();
    await application.save();

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

    const interview = await InterviewModel.findOneAndUpdate(
      { _id: interviewId, company_id: companyData.company._id },
      { $set: req.body, $inc: req.body.start_at || req.body.end_at ? { reschedule_count: 1 } : {} },
      { new: true, runValidators: true }
    ).populate(interviewPopulate);

    if (!interview) return fail(res, "interview_not_found", 404);
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
