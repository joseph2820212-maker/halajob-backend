import {
  getEmployeeOrFail,
  getEmployeePlain,
  normalizeArrayPayload,
  success,
  fail,
  calculateProfileCompletion,
  toObjectIdArray,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

import {CurrencyModel,JobNameModel,JobTypeModel,SkillModel,LanguageModel,EducationLevelModel,WorkModeModel,CountryModel} from "../../../models/index.js";
import { deleteImage, processUploadImage } from "../../../services/imageService.js";
import { applyEmployeeProjection, rebuildMatchForEmployee } from "../../../services/search/rebuildSearchData.js";
import mongoose from "mongoose";

const ARRAY_FIELDS = new Set([
  "experience",
  "education",
  "skills",
  "languages",
  "licenses",
  "testimony",
  "links",
  "cvs",
  "job_names",
  "job_types",
  "preferred_work_modes",
  "preferred_countries",
  "job_alerts",
  "blocked_companies",
]);

const SINGLE_FIELDS = new Set([
  "profile_headline",
  "current_job_title",
  "about_me",
  "candidate_stage",
  "is_student",
  "graduation_year",
  "experience_years",
  "experience_level_id",
  "expected_salary",
  "notice_period_id",
  "latest_work_experience",
  "work_location",
  "is_can_move",
  "is_free_for_work",
  "profile_visibility",
  "accepted",
  "min_salary",
  "status",
]);

const BOOLEAN_FIELDS = new Set([
  "is_student",
  "is_can_move",
  "is_free_for_work",
  "accepted",
  "status",
]);

const OBJECT_ID_ARRAY_FIELDS = new Set([
  "job_types",
  "preferred_work_modes",
  "blocked_companies",
]);

const OBJECT_ID_SINGLE_FIELDS = new Set([
  "experience_level_id",
  "notice_period_id",
]);

const SEARCH_FILTER_RELATED_FIELDS = new Set([
  "profile_headline",
  "current_job_title",
  "about_me",
  "candidate_stage",
  "is_student",
  "graduation_year",
  "experience_years",
  "experience_level_id",
  "expected_salary",
  "min_salary",
  "notice_period_id",
  "work_location",
  "is_can_move",
  "is_free_for_work",
  "profile_visibility",
  "accepted",
  "status",
  "latest_work_experience",
  "experience",
  "education",
  "skills",
  "languages",
  "job_names",
  "job_types",
  "preferred_work_modes",
  "preferred_countries",
]);

const parseBool = (value) => {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return value;
};

const parseJsonIfString = (value, fallback = value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return fallback;

  try {
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
};

const getRequestLang = (req) => {
  const lan = String(req.headers.lan || req.headers.lang || "ar").toLowerCase();
  return lan === "en" ? "en" : "ar";
};

const getLocalizedName = (value, lang = "ar") => {
  if (!value || typeof value !== "object") return "";

  if (lang === "en") {
    return (
      value.title_en ||
      value.name_en ||
      value.country_name_en ||
      value.city_name_en ||
      value.name ||
      value.title ||
      value.company_name ||
      value.code ||
      value.key ||
      ""
    );
  }

  return (
    value.title_ar ||
    value.name_ar ||
    value.country_name_ar ||
    value.city_name_ar ||
    value.name ||
    value.title ||
    value.company_name ||
    value.code ||
    value.key ||
    ""
  );
};

const getCurrencyDisplay = (currency, req) => {
  if (!currency || typeof currency !== "object") return null;

  const lang = getRequestLang(req);

  return {
    _id: currency._id ? String(currency._id) : undefined,
    id: currency._id ? String(currency._id) : undefined,
    code: currency.code,
    name: lang === "en" ? currency.name_en : currency.name_ar,
    symbol: lang === "en" ? currency.symbol_en : currency.symbol_ar,
    rate: currency.rate,
    rate_base: currency.rate_base,
    is_base: currency.is_base,
  };
};

const addLocalizedIdNames = (obj, req) => {
  if (!obj || typeof obj !== "object") return obj;

  const lang = getRequestLang(req);

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (!key.endsWith("_id")) continue;
    if (!value || typeof value !== "object") continue;

    const cleanKey = key.replace(/_id$/, "");
    const localizedName = getLocalizedName(value, lang);

    obj[`${cleanKey}_name`] = localizedName;

    if (key === "language_id") obj.name = localizedName;
    if (key === "skill_id" && !obj.title) obj.title = localizedName;
    if (key === "education_level_id" && !obj.level) obj.level = localizedName;
  }

  return obj;
};

const serializeSectionItem = (item, req) => {
  if (item === null || item === undefined) return item;

  if (typeof item !== "object") {
    return {
      _id: String(item),
      id: String(item),
      value: item,
    };
  }

  const obj = item?.toObject ? item.toObject({ virtuals: true }) : { ...item };
  const id = obj._id || obj.id;

  addLocalizedIdNames(obj, req);

  return {
    ...obj,
    _id: id ? String(id) : undefined,
    id: id ? String(id) : undefined,
  };
};

const cleanSectionItem = (item = {}) => {
  const source = parseJsonIfString(item, item);
  const cleaned = { ...(source || {}) };

  if (cleaned.evel !== undefined && cleaned.level === undefined) {
    cleaned.level = cleaned.evel;
    delete cleaned.evel;
  }

  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] === "") {
      delete cleaned[key];
      continue;
    }

    if (key.startsWith("is_")) {
      cleaned[key] = parseBool(cleaned[key]);
    }
  }

  return cleaned;
};
const uniqueClean = (arr = []) => [
  ...new Set(
    arr
      .flat(Infinity)
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  ),
];

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeJobNamePayload = (value) => {
  const parsed = parseJsonIfString(value, value);

  if (typeof parsed === "string") {
    return {
      raw: parsed.trim(),
      title_en: parsed.trim(),
      title_ar: "",
      keywords: [],
    };
  }

  if (parsed && typeof parsed === "object") {
    const title_en = String(parsed.title_en || parsed.title || parsed.name || "").trim();
    const title_ar = String(parsed.title_ar || "").trim();

    return {
      raw: String(parsed._id || parsed.id || title_en || title_ar || "").trim(),
      _id: parsed._id || parsed.id,
      title_en,
      title_ar,
      sector_ar: parsed.sector_ar || "",
      sector_en: parsed.sector_en || "",
      subSector_ar: parsed.subSector_ar || "",
      subSector_en: parsed.subSector_en || "",
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map((x) => String(x).trim()).filter(Boolean)
        : parsed.keywords
          ? [String(parsed.keywords).trim()]
          : [],
    };
  }

  return null;
};

const findOrCreateJobName = async (item) => {
  const normalized = normalizeJobNamePayload(item);
  if (!normalized || !normalized.raw) return null;

  if (normalized._id && mongoose.Types.ObjectId.isValid(normalized._id)) {
    const exists = await JobNameModel.findById(normalized._id).select("_id");
    if (exists) return exists._id;
  }

  if (mongoose.Types.ObjectId.isValid(normalized.raw)) {
    const exists = await JobNameModel.findById(normalized.raw).select("_id");
    if (exists) return exists._id;
  }

  const searchValues = uniqueClean([
    normalized.title_ar,
    normalized.title_en,
    normalized.raw,
    normalized.keywords,
  ]);

  const regexList = searchValues.map((x) => new RegExp(`^${escapeRegex(x)}$`, "i"));

  let jobName = await JobNameModel.findOne({
    $or: [
      { title_ar: { $in: regexList } },
      { title_en: { $in: regexList } },
      { keywords: { $in: searchValues } },
    ],
  }).select("_id");

  if (jobName) return jobName._id;
  jobName = await JobNameModel.create({
    title_en: normalized.title_en || normalized.raw,
    title_ar: normalized.title_ar || normalized.raw,
    sector_ar: normalized.sector_ar || "",
    sector_en: normalized.sector_en || "",
    subSector_ar: normalized.subSector_ar || "",
    subSector_en: normalized.subSector_en || "",
    keywords: uniqueClean([
      normalized.keywords,
      normalized.title_ar,
      normalized.title_en,
      normalized.raw,
    ]),
    is_auto:false,
    is_active: true,
  });

  return jobName._id;
};

const resolveJobNameIds = async (body = {}) => {
  const rawItems = normalizeArrayPayload(body, "job_names");
  const ids = [];

  for (const item of rawItems) {
    const id = await findOrCreateJobName(item);
    if (id) ids.push(String(id));
  }

  return [...new Set(ids)];
};

const normalizeSectionValue = (section, body = {}) => {
  if (OBJECT_ID_ARRAY_FIELDS.has(section)) {
    return toObjectIdArray(normalizeArrayPayload(body, section));
  }

  if (section === "preferred_countries" || section === "cvs") {
    return [
      ...new Set(
        normalizeArrayPayload(body, section)
          .map((x) => String(x || "").trim())
          .filter(Boolean)
      ),
    ];
  }

  return normalizeArrayPayload(body, section).map(cleanSectionItem);
};
const normalizeEmployeeArrayField = async (section, body = {}) => {
  if (section === "job_names") {
    return resolveJobNameIds(body);
  }

  return normalizeSectionValue(section, body);
};
const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const calculateBaseAmount = (amount, currency) => {
  if (amount === null || amount === undefined || !currency) return null;

  const rate = Number(currency.rate || currency.currency_rate || 1);
  if (!rate || rate <= 0) return amount;

  return Number((Number(amount) / rate).toFixed(2));
};

const resolveCurrencyForSalary = async (payload = {}) => {
  let currency = null;

  if (payload.currency_id && mongoose.Types.ObjectId.isValid(payload.currency_id)) {
    currency = await CurrencyModel.findOne({ _id: payload.currency_id, is_active: true });
  }

  if (!currency && payload.currency_code) {
    currency = await CurrencyModel.findOne({
      code: String(payload.currency_code).toUpperCase(),
      is_active: true,
    });
  }

  return currency;
};

const applySingleField = async (employee, field, value) => {
  if (BOOLEAN_FIELDS.has(field)) {
    employee[field] = parseBool(value);
    return;
  }

  if (OBJECT_ID_SINGLE_FIELDS.has(field)) {
    employee[field] = value || null;
    return;
  }

  if (field === "graduation_year" || field === "experience_years") {
    employee[field] = value === "" || value === null || value === undefined ? null : Number(value);
    return;
  }

  if (field === "expected_salary" || field === "min_salary") {
    const parsed = parseJsonIfString(value, value) || {};
    const oldSalary = employee.expected_salary?.toObject?.() || employee.expected_salary || {};

    const min = toNumberOrNull(parsed.min ?? parsed.salary_min ?? parsed.min_salary ?? oldSalary.min);
    const max = toNumberOrNull(parsed.max ?? parsed.salary_max ?? parsed.max_salary ?? oldSalary.max);

    const currency = await resolveCurrencyForSalary({
      currency_id: parsed.currency_id ?? oldSalary.currency_id,
      currency_code: parsed.currency_code ?? oldSalary.currency_code,
    });

    if ((min !== null || max !== null) && !currency && !oldSalary.currency_id) {
      throw new Error("salary_currency_required");
    }

    employee.expected_salary = {
      ...oldSalary,
      min,
      max,
      currency_id: currency?._id || parsed.currency_id || oldSalary.currency_id || null,
      currency_code: currency?.code || String(parsed.currency_code || oldSalary.currency_code || "").toUpperCase(),
      currency_symbol: currency?.symbol_en || currency?.symbol_ar || oldSalary.currency_symbol || "",
      currency_rate_base: currency?.rate_base || oldSalary.currency_rate_base || "USD",
      currency_rate: currency?.rate || oldSalary.currency_rate || 1,
      min_base: calculateBaseAmount(min, currency || oldSalary),
      max_base: calculateBaseAmount(max, currency || oldSalary),
    };

    return;
  }

  if (field === "latest_work_experience") {
    const parsed = parseJsonIfString(value, value);
    employee.latest_work_experience = {
      ...(employee.latest_work_experience?.toObject?.() || employee.latest_work_experience || {}),
      ...(parsed || {}),
    };
    return;
  }

  employee[field] = value;
};

const toPlain = (value) => (value?.toObject ? value.toObject({ virtuals: true }) : value || {});
const toId = (value) => String(value?._id || value || "");
const isValidId = (value) => mongoose.Types.ObjectId.isValid(toId(value));


const uniqueObjectIds = (arr = []) => [
  ...new Set(arr.map(toId).filter((id) => mongoose.Types.ObjectId.isValid(id))),
];

const compactNumberList = (arr = []) => arr.filter((x) => typeof x === "number" && Number.isFinite(x));

const normalizeSearchToken = (value = "") =>
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

const buildTokens = (...groups) => uniqueClean(groups).map(normalizeSearchToken).filter(Boolean);

const rebuildEmployeeSearchFilters = async (employee) => {
  const jobNameIds = uniqueObjectIds(employee.job_names || []);
  const jobTypeIds = uniqueObjectIds(employee.job_types || []);
  const skillIds = uniqueObjectIds((employee.skills || []).map((x) => x.skill_id));
  const languageIds = uniqueObjectIds((employee.languages || []).map((x) => x.language_id));
  const educationLevelIds = uniqueObjectIds((employee.education || []).map((x) => x.education_level_id));
  const workModeIds = uniqueObjectIds(employee.preferred_work_modes || []);

  const preferredCountries = uniqueClean(employee.preferred_countries || []);
  const countrySearchValues = preferredCountries.map((x) => String(x).trim()).filter(Boolean);

  const [jobNames, jobTypes, skills, languages, educationLevels, workModes, countries] = await Promise.all([
    jobNameIds.length ? JobNameModel.find({ _id: { $in: jobNameIds } }).lean() : [],
    jobTypeIds.length ? JobTypeModel.find({ _id: { $in: jobTypeIds } }).lean() : [],
    skillIds.length ? SkillModel.find({ _id: { $in: skillIds } }).lean() : [],
    languageIds.length ? LanguageModel.find({ _id: { $in: languageIds } }).lean() : [],
    educationLevelIds.length ? EducationLevelModel.find({ _id: { $in: educationLevelIds } }).lean() : [],
    workModeIds.length ? WorkModeModel.find({ _id: { $in: workModeIds } }).lean() : [],
    countrySearchValues.length
      ? CountryModel.find({
        $or: [
          { country_code: { $in: countrySearchValues.map((x) => x.toUpperCase()) } },
          { country_name_ar: { $in: countrySearchValues } },
          { country_name_en: { $in: countrySearchValues } },
          { city_name_ar: { $in: countrySearchValues } },
          { city_name_en: { $in: countrySearchValues } },
        ],
      }).lean()
      : [],
  ]);

  const salary = toPlain(employee.expected_salary);
  const skillLevels = compactNumberList((employee.skills || []).map((x) => Number(x.level)));
  const skillYears = compactNumberList((employee.skills || []).map((x) => Number(x.years)));
  const languageLevels = compactNumberList((employee.languages || []).map((x) => Number(x.level)));

  const educationItems = (employee.education || []).map(toPlain);
  const experienceItems = (employee.experience || []).map(toPlain);
  const latestExperience = toPlain(employee.latest_work_experience);

  const profileTokens = buildTokens(
    employee.profile_headline,
    employee.current_job_title,
    employee.about_me,
    latestExperience.company_name,
    latestExperience.position,
    latestExperience.details,
    experienceItems.map((x) => [x.company_name, x.position, x.details]),
    educationItems.map((x) => [x.level, x.study, x.institution])
  );

  const jobNameTokens = buildTokens(
    jobNames.map((x) => [x.title_ar, x.title_en, x.keywords, x.sector_ar, x.sector_en, x.subSector_ar, x.subSector_en])
  );

  const jobTypeTokens = buildTokens(jobTypes.map((x) => [x.name, x.title_ar, x.title_en, x.keyword]));

  const skillTokens = buildTokens(
    skills.map((x) => [x.key, x.title_ar, x.title_en, x.category, x.keywords_ar, x.keywords_en]),
    (employee.skills || []).map((x) => x.title)
  );

  const languageTokens = buildTokens(languages.map((x) => [x.name, x.title_ar, x.title_en]));
  const educationTokens = buildTokens(educationLevels.map((x) => [x.name, x.title_ar, x.title_en]), educationItems.map((x) => [x.level, x.study, x.institution]));
  const workModeTokens = buildTokens(workModes.map((x) => [x.key, x.title_ar, x.title_en, x.keywords_ar, x.keywords_en]));
  const countryTokens = buildTokens(preferredCountries, countries.map((x) => [x.country_code, x.country_name_ar, x.country_name_en, x.city_name_ar, x.city_name_en]));

  employee.search_filters = {
    text: {
      profile: profileTokens,
      all: uniqueClean([
        profileTokens,
        jobNameTokens,
        jobTypeTokens,
        skillTokens,
        languageTokens,
        educationTokens,
        workModeTokens,
        countryTokens,
      ]),
    },

    career: {
      candidate_stage: employee.candidate_stage || "unknown",
      is_student: Boolean(employee.is_student),
      graduation_year: employee.graduation_year ?? null,
      experience_years: Number(employee.experience_years || 0),
      experience_level_id: isValidId(employee.experience_level_id) ? employee.experience_level_id : null,
      notice_period_id: isValidId(employee.notice_period_id) ? employee.notice_period_id : null,
      work_location: employee.work_location || "unknown",
      is_can_move: Boolean(employee.is_can_move),
      is_free_for_work: Boolean(employee.is_free_for_work),
      profile_visibility: employee.profile_visibility || "public",
      accepted: Boolean(employee.accepted),
      status: Boolean(employee.status),
    },

    job_names: {
      ids: jobNames.map((x) => x._id),
      titles_ar: uniqueClean(jobNames.map((x) => x.title_ar)),
      titles_en: uniqueClean(jobNames.map((x) => x.title_en)),
      keywords: uniqueClean(jobNames.map((x) => x.keywords || [])),
      sectors_ar: uniqueClean(jobNames.map((x) => x.sector_ar)),
      sectors_en: uniqueClean(jobNames.map((x) => x.sector_en)),
      sub_sectors_ar: uniqueClean(jobNames.map((x) => x.subSector_ar)),
      sub_sectors_en: uniqueClean(jobNames.map((x) => x.subSector_en)),
    },

    job_types: {
      ids: jobTypes.map((x) => x._id),
      names: uniqueClean(jobTypes.map((x) => x.name)),
      titles_ar: uniqueClean(jobTypes.map((x) => x.title_ar)),
      titles_en: uniqueClean(jobTypes.map((x) => x.title_en)),
      keywords: uniqueClean(jobTypes.map((x) => x.keyword || [])),
    },

    skills: {
      ids: skills.map((x) => x._id),
      titles_ar: uniqueClean(skills.map((x) => x.title_ar)),
      titles_en: uniqueClean(skills.map((x) => x.title_en)),
      titles_custom: uniqueClean((employee.skills || []).map((x) => x.title)),
      keywords_ar: uniqueClean(skills.map((x) => x.keywords_ar || [])),
      keywords_en: uniqueClean(skills.map((x) => x.keywords_en || [])),
      categories: uniqueClean(skills.map((x) => x.category)),
      min_level: skillLevels.length ? Math.min(...skillLevels) : null,
      max_level: skillLevels.length ? Math.max(...skillLevels) : null,
      max_years: skillYears.length ? Math.max(...skillYears) : null,
    },

    languages: {
      ids: languages.map((x) => x._id),
      names: uniqueClean(languages.map((x) => x.name)),
      titles_ar: uniqueClean(languages.map((x) => x.title_ar)),
      titles_en: uniqueClean(languages.map((x) => x.title_en)),
      min_level: languageLevels.length ? Math.min(...languageLevels) : null,
      max_level: languageLevels.length ? Math.max(...languageLevels) : null,
    },

    education: {
      level_ids: educationLevels.map((x) => x._id),
      levels: uniqueClean([educationLevels.map((x) => [x.name, x.title_ar, x.title_en]), educationItems.map((x) => x.level)]),
      studies: uniqueClean(educationItems.map((x) => x.study)),
      institutions: uniqueClean(educationItems.map((x) => x.institution)),
    },

    preferred_work_modes: {
      ids: workModes.map((x) => x._id),
      keys: uniqueClean(workModes.map((x) => x.key)),
      titles_ar: uniqueClean(workModes.map((x) => x.title_ar)),
      titles_en: uniqueClean(workModes.map((x) => x.title_en)),
      keywords_ar: uniqueClean(workModes.map((x) => x.keywords_ar || [])),
      keywords_en: uniqueClean(workModes.map((x) => x.keywords_en || [])),
    },

    preferred_countries: {
      values: preferredCountries,
      country_codes: uniqueClean([preferredCountries.map((x) => String(x).toUpperCase()), countries.map((x) => x.country_code)]),
      country_names_ar: uniqueClean(countries.map((x) => x.country_name_ar)),
      country_names_en: uniqueClean(countries.map((x) => x.country_name_en)),
      city_names_ar: uniqueClean(countries.map((x) => x.city_name_ar)),
      city_names_en: uniqueClean(countries.map((x) => x.city_name_en)),
    },

    salary: {
      min: salary.min ?? null,
      max: salary.max ?? null,
      min_base: salary.min_base ?? null,
      max_base: salary.max_base ?? null,
      currency_id: isValidId(salary.currency_id) ? salary.currency_id : null,
      currency_code: String(salary.currency_code || "").toUpperCase(),
    },
  };
};

const shouldRebuildSearchFilters = (fields = []) => fields.some((field) => SEARCH_FILTER_RELATED_FIELDS.has(field));

const refreshEmployeeMatchingData = async (employee, { rebuildMatches = true } = {}) => {
  await applyEmployeeProjection(employee);
  await employee.save();
  if (rebuildMatches) await rebuildMatchForEmployee(employee._id);
};

const populateEmployeeSection = async (employee, section) => {
  const populateMap = {
    languages: [{ path: "languages.language_id", select: "name title_ar title_en" }],
    skills: [{ path: "skills.skill_id", select: "key title_ar title_en category keywords_ar keywords_en" }],
    education: [{ path: "education.education_level_id", select: "name title_ar title_en" }],
    job_names: [{ path: "job_names", select: "sector_ar sector_en subSector_ar subSector_en title_ar title_en keywords" }],
    job_types: [{ path: "job_types", select: "name title_ar title_en keyword" }],
    preferred_work_modes: [{ path: "preferred_work_modes", select: "key title_ar title_en keywords_ar keywords_en" }],
    preferred_countries: [{ path: "preferred_countries", select: "city_name_ar city_name_en" }],
    blocked_companies: [{ path: "blocked_companies", select: "name title_ar title_en company_name" }],
    job_alerts: [
      { path: "job_alerts.job_type_id", select: "name title_ar title_en keyword" },
      { path: "job_alerts.work_mode_id", select: "key title_ar title_en" },
    ],
  };

  if (populateMap[section]) await employee.populate(populateMap[section]);
};

const populateEmployeeSingles = async (employee) => {
  await employee.populate([
    { path: "experience_level_id", select: "name title_ar title_en" },
    { path: "notice_period_id", select: "name title_ar title_en" },
    { path: "expected_salary.currency_id", select: "code name_ar name_en symbol_ar symbol_en rate rate_base is_base" },
  ]);
};

const populateEmployeeForProfile = async (employee) => {
  await populateEmployeeSingles(employee);
  await employee.populate([
    { path: "languages.language_id", select: "name title_ar title_en" },
    { path: "skills.skill_id", select: "key title_ar title_en category keywords_ar keywords_en" },
    { path: "education.education_level_id", select: "name title_ar title_en" },
    { path: "job_names", select: "sector_ar sector_en subSector_ar subSector_en title_ar title_en keywords" },
    { path: "job_types", select: "name title_ar title_en keyword" },
    { path: "preferred_work_modes", select: "key title_ar title_en keywords_ar keywords_en" },
  ]);
};

const serializeSingleField = (field, value, req) => {
  if (!value || typeof value !== "object") return value;

  const lang = getRequestLang(req);
  const obj = value?.toObject ? value.toObject({ virtuals: true }) : { ...value };

  if (field.endsWith("_id")) {
    return {
      ...obj,
      _id: obj._id ? String(obj._id) : undefined,
      id: obj._id ? String(obj._id) : undefined,
      display_name: getLocalizedName(obj, lang),
      name: getLocalizedName(obj, lang),
    };
  }

  addLocalizedIdNames(obj, req);

  if (field === "expected_salary" || field === "min_salary") {
    obj.currency = getCurrencyDisplay(obj.currency_id, req);
    obj.currency_name = obj.currency?.name || "";
    obj.currency_symbol = obj.currency?.symbol || "";
    obj.currency_code = obj.currency?.code || obj.currency_code || "";
  }

  return obj;
};

const paginateArray = (array = [], req) => {
  const { page = 1, limit, paginate, search = "", sort = "createdAt" } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit || paginate) || 10, 1), 100);

  let items = Array.isArray(array) ? [...array] : [];
  items = items.map((item) => serializeSectionItem(item, req));

  if (search) {
    const searchValue = String(search).toLowerCase();
    items = items.filter((item) => JSON.stringify(item).toLowerCase().includes(searchValue));
  }

  items.sort((a, b) => {
    let sortKey = String(sort).replace("-", "");
    let direction = String(sort).startsWith("-") ? -1 : 1;

    if (String(sort).includes(":")) {
      const [field, order] = String(sort).split(":");
      sortKey = field;
      direction = order === "desc" ? -1 : 1;
    }

    const aValue = a?.[sortKey];
    const bValue = b?.[sortKey];

    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;

    return String(aValue).localeCompare(String(bValue)) * direction;
  });

  const total = items.length;
  const skip = (pageNumber - 1) * limitNumber;

  return {
    data: items.slice(skip, skip + limitNumber),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber),
      has_next: pageNumber * limitNumber < total,
      has_prev: pageNumber > 1,
    },
  };
};

export const getMyEmployeeProfile = async (req, res, next) => {
  try {
    const employee = await getEmployeeOrFail(req, res);
    if (!employee) return;

    await populateEmployeeForProfile(employee);

    const completion = calculateProfileCompletion(employee);
    if (employee.profile_completion !== completion) {
      employee.profile_completion = completion;
      await rebuildEmployeeSearchFilters(employee);
      await refreshEmployeeMatchingData(employee, { rebuildMatches: false });
    }

    return success(res, { employee, completion });
  } catch (error) {
    next(error);
  }
};

export const getMyEmployeeCompletion = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const completion = calculateProfileCompletion(employee);
    if (employee.profile_completion !== completion) {
      employee.profile_completion = completion;
      await employee.save();
    }

    return success(res, { completion });
  } catch (error) {
    next(error);
  }
};

export const updateBasicEmployeeProfile = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const touchedFields = [];

    for (const field of SINGLE_FIELDS) {
      if (req.body[field] !== undefined) {
        await applySingleField(employee, field, req.body[field]);
        touchedFields.push(field);
      }
    }

    employee.profile_completion = calculateProfileCompletion(employee);

    if (shouldRebuildSearchFilters(touchedFields)) {
      await rebuildEmployeeSearchFilters(employee);
    }

    await refreshEmployeeMatchingData(employee, { rebuildMatches: shouldRebuildSearchFilters(touchedFields) });
    await populateEmployeeSingles(employee);

    return success(res, employee, "employee_profile_updated");
  } catch (error) {
    next(error);
  }
};

export const updateAboutMe = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    employee.about_me = req.body.about_me ?? "";
    employee.profile_completion = calculateProfileCompletion(employee);
    await rebuildEmployeeSearchFilters(employee);
    await refreshEmployeeMatchingData(employee);

    return success(res, employee, "about_me_updated");
  } catch (error) {
    next(error);
  }
};

export const updateLatestWorkExperience = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    await applySingleField(employee, "latest_work_experience", req.body);
    employee.profile_completion = calculateProfileCompletion(employee);
    await rebuildEmployeeSearchFilters(employee);
    await refreshEmployeeMatchingData(employee);

    return success(res, employee, "latest_work_experience_updated");
  } catch (error) {
    next(error);
  }
};

export const updateWorkPreferences = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const fields = [
      "work_location",
      "is_can_move",
      "is_free_for_work",
      "notice_period_id",
      "expected_salary",
      "preferred_work_modes",
      "preferred_countries",
      "job_types",
      "job_names",
    ];

    const touchedFields = [];

    for (const field of fields) {
      if (req.body[field] === undefined) continue;

      if (ARRAY_FIELDS.has(field)) {
        employee[field] = await normalizeEmployeeArrayField(field, req.body);
      } else {
        await applySingleField(employee, field, req.body[field]);
      }

      touchedFields.push(field);
    }

    employee.profile_completion = calculateProfileCompletion(employee);

    if (shouldRebuildSearchFilters(touchedFields)) {
      await rebuildEmployeeSearchFilters(employee);
    }

    await refreshEmployeeMatchingData(employee, { rebuildMatches: shouldRebuildSearchFilters(touchedFields) });

    await employee.populate([
      { path: "preferred_work_modes", select: "key title_ar title_en keywords_ar keywords_en" },
      { path: "notice_period_id", select: "name title_ar title_en" },
      { path: "expected_salary.currency_id", select: "code name_ar name_en symbol_ar symbol_en rate rate_base is_base" },
      { path: "job_names", select: "sector_ar sector_en subSector_ar subSector_en title_ar title_en keywords" },
      { path: "job_types", select: "name title_ar title_en keyword" },
    ]);

    return success(res, employee, "work_preferences_updated");
  } catch (error) {
    next(error);
  }
};

export const replaceSection = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (!ARRAY_FIELDS.has(section) && !SINGLE_FIELDS.has(section)) {
      return fail(res, "invalid_employee_section", 400);
    }

    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    if (ARRAY_FIELDS.has(section)) {
      employee[section] = await normalizeEmployeeArrayField(section, req.body);
    } else {
      await applySingleField(employee, section, req.body?.[section] !== undefined ? req.body[section] : req.body);
    }

    employee.profile_completion = calculateProfileCompletion(employee);

    if (SEARCH_FILTER_RELATED_FIELDS.has(section)) {
      await rebuildEmployeeSearchFilters(employee);
    }

    await refreshEmployeeMatchingData(employee, { rebuildMatches: SEARCH_FILTER_RELATED_FIELDS.has(section) });

    if (section === "expected_salary" || section === "min_salary") {
      await populateEmployeeSingles(employee);
    } else {
      await populateEmployeeSection(employee, section);
    }

    return success(res, employee, `${section}_replaced`);
  } catch (error) {
    next(error);
  }
};

export const addSectionItems = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (!ARRAY_FIELDS.has(section)) return fail(res, "invalid_employee_section", 400);

    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const items = await normalizeEmployeeArrayField(section, req.body);
    if (!items.length) return fail(res, "no_items_provided", 400);

    if (
      section === "job_names" ||
      OBJECT_ID_ARRAY_FIELDS.has(section) ||
      section === "preferred_countries" ||
      section === "cvs"
    ) {
      employee[section] = [
        ...new Set([...(employee[section] || []).map(String), ...items.map(String)]),
      ];
    } else {
      const createdItems = items.map((item) => employee[section].create(cleanSectionItem(item)));
      employee[section].push(...createdItems);
    }

    employee.profile_completion = calculateProfileCompletion(employee);

    if (SEARCH_FILTER_RELATED_FIELDS.has(section)) {
      await rebuildEmployeeSearchFilters(employee);
    }

    await refreshEmployeeMatchingData(employee, { rebuildMatches: SEARCH_FILTER_RELATED_FIELDS.has(section) });
    await populateEmployeeSection(employee, section);

    const result = Array.isArray(employee[section])
      ? employee[section].map((item) => serializeSectionItem(item, req))
      : employee[section];

    return success(res, result, `${section}_items_added`, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSectionItem = async (req, res, next) => {
  try {
    const { section, itemId } = req.params;

    if (!ARRAY_FIELDS.has(section)) return fail(res, "invalid_employee_section", 400);
    if (!mongoose.Types.ObjectId.isValid(itemId)) return fail(res, "invalid_section_item_id", 400);

    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    if (
      section === "job_names" ||
      OBJECT_ID_ARRAY_FIELDS.has(section) ||
      section === "preferred_countries" ||
      section === "cvs"
    ) {
      return fail(res, "section_item_update_not_supported_for_scalar_arrays", 422);
    }

    const item = employee[section].id?.(itemId);
    if (!item) return fail(res, "employee_section_item_not_found", 404);

    item.set(cleanSectionItem(req.body));

    employee.profile_completion = calculateProfileCompletion(employee);

    if (SEARCH_FILTER_RELATED_FIELDS.has(section)) {
      await rebuildEmployeeSearchFilters(employee);
    }

    await refreshEmployeeMatchingData(employee, { rebuildMatches: SEARCH_FILTER_RELATED_FIELDS.has(section) });
    await populateEmployeeSection(employee, section);

    const updatedItem = employee[section].id?.(itemId);
    return success(res, serializeSectionItem(updatedItem, req), `${section}_item_updated`);
  } catch (error) {
    next(error);
  }
};

export const deleteSectionItem = async (req, res, next) => {
  try {
    const { section, itemId } = req.params;

    if (!ARRAY_FIELDS.has(section)) return fail(res, "invalid_employee_section", 400);

    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

   if (
      section === "job_names" ||
      OBJECT_ID_ARRAY_FIELDS.has(section) ||
      section === "preferred_countries" ||
      section === "cvs"
    ) {
      employee[section] = (employee[section] || []).filter((value) => String(value) !== String(itemId));
    } else {
      if (!mongoose.Types.ObjectId.isValid(itemId)) return fail(res, "invalid_section_item_id", 400);

      const item = employee[section].id?.(itemId);
      if (!item) return fail(res, "employee_section_item_not_found", 404);

      employee[section].pull({ _id: itemId });
    }

    employee.profile_completion = calculateProfileCompletion(employee);

    if (SEARCH_FILTER_RELATED_FIELDS.has(section)) {
      await rebuildEmployeeSearchFilters(employee);
    }

    await refreshEmployeeMatchingData(employee, { rebuildMatches: SEARCH_FILTER_RELATED_FIELDS.has(section) });

    return success(res, employee, `${section}_item_deleted`);
  } catch (error) {
    next(error);
  }
};

export const replaceJobNames = async (req, res, next) => {
  req.params.section = "job_names";
  return replaceSection(req, res, next);
};

export const replaceJobTypes = async (req, res, next) => {
  req.params.section = "job_types";
  return replaceSection(req, res, next);
};

export const replaceMinSalary = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    await applySingleField(employee, "min_salary", req.body);
    employee.profile_completion = calculateProfileCompletion(employee);
    await rebuildEmployeeSearchFilters(employee);
    await refreshEmployeeMatchingData(employee);

    await employee.populate({
      path: "expected_salary.currency_id",
      select: "code name_ar name_en symbol_ar symbol_en rate rate_base is_base",
    });

    return success(res, serializeSingleField("min_salary", employee.expected_salary, req), "expected_salary_replaced");
  } catch (error) {
    next(error);
  }
};

export const getMyBasicProfile = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    await employee.populate("user_id", "-password -passcode -another_device_code -pending_device -device");

    return success(res, {
      user: {
        id: employee.user_id?._id,
        first_name: employee.user_id?.first_name,
        mid_name: employee.user_id?.mid_name,
        last_name: employee.user_id?.last_name,
        email: employee.user_id?.email,
        phone_code: employee.user_id?.phone_code,
        phone: employee.user_id?.phone_national,
        gender: employee.user_id?.gender,
        image: employee.user_id?.image,
        status: employee.user_id?.status,
      },
      employee: {
        id: employee._id,
        profile_headline: employee.profile_headline,
        current_job_title: employee.current_job_title,
        candidate_stage: employee.candidate_stage,
        profile_completion: employee.profile_completion,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyBasicProfile = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    await employee.populate("user_id");

    const user = employee.user_id;
    if (!user) return fail(res, "user_not_found", 404);

    const { first_name, mid_name, last_name, phone, phone_code, gender } = req.body;

    if (first_name !== undefined) user.first_name = first_name;
    if (mid_name !== undefined) user.mid_name = mid_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (phone !== undefined) user.phone_national = phone;
    if (phone_code !== undefined) user.phone_code = phone_code;
    if (gender !== undefined) user.gender = gender;

    const file = req.file || req.files?.image?.[0];

    if (file) {
      const oldImage = user.image;
      const uploaded = await processUploadImage(file, {
        targetDir: "employee",
        webpQuality: 82,
      });

      user.image = uploaded;
      if (oldImage) await deleteImage(oldImage);
    }

    await user.save();

    return success(
      res,
      {
        user: {
          id: user._id,
          first_name: user.first_name,
          mid_name: user.mid_name,
          last_name: user.last_name,
          email: user.email,
          phone_code: user.phone_code,
          phone: user.phone_national,
          gender: user.gender,
          image: user.image,
          status: user.status,
        },
      },
      "basic_profile_updated"
    );
  } catch (error) {
    next(error);
  }
};

export const getMySection = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (!ARRAY_FIELDS.has(section) && !SINGLE_FIELDS.has(section)) {
      return fail(res, "invalid_employee_section", 400);
    }

    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    await populateEmployeeSection(employee, section);

    if (ARRAY_FIELDS.has(section)) {
      const result = paginateArray(employee[section] || [], req);
      return success(res, result.data, `${section}_section`, 200, result.pagination);
    }

    await populateEmployeeSingles(employee);

    const realSection = section === "min_salary" ? "expected_salary" : section;

    return success(res, serializeSingleField(section, employee[realSection], req), `${section}_section`);
  } catch (error) {
    next(error);
  }
};

export const rebuildMySearchFilters = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    await rebuildEmployeeSearchFilters(employee);
    await refreshEmployeeMatchingData(employee);

    return success(res, employee.search_filters, "employee_search_filters_rebuilt");
  } catch (error) {
    next(error);
  }
};

export default {
  getMyEmployeeProfile,
  getMyEmployeeCompletion,
  updateBasicEmployeeProfile,
  updateAboutMe,
  updateLatestWorkExperience,
  updateWorkPreferences,
  replaceSection,
  addSectionItems,
  updateSectionItem,
  deleteSectionItem,
  replaceJobNames,
  replaceJobTypes,
  replaceMinSalary,
  getMyBasicProfile,
  updateMyBasicProfile,
  getMySection,
  rebuildMySearchFilters,
};
