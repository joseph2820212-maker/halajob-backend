import mongoose from "mongoose";
import { FcmTokenModel, NotificationModel } from "../../../models/index.js";
import FcmTokenController from "../FcmToken/FcmTokenController.js";
import {
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} from "../../../services/notifications/notificationPreference.service.js";

const toObjectId = (value) => {
  const id = String(value || "").trim();
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const userIdFrom = (req) => req.user?._id || req.user?.id;

const normalizeNotification = (item = {}) => {
  const data = item.data && typeof item.data === "object" ? item.data : {};
  const routeKey = item.route_key || item.screen || data.route_key || "";
  const routePath = item.route_path || data.route_path || "";
  const targetUrl = item.target_url || item.url || data.target_url || data.url || data.deeplink || "";
  const audience = item.audience || data.audience || "unknown";

  return {
    id: item._id,
    _id: item._id,
    title: item.title || "",
    body: item.body || "",
    read: Boolean(item.read),
    imageUrl: item.imageUrl || null,
    type: item.type || "notification",
    audience,
    route_key: routeKey,
    route_path: routePath,
    target_url: targetUrl,
    url: targetUrl,
    screen: item.screen || routeKey,
    data: {
      ...data,
      audience,
      route_key: routeKey,
      route_path: routePath,
      target_url: targetUrl,
      url: targetUrl,
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const toInt = (value, fallback, { min = 1, max = 100 } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

export const list = async (req, res, next) => {
  try {
    const userId = userIdFrom(req);
    const page = toInt(req.query.page, 1, { min: 1, max: 100000 });
    const limit = toInt(req.query.limit, 20, { min: 1, max: 100 });
    const skip = (page - 1) * limit;

    const filter = { user_id: userId };
    if (req.query.read === "true") filter.read = true;
    if (req.query.read === "false") filter.read = false;
    if (req.query.type) filter.type = String(req.query.type).trim();

    const [items, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ user_id: userId, read: false }),
    ]);

    return res.json({
      status: true,
      message: "notifications",
      data: items.map(normalizeNotification),
      meta: {
        page,
        limit,
        total,
        unread_count: unreadCount,
        pages: Math.ceil(total / limit),
        has_more: skip + items.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const unreadCount = async (req, res, next) => {
  try {
    const count = await NotificationModel.countDocuments({ user_id: userIdFrom(req), read: false });
    return res.json({ status: true, message: "unread_notifications", data: { unread_count: count } });
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (req, res, next) => {
  try {
    const preferences = await getOrCreateNotificationPreferences(userIdFrom(req));
    return res.json({ status: true, message: "notification_preferences", data: preferences });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await updateNotificationPreferences({
      userId: userIdFrom(req),
      actorUserId: userIdFrom(req),
      body: req.body || {},
    });
    return res.json({ status: true, message: "notification_preferences_updated", data: preferences });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const userId = userIdFrom(req);
    const id = toObjectId(req.params.id || req.body.notification_id || req.body.id || req.query.notification_id || req.query.id);

    if (!id) {
      const result = await NotificationModel.updateMany(
        { user_id: userId, read: false },
        { $set: { read: true } }
      );
      return res.json({
        status: true,
        message: "notifications_marked_read",
        data: { modified_count: result.modifiedCount || 0 },
      });
    }

    const item = await NotificationModel.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!item) return res.status(404).json({ status: false, message: "notification_not_found" });
    return res.json({ status: true, message: "notification_marked_read", data: normalizeNotification(item) });
  } catch (error) {
    next(error);
  }
};

export const markUnread = async (req, res, next) => {
  try {
    const userId = userIdFrom(req);
    const id = toObjectId(req.params.id || req.body.notification_id || req.body.id || req.query.notification_id || req.query.id);
    if (!id) return res.status(400).json({ status: false, message: "invalid_notification_id" });

    const item = await NotificationModel.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: { read: false } },
      { new: true }
    ).lean();

    if (!item) return res.status(404).json({ status: false, message: "notification_not_found" });
    return res.json({ status: true, message: "notification_marked_unread", data: normalizeNotification(item) });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const userId = userIdFrom(req);
    const id = toObjectId(req.params.id || req.body.notification_id || req.body.id || req.query.notification_id || req.query.id);
    if (!id) return res.status(400).json({ status: false, message: "invalid_notification_id" });

    const item = await NotificationModel.findOneAndDelete({ _id: id, user_id: userId }).lean();
    if (!item) return res.status(404).json({ status: false, message: "notification_not_found" });
    return res.json({ status: true, message: "notification_deleted", data: normalizeNotification(item) });
  } catch (error) {
    next(error);
  }
};

export const registerDeviceToken = FcmTokenController.registerToken;

export const deleteDeviceToken = async (req, res, next) => {
  try {
    const userId = userIdFrom(req);
    const id = toObjectId(req.params.id || req.body.id || req.body.token_id || req.query.id || req.query.token_id);
    const token = String(req.body.token || req.query.token || "").trim();
    const deviceId = String(req.body.deviceId || req.body.device_id || req.query.deviceId || req.query.device_id || "").trim();

    const filter = { user: userId };
    const selectors = [];
    if (id) selectors.push({ _id: id });
    if (token) selectors.push({ token });
    if (deviceId) selectors.push({ device_id: deviceId });
    if (!selectors.length) {
      return res.status(400).json({ status: false, message: "device_token_identifier_required" });
    }

    const result = await FcmTokenModel.updateMany(
      { ...filter, $or: selectors },
      { $set: { revoked: true, last_error: "revoked_by_user", last_seen_at: new Date() } }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ status: false, message: "device_token_not_found" });
    }

    return res.json({
      status: true,
      message: "device_token_deleted",
      data: { matched_count: result.matchedCount, modified_count: result.modifiedCount || 0 },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  list,
  unreadCount,
  getPreferences,
  updatePreferences,
  markRead,
  markUnread,
  remove,
  registerDeviceToken,
  deleteDeviceToken,
};
