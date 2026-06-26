import ReturnAppData from "../../helper/ReturnAppData/index.js";
import { handleSafeAiRequest } from "../../services/ai/aiSafety.service.js";

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

const featureHandler = (feature, options = {}) => async (req, res, next) => {
  try {
    const result = await handleSafeAiRequest({
      req,
      feature,
      jobId: options.jobIdParam ? req.params?.[options.jobIdParam] : null,
    });
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
