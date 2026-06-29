import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  LearningResourceModel,
  UserResourceProgressModel,
} from "../../../models/index.js";
import {
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
} from "../../../services/resources/learningResource.service.js";

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const lang = (req) => (String(req.get("lan") || req.query.lang || "en").toLowerCase().startsWith("ar") ? "ar" : "en");

const resourceNotFound = (res) =>
  ReturnAppData.getError({ res, status: 404, message: "resource_not_found" });

const resolveUserResourceContext = async (req) => {
  const userId = req.user?._id || req.auth?.user_id || req.auth?.userId || null;
  const employee = await resolveStudentProfile(userId);
  return {
    userId,
    employee,
    universityId: universityIdFromEmployee(employee),
  };
};

export const listResources = async (req, res, next) => {
  try {
    const { userId, universityId } = await resolveUserResourceContext(req);
    const { page, limit, skip } = parsePagination(req.query);
    const filter = mergeResourceFilters(
      visibleResourceFilter({ universityId }),
      resourceAudienceFilter(req.query.audience || "students"),
      resourceSearchFilter(req.query),
    );
    const [resources, total] = await Promise.all([
      LearningResourceModel.find(filter)
        .sort({ featured: -1, sort_order: 1, published_at: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LearningResourceModel.countDocuments(filter),
    ]);
    const withProgress = await attachProgress({ resources, userId });
    return ReturnAppData.getData({
      res,
      data: withProgress.map((resource) => serializeResource(resource, { lang: lang(req) })),
      other: { pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total } },
    });
  } catch (error) {
    next(error);
  }
};

export const getResource = async (req, res, next) => {
  try {
    const { userId, universityId } = await resolveUserResourceContext(req);
    const resource = await findVisibleResource({
      idOrSlug: req.params.idOrSlug,
      userId,
      universityId,
    });
    if (!resource) return resourceNotFound(res);
    if (userId && isObjectId(resource._id)) {
      await upsertProgress({ userId, resourceId: resource._id, patch: {} });
    }
    return ReturnAppData.getData({
      res,
      data: serializeResource(resource, { lang: lang(req) }),
    });
  } catch (error) {
    next(error);
  }
};

const resolveProgressResource = async (req, res) => {
  const { userId, universityId } = await resolveUserResourceContext(req);
  const resource = await findVisibleResource({
    idOrSlug: req.params.id,
    userId,
    universityId,
  });
  if (!resource) {
    resourceNotFound(res);
    return null;
  }
  return { userId, resource };
};

export const saveResource = async (req, res, next) => {
  try {
    const context = await resolveProgressResource(req, res);
    if (!context) return;
    const progress = await upsertProgress({
      userId: context.userId,
      resourceId: context.resource._id,
      patch: { saved: true },
    });
    return ReturnAppData.getData({ res, data: progress, message: "resource_saved" });
  } catch (error) {
    next(error);
  }
};

export const unsaveResource = async (req, res, next) => {
  try {
    const context = await resolveProgressResource(req, res);
    if (!context) return;
    const progress = await upsertProgress({
      userId: context.userId,
      resourceId: context.resource._id,
      patch: { saved: false },
    });
    return ReturnAppData.getData({ res, data: progress, message: "resource_unsaved" });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const context = await resolveProgressResource(req, res);
    if (!context) return;
    const percent = Math.min(100, Math.max(0, Number(req.body.progress_percent ?? req.body.progress ?? 0)));
    const status = cleanText(req.body.status) || (percent >= 100 ? "completed" : percent > 0 ? "in_progress" : "not_started");
    const progress = await upsertProgress({
      userId: context.userId,
      resourceId: context.resource._id,
      patch: {
        progress_percent: percent,
        status,
        completed_at: status === "completed" || percent >= 100 ? new Date() : null,
      },
    });
    return ReturnAppData.getData({ res, data: progress, message: "resource_progress_updated" });
  } catch (error) {
    next(error);
  }
};

export const completeResource = async (req, res, next) => {
  try {
    const context = await resolveProgressResource(req, res);
    if (!context) return;
    const progress = await upsertProgress({
      userId: context.userId,
      resourceId: context.resource._id,
      patch: {
        progress_percent: 100,
        status: "completed",
        completed_at: new Date(),
      },
    });
    return ReturnAppData.getData({ res, data: progress, message: "resource_completed" });
  } catch (error) {
    next(error);
  }
};

export const myProgress = async (req, res, next) => {
  try {
    const { userId } = await resolveUserResourceContext(req);
    const rows = await UserResourceProgressModel.find({ user_id: userId })
      .populate("resource_id")
      .sort({ updatedAt: -1 })
      .lean();
    return ReturnAppData.getData({
      res,
      data: rows.map((row) => ({
        ...row,
        resource: row.resource_id ? serializeResource(row.resource_id, { lang: lang(req) }) : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const recommendedResources = async (req, res, next) => {
  try {
    const { userId, employee, universityId } = await resolveUserResourceContext(req);
    const resources = await buildResourceRecommendations({
      userId,
      employee,
      universityId,
      limit: Math.min(50, Math.max(1, Number(req.query.limit || 12))),
    });
    return ReturnAppData.getData({
      res,
      data: resources.map((resource) => serializeResource(resource, { lang: lang(req) })),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  completeResource,
  getResource,
  listResources,
  myProgress,
  recommendedResources,
  saveResource,
  unsaveResource,
  updateProgress,
};
