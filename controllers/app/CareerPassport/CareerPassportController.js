import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  getCareerPassport,
  getSharedCareerPassport,
  refreshCareerPassportScore,
  updateCareerPassport,
  updateCareerPassportShare,
} from "../../../services/careerPassport.service.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";

const sendPassport = ({ res, result, message }) =>
  ReturnAppData.getData({
    res,
    data: {
      passport_id: result.passport._id,
      passport: result.snapshot,
      score: result.passport.score,
      visibility: result.passport.visibility,
      share: result.passport.share,
    },
    message,
  });

const get = async (req, res, next) => {
  try {
    const result = await getCareerPassport({ user: req.user, req });
    return sendPassport({ res, result, message: "career_passport" });
  } catch (error) {
    return next(error);
  }
};

const shared = async (req, res, next) => {
  try {
    const result = await getSharedCareerPassport({
      token: req.params.token,
      viewerType: req.query.viewer || "public",
    });
    return ReturnAppData.getData({
      res,
      data: {
        passport_id: result.passport._id,
        passport: result.snapshot,
        score: result.score,
        visibility: result.visibility,
        share: result.share,
        viewer_type: result.viewerType,
      },
      message: "career_passport_shared",
    });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await updateCareerPassport({ user: req.user, body: req.body || {}, req });
    recordAnalyticsEvent({
      req,
      event: "career_passport_updated",
      userId: req.user?._id,
      activeContext: req.activeContext,
      entityType: "career_passport",
      entityId: result.passport?._id,
      metadata: {
        source: "career_passport_update",
        requested_fields: Object.keys(req.body || {}),
        visibility: result.passport?.visibility || "",
        score: result.passport?.score?.total ?? null,
      },
    }).catch(() => null);
    return ReturnAppData.updateData({
      res,
      data: {
        passport_id: result.passport._id,
        passport: result.snapshot,
        score: result.passport.score,
        visibility: result.passport.visibility,
        share: result.passport.share,
      },
      message: "career_passport_updated",
    });
  } catch (error) {
    return next(error);
  }
};

const refreshScore = async (req, res, next) => {
  try {
    const result = await refreshCareerPassportScore({ user: req.user, req });
    const generatedByAi = result.passport?.score?.generated_by_ai === true;
    const aiStatus = result.aiStatus || {
      generated_by_ai: generatedByAi,
      source: result.passport?.score?.source || "rule_based_v1",
      status: generatedByAi ? "completed" : "fallback",
      reason: generatedByAi ? "provider_result" : "rule_based_fallback",
      request_id: null,
      cached: false,
      message: generatedByAi
        ? "AI-assisted score explanation applied. Review suggestions before acting."
        : "Rule-based score returned because AI explanation is unavailable or disabled.",
    };
    recordAnalyticsEvent({
      req,
      event: "ai_score_generated",
      userId: req.user?._id,
      activeContext: req.activeContext,
      entityType: "career_passport",
      entityId: result.passport?._id,
      metadata: {
        source: "career_passport_score",
        score_source: result.passport?.score?.source || "rule_based_v1",
        generated_by_ai: generatedByAi,
        ai_status: aiStatus.status,
        ai_reason: aiStatus.reason,
        score: result.passport?.score?.total ?? null,
      },
    }).catch(() => null);
    return ReturnAppData.createData({
      res,
      data: {
        passport_id: result.passport._id,
        passport: result.snapshot,
        score: result.passport.score,
        ai_status: aiStatus,
      },
      message: "career_passport_score_refreshed",
    });
  } catch (error) {
    return next(error);
  }
};

const share = async (req, res, next) => {
  try {
    const result = await updateCareerPassportShare({ user: req.user, body: req.body || {}, req });
    const careerPassportShareEvent = result.passport.share?.enabled
      ? "career_passport_share_enabled"
      : "career_passport_share_revoked";
    recordAnalyticsEvent({
      req,
      event: careerPassportShareEvent,
      userId: req.user?._id,
      activeContext: req.activeContext,
      entityType: "career_passport",
      entityId: result.passport?._id,
      metadata: {
        source: "career_passport_share",
        share_enabled: result.passport.share?.enabled === true,
        has_expiry: Boolean(result.passport.share?.expires_at),
      },
    }).catch(() => null);
    return ReturnAppData.updateData({
      res,
      data: {
        passport_id: result.passport._id,
        passport: result.snapshot,
        share: result.passport.share,
      },
      message: careerPassportShareEvent,
    });
  } catch (error) {
    return next(error);
  }
};

export default { get, shared, update, refreshScore, share };
