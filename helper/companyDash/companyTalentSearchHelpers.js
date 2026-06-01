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

export const stripQueryNoise = (value = "") =>
  String(value ?? "")
    .trim()
    .replace(/[?]+$/g, "")
    .trim();

export const cleanText = (value = "") => stripQueryNoise(value);

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toNumber = (value, fallback = 0) => {
  const text = stripQueryNoise(value);
  const n = Number(text);
  return Number.isFinite(n) ? n : fallback;
};

export const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const text = stripQueryNoise(value);
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

export const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const text = stripQueryNoise(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return fallback;
};

export const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

export const toArray = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.flat(Infinity);

  if (typeof value === "string") {
    const text = stripQueryNoise(value);
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.flat(Infinity);
      if (parsed && typeof parsed === "object") return [parsed];
      return parsed === undefined || parsed === null || parsed === "" ? [] : [parsed];
    } catch {
      return text
        .split(/[,;\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [value];
};

export const uniqueClean = (value = []) => [
  ...new Set(
    toArray(value)
      .map((x) => {
        if (x && typeof x === "object") {
          return cleanText(x.title || x.title_ar || x.title_en || x.name || x.label || x.value || x.key || x._id || x.id || "");
        }
        return cleanText(x);
      })
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
  uniqueClean(groups.flat(Infinity))
    .flatMap((x) => normalizeSearchToken(x).split(/\s+/))
    .map((x) => x.trim())
    .filter(Boolean);

export const toObjectIdArray = (value) =>
  uniqueClean(toArray(value).map((x) => x?._id || x?.id || x?.value || x)).filter(isValidObjectId);

export const splitObjectIdsAndTexts = (value) => {
  const values = uniqueClean(value);
  return {
    ids: values.filter(isValidObjectId),
    texts: values.filter((x) => !isValidObjectId(x)),
  };
};

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

  const search = cleanText(firstValue(query.search, query.q, query.keyword, query.text));
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
      { "matching_profile.normalized_skills": { $in: tokens } },
      { "matching_profile.normalized_titles": { $in: tokens } },
      { "search_filters.text.all": { $in: tokens } },
      { "search_filters.job_names.keywords": { $in: tokens } },
      { "search_filters.job_names.titles_ar": { $in: tokens } },
      { "search_filters.job_names.titles_en": { $in: tokens } },
      { "search_filters.skills.titles_ar": { $in: tokens } },
      { "search_filters.skills.titles_en": { $in: tokens } },
      { "search_filters.skills.titles_custom": { $in: tokens } },
      { "search_filters.skills.keywords_ar": { $in: tokens } },
      { "search_filters.skills.keywords_en": { $in: tokens } },
      { "skills.title": regex },
    ];
  }

  const stage = cleanText(firstValue(query.candidate_stage, query.stage, query.candidateStage));
  if (stage) filter.candidate_stage = stage;

  const freeForWork = firstValue(query.is_free_for_work, query.free_for_work, query.available, query.isAvailable);
  if (freeForWork !== undefined) filter.is_free_for_work = toBoolean(freeForWork);

  const workLocation = cleanText(firstValue(query.work_location, query.workLocation, query.location_type));
  if (workLocation) filter.work_location = workLocation;

  const jobNameIds = toObjectIdArray(firstValue(query.job_name_id, query.job_name_ids, query.jobNameId, query.jobNameIds, query.job_names));
  if (jobNameIds.length) filter.job_names = { $in: jobNameIds };

  const jobTypeIds = toObjectIdArray(firstValue(query.job_type_id, query.job_type_ids, query.jobTypeId, query.jobTypeIds, query.job_types));
  if (jobTypeIds.length) filter.job_types = { $in: jobTypeIds };

  const workModeIds = toObjectIdArray(firstValue(query.work_mode_id, query.work_mode_ids, query.workModeId, query.workModeIds, query.work_modes));
  if (workModeIds.length) filter.preferred_work_modes = { $in: workModeIds };

  const skillParts = splitObjectIdsAndTexts(firstValue(query.skill_id, query.skill_ids, query.skills, query.skillIds, query.skill));
  if (skillParts.ids.length) filter["skills.skill_id"] = { $in: skillParts.ids };
  if (skillParts.texts.length) {
    const skillTokens = normalizeTokens(skillParts.texts);
    const skillOr = [
      { "skills.title": { $in: skillParts.texts.map((x) => new RegExp(escapeRegex(x), "i")) } },
      { "matching_profile.normalized_skills": { $in: skillTokens } },
      { "matching_profile.searchable_tokens": { $in: skillTokens } },
      { "search_filters.skills.titles_ar": { $in: skillTokens } },
      { "search_filters.skills.titles_en": { $in: skillTokens } },
      { "search_filters.skills.keywords_ar": { $in: skillTokens } },
      { "search_filters.skills.keywords_en": { $in: skillTokens } },
    ];
    filter.$and = [...(filter.$and || []), { $or: skillOr }];
  }

  const languageParts = splitObjectIdsAndTexts(firstValue(query.language_id, query.language_ids, query.languages, query.languageIds, query.language));
  if (languageParts.ids.length) filter["languages.language_id"] = { $in: languageParts.ids };
  if (languageParts.texts.length) {
    const languageTokens = normalizeTokens(languageParts.texts);
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { "matching_profile.normalized_languages": { $in: languageTokens } },
          { "search_filters.languages.names": { $in: languageTokens } },
          { "search_filters.languages.titles_ar": { $in: languageTokens } },
          { "search_filters.languages.titles_en": { $in: languageTokens } },
        ],
      },
    ];
  }

  const countryParts = splitObjectIdsAndTexts(firstValue(query.country_id, query.country_ids, query.countries, query.countryIds, query.country));
  if (countryParts.ids.length) filter.preferred_countries = { $in: countryParts.ids };
  if (countryParts.texts.length) {
    const countryTokens = normalizeTokens(countryParts.texts);
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { "matching_profile.preferred_country_values": { $in: countryTokens } },
          { "search_filters.preferred_countries.values": { $in: countryTokens } },
          { "search_filters.preferred_countries.country_codes": { $in: countryTokens } },
          { "search_filters.preferred_countries.country_names_ar": { $in: countryTokens } },
          { "search_filters.preferred_countries.country_names_en": { $in: countryTokens } },
          { "search_filters.preferred_countries.city_names_ar": { $in: countryTokens } },
          { "search_filters.preferred_countries.city_names_en": { $in: countryTokens } },
        ],
      },
    ];
  }

  const experienceLevelId = firstValue(query.experience_level_id, query.experienceLevelId);
  if (experienceLevelId && isValidObjectId(experienceLevelId)) filter.experience_level_id = experienceLevelId;

  const minExp = toNumberOrNull(firstValue(query.min_experience_years, query.min_exp, query.minExperience));
  const maxExp = toNumberOrNull(firstValue(query.max_experience_years, query.max_exp, query.maxExperience));
  if (minExp !== null || maxExp !== null) {
    filter.experience_years = {};
    if (minExp !== null) filter.experience_years.$gte = minExp;
    if (maxExp !== null) filter.experience_years.$lte = maxExp;
  }

  const minCompletion = toNumberOrNull(firstValue(query.min_profile_completion, query.minCompletion));
  if (minCompletion !== null) filter.profile_completion = { $gte: minCompletion };

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
    cvs: (employee.cvs || []).filter((cv) => cv.status === "active"),
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

const getJobRequiredSkills = (job = {}) => {
  const structured = (job.skills_required || []).map((x) => ({
    id: getIdString(x.skill_id),
    title: getSkillTitle(x),
  }));

  const projection = uniqueClean(job.search_projection?.requirements?.skills || []);
  const indexTokens = uniqueClean(job.search_index?.filters?.skills || job.search_index?.skill_tokens || []);

  return {
    ids: structured.map((x) => x.id).filter(isValidObjectId),
    titles: uniqueClean([...structured.map((x) => x.title), ...projection, ...indexTokens]),
  };
};

const getJobOptionalSkills = (job = {}) => {
  const structured = (job.skills_optional || []).map((x) => ({
    id: getIdString(x.skill_id),
    title: getSkillTitle(x),
  }));

  return {
    ids: structured.map((x) => x.id).filter(isValidObjectId),
    titles: uniqueClean(structured.map((x) => x.title)),
  };
};

const getEmployeeSkills = (employee = {}) => ({
  ids: (employee.skills || []).map((x) => getIdString(x.skill_id)).filter(isValidObjectId),
  titles: uniqueClean([
    ...(employee.skills || []).map((x) => getSkillTitle(x)),
    employee.matching_profile?.normalized_skills || [],
    employee.search_filters?.skills?.titles_ar || [],
    employee.search_filters?.skills?.titles_en || [],
    employee.search_filters?.skills?.titles_custom || [],
    employee.search_filters?.skills?.keywords_ar || [],
    employee.search_filters?.skills?.keywords_en || [],
  ]),
});

export const calculateEmployeeJobMatch = (job = {}, employee = {}) => {
  const requiredSkills = getJobRequiredSkills(job);
  const optionalSkills = getJobOptionalSkills(job);
  const employeeSkills = getEmployeeSkills(employee);

  const matchedRequiredIds = intersection(requiredSkills.ids, employeeSkills.ids);
  const matchedOptionalIds = intersection(optionalSkills.ids, employeeSkills.ids);

  const requiredTitleTokens = normalizeTokens(requiredSkills.titles);
  const optionalTitleTokens = normalizeTokens(optionalSkills.titles);
  const employeeTitleTokens = normalizeTokens(employeeSkills.titles);

  const matchedRequiredByTitle = intersection(requiredTitleTokens, employeeTitleTokens);
  const matchedOptionalByTitle = intersection(optionalTitleTokens, employeeTitleTokens);

  const requiredCount = Math.max(requiredSkills.ids.length || requiredTitleTokens.length, 1);
  const optionalCount = Math.max(optionalSkills.ids.length || optionalTitleTokens.length, 1);

  const requiredRatio = Math.min(
    1,
    Math.max(matchedRequiredIds.length, matchedRequiredByTitle.length) / requiredCount
  );
  const optionalRatio = Math.min(
    1,
    Math.max(matchedOptionalIds.length, matchedOptionalByTitle.length) / optionalCount
  );

  const skillsScore = Math.round(requiredRatio * 45 + optionalRatio * 10);

  const minExp = toNumber(job.min_experience_years ?? job.search_projection?.requirements?.min_experience_years, 0);
  const maxExp = toNumberOrNull(job.max_experience_years ?? job.search_projection?.requirements?.max_experience_years);
  const empExp = toNumber(employee.experience_years, 0);
  let experienceScore = 0;
  if (empExp >= minExp && (maxExp === null || empExp <= maxExp + 2)) experienceScore = 15;
  else if (empExp >= Math.max(minExp - 1, 0)) experienceScore = 10;
  else experienceScore = Math.max(0, Math.round((empExp / Math.max(minExp, 1)) * 8));

  const jobCities = normalizeTokens(job.cities || [], job.city || "", job.search_index?.filters?.cities || []);
  const jobCountries = normalizeTokens(job.countries || [], job.search_projection?.requirements?.countries || [], job.search_index?.filters?.countries || []);
  const employeeLocations = normalizeTokens(
    employee.matching_profile?.preferred_country_values || [],
    employee.search_filters?.preferred_countries?.values || [],
    employee.search_filters?.preferred_countries?.country_codes || [],
    employee.search_filters?.preferred_countries?.country_names_ar || [],
    employee.search_filters?.preferred_countries?.country_names_en || [],
    employee.search_filters?.preferred_countries?.city_names_ar || [],
    employee.search_filters?.preferred_countries?.city_names_en || []
  );
  const isRemote = Boolean(
    job.is_remote ||
    job.search_projection?.requirements?.is_remote ||
    String(job.work_mode_info?.key || job.search_projection?.requirements?.work_mode || "").includes("remote")
  );
  let locationScore = 0;
  if (isRemote && (employee.matching_profile?.remote_ready || employee.work_location === "remote")) locationScore = 10;
  else if (intersection([...jobCities, ...jobCountries], employeeLocations).length) locationScore = 10;
  else if (employee.is_can_move || employee.matching_profile?.relocation_ready) locationScore = 6;

  const jobWorkModeId = getIdString(job.work_mode_id);
  const employeeWorkModeIds = (employee.preferred_work_modes || []).map(getIdString).filter(Boolean);
  const employeeWorkModeKeys = employee.matching_profile?.preferred_work_mode_keys || employee.search_filters?.preferred_work_modes?.keys || [];
  let workModeScore = 0;
  if (jobWorkModeId && employeeWorkModeIds.includes(jobWorkModeId)) workModeScore = 10;
  else if (isRemote && (employeeWorkModeKeys.includes("remote") || employee.work_location === "remote")) workModeScore = 8;
  else if (!jobWorkModeId) workModeScore = 5;

  const jobLangIds = (job.languages || []).map((x) => getIdString(x.language_id)).filter(isValidObjectId);
  const empLangIds = (employee.languages || []).map((x) => getIdString(x.language_id)).filter(isValidObjectId);
  const matchedLangIds = intersection(jobLangIds, empLangIds);
  const langTitles = uniqueClean([
    ...(job.languages || []).map(getLanguageTitle),
    job.search_projection?.requirements?.languages || [],
    job.search_index?.filters?.languages || [],
  ]);
  const empLangTitles = uniqueClean([
    ...(employee.languages || []).map(getLanguageTitle),
    employee.matching_profile?.normalized_languages || [],
    employee.search_filters?.languages?.names || [],
    employee.search_filters?.languages?.titles_ar || [],
    employee.search_filters?.languages?.titles_en || [],
  ]);
  const matchedLangTitles = intersection(normalizeTokens(langTitles), normalizeTokens(empLangTitles));
  const languageScore = jobLangIds.length || langTitles.length
    ? Math.round((Math.max(matchedLangIds.length, matchedLangTitles.length) / Math.max(jobLangIds.length || langTitles.length, 1)) * 5)
    : 5;

  const jobMinSalary = toNumberOrNull(job.salary?.min_usd ?? job.salary?.min ?? job.search_projection?.requirements?.salary_min_usd);
  const jobMaxSalary = toNumberOrNull(job.salary?.max_usd ?? job.salary?.max ?? job.search_projection?.requirements?.salary_max_usd);
  const empMinSalary = toNumberOrNull(employee.expected_salary?.min_base ?? employee.expected_salary?.min ?? employee.matching_profile?.salary_min_base);
  const empMaxSalary = toNumberOrNull(employee.expected_salary?.max_base ?? employee.expected_salary?.max ?? employee.matching_profile?.salary_max_base);
  let salaryScore = 5;
  if (jobMaxSalary !== null && empMinSalary !== null && empMinSalary > jobMaxSalary) salaryScore = 1;
  else if (jobMinSalary !== null && empMaxSalary !== null && empMaxSalary < jobMinSalary) salaryScore = 2;

  const score = Math.min(
    100,
    Math.round(skillsScore + experienceScore + locationScore + workModeScore + languageScore + salaryScore)
  );

  const matchedSkills = uniqueClean([
    ...requiredSkills.titles.filter((x) => employeeSkills.titles.some((s) => normalizeSearchToken(s) === normalizeSearchToken(x))),
    ...matchedRequiredByTitle,
    ...matchedOptionalByTitle,
  ]);

  const missingSkills = uniqueClean(
    requiredSkills.titles.filter((x) => !matchedSkills.some((m) => normalizeSearchToken(m) === normalizeSearchToken(x)))
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
    is_recommended_to_employee: score >= 40,
    is_recommended_to_company: score >= 40,
    algorithm_version: "company-smart-match-v2",
    generated_at: new Date(),
  };
};

export const buildCandidateFilterFromJob = (job = {}, companyId = null, { relaxed = false } = {}) => {
  const filter = buildEmployeeSearchFilter({}, companyId);
  if (relaxed) return filter;

  const or = [];
  const requiredSkills = getJobRequiredSkills(job);
  const optionalSkills = getJobOptionalSkills(job);
  const allSkillIds = [...new Set([...requiredSkills.ids, ...optionalSkills.ids])];
  if (allSkillIds.length) or.push({ "skills.skill_id": { $in: allSkillIds } });

  const skillTokens = normalizeTokens(requiredSkills.titles, optionalSkills.titles);
  if (skillTokens.length) {
    or.push({ "matching_profile.normalized_skills": { $in: skillTokens } });
    or.push({ "matching_profile.searchable_tokens": { $in: skillTokens } });
    or.push({ "search_filters.skills.titles_ar": { $in: skillTokens } });
    or.push({ "search_filters.skills.titles_en": { $in: skillTokens } });
    or.push({ "search_filters.skills.keywords_ar": { $in: skillTokens } });
    or.push({ "search_filters.skills.keywords_en": { $in: skillTokens } });
  }

  if (job.job_name_id && isValidObjectId(job.job_name_id)) {
    or.push({ job_names: job.job_name_id });
    or.push({ "search_filters.job_names.ids": job.job_name_id });
  }
  if (job.job_type_id && isValidObjectId(job.job_type_id)) {
    or.push({ job_types: job.job_type_id });
    or.push({ "search_filters.job_types.ids": job.job_type_id });
  }
  if (job.work_mode_id && isValidObjectId(job.work_mode_id)) {
    or.push({ preferred_work_modes: job.work_mode_id });
    or.push({ "search_filters.preferred_work_modes.ids": job.work_mode_id });
  }

  const titleTokens = normalizeTokens(
    job.job_name,
    job.search_index?.title_tokens || [],
    job.search_projection?.matching?.normalized_titles || [],
    job.search_projection?.matching?.tokens || []
  );
  if (titleTokens.length) {
    or.push({ "matching_profile.normalized_titles": { $in: titleTokens } });
    or.push({ "matching_profile.normalized_job_names": { $in: titleTokens } });
    or.push({ "matching_profile.searchable_tokens": { $in: titleTokens } });
    or.push({ "search_filters.job_names.keywords": { $in: titleTokens } });
    or.push({ "search_filters.text.all": { $in: titleTokens } });
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
        user_id: employee.user_id?._id || (isValidObjectId(employee.user_id) ? employee.user_id : null),
        ...matchData,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return match;
};

export const normalizeTalentRequestPayload = (body = {}, companyData) => {
  const jobId = firstValue(body.job_id, body.jobId, body.job);
  const noteText = cleanText(firstValue(body.note, body.notes, body.description));
  const requiredSkills = uniqueClean(firstValue(body.required_skills, body.skills_required, body.skills, body.skill_names));
  const preferredSkills = uniqueClean(firstValue(body.preferred_skills, body.skills_optional, body.optional_skills));

  return {
    company_id: companyData.company._id,
    requested_by_user_id: companyData.userId,
    job_id: isValidObjectId(jobId) ? jobId : null,
    title: cleanText(firstValue(body.title, body.job_title, body.name)),
    description: cleanText(firstValue(body.description, body.details, body.message, body.note)),
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    countries: uniqueClean(firstValue(body.countries, body.country, body.country_names, body.country_ids)),
    cities: uniqueClean(firstValue(body.cities, body.city, body.city_names, body.city_ids)),
    work_mode_id: isValidObjectId(firstValue(body.work_mode_id, body.workModeId)) ? firstValue(body.work_mode_id, body.workModeId) : null,
    job_type_id: isValidObjectId(firstValue(body.job_type_id, body.jobTypeId)) ? firstValue(body.job_type_id, body.jobTypeId) : null,
    experience_level_id: isValidObjectId(firstValue(body.experience_level_id, body.experienceLevelId)) ? firstValue(body.experience_level_id, body.experienceLevelId) : null,
    education_level_id: isValidObjectId(firstValue(body.education_level_id, body.educationLevelId)) ? firstValue(body.education_level_id, body.educationLevelId) : null,
    min_experience_years: toNumber(firstValue(body.min_experience_years, body.minExperience, body.min_exp), 0),
    max_experience_years: toNumberOrNull(firstValue(body.max_experience_years, body.maxExperience, body.max_exp)),
    salary_min: toNumberOrNull(firstValue(body.salary_min, body.salaryMin, body.min_salary)),
    salary_max: toNumberOrNull(firstValue(body.salary_max, body.salaryMax, body.max_salary)),
    currency_code: cleanText(firstValue(body.currency_code, body.currencyCode, body.currency)).toUpperCase(),
    requested_count: Math.min(Math.max(toNumber(firstValue(body.requested_count, body.requestedCount, body.count), 5), 1), 100),
    priority: ["low", "normal", "high", "urgent"].includes(cleanText(body.priority)) ? cleanText(body.priority) : "normal",
    notes: noteText ? [{ by_user_id: companyData.userId, note: noteText, type: "company" }] : [],
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
