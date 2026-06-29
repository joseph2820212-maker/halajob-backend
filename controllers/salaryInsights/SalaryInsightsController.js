import ReturnAppData from "../../helper/ReturnAppData/index.js";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  listSalaryInsightAggregates,
  rebuildSalaryInsightAggregates,
  salaryInsightByTitleSlug,
  salaryInsightForJob,
  salaryInsightFromQuery,
  salaryInsightsHealth,
} from "../../services/salaryInsights/salaryInsight.service.js";
import { checkSalaryCompetitiveness } from "../../services/salaryInsights/salaryCompetitiveness.service.js";

export const publicInsight = async (req, res, next) => {
  try {
    const insight = await salaryInsightFromQuery(req.query || {});
    return ReturnAppData.getData({ res, message: "salary_insight", data: insight });
  } catch (error) {
    next(error);
  }
};

export const publicInsightByTitle = async (req, res, next) => {
  try {
    const insight = await salaryInsightByTitleSlug(req.params.titleSlug, req.query || {});
    return ReturnAppData.getData({ res, message: "salary_insight", data: insight });
  } catch (error) {
    next(error);
  }
};

export const userInsight = async (req, res, next) => {
  try {
    const insight = await salaryInsightFromQuery(req.query || {});
    return ReturnAppData.getData({ res, message: "salary_insight", data: insight });
  } catch (error) {
    next(error);
  }
};

export const userJobInsight = async (req, res, next) => {
  try {
    const insight = await salaryInsightForJob(req.params.jobId);
    return ReturnAppData.getData({ res, message: "job_salary_insight", data: insight });
  } catch (error) {
    next(error);
  }
};

export const companyCheck = async (req, res, next) => {
  try {
    const result = await checkSalaryCompetitiveness(req.body || {});
    return ReturnAppData.createData({ res, message: "salary_competitiveness", data: result });
  } catch (error) {
    next(error);
  }
};

export const companySuggest = async (req, res, next) => {
  try {
    const insight = await salaryInsightFromQuery(req.query || {});
    return ReturnAppData.getData({ res, message: "salary_suggestion", data: insight });
  } catch (error) {
    next(error);
  }
};

export const adminList = async (req, res) => {
  try {
    const items = await listSalaryInsightAggregates(req.query || {});
    return ReturnDashData.getData({ res, message: "salary_insights", data: items });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "salary_insights_failed" });
  }
};

export const adminRebuild = async (req, res) => {
  try {
    const result = await rebuildSalaryInsightAggregates({ limit: req.body?.limit || req.query?.limit });
    return ReturnDashData.createData({ res, message: "salary_insights_rebuilt", data: result });
  } catch (error) {
    return ReturnDashData.getError({ res, status: error.statusCode || 400, message: error.message || "salary_insights_rebuild_failed" });
  }
};

export const adminHealth = async (req, res) => {
  try {
    const health = await salaryInsightsHealth();
    return ReturnDashData.getData({ res, message: "salary_insights_health", data: health });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "salary_insights_health_failed" });
  }
};

export default {
  adminHealth,
  adminList,
  adminRebuild,
  companyCheck,
  companySuggest,
  publicInsight,
  publicInsightByTitle,
  userInsight,
  userJobInsight,
};
