import {
  UserApplyingJobModel,
  ApplicationStatusHistoryModel,
  InterviewModel,
  JobInvitationModel,
  jobsModel,
} from "../../../models/index.js";

import {
  getEmployeeUserIdOrFail,
  success,
  fail,
  paginate,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

import {
  isValidObjectId,
  cleanText,
  EMPLOYEE_APPLICATION_STATUSES,
  EMPLOYEE_INTERVIEW_STATUSES,
  EMPLOYEE_OFFER_STATUSES,
  buildApplicationFilter,
  buildInterviewFilter,
  buildOfferFilter,
  applicationPopulateForEmployee,
  interviewPopulateForEmployee,
  offerPopulateForEmployee,
  normalizeApplicationForEmployee,
  normalizeInterviewForEmployee,
  normalizeOfferForEmployee,
} from "../../../helper/employeeDash/employeeJobActivityHelpers.js";

const canEmployeeWithdrawApplication = (status) =>
  !["hired", "rejected", "withdrawn", "auto_cancel"].includes(status);

const canEmployeeRespondInterview = (status) =>
  ["scheduled", "rescheduled"].includes(status);

const canEmployeeRespondOffer = (status) =>
  ["sent", "seen"].includes(status);

const createStatusHistory = async ({ application, oldStatus, newStatus, userId, note = "" }) => {
  if (!application?._id) return null;

  return ApplicationStatusHistoryModel.create({
    application_id: application._id,
    job_id: application.job_id,
    company_id: application.company_id,
    user_id: application.user_id,
    old_status: oldStatus || null,
    new_status: newStatus,
    changed_by: userId,
    actor_type: "employee",
    note,
  }).catch(() => null);
};

export const getMyApplications = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = buildApplicationFilter(employeeData, req.query);

    const result = await paginate(UserApplyingJobModel, filter, req, {
      populate: applicationPopulateForEmployee,
      sort: req.query.sort ? undefined : { last_activity_at: -1, createdAt: -1, _id: -1 },
    });

    const items = result.items.map(normalizeApplicationForEmployee);
    return success(res, items, "my_applications", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getMyApplicationDetails = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const application = await UserApplyingJobModel.findOne({
      _id: applicationId,
      user_id: employeeData.userId,
    })
      .populate(applicationPopulateForEmployee)
      .lean();

    if (!application) return fail(res, "application_not_found", 404);

    const [interviews, history] = await Promise.all([
      InterviewModel.find({ application_id: applicationId, employee_user_id: employeeData.userId })
        .sort({ start_at: -1, createdAt: -1 })
        .populate(interviewPopulateForEmployee)
        .lean(),
      ApplicationStatusHistoryModel.find({ application_id: applicationId, user_id: employeeData.userId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return success(
      res,
      {
        application: normalizeApplicationForEmployee(application),
        interviews: interviews.map(normalizeInterviewForEmployee),
        history,
      },
      "my_application_details"
    );
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const application = await UserApplyingJobModel.findOne({
      _id: applicationId,
      user_id: employeeData.userId,
    });

    if (!application) return fail(res, "application_not_found", 404);
    if (!canEmployeeWithdrawApplication(application.status)) {
      return fail(res, "application_cannot_be_withdrawn", 409);
    }

    const oldStatus = application.status;
    application.status = "withdrawn";
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();
    await application.save();

    await Promise.all([
      createStatusHistory({
        application,
        oldStatus,
        newStatus: "withdrawn",
        userId: employeeData.userId,
        note: cleanText(req.body.note || "Application withdrawn by candidate"),
      }),
      jobsModel.updateOne(
        { _id: application.job_id, user_applying: { $gt: 0 } },
        { $inc: { user_applying: -1, "search_index.score_signals.applies": -1 } }
      ).catch(() => null),
    ]);

    const updated = await UserApplyingJobModel.findById(applicationId)
      .populate(applicationPopulateForEmployee)
      .lean();

    return success(res, normalizeApplicationForEmployee(updated), "application_withdrawn");
  } catch (error) {
    next(error);
  }
};

export const getMyInterviews = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = buildInterviewFilter(employeeData, req.query);
    const sort = req.query.upcoming === "true"
      ? { start_at: 1, createdAt: -1, _id: -1 }
      : { start_at: -1, createdAt: -1, _id: -1 };

    const result = await paginate(InterviewModel, filter, req, {
      populate: interviewPopulateForEmployee,
      sort,
    });

    const items = result.items.map(normalizeInterviewForEmployee);
    return success(res, items, "my_interviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getMyInterviewDetails = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { interviewId } = req.params;
    if (!isValidObjectId(interviewId)) return fail(res, "invalid_interview_id", 400);

    const interview = await InterviewModel.findOne({
      _id: interviewId,
      employee_user_id: employeeData.userId,
    })
      .populate(interviewPopulateForEmployee)
      .lean();

    if (!interview) return fail(res, "interview_not_found", 404);

    return success(res, normalizeInterviewForEmployee(interview), "my_interview_details");
  } catch (error) {
    next(error);
  }
};

export const respondToInterview = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { interviewId } = req.params;
    const action = cleanText(req.body.action || req.body.status).toLowerCase();

    if (!isValidObjectId(interviewId)) return fail(res, "invalid_interview_id", 400);
    if (!["accepted", "rejected"].includes(action)) return fail(res, "invalid_interview_response", 422);

    const interview = await InterviewModel.findOne({
      _id: interviewId,
      employee_user_id: employeeData.userId,
    });

    if (!interview) return fail(res, "interview_not_found", 404);
    if (!canEmployeeRespondInterview(interview.status)) {
      return fail(res, "interview_cannot_be_responded", 409);
    }

    interview.status = action;
    if (req.body.candidate_note !== undefined || req.body.note !== undefined) {
      interview.candidate_note = cleanText(req.body.candidate_note || req.body.note);
    }
    await interview.save();

    const application = interview.application_id
      ? await UserApplyingJobModel.findOne({ _id: interview.application_id, user_id: employeeData.userId })
      : null;

    if (application && action === "accepted") {
      const oldStatus = application.status;
      application.status = "interview";
      application.status_changed_at = new Date();
      application.last_activity_at = new Date();
      await application.save();
      await createStatusHistory({
        application,
        oldStatus,
        newStatus: "interview",
        userId: employeeData.userId,
        note: "Interview accepted by candidate",
      });
    }

    const updated = await InterviewModel.findById(interviewId)
      .populate(interviewPopulateForEmployee)
      .lean();

    return success(res, normalizeInterviewForEmployee(updated), `interview_${action}`);
  } catch (error) {
    next(error);
  }
};

export const getMyOffers = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = buildOfferFilter(employeeData, req.query);

    const result = await paginate(JobInvitationModel, filter, req, {
      populate: offerPopulateForEmployee,
      sort: { createdAt: -1, _id: -1 },
    });

    const items = result.items.map(normalizeOfferForEmployee);
    return success(res, items, "my_job_offers", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getMyOfferDetails = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { offerId } = req.params;
    if (!isValidObjectId(offerId)) return fail(res, "invalid_offer_id", 400);

    const offer = await JobInvitationModel.findOne({
      _id: offerId,
      user_id: employeeData.userId,
    })
      .populate(offerPopulateForEmployee)
      .lean();

    if (!offer) return fail(res, "offer_not_found", 404);

    if (offer.status === "sent") {
      await JobInvitationModel.updateOne(
        { _id: offerId, user_id: employeeData.userId, status: "sent" },
        { $set: { status: "seen" } }
      );
      offer.status = "seen";
    }

    return success(res, normalizeOfferForEmployee(offer), "my_offer_details");
  } catch (error) {
    next(error);
  }
};

export const respondToOffer = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { offerId } = req.params;
    const action = cleanText(req.body.action || req.body.status).toLowerCase();

    if (!isValidObjectId(offerId)) return fail(res, "invalid_offer_id", 400);
    if (!["accepted", "declined"].includes(action)) return fail(res, "invalid_offer_response", 422);

    const offer = await JobInvitationModel.findOne({
      _id: offerId,
      user_id: employeeData.userId,
    });

    if (!offer) return fail(res, "offer_not_found", 404);

    if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
      offer.status = "expired";
      await offer.save();
      return fail(res, "offer_expired", 410);
    }

    if (!canEmployeeRespondOffer(offer.status)) {
      return fail(res, "offer_cannot_be_responded", 409);
    }

    offer.status = action;
    offer.responded_at = new Date();
    await offer.save();

    if (action === "accepted") {
      const application = await UserApplyingJobModel.findOne({
        user_id: employeeData.userId,
        job_id: offer.job_id,
      });

      if (application) {
        const oldStatus = application.status;
        application.status = application.status === "hired" ? "hired" : "offer";
        application.status_changed_at = new Date();
        application.last_activity_at = new Date();
        await application.save();

        await createStatusHistory({
          application,
          oldStatus,
          newStatus: application.status,
          userId: employeeData.userId,
          note: "Offer accepted by candidate",
        });
      }
    }

    const updated = await JobInvitationModel.findById(offerId)
      .populate(offerPopulateForEmployee)
      .lean();

    return success(res, normalizeOfferForEmployee(updated), `offer_${action}`);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeJobActivityStatistics = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const now = new Date();

    const [
      applications_count,
      waiting_applications,
      interview_applications,
      offer_applications,
      accepted_applications,
      rejected_applications,
      upcoming_interviews_count,
      offers_count,
      active_offers_count,
    ] = await Promise.all([
      UserApplyingJobModel.countDocuments({ user_id: employeeData.userId }),
      UserApplyingJobModel.countDocuments({ user_id: employeeData.userId, status: "waiting" }),
      UserApplyingJobModel.countDocuments({ user_id: employeeData.userId, status: "interview" }),
      UserApplyingJobModel.countDocuments({ user_id: employeeData.userId, status: "offer" }),
      UserApplyingJobModel.countDocuments({ user_id: employeeData.userId, status: { $in: ["accepted", "hired"] } }),
      UserApplyingJobModel.countDocuments({ user_id: employeeData.userId, status: "rejected" }),
      InterviewModel.countDocuments({
        employee_user_id: employeeData.userId,
        status: { $in: ["scheduled", "rescheduled", "accepted"] },
        start_at: { $gte: now },
      }),
      JobInvitationModel.countDocuments({ user_id: employeeData.userId }),
      JobInvitationModel.countDocuments({
        user_id: employeeData.userId,
        status: { $in: ["sent", "seen"] },
        $or: [{ expires_at: null }, { expires_at: { $gte: now } }],
      }),
    ]);

    return success(
      res,
      {
        applications_count,
        waiting_applications,
        interview_applications,
        offer_applications,
        accepted_applications,
        rejected_applications,
        upcoming_interviews_count,
        offers_count,
        active_offers_count,
      },
      "employee_job_activity_statistics"
    );
  } catch (error) {
    next(error);
  }
};

export const getEmployeeJobActivityOptions = async (req, res, next) => {
  try {
    return success(
      res,
      {
        application_statuses: [...EMPLOYEE_APPLICATION_STATUSES],
        interview_statuses: [...EMPLOYEE_INTERVIEW_STATUSES],
        offer_statuses: [...EMPLOYEE_OFFER_STATUSES],
      },
      "employee_job_activity_options"
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getMyApplications,
  getMyApplicationDetails,
  withdrawApplication,
  getMyInterviews,
  getMyInterviewDetails,
  respondToInterview,
  getMyOffers,
  getMyOfferDetails,
  respondToOffer,
  getEmployeeJobActivityStatistics,
  getEmployeeJobActivityOptions,
};
