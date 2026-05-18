import mongoose from "mongoose";
import {
  ApplicationStatusHistoryModel,
  EmployeeModel,
  InterviewModel,
  JobInvitationModel,
  UserApplyingJobModel,
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

const withTransaction = async (handler) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await handler(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const createStatusHistory = async ({ application, oldStatus, newStatus, companyData, note = "", session = null }) => {
  return ApplicationStatusHistoryModel.create(
    [
      {
        application_id: application._id,
        job_id: application.job_id,
        company_id: application.company_id,
        user_id: application.user_id,
        old_status: oldStatus || null,
        new_status: newStatus,
        changed_by: companyData?.userId || null,
        actor_type: "company",
        note,
      },
    ],
    session ? { session } : undefined
  );
};

export const getHiringSummary = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const companyId = companyData.company._id;
    const now = new Date();

    const [applications, waiting, interview, offer, accepted, rejected, interviews, upcomingInterviews, invitations, sentInvitations, acceptedInvitations] = await Promise.all([
      UserApplyingJobModel.countDocuments({ company_id: companyId }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "waiting" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "interview" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "offer" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["accepted", "hired"] } }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "rejected" }),
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
    return success(res, result.items.map(normalizeApplication), "applications", 200, result.meta);
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
    return success(res, result.items.map(normalizeApplicant), "applicants", 200, result.meta);
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
        ...normalizeApplicant(application),
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
    application.status = status;
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();

    await withTransaction(async (session) => {
      await application.save({ session });
      await createStatusHistory({
        application,
        oldStatus,
        newStatus: status,
        companyData,
        note: cleanText(req.body.note),
        session,
      });
    });

    return success(res, normalizeApplication(application), "application_status_updated");
  } catch (error) {
    next(error);
  }
};

export const createInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.body.application_id || req.params.applicationId);
    if (!application) return;

    const { payload, error } = buildInterviewPayload({ body: req.body, companyData, application });
    if (error) return fail(res, error, 422);

    let interview;
    await withTransaction(async (session) => {
      [interview] = await InterviewModel.create([payload], { session });

      const oldStatus = application.status;
      application.status = "interview";
      application.status_changed_at = new Date();
      application.last_activity_at = new Date();
      await application.save({ session });

      await createStatusHistory({
        application,
        oldStatus,
        newStatus: "interview",
        companyData,
        note: cleanText(req.body.company_note || req.body.note || "interview_scheduled"),
        session,
      });
    });

    const populated = await InterviewModel.findById(interview._id)
      .populate({ path: "job_id", select: "job_name city salary" })
      .populate({ path: "application_id", select: "first_name last_name email phone_code phone_national status" })
      .populate({ path: "employee_user_id", select: "first_name mid_name last_name email image" })
      .lean();

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

    const willReschedule = payload.start_at && String(payload.start_at) !== String(interview.start_at);
    Object.assign(interview, payload);
    if (willReschedule) {
      interview.status = "rescheduled";
      interview.reschedule_count = Number(interview.reschedule_count || 0) + 1;
    }

    await interview.save();
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

    interview.status = status;
    if (req.body.result_note !== undefined) interview.result_note = cleanText(req.body.result_note);
    if (req.body.rating !== undefined) interview.rating = toNumber(req.body.rating, null);
    await interview.save();

    return success(res, normalizeInterview(interview), "interview_status_updated");
  } catch (error) {
    next(error);
  }
};

export const sendJobInvitation = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.body.job_id || req.params.jobId, "_id job_name company_id");
    if (!job) return;

    const employee = await findEmployeeForInvitationOrFail(req, res);
    if (!employee) return;

    const userId = employee.user_id?._id || employee.user_id;
    if (!userId) return fail(res, "employee_user_not_found", 422);

    const expiresAt = toDateOrNull(req.body.expires_at || req.body.expiresAt);

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

    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_cancelled");
  } catch (error) {
    next(error);
  }
};


export const getApplicationCv = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!ensureObjectId(res, applicationId, "invalid_application_id")) return;

    const application = await populateApplicationQuery(
      UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id })
    ).lean();

    if (!application) return fail(res, "application_not_found", 404);

    const applicantCv = application.cv || null;
    const employeeCvs = (application.employee_id?.cvs || []).filter((cv) => !cv.status || cv.status === "active");
    const firstCv = applicantCv || employeeCvs?.[0]?.url || employeeCvs?.[0]?.file || employeeCvs?.[0]?.path || employeeCvs?.[0] || null;

    if (!firstCv && !employeeCvs.length) {
      return fail(res, "cv_not_found", 404);
    }

    return success(res, {
      application_id: application._id,
      employee_id: application.employee_id?._id || null,
      cv: applicantCv,
      cvs: employeeCvs,
      download_url: typeof firstCv === "string" ? firstCv : firstCv?.url || firstCv?.file || firstCv?.path || null,
    }, "application_cv");
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
    application.status = "rejected";
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();

    await withTransaction(async (session) => {
      await application.save({ session });
      await createStatusHistory({
        application,
        oldStatus,
        newStatus: "rejected",
        companyData,
        note,
        session,
      });
    });

    return success(res, {
      application: normalizeApplication(application),
      employee_blocked: Boolean(employee),
      employee_id: employee?._id || employeeId || null,
    }, "applicant_blocked");
  } catch (error) {
    next(error);
  }
};

export const getCompanyJobReviews = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const job = req.params.jobId
      ? await getOwnedJobOrFail(req, res, companyData.company._id, req.params.jobId, "_id")
      : null;
    if (req.params.jobId && !job) return;

    const jobIds = req.params.jobId
      ? [job._id]
      : await mongoose.model("jobs").find({ company_id: companyData.company._id }).distinct("_id");

    const filter = { job_id: { $in: jobIds } };
    const result = await paginate(mongoose.model("user_reviews_jobs"), filter, req, {
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
  getApplicationCv,
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
