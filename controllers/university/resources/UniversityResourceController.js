import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  LearningResourceModel,
  UniversityResourceAssignmentModel,
  UserResourceProgressModel,
} from "../../../models/index.js";
import {
  parsePagination,
  resourceSearchFilter,
  serializeResource,
} from "../../../services/resources/learningResource.service.js";

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const actorId = (req) => req.user?._id || req.auth?.userId || null;

const scopedUniversityId = (req) => {
  const active = req.activeContext || {};
  if (active.context_type === "university_admin" && isObjectId(active.entity_id)) return active.entity_id;
  if (isObjectId(req.query.university_id)) return req.query.university_id;
  if (isObjectId(req.body?.university_id)) return req.body.university_id;
  return null;
};

const requireUniversityId = (req, res) => {
  const universityId = scopedUniversityId(req);
  if (!universityId) {
    ReturnAppData.getError({ res, status: 403, message: "university_admin_context_required" });
    return null;
  }
  return universityId;
};

const normalizePayload = (body = {}, universityId, userId) => ({
  key: cleanText(body.key).toLowerCase() || undefined,
  slug: cleanText(body.slug).toLowerCase() || undefined,
  type: cleanText(body.type) || "article",
  audience: Array.isArray(body.audience) && body.audience.length ? body.audience : ["students"],
  title: body.title || { en: cleanText(body.title_en || body.title) },
  summary: body.summary || { en: cleanText(body.summary_en || body.summary) },
  body: body.body || { en: cleanText(body.body_en || body.content) },
  category_ids: Array.isArray(body.category_ids) ? body.category_ids.filter(isObjectId) : [],
  tags: Array.isArray(body.tags) ? body.tags.map(cleanText).filter(Boolean) : cleanText(body.tags).split(/[,;]+/).map(cleanText).filter(Boolean),
  language: ["ar", "en", "both"].includes(body.language) ? body.language : "both",
  media_url: cleanText(body.media_url),
  file_url: cleanText(body.file_url),
  cover_image: cleanText(body.cover_image),
  estimated_minutes: Math.max(1, Number(body.estimated_minutes || 5)),
  difficulty: ["beginner", "intermediate", "advanced"].includes(body.difficulty) ? body.difficulty : "beginner",
  source_type: "university",
  university_id: universityId,
  visibility: ["public", "students", "university_private", "draft"].includes(body.visibility) ? body.visibility : "university_private",
  status: ["draft", "published", "archived"].includes(body.status) ? body.status : "draft",
  featured: Boolean(body.featured),
  sort_order: Number(body.sort_order || 0),
  updated_by: userId,
});

export const listUniversityResources = async (req, res, next) => {
  try {
    const universityId = requireUniversityId(req, res);
    if (!universityId) return;
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {
      university_id: universityId,
      status: { $ne: "archived" },
      ...resourceSearchFilter(req.query),
    };
    const [resources, total] = await Promise.all([
      LearningResourceModel.find(filter).sort({ sort_order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      LearningResourceModel.countDocuments(filter),
    ]);
    return ReturnAppData.getData({
      res,
      data: resources.map((resource) => serializeResource(resource)),
      other: { pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total } },
    });
  } catch (error) {
    next(error);
  }
};

export const createUniversityResource = async (req, res, next) => {
  try {
    const universityId = requireUniversityId(req, res);
    if (!universityId) return;
    const payload = normalizePayload(req.body, universityId, actorId(req));
    payload.created_by = actorId(req);
    if (payload.status === "published" && !payload.published_at) payload.published_at = new Date();
    const resource = await LearningResourceModel.create(payload);
    return ReturnAppData.createData({ res, data: serializeResource(resource), message: "university_resource_created" });
  } catch (error) {
    next(error);
  }
};

export const updateUniversityResource = async (req, res, next) => {
  try {
    const universityId = requireUniversityId(req, res);
    if (!universityId) return;
    const patch = normalizePayload(req.body, universityId, actorId(req));
    if (patch.status === "published") patch.published_at = new Date();
    const resource = await LearningResourceModel.findOneAndUpdate(
      { _id: req.params.id, university_id: universityId },
      { $set: patch },
      { new: true }
    );
    if (!resource) return ReturnAppData.getError({ res, status: 404, message: "resource_not_found" });
    return ReturnAppData.getData({ res, data: serializeResource(resource), message: "university_resource_updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteUniversityResource = async (req, res, next) => {
  try {
    const universityId = requireUniversityId(req, res);
    if (!universityId) return;
    const resource = await LearningResourceModel.findOneAndUpdate(
      { _id: req.params.id, university_id: universityId },
      { $set: { status: "archived", updated_by: actorId(req) } },
      { new: true }
    );
    if (!resource) return ReturnAppData.getError({ res, status: 404, message: "resource_not_found" });
    return ReturnAppData.getData({ res, data: serializeResource(resource), message: "university_resource_archived" });
  } catch (error) {
    next(error);
  }
};

export const assignUniversityResource = async (req, res, next) => {
  try {
    const universityId = requireUniversityId(req, res);
    if (!universityId) return;
    const resource = await LearningResourceModel.findOne({
      _id: req.params.id,
      $or: [{ university_id: universityId }, { source_type: "platform" }, { visibility: { $in: ["public", "students"] } }],
    }).lean();
    if (!resource) return ReturnAppData.getError({ res, status: 404, message: "resource_not_found" });
    const assignment = await UniversityResourceAssignmentModel.findOneAndUpdate(
      { university_id: universityId, resource_id: resource._id },
      {
        $set: {
          assigned_by: actorId(req),
          audience: Array.isArray(req.body.audience) ? req.body.audience : ["students"],
          required: Boolean(req.body.required),
          due_at: req.body.due_at ? new Date(req.body.due_at) : null,
          note: cleanText(req.body.note),
          status: "active",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return ReturnAppData.getData({ res, data: assignment, message: "university_resource_assigned" });
  } catch (error) {
    next(error);
  }
};

export const universityResourceAnalytics = async (req, res, next) => {
  try {
    const universityId = requireUniversityId(req, res);
    if (!universityId) return;
    const resourceIds = await LearningResourceModel.find({ university_id: universityId }).distinct("_id");
    const [resources, assignments, progress, completed] = await Promise.all([
      LearningResourceModel.countDocuments({ university_id: universityId, status: { $ne: "archived" } }),
      UniversityResourceAssignmentModel.countDocuments({ university_id: universityId, status: "active" }),
      UserResourceProgressModel.countDocuments({ resource_id: { $in: resourceIds } }),
      UserResourceProgressModel.countDocuments({ resource_id: { $in: resourceIds }, status: "completed" }),
    ]);
    return ReturnAppData.getData({
      res,
      data: {
        resources,
        assignments,
        progress_records: progress,
        completed,
      },
      message: "university_resource_analytics",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  assignUniversityResource,
  createUniversityResource,
  deleteUniversityResource,
  listUniversityResources,
  universityResourceAnalytics,
  updateUniversityResource,
};
