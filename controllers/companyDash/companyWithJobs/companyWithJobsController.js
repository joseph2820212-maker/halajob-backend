import * as Models from "../../../models/index.js";

import { rebuildJobIntegration } from "../../../services/search/rebuildSearchData.js";

import {
  getCompanyUserIdOrFail,
  success,
  fail,
  paginate,
  companyJobPopulate,
  isValidObjectId,
  normalizeJob,
  buildJobSearchFilter,
} from "../../../helper/companyDash/companyDashHelpers.js";

const {
  jobsModel,
  UserApplyingJobModel,
  JobEmployeeMatchModel,
  JobNameModel,
  Job_nameModel,
  WorkModeModel,
  JobTypeModel,
  WorkTimeTypeModel,
  WorkTimeModel,
  JobSalaryModel,
  CurrencyModel,
  SkillModel,
  LanguageModel,
  ExperienceLevelModel,
  EducationLevelModel,
  JobServiceModel,
  jobServiceModel,
} = Models;

const JobNameLookupModel = JobNameModel || Job_nameModel;
const WorkTimeLookupModel = WorkTimeTypeModel || WorkTimeModel;
const JobServiceLookupModel = JobServiceModel || jobServiceModel;
const ExperienceLevelLookupModel = ExperienceLevelModel;
const EducationLevelLookupModel = EducationLevelModel;

const TRUE_VALUES = ["on", "true", true, "1", 1, "yes", "y"];
const FALSE_VALUES = ["off", "false", false, "0", 0, "no", "n"];
const PUBLISHED_STATUSES = new Set(["published", "paused", "closed", "rejected", "archived", "pending_review"]);

const cleanText = (value = "") => String(value || "").trim();

const toBool = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (TRUE_VALUES.includes(value)) return true;
  if (FALSE_VALUES.includes(value)) return false;

  const normalized = String(value).trim().toLowerCase();
  if (TRUE_VALUES.includes(normalized)) return true;
  if (FALSE_VALUES.includes(normalized)) return false;

  return Boolean(value);
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeKey = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

const parseMaybeJson = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value;

  const text = value.trim();
  if (!text || text === "[object Object]" || text.includes("[object Object]")) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toArray = (value) => {
  const parsed = parseMaybeJson(value);

  if (parsed === undefined || parsed === null || parsed === "") return [];
  if (Array.isArray(parsed)) return parsed;

  if (typeof parsed === "string") {
    return parsed
      .split(/[,;\n]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((x) => x !== "[object Object]");
  }

  return [parsed];
};

const parseArrayQuery = (value) => toArray(value).map(String).filter(Boolean);

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const validObjectIdOrNull = (value) => {
  const id = String(value?._id || value?.id || value || "").trim();
  return isValidObjectId(id) ? id : null;
};

const getLabel = (value) => {
  if (!value) return "";
  if (typeof value === "string") return cleanText(value);

  return cleanText(
    value.title ||
      value.name ||
      value.label ||
      value.title_en ||
      value.title_ar ||
      value.value ||
      ""
  );
};

const levelToNumber = (value, fallback = 1) => {
  if (value === undefined || value === null || value === "") return fallback;

  const map = {
    beginner: 1,
    basic: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
    native: 5,
    fluent: 4,
  };

  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    if (map[key]) return map[key];

    const n = Number(key);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 5) : fallback;
  }

  const n = Number(value);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 5) : fallback;
};

const normalizeQuestionOptions = (options) =>
  toArray(options)
    .map((op) => {
      if (typeof op === "string") {
        const label = cleanText(op);
        return label ? { label, is_correct: false } : null;
      }

      const label = cleanText(op?.label || op?.name || op?.title || op?.value || "");
      if (!label) return null;

      return {
        label,
        is_correct: Boolean(toBool(op?.is_correct ?? op?.correct)),
      };
    })
    .filter(Boolean);

const normalizeQuestions = (value) =>
  toArray(value)
    .map((q) => {
      const item = parseMaybeJson(q) || {};
      const question = cleanText(item.question || item.title || item.name);
      if (!question) return null;

      return {
        question,
        type: item.type || "text",
        options: normalizeQuestionOptions(item.options),
        is_required: Boolean(toBool(item.is_required ?? item.required)),
        correct_answer: item.correct_answer ?? null,
        help_text: cleanText(item.help_text || ""),
      };
    })
    .filter(Boolean)
    .slice(0, 5);

const normalizeEmails = (value) =>
  toArray(value)
    .flatMap((item) => String(item || "").split(/[;,\s]+/))
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

const createLookupIfMissing = async (Model, value, extra = {}) => {
  if (!Model || value === undefined || value === null || value === "") return null;

  const id = validObjectIdOrNull(value);
  if (id) return await Model.findById(id).lean();

  const parsed = parseMaybeJson(value);
  const label = getLabel(parsed);
  if (!label) return null;

  const key = normalizeKey(label);

  const existing = await Model.findOne({
    $or: [
      { key },
      { title_en: new RegExp(`^${escapeRegex(label)}$`, "i") },
      { title_ar: new RegExp(`^${escapeRegex(label)}$`, "i") },
      { name: new RegExp(`^${escapeRegex(label)}$`, "i") },
      { title: new RegExp(`^${escapeRegex(label)}$`, "i") },
    ],
  }).lean();

  if (existing) return existing;

  const doc = await Model.create({
    key,
    title_ar: label,
    title_en: label,
    title: label,
    name: label,
    keywords_ar: [label],
    keywords_en: [label],
    is_active: true,
    is_system: false,
    ...extra,
  });

  return doc?.toObject ? doc.toObject() : doc;
};

const normalizeSkills = async (value) => {
  const result = [];

  for (const raw of toArray(value)) {
    const item = parseMaybeJson(raw) || {};
    const skillDoc = await createLookupIfMissing(
      SkillModel,
      item.skill_id || item.id || item._id || item.title || item.name || item
    );

    const title =
      getLabel(item) || skillDoc?.title_en || skillDoc?.title_ar || skillDoc?.title || skillDoc?.name || "";

    if (!title) continue;

    result.push({
      skill_id: skillDoc?._id || validObjectIdOrNull(item.skill_id || item.id || item._id) || null,
      title,
      level: levelToNumber(item.level, 3),
      years: Math.max(Number(item.years || 0), 0),
    });
  }

  return result;
};

const normalizeLanguages = async (value) => {
  const result = [];

  for (const raw of toArray(value)) {
    const item = parseMaybeJson(raw) || {};
    const langDoc = await createLookupIfMissing(
      LanguageModel,
      item.language_id || item.id || item._id || item.name || item.title || item
    );

    const name = getLabel(item) || langDoc?.title_ar || langDoc?.title_en || langDoc?.name || "";
    if (!langDoc?._id && !name) continue;

    result.push({
      language_id: langDoc?._id || validObjectIdOrNull(item.language_id || item.id || item._id) || null,
      name,
      level: levelToNumber(item.level, 1),
      level_text: cleanText(item.level || ""),
    });
  }

  return result;
};

const normalizeServices = async (value) => {
  const result = [];

  for (const raw of toArray(value)) {
    const item = parseMaybeJson(raw) || {};
    const serviceDoc = await createLookupIfMissing(
      JobServiceLookupModel,
      item.service_id || item.id || item._id || item.title || item.name || item
    );

    const title =
      getLabel(item) || serviceDoc?.title_ar || serviceDoc?.title_en || serviceDoc?.title || serviceDoc?.name || "";

    if (!serviceDoc?._id && !title) continue;

    result.push({
      service_id: serviceDoc?._id || validObjectIdOrNull(item.service_id || item.id || item._id) || null,
      title,
      name: serviceDoc?.name || title,
      title_ar: serviceDoc?.title_ar || title,
      title_en: serviceDoc?.title_en || title,
    });
  }

  return result;
};

const buildCheckedIdsFromBody = (body = {}, prefix = "") =>
  Object.entries(body)
    .filter(([key, value]) => {
      if (!key.startsWith(prefix)) return false;
      const id = key.replace(prefix, "");
      return isValidObjectId(id) && TRUE_VALUES.includes(value);
    })
    .map(([key]) => key.replace(prefix, ""));

const buildCheckedCountriesFromBody = (body = {}) => buildCheckedIdsFromBody(body, "country_");
const buildCheckedCitiesFromBody = (body = {}) => buildCheckedIdsFromBody(body, "city_");

const normalizePublishStatus = (value) => {
  const status = cleanText(value || "published");
  return PUBLISHED_STATUSES.has(status) ? status : "published";
};

const buildSearchFilter = (search) => {
  const value = cleanText(search);
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
      { "languages.name": regex },
      { "job_services.title": regex },
      { "job_services.title_ar": regex },
      { "job_services.title_en": regex },
    ],
  };
};

const applyCompanyJobFilters = (filter, query = {}) => {
  const searchFilter = buildSearchFilter(query.search);
  if (searchFilter) Object.assign(filter, searchFilter);

  if (query.status !== undefined) filter.status = toBool(query.status);
  if (query.is_accepted !== undefined) filter.is_accepted = toBool(query.is_accepted);
  if (query.publish_status) filter.publish_status = query.publish_status;

  const countries = parseArrayQuery(query.country || query.countries);
  if (countries.length) filter.countries = { $in: countries };

  const cities = parseArrayQuery(query.city || query.cities);
  if (cities.length) filter.cities = { $in: cities };

  if (query.city_name) filter.city = new RegExp(escapeRegex(query.city_name), "i");
  if (query.job_type_id && isValidObjectId(query.job_type_id)) filter.job_type_id = query.job_type_id;
  if (query.work_mode_id && isValidObjectId(query.work_mode_id)) filter.work_mode_id = query.work_mode_id;
  if (query.job_time_id && isValidObjectId(query.job_time_id)) filter.job_time_id = query.job_time_id;
  if (query.job_salary_id && isValidObjectId(query.job_salary_id)) filter.job_salary_id = query.job_salary_id;
  if (query.experience_level_id && isValidObjectId(query.experience_level_id)) filter.experience_level_id = query.experience_level_id;
  if (query.education_level_id && isValidObjectId(query.education_level_id)) filter.education_level_id = query.education_level_id;
  if (query.is_remote !== undefined) filter.is_remote = toBool(query.is_remote);

  return filter;
};

const buildJobPayload = async (body = {}, companyData) => {
  const payload = {
    company_id: companyData.company._id,
    user_id: companyData.userId,
  };

  const jobNameDoc = await createLookupIfMissing(
    JobNameLookupModel,
    body.job_name_id || body.job_name || body.job_name_text
  );

  const jobNameText =
    body.job_name ||
    body.job_name_text ||
    jobNameDoc?.title_en ||
    jobNameDoc?.title_ar ||
    jobNameDoc?.name ||
    jobNameDoc?.title;

  if (jobNameDoc?._id) payload.job_name_id = jobNameDoc._id;
  if (cleanText(jobNameText)) payload.job_name = cleanText(jobNameText);

  if (body.description !== undefined) payload.description = cleanText(body.description);

  const workMode = await createLookupIfMissing(WorkModeModel, body.work_mode_id || body.work_mode);
  if (workMode?._id) {
    payload.work_mode_id = workMode._id;
    payload.work_mode_info = workMode;
  }

  const jobType = await createLookupIfMissing(JobTypeModel, body.job_type_id || body.job_type);
  if (jobType?._id) {
    payload.job_type_id = jobType._id;
    payload.job_type_info = jobType;
  }

  const jobTime = await createLookupIfMissing(WorkTimeLookupModel, body.job_time_id || body.job_time);
  if (jobTime?._id) {
    payload.job_time_id = jobTime._id;
    payload.job_time_info = jobTime;
  }

  const salaryType = await createLookupIfMissing(JobSalaryModel, body.job_salary_id || body.salary_type);
  if (salaryType?._id) {
    payload.job_salary_id = salaryType._id;
    payload.job_salary_info = salaryType;
  }

  const currencyDoc = await createLookupIfMissing(
    CurrencyModel,
    body.currency_id || body.currency || body?.salary?.currency_id || body["salary.currency_id"]
  );

  if (currencyDoc?._id || body.min_salary !== undefined || body.max_salary !== undefined || body.salary !== undefined) {
    payload.salary = {
      min: toNumberOrNull(body.min_salary ?? body.salary?.min),
      max: toNumberOrNull(body.max_salary ?? body.salary?.max),
      currency_id: currencyDoc?._id || validObjectIdOrNull(body.currency_id || body.currency || body?.salary?.currency_id),
      currency_code: cleanText(
        currencyDoc?.code ||
          currencyDoc?.currency_code ||
          body.currency_code ||
          body?.salary?.currency_code ||
          "USD"
      ).toUpperCase(),
      currency_rate_snapshot: Number(
        currencyDoc?.rate ||
          currencyDoc?.currency_rate ||
          body.currency_rate_snapshot ||
          body?.salary?.currency_rate_snapshot ||
          1
      ),
      is_visible: body.salary_is_visible !== undefined ? Boolean(toBool(body.salary_is_visible)) : true,
      is_negotiable: body.salary_is_negotiable !== undefined ? Boolean(toBool(body.salary_is_negotiable)) : false,
    };
  }

  const countries = toArray(body.countries || body.country || body.country_ids).map(String);
  const checkedCountries = buildCheckedCountriesFromBody(body);
  payload.countries = [...new Set([...countries, ...checkedCountries].filter(Boolean))];

  const cities = toArray(body.cities || body.city_ids).map(String);
  const checkedCities = buildCheckedCitiesFromBody(body);
  payload.cities = [...new Set([...cities, ...checkedCities].filter(Boolean))];

  if (body.city !== undefined) payload.city = cleanText(body.city);
  if (body.address !== undefined) payload.address = cleanText(body.address);

  ["started_date", "end_date", "apply_deadline"].forEach((field) => {
    if (body[field] !== undefined && body[field] !== "") payload[field] = body[field];
  });

  [
    "is_remote",
    "show_company_information",
    "is_send_emails",
    "is_cv_required",
    "is_contact_on_emails",
    "is_out_side",
    "is_for_students",
    "is_for_graduates",
    "is_for_fresh_graduates",
  ].forEach((field) => {
    if (body[field] !== undefined) payload[field] = Boolean(toBool(body[field]));
  });

  if (body.out_link !== undefined) payload.out_link = cleanText(body.out_link);

  // لا نحفظ الإيميلات عندما يكون إرسال الإيميلات غير مفعل
  if (body.emails !== undefined || body.is_send_emails !== undefined) {
    payload.emails = payload.is_send_emails ? normalizeEmails(body.emails) : [];
  }

  if (body.skills_required !== undefined) payload.skills_required = await normalizeSkills(body.skills_required);
  if (body.skills_optional !== undefined) payload.skills_optional = await normalizeSkills(body.skills_optional);
  if (body.languages !== undefined) payload.languages = await normalizeLanguages(body.languages);
  if (body.services !== undefined || body.job_services !== undefined) {
    payload.job_services = await normalizeServices(body.services || body.job_services);
  }
  if (body.questions !== undefined) payload.questions = normalizeQuestions(body.questions);

  if (body.experience_level_id !== undefined || body.experience_level !== undefined) {
    const experienceLevel = await createLookupIfMissing(
      ExperienceLevelLookupModel,
      body.experience_level_id || body.experience_level
    );

    const id = experienceLevel?._id || validObjectIdOrNull(body.experience_level_id);
    if (id) {
      payload.experience_level_id = id;
      payload.experience_level_info = experienceLevel || {};
    }
  }

  if (body.education_level_id !== undefined || body.education_level !== undefined) {
    const educationLevel = await createLookupIfMissing(
      EducationLevelLookupModel,
      body.education_level_id || body.education_level
    );

    const id = educationLevel?._id || validObjectIdOrNull(body.education_level_id);
    if (id) {
      payload.education_level_id = id;
      payload.education_level_info = educationLevel || {};
    }
  }

  if (body.min_experience_years !== undefined) payload.min_experience_years = Number(body.min_experience_years || 0);
  if (body.max_experience_years !== undefined) payload.max_experience_years = toNumberOrNull(body.max_experience_years);
  if (body.vacancies_count !== undefined) payload.vacancies_count = Number(body.vacancies_count || 1);
  if (body.priority !== undefined) payload.priority = Number(body.priority || 0);

  if (body.candidate_target !== undefined) {
    const targets = toArray(body.candidate_target).map(cleanText).filter(Boolean);
    payload.candidate_target = targets.length ? targets : ["all"];
  }

  payload.status = body.status !== undefined ? Boolean(toBool(body.status)) : true;
  payload.is_accepted = body.is_accepted !== undefined ? Boolean(toBool(body.is_accepted)) : true;
  payload.publish_status = normalizePublishStatus(body.publish_status);

  return payload;
};

const rebuildJobAfterSave = async (job) => {
  if (!job?._id) return { job, matches_count: 0 };

  const canRebuildMatches = job.status && job.publish_status === "published";
  return await rebuildJobIntegration(job._id, { rebuildMatches: canRebuildMatches });
};

export const getMyJobs = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = applyCompanyJobFilters(
      { company_id: companyData.company._id },
      req.query
    );

    const searchText = String(req.query.search || req.query.q || "").trim();

    if (searchText) {
      filter.$and = [
        ...(filter.$and || []),
        buildJobSearchFilter(searchText),
      ];
    }

    let sort = { createdAt: -1, _id: -1 };

    if (req.query.sort) {
      const [field, direction = "desc"] = String(req.query.sort).split(":");

   

       const sortDirection = direction === "asc" ? 1 : -1;
        sort = { [field]: sortDirection, _id: sortDirection };
    }

    const result = await paginate(jobsModel, filter, req, {
      select:
        "job_name publish_status status is_accepted cities_count cities city work_mode_info job_time_info salary user_applying user_show user_saved apply_deadline createdAt updatedAt",
      lean: true,
      sort,
    });

    const items = result.items.map((job) => ({
      _id: job._id,
      job_name: job.job_name || "",
      status: Boolean(job.status),
      is_accepted: Boolean(job.is_accepted),
      publish_status: job.publish_status || "published",

      work_mode:
        job.work_mode_info?.title_ar ||
        job.work_mode_info?.title_en ||
        "",

      work_time:
        job.job_time_info?.title_ar ||
        job.job_time_info?.title_en ||
        "",

      city: job.city || "",

      cities_count:
        job.cities_count ??
        (Array.isArray(job.cities) ? job.cities.length : 0),

      salary: {
        min: job.salary?.min ?? null,
        max: job.salary?.max ?? null,
        currency_code: job.salary?.currency_code || "",
        is_visible: job.salary?.is_visible ?? true,
      },

      stats: {
        applications: job.user_applying || 0,
        views: job.user_show || 0,
        saved: job.user_saved || 0,
      },

      apply_deadline: job.apply_deadline || null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    return success(res, items, "company_jobs", 200, result.meta);
  } catch (error) {
    next(error);
  }
};
export const getJobsStatistics = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const companyId = companyData.company._id;

    const [total, active, published, paused, closed, archived, applications] = await Promise.all([
      jobsModel.countDocuments({ company_id: companyId }),
      jobsModel.countDocuments({ company_id: companyId, status: true }),
      jobsModel.countDocuments({ company_id: companyId, publish_status: "published" }),
      jobsModel.countDocuments({ company_id: companyId, publish_status: "paused" }),
      jobsModel.countDocuments({ company_id: companyId, publish_status: "closed" }),
      jobsModel.countDocuments({ company_id: companyId, publish_status: "archived" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId }),
    ]);

    return success(
      res,
      { total, active, published, paused, closed, archived, applications },
      "company_jobs_statistics"
    );
  } catch (error) {
    next(error);
  }
};

export const getMyJobDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const job = await jobsModel
      .findOne({ _id: jobId, company_id: companyData.company._id })
      .populate(companyJobPopulate);

    if (!job) return fail(res, "job_not_found", 404);

    const [applications_count, waiting_count, interview_count, accepted_count, rejected_count] = await Promise.all([
      UserApplyingJobModel.countDocuments({ job_id: jobId, company_id: companyData.company._id }),
      UserApplyingJobModel.countDocuments({ job_id: jobId, company_id: companyData.company._id, status: "waiting" }),
      UserApplyingJobModel.countDocuments({ job_id: jobId, company_id: companyData.company._id, status: "interview" }),
      UserApplyingJobModel.countDocuments({
        job_id: jobId,
        company_id: companyData.company._id,
        status: { $in: ["accepted", "hired", "offer"] },
      }),
      UserApplyingJobModel.countDocuments({ job_id: jobId, company_id: companyData.company._id, status: "rejected" }),
    ]);

    return success(
      res,
      {
        job: normalizeJob(job),
        stats: {
          applications_count,
          waiting_count,
          interview_count,
          accepted_count,
          rejected_count,
        },
      },
      "company_job_details"
    );
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const payload = await buildJobPayload(req.body, companyData);
    const job = await jobsModel.create(payload);

    await rebuildJobAfterSave(job);

    const rebuiltJob = await jobsModel.findById(job._id).populate(companyJobPopulate);
    return success(res, normalizeJob(rebuiltJob || job), "company_job_created", 201);
  } catch (error) {
    console.log('====================================');
    console.log(error);
    console.log('====================================');
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const payload = await buildJobPayload(req.body, companyData);
    payload.is_update = true;

    const job = await jobsModel.findOneAndUpdate(
      { _id: jobId, company_id: companyData.company._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!job) return fail(res, "job_not_found", 404);

    await rebuildJobAfterSave(job);

    const rebuiltJob = await jobsModel.findById(job._id).populate(companyJobPopulate);
    return success(res, normalizeJob(rebuiltJob || job), "company_job_updated");
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const deleted = await jobsModel.deleteOne({ _id: jobId, company_id: companyData.company._id });
    if (!deleted.deletedCount) return fail(res, "job_not_found", 404);

    await JobEmployeeMatchModel.deleteMany({ job_id: jobId });

    return success(res, { job_id: jobId }, "company_job_deleted");
  } catch (error) {
    next(error);
  }
};

export const changeJobStatus = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const status = toBool(req.body.status);
    if (status === undefined) return fail(res, "status_required", 422);

    const job = await jobsModel.findOneAndUpdate(
      { _id: jobId, company_id: companyData.company._id },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!job) return fail(res, "job_not_found", 404);

    await rebuildJobAfterSave(job);

    return success(res, normalizeJob(job), "company_job_status_updated");
  } catch (error) {
    next(error);
  }
};

const setPublishStatus = (publish_status) => async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const safeStatus = normalizePublishStatus(publish_status);
    const statusPatch = safeStatus === "published" ? { status: true } : {};

    const job = await jobsModel.findOneAndUpdate(
      { _id: jobId, company_id: companyData.company._id },
      { $set: { publish_status: safeStatus, ...statusPatch } },
      { new: true, runValidators: true }
    );

    if (!job) return fail(res, "job_not_found", 404);

    await rebuildJobAfterSave(job);

    return success(res, normalizeJob(job), `company_job_${safeStatus}`);
  } catch (error) {
    next(error);
  }
};

export const publishJob = setPublishStatus("pending_review");
export const archiveJob = setPublishStatus("archived");

export const getRecommendedEmployeesForJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    if (!isValidObjectId(jobId)) return fail(res, "invalid_job_id", 400);

    const exists = await jobsModel.exists({ _id: jobId, company_id: companyData.company._id });
    if (!exists) return fail(res, "job_not_found", 404);

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || req.query.paginate || 20), 1), 50);
    const skip = (page - 1) * limit;

    const filter = {
      job_id: jobId,
      company_id: companyData.company._id,
      is_recommended_to_company: true,
    };

    const [items, total] = await Promise.all([
      JobEmployeeMatchModel.find(filter)
        .sort({ score: -1, generated_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "employee_id",
          select:
            "user_id profile_headline current_job_title experience_years candidate_stage skills languages matching_profile profile_completion",
          populate: { path: "user_id", select: "first_name mid_name last_name email image" },
        })
        .lean(),
      JobEmployeeMatchModel.countDocuments(filter),
    ]);

    return success(res, items, "recommended_employees", 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMyJobs,
  getJobsStatistics,
  getMyJobDetails,
  createJob,
  updateJob,
  deleteJob,
  changeJobStatus,
  publishJob,
  archiveJob,
  getRecommendedEmployeesForJob,
};
