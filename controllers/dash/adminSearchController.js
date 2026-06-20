import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  CompanyModel,
  EmployeeModel,
  JobZainTalentRequestModel,
  UserApplyingJobModel,
  UserModel,
  jobsModel,
} from "../../models/index.js";

const clean = (value = "") => String(value || "").trim();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const normalize = (value = "") =>
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

const tokensOf = (value = "") => [...new Set(normalize(value).split(/\s+/).filter((x) => x.length >= 2))];

const limitOf = (req) => parseIntBounded(req.query.limit, 8, 1, 30);

const execute = async (key, promise) => {
  try {
    const items = await promise;
    return { key, count: items.length, items };
  } catch (error) {
    return { key, count: 0, items: [], error: error.message };
  }
};

export const globalSearch = async (req, res) => {
  try {
    const q = clean(req.query.q || req.query.search || req.query.keyword);
    if (!q) return ReturnDashData.getError({ res, status: 400, message: "search_query_required" });

    const limit = limitOf(req);
    const regex = new RegExp(escapeRegex(q), "i");
    const tokens = tokensOf(q);
    const requestedResources = clean(req.query.resources || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    const only = (key) => !requestedResources.length || requestedResources.includes(key);
    const objectId = isValidObjectId(q) ? new mongoose.Types.ObjectId(String(q)) : null;

    const userQuery = {
      $or: [
        { first_name: regex },
        { mid_name: regex },
        { last_name: regex },
        { email: regex },
        { phone: regex },
        { phone_e164: regex },
        { phone_national: regex },
        ...(objectId ? [{ _id: objectId }] : []),
      ],
    };

    const users = await UserModel.find(userQuery).select("_id").limit(500).lean();
    const userIds = users.map((user) => user._id);

    const tasks = [];

    if (only("users")) {
      tasks.push(execute("users", UserModel.find(userQuery).select("-password -passcode -another_device_code").limit(limit).lean()));
    }

    if (only("companies")) {
      tasks.push(execute("companies", CompanyModel.find({
        $or: [
          { company_name: regex },
          { company_email: regex },
          { slug: regex },
          { description: regex },
          { industry_name: regex },
          { company_city: regex },
          { company_country: regex },
          { specialties: regex },
          { "company_projection.searchable_tokens": { $in: tokens } },
          ...(objectId ? [{ _id: objectId }, { owner_user_id: objectId }] : []),
          ...(userIds.length ? [{ owner_user_id: { $in: userIds } }] : []),
        ],
      }).populate("owner_user_id", "first_name mid_name last_name email").limit(limit).lean()));
    }

    if (only("employees")) {
      tasks.push(execute("employees", EmployeeModel.find({
        $or: [
          { profile_headline: regex },
          { current_job_title: regex },
          { about_me: regex },
          { "skills.title": regex },
          { "matching_profile.searchable_text": regex },
          { "matching_profile.searchable_tokens": { $in: tokens } },
          { "matching_profile.normalized_skills": { $in: tokens } },
          ...(objectId ? [{ _id: objectId }, { user_id: objectId }] : []),
          ...(userIds.length ? [{ user_id: { $in: userIds } }] : []),
        ],
      }).populate("user_id", "first_name mid_name last_name email image phone_national phone_e164").limit(limit).lean()));
    }

    if (only("jobs")) {
      tasks.push(execute("jobs", jobsModel.find({
        $or: [
          { job_name: regex },
          { description: regex },
          { city: regex },
          { countries: regex },
          { cities: regex },
          { job_keywords: regex },
          { keywords_norm: regex },
          { phrases_norm: regex },
          { "skills_required.title": regex },
          { "skills_optional.title": regex },
          { "search_index.tokens": { $in: tokens } },
          { "search_projection.company.name": regex },
          ...(objectId ? [{ _id: objectId }, { company_id: objectId }, { user_id: objectId }] : []),
        ],
      }).populate("company_id", "company_name company_email logo").limit(limit).lean()));
    }

    if (only("applications")) {
      tasks.push(execute("applications", UserApplyingJobModel.find({
        $or: [
          { first_name: regex },
          { last_name: regex },
          { email: regex },
          { phone_national: regex },
          { status: regex },
          { cover_letter: regex },
          ...(objectId ? [{ _id: objectId }, { user_id: objectId }, { job_id: objectId }, { company_id: objectId }] : []),
        ],
      }).populate("job_id", "job_name").populate("company_id", "company_name").limit(limit).lean()));
    }

    if (only("talent_requests")) {
      tasks.push(execute("talent_requests", JobZainTalentRequestModel.find({
        $or: [
          { title: regex },
          { description: regex },
          { required_skills: regex },
          { preferred_skills: regex },
          { countries: regex },
          { cities: regex },
          { status: regex },
          ...(objectId ? [{ _id: objectId }, { company_id: objectId }, { job_id: objectId }] : []),
        ],
      }).populate("company_id", "company_name company_email").populate("job_id", "job_name").limit(limit).lean()));
    }

    const groups = await Promise.all(tasks);
    return ReturnDashData.getData({ res, data: groups, other: { query: q, tokens, limit } });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "global_search_failed" });
  }
};

export default { globalSearch };
