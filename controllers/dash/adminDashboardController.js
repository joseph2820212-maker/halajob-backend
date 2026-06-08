import ReturnDashData from '../../helper/ReturnDashData/index.js';
import {
  ApplicationStatusHistoryModel,
  CompanyModel,
  CompanyReviewModel,
  CountryModel,
  CurrencyModel,
  EmployeeCvModel,
  EmployeeModel,
  FcmTokenModel,
  IndustryModel,
  InterviewModel,
  JobInvitationModel,
  JobNameModel,
  JobReportModel,
  JobSalaryModel,
  JobServiceModel,
  JobTypeModel,
  JobZainTalentRequestModel,
  LanguageModel,
  NotificationModel,
  PageModel,
  PermissionModel,
  ResumeModel,
  RoleModel,
  SearchHistoryModel,
  SubscriptionPlanModel,
  CompanySubscriptionModel,
  SkillModel,
  UserApplyingJobModel,
  UserOutSideApplyingJobModel,
  UserRatingJobModel,
  UserReviewJobModel,
  UserSavedJobModel,
  UserShowJobModel,
  WorkLocationTypeModel,
  WorkModeModel,
  WorkTimeTypeModel,
  UserModel,
  jobsModel,
  EducationLevelModel,
} from '../../models/index.js';

const toInt = (value, fallback, min = 1, max = 365) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (days) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - days + 1);
  return d;
};

const safeCount = async (Model, filter = {}) => {
  try {
    return await Model.countDocuments(filter);
  } catch {
    return 0;
  }
};

const groupByField = async (Model, field, filter = {}) => {
  try {
    return await Model.aggregate([
      { $match: filter },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  } catch {
    return [];
  }
};

const dailySeries = async (Model, { filter = {}, dateField = 'createdAt', days = 30 } = {}) => {
  const start = daysAgo(days);
  const match = {
    ...filter,
    [dateField]: { $gte: start },
  };

  try {
    const rows = await Model.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const map = new Map(rows.map((row) => [row._id, row.count]));
    const result = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map.get(key) || 0 });
    }
    return result;
  } catch {
    return [];
  }
};

const percentage = (part, total) => (total ? Number(((Number(part || 0) / Number(total || 0)) * 100).toFixed(2)) : 0);

const countRoleUsers = async (logTo) => {
  const roles = await RoleModel.find({ log_to: logTo }).select('_id').lean();
  if (!roles.length) return 0;
  return UserModel.countDocuments({ role_id: { $in: roles.map((role) => role._id) } });
};

const makeCard = (key, title_ar, title_en, value, meta = {}) => ({
  key,
  title_ar,
  title_en,
  value,
  ...meta,
});

const overview = async (req, res) => {
  try {
    const days = toInt(req.query.days, 30, 7, 365);
    const today = startOfDay(new Date());
    const now = new Date();

    const [
      totalUsers,
      dashboardUsers,
      employeeUsers,
      companyUsers,
      totalEmployees,
      activeEmployees,
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      verifiedCompanies,
      totalJobs,
      publishedJobs,
      pendingJobs,
      closedJobs,
      totalApplications,
      todayApplications,
      externalApplications,
      savedJobs,
      shownJobs,
      jobRatings,
      jobReviews,
      pendingJobReports,
      totalJobReports,
      upcomingInterviews,
      todayInterviews,
      pendingCompanyReviews,
      totalInvitations,
      totalTalentRequests,
      openTalentRequests,
      totalSubscriptionPlans,
      activeCompanySubscriptions,
      totalNotifications,
      totalCvBuilder,
    ] = await Promise.all([
      safeCount(UserModel),
      countRoleUsers('dash'),
      countRoleUsers('employee'),
      countRoleUsers('company'),
      safeCount(EmployeeModel),
      safeCount(EmployeeModel, { status: true }),
      safeCount(CompanyModel),
      safeCount(CompanyModel, { status: true, accepted: true }),
      safeCount(CompanyModel, { $or: [{ accepted: false }, { status: false }] }),
      safeCount(CompanyModel, { is_verified: true }),
      safeCount(jobsModel),
      safeCount(jobsModel, { status: true, is_accepted: true, publish_status: 'published' }),
      safeCount(jobsModel, { publish_status: 'pending_review' }),
      safeCount(jobsModel, { publish_status: { $in: ['closed', 'archived'] } }),
      safeCount(UserApplyingJobModel),
      safeCount(UserApplyingJobModel, { createdAt: { $gte: today } }),
      safeCount(UserOutSideApplyingJobModel),
      safeCount(UserSavedJobModel),
      safeCount(UserShowJobModel),
      safeCount(UserRatingJobModel),
      safeCount(UserReviewJobModel),
      safeCount(JobReportModel, { status: { $in: ['pending', 'reviewing'] } }),
      safeCount(JobReportModel),
      safeCount(InterviewModel, { start_at: { $gte: now }, status: { $in: ['scheduled', 'rescheduled', 'accepted'] } }),
      safeCount(InterviewModel, { start_at: { $gte: today, $lt: new Date(today.getTime() + 86400000) } }),
      safeCount(CompanyReviewModel, { status: 'pending' }),
      safeCount(JobInvitationModel),
      safeCount(JobZainTalentRequestModel),
      safeCount(JobZainTalentRequestModel, { status: { $in: ['new', 'in_progress'] } }),
      safeCount(SubscriptionPlanModel),
      safeCount(CompanySubscriptionModel, { status: { $in: ['active', 'trialing'] } }),
      safeCount(NotificationModel),
      safeCount(EmployeeCvModel),
    ]);

    const [
      jobsByStatus,
      applicationsByStatus,
      interviewsByStatus,
      reportsByStatus,
      companiesByTrust,
      jobsTrend,
      applicationsTrend,
      companiesTrend,
      employeesTrend,
      topJobs,
      topCompanies,
      lookupCounts,
    ] = await Promise.all([
      groupByField(jobsModel, 'publish_status'),
      groupByField(UserApplyingJobModel, 'status'),
      groupByField(InterviewModel, 'status'),
      groupByField(JobReportModel, 'status'),
      Promise.resolve([
        { key: 'accepted', count: activeCompanies },
        { key: 'pending_or_inactive', count: pendingCompanies },
        { key: 'verified', count: verifiedCompanies },
      ]),
      dailySeries(jobsModel, { days }),
      dailySeries(UserApplyingJobModel, { days }),
      dailySeries(CompanyModel, { days }),
      dailySeries(EmployeeModel, { days }),
      jobsModel.find()
        .select('job_name publish_status status is_accepted user_show user_applying user_saved rating company_id createdAt')
        .populate('company_id', 'company_name logo company_email')
        .sort({ user_applying: -1, user_show: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      CompanyModel.find()
        .select('company_name company_email logo accepted status is_verified rating_avg rating_count active_jobs_count jobs_count profile_completion createdAt')
        .sort({ active_jobs_count: -1, rating_avg: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      Promise.all([
        safeCount(JobNameModel),
        safeCount(JobTypeModel),
        safeCount(JobServiceModel),
        safeCount(JobSalaryModel),
        safeCount(WorkTimeTypeModel),
        safeCount(WorkModeModel),
        safeCount(WorkLocationTypeModel),
        safeCount(SkillModel),
        safeCount(LanguageModel),
        safeCount(EducationLevelModel),
        safeCount(CurrencyModel),
        safeCount(CountryModel),
        safeCount(IndustryModel),
        safeCount(PageModel),
        safeCount(ResumeModel),
      ]),
    ]);

    const lookupKeys = [
      'job_names',
      'job_types',
      'job_services',
      'job_salaries',
      'work_times',
      'work_modes',
      'work_locations',
      'skills',
      'languages',
      'education_levels',
      'currencies',
      'countries_cities',
      'industries',
      'pages',
      'resumes',
    ];

    const data = {
      generated_at: new Date(),
      range: { days, from: daysAgo(days), to: new Date() },
      cards: [
        makeCard('users_total', 'إجمالي حسابات المستخدمين', 'Total user accounts', totalUsers),
        makeCard('dashboard_users', 'حسابات لوحة التحكم', 'Dashboard accounts', dashboardUsers),
        makeCard('employee_users', 'حسابات الموظفين', 'Employee user accounts', employeeUsers),
        makeCard('company_users', 'حسابات الشركات', 'Company user accounts', companyUsers),
        makeCard('employees_total', 'ملفات الموظفين', 'Employee profiles', totalEmployees, { active: activeEmployees }),
        makeCard('companies_total', 'الشركات', 'Companies', totalCompanies, { active: activeCompanies, pending: pendingCompanies, verified: verifiedCompanies }),
        makeCard('jobs_total', 'الوظائف', 'Jobs', totalJobs, { published: publishedJobs, pending: pendingJobs, closed: closedJobs }),
        makeCard('applications_total', 'طلبات التقديم', 'Applications', totalApplications, { today: todayApplications, external: externalApplications }),
        makeCard('interviews_upcoming', 'الاجتماعات القادمة', 'Upcoming interviews', upcomingInterviews, { today: todayInterviews }),
        makeCard('job_reports_pending', 'بلاغات الوظائف المعلقة', 'Pending job reports', pendingJobReports, { total: totalJobReports }),
        makeCard('company_reviews_pending', 'تقييمات الشركات المعلقة', 'Pending company reviews', pendingCompanyReviews),
        makeCard('engagement', 'تفاعل الوظائف', 'Job engagement', savedJobs + shownJobs + jobRatings + jobReviews, { savedJobs, shownJobs, jobRatings, jobReviews }),
        makeCard('invitations', 'دعوات العمل', 'Job invitations', totalInvitations),
        makeCard('talent_requests', 'طلبات فريق الخدمات', 'Talent service requests', totalTalentRequests, { open: openTalentRequests }),
        makeCard('subscriptions', 'الاشتراكات النشطة', 'Active subscriptions', activeCompanySubscriptions, { plans: totalSubscriptionPlans }),
        makeCard('notifications', 'الإشعارات', 'Notifications', totalNotifications),
        makeCard('cv_builder', 'السير الذاتية المنشأة', 'Generated CVs', totalCvBuilder),
      ],
      health: {
        publish_rate: percentage(publishedJobs, totalJobs),
        company_acceptance_rate: percentage(activeCompanies, totalCompanies),
        employee_active_rate: percentage(activeEmployees, totalEmployees),
        report_pressure_rate: percentage(pendingJobReports, totalJobReports),
        application_per_job: totalJobs ? Number((totalApplications / totalJobs).toFixed(2)) : 0,
      },
      charts: [
        { key: 'jobs_daily', type: 'line', title_ar: 'الوظائف يومياً', title_en: 'Daily jobs', data: jobsTrend },
        { key: 'applications_daily', type: 'line', title_ar: 'طلبات التقديم يومياً', title_en: 'Daily applications', data: applicationsTrend },
        { key: 'companies_daily', type: 'line', title_ar: 'الشركات الجديدة يومياً', title_en: 'Daily companies', data: companiesTrend },
        { key: 'employees_daily', type: 'line', title_ar: 'الموظفون الجدد يومياً', title_en: 'Daily employees', data: employeesTrend },
        { key: 'jobs_by_status', type: 'donut', title_ar: 'حالة الوظائف', title_en: 'Jobs by status', data: jobsByStatus },
        { key: 'applications_by_status', type: 'bar', title_ar: 'حالة طلبات التقديم', title_en: 'Applications by status', data: applicationsByStatus },
        { key: 'interviews_by_status', type: 'bar', title_ar: 'حالة المقابلات', title_en: 'Interviews by status', data: interviewsByStatus },
        { key: 'reports_by_status', type: 'bar', title_ar: 'حالة البلاغات', title_en: 'Reports by status', data: reportsByStatus },
        { key: 'companies_trust', type: 'bar', title_ar: 'ثقة الشركات', title_en: 'Companies trust', data: companiesByTrust },
      ],
      queues: {
        companies_pending: pendingCompanies,
        jobs_pending_review: pendingJobs,
        job_reports_pending: pendingJobReports,
        company_reviews_pending: pendingCompanyReviews,
        interviews_today: todayInterviews,
        talent_requests_open: openTalentRequests,
        active_company_subscriptions: activeCompanySubscriptions,
      },
      top: {
        jobs: topJobs,
        companies: topCompanies,
      },
      lookup_counts: Object.fromEntries(lookupKeys.map((key, idx) => [key, lookupCounts[idx] || 0])),
    };

    return ReturnDashData.getData({ res, data });
  } catch (err) {
    return ReturnDashData.getError({ res, status: 500, message: err.message || 'dashboard_overview_failed' });
  }
};

const tracking = async (req, res) => {
  try {
    const limit = toInt(req.query.limit, 20, 1, 100);
    const now = new Date();

    const [latestJobs, latestApplications, latestCompanies, latestEmployees, latestReports, latestInterviews, latestHistory, latestSearches] = await Promise.all([
      jobsModel.find().select('job_name publish_status status is_accepted company_id createdAt updatedAt').populate('company_id', 'company_name').sort('-updatedAt').limit(limit).lean(),
      UserApplyingJobModel.find().select('first_name last_name email status job_id company_id createdAt updatedAt').populate('job_id', 'job_name').populate('company_id', 'company_name').sort('-updatedAt').limit(limit).lean(),
      CompanyModel.find().select('company_name company_email accepted status is_verified createdAt updatedAt').sort('-updatedAt').limit(limit).lean(),
      EmployeeModel.find().select('first_name last_name email status profile_completion current_job_title createdAt updatedAt').sort('-updatedAt').limit(limit).lean(),
      JobReportModel.find().select('reason message status job_id company_id user_id createdAt updatedAt').populate('job_id', 'job_name').populate('company_id', 'company_name').populate('user_id', 'first_name last_name email').sort('-updatedAt').limit(limit).lean(),
      InterviewModel.find({ start_at: { $gte: new Date(now.getTime() - 7 * 86400000) } }).select('status type start_at end_at job_id company_id employee_user_id createdAt updatedAt').populate('job_id', 'job_name').populate('company_id', 'company_name').sort('start_at').limit(limit).lean(),
      ApplicationStatusHistoryModel.find().sort('-createdAt').limit(limit).lean(),
      SearchHistoryModel.find().sort('-createdAt').limit(limit).lean(),
    ]);

    const normalize = (type, item, title, status, at) => ({
      type,
      id: item._id,
      title,
      status,
      at: at || item.updatedAt || item.createdAt,
      item,
    });

    const activity = [
      ...latestJobs.map((x) => normalize('job', x, x.job_name, x.publish_status, x.updatedAt)),
      ...latestApplications.map((x) => normalize('application', x, `${x.first_name || ''} ${x.last_name || ''}`.trim() || x.email, x.status, x.updatedAt)),
      ...latestCompanies.map((x) => normalize('company', x, x.company_name, x.accepted ? 'accepted' : 'pending', x.updatedAt)),
      ...latestEmployees.map((x) => normalize('employee', x, `${x.first_name || ''} ${x.last_name || ''}`.trim() || x.email, x.status ? 'active' : 'inactive', x.updatedAt)),
      ...latestReports.map((x) => normalize('job_report', x, x.reason, x.status, x.updatedAt)),
      ...latestInterviews.map((x) => normalize('interview', x, x.type, x.status, x.start_at)),
      ...latestHistory.map((x) => normalize('application_status_history', x, x.new_status || x.status || 'status_change', x.new_status || x.status, x.createdAt)),
      ...latestSearches.map((x) => normalize('search_history', x, x.query || x.keyword || 'search', x.type || 'search', x.createdAt)),
    ]
      .filter((x) => x.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit);

    return ReturnDashData.getData({
      res,
      data: {
        generated_at: new Date(),
        activity,
        latest: {
          jobs: latestJobs,
          applications: latestApplications,
          companies: latestCompanies,
          employees: latestEmployees,
          reports: latestReports,
          interviews: latestInterviews,
        },
      },
    });
  } catch (err) {
    return ReturnDashData.getError({ res, status: 500, message: err.message || 'dashboard_tracking_failed' });
  }
};

export default {
  overview,
  tracking,
};
