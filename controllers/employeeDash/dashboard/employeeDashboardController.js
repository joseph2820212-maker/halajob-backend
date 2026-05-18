import {
  jobsModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  InterviewModel,
  JobEmployeeMatchModel,
} from "../../../models/index.js";

import {
  getEmployeeUserIdOrFail,
  success,
  publicJobPopulate,
  getEmployeeStats,
  calculateProfileCompletion,
  buildProfileMissingItems,
  buildProfileStrength,
  buildDashboardStats,
  buildDashboardQuickActions,
  normalizeApplication,
  normalizeSavedJob,
  normalizeJob,
  normalizeInterview,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

import {
  buildEmployeeCompatibleJobFilter,
  buildDashboardSmartTips,
  normalizeMatchedJob,
  normalizeRecommendedFallbackJob,
} from "../../../helper/employeeDash/employeeDashboardJobHelpers.js";

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
};

const getLang = (req) => {
  const lan = String(req.get("lan") || req.get("lang") || req.query.lang || "ar").toLowerCase();
  return lan.startsWith("en") ? "en" : "ar";
};

const normalizeRecommendedMatchForResponse = (match, employee, lang) => {
  const normalized = normalizeMatchedJob(match, employee, lang);

  return {
    ...normalized,

    match: {
      score: Number(normalized?.score || match?.score || 0),
      percentage: Math.round(Number(normalized?.score || match?.score || 0)),
      level:
        Number(normalized?.score || match?.score || 0) >= 80
          ? "excellent"
          : Number(normalized?.score || match?.score || 0) >= 60
            ? "good"
            : "medium",

      matched_skills:
        normalized?.matched_skills ||
        match?.matched_skills ||
        match?.details?.matched_skills ||
        [],

      missing_skills:
        normalized?.missing_skills ||
        match?.missing_skills ||
        match?.details?.missing_skills ||
        [],

      matched_languages:
        normalized?.matched_languages ||
        match?.matched_languages ||
        match?.details?.matched_languages ||
        [],

      missing_languages:
        normalized?.missing_languages ||
        match?.missing_languages ||
        match?.details?.missing_languages ||
        [],

      reason: normalized?.reason || "matched_by_employee_profile",
    },

    job: normalizeJob(normalized.job),
  };
};

const normalizeFallbackJobForResponse = (job, employee, lang) => {
  const normalized = normalizeRecommendedFallbackJob(job, employee, lang);
  const score = Number(normalized?.score || 0);

  return {
    ...normalized,

    match: {
      score,
      percentage: Math.round(score),
      level: score >= 80 ? "excellent" : score >= 60 ? "good" : "medium",
      matched_skills: normalized?.matched_skills || [],
      missing_skills: normalized?.missing_skills || [],
      matched_languages: normalized?.matched_languages || [],
      missing_languages: normalized?.missing_languages || [],
      reason: normalized?.reason || "matched_by_employee_profile",
    },

    job: normalizeJob(job),
  };
};
export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const lang = getLang(req);
    const { employee, userId } = employeeData;

    const completion = calculateProfileCompletion(employee);
    const missingItems = buildProfileMissingItems(employee);
    const profileStrength = buildProfileStrength(completion, missingItems);

    /**
     * هذا الفلتر لا يرجع وظائف عامة.
     * إن كان ملف الموظف ناقص جداً، سيرجع empty نتيجة بدل public jobs.
     */
    const employeeCompatibleFilter = buildEmployeeCompatibleJobFilter(employee, publicJobFilter);

    const [
      baseStats,
      latestApplications,
      savedJobs,
      recommendedMatches,
      matchedJobs,
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

      /**
       * اقتراحات ذكية محفوظة للموظف الحالي فقط.
       * match داخل populate مهم حتى لا تظهر وظيفة غير منشورة أو موقوفة.
       */
      JobEmployeeMatchModel.find({
        employee_id: employee._id,
        is_recommended_to_employee: true,
      })
        .sort({ score: -1, generated_at: -1, createdAt: -1 })
        .limit(8)
        .populate({
          path: "job_id",
          match: publicJobFilter,
          populate: publicJobPopulate,
        })
        .populate({
          path: "company_id",
          select:
            "company_name image cover_image company_country company_city company_type industry_name is_verified rating_avg rating_count",
        })
        .lean(),

      /**
       * بدل latest_jobs العامة:
       * matched_jobs هي وظائف متوافقة مع الموظف فقط.
       */
      jobsModel
        .find(employeeCompatibleFilter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(8)
        .populate(publicJobPopulate)
        .lean(),

      InterviewModel.find({
        employee_user_id: userId,
        status: { $in: ["scheduled", "rescheduled"] },
        start_at: { $gte: new Date() },
      })
        .sort({ start_at: 1, _id: 1 })
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

    /**
     * Mongoose populate + match يرجع match موجود لكن job_id = null إذا الوظيفة لا تحقق publicJobFilter.
     * لذلك يجب فلترتها.
     */
    const validRecommendedMatches = recommendedMatches.filter((item) => item?.job_id);

    const normalizedRecommendedJobs = validRecommendedMatches.length
      ? validRecommendedMatches.map((item) => normalizeRecommendedMatchForResponse(item, employee, lang))
      : matchedJobs.map((job) => normalizeFallbackJobForResponse(job, employee, lang));

    const normalizedMatchedJobs = matchedJobs.map(normalizeJob);
    const normalizedInterviews = upcomingInterviews.map(normalizeInterview);

    const smartTips = buildDashboardSmartTips({
      employee,
      profileMissingItems: missingItems,
      recommendedJobs: normalizedRecommendedJobs,
      matchedJobs: normalizedRecommendedJobs,
      applications: latestApplications,
      lang,
    });

    const stats = buildDashboardStats({
      baseStats,
      latestApplications,
      savedJobs,
      recommendedJobs: normalizedRecommendedJobs,
      latestJobs: matchedJobs,
      matchedJobs,
      upcomingInterviews,
      smartTips,
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
          high_priority_missing_count: missingItems.filter((item) => item.priority === "high").length,
        },

        stats,

        quick_actions: buildDashboardQuickActions(missingItems),

        latest_applications: normalizedApplications,
        saved_jobs: normalizedSavedJobs,

        /**
         * هذه الآن ليست وظائف عامة:
         * recommended_jobs = matches خاصة بالموظف أو fallback من matched_jobs فقط.
         */
        recommended_jobs: normalizedRecommendedJobs,

        /**
         * اسم جديد بدل latest_jobs حتى لا يكون المعنى وظائف عامة.
         * إن كان الـ frontend القديم يحتاج latest_jobs مؤقتاً يمكن إرجاع alias كما بالأسفل.
         */
        matched_jobs: normalizedMatchedJobs,

        /**
         * Alias مؤقت للتوافق مع واجهات قديمة.
         * الأفضل في الواجهة استخدام matched_jobs بدل latest_jobs.
         */
        latest_jobs: normalizedMatchedJobs,

        /**
         * نصائح ذكية مبنية على تحليل:
         * - المهارات الناقصة في الوظائف المتوافقة.
         * - اللغات المطلوبة.
         * - نقص بيانات الملف.
         * - حالة الطلبات.
         */
        smart_tips: smartTips,
        tips: smartTips,

        upcoming_interviews: normalizedInterviews,
      },
      "employee_dashboard"
    );
  } catch (error) {
    next(error);
  }
};

export default { getEmployeeDashboard };
