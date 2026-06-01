import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CompanyModel,
  EmployeeModel,
  InterviewModel,
  JobEmployeeMatchModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  UserShowJobModel,
  jobsModel,
} from "../../../models/index.js";
import { resolveAppAccount } from "../../../services/appAccount.service.js";

const DEFAULT_MONTHS = 6;
const MAX_MONTHS = 12;

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);

const monthKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const buildMonthlySkeleton = (months) => {
  const safeMonths = clamp(toNumber(months, DEFAULT_MONTHS), 1, MAX_MONTHS);
  const end = startOfMonth(new Date());
  const start = addMonths(end, -(safeMonths - 1));
  const labels = [];

  for (let i = 0; i < safeMonths; i += 1) labels.push(monthKey(addMonths(start, i)));

  return {
    start,
    labels,
    map: new Map(labels.map((key) => [key, 0])),
  };
};

const fillMonthlyCounts = (skeleton, rows = []) => {
  const map = new Map(skeleton.map);

  rows.forEach((row) => {
    const key = `${row?._id?.year}-${String(row?._id?.month || 0).padStart(2, "0")}`;
    if (map.has(key)) map.set(key, toNumber(row.count));
  });

  return skeleton.labels.map((key) => ({ key, label: key, value: map.get(key) || 0 }));
};

const percent = (value, total) => {
  const v = toNumber(value);
  const t = toNumber(total);
  if (!t) return 0;
  return Number(((v / t) * 100).toFixed(2));
};

const normalizeStatusRows = (rows = []) => {
  const total = rows.reduce((sum, row) => sum + toNumber(row.count), 0);
  return rows.map((row) => ({
    key: row._id || "unknown",
    label: row._id || "unknown",
    value: toNumber(row.count),
    percent: percent(row.count, total),
  }));
};

const monthlyAggregate = ({ model, match, skeleton }) => {
  return model.aggregate([
    { $match: { ...match, createdAt: { $gte: skeleton.start } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

const getAuthenticatedUserId = (req) => {
  return toObjectId(
    req.user?._id ||
      req.user?.id ||
      req.user?.user_id ||
      req.auth?._id ||
      req.auth?.user_id
  );
};

const normalizeEmbeddedAccount = (value) => {
  if (!value) return null;
  if (typeof value === "string") return null;
  if (value instanceof mongoose.Types.ObjectId) return null;
  return value?._id ? value : null;
};

const findUserCompany = async (userId, reqUser = {}) => {
  const embeddedCompany = normalizeEmbeddedAccount(reqUser.company);
  if (embeddedCompany) return embeddedCompany;

  return CompanyModel.findOne({ owner_user_id: userId }).lean();
};

const findUserEmployee = async (userId, reqUser = {}) => {
  const embeddedEmployee = normalizeEmbeddedAccount(reqUser.employee);
  if (embeddedEmployee) return embeddedEmployee;

  return EmployeeModel.findOne({ user_id: userId }).lean();
};

const buildCompanyOverview = async ({ company, months }) => {
  const companyId = company._id;
  const skeleton = buildMonthlySkeleton(months);
  const now = new Date();

  const [
    totalJobs,
    activeJobs,
    draftJobs,
    pendingJobs,
    pausedJobs,
    closedJobs,
    totalApplications,
    waitingApplications,
    shortlistedApplications,
    interviewApplications,
    offerApplications,
    hiredApplications,
    upcomingInterviews,
    jobsByStatusRows,
    applicationsByStatusRows,
    jobsMonthlyRows,
    applicationsMonthlyRows,
  ] = await Promise.all([
    jobsModel.countDocuments({ company_id: companyId }),
    jobsModel.countDocuments({ company_id: companyId, status: true, is_accepted: true, publish_status: "published" }),
    jobsModel.countDocuments({ company_id: companyId, publish_status: "draft" }),
    jobsModel.countDocuments({ company_id: companyId, publish_status: { $in: ["pending", "pending_review"] } }),
    jobsModel.countDocuments({ company_id: companyId, publish_status: "paused" }),
    jobsModel.countDocuments({ company_id: companyId, publish_status: "closed" }),
    UserApplyingJobModel.countDocuments({ company_id: companyId }),
    UserApplyingJobModel.countDocuments({ company_id: companyId, status: "waiting" }),
    UserApplyingJobModel.countDocuments({ company_id: companyId, status: "shortlisted" }),
    UserApplyingJobModel.countDocuments({ company_id: companyId, status: "interview" }),
    UserApplyingJobModel.countDocuments({ company_id: companyId, status: "offer" }),
    UserApplyingJobModel.countDocuments({ company_id: companyId, status: "hired" }),
    InterviewModel.countDocuments({ company_id: companyId, status: { $in: ["scheduled", "rescheduled"] }, start_at: { $gte: now } }),
    jobsModel.aggregate([
      { $match: { company_id: companyId } },
      { $group: { _id: "$publish_status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    UserApplyingJobModel.aggregate([
      { $match: { company_id: companyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    monthlyAggregate({ model: jobsModel, match: { company_id: companyId }, skeleton }),
    monthlyAggregate({ model: UserApplyingJobModel, match: { company_id: companyId }, skeleton }),
  ]);

  return {
    account: {
      type: "company",
      id: String(companyId),
      name: company.company_name || "",
      image: company.image || company.logo || null,
      status: company.status === true,
      accepted: company.accepted === true,
      profile_completion: toNumber(company.profile_completion),
    },
    cards: {
      total_jobs: totalJobs,
      active_jobs: activeJobs,
      draft_jobs: draftJobs,
      pending_jobs: pendingJobs,
      paused_jobs: pausedJobs,
      closed_jobs: closedJobs,
      total_applications: totalApplications,
      waiting_applications: waitingApplications,
      shortlisted_applications: shortlistedApplications,
      interview_applications: interviewApplications,
      offer_applications: offerApplications,
      hired_applications: hiredApplications,
      upcoming_interviews: upcomingInterviews,
      profile_completion: toNumber(company.profile_completion),
      application_per_job_rate: percent(totalApplications, totalJobs),
      active_job_rate: percent(activeJobs, totalJobs),
    },
    charts: {
      jobs_by_status: normalizeStatusRows(jobsByStatusRows),
      applications_by_status: normalizeStatusRows(applicationsByStatusRows),
      jobs_monthly: fillMonthlyCounts(skeleton, jobsMonthlyRows),
      applications_monthly: fillMonthlyCounts(skeleton, applicationsMonthlyRows),
      hiring_funnel: [
        { key: "active_jobs", label: "active_jobs", value: activeJobs },
        { key: "applications", label: "applications", value: totalApplications },
        { key: "interview", label: "interview", value: interviewApplications },
        { key: "offer", label: "offer", value: offerApplications },
        { key: "hired", label: "hired", value: hiredApplications },
      ],
    },
  };
};

const buildEmployeeOverview = async ({ employee, userId, months }) => {
  const employeeId = employee._id;
  const skeleton = buildMonthlySkeleton(months);
  const now = new Date();

  const [
    totalApplications,
    waitingApplications,
    interviewApplications,
    rejectedApplications,
    offerApplications,
    hiredApplications,
    savedJobs,
    viewedJobs,
    upcomingInterviews,
    recommendedJobs,
    excellentMatches,
    goodMatches,
    mediumMatches,
    applicationsByStatusRows,
    applicationsMonthlyRows,
    savedMonthlyRows,
    viewsMonthlyRows,
  ] = await Promise.all([
    UserApplyingJobModel.countDocuments({ user_id: userId }),
    UserApplyingJobModel.countDocuments({ user_id: userId, status: "waiting" }),
    UserApplyingJobModel.countDocuments({ user_id: userId, status: "interview" }),
    UserApplyingJobModel.countDocuments({ user_id: userId, status: "rejected" }),
    UserApplyingJobModel.countDocuments({ user_id: userId, status: "offer" }),
    UserApplyingJobModel.countDocuments({ user_id: userId, status: "hired" }),
    UserSavedJobModel.countDocuments({ user_id: userId }),
    UserShowJobModel.countDocuments({ user_id: userId }),
    InterviewModel.countDocuments({ employee_user_id: userId, status: { $in: ["scheduled", "rescheduled"] }, start_at: { $gte: now } }),
    JobEmployeeMatchModel.countDocuments({ employee_id: employeeId, is_recommended_to_employee: true }),
    JobEmployeeMatchModel.countDocuments({ employee_id: employeeId, is_recommended_to_employee: true, score: { $gte: 80 } }),
    JobEmployeeMatchModel.countDocuments({ employee_id: employeeId, is_recommended_to_employee: true, score: { $gte: 60, $lt: 80 } }),
    JobEmployeeMatchModel.countDocuments({ employee_id: employeeId, is_recommended_to_employee: true, score: { $gt: 0, $lt: 60 } }),
    UserApplyingJobModel.aggregate([
      { $match: { user_id: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    monthlyAggregate({ model: UserApplyingJobModel, match: { user_id: userId }, skeleton }),
    monthlyAggregate({ model: UserSavedJobModel, match: { user_id: userId }, skeleton }),
    monthlyAggregate({ model: UserShowJobModel, match: { user_id: userId }, skeleton }),
  ]);

  const applicationsMonthly = fillMonthlyCounts(skeleton, applicationsMonthlyRows);
  const savedMonthly = fillMonthlyCounts(skeleton, savedMonthlyRows);
  const viewsMonthly = fillMonthlyCounts(skeleton, viewsMonthlyRows);

  return {
    account: {
      type: "employee",
      id: String(employeeId),
      status: employee.status === true,
      accepted: employee.accepted === true,
      profile_completion: toNumber(employee.profile_completion),
      candidate_stage: employee.candidate_stage || "unknown",
      is_free_for_work: employee.is_free_for_work === true,
    },
    cards: {
      total_applications: totalApplications,
      waiting_applications: waitingApplications,
      interview_applications: interviewApplications,
      rejected_applications: rejectedApplications,
      offer_applications: offerApplications,
      hired_applications: hiredApplications,
      saved_jobs: savedJobs,
      viewed_jobs: viewedJobs,
      recommended_jobs: recommendedJobs,
      upcoming_interviews: upcomingInterviews,
      profile_completion: toNumber(employee.profile_completion),
      application_from_views_rate: percent(totalApplications, viewedJobs),
      save_from_views_rate: percent(savedJobs, viewedJobs),
    },
    charts: {
      applications_by_status: normalizeStatusRows(applicationsByStatusRows),
      applications_monthly: applicationsMonthly,
      saved_jobs_monthly: savedMonthly,
      viewed_jobs_monthly: viewsMonthly,
      activity_monthly: skeleton.labels.map((key, index) => ({
        key,
        label: key,
        applications: applicationsMonthly[index]?.value || 0,
        saved_jobs: savedMonthly[index]?.value || 0,
        viewed_jobs: viewsMonthly[index]?.value || 0,
      })),
      match_quality: [
        { key: "excellent", label: "excellent", value: excellentMatches },
        { key: "good", label: "good", value: goodMatches },
        { key: "medium", label: "medium", value: mediumMatches },
      ],
    },
  };
};

const getMyAppDashboardOverview = async (req, res, next) => {
  try {
    /**
     * Mobile personal dashboard must be resolved from token only.
     * Do not accept user_id, company_id, employee_id, type, or role from query/body.
     */
    const userId = getAuthenticatedUserId(req);
    if (!userId) return ReturnAppData.getError({ res, status: 401, message: "unauthorized" });

    const months = clamp(toNumber(req.query.months, DEFAULT_MONTHS), 1, MAX_MONTHS);

    const account = await resolveAppAccount(req.user || {}, { createMissingEmployee: false });

    /**
     * Important: account type is resolved from the authenticated user only.
     * Priority is: approved company profile -> role_id.log_to -> existing profile.
     * This prevents returning employee dashboard for company accounts that still have
     * an old EmployeeModel document, and prevents pending company requests from
     * hijacking an employee dashboard.
     */
    let overview = null;

    if (account.accountType === "company" && account.company?._id && account.companyState === "approved") {
      overview = await buildCompanyOverview({ company: account.company, months });
    } else if (account.accountType === "employee" && account.employee?._id) {
      overview = await buildEmployeeOverview({ employee: account.employee, userId, months });
    }

    if (!overview) {
      return ReturnAppData.getData({
        res,
        data: {
          account: { type: "unknown" },
          cards: {},
          charts: {},
          meta: {
            months,
            generated_at: new Date().toISOString(),
            resolved_from: "authenticated_account",
            account_type: account.accountType,
            role_type: account.roleType,
            company_state: account.companyState,
          },
        },
      });
    }

    return ReturnAppData.getData({
      res,
      data: {
        ...overview,
        meta: {
          months,
          generated_at: new Date().toISOString(),
          resolved_from: "authenticated_account",
            account_type: account.accountType,
            role_type: account.roleType,
            company_state: account.companyState,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getMyAppDashboardOverview };
