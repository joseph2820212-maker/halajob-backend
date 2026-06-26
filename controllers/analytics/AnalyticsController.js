import mongoose from "mongoose";
import ReturnAppData from "../../helper/ReturnAppData/index.js";
import { AnalyticsEventModel } from "../../models/index.js";
import {
  ANALYTICS_EVENT_GROUPS,
  recordAnalyticsEvent,
} from "../../services/analytics/analyticsEvent.service.js";

const clean = (value = "") => String(value || "").trim();
const toInt = (value, fallback = 20, min = 1, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};
const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const truthy = (value) => ["1", "true", "yes"].includes(clean(value).toLowerCase());
const objectIdOrValue = (value) => {
  const id = clean(value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
};

const reportDateFilter = (query = {}) => {
  const createdAt = {};
  const from = toDate(query.from || query.start_date || query.startDate);
  const to = toDate(query.to || query.end_date || query.endDate);
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  return Object.keys(createdAt).length ? { createdAt } : {};
};

const reportQueryFilter = (query = {}) => {
  const filter = { ...reportDateFilter(query) };
  if (query.group) filter.group = clean(query.group).toLowerCase();
  if (query.event) filter.event = clean(query.event);
  if (query.context_type) filter.context_type = clean(query.context_type);
  if (query.company_id) filter.company_id = objectIdOrValue(query.company_id);
  return filter;
};

const requireAnalyticsReportContext = (req, res) => {
  const activeContext = req.activeContext || {};
  if (activeContext.status && !["active", "pending"].includes(activeContext.status)) {
    ReturnAppData.getError({
      res,
      status: 403,
      message: "active_context_not_available",
      other: { data: { active_context_type: activeContext.context_type, active_context_status: activeContext.status } },
    });
    return null;
  }

  if (activeContext.context_type === "super_admin") {
    return {
      type: "platform",
      activeContext,
      scopeFilter: {},
      dataAccess: "platform",
    };
  }

  if (activeContext.context_type === "university_admin") {
    const universityId = clean(activeContext.entity_id);
    const activeContextId = objectIdOrValue(activeContext.id || activeContext._id);
    return {
      type: "university",
      activeContext,
      universityId,
      scopeFilter: {
        $or: [
          { active_context_id: activeContextId },
          { "metadata.university_id": universityId },
        ],
      },
      dataAccess: "university",
    };
  }

  ReturnAppData.getError({
    res,
    status: 403,
    message: "analytics_admin_context_required",
    other: {
      data: {
        expected_context_type: ["super_admin", "university_admin"],
        active_context_type: activeContext.context_type || "",
      },
    },
  });
  return null;
};

const scopedFilter = (scope, baseFilter) =>
  scope?.scopeFilter && Object.keys(scope.scopeFilter).length
    ? { $and: [baseFilter, scope.scopeFilter] }
    : baseFilter;

const countDistinct = async (filter, field) => {
  const [result] = await AnalyticsEventModel.aggregate([
    { $match: filter },
    { $match: { [field]: { $ne: null } } },
    { $group: { _id: `$${field}` } },
    { $count: "count" },
  ]);
  return result?.count || 0;
};

const groupCount = (filter, groupId, { limit = 25, sort = { count: -1, _id: 1 } } = {}) =>
  AnalyticsEventModel.aggregate([
    { $match: filter },
    { $group: { _id: groupId, count: { $sum: 1 }, users: { $addToSet: "$user_id" } } },
    {
      $project: {
        _id: 1,
        count: 1,
        unique_users: {
          $size: {
            $filter: {
              input: "$users",
              as: "user",
              cond: { $ne: ["$$user", null] },
            },
          },
        },
      },
    },
    { $sort: sort },
    { $limit: limit },
  ]);

const daySeries = (filter, limit = 60) =>
  AnalyticsEventModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: limit },
  ]);

const normalizeBuckets = (items = [], key = "key") =>
  items.map((item) => ({
    [key]: item._id || "",
    count: item.count || 0,
    unique_users: item.unique_users || 0,
  }));

export const track = async (req, res, next) => {
  try {
    const body = req.body || {};
    const event = await recordAnalyticsEvent({
      req,
      event: body.event,
      group: body.group,
      companyId: body.company_id,
      entityType: body.entity_type || "other",
      entityId: body.entity_id,
      jobId: body.job_id,
      applicationId: body.application_id,
      sessionId: body.session_id,
      platform: body.platform,
      appVersion: body.app_version,
      metadata: body.metadata || {},
    });

    return ReturnAppData.createData({
      res,
      data: { id: event._id, event: event.event, group: event.group },
      message: "analytics_event_recorded",
    });
  } catch (error) {
    if (error.statusCode || error.code) {
      return ReturnAppData.getError({
        res,
        status: error.statusCode || 400,
        message: error.code || error.message,
        other: {
          data: {
            supported: error.supported || ANALYTICS_EVENT_GROUPS,
            expected_group: error.expectedGroup,
          },
        },
      });
    }
    next(error);
  }
};

export const listMine = async (req, res, next) => {
  try {
    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 20, 1, 100);
    const skip = (page - 1) * limit;
    const filter = { user_id: req.user?._id };
    if (req.query.group) filter.group = clean(req.query.group).toLowerCase();
    if (req.query.event) filter.event = clean(req.query.event);

    const [items, total] = await Promise.all([
      AnalyticsEventModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      AnalyticsEventModel.countDocuments(filter),
    ]);

    return ReturnAppData.getData({
      res,
      data: items,
      other: {
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_more: skip + items.length < total,
        },
      },
      message: "analytics_events",
    });
  } catch (error) {
    next(error);
  }
};

export const adminSummary = async (req, res, next) => {
  try {
    const scope = requireAnalyticsReportContext(req, res);
    if (!scope) return;

    const filter = scopedFilter(scope, reportQueryFilter(req.query || {}));
    const seriesLimit = toInt(req.query.days || req.query.limit_days, 30, 1, 180);

    const [
      totalEvents,
      uniqueUsers,
      uniqueCompanies,
      byGroup,
      byEvent,
      byContextType,
      byDay,
    ] = await Promise.all([
      AnalyticsEventModel.countDocuments(filter),
      countDistinct(filter, "user_id"),
      countDistinct(filter, "company_id"),
      groupCount(filter, "$group", { limit: 20 }),
      groupCount(filter, "$event", { limit: toInt(req.query.event_limit, 25, 1, 100) }),
      groupCount(filter, "$context_type", { limit: 20 }),
      daySeries(filter, seriesLimit),
    ]);

    return ReturnAppData.getData({
      res,
      data: {
        scope: {
          type: scope.type,
          data_access: scope.dataAccess,
          active_context_type: scope.activeContext.context_type,
          university_id: scope.universityId || null,
        },
        totals: {
          events: totalEvents,
          unique_users: uniqueUsers,
          unique_companies: uniqueCompanies,
        },
        by_group: normalizeBuckets(byGroup, "group"),
        by_event: normalizeBuckets(byEvent, "event"),
        by_context_type: normalizeBuckets(byContextType, "context_type"),
        daily: byDay.map((item) => ({ date: item._id, count: item.count || 0 })),
      },
      message: "analytics_admin_summary",
    });
  } catch (error) {
    next(error);
  }
};

export const adminCohorts = async (req, res, next) => {
  try {
    const scope = requireAnalyticsReportContext(req, res);
    if (!scope) return;

    const filter = scopedFilter(scope, reportQueryFilter(req.query || {}));
    const limit = toInt(req.query.limit, 50, 1, 200);

    const [contextGroup, contextEvent, platform, appVersion] = await Promise.all([
      AnalyticsEventModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { context_type: "$context_type", group: "$group" },
            count: { $sum: 1 },
            users: { $addToSet: "$user_id" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),
      AnalyticsEventModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { context_type: "$context_type", event: "$event" },
            count: { $sum: 1 },
            users: { $addToSet: "$user_id" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),
      groupCount(filter, "$platform", { limit: 20 }),
      groupCount(filter, "$app_version", { limit: 20 }),
    ]);
    const includeEmptyValues = truthy(req.query.include_empty_values);
    const platformBuckets = normalizeBuckets(platform, "platform").filter((item) => includeEmptyValues || item.platform);
    const appVersionBuckets = normalizeBuckets(appVersion, "app_version").filter((item) => includeEmptyValues || item.app_version);

    const formatNested = (items = [], keys = []) =>
      items.map((item) => ({
        ...keys.reduce((acc, key) => ({ ...acc, [key]: item._id?.[key] || "" }), {}),
        count: item.count || 0,
        unique_users: (item.users || []).filter(Boolean).length,
      }));

    return ReturnAppData.getData({
      res,
      data: {
        scope: {
          type: scope.type,
          data_access: scope.dataAccess,
          active_context_type: scope.activeContext.context_type,
          university_id: scope.universityId || null,
        },
        by_context_group: formatNested(contextGroup, ["context_type", "group"]),
        by_context_event: formatNested(contextEvent, ["context_type", "event"]),
        by_platform: platformBuckets,
        by_app_version: appVersionBuckets,
        include_empty_values: includeEmptyValues,
      },
      message: "analytics_admin_cohorts",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  track,
  listMine,
  adminSummary,
  adminCohorts,
};
