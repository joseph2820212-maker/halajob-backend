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
} from "../../../models/index.js";
import {
  getEmployeeUserIdOrFail,
  success,
  fail,
  paginate,
  publicJobPopulate,
  buildRecommendedJobFilter,
  isValidObjectId,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
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

const buildSearchFilter = (search) => {
  const value = String(search || "").trim();
  if (!value) return null;
  const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

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

  if (city) filter.city = new RegExp(String(city).trim(), "i");

  if (job_type_id && isValidObjectId(job_type_id)) filter.job_type_id = job_type_id;
  if (work_mode_id && isValidObjectId(work_mode_id)) filter.work_mode_id = work_mode_id;
  if (job_time_id && isValidObjectId(job_time_id)) filter.job_time_id = job_time_id;
  if (job_salary_id && isValidObjectId(job_salary_id)) filter.job_salary_id = job_salary_id;
  if (experience_level_id && isValidObjectId(experience_level_id)) filter.experience_level_id = experience_level_id;
  if (education_level_id && isValidObjectId(education_level_id)) filter.education_level_id = education_level_id;

  const remote = toBool(is_remote);
  if (remote !== undefined) filter.is_remote = remote;

  const targets = parseArrayQuery(candidate_target);
  if (targets.length) filter.candidate_target = { $in: [...targets, "all"] };

  if (currency_code) filter["salary.currency_code"] = String(currency_code).trim().toUpperCase();

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
    next(error);
  }
};

export const recommendedJobs = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const employeeId = employeeData.employee._id;
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || req.query.paginate || 20), 1), 50);
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

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter }).select("_id");
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
        { _id: jobId, user_saved: { $gt: 0 } },
        { $inc: { user_saved: -1, "search_index.score_signals.saves": -1 } }
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
        await jobsModel.updateOne({ _id: jobId }, { $inc: { out_side_applying: 1 } });
      }

      return success(res, { out_link: job.out_link }, "outside_job_apply_registered");
    }

    const user = employeeData.employee.user_id;

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
      answers: Array.isArray(req.body.answers) ? req.body.answers : req.body.answers ? JSON.parse(req.body.answers) : [],
      cv: req.body.cv || req.file?.path || "",
      cover_letter: req.body.cover_letter || "",
      source: req.body.source || "app",
      status: "waiting",
      status_changed_at: new Date(),
      last_activity_at: new Date(),
    };

    const requiredFields = ["first_name", "last_name", "email", "phone_code", "phone_national", "country_id"];
    const missing = requiredFields.filter((field) => !payload[field]);
    if (missing.length) return fail(res, "missing_application_fields", 422, missing);

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
        new_status: "waiting",
        changed_by: employeeData.userId,
        note: "Application created by candidate",
      }).catch(() => null),
    ]);

    return success(res, application, "job_application_created", 201);
  } catch (error) {
    if (error.code === 11000) return fail(res, "already_applied_to_job", 409);
    if (error instanceof SyntaxError) return fail(res, "invalid_answers_payload", 422);
    next(error);
  }
};

export const myApplications = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = { user_id: employeeData.userId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.job_id && isValidObjectId(req.query.job_id)) filter.job_id = req.query.job_id;
    if (req.query.company_id && isValidObjectId(req.query.company_id)) filter.company_id = req.query.company_id;

    const result = await paginate(UserApplyingJobModel, filter, req, {
      populate: [{ path: "job_id", populate: publicJobPopulate }, { path: "company_id" }],
    });

    return success(res, result.items, "my_applications", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const myInterviews = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const filter = { employee_user_id: employeeData.userId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.upcoming === "true") filter.start_at = { $gte: new Date() };

    const result = await paginate(InterviewModel, filter, req, {
      populate: [
        { path: "application_id" },
        { path: "job_id", populate: publicJobPopulate },
        { path: "company_id" },
      ],
      sort: { start_at: req.query.upcoming === "true" ? 1 : -1, createdAt: -1 },
    });

    return success(res, result.items, "my_interviews", 200, result.meta);
  } catch (error) {
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

    const result = await UserRatingJobModel.findOneAndUpdate(
      { user_id: employeeData.userId, job_id: jobId },
      { user_id: employeeData.userId, job_id: jobId, rating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return success(res, result, "job_rated");
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

    const result = await UserReviewJobModel.findOneAndUpdate(
      { user_id: employeeData.userId, job_id: jobId },
      { user_id: employeeData.userId, job_id: jobId, message },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await jobsModel.updateOne(
      { _id: jobId },
      { $inc: { user_review: 1, "search_index.score_signals.reviews": 1 } }
    );

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
  myInterviews,
  rateJob,
  reviewJob,
};
