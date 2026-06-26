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

export default {
  track,
  listMine,
};
