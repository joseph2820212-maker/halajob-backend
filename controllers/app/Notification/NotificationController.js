import mongoose from "mongoose";
import { NotificationModel } from "../../../models/index.js";

const toInt = (value, fallback, { min = 1, max = 100 } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const isValidObjectId = (value) => mongoose.isValidObjectId(String(value || ""));

const normalizeNotification = (item = {}) => {
  const data = item.data && typeof item.data === "object" ? item.data : {};
  const targetUrl = item.target_url || item.url || data.target_url || data.url || data.deeplink || "";
  const routePath = item.route_path || data.route_path || "";
  const routeKey = item.route_key || item.screen || data.route_key || "";
  const audience = item.audience || data.audience || "unknown";

  return {
    id: item._id,
    _id: item._id,
    title: item.title || "",
    body: item.body || "",
    imageUrl: item.imageUrl || null,
    read: Boolean(item.read),
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

const getUserId = (req) => req.user?._id || req.user?.id;

const list = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const page = toInt(req.query.page, 1, { min: 1, max: 100000 });
    const limit = toInt(req.query.limit, 20, { min: 1, max: 100 });
    const skip = (page - 1) * limit;

    const filter = { user_id: userId };
    if (req.query.read === "true") filter.read = true;
    if (req.query.read === "false") filter.read = false;
    if (req.query.type) filter.type = String(req.query.type).trim();

    const [items, total, unread_count] = await Promise.all([
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
        unread_count,
        pages: Math.ceil(total / limit),
        has_more: skip + items.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

const unreadCount = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const unread_count = await NotificationModel.countDocuments({ user_id: userId, read: false });
    return res.json({ status: true, message: "unread_notifications", data: { unread_count } });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ status: false, message: "invalid_notification_id" });
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

const markUnread = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ status: false, message: "invalid_notification_id" });
    }

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

const markAllRead = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await NotificationModel.updateMany(
      { user_id: userId, read: false },
      { $set: { read: true } }
    );

    return res.json({
      status: true,
      message: "notifications_marked_read",
      data: { modified_count: result.modifiedCount || 0 },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ status: false, message: "invalid_notification_id" });
    }

    const item = await NotificationModel.findOneAndDelete({ _id: id, user_id: userId }).lean();
    if (!item) return res.status(404).json({ status: false, message: "notification_not_found" });
    return res.json({ status: true, message: "notification_deleted", data: { id } });
  } catch (error) {
    next(error);
  }
};

export default {
  list,
  unreadCount,
  markRead,
  markUnread,
  markAllRead,
  remove,
};
