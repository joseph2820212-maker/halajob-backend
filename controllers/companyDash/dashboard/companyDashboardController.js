import {
  jobsModel,
  UserApplyingJobModel,
  InterviewModel,
} from "../../../models/index.js";

import {
  getCompanyUserIdOrFail,
  success,
  companyJobPopulate,
  calculateCompanyProfileCompletion,
  buildCompanyMissingItems,
  buildCompanyProfileStrength,
  buildCompanyDashboardQuickActions,
  getCompanyStats,
  buildCompanyDashboardStats,
  normalizeApplication,
  normalizeJob,
  normalizeInterview,
  rebuildCompanySearchFilters,
} from "../../../helper/companyDash/companyDashHelpers.js";

export const getCompanyDashboard = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { company } = companyData;
    const companyId = company._id;

    const completion = calculateCompanyProfileCompletion(company);
    const missingItems = buildCompanyMissingItems(company);
    const profileStrength = buildCompanyProfileStrength(completion, missingItems);

    if (company.profile_completion !== completion) {
      company.profile_completion = completion;
      await rebuildCompanySearchFilters(company);
      await company.save();
    }

    const [baseStats, latestJobs, latestApplications, upcomingInterviews] = await Promise.all([
      getCompanyStats(companyId),
      jobsModel
        .find({ company_id: companyId })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate(companyJobPopulate)
        .lean(),
      UserApplyingJobModel
        .find({ company_id: companyId })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate([
          { path: "job_id", populate: companyJobPopulate },
          { path: "employee_id" },
          { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
        ])
        .lean(),
      InterviewModel
        .find({ company_id: companyId, status: { $in: ["scheduled", "rescheduled"] }, start_at: { $gte: new Date() } })
        .sort({ start_at: 1 })
        .limit(5)
        .populate([
          { path: "job_id", populate: companyJobPopulate },
          { path: "application_id" },
          { path: "employee_user_id", select: "first_name mid_name last_name email image" },
        ])
        .lean(),
    ]);

    const normalizedJobs = latestJobs.map(normalizeJob);
    const normalizedApplications = latestApplications.map(normalizeApplication);
    const normalizedInterviews = upcomingInterviews.map(normalizeInterview);

    const stats = buildCompanyDashboardStats({
      baseStats,
      latestApplications,
      latestJobs,
      upcomingInterviews,
    });

    return success(
      res,
      {
        profile: {
          company,
          completion,
          strength: profileStrength,
          missing_items: missingItems,
          missing_count: missingItems.length,
          high_priority_missing_count: missingItems.filter((item) => item.priority === "high").length,
        },
        stats,
        quick_actions: buildCompanyDashboardQuickActions(missingItems),
        latest_jobs: normalizedJobs,
        latest_applications: normalizedApplications,
        upcoming_interviews: normalizedInterviews,
      },
      "company_dashboard"
    );
  } catch (error) {
    next(error);
  }
};

export default { getCompanyDashboard };
