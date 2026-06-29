import mongoose from "mongoose";
import {
  EmployeeCvModel,
  EmployeeModel,
  InterviewModel,
  LearningResourceModel,
  UniversityResourceAssignmentModel,
  UserApplyingJobModel,
  UserResourceProgressModel,
} from "../../models/index.js";

const { Types } = mongoose;

export const DEFAULT_RESOURCE_CATEGORIES = [
  "cv_writing",
  "interview_preparation",
  "first_job",
  "internships",
  "freelancing",
  "remote_work",
  "career_planning",
  "salary_negotiation",
  "soft_skills",
  "workplace_basics",
  "major_to_career",
  "portfolio_projects",
  "linkedin_profile",
  "job_search_strategy",
];

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const objectId = (value) => (isObjectId(value) ? new Types.ObjectId(String(value)) : null);

export const localized = (value = {}, lang = "en") => {
  if (typeof value === "string") return value;
  const preferred = lang === "ar" ? value.ar : value.en;
  return cleanText(preferred || value.en || value.ar || "");
};

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit || "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const resolveStudentProfile = async (userId) => {
  if (!userId || !isObjectId(userId)) return null;
  return EmployeeModel.findOne({ user_id: userId }).lean();
};

export const universityIdFromEmployee = (employee = {}) =>
  employee?.student_profile?.university_id || employee?.university_id || null;

export const visibleResourceFilter = ({ universityId = null } = {}) => {
  const visibility = [
    { visibility: "public" },
    { visibility: "students" },
  ];
  if (universityId && isObjectId(universityId)) {
    visibility.push({
      visibility: "university_private",
      university_id: objectId(universityId),
    });
  }
  return {
    status: "published",
    $or: visibility,
  };
};

export const mergeResourceFilters = (...filters) => {
  const parts = filters.filter((filter) => filter && Object.keys(filter).length);
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
};

export const resourceAudienceFilter = (audience) => {
  const normalized = cleanText(audience);
  if (!normalized) return {};
  return { audience: { $in: [normalized, "all"] } };
};

export const resourceSearchFilter = (query = {}) => {
  const filter = {};
  const q = cleanText(query.q || query.search);
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { "title.en": regex },
      { "title.ar": regex },
      { "summary.en": regex },
      { "summary.ar": regex },
      { tags: regex },
      { key: regex },
      { slug: regex },
    ];
  }
  if (query.type) filter.type = cleanText(query.type);
  if (query.difficulty) filter.difficulty = cleanText(query.difficulty);
  if (query.category_id && isObjectId(query.category_id)) filter.category_ids = objectId(query.category_id);
  if (query.tag) filter.tags = cleanText(query.tag);
  return filter;
};

export const attachProgress = async ({ resources = [], userId }) => {
  if (!userId || !resources.length) return resources.map((resource) => ({ ...resource, progress: null }));
  const ids = resources.map((resource) => resource._id).filter(Boolean);
  const rows = await UserResourceProgressModel.find({ user_id: userId, resource_id: { $in: ids } }).lean();
  const byResource = new Map(rows.map((row) => [String(row.resource_id), row]));
  return resources.map((resource) => ({
    ...resource,
    progress: byResource.get(String(resource._id)) || null,
  }));
};

export const serializeResource = (resource = {}, { lang = "en" } = {}) => ({
  id: String(resource._id || resource.id || ""),
  key: resource.key || "",
  slug: resource.slug || "",
  type: resource.type || "",
  audience: resource.audience || [],
  title: localized(resource.title, lang),
  title_i18n: resource.title || {},
  summary: localized(resource.summary, lang),
  summary_i18n: resource.summary || {},
  body: localized(resource.body, lang),
  body_i18n: resource.body || {},
  category_ids: (resource.category_ids || []).map((item) => String(item?._id || item)),
  tags: resource.tags || [],
  language: resource.language || "both",
  media_url: resource.media_url || "",
  file_url: resource.file_url || "",
  cover_image: resource.cover_image || "",
  estimated_minutes: resource.estimated_minutes || 5,
  difficulty: resource.difficulty || "beginner",
  source_type: resource.source_type || "platform",
  university_id: resource.university_id ? String(resource.university_id?._id || resource.university_id) : null,
  company_id: resource.company_id ? String(resource.company_id?._id || resource.company_id) : null,
  visibility: resource.visibility || "public",
  status: resource.status || "draft",
  featured: Boolean(resource.featured),
  sort_order: resource.sort_order || 0,
  published_at: resource.published_at || null,
  progress: resource.progress
    ? {
        saved: Boolean(resource.progress.saved),
        status: resource.progress.status,
        progress_percent: resource.progress.progress_percent,
        completed_at: resource.progress.completed_at,
        last_opened_at: resource.progress.last_opened_at,
      }
    : null,
});

export const findVisibleResource = async ({ idOrSlug, userId, universityId }) => {
  const identity = isObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { $or: [{ slug: cleanText(idOrSlug).toLowerCase() }, { key: cleanText(idOrSlug).toLowerCase() }] };
  const resource = await LearningResourceModel.findOne(
    mergeResourceFilters(identity, visibleResourceFilter({ universityId })),
  ).lean();
  if (!resource) return null;
  const [withProgress] = await attachProgress({ resources: [resource], userId });
  return withProgress;
};

export const upsertProgress = async ({ userId, resourceId, patch = {} }) => {
  const update = {
    $set: {
      ...patch,
      last_opened_at: new Date(),
    },
    $setOnInsert: {
      user_id: userId,
      resource_id: resourceId,
    },
  };
  return UserResourceProgressModel.findOneAndUpdate(
    { user_id: userId, resource_id: resourceId },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export const buildResourceRecommendations = async ({ userId, employee = null, universityId = null, limit = 12 }) => {
  const profile = employee || (await resolveStudentProfile(userId)) || {};
  const [defaultCv, applications, interviews, assigned] = await Promise.all([
    profile?._id ? EmployeeCvModel.findOne({ employee_id: profile._id }).sort({ is_default: -1, createdAt: -1 }).lean() : null,
    userId ? UserApplyingJobModel.countDocuments({ user_id: userId }) : 0,
    userId ? InterviewModel.countDocuments({ user_id: userId, status: { $in: ["scheduled", "rescheduled", "accepted"] } }) : 0,
    universityId && isObjectId(universityId)
      ? UniversityResourceAssignmentModel.find({ university_id: universityId, status: "active" }).select("resource_id").lean()
      : [],
  ]);

  const tags = new Set();
  if (!defaultCv || Number(defaultCv.quality_score || 0) < 70) tags.add("cv_writing");
  if (profile?.student_profile && !(profile.student_profile.projects || []).length) tags.add("portfolio_projects");
  if (interviews > 0) tags.add("interview_preparation");
  if (applications >= 5 && interviews === 0) {
    tags.add("cv_writing");
    tags.add("job_search_strategy");
  }
  if (!profile?.expected_salary?.min && !profile?.expected_salary?.max) tags.add("salary_negotiation");

  const assignedIds = assigned.map((item) => item.resource_id).filter(Boolean);
  const filters = [
    assignedIds.length ? { _id: { $in: assignedIds } } : null,
    tags.size ? { tags: { $in: [...tags] } } : null,
    { featured: true },
  ].filter(Boolean);

  const query = mergeResourceFilters(
    visibleResourceFilter({ universityId }),
    { audience: { $in: ["all", "students", "fresh_graduates", "job_seekers"] } },
    filters.length ? { $or: filters } : {},
  );

  const resources = await LearningResourceModel.find(query)
    .sort({ featured: -1, sort_order: 1, published_at: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return attachProgress({ resources, userId });
};

export default {
  DEFAULT_RESOURCE_CATEGORIES,
  attachProgress,
  buildResourceRecommendations,
  findVisibleResource,
  mergeResourceFilters,
  parsePagination,
  resourceAudienceFilter,
  resourceSearchFilter,
  resolveStudentProfile,
  serializeResource,
  universityIdFromEmployee,
  upsertProgress,
  visibleResourceFilter,
};
