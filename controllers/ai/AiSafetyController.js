import ReturnAppData from "../../helper/ReturnAppData/index.js";
import { handleSafeAiRequest } from "../../services/ai/aiSafety.service.js";
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

const AI_ANALYTICS_EVENTS = Object.freeze({
  "career_copilot": "ai_copilot_used",
  "profile_score": "ai_score_generated",
  "cv_rewrite": "ai_cv_rewritten",
  "job_match_explanation": "ai_job_match_viewed",
  "job_cover_letter": "ai_cover_letter_generated",
  "interview_practice": "ai_interview_practiced",
  "company_job_generate": "ai_job_draft_generated",
  "company_shortlist": "ai_shortlist_generated",
  "company_message_generate": "ai_hiring_message_generated",
  "translate_job": "ai_job_translation_generated",
  "translate_cv": "ai_cv_translation_generated",
});

const respond = (res, result) => {
  const response = {
    res,
    status: result.httpStatus,
    message: result.message,
    other: { data: result.payload },
  };

  return result.success
    ? ReturnAppData.getData({ ...response, data: result.payload })
    : ReturnAppData.getError(response);
};

const recordAiOutcomeAnalytics = ({ req, feature, result, jobId = null }) => {
  const event = AI_ANALYTICS_EVENTS[feature];
  const aiStatus = result?.payload?.ai_status || {};
  const wasCompletedOutput = result?.success === true && ["completed", "cached"].includes(aiStatus.status);
  if (!event || !wasCompletedOutput) return;

  recordAnalyticsEvent({
    req,
    event,
    userId: req.user?._id,
    companyId: req.appAccount?.company?._id || null,
    activeContext: req.activeContext,
    entityType: "ai_request",
    entityId: aiStatus.request_id,
    jobId,
    metadata: {
      feature,
      status: aiStatus.status,
      reason: aiStatus.reason,
      cached: aiStatus.cached === true,
      source: "ai_safe_controller",
    },
  }).catch(() => null);
};

const featureHandler = (feature, options = {}) => async (req, res, next) => {
  try {
    const jobId = options.jobIdParam ? req.params?.[options.jobIdParam] : null;
    const result = await handleSafeAiRequest({
      req,
      feature,
      jobId,
    });
    recordAiOutcomeAnalytics({ req, feature, result, jobId });
    return respond(res, result);
  } catch (error) {
    next(error);
  }
};

export const careerCopilot = featureHandler("career_copilot");
export const profileScore = featureHandler("profile_score");
export const cvRewrite = featureHandler("cv_rewrite");
export const jobMatch = featureHandler("job_match_explanation", { jobIdParam: "jobId" });
export const coverLetter = featureHandler("job_cover_letter", { jobIdParam: "jobId" });
export const interviewPractice = featureHandler("interview_practice");
export const companyJobGenerate = featureHandler("company_job_generate");
export const companyShortlist = featureHandler("company_shortlist", { jobIdParam: "jobId" });
export const companyMessageGenerate = featureHandler("company_message_generate");
export const translateJob = featureHandler("translate_job", { jobIdParam: "jobId" });
export const translateCv = featureHandler("translate_cv");

export default {
  careerCopilot,
  profileScore,
  cvRewrite,
  jobMatch,
  coverLetter,
  interviewPractice,
  companyJobGenerate,
  companyShortlist,
  companyMessageGenerate,
  translateJob,
  translateCv,
};
