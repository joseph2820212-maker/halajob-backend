import mongoose from "mongoose";
import {
  EmployeeModel,
  jobsModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  UserShowJobModel,
} from "../../models/index.js";

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

export const toObjectIdArray = (value) => {
  const arr = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return [...new Set(arr.map((x) => String(x || "").trim()).filter(isValidObjectId))];
};

export const normalizeArrayPayload = (body = {}, key = "items") => {
  const value = body?.[key] ?? body?.items ?? body?.data ?? body;

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  if (value && typeof value === "object") return [value];
  return [];
};

export const success = (res, data = null, message = "success", status = 200, meta = undefined) => {
  const payload = { success: true, message, data };
  if (meta !== undefined) payload.meta = meta;
  return res.status(status).json(payload);
};

export const fail = (res, message = "error", status = 400, errors = undefined) => {
  const payload = { success: false, message };
  if (errors !== undefined) payload.errors = errors;
  return res.status(status).json(payload);
};

export const getAuthUserId = (req) => {
  return req.user?._id || req.user?.id || req.user_id || req.auth?.user_id || req.authUser?._id || null;
};

export const employeePopulate = [
  { path: "user_id", select: "-password -passcode -another_device_code -pending_device -device" },
  { path: "role_id" },
  { path: "experience_level_id" },
  { path: "preferred_work_modes" },
  { path: "notice_period_id" },
  { path: "expected_salary.currency_id" },
  { path: "job_types" },
  { path: "skills.skill_id" },
  { path: "education.education_level_id" },
  { path: "languages.language_id" },
];

export const publicJobPopulate = [
  { path: "company_id", select: "company_name image cover_image company_country company_city company_type industry_name is_verified rating_avg rating_count" },
  { path: "work_mode_id" },
  { path: "job_type_id" },
  { path: "job_time_id" },
  { path: "job_salary_id" },
  { path: "experience_level_id" },
  { path: "education_level_id" },
  { path: "salary.currency_id" },
  { path: "skills_required.skill_id" },
  { path: "skills_optional.skill_id" },
  { path: "languages.language_id" },
];

export const getEmployeePlain = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId || !isValidObjectId(userId)) {
    fail(res, "unauthorized", 401);
    return null;
  }

  const employee = await EmployeeModel.findOne({ user_id: userId });
  if (!employee) {
    fail(res, "employee_profile_not_found", 404);
    return null;
  }

  return employee;
};

export const getEmployeeOrFail = async (req, res) => {
  const employee = await getEmployeePlain(req, res);
  if (!employee) return null;
  await employee.populate(employeePopulate);
  return employee;
};

export const getEmployeeUserIdOrFail = async (req, res) => {
  const employee = await getEmployeeOrFail(req, res);
  if (!employee) return null;
  const userId = employee.user_id?._id || getAuthUserId(req);
  return { employee, userId };
};

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null) return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== "";
};

export const calculateProfileCompletion = (employee = {}) => {
  const checks = [
    employee.user_id,
    employee.profile_headline,
    employee.current_job_title,
    employee.about_me,
    employee.candidate_stage && employee.candidate_stage !== "unknown",
    employee.experience_years !== undefined && employee.experience_years !== null,
    employee.experience_level_id,
    employee.expected_salary?.currency_id,
    employee.notice_period_id,
    employee.job_names,
    employee.job_types,
    employee.preferred_work_modes,
    employee.preferred_countries,
    employee.skills,
    employee.education,
    employee.languages,
    employee.cvs,
    employee.links,
  ];

  const done = checks.filter(hasValue).length;
  return Math.round((done / checks.length) * 100);
};

const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export const paginate = async (Model, filter = {}, req, options = {}) => {
  const page = parseIntBounded(req.query.page, 1, 1, 100000);
  const limit = parseIntBounded(req.query.limit || req.query.paginate, 10, 1, 100);
  const skip = (page - 1) * limit;
  const sort = options.sort || parseSort(req.query.sort) || { createdAt: -1, _id: -1 };

  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);

  if (options.select) query = query.select(options.select);
  if (options.populate) query = query.populate(options.populate);
  if (options.lean !== false) query = query.lean();

  const [items, total] = await Promise.all([
    query,
    Model.countDocuments(filter),
  ]);

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

const parseSort = (sortValue) => {
  if (!sortValue) return null;
  const value = String(sortValue).trim();
  if (!value) return null;
  const direction = value.startsWith("-") ? -1 : 1;
  const field = value.replace(/^-/, "");
  return { [field]: direction, _id: direction };
};

export const buildRecommendedJobFilter = (employee = {}) => {
  const filter = {
    status: true,
    is_accepted: true,
    publish_status: { $in: ["published", undefined, null] },
  };

  const or = [];

  if (Array.isArray(employee.job_types) && employee.job_types.length) {
    or.push({ job_type_id: { $in: employee.job_types } });
  }

  if (Array.isArray(employee.preferred_work_modes) && employee.preferred_work_modes.length) {
    or.push({ work_mode_id: { $in: employee.preferred_work_modes } });
  }

  if (Array.isArray(employee.preferred_countries) && employee.preferred_countries.length) {
    or.push({ countries: { $in: employee.preferred_countries } });
  }

  if (employee.experience_level_id) {
    or.push({ experience_level_id: employee.experience_level_id });
  }

  if (employee.candidate_stage && employee.candidate_stage !== "unknown") {
    const targetMap = {
      student: "students",
      graduate: "graduates",
      fresh_graduate: "fresh_graduates",
      experienced: "experienced",
      career_changer: "career_changers",
    };
    const target = targetMap[employee.candidate_stage];
    if (target) or.push({ candidate_target: { $in: [target, "all"] } });
  }

  if (or.length) filter.$or = or;
  return filter;
};

export const getEmployeeStats = async (userId) => {
  const [applications, saved, viewed] = await Promise.all([
    UserApplyingJobModel.countDocuments({ user_id: userId }),
    UserSavedJobModel.countDocuments({ user_id: userId }),
    UserShowJobModel.countDocuments({ user_id: userId }),
  ]);

  return { applications, saved_jobs: saved, viewed_jobs: viewed };
};

export const getCompanyIdsFromEmployeeActivity = async (userId) => {
  const [applications, saved, viewed] = await Promise.all([
    UserApplyingJobModel.find({ user_id: userId }).select("company_id job_id").lean(),
    UserSavedJobModel.find({ user_id: userId }).select("job_id").lean(),
    UserShowJobModel.find({ user_id: userId }).select("job_id").lean(),
  ]);

  const jobIds = [
    ...applications.map((x) => x.job_id).filter(Boolean),
    ...saved.map((x) => x.job_id).filter(Boolean),
    ...viewed.map((x) => x.job_id).filter(Boolean),
  ];

  const directCompanyIds = applications.map((x) => x.company_id).filter(Boolean).map(String);
  const jobs = jobIds.length ? await jobsModel.find({ _id: { $in: jobIds } }).select("company_id").lean() : [];

  return [...new Set([...directCompanyIds, ...jobs.map((j) => String(j.company_id)).filter(Boolean)])];
};

export const hasText = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

export const hasArray = (value) => {
  return Array.isArray(value) && value.length > 0;
};

export const getActiveCv = (employee) => {
  return employee?.cvs?.find((cv) => cv.status === "active") || null;
};

export const buildProfileMissingItems = (employee) => {
  const missing = [];

  const push = (key, title, description, priority = "medium", action = null) => {
    missing.push({ key, title, description, priority, action });
  };

  if (!hasText(employee?.profile_headline)) {
    push(
      "profile_headline",
      "profile_headline_missing",
      "add_profile_headline_to_improve_visibility",
      "high",
      "edit_profile"
    );
  }

  if (!hasText(employee?.current_job_title)) {
    push(
      "current_job_title",
      "current_job_title_missing",
      "add_current_or_target_job_title",
      "high",
      "edit_profile"
    );
  }

  if (!hasText(employee?.about_me)) {
    push(
      "about_me",
      "about_me_missing",
      "write_short_summary_about_your_experience",
      "high",
      "edit_profile"
    );
  }

  if (!hasArray(employee?.job_names)) {
    push(
      "job_names",
      "target_jobs_missing",
      "select_jobs_you_are_interested_in",
      "high",
      "job_preferences"
    );
  }

  if (!hasArray(employee?.skills)) {
    push(
      "skills",
      "skills_missing",
      "add_skills_to_improve_matching",
      "high",
      "skills"
    );
  }

  if (!hasArray(employee?.experience)) {
    push(
      "experience",
      "experience_missing",
      "add_work_experience_or_projects",
      "medium",
      "experience"
    );
  }

  if (!hasArray(employee?.education)) {
    push(
      "education",
      "education_missing",
      "add_your_education_history",
      "medium",
      "education"
    );
  }

  if (!hasArray(employee?.languages)) {
    push(
      "languages",
      "languages_missing",
      "add_languages_and_proficiency_level",
      "medium",
      "languages"
    );
  }

  if (!getActiveCv(employee)) {
    push(
      "active_cv",
      "active_cv_missing",
      "upload_or_build_cv_and_set_it_active",
      "high",
      "cv"
    );
  }

  if (!hasArray(employee?.preferred_work_modes)) {
    push(
      "preferred_work_modes",
      "preferred_work_modes_missing",
      "choose_remote_hybrid_or_onsite_preferences",
      "low",
      "job_preferences"
    );
  }

  if (!hasArray(employee?.preferred_countries)) {
    push(
      "preferred_countries",
      "preferred_countries_missing",
      "choose_preferred_work_countries",
      "low",
      "job_preferences"
    );
  }

  if (!employee?.expected_salary?.min && !employee?.expected_salary?.max) {
    push(
      "expected_salary",
      "expected_salary_missing",
      "add_expected_salary_range",
      "low",
      "salary"
    );
  }

  return missing;
};

export const buildProfileStrength = (completion, missingItems) => {
  const highMissing = missingItems.filter((item) => item.priority === "high").length;

  let level = "weak";
  let message = "profile_needs_completion";

  if (completion >= 85 && highMissing === 0) {
    level = "excellent";
    message = "profile_is_excellent";
  } else if (completion >= 65) {
    level = "good";
    message = "profile_is_good";
  } else if (completion >= 40) {
    level = "medium";
    message = "profile_is_medium";
  }

  return {
    level,
    message,
    completion,
    high_missing_count: highMissing,
    missing_count: missingItems.length,
  };
};

export const normalizeCompany = (company) => {
  if (!company) return null;

  return {
    _id: company._id,
    name: company.company_name || company.name || company.title || "",
    logo: company.logo || company.image || "",
    industry: company.industry || company.industry_id || null,
    country: company.country || company.country_id || null,
  };
};

export const normalizeJob = (job) => {
  if (!job) return null;

  return {
    _id: job._id,
    job_name: job.job_name,
    description: job.description,
    company: normalizeCompany(job.company_id),
    countries: job.countries || [],
    city: job.city || "",
    work_mode: job.work_mode_info || job.work_mode_id || null,
    job_type: job.job_type_info || job.job_type_id || null,
    job_time: job.job_time_info || job.job_time_id || null,
    salary: job.salary || null,
    experience_level: job.experience_level_info || job.experience_level_id || null,
    education_level: job.education_level_info || job.education_level_id || null,
    skills_required: job.skills_required || [],
    is_remote: job.is_remote,
    is_cv_required: job.is_cv_required,
    apply_deadline: job.apply_deadline,
    createdAt: job.createdAt,
    stats: {
      views: job.user_show || 0,
      reviews: job.user_review || 0,
      applications: job.user_applying || 0,
      saved: job.user_saved || 0,
      rating: job.rating || 0,
    },
  };
};

export const normalizeApplication = (application) => {
  const job = normalizeJob(application?.job_id);

  return {
    _id: application._id,
    status: application.status,
    status_changed_at: application.status_changed_at,
    applied_at: application.createdAt,
    cv: application.cv,
    cover_letter: application.cover_letter,
    cv_download: application.cv_download,
    user_job_rating: application.user_job_rating || 0,
    filter: {
      is_filter: application.is_filter,
      filter_on: application.filter_on,
      score: application.filter_result?.score ?? null,
      matched_skills: application.filter_result?.matched_skills || [],
      missing_skills: application.filter_result?.missing_skills || [],
      reason: application.filter_result?.reason || "",
    },
    job,
    company: normalizeCompany(application.company_id) || job?.company || null,
  };
};

export const normalizeSavedJob = (saved) => {
  return {
    _id: saved._id,
    saved_at: saved.createdAt,
    job: normalizeJob(saved.job_id),
  };
};

export const normalizeInterview = (interview) => {
  const job = normalizeJob(interview?.job_id);

  return {
    _id: interview._id,
    status: interview.status,
    type: interview.type,
    start_at: interview.start_at,
    end_at: interview.end_at,
    timezone: interview.timezone,
    meet_link: interview.meet_link,
    office_address: interview.office_address,
    company_note: interview.company_note,
    candidate_note: interview.candidate_note,
    reschedule_count: interview.reschedule_count || 0,
    job,
    company: normalizeCompany(interview.company_id) || job?.company || null,
    application: interview.application_id || null,
  };
};

export const buildDashboardStats = ({
  baseStats = {},
  latestApplications = [],
  savedJobs = [],
  recommendedJobs = [],
  latestJobs = [],
  matchedJobs = [],
  upcomingInterviews = [],
  smartTips = [],
}) => {
  const matchedCount = matchedJobs.length || latestJobs.length || 0;

  return {
    total_applications: baseStats.total_applications || baseStats.applications || 0,
    saved_jobs: baseStats.saved_jobs || baseStats.total_saved_jobs || 0,
    viewed_jobs: baseStats.viewed_jobs || 0,
    upcoming_interviews:
      baseStats.upcoming_interviews || upcomingInterviews.length || 0,

    latest_applications_count: latestApplications.length,
    saved_jobs_preview_count: savedJobs.length,
    recommended_jobs_count: recommendedJobs.length,

    // الاسم الصحيح الجديد
    matched_jobs_count: matchedCount,

    // alias قديم حتى لا ينكسر أي frontend قديم
    latest_jobs_count: matchedCount,

    smart_tips_count: smartTips.length,

    waiting_applications: latestApplications.filter((item) => item.status === "waiting").length,
    interview_applications: latestApplications.filter((item) => item.status === "interview").length,
    rejected_applications: latestApplications.filter((item) => item.status === "rejected").length,
    accepted_applications: latestApplications.filter((item) =>
      ["accepted", "hired", "offer"].includes(item.status)
    ).length,
  };
};

export const buildDashboardQuickActions = (missingItems) => {
  const actions = [];

  if (missingItems.some((item) => item.key === "active_cv")) {
    actions.push({
      key: "build_cv",
      title: "build_or_upload_cv",
      description: "create_cv_to_apply_faster",
      action: "cv",
      priority: "high",
    });
  }

  if (
    missingItems.some((item) =>
      ["skills", "job_names", "preferred_work_modes", "preferred_countries"].includes(item.key)
    )
  ) {
    actions.push({
      key: "complete_preferences",
      title: "complete_job_preferences",
      description: "improve_recommended_jobs",
      action: "job_preferences",
      priority: "high",
    });
  }

  actions.push({
    key: "browse_jobs",
    title: "browse_latest_jobs",
    description: "discover_new_opportunities",
    action: "jobs",
    priority: "medium",
  });

  return actions;
};
