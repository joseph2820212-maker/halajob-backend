import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { JobAlertLogModel, SavedSearchModel } from "../../../models/index.js";
import {
  migrateEmployeeJobAlertsForUser,
  normalizeChannels,
  normalizeFilters,
  resolveEmployeeForUser,
  runSavedSearchAlertsForSearch,
  savedSearchFilterForUser,
  serializeAlertLog,
  serializeSavedSearch,
} from "../../../services/jobAlerts/savedSearch.service.js";

const { Types } = mongoose;

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const userIdOf = (req) => req.user?._id || req.auth?.user_id || req.auth?.userId || null;

const filterKeys = [
  "keyword",
  "q",
  "search",
  "city",
  "country",
  "category",
  "job_type_id",
  "work_mode_id",
  "experience_level_id",
  "salary_min",
  "salary_max",
  "currency_code",
  "is_remote",
  "is_for_students",
  "is_for_fresh_graduates",
  "company_id",
];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
const hasProvided = (object, key) => hasOwn(object, key) && object[key] !== undefined;

const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const scopeFromRequest = (req) => {
  if (String(req.originalUrl || "").includes("/campus/saved-searches")) return "campus";
  if (req.activeContext?.context_type === "student") return "campus";
  const requested = cleanText(req.body?.scope || req.query?.scope).toLowerCase();
  return requested === "campus" ? "campus" : "seeker";
};

const filterInputFromBody = (body = {}, base = {}) => {
  const input = { ...(base || {}) };
  if (body.filters && typeof body.filters === "object" && !Array.isArray(body.filters)) {
    for (const [key, value] of Object.entries(body.filters)) {
      if (value !== undefined) input[key] = value;
    }
  }
  for (const key of filterKeys) {
    if (hasProvided(body, key)) input[key] = body[key];
  }
  return input;
};

const hasActiveFilter = (filters = {}) =>
  Boolean(
    cleanText(filters.keyword) ||
      cleanText(filters.city) ||
      cleanText(filters.country) ||
      cleanText(filters.category) ||
      filters.job_type_id ||
      filters.work_mode_id ||
      filters.experience_level_id ||
      filters.company_id ||
      filters.salary_min !== null ||
      filters.salary_max !== null ||
      cleanText(filters.currency_code) ||
      filters.is_remote !== null ||
      filters.is_for_students !== null ||
      filters.is_for_fresh_graduates !== null,
  );

const defaultNameForFilters = (filters = {}) =>
  cleanText(filters.keyword) ||
  cleanText(filters.category) ||
  cleanText(filters.city) ||
  cleanText(filters.country) ||
  "Saved job search";

const baseFilterForRequest = (req) => ({
  ...savedSearchFilterForUser(userIdOf(req)),
});

const findOwnedSearch = (req, id) => {
  if (!isObjectId(id)) return null;
  return SavedSearchModel.findOne({
    ...baseFilterForRequest(req),
    _id: new Types.ObjectId(String(id)),
  });
};

export const listSavedSearches = async (req, res, next) => {
  try {
    const userId = userIdOf(req);
    const { page, limit, skip } = parsePagination(req.query);
    const scope = scopeFromRequest(req);
    const employee = await resolveEmployeeForUser(userId);
    const migration = await migrateEmployeeJobAlertsForUser({ userId, employee, scope });
    const filter = baseFilterForRequest(req);

    if (req.query.scope) filter.scope = scope;
    if (req.query.frequency) filter.frequency = req.query.frequency;
    if (req.query.status === "active") filter.is_active = true;
    if (req.query.status === "inactive") filter.is_active = false;
    if (req.query.q || req.query.search) {
      const regex = new RegExp(cleanText(req.query.q || req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { "filters.keyword": regex }, { "filters.city": regex }, { "filters.country": regex }];
    }

    const [items, total] = await Promise.all([
      SavedSearchModel.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      SavedSearchModel.countDocuments(filter),
    ]);

    return ReturnAppData.getData({
      res,
      data: items.map(serializeSavedSearch),
      other: {
        pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total },
        migrated: migration.migrated,
      },
      message: "saved_searches",
    });
  } catch (error) {
    next(error);
  }
};

export const createSavedSearch = async (req, res, next) => {
  try {
    const userId = userIdOf(req);
    const employee = await resolveEmployeeForUser(userId);
    const filters = normalizeFilters(filterInputFromBody(req.body));

    if (!hasActiveFilter(filters)) {
      return ReturnAppData.getError({ res, status: 400, message: "saved_search_filter_required" });
    }

    const search = await SavedSearchModel.create({
      user_id: userId,
      employee_id: employee?._id || null,
      name: cleanText(req.body.name) || defaultNameForFilters(filters),
      scope: scopeFromRequest(req),
      filters,
      frequency: cleanText(req.body.frequency) || "daily",
      channels: normalizeChannels(req.body.channels || req.body),
      is_active: req.body.is_active === false ? false : true,
      created_from: cleanText(req.body.created_from) || "search",
    });

    return ReturnAppData.createData({
      res,
      data: serializeSavedSearch(search.toObject()),
      message: "saved_search_created",
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedSearch = async (req, res, next) => {
  try {
    const search = await findOwnedSearch(req, req.params.id)?.lean();
    if (!search) {
      return ReturnAppData.getError({ res, status: 404, message: "saved_search_not_found" });
    }
    return ReturnAppData.getData({ res, data: serializeSavedSearch(search), message: "saved_search" });
  } catch (error) {
    next(error);
  }
};

export const updateSavedSearch = async (req, res, next) => {
  try {
    const search = await findOwnedSearch(req, req.params.id);
    if (!search) {
      return ReturnAppData.getError({ res, status: 404, message: "saved_search_not_found" });
    }

    const patch = {};
    if (hasProvided(req.body, "name")) patch.name = cleanText(req.body.name);
    if (hasProvided(req.body, "scope")) patch.scope = scopeFromRequest(req);
    if (hasProvided(req.body, "frequency")) patch.frequency = cleanText(req.body.frequency);
    if (hasProvided(req.body, "is_active")) patch.is_active = req.body.is_active !== false;
    if (hasProvided(req.body, "channels")) {
      patch.channels = normalizeChannels({
        ...(search.channels?.toObject?.() || search.channels || {}),
        ...req.body.channels,
      });
    }
    const hasFilterPatch =
      hasProvided(req.body, "filters") || filterKeys.some((key) => hasProvided(req.body, key));
    if (hasFilterPatch) {
      const currentFilters = search.filters?.toObject?.() || search.filters || {};
      patch.filters = normalizeFilters(filterInputFromBody(req.body, currentFilters));
      if (!hasActiveFilter(patch.filters)) {
        return ReturnAppData.getError({ res, status: 400, message: "saved_search_filter_required" });
      }
    }

    const updated = await SavedSearchModel.findOneAndUpdate(
      { _id: search._id, user_id: userIdOf(req) },
      { $set: patch },
      { new: true },
    ).lean();

    return ReturnAppData.updateData({
      res,
      data: serializeSavedSearch(updated),
      message: "saved_search_updated",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedSearch = async (req, res, next) => {
  try {
    const search = await findOwnedSearch(req, req.params.id)?.lean();
    if (!search) {
      return ReturnAppData.getError({ res, status: 404, message: "saved_search_not_found" });
    }
    await SavedSearchModel.deleteOne({ _id: search._id, user_id: userIdOf(req) });
    return ReturnAppData.deleteData({ res, message: "saved_search_deleted" });
  } catch (error) {
    next(error);
  }
};

export const runSavedSearchNow = async (req, res, next) => {
  try {
    const search = await findOwnedSearch(req, req.params.id)?.lean();
    if (!search) {
      return ReturnAppData.getError({ res, status: 404, message: "saved_search_not_found" });
    }
    const result = await runSavedSearchAlertsForSearch(search, {
      limit: Math.min(50, Math.max(1, Number.parseInt(req.body.limit || req.query.limit, 10) || 20)),
      since: null,
    });
    const updated = await SavedSearchModel.findById(search._id).lean();
    return ReturnAppData.getData({
      res,
      data: {
        saved_search: serializeSavedSearch(updated || search),
        result,
      },
      message: "saved_search_run_complete",
    });
  } catch (error) {
    next(error);
  }
};

export const listAlertLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { user_id: userIdOf(req) };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.saved_search_id) {
      const savedSearch = await findOwnedSearch(req, req.query.saved_search_id)?.lean();
      if (!savedSearch) {
        return ReturnAppData.getError({ res, status: 404, message: "saved_search_not_found" });
      }
      filter.saved_search_id = savedSearch._id;
    }
    const [items, total] = await Promise.all([
      JobAlertLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobAlertLogModel.countDocuments(filter),
    ]);
    return ReturnAppData.getData({
      res,
      data: items.map(serializeAlertLog),
      other: {
        pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total },
      },
      message: "job_alert_logs",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createSavedSearch,
  deleteSavedSearch,
  getSavedSearch,
  listAlertLogs,
  listSavedSearches,
  runSavedSearchNow,
  updateSavedSearch,
};
