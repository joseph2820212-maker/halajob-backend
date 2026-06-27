import mongoose from "mongoose";
import {
  jobsModel,
  UserApplyingJobModel,
  ApplicationStatusHistoryModel,
  UserSavedJobModel,
  UserShowJobModel,
  UserOutSideApplyingJobModel,
  UserReviewJobModel,
  UserRatingJobModel,
  InterviewModel,
  JobEmployeeMatchModel,
  JobInvitationModel,
} from "../../../models/index.js";

import {
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
  cleanText,
} from "../../../helper/employeeDash/employeeJobActivityHelpers.js";


import {
  application_withdrawn_company_notification,
  interview_response_company_notification,
  job_applied_notification,
  job_invitation_response_company_notification,
  job_rated_notification,
  job_reviewed_notification,
  job_seeker_saved_notification,
} from "../../../notification/JobCompanyNotifications.js";

import { calculateAtsApplicationResult } from "../../../services/matching/atsScoring.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";
import {
  assertSupportedLaunchCurrencyCode,
  isLaunchContractError,
  normalizeLaunchWorkModeKey,
} from "../../../services/globalLaunchContract.service.js";

import {
  getEmployeeUserIdOrFail,
  success,
  fail,
  paginate,
  publicJobPopulate,
  buildRecommendedJobFilter,
  isValidObjectId,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
};

const recomputeJobRating = async (jobId) => {
  const agg = await UserRatingJobModel.aggregate([
    { $match: { job_id: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: "$job_id", avg: { $avg: "$rating" }, total: { $sum: 1 } } },
  ]);
  const avg = Number((agg[0]?.avg || 0).toFixed(1));
  await jobsModel.updateOne(
    { _id: jobId },
    { $set: { rating: avg, "search_index.score_signals.rating": avg } }
  );
  return { avg, total: agg[0]?.total || 0 };
};

const toBool = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value === true || value === "true" || value === "1" || value === 1;
};

const parseArrayQuery = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchFilter = (search) => {
  const value = String(search || "").trim();
  if (!value) return null;
  const regex = new RegExp(escapeRegex(value), "i");

  return {
    $or: [
      { job_name: regex },
      { description: regex },
      { job_keywords: regex },
      { keywords_norm: regex },
      { phrases_norm: regex },
      { "search_index.text_norm": regex },
      { "search_index.tokens": regex },
      { "skills_required.title": regex },
      { "skills_optional.title": regex },
      { "search_projection.matching.text": regex },
      { "search_projection.matching.tokens": regex },
      { "search_projection.company.name": regex },
      { "search_projection.company.industry_name": regex },
    ],
  };
};

const applyCommonJobFilters = (filter, query) => {
  const {
    search,
    country,
    city,
    job_type_id,
    work_mode_id,
    work_mode,
    job_time_id,
    job_salary_id,
    experience_level_id,
    education_level_id,
    currency_code,
    is_remote,
    candidate_target,
    min_salary_usd,
    max_salary_usd,
  } = query;

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) Object.assign(filter, searchFilter);

  const countries = parseArrayQuery(country || query.countries);
  if (countries.length) filter.countries = { $in: countries };

  if (city) filter.city = new RegExp(escapeRegex(String(city).trim()), "i");

  if (job_type_id && isValidObjectId(job_type_id)) filter.job_type_id = job_type_id;
  if (work_mode_id && isValidObjectId(work_mode_id)) filter.work_mode_id = work_mode_id;
  const workModeKey = normalizeLaunchWorkModeKey(work_mode);
  if (workModeKey) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { "work_mode_info.key": workModeKey },
        { "search_index.filters.work_mode": new RegExp(`^${workModeKey}$`, "i") },
      ],
    });
  }
  if (job_time_id && isValidObjectId(job_time_id)) filter.job_time_id = job_time_id;
  if (job_salary_id && isValidObjectId(job_salary_id)) filter.job_salary_id = job_salary_id;
  if (experience_level_id && isValidObjectId(experience_level_id)) filter.experience_level_id = experience_level_id;
  if (education_level_id && isValidObjectId(education_level_id)) filter.education_level_id = education_level_id;

  const remote = toBool(is_remote);
  if (remote !== undefined) filter.is_remote = remote;

  const targets = parseArrayQuery(candidate_target);
  if (targets.length) filter.candidate_target = { $in: [...targets, "all"] };

  if (currency_code) filter["salary.currency_code"] = assertSupportedLaunchCurrencyCode(currency_code);

  if (min_salary_usd || max_salary_usd) {
    filter.$and = filter.$and || [];
    if (min_salary_usd) filter.$and.push({ "salary.max_usd": { $gte: Number(min_salary_usd) } });
    if (max_salary_usd) filter.$and.push({ "salary.min_usd": { $lte: Number(max_salary_usd) } });
  }

  return filter;
};

export const browseJobs = async (req, res, next) => {
  try {
    const filter = applyCommonJobFilters({ ...publicJobFilter }, req.query);
    const result = await paginate(jobsModel, filter, req, { populate: publicJobPopulate });
    return success(res, result.items, "jobs_list", 200, result.meta);
  } catch (error) {
    if (isLaunchContractError(error)) return fail(res, error.message, error.statusCode || 422, error.details);
    next(error);
  }
};

export const recommendedJobs = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const employeeId = employeeData.employee._id;
    const page = parseIntBounded(req.query.page, 1, 1, 100000);
    const limit = parseIntBounded(req.query.limit || req.query.paginate, 20, 1, 50);
    const skip = (page - 1) * limit;

    const hasExtraFilters = Object.keys(req.query || {}).some(
      (key) => !["page", "limit", "paginate", "sort"].includes(key)
    );

    if (!hasExtraFilters) {
      const filter = {
        employee_id: employeeId,
        is_recommended_to_employee: true,
      };

      const [items, total] = await Promise.all([
        JobEmployeeMatchModel.find(filter)
          .sort({ score: -1, generated_at: -1 })
          .skip(skip)
          .limit(limit)
          .populate({ path: "job_id", populate: publicJobPopulate })
          .populate({ path: "company_id", select: "company_name logo industry_name company_country company_city is_verified rating_avg" })
          .lean(),
        JobEmployeeMatchModel.countDocuments(filter),
      ]);

      return success(
        res,
        items,
        "recommended_jobs",
        200,
        { page, limit, total, pages: Math.ceil(total / limit) }
      );
    }

    const filter = applyCommonJobFilters(buildRecommendedJobFilter(employeeData.employee), req.query);
    const result = await paginate(jobsModel, filter, req, { populate: publicJobPopulate });

    return success(res, result.items, "recommended_jobs", 200, result.meta);
  } catch (error) {
    if (isLaunchContractError(error)) return fail(res, error.message, error.statusCode || 422, error.details);
    next(error);
  }
};

export const getJobDetails = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter }).populate(publicJobPopulate);
    if (!job) return fail(res, "job_not_found", 404);

    await UserShowJobModel.updateOne(
      { user_id: employeeData.userId, job_id: jobId },
      { $setOnInsert: { user_id: employeeData.userId, job_id: jobId } },
      { upsert: true }
    );

    await jobsModel.updateOne(
      { _id: jobId },
      {
        $inc: { user_show: 1, "search_index.score_signals.views": 1 },
      }
    );

    const [saved, applied, outsideApplied, rating, review, interviews] = await Promise.all([
      UserSavedJobModel.exists({ user_id: employeeData.userId, job_id: jobId }),
      UserApplyingJobModel.findOne({ user_id: employeeData.userId, job_id: jobId }).lean(),
      UserOutSideApplyingJobModel.exists({ user_id: employeeData.userId, job_id: jobId }),
      UserRatingJobModel.findOne({ user_id: employeeData.userId, job_id: jobId }).lean(),
      UserReviewJobModel.findOne({ user_id: employeeData.userId, job_id: jobId }).lean(),
      InterviewModel.find({ employee_user_id: employeeData.userId, job_id: jobId }).sort({ start_at: -1 }).lean(),
    ]);

    return success(
      res,
      {
        job,
        viewer_state: {
          is_saved: !!saved,
          is_applied: !!applied,
          is_outside_applied: !!outsideApplied,
          application_status: applied?.status || null,
          rating: rating?.rating || null,
          review: review?.message || null,
          interviews,
        },
      },
      "job_details"
    );
  } catch (error) {
    next(error);
  }
};

export const saveJob = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter }).select("_id job_name user_id company_id");
    if (!job) return fail(res, "job_not_found", 404);

    const result = await UserSavedJobModel.updateOne(
      { user_id: employeeData.userId, job_id: jobId },
      { $setOnInsert: { user_id: employeeData.userId, job_id: jobId } },
      { upsert: true }
    );

    if (result.upsertedCount || result.upsertedId) {
      await jobsModel.updateOne(
        { _id: jobId },
        { $inc: { user_saved: 1, "search_index.score_signals.saves": 1 } }
      );

      job_seeker_saved_notification(job, {
        candidate_user_id: employeeData.userId,
        employee_id: employeeData.employee?._id,
        dedupeKey: `job:${jobId}:saved:${employeeData.userId}`,
      }).catch?.(console.error);
      await recordAnalyticsEvent({
        req,
        event: "job_saved",
        entityType: "job",
        entityId: jobId,
        jobId,
        companyId: job.company_id,
        metadata: { source: "employee_dashboard" },
      }).catch(() => null);
    }

    return success(res, { job_id: jobId }, "job_saved");
  } catch (error) {
    if (error.code === 11000) return success(res, { job_id: req.params.jobId }, "job_already_saved");
    next(error);
  }
};

export const unsaveJob = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const deleted = await UserSavedJobModel.deleteOne({ user_id: employeeData.userId, job_id: jobId });
    if (deleted.deletedCount) {
      await jobsModel.updateOne(
        { _id: jobId },
        [
          {
            $set: {
              user_saved: { $max: [0, { $add: [{ $ifNull: ["$user_saved", 0] }, -1] }] },
              "search_index.score_signals.saves": {
                $max: [0, { $add: [{ $ifNull: ["$search_index.score_signals.saves", 0] }, -1] }],
              },
            },
          },
        ]
      );
    }

    return success(res, { job_id: jobId }, "job_unsaved");
  } catch (error) {
    next(error);
  }
};

export const savedJobs = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const result = await paginate(
      UserSavedJobModel,
      { user_id: employeeData.userId },
      req,
      { populate: [{ path: "job_id", populate: publicJobPopulate }] }
    );

    return success(res, result.items, "saved_jobs", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const applyToJob = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter }).populate("company_id");
    if (!job) return fail(res, "job_not_found", 404);

    if (job.apply_deadline && new Date(job.apply_deadline).getTime() < Date.now()) {
      return fail(res, "job_apply_deadline_passed", 410);
    }

    if (job.is_out_side) {
      const outsideResult = await UserOutSideApplyingJobModel.updateOne(
        { user_id: employeeData.userId, job_id: jobId },
        { $setOnInsert: { user_id: employeeData.userId, job_id: jobId } },
        { upsert: true }
      );

      if (outsideResult.upsertedCount || outsideResult.upsertedId) {
        await jobsModel.updateOne(
          { _id: jobId },
          { $inc: { out_side_applying: 1, "search_index.score_signals.applies": 1 } }
        );
        job_applied_notification(job, {
          user_id: employeeData.userId,
          employee_id: employeeData.employee?._id,
          job_id: jobId,
          company_id: job.company_id?._id || job.company_id,
          source: "external",
        }).catch?.(console.error);
        await recordAnalyticsEvent({
          req,
          event: "job_applied",
          entityType: "job",
          entityId: jobId,
          jobId,
          companyId: job.company_id?._id || job.company_id,
          metadata: {
            source: "employee_dashboard_external_application",
            out_link: job.out_link || "",
          },
        }).catch(() => null);
      }

      return success(res, { out_link: job.out_link }, "outside_job_apply_registered");
    }

    const user = employeeData.employee.user_id;

    const atsResult = calculateAtsApplicationResult({
      job: job.toObject ? job.toObject() : job,
      employee: employeeData.employee,
      answers: Array.isArray(req.body.answers) ? req.body.answers : req.body.answers ? JSON.parse(req.body.answers) : [],
    });
    const initialStatus = atsResult.questions.knockout.has_failed
      ? (atsResult.questions.knockout.action === "reject" && job.ats_settings?.auto_reject_on_knockout ? "rejected" : "not_match")
      : "new";

    const payload = {
      user_id: employeeData.userId,
      employee_id: employeeData.employee._id,
      job_id: jobId,
      company_id: job.company_id?._id || job.company_id,
      first_name: req.body.first_name || user?.first_name,
      last_name: req.body.last_name || user?.last_name,
      email: req.body.email || user?.email,
      phone_code: req.body.phone_code || user?.phone_code,
      phone_national: req.body.phone_national || req.body.phone || user?.phone_national,
      country_id: req.body.country_id,
      answers: atsResult.questions.details.map((item) => ({ question_id: item.question_id, question: item.question, answer: item.answer })),
      cv: req.body.cv || req.file?.path || "",
      cover_letter: req.body.cover_letter || "",
      source: req.body.source || "app",
      status: initialStatus,
      status_changed_at: new Date(),
      ats_score: atsResult.score,
      ats_summary: atsResult.summary,
      matching_details: atsResult,
      knockout_result: atsResult.questions.knockout,
      rejection_reason_code: initialStatus === "rejected" ? "failed_knockout" : "",
      rejection_reason: initialStatus === "rejected" ? "failed_knockout_question" : "",
      last_activity_at: new Date(),
    };

    const requiredFields = ["first_name", "last_name", "email", "phone_code", "phone_national", "country_id"];
    const missing = requiredFields.filter((field) => !payload[field]);
    if (missing.length) return fail(res, "missing_application_fields", 422, missing);

    const existingApplication = await UserApplyingJobModel.findOne({
      user_id: employeeData.userId,
      job_id: jobId,
    }).select("_id");
    if (existingApplication) return fail(res, "already_applied_to_job", 409);

    const application = await UserApplyingJobModel.create(payload);

    await Promise.all([
      jobsModel.updateOne(
        { _id: jobId },
        { $inc: { user_applying: 1, "search_index.score_signals.applies": 1 } }
      ),
      ApplicationStatusHistoryModel.create({
        application_id: application._id,
        job_id: jobId,
        company_id: payload.company_id,
        user_id: employeeData.userId,
        old_status: null,
        new_status: initialStatus,
        changed_by: employeeData.userId,
        actor_type: "employee",
        action: "application_created",
        note: atsResult.summary || "Application created by candidate",
        metadata: { ats_score: atsResult.score, knockout: atsResult.questions.knockout },
      }).catch(() => null),
    ]);

    job_applied_notification(job, application).catch?.(console.error);
    await writeAuditLog({
      req,
      companyId: payload.company_id,
      actorUserId: employeeData.userId,
      actorType: "employee",
      action: "application_created",
      entityType: "application",
      entityId: application._id,
      jobId,
      applicationId: application._id,
      newValue: { status: initialStatus, ats_score: atsResult.score, knockout: atsResult.questions.knockout },
    });
    await recordAnalyticsEvent({
      req,
      event: "job_applied",
      entityType: "application",
      entityId: application._id,
      jobId,
      companyId: payload.company_id,
      applicationId: application._id,
      metadata: {
        source: "employee_dashboard_internal_application",
        status: initialStatus,
        ats_score: atsResult.score,
        has_knockout_failure: Boolean(atsResult.questions.knockout.has_failed),
      },
    }).catch(() => null);

    return success(res, application, "job_application_created", 201);
  } catch (error) {
    if (error.code === 11000) return fail(res, "already_applied_to_job", 409);
    if (error instanceof SyntaxError) return fail(res, "invalid_answers_payload", 422);
    next(error);
  }
};


const createEmployeeStatusHistory = async ({
  application,
  oldStatus,
  newStatus,
  employeeData,
  note = "",
  action = "status_changed",
  visibleToCandidate = false,
  metadata = {},
}) => {
  try {
    await ApplicationStatusHistoryModel.create({
      application_id: application._id,
      job_id: application.job_id?._id || application.job_id,
      company_id: application.company_id?._id || application.company_id,
      user_id: employeeData.userId,
      old_status: oldStatus || null,
      new_status: newStatus,
      changed_by: employeeData.userId,
      actor_type: "employee",
      action,
      note,
      visible_to_candidate: visibleToCandidate,
      metadata,
    });
  } catch {
    // history must not break the main employee action
  }
};

const findOwnedApplication = async (employeeData, applicationId) => {
  if (!isValidObjectId(applicationId)) return null;
  return UserApplyingJobModel.findOne({ _id: applicationId, user_id: employeeData.userId });
};

const findOwnedInterview = async (employeeData, interviewId) => {
  if (!isValidObjectId(interviewId)) return null;
  return InterviewModel.findOne({ _id: interviewId, employee_user_id: employeeData.userId });
};

const findOwnedInvitation = async (employeeData, invitationId) => {
  if (!isValidObjectId(invitationId)) return null;
  return JobInvitationModel.findOne({ _id: invitationId, user_id: employeeData.userId });
};

const getFirstCountryId = (employee, job) => {
  const preferred = Array.isArray(employee?.preferred_countries) ? employee.preferred_countries : [];
  const jobCountries = Array.isArray(job?.countries) ? job.countries : [];
  return preferred.find(isValidObjectId) || jobCountries.find(isValidObjectId) || null;
};

const createApplicationFromInvitationIfPossible = async ({ employeeData, invitation }) => {
  const existing = await UserApplyingJobModel.findOne({
    user_id: employeeData.userId,
    job_id: invitation.job_id?._id || invitation.job_id,
  });

  if (existing) return { application: existing, created: false, reason: "already_applied" };

  const invitationJob = invitation.job_id;
  const isPopulatedJob =
    invitationJob &&
    typeof invitationJob === "object" &&
    !invitationJob._bsontype &&
    (Array.isArray(invitationJob.countries) || invitationJob.job_name || invitationJob.company_id);
  const job = isPopulatedJob ? invitationJob : await jobsModel.findById(invitationJob).lean();

  if (!job) {
    return { application: null, created: false, reason: "job_not_found" };
  }

  const employee = employeeData.employee;
  const user = employee.user_id || {};
  const countryId = getFirstCountryId(employee, job);

  if (!countryId) {
    return { application: null, created: false, reason: "missing_country_id" };
  }

  const application = await UserApplyingJobModel.create({
    user_id: employeeData.userId,
    employee_id: employee._id,
    job_id: invitation.job_id?._id || invitation.job_id,
    company_id: invitation.company_id?._id || invitation.company_id,
    first_name: user.first_name || "Candidate",
    last_name: user.last_name || user.mid_name || "Candidate",
    email: user.email || "candidate@example.com",
    phone_code: user.phone_code || "+963",
    phone_national: user.phone_national || user.phone || "000000000",
    country_id: countryId,
    answers: [],
    cv: employee.cvs?.find((cv) => cv.status === "active")?.url || employee.cvs?.[0]?.url || "",
    cover_letter: cleanText(invitation.message),
    source: "invitation",
    status: "waiting",
    status_changed_at: new Date(),
    last_activity_at: new Date(),
  });

  await Promise.all([
    jobsModel.updateOne(
      { _id: application.job_id },
      { $inc: { user_applying: 1, "search_index.score_signals.applies": 1 } }
    ).catch(() => null),
    createEmployeeStatusHistory({
      application,
      oldStatus: null,
      newStatus: "waiting",
      employeeData,
      note: "application_created_from_job_invitation",
    }),
  ]);

  job_applied_notification(job, application).catch?.(console.error);

  return { application, created: true, reason: "created" };
};

export const myApplications = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = buildApplicationFilter(employeeData, req.query);
    const result = await paginate(UserApplyingJobModel, filter, req, {
      populate: applicationPopulateForEmployee,
      sort: { last_activity_at: -1, createdAt: -1, _id: -1 },
    });

    return success(res, result.items.map(normalizeApplicationForEmployee), "my_applications", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const myRejectedApplications = async (req, res, next) => {
  req.query.status = "rejected";
  return myApplications(req, res, next);
};

export const getMyApplicationDetails = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { applicationId } = req.params;
    if (!isValidObjectId(applicationId)) return fail(res, "invalid_application_id", 400);

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, user_id: employeeData.userId })
      .populate(applicationPopulateForEmployee)
      .lean();

    if (!application) return fail(res, "application_not_found", 404);

    const [histories, interviews, invitation] = await Promise.all([
      ApplicationStatusHistoryModel.find({ application_id: application._id, user_id: employeeData.userId })
        .sort({ createdAt: -1 })
        .lean(),
      InterviewModel.find({ application_id: application._id, employee_user_id: employeeData.userId })
        .sort({ start_at: -1, createdAt: -1 })
        .populate(interviewPopulateForEmployee)
        .lean(),
      JobInvitationModel.findOne({
        job_id: application.job_id?._id || application.job_id,
        user_id: employeeData.userId,
      })
        .populate(offerPopulateForEmployee)
        .lean(),
    ]);

    return success(res, {
      ...normalizeApplicationForEmployee(application),
      histories,
      interviews: interviews.map(normalizeInterviewForEmployee),
      invitation: invitation ? normalizeOfferForEmployee(invitation) : null,
    }, "application_details");
  } catch (error) {
    next(error);
  }
};

export const cancelMyApplication = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const application = await findOwnedApplication(employeeData, req.params.applicationId);
    if (!application) return fail(res, "application_not_found", 404);

    if (["accepted", "hired", "rejected", "withdrawn", "auto_cancel"].includes(application.status)) {
      return fail(res, "application_cannot_be_withdrawn", 422);
    }

    const oldStatus = application.status;
    application.status = "withdrawn";
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();
    await application.save();

    await createEmployeeStatusHistory({
      application,
      oldStatus,
      newStatus: "withdrawn",
      employeeData,
      note: cleanText(req.body.note || "withdrawn_by_candidate"),
    });

    const job = await jobsModel.findById(application.job_id).select("_id job_name user_id company_id").lean().catch(() => null);
    if (job) application_withdrawn_company_notification(application, job).catch?.(console.error);

    return success(res, normalizeApplicationForEmployee(application), "application_withdrawn");
  } catch (error) {
    next(error);
  }
};

export const addApplicationMessage = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const application = await findOwnedApplication(employeeData, req.params.applicationId);
    if (!application) return fail(res, "application_not_found", 404);

    const message = cleanText(req.body.message || req.body.note || req.body.body);
    if (!message) return fail(res, "message_required", 422);
    const channel = cleanText(req.body.channel || "app") || "app";

    application.communication_log = application.communication_log || [];

    application.communication_log.push({
      channel,
      message,
      created_by: employeeData.userId,
      created_at: new Date(),
    });
    application.last_activity_at = new Date();

    await application.save();

    await createEmployeeStatusHistory({
      application,
      oldStatus: application.status,
      newStatus: application.status,
      employeeData,
      note: "candidate_message_added",
      action: "candidate_message_sent",
      visibleToCandidate: true,
      metadata: { channel },
    });

    const populated = await UserApplyingJobModel.findById(application._id)
      .populate(applicationPopulateForEmployee)
      .lean();

    return success(res, normalizeApplicationForEmployee(populated), "application_message_sent");
  } catch (error) {
    next(error);
  }
};

export const myInterviews = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = buildInterviewFilter(employeeData, req.query);
    const upcoming = req.query.upcoming === "true";
    const result = await paginate(InterviewModel, filter, req, {
      populate: interviewPopulateForEmployee,
      sort: { start_at: upcoming ? 1 : -1, createdAt: -1, _id: -1 },
    });

    return success(res, result.items.map(normalizeInterviewForEmployee), "my_interviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const respondToInterview = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const interview = await findOwnedInterview(employeeData, req.params.interviewId);
    if (!interview) return fail(res, "interview_not_found", 404);

    const status = cleanText(req.body.status || req.body.response);
    if (!EMPLOYEE_INTERVIEW_STATUSES.has(status) || !["accepted", "rejected"].includes(status)) {
      return fail(res, "invalid_interview_response", 422);
    }

    if (!["scheduled", "rescheduled", "accepted", "rejected"].includes(interview.status)) {
      return fail(res, "interview_cannot_be_changed", 422);
    }

    const oldInterviewStatus = interview.status;
    interview.status = status;
    if (req.body.candidate_note !== undefined || req.body.note !== undefined) {
      interview.candidate_note = cleanText(req.body.candidate_note || req.body.note);
    }
    await interview.save();

    const populated = await InterviewModel.findById(interview._id).populate(interviewPopulateForEmployee).lean();
    const job = await jobsModel.findById(interview.job_id).select("_id job_name user_id company_id").lean().catch(() => null);
    const application = await UserApplyingJobModel.findOne({ _id: interview.application_id, user_id: employeeData.userId });
    if (application) {
      await createEmployeeStatusHistory({
        application,
        oldStatus: application.status,
        newStatus: application.status,
        employeeData,
        note: cleanText(req.body.candidate_note || req.body.note || `interview_${status}`),
        action: `interview_${status}_by_candidate`,
        visibleToCandidate: true,
        metadata: { interview_id: interview._id },
      });
    }
    await writeAuditLog({
      req,
      companyId: interview.company_id || job?.company_id || null,
      actorUserId: employeeData.userId,
      actorType: "employee",
      action: `interview_${status}_by_candidate`,
      entityType: "interview",
      entityId: interview._id,
      jobId: interview.job_id,
      applicationId: interview.application_id,
      oldValue: { status: oldInterviewStatus },
      newValue: { status },
      note: cleanText(req.body.candidate_note || req.body.note || ""),
    });
    await recordAnalyticsEvent({
      req,
      event: "interview_response_saved",
      userId: employeeData.userId,
      companyId: interview.company_id || job?.company_id || null,
      entityType: "interview",
      entityId: interview._id,
      jobId: interview.job_id,
      applicationId: interview.application_id,
      metadata: {
        old_status: oldInterviewStatus,
        new_status: status,
      },
    }).catch(() => null);
    if (job) {
      interview_response_company_notification({
        interview,
        job,
        candidate: employeeData.employee?.user_id || employeeData.employee || {},
      }).catch?.(console.error);
    }
    return success(res, normalizeInterviewForEmployee(populated || interview), "interview_response_saved");
  } catch (error) {
    next(error);
  }
};

export const myJobInvitations = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = buildOfferFilter(employeeData, req.query);
    const result = await paginate(JobInvitationModel, filter, req, {
      populate: offerPopulateForEmployee,
      sort: { createdAt: -1, _id: -1 },
    });

    return success(res, result.items.map(normalizeOfferForEmployee), "job_invitations", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getMyJobInvitationDetails = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const invitation = await findOwnedInvitation(employeeData, req.params.invitationId);
    if (!invitation) return fail(res, "job_invitation_not_found", 404);

    if (invitation.status === "sent") {
      invitation.status = "seen";
      await invitation.save();
    }

    const populated = await JobInvitationModel.findById(invitation._id).populate(offerPopulateForEmployee).lean();
    return success(res, normalizeOfferForEmployee(populated || invitation), "job_invitation_details");
  } catch (error) {
    next(error);
  }
};

export const respondToJobInvitation = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const invitation = await findOwnedInvitation(employeeData, req.params.invitationId);
    if (!invitation) return fail(res, "job_invitation_not_found", 404);

    const status = cleanText(req.body.status || req.body.response);
    if (!EMPLOYEE_OFFER_STATUSES.has(status) || !["accepted", "declined"].includes(status)) {
      return fail(res, "invalid_offer_response", 422);
    }

    const expired = invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now();
    if (expired) {
      invitation.status = "expired";
      await invitation.save();
      return fail(res, "job_invitation_expired", 410);
    }

    if (!["sent", "seen", "accepted", "declined"].includes(invitation.status)) {
      return fail(res, "job_invitation_cannot_be_changed", 422);
    }

    const oldInvitationStatus = invitation.status;
    invitation.status = status;
    invitation.responded_at = new Date();
    await invitation.save();

    let applicationResult = null;
    if (status === "accepted") {
      applicationResult = await createApplicationFromInvitationIfPossible({ employeeData, invitation });
    }

    const populated = await JobInvitationModel.findById(invitation._id).populate(offerPopulateForEmployee).lean();
    const job = await jobsModel.findById(invitation.job_id).select("_id job_name user_id company_id").lean().catch(() => null);
    await writeAuditLog({
      req,
      companyId: invitation.company_id || job?.company_id || null,
      actorUserId: employeeData.userId,
      actorType: "employee",
      action: `job_invitation_${status}_by_candidate`,
      entityType: "job_invitation",
      entityId: invitation._id,
      jobId: invitation.job_id,
      oldValue: { status: oldInvitationStatus },
      newValue: { status },
      note: cleanText(req.body.note || ""),
      metadata: {
        application_created: Boolean(applicationResult?.created),
        application_id: applicationResult?.application?._id || null,
      },
    });
    await recordAnalyticsEvent({
      req,
      event: "job_invitation_response_saved",
      userId: employeeData.userId,
      companyId: invitation.company_id || job?.company_id || null,
      entityType: "job_invitation",
      entityId: invitation._id,
      jobId: invitation.job_id,
      metadata: {
        old_status: oldInvitationStatus,
        new_status: status,
        application_created: Boolean(applicationResult?.created),
      },
    }).catch(() => null);
    if (applicationResult?.created && applicationResult?.application) {
      await writeAuditLog({
        req,
        companyId: invitation.company_id || job?.company_id || null,
        actorUserId: employeeData.userId,
        actorType: "employee",
        action: "application_created_from_job_invitation",
        entityType: "application",
        entityId: applicationResult.application._id,
        jobId: invitation.job_id,
        applicationId: applicationResult.application._id,
        newValue: { status: applicationResult.application.status },
      });
      await recordAnalyticsEvent({
        req,
        event: "job_applied",
        userId: employeeData.userId,
        companyId: invitation.company_id || job?.company_id || null,
        entityType: "application",
        entityId: applicationResult.application._id,
        jobId: invitation.job_id,
        applicationId: applicationResult.application._id,
        metadata: {
          source: "job_invitation_acceptance",
          status: applicationResult.application.status,
        },
      }).catch(() => null);
    }
    if (job) {
      job_invitation_response_company_notification({
        invitation,
        job,
        candidate: employeeData.employee?.user_id || employeeData.employee || {},
      }).catch?.(console.error);
    }
    return success(res, {
      ...normalizeOfferForEmployee(populated || invitation),
      application: applicationResult?.application ? normalizeApplicationForEmployee(applicationResult.application) : null,
      application_created: Boolean(applicationResult?.created),
      application_reason: applicationResult?.reason || null,
    }, "job_invitation_response_saved");
  } catch (error) {
    if (error.code === 11000) return fail(res, "already_applied_to_job", 409);
    next(error);
  }
};

export const rateJob = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { jobId } = req.params;
    const rating = Number(req.body.rating);

    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return fail(res, "invalid_rating", 422);

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter }).select("_id job_name user_id company_id").lean();
    if (!job) return fail(res, "job_not_found", 404);

    const result = await UserRatingJobModel.findOneAndUpdate(
      { user_id: employeeData.userId, job_id: jobId },
      { $set: { user_id: employeeData.userId, job_id: jobId, rating } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const ratingInfo = await recomputeJobRating(jobId);

    job_rated_notification(job, { candidate_user_id: employeeData.userId, data: { rating } }).catch?.(console.error);

    return success(res, { rating: result, job_rating: ratingInfo.avg, total: ratingInfo.total }, "job_rated");
  } catch (error) {
    next(error);
  }
};

export const reviewJob = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { jobId } = req.params;
    const message = String(req.body.message || "").trim();

    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);
    if (!message) return fail(res, "review_message_required", 422);

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter }).select("_id job_name user_id company_id").lean();
    if (!job) return fail(res, "job_not_found", 404);

    const old = await UserReviewJobModel.findOne({ user_id: employeeData.userId, job_id: jobId });
    const result = await UserReviewJobModel.findOneAndUpdate(
      { user_id: employeeData.userId, job_id: jobId },
      { $set: { user_id: employeeData.userId, job_id: jobId, message } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!old) {
      await jobsModel.updateOne(
        { _id: jobId },
        { $inc: { user_review: 1, "search_index.score_signals.reviews": 1 } }
      );
    }

    job_reviewed_notification(job, { candidate_user_id: employeeData.userId }).catch?.(console.error);

    return success(res, result, "job_review_saved");
  } catch (error) {
    next(error);
  }
};

export default {
  browseJobs,
  recommendedJobs,
  getJobDetails,
  saveJob,
  unsaveJob,
  savedJobs,
  applyToJob,
  myApplications,
  myRejectedApplications,
  getMyApplicationDetails,
  cancelMyApplication,
  addApplicationMessage,
  myInterviews,
  respondToInterview,
  myJobInvitations,
  getMyJobInvitationDetails,
  respondToJobInvitation,
  rateJob,
  reviewJob,
};
