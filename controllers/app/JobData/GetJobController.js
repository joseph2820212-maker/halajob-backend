import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  EmployeeModel,
  UserSavedJobModel,
  UserShowJobModel,
  UserApplyingJobModel,
  JobEmployeeMatchModel,
} from "../../../models/index.js";
import { calculateJobEmployeeMatch } from "../../../services/matching/jobEmployeeMatching.js";

const { Types } = mongoose;
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || "";

const isValidId = (value) => mongoose.isValidObjectId(String(value || ""));
const toObjectId = (value) => (isValidId(value) ? new Types.ObjectId(String(value)) : null);
const toIdString = (value) => String(value?._id || value || "").trim();

const buildPublicUrl = (rel) => {
  if (!rel) return null;
  const value = String(rel || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const clean = value.replace(/^\/+/, "");
  return PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/+$/, "")}/${clean}` : `/${clean}`;
};

const normalizeText = (value = "") =>
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

const unique = (arr = []) => [...new Set(arr.flat(Infinity).map((x) => String(x || "").trim()).filter(Boolean))];
const tokenise = (value = "") => unique(normalizeText(value).split(/\s+/).filter((x) => x.length >= 2)).slice(0, 12);
const parseJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return {}; }
};
const parseArray = (...values) => unique(values.flatMap((value) => {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value;
  return String(value).split(",").map((x) => x.trim()).filter(Boolean);
}));
const parseBool = (value) => {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return null;
};
const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const dateFromBucket = (key) => {
  const now = new Date();
  const d = new Date(now);
  if (key === "last_24h") d.setDate(now.getDate() - 1);
  else if (key === "last_7d") d.setDate(now.getDate() - 7);
  else if (key === "last_30d") d.setDate(now.getDate() - 30);
  else return null;
  return d;
};

const langFromReq = (req) => (String(req.get("lan") || req.get("lang") || "en").toLowerCase().startsWith("ar") ? "ar" : "en");
const labelOf = (value, lang = "en") => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value?.[`title_${lang}`] || value?.[`name_${lang}`] || value?.title || value?.name || value?.key || "").trim();
};

const getEmployeeForUser = async (userId) => {
  if (!userId) return null;
  return EmployeeModel.findOne({ user_id: userId }).lean();
};

const publicJobMatch = () => {
  const now = new Date();
  return {
    status: true,
    is_accepted: true,
    publish_status: { $in: ["published", null] },
    $and: [
      { $or: [{ started_date: null }, { started_date: { $lte: now } }] },
      { $or: [{ end_date: null }, { end_date: { $gte: now } }] },
      { $or: [{ apply_deadline: null }, { apply_deadline: { $gte: now } }] },
    ],
  };
};

const buildJobSearchMatch = (tokens) => {
  if (!tokens.length) return {};
  return {
    $and: tokens.map((token) => ({
      $or: [
        { "search_index.tokens": token },
        { "search_index.title_tokens": token },
        { "search_index.skill_tokens": token },
        { "search_index.company_tokens": token },
        { "search_index.service_tokens": token },
        { "search_index.sector_tokens": token },
        { "search_projection.matching.tokens": token },
        { "search_index.text_norm": { $regex: token, $options: "i" } },
        { job_name: { $regex: token, $options: "i" } },
      ],
    })),
  };
};

const readFilters = (req) => {
  const body = parseJsonObject(req.query.filters);
  return {
    q: String(req.query.search || req.query.q || body.search || body.q || "").trim(),
    company_ids: parseArray(req.query.company_id, req.query.company_ids, body.company_id, body.company_ids, body.companies),
    job_type_ids: parseArray(req.query.job_type_id, req.query.job_type_ids, body.job_type_id, body.job_type_ids, body.types),
    work_mode_ids: parseArray(req.query.work_mode_id, req.query.work_mode_ids, body.work_mode_id, body.work_mode_ids, body.work_modes),
    job_time_ids: parseArray(req.query.job_time_id, req.query.job_time_ids, body.job_time_id, body.job_time_ids, body.work_times),
    salary_type_ids: parseArray(req.query.job_salary_id, req.query.job_salary_ids, body.job_salary_id, body.job_salary_ids, body.salary_types),
    experience_level_ids: parseArray(req.query.experience_level_id, req.query.experience_level_ids, body.experience_level_id, body.experience_level_ids),
    education_level_ids: parseArray(req.query.education_level_id, req.query.education_level_ids, body.education_level_id, body.education_level_ids),
    countries: parseArray(req.query.country, req.query.countries, req.query.country_id, body.country, body.countries, body.country_id),
    cities: parseArray(req.query.city, req.query.cities, body.city, body.cities),
    skills: parseArray(req.query.skill, req.query.skills, body.skill, body.skills).map(normalizeText).filter(Boolean),
    languages: parseArray(req.query.language, req.query.languages, body.language, body.languages).map(normalizeText).filter(Boolean),
    services: parseArray(req.query.service, req.query.services, body.service, body.services).map(normalizeText).filter(Boolean),
    candidate_target: parseArray(req.query.candidate_target, body.candidate_target),
    is_remote: parseBool(req.query.is_remote ?? body.is_remote ?? body.remote),
    not_seen: parseBool(req.query.not_seen ?? body.not_seen) === true,
    not_applied: parseBool(req.query.not_applied ?? body.not_applied) === true,
    saved_only: parseBool(req.query.saved_only ?? body.saved_only) === true,
    publish_date: String(req.query.publish_date || body.publish_date || "").trim(),
    salary_min_usd: parseNumber(req.query.salary_min_usd ?? body.salary_min_usd),
    salary_max_usd: parseNumber(req.query.salary_max_usd ?? body.salary_max_usd),
    min_match_score: parseNumber(req.query.min_match_score ?? body.min_match_score),
    sort: String(req.query.sort || body.sort || "recommended").trim(),
  };
};

const buildFilterMatch = (filters) => {
  const match = publicJobMatch();
  const and = [...(match.$and || [])];
  delete match.$and;

  const search = buildJobSearchMatch(tokenise(filters.q));
  if (search.$and) and.push(...search.$and);

  const objectIdIn = (field, ids) => {
    const values = ids.filter(isValidId).map((id) => new Types.ObjectId(String(id)));
    if (values.length) match[field] = { $in: values };
  };

  objectIdIn("company_id", filters.company_ids);
  objectIdIn("job_type_id", filters.job_type_ids);
  objectIdIn("work_mode_id", filters.work_mode_ids);
  objectIdIn("job_time_id", filters.job_time_ids);
  objectIdIn("job_salary_id", filters.salary_type_ids);
  objectIdIn("experience_level_id", filters.experience_level_ids);
  objectIdIn("education_level_id", filters.education_level_ids);

  if (filters.countries.length) {
    and.push({ $or: [
      { countries: { $in: filters.countries } },
      { "search_index.filters.countries": { $in: filters.countries } },
      { "search_projection.company.country": { $in: filters.countries } },
    ] });
  }
  if (filters.cities.length) {
    and.push({ $or: [
      { cities: { $in: filters.cities } },
      { city: { $in: filters.cities } },
      { "search_index.filters.cities": { $in: filters.cities } },
      { "search_index.filters.city": { $in: filters.cities } },
    ] });
  }
  if (filters.skills.length) and.push({ "search_index.filters.skills": { $in: filters.skills } });
  if (filters.languages.length) and.push({ "search_index.filters.languages": { $in: filters.languages } });
  if (filters.services.length) and.push({ "search_index.filters.services": { $in: filters.services } });
  if (filters.candidate_target.length) and.push({ candidate_target: { $in: [...filters.candidate_target, "all"] } });
  if (filters.is_remote !== null) match.is_remote = filters.is_remote;
  if (filters.salary_min_usd !== null) and.push({ $or: [{ "salary.max_usd": null }, { "salary.max_usd": { $gte: filters.salary_min_usd } }] });
  if (filters.salary_max_usd !== null) and.push({ $or: [{ "salary.min_usd": null }, { "salary.min_usd": { $lte: filters.salary_max_usd } }] });
  const createdAt = dateFromBucket(filters.publish_date);
  if (createdAt) match.createdAt = { $gte: createdAt };
  if (and.length) match.$and = and;
  return match;
};

const employeeSoftMatch = (employee) => {
  if (!employee?.matching_profile) return [];
  const p = employee.matching_profile;
  const or = [];
  if (p.normalized_skills?.length) or.push({ "search_index.filters.skills": { $in: p.normalized_skills } });
  if (p.normalized_languages?.length) or.push({ "search_index.filters.languages": { $in: p.normalized_languages } });
  if (p.normalized_titles?.length) or.push({ "search_projection.matching.normalized_titles": { $in: p.normalized_titles } });
  if (p.preferred_country_values?.length) or.push({ "search_index.filters.countries": { $in: p.preferred_country_values } });
  if (p.preferred_work_mode_keys?.length) or.push({ "search_index.filters.work_mode": { $in: p.preferred_work_mode_keys } });
  if (employee.candidate_stage && employee.candidate_stage !== "unknown") {
    const stageMap = { student: "students", graduate: "graduates", fresh_graduate: "fresh_graduates", experienced: "experienced", career_changer: "career_changers" };
    or.push({ candidate_target: { $in: [stageMap[employee.candidate_stage], "all"].filter(Boolean) } });
  }
  return or;
};

const sortStage = (sort) => {
  if (sort === "newest") return { createdAt: -1, _id: -1 };
  if (sort === "popular") return { "search_projection.ranking.popularity_score": -1, user_show: -1, user_saved: -1, createdAt: -1 };
  if (sort === "salary_high") return { "salary.max_usd": -1, "salary.min_usd": -1, createdAt: -1 };
  return { _match_score: -1, _search_score: -1, "search_projection.ranking.total_score": -1, priority: -1, createdAt: -1, _id: -1 };
};

const decorateJobs = async (jobs, userId, employee) => {
  const jobIds = jobs.map((j) => j._id);
  const [saved, applied, seen, storedMatches] = await Promise.all([
    userId ? UserSavedJobModel.find({ user_id: userId, job_id: { $in: jobIds } }).select("job_id").lean() : [],
    userId ? UserApplyingJobModel.find({ user_id: userId, job_id: { $in: jobIds } }).select("job_id status createdAt").lean() : [],
    userId ? UserShowJobModel.find({ user_id: userId, job_id: { $in: jobIds } }).select("job_id").lean() : [],
    employee?._id ? JobEmployeeMatchModel.find({ employee_id: employee._id, job_id: { $in: jobIds } }).lean() : [],
  ]);
  const savedSet = new Set(saved.map((x) => toIdString(x.job_id)));
  const seenSet = new Set(seen.map((x) => toIdString(x.job_id)));
  const appliedMap = new Map(applied.map((x) => [toIdString(x.job_id), x]));
  const matchMap = new Map(storedMatches.map((x) => [toIdString(x.job_id), x]));

  return jobs.map((job) => {
    const key = toIdString(job._id);
    const stored = matchMap.get(key);
    const calculated = employee ? calculateJobEmployeeMatch(job, employee) : null;
    const match = stored || calculated;
    const companyProjection = job.search_projection?.company || {};
    const appliedDoc = appliedMap.get(key);
    return {
      id: job._id,
      title: job.job_name || "",
      description: job.description || "",
      company: {
        id: job.company_id || companyProjection.id || null,
        name: companyProjection.name || job.company?.company_name || "",
        image: buildPublicUrl(companyProjection.logo || job.company?.image || job.company?.logo),
        industry_name: companyProjection.industry_name || "",
        verified: Boolean(companyProjection.verified),
        rating: Number(companyProjection.rating || 0),
      },
      location: {
        countries: job.countries || job.search_index?.filters?.countries || [],
        cities: job.cities || job.search_index?.filters?.cities || [],
        city: job.city || job.search_index?.filters?.city || "",
        is_remote: Boolean(job.is_remote),
      },
      job_type: labelOf(job.job_type_info) || job.search_index?.filters?.job_type || "",
      work_mode: labelOf(job.work_mode_info) || job.search_index?.filters?.work_mode || "",
      work_time: labelOf(job.job_time_info) || job.search_index?.filters?.work_time || "",
      salary: {
        min: job.salary?.min ?? null,
        max: job.salary?.max ?? null,
        min_usd: job.salary?.min_usd ?? null,
        max_usd: job.salary?.max_usd ?? null,
        currency_code: job.salary?.currency_code || "",
        is_visible: job.salary?.is_visible !== false,
        is_negotiable: Boolean(job.salary?.is_negotiable),
      },
      counters: {
        views: Number(job.user_show || 0),
        saves: Number(job.user_saved || 0),
        applies: Number(job.user_applying || 0),
        reviews: Number(job.user_review || 0),
        rating: Number(job.rating || 0),
      },
      match: match ? {
        score: Number(match.score || 0),
        breakdown: match.breakdown || {},
        matched_skills: match.matched_skills || [],
        missing_skills: match.missing_skills || [],
        matched_languages: match.matched_languages || [],
        missing_languages: match.missing_languages || [],
      } : null,
      flags: {
        is_saved: savedSet.has(key),
        is_seen: seenSet.has(key),
        is_applied: Boolean(appliedDoc),
        application_status: appliedDoc?.status || null,
        is_out_side: Boolean(job.is_out_side),
        is_cv_required: job.is_cv_required !== false,
      },
      created_at: job.createdAt,
      apply_deadline: job.apply_deadline || null,
    };
  });
};

const markSeen = async (userId, jobIds = []) => {
  if (!userId || !jobIds.length) return;
  const operations = jobIds.map((jobId) => ({ updateOne: { filter: { user_id: userId, job_id: jobId }, update: { $setOnInsert: { user_id: userId, job_id: jobId } }, upsert: true } }));
  await UserShowJobModel.bulkWrite(operations, { ordered: false }).catch(() => null);
  await jobsModel.updateMany({ _id: { $in: jobIds } }, { $inc: { user_show: 1, "search_index.score_signals.views": 1 } }).catch(() => null);
};

const get = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id || req.query.user_id);
    const employee = await getEmployeeForUser(userId);
    const filters = readFilters(req);
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;

    const match = buildFilterMatch(filters);
    const employeeOr = employeeSoftMatch(employee);
    if (!filters.q && filters.sort === "recommended" && employeeOr.length) {
      match.$and = [...(match.$and || []), { $or: employeeOr }];
    }

    const restrictedByUserLookups = [];
    if (userId && (filters.not_seen || filters.not_applied || filters.saved_only)) {
      restrictedByUserLookups.push(
        { $lookup: { from: UserSavedJobModel.collection.name, let: { jid: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$job_id", "$$jid"] }, { $eq: ["$user_id", userId] }] } } }, { $limit: 1 }], as: "__saved" } },
        { $lookup: { from: UserShowJobModel.collection.name, let: { jid: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$job_id", "$$jid"] }, { $eq: ["$user_id", userId] }] } } }, { $limit: 1 }], as: "__seen" } },
        { $lookup: { from: UserApplyingJobModel.collection.name, let: { jid: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$job_id", "$$jid"] }, { $eq: ["$user_id", userId] }] } } }, { $limit: 1 }], as: "__applied" } },
      );
      if (filters.saved_only) restrictedByUserLookups.push({ $match: { "__saved.0": { $exists: true } } });
      if (filters.not_seen) restrictedByUserLookups.push({ $match: { "__seen.0": { $exists: false } } });
      if (filters.not_applied) restrictedByUserLookups.push({ $match: { "__applied.0": { $exists: false } } });
    }

    const tokens = tokenise(filters.q);
    const addScores = {
      $addFields: {
        _search_score: tokens.length ? { $size: { $setIntersection: [{ $ifNull: ["$search_index.tokens", []] }, tokens] } } : 0,
        _match_score: 0,
      },
    };

    const pipeline = [
      { $match: match },
      ...restrictedByUserLookups,
      addScores,
    ];

    if (employee?._id) {
      pipeline.push({ $lookup: { from: JobEmployeeMatchModel.collection.name, let: { jid: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$job_id", "$$jid"] }, { $eq: ["$employee_id", employee._id] }] } } }, { $limit: 1 }], as: "__match" } });
      pipeline.push({ $addFields: { _match_score: { $ifNull: [{ $arrayElemAt: ["$__match.score", 0] }, 0] } } });
      if (filters.min_match_score !== null) pipeline.push({ $match: { _match_score: { $gte: filters.min_match_score } } });
    }

    pipeline.push(
      { $sort: sortStage(filters.sort) },
      { $facet: { items: [{ $skip: skip }, { $limit: limit }], meta: [{ $count: "total" }] } },
    );

    const [agg] = await jobsModel.aggregate(pipeline).allowDiskUse(true);
    const rawItems = agg?.items || [];
    const total = agg?.meta?.[0]?.total || 0;
    const data = await decorateJobs(rawItems, userId, employee);

    if (parseBool(req.query.mark_seen) === true) await markSeen(userId, rawItems.map((x) => x._id));

    return ReturnAppData.getData({
      res,
      data,
      other: { pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total }, employee_profile_ready: Boolean(employee?.matching_profile) },
    });
  } catch (error) {
    next(error);
  }
};

const optionLabel = (value, fallback = "") => String(value || fallback || "").trim();
const buildFacetOptions = (rows = [], key = "_id") => rows.filter((x) => x?._id !== null && x?._id !== "").map((x) => ({ value: x._id, id: x.id || null, label: optionLabel(x.label, x._id), count: x.count }));

const getFilters = async (req, res, next) => {
  try {
    const lang = langFromReq(req);
    const filters = readFilters(req);
    const baseMatch = buildFilterMatch({ ...filters, company_ids: [], job_type_ids: [], work_mode_ids: [], job_time_ids: [], salary_type_ids: [], experience_level_ids: [], education_level_ids: [], countries: [], cities: [], skills: [], languages: [], services: [], candidate_target: [], is_remote: null, salary_min_usd: null, salary_max_usd: null, publish_date: "" });

    const pipeline = [
      { $match: baseMatch },
      {
        $facet: {
          companies: [
            { $group: { _id: "$company_id", label: { $first: "$search_projection.company.name" }, image: { $first: "$search_projection.company.logo" }, count: { $sum: 1 } } },
            { $sort: { count: -1, label: 1 } }, { $limit: 80 },
          ],
          job_types: [
            { $group: { _id: "$search_index.filters.job_type", id: { $first: "$search_index.filters.job_type_id" }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }, { $limit: 80 },
          ],
          work_modes: [
            { $group: { _id: "$search_index.filters.work_mode", id: { $first: "$search_index.filters.work_mode_id" }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          work_times: [
            { $group: { _id: "$search_index.filters.work_time", id: { $first: "$search_index.filters.job_time_id" }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          salary_types: [
            { $group: { _id: "$search_index.filters.salary_type", id: { $first: "$search_index.filters.job_salary_id" }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          countries: [
            { $unwind: "$search_index.filters.countries" },
            { $group: { _id: "$search_index.filters.countries", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }, { $limit: 80 },
          ],
          cities: [
            { $unwind: "$search_index.filters.cities" },
            { $group: { _id: "$search_index.filters.cities", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }, { $limit: 80 },
          ],
          skills: [
            { $unwind: "$search_index.filters.skills" },
            { $group: { _id: "$search_index.filters.skills", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }, { $limit: 100 },
          ],
          languages: [
            { $unwind: "$search_index.filters.languages" },
            { $group: { _id: "$search_index.filters.languages", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }, { $limit: 80 },
          ],
          services: [
            { $unwind: "$search_index.filters.services" },
            { $group: { _id: "$search_index.filters.services", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }, { $limit: 80 },
          ],
          candidate_target: [
            { $unwind: "$candidate_target" },
            { $group: { _id: "$candidate_target", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          salary_range: [
            { $group: { _id: null, min: { $min: "$salary.min_usd" }, max: { $max: "$salary.max_usd" } } },
          ],
          remote: [
            { $group: { _id: "$is_remote", count: { $sum: 1 } } },
          ],
        },
      },
    ];

    const [agg] = await jobsModel.aggregate(pipeline).allowDiskUse(true);
    const t = (ar, en) => lang === "ar" ? ar : en;
    const groups = [
      { key: "company_ids", title: t("الشركات", "Companies"), type: "multi_select", options: (agg.companies || []).map((x) => ({ value: toIdString(x._id), label: x.label || "", image: buildPublicUrl(x.image), count: x.count })) },
      { key: "job_type_ids", title: t("نوع الوظيفة", "Job type"), type: "multi_select", options: buildFacetOptions(agg.job_types) },
      { key: "work_mode_ids", title: t("نمط العمل", "Work mode"), type: "multi_select", options: buildFacetOptions(agg.work_modes) },
      { key: "job_time_ids", title: t("دوام العمل", "Work time"), type: "multi_select", options: buildFacetOptions(agg.work_times) },
      { key: "salary_type_ids", title: t("نوع الراتب", "Salary type"), type: "multi_select", options: buildFacetOptions(agg.salary_types) },
      { key: "countries", title: t("الدول", "Countries"), type: "multi_select", options: buildFacetOptions(agg.countries) },
      { key: "cities", title: t("المدن", "Cities"), type: "multi_select", options: buildFacetOptions(agg.cities) },
      { key: "skills", title: t("المهارات", "Skills"), type: "multi_select", options: buildFacetOptions(agg.skills) },
      { key: "languages", title: t("اللغات", "Languages"), type: "multi_select", options: buildFacetOptions(agg.languages) },
      { key: "services", title: t("الخدمات", "Services"), type: "multi_select", options: buildFacetOptions(agg.services) },
      { key: "candidate_target", title: t("الفئة المستهدفة", "Candidate target"), type: "multi_select", options: buildFacetOptions(agg.candidate_target) },
      { key: "is_remote", title: t("عن بعد", "Remote"), type: "boolean", options: (agg.remote || []).map((x) => ({ value: x._id === true, label: x._id === true ? t("عن بعد", "Remote") : t("ليس عن بعد", "Not remote"), count: x.count })) },
      { key: "publish_date", title: t("تاريخ النشر", "Publish date"), type: "single_select", options: [{ value: "last_24h", label: t("آخر 24 ساعة", "Last 24 hours") }, { value: "last_7d", label: t("آخر 7 أيام", "Last 7 days") }, { value: "last_30d", label: t("آخر 30 يوم", "Last 30 days") }] },
      { key: "salary_usd", title: t("نطاق الراتب بالدولار", "Salary range USD"), type: "range", min: agg.salary_range?.[0]?.min ?? null, max: agg.salary_range?.[0]?.max ?? null },
    ];

    return ReturnAppData.getData({ res, data: { groups, raw: agg } });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id || req.query.user_id);
    const employee = await getEmployeeForUser(userId);
    const id = toObjectId(req.params.id);
    if (!id) return ReturnAppData.getError({ res, status: 400, message: "invalid job id" });

    const job = await jobsModel.findOne({ _id: id, ...publicJobMatch() }).lean();
    if (!job) return ReturnAppData.getError({ res, status: 404, message: "job not found" });

    await markSeen(userId, [job._id]);
    const [item] = await decorateJobs([job], userId, employee);
    return ReturnAppData.getData({ res, data: { ...item, questions: job.questions || [], out_link: job.is_out_side ? job.out_link || null : null, requirements: job.search_projection?.requirements || {}, job_services: job.job_services || [] } });
  } catch (error) {
    next(error);
  }
};

export default { get, getFilters, getById };
