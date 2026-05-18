import { jobsModel, UserApplyingJobModel, InterviewModel } from "../../../models/index.js";
import { getCompanyUserIdOrFail, success } from "../../../helper/companyDash/companyDashHelpers.js";

const dateFilter = (query = {}, field = "createdAt") => {
  const filter = {};
  if (query.from || query.to) {
    filter[field] = {};
    if (query.from) filter[field].$gte = new Date(query.from);
    if (query.to) filter[field].$lte = new Date(query.to);
  }
  return filter;
};

export const getCompanyAnalytics = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const companyId = companyData.company._id;
    const range = dateFilter(req.query);

    const [jobs, activeJobs, applications, interviews, hired] = await Promise.all([
      jobsModel.countDocuments({ company_id: companyId, ...range }),
      jobsModel.countDocuments({ company_id: companyId, status: true, publish_status: "published" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, ...range }),
      InterviewModel.countDocuments({ company_id: companyId, ...dateFilter(req.query, "start_at") }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["hired", "accepted"] }, ...range }),
    ]);

    return success(res, { jobs, active_jobs: activeJobs, applications, interviews, hired }, "company_analytics");
  } catch (error) {
    next(error);
  }
};

export const getJobsAnalytics = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const companyId = companyData.company._id;

    const byStatus = await jobsModel.aggregate([
      { $match: { company_id: companyId } },
      { $group: { _id: "$publish_status", count: { $sum: 1 }, views: { $sum: "$user_show" }, applications: { $sum: "$user_applying" }, saved: { $sum: "$user_saved" } } },
      { $sort: { count: -1 } },
    ]);

    return success(res, { by_status: byStatus }, "jobs_analytics");
  } catch (error) {
    next(error);
  }
};

export const getApplicationsAnalytics = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const companyId = companyData.company._id;

    const byStatus = await UserApplyingJobModel.aggregate([
      { $match: { company_id: companyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return success(res, { by_status: byStatus }, "applications_analytics");
  } catch (error) {
    next(error);
  }
};

export const getProfileAnalytics = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    return success(
      res,
      {
        profile_completion: companyData.company.profile_completion || 0,
        views_count: companyData.company.views_count || 0,
        followers_count: companyData.company.followers_count || 0,
        rating_avg: companyData.company.rating_avg || 0,
        rating_count: companyData.company.rating_count || 0,
      },
      "profile_analytics"
    );
  } catch (error) {
    next(error);
  }
};

export default { getCompanyAnalytics, getJobsAnalytics, getApplicationsAnalytics, getProfileAnalytics };
