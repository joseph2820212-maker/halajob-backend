import mongoose from "mongoose";
import {
  LearningResourceCategoryModel,
  LearningResourceModel,
} from "../../models/index.js";
import {
  parsePagination,
  resourceSearchFilter,
  serializeResource,
} from "../../services/resources/learningResource.service.js";

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const adminId = (req) => req.admin?._id || req.user?._id || null;

const ok = (res, data, message = "success", status = 200, other = undefined) => {
  const payload = { success: true, status: true, message, data };
  if (other) payload.other = other;
  return res.status(status).json(payload);
};

const fail = (res, message, status = 400) => res.status(status).json({ success: false, status: false, message });

const normalizeResourcePayload = (body = {}, actor = null) => ({
  key: cleanText(body.key).toLowerCase() || undefined,
  slug: cleanText(body.slug).toLowerCase() || undefined,
  type: cleanText(body.type) || "article",
  audience: Array.isArray(body.audience) && body.audience.length ? body.audience : ["all"],
  title: body.title || { en: cleanText(body.title_en || body.title), ar: cleanText(body.title_ar) },
  summary: body.summary || { en: cleanText(body.summary_en || body.summary), ar: cleanText(body.summary_ar) },
  body: body.body || { en: cleanText(body.body_en || body.content), ar: cleanText(body.body_ar) },
  category_ids: Array.isArray(body.category_ids) ? body.category_ids.filter(isObjectId) : [],
  tags: Array.isArray(body.tags) ? body.tags.map(cleanText).filter(Boolean) : cleanText(body.tags).split(/[,;]+/).map(cleanText).filter(Boolean),
  language: ["ar", "en", "both"].includes(body.language) ? body.language : "both",
  media_url: cleanText(body.media_url),
  file_url: cleanText(body.file_url),
  cover_image: cleanText(body.cover_image),
  estimated_minutes: Math.max(1, Number(body.estimated_minutes || 5)),
  difficulty: ["beginner", "intermediate", "advanced"].includes(body.difficulty) ? body.difficulty : "beginner",
  source_type: ["platform", "university", "company"].includes(body.source_type) ? body.source_type : "platform",
  university_id: isObjectId(body.university_id) ? body.university_id : null,
  company_id: isObjectId(body.company_id) ? body.company_id : null,
  visibility: ["public", "students", "university_private", "draft"].includes(body.visibility) ? body.visibility : "public",
  status: ["draft", "published", "archived"].includes(body.status) ? body.status : "draft",
  featured: Boolean(body.featured),
  sort_order: Number(body.sort_order || 0),
  updated_by: actor,
});

export const listResources = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {
      ...resourceSearchFilter(req.query),
    };
    if (req.query.status) filter.status = cleanText(req.query.status);
    if (req.query.visibility) filter.visibility = cleanText(req.query.visibility);
    const [resources, total] = await Promise.all([
      LearningResourceModel.find(filter).sort({ sort_order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      LearningResourceModel.countDocuments(filter),
    ]);
    return ok(res, resources.map((resource) => serializeResource(resource)), "learning_resources", 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total },
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const payload = normalizeResourcePayload(req.body, adminId(req));
    payload.created_by = adminId(req);
    if (payload.status === "published") payload.published_at = new Date();
    const resource = await LearningResourceModel.create(payload);
    return ok(res, serializeResource(resource), "learning_resource_created", 201);
  } catch (error) {
    next(error);
  }
};

export const getResource = async (req, res, next) => {
  try {
    const resource = await LearningResourceModel.findById(req.params.id).lean();
    if (!resource) return fail(res, "resource_not_found", 404);
    return ok(res, serializeResource(resource), "learning_resource");
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req, res, next) => {
  try {
    const patch = normalizeResourcePayload(req.body, adminId(req));
    if (patch.status === "published") patch.published_at = new Date();
    const resource = await LearningResourceModel.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
    if (!resource) return fail(res, "resource_not_found", 404);
    return ok(res, serializeResource(resource), "learning_resource_updated");
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req, res, next) => {
  try {
    const resource = await LearningResourceModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "archived", updated_by: adminId(req) } },
      { new: true }
    );
    if (!resource) return fail(res, "resource_not_found", 404);
    return ok(res, serializeResource(resource), "learning_resource_archived");
  } catch (error) {
    next(error);
  }
};

export const publishResource = async (req, res, next) => {
  try {
    const resource = await LearningResourceModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "published", visibility: req.body.visibility || "public", published_at: new Date(), updated_by: adminId(req) } },
      { new: true }
    );
    if (!resource) return fail(res, "resource_not_found", 404);
    return ok(res, serializeResource(resource), "learning_resource_published");
  } catch (error) {
    next(error);
  }
};

export const archiveResource = async (req, res, next) => {
  req.body = { ...req.body, status: "archived" };
  return deleteResource(req, res, next);
};

const normalizeCategoryPayload = (body = {}) => ({
  key: cleanText(body.key).toLowerCase(),
  slug: cleanText(body.slug || body.key).toLowerCase(),
  title: body.title || { en: cleanText(body.title_en || body.title || body.key), ar: cleanText(body.title_ar) },
  description: body.description || { en: cleanText(body.description_en || body.description), ar: cleanText(body.description_ar) },
  icon: cleanText(body.icon),
  sort_order: Number(body.sort_order || 0),
  status: ["active", "archived"].includes(body.status) ? body.status : "active",
});

export const listCategories = async (req, res, next) => {
  try {
    const categories = await LearningResourceCategoryModel.find({ status: { $ne: "archived" } }).sort({ sort_order: 1, key: 1 }).lean();
    return ok(res, categories, "learning_resource_categories");
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await LearningResourceCategoryModel.create(normalizeCategoryPayload(req.body));
    return ok(res, category, "learning_resource_category_created", 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await LearningResourceCategoryModel.findByIdAndUpdate(
      req.params.id,
      { $set: normalizeCategoryPayload(req.body) },
      { new: true }
    );
    if (!category) return fail(res, "category_not_found", 404);
    return ok(res, category, "learning_resource_category_updated");
  } catch (error) {
    next(error);
  }
};

export default {
  archiveResource,
  createCategory,
  createResource,
  deleteResource,
  getResource,
  listCategories,
  listResources,
  publishResource,
  updateCategory,
  updateResource,
};
