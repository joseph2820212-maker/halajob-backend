import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  getAccountPermissions,
  setActiveAccountContext,
  syncAccountContextsForUser,
} from "../../../services/accountContext.service.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";

const getContextId = (body = {}) => body.context_id || body.contextId || body.active_context_id || body.activeContextId;

const listContexts = async (req, res, next) => {
  try {
    const result = await syncAccountContextsForUser(req.user);
    return ReturnAppData.getData({
      res,
      data: {
        contexts: result.contexts,
        active_context: result.activeContext,
        permissions: result.activeContext?.permissions || [],
      },
      message: "account_contexts",
    });
  } catch (error) {
    return next(error);
  }
};

const setActiveContext = async (req, res, next) => {
  try {
    const contextId = getContextId(req.body || {});
    if (!contextId) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: "context_id_required",
      });
    }

    const result = await setActiveAccountContext({
      user: req.user,
      contextId,
      req,
    });
    recordAnalyticsEvent({
      req,
      event: "account_context_switched",
      userId: req.user._id,
      activeContext: result.activeContext,
      entityType: "other",
      entityId: result.activeContext?._id || result.activeContext?.id || null,
      metadata: {
        context_type: result.activeContext?.context_type || "",
        requested_context_id: String(contextId || ""),
      },
    }).catch(() => null);

    return ReturnAppData.updateData({
      res,
      data: {
        contexts: result.contexts,
        active_context: result.activeContext,
        permissions: result.activeContext?.permissions || [],
      },
      message: "active_context_updated",
    });
  } catch (error) {
    if (error?.message === "INVALID_CONTEXT_ID") {
      return ReturnAppData.createError({ res, status: 400, message: "invalid_context_id" });
    }
    if (error?.message === "CONTEXT_NOT_FOUND") {
      return ReturnAppData.createError({ res, status: 404, message: "context_not_found" });
    }
    return next(error);
  }
};

const permissions = async (req, res, next) => {
  try {
    const result = await getAccountPermissions(req.user);
    return ReturnAppData.getData({
      res,
      data: {
        active_context: result.activeContext,
        permissions: result.permissions,
        contexts: result.contexts,
      },
      message: "account_permissions",
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  listContexts,
  setActiveContext,
  permissions,
};
