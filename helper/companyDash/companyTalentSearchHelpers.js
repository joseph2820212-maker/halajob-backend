import mongoose from "mongoose";
import {
  EmployeeModel,
  jobsModel,
  JobEmployeeMatchModel,
} from "../../models/index.js";
import {
  fail,
  isValidObjectId,
  normalizeJob,
} from "../../helper/companyDash/companyDashHelpers.js";
import { sanitizeEmployeeCvs } from "./secureCvDownloadHelpers.js";

export const cleanText = (value = "") => String(value || "").trim();

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toArray = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return text
        .split(/[,;\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [value];
};

export const uniqueClean = (arr = []) => [
  ...new Set(
    arr
      .flat(Infinity)
      .map((x) => cleanText(x))
      .filter(Boolean)
  ),
];

export const normalizeSearchToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, " ")
    .trim();

export const normalizeTokens = (...groups) =>
  uniqueClean(groups)
    .flatMap((x) => normalizeSearchToken(x).split(/\s+/))
    .map((x) => x.trim())
    .filter(Boolean);

export const toObjectIdArray = (value) =>
  uniqueClean(toArray(value).map((x) => x?._id || x?.id || x)).filter(isValidObjectId);

export const getJobOrFail = async (req, res, companyData, jobId) => {
  if (!isValidObjectId(jobId)) {
    fail(res, "invalid_job_id", 400);
    return null;
  }

  const job = await jobsModel
    .findOne({ _id: jobId, company_id: companyData.company._id })
    .lean();

  if (!job) {
    fail(res, "job_not_found", 404);
    return null;
  }

  return job;
};

export const employeePopulate = [
  {
    path: "user_id",
    select: "first_name mid_name last_name email image phone phone_code phone_national phone_e164",
  },
  { path: "experience_level_id" },
  { path: "skills.skill_id" },
  { path: "languages.language_id" },
  { path: "job_names" },
  { path: "job_types" },
  { path: "preferred_work_modes" },
  { path: "preferred_countries" },
  { path: "expected_salary.currency_id" },
];

export const buildEmployeeSearchFilter = (query = {}, companyId = null) => {
  const filter = {
    status: true,
    accepted: true,
    profile_visibility: { $in: ["public", "companies_only"] },
  };

  if (companyId && isValidObjectId(companyId)) {
    filter.blocked_companies = { $ne: new mongoose.Types.ObjectId(companyId) };
  }

  const search = cleanText(query.search || query.q || query.keyword);
  if (search) {
    const normalized = normalizeSearchToken(search);
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const regex = new RegExp(escapeRegex(normalized || search), "i");

    filter.$or = [
      { profile_headline: regex },
      { current_job_title: regex },
      { about_me: regex },
      { "matching_profile.searchable_text": regex },
      { "matching_profile.searchable_tokens": { $in: tokens } },
      { "search_filters.text.all": { $in: tokens } },
      { "search_filters.job_names.keywords": { $in: tokens } },
      { "search_filters.skills.titles_ar": { $in: tokens } },
      { "search_filters.skills.titles_en": { $in: tokens } },
      { "search_filters.skills.keywords_ar": { $in: tokens } },
      { "search_filters.skills.keywords_en": { $in: tokens } },
      { "skills.title": regex },
    ];
  }

  if (query.candidate_stage) filter.candidate_stage = query.candidate_stage;
  if (query.is_free_for_work !== undefined) {
    filter.is_free_for_work = [true, "true", 1, "1"].includes(query.is_free_for_work);
  }
  if (query.work_location) filter.work_location = query.work_location;

  const jobNameIds = toObjectIdArray(query.job_name_id || query.job_name_ids);
  if (jobNameIds.length) filter.job_names = { $in: jobNameIds };

  const jobTypeIds = toObjectIdArray(query.job_type_id || query.job_type_ids);
  if (jobTypeIds.length) filter.job_types = { $in: jobTypeIds };

  const workModeIds = toObjectIdArray(query.work_mode_id || query.work_mode_ids);
  if (workModeIds.length) filter.preferred_work_modes = { $in: workModeIds };

  const skillIds = toObjectIdArray(query.skill_id || query.skill_ids || query.skills);
  if (skillIds.length) filter["skills.skill_id"] = { $in: skillIds };

  const languageIds = toObjectIdArray(query.language_id || query.language_ids || query.languages);
  if (languageIds.length) filter["languages.language_id"] = { $in: languageIds };

  const countryIds = toObjectIdArray(query.country_id || query.country_ids || query.countries);
  if (countryIds.length) filter.preferred_countries = { $in: countryIds };

  if (query.experience_level_id && isValidObjectId(query.experience_level_id)) {
    filter.experience_level_id = query.experience_level_id;
  }

  const minExp = toNumberOrNull(query.min_experience_years ?? query.min_exp);
  const maxExp = toNumberOrNull(query.max_experience_years ?? query.max_exp);
  if (minExp !== null || maxExp !== null) {
    filter.experience_years = {};
    if (minExp !== null) filter.experience_years.$gte = minExp;
    if (maxExp !== null) filter.experience_years.$lte = maxExp;
  }

  return filter;
};

export const normalizeEmployeeForCompany = (employee, match = null) => {
  if (!employee) return null;

  const user = employee.user_id || {};
  const fullName = [user.first_name, user.mid_name, user.last_name]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  return {
    _id: employee._id,
    user_id: user?._id || employee.user_id || null,
    name: fullName,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    image: user.image || null,
    profile_headline: employee.profile_headline || "",
    current_job_title: employee.current_job_title || "",
    about_me: employee.about_me || "",
    candidate_stage: employee.candidate_stage || "unknown",
    experience_years: employee.experience_years || 0,
    experience_level: employee.experience_level_id || null,
    is_free_for_work: Boolean(employee.is_free_for_work),
    work_location: employee.work_location || "unknown",
    profile_completion: employee.profile_completion || 0,
    expected_salary: employee.expected_salary || null,
    skills: employee.skills || [],
    languages: employee.languages || [],
    latest_work_experience: employee.latest_work_experience || null,
    education: employee.education || [],
    cvs: sanitizeEmployeeCvs(employee.cvs || []),
    match: match
      ? {
          _id: match._id,
          score: Math.round(match.score || 0),
          breakdown: match.breakdown || {},
          matched_skills: match.matched_skills || [],
          missing_skills: match.missing_skills || [],
          matched_languages: match.matched_languages || [],
          missing_languages: match.missing_languages || [],
          algorithm_version: match.algorithm_version || "company-smart-match-v1",
          generated_at: match.generated_at || null,
        }
      : null,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

const getIdString = (value) => String(value?._id || value || "");

const getSkillTitle = (skill) => cleanText(skill?.title || skill?.skill_id?.title_ar || skill?.skill_id?.title_en || "");

const getLanguageTitle = (lang) =>
  cleanText(lang?.language_id?.title_ar || lang?.language_id?.title_en || lang?.language_id?.name || lang?.name || "");

const intersection = (a = [], b = []) => {
  const setB = new Set(b.map(String));
  return [...new Set(a.map(String).filter((x) => setB.has(x)))];
};

export const calculateEmployeeJobMatch = (job = {}, employee = {}) => {
  const requiredSkillIds = (job.skills_required || [])
    .map((x) => getIdString(x.skill_id))
    .filter(isValidObjectId);
  const optionalSkillIds = (job.skills_optional || [])
    .map((x) => getIdString(x.skill_id))
    .filter(isValidObjectId);
  const employeeSkillIds = (employee.skills || [])
    .map((x) => getIdString(x.skill_id))
    .filter(isValidObjectId);

  const requiredSkillTitles = (job.skills_required || []).map((x) => getSkillTitle(x)).filter(Boolean);
  const optionalSkillTitles = (job.skills_optional || []).map((x) => getSkillTitle(x)).filter(Boolean);
  const employeeSkillTitles = (employee.skills || []).map((x) => getSkillTitle(x)).filter(Boolean);

  const matchedRequiredIds = intersection(requiredSkillIds, employeeSkillIds);
  const matchedOptionalIds = intersection(optionalSkillIds, employeeSkillIds);

  const requiredTitleTokens = normalizeTokens(requiredSkillTitles);
  const optionalTitleTokens = normalizeTokens(optionalSkillTitles);
  const employeeTitleTokens = normalizeTokens(employeeSkillTitles, employee.matching_profile?.normalized_skills || []);

  const matchedRequiredByTitle = intersection(requiredTitleTokens, employeeTitleTokens);
  const matchedOptionalByTitle = intersection(optionalTitleTokens, employeeTitleTokens);

  const requiredCount = Math.max(requiredSkillIds.length || requiredTitleTokens.length, 1);
  const optionalCount = Math.max(optionalSkillIds.length || optionalTitleTokens.length, 1);

  const requiredRatio = Math.min(
    1,
    Math.max(matchedRequiredIds.length, matchedRequiredByTitle.length) / requiredCount
  );
  const optionalRatio = Math.min(
    1,
    Math.max(matchedOptionalIds.length, matchedOptionalByTitle.length) / optionalCount
  );

  const skillsScore = Math.round(requiredRatio * 45 + optionalRatio * 10);

  const minExp = toNumber(job.min_experience_years, 0);
  const maxExp = toNumberOrNull(job.max_experience_years);
  const empExp = toNumber(employee.experience_years, 0);
  let experienceScore = 0;
  if (empExp >= minExp && (maxExp === null || empExp <= maxExp + 2)) experienceScore = 15;
  else if (empExp >= Math.max(minExp - 1, 0)) experienceScore = 10;
  else experienceScore = Math.max(0, Math.round((empExp / Math.max(minExp, 1)) * 8));

  const jobCities = normalizeTokens(job.cities || [], job.city || "");
  const jobCountries = normalizeTokens(job.countries || []);
  const employeeLocations = normalizeTokens(
    employee.matching_profile?.preferred_country_values || [],
    employee.search_filters?.preferred_countries?.values || [],
    employee.search_filters?.preferred_countries?.country_names_ar || [],
    employee.search_filters?.preferred_countries?.country_names_en || [],
    employee.search_filters?.preferred_countries?.city_names_ar || [],
    employee.search_filters?.preferred_countries?.city_names_en || []
  );
  const isRemote = Boolean(job.is_remote || String(job.work_mode_info?.key || "").includes("remote"));
  let locationScore = 0;
  if (isRemote && (employee.matching_profile?.remote_ready || employee.work_location === "remote")) locationScore = 10;
  else if (intersection([...jobCities, ...jobCountries], employeeLocations).length) locationScore = 10;
  else if (employee.is_can_move || employee.matching_profile?.relocation_ready) locationScore = 6;

  const jobWorkModeId = getIdString(job.work_mode_id);
  const employeeWorkModeIds = (employee.preferred_work_modes || []).map(getIdString).filter(Boolean);
  const employeeWorkModeKeys = employee.matching_profile?.preferred_work_mode_keys || [];
  let workModeScore = 0;
  if (jobWorkModeId && employeeWorkModeIds.includes(jobWorkModeId)) workModeScore = 10;
  else if (isRemote && (employeeWorkModeKeys.includes("remote") || employee.work_location === "remote")) workModeScore = 8;
  else if (!jobWorkModeId) workModeScore = 5;

  const jobLangIds = (job.languages || []).map((x) => getIdString(x.language_id)).filter(isValidObjectId);
  const empLangIds = (employee.languages || []).map((x) => getIdString(x.language_id)).filter(isValidObjectId);
  const matchedLangIds = intersection(jobLangIds, empLangIds);
  const langTitles = (job.languages || []).map(getLanguageTitle).filter(Boolean);
  const empLangTitles = (employee.languages || []).map(getLanguageTitle).filter(Boolean);
  const matchedLangTitles = intersection(normalizeTokens(langTitles), normalizeTokens(empLangTitles));
  const languageScore = jobLangIds.length || langTitles.length
    ? Math.round((Math.max(matchedLangIds.length, matchedLangTitles.length) / Math.max(jobLangIds.length || langTitles.length, 1)) * 5)
    : 5;

  const jobMinSalary = toNumberOrNull(job.salary?.min_usd ?? job.salary?.min);
  const jobMaxSalary = toNumberOrNull(job.salary?.max_usd ?? job.salary?.max);
  const empMinSalary = toNumberOrNull(employee.expected_salary?.min_base ?? employee.expected_salary?.min);
  const empMaxSalary = toNumberOrNull(employee.expected_salary?.max_base ?? employee.expected_salary?.max);
  let salaryScore = 5;
  if (jobMaxSalary !== null && empMinSalary !== null && empMinSalary > jobMaxSalary) salaryScore = 1;
  else if (jobMinSalary !== null && empMaxSalary !== null && empMaxSalary < jobMinSalary) salaryScore = 2;

  const score = Math.min(
    100,
    Math.round(skillsScore + experienceScore + locationScore + workModeScore + languageScore + salaryScore)
  );

  const matchedSkills = uniqueClean([
    ...requiredSkillTitles.filter((x) => employeeSkillTitles.some((s) => normalizeSearchToken(s) === normalizeSearchToken(x))),
    ...matchedRequiredByTitle,
    ...matchedOptionalByTitle,
  ]);

  const missingSkills = uniqueClean(
    requiredSkillTitles.filter((x) => !matchedSkills.some((m) => normalizeSearchToken(m) === normalizeSearchToken(x)))
  );

  const matchedLanguages = uniqueClean([
    ...langTitles.filter((x) => empLangTitles.some((l) => normalizeSearchToken(l) === normalizeSearchToken(x))),
    ...matchedLangTitles,
  ]);

  const missingLanguages = uniqueClean(
    langTitles.filter((x) => !matchedLanguages.some((m) => normalizeSearchToken(m) === normalizeSearchToken(x)))
  );

  return {
    score,
    breakdown: {
      skills: skillsScore,
      experience: experienceScore,
      location: locationScore,
      salary: salaryScore,
      work_mode: workModeScore,
      language: languageScore,
    },
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    matched_languages: matchedLanguages,
    missing_languages: missingLanguages,
    is_recommended_to_employee: score >= 45,
    is_recommended_to_company: score >= 45,
    algorithm_version: "company-smart-match-v1",
    generated_at: new Date(),
  };
};

export const buildCandidateFilterFromJob = (job = {}, companyId = null) => {
  const filter = buildEmployeeSearchFilter({}, companyId);
  const or = [];

  const requiredSkillIds = (job.skills_required || [])
    .map((x) => getIdString(x.skill_id))
    .filter(isValidObjectId);
  const optionalSkillIds = (job.skills_optional || [])
    .map((x) => getIdString(x.skill_id))
    .filter(isValidObjectId);
  const allSkillIds = [...new Set([...requiredSkillIds, ...optionalSkillIds])];
  if (allSkillIds.length) or.push({ "skills.skill_id": { $in: allSkillIds } });

  const skillTokens = normalizeTokens(
    (job.skills_required || []).map(getSkillTitle),
    (job.skills_optional || []).map(getSkillTitle)
  );
  if (skillTokens.length) {
    or.push({ "matching_profile.normalized_skills": { $in: skillTokens } });
    or.push({ "matching_profile.searchable_tokens": { $in: skillTokens } });
  }

  if (job.job_name_id && isValidObjectId(job.job_name_id)) {
    or.push({ job_names: job.job_name_id });
  }
  if (job.job_type_id && isValidObjectId(job.job_type_id)) {
    or.push({ job_types: job.job_type_id });
  }
  if (job.work_mode_id && isValidObjectId(job.work_mode_id)) {
    or.push({ preferred_work_modes: job.work_mode_id });
  }

  const titleTokens = normalizeTokens(job.job_name, job.search_index?.title_tokens || []);
  if (titleTokens.length) {
    or.push({ "matching_profile.normalized_titles": { $in: titleTokens } });
    or.push({ "matching_profile.searchable_tokens": { $in: titleTokens } });
  }

  if (or.length) filter.$or = or;
  return filter;
};

export const upsertJobEmployeeMatch = async ({ job, employee, companyId }) => {
  const matchData = calculateEmployeeJobMatch(job, employee);

  const match = await JobEmployeeMatchModel.findOneAndUpdate(
    { job_id: job._id, employee_id: employee._id },
    {
      $set: {
        company_id: companyId,
        user_id: employee.user_id?._id || employee.user_id || null,
        ...matchData,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return match;
};

export const normalizeTalentRequestPayload = (body = {}, companyData) => {
  const requiredSkills = uniqueClean(body.required_skills || body.skills_required || body.skills || []);
  const preferredSkills = uniqueClean(body.preferred_skills || body.skills_optional || []);

  return {
    company_id: companyData.company._id,
    requested_by_user_id: companyData.userId,
    job_id: isValidObjectId(body.job_id) ? body.job_id : null,
    title: cleanText(body.title || body.job_title || ""),
    description: cleanText(body.description || body.note || ""),
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    countries: uniqueClean(body.countries || body.country || []),
    cities: uniqueClean(body.cities || body.city || []),
    work_mode_id: isValidObjectId(body.work_mode_id) ? body.work_mode_id : null,
    job_type_id: isValidObjectId(body.job_type_id) ? body.job_type_id : null,
    experience_level_id: isValidObjectId(body.experience_level_id) ? body.experience_level_id : null,
    education_level_id: isValidObjectId(body.education_level_id) ? body.education_level_id : null,
    min_experience_years: toNumber(body.min_experience_years, 0),
    max_experience_years: toNumberOrNull(body.max_experience_years),
    salary_min: toNumberOrNull(body.salary_min),
    salary_max: toNumberOrNull(body.salary_max),
    currency_code: cleanText(body.currency_code || "").toUpperCase(),
    requested_count: Math.min(Math.max(toNumber(body.requested_count, 5), 1), 100),
    priority: ["low", "normal", "high", "urgent"].includes(body.priority) ? body.priority : "normal",
    notes: cleanText(body.note || body.description)
      ? [{ by_user_id: companyData.userId, note: cleanText(body.note || body.description), type: "company" }]
      : [],
  };
};

export const normalizeTalentRequest = (request) => {
  if (!request) return null;
  return {
    _id: request._id,
    company_id: request.company_id,
    requested_by_user_id: request.requested_by_user_id,
    job: normalizeJob(request.job_id),
    title: request.title || "",
    description: request.description || "",
    required_skills: request.required_skills || [],
    preferred_skills: request.preferred_skills || [],
    countries: request.countries || [],
    cities: request.cities || [],
    work_mode_id: request.work_mode_id || null,
    job_type_id: request.job_type_id || null,
    experience_level_id: request.experience_level_id || null,
    education_level_id: request.education_level_id || null,
    min_experience_years: request.min_experience_years || 0,
    max_experience_years: request.max_experience_years ?? null,
    salary_min: request.salary_min ?? null,
    salary_max: request.salary_max ?? null,
    currency_code: request.currency_code || "",
    requested_count: request.requested_count || 5,
    priority: request.priority || "normal",
    status: request.status || "new",
    notes: request.notes || [],
    admin_note: request.admin_note || "",
    closed_at: request.closed_at || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
};

export const getEmployeeDetailsOrFail = async (req, res, companyData, employeeId) => {
  if (!isValidObjectId(employeeId)) {
    fail(res, "invalid_employee_id", 400);
    return null;
  }

  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    status: true,
    accepted: true,
    profile_visibility: { $in: ["public", "companies_only"] },
    blocked_companies: { $ne: companyData.company._id },
  }).populate(employeePopulate);

  if (!employee) {
    fail(res, "employee_not_found", 404);
    return null;
  }

  return employee;
};
