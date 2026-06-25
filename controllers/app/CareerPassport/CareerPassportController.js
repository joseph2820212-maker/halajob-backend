import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  getCareerPassport,
  refreshCareerPassportScore,
  updateCareerPassport,
  updateCareerPassportShare,
} from "../../../services/careerPassport.service.js";

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

const update = async (req, res, next) => {
  try {
    const result = await updateCareerPassport({ user: req.user, body: req.body || {}, req });
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
    return ReturnAppData.createData({
      res,
      data: {
        passport_id: result.passport._id,
        passport: result.snapshot,
        score: result.passport.score,
        ai_status: {
          generated_by_ai: false,
          source: "rule_based_v1",
          message: "Backend rule-based score refreshed. Provider AI is not enabled for this module yet.",
        },
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
    return ReturnAppData.updateData({
      res,
      data: {
        passport_id: result.passport._id,
        passport: result.snapshot,
        share: result.passport.share,
      },
      message: result.passport.share?.enabled ? "career_passport_share_enabled" : "career_passport_share_revoked",
    });
  } catch (error) {
    return next(error);
  }
};

export default { get, update, refreshScore, share };
