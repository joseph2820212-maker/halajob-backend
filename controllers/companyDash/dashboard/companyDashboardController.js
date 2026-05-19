import {
  jobsModel,
  UserApplyingJobModel,
  InterviewModel,
  JobInvitationModel,
  JobEmployeeMatchModel,
  CompanyReviewModel,
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
  buildCompanyHiringPipeline,
  buildCompanyPerformanceSummary,
  buildCompanyReviewsSummary,
  normalizeCompanyDashboardCandidate,
  normalizeCompanyDashboardInvitation,
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

    const now = new Date();

    const [
      baseStats,
      pipelineRows,
      latestJobs,
      latestApplications,
      upcomingInterviews,
      smartCandidates,
      recentInvitations,
      latestReviews,
      reviewsAggregation,
    ] = await Promise.all([
      getCompanyStats(companyId),

      UserApplyingJobModel.aggregate([
        { $match: { company_id: companyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

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
        .find({
          company_id: companyId,
          status: { $in: ["scheduled", "rescheduled"] },
          start_at: { $gte: now },
        })
        .sort({ start_at: 1 })
        .limit(6)
        .populate([
          { path: "job_id", populate: companyJobPopulate },
          { path: "application_id" },
          { path: "employee_user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
        ])
        .lean(),

      JobEmployeeMatchModel
        .find({ company_id: companyId, is_recommended_to_company: true })
        .sort({ score: -1, generated_at: -1 })
        .limit(8)
        .populate([
          { path: "job_id", populate: companyJobPopulate },
          {
            path: "employee_id",
            populate: [
              { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
              { path: "skills.skill_id" },
              { path: "languages.language_id" },
              { path: "experience_level_id" },
            ],
          },
          { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
        ])
        .lean(),

      JobInvitationModel
        .find({ company_id: companyId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate([
          { path: "job_id", populate: companyJobPopulate },
          {
            path: "employee_id",
            populate: { path: "user_id", select: "first_name mid_name last_name email image" },
          },
          { path: "user_id", select: "first_name mid_name last_name email image" },
        ])
        .lean(),

      CompanyReviewModel
        .find({ company_id: companyId, status: "published" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({ path: "user_id", select: "first_name mid_name last_name image" })
        .lean(),

      CompanyReviewModel.aggregate([
        { $match: { company_id: companyId, status: "published" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            average: { $avg: "$rating" },
            five: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            four: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            three: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            two: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            one: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const normalizedJobs = latestJobs.map(normalizeJob).filter(Boolean);
    const normalizedApplications = latestApplications.map(normalizeApplication).filter(Boolean);
    const normalizedInterviews = upcomingInterviews.map(normalizeInterview).filter(Boolean);

    const pipeline = buildCompanyHiringPipeline(pipelineRows);
    const stats = buildCompanyDashboardStats({
      baseStats,
      latestApplications,
      latestJobs,
      upcomingInterviews,
      pipeline,
      smartCandidates,
      recentInvitations,
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
        pipeline,
        performance: buildCompanyPerformanceSummary({ latestJobs, baseStats }),
        reviews_summary: buildCompanyReviewsSummary({ aggregation: reviewsAggregation?.[0], latestReviews }),
        quick_actions: buildCompanyDashboardQuickActions(missingItems),
        latest_jobs: normalizedJobs,
        latest_applications: normalizedApplications,
        upcoming_interviews: normalizedInterviews,
        smart_candidates: smartCandidates.map(normalizeCompanyDashboardCandidate).filter(Boolean),
        recent_invitations: recentInvitations.map(normalizeCompanyDashboardInvitation).filter(Boolean),
      },
      "company_dashboard"
    );
  } catch (error) {
    next(error);
  }
};

export default { getCompanyDashboard };
