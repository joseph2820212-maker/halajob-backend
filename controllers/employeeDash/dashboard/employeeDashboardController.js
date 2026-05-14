import {
  jobsModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  InterviewModel,
} from "../../../models/index.js";

import {
  getEmployeeUserIdOrFail,
  success,
  publicJobPopulate,
  getEmployeeStats,
  calculateProfileCompletion,
  buildRecommendedJobFilter,

  buildProfileMissingItems,
  buildProfileStrength,
  buildDashboardStats,
  buildDashboardQuickActions,
  normalizeApplication,
  normalizeSavedJob,
  normalizeJob,
  normalizeInterview,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
};

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { employee, userId } = employeeData;

    const completion = calculateProfileCompletion(employee);
    const missingItems = buildProfileMissingItems(employee);
    const profileStrength = buildProfileStrength(completion, missingItems);

    const [
      baseStats,
      latestApplications,
      savedJobs,
      recommendedJobs,
      latestJobs,
      upcomingInterviews,
    ] = await Promise.all([
      getEmployeeStats(userId),

      UserApplyingJobModel.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate([
          { path: "job_id", populate: publicJobPopulate },
          { path: "company_id" },
        ])
        .lean(),

      UserSavedJobModel.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate([{ path: "job_id", populate: publicJobPopulate }])
        .lean(),

      jobsModel
        .find({
          ...publicJobFilter,
          ...buildRecommendedJobFilter(employee),
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate(publicJobPopulate)
        .lean(),

      jobsModel
        .find(publicJobFilter)
        .sort({ createdAt: -1 })
        .limit(8)
        .populate(publicJobPopulate)
        .lean(),

      InterviewModel.find({
        employee_user_id: userId,
        status: { $in: ["scheduled", "rescheduled"] },
        start_at: { $gte: new Date() },
      })
        .sort({ start_at: 1 })
        .limit(5)
        .populate([
          { path: "job_id", populate: publicJobPopulate },
          { path: "company_id" },
          { path: "application_id" },
        ])
        .lean(),
    ]);

    const normalizedApplications = latestApplications.map(normalizeApplication);
    const normalizedSavedJobs = savedJobs.map(normalizeSavedJob);
    const normalizedRecommendedJobs = recommendedJobs.map(normalizeJob);
    const normalizedLatestJobs = latestJobs.map(normalizeJob);
    const normalizedInterviews = upcomingInterviews.map(normalizeInterview);

    const stats = buildDashboardStats({
      baseStats,
      latestApplications,
      savedJobs,
      recommendedJobs,
      latestJobs,
      upcomingInterviews,
    });

    return success(
      res,
      {
        profile: {
          employee,
          completion,
          strength: profileStrength,
          missing_items: missingItems,
          missing_count: missingItems.length,
          high_priority_missing_count: missingItems.filter(
            (item) => item.priority === "high"
          ).length,
        },

        stats,

        quick_actions: buildDashboardQuickActions(missingItems),

        latest_applications: normalizedApplications,
        saved_jobs: normalizedSavedJobs,
        recommended_jobs: normalizedRecommendedJobs,
        latest_jobs: normalizedLatestJobs,
        upcoming_interviews: normalizedInterviews,
      },
      "employee_dashboard"
    );
  } catch (error) {
    next(error);
  }
};

export default { getEmployeeDashboard };