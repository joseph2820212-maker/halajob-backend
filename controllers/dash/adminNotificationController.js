import mongoose from "mongoose";
import { UserModel } from "../../models/index.js";
import { notifyUser } from "../../notification/notificationService.js";
import { writeAuditLog } from "../../services/auditLog.service.js";

const MAX_ADMIN_NOTIFICATION_RECIPIENTS = 500;

const clean = (value = "") => String(value || "").trim();

const objectIdOrNull = (value) => {
  const id = clean(value?._id || value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const parseBool = (value, fallback) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = clean(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const parseRecipientIds = (body = {}) => {
  const raw = body.user_ids || body.users || body.recipients || body.user_id || body.recipient_id || [];
  const list = Array.isArray(raw) ? raw : [raw];
  return [...new Set(list.map((value) => clean(value?._id || value)).filter(Boolean))];
};

const normalizeRouteParams = (value = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((acc, [key, nestedValue]) => {
    if (nestedValue === undefined || nestedValue === null) return acc;
    acc[key] = clean(nestedValue);
    return acc;
  }, {});
};

const normalizeData = (value = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value));
};

export const sendNotification = async (req, res, next) => {
  try {
    const recipientIds = parseRecipientIds(req.body || {});
    if (!recipientIds.length) {
      return res.status(400).json({ status: false, message: "notification_recipients_required" });
    }

    if (recipientIds.length > MAX_ADMIN_NOTIFICATION_RECIPIENTS) {
      return res.status(413).json({
        status: false,
        message: "too_many_notification_recipients",
        max_recipients: MAX_ADMIN_NOTIFICATION_RECIPIENTS,
      });
    }

    const validObjectIds = recipientIds.map(objectIdOrNull).filter(Boolean);
    if (validObjectIds.length !== recipientIds.length) {
      return res.status(400).json({ status: false, message: "invalid_notification_recipient_id" });
    }

    const requestedEventKey = clean(req.body.event_key || req.body.event);
    const title = clean(req.body.title);
    const body = clean(req.body.body || req.body.message);
    if (!requestedEventKey && (!title || !body)) {
      return res.status(400).json({ status: false, message: "notification_content_required" });
    }
    const eventKey = requestedEventKey || "admin_notification";

    const recipients = await UserModel.find({ _id: { $in: validObjectIds }, status: true })
      .select("_id email first_name last_name")
      .lean();

    if (!recipients.length) {
      return res.status(404).json({ status: false, message: "notification_recipients_not_found" });
    }

    const recipientSet = new Set(recipients.map((user) => String(user._id)));
    const missingRecipientIds = recipientIds.filter((id) => !recipientSet.has(String(id)));
    const audience = clean(req.body.audience || "employee") || "employee";
    const routeKey = clean(req.body.route_key || req.body.screen || "dashboard") || "dashboard";
    const routeParams = normalizeRouteParams(req.body.route_params || req.body.routeParams || {});
    const data = normalizeData(req.body.data || {});
    const save = parseBool(req.body.save, true);
    const push = parseBool(req.body.push, true);
    const dedupeKey = clean(req.body.dedupe_key || req.body.dedupeKey);

    const results = [];
    for (const recipient of recipients) {
      const result = await notifyUser({
        userId: recipient._id,
        eventKey,
        audience,
        routeKey,
        routeParams,
        title,
        body,
        params: normalizeData(req.body.params || {}),
        data: {
          ...data,
          admin_sent: "true",
          admin_user_id: clean(req.admin?._id || req.user?._id),
        },
        dedupeKey: dedupeKey || null,
        save,
        push,
      });

      results.push({
        user_id: recipient._id,
        saved: result.saved || null,
        success: result.success || 0,
        failure: result.failure || 0,
        revoked: result.revoked || 0,
        note: result.note || "",
        preference_category: result.preference_category || "",
      });
    }

    const summary = {
      requested_count: recipientIds.length,
      recipient_count: recipients.length,
      missing_recipient_ids: missingRecipientIds,
      saved_count: results.filter((item) => item.saved).length,
      push_success_count: results.reduce((sum, item) => sum + item.success, 0),
      push_failure_count: results.reduce((sum, item) => sum + item.failure, 0),
      push_revoked_count: results.reduce((sum, item) => sum + item.revoked, 0),
      preference_blocked_count: results.filter((item) => item.note.includes("disabled")).length,
    };

    await writeAuditLog({
      req,
      actorUserId: req.admin?._id || req.user?._id,
      actorType: "admin",
      action: "admin_notification_sent",
      entityType: "notification",
      newValue: summary,
      note: "Dashboard admin sent notifications",
      metadata: {
        event_key: eventKey,
        audience,
        route_key: routeKey,
        save,
        push,
      },
    });

    return res.status(200).json({
      status: true,
      message: "admin_notification_sent",
      data: {
        summary,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  sendNotification,
};
