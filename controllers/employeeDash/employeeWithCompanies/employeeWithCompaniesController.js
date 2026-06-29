import {
  CompanyModel,
  CompanyReviewModel,
  jobsModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  UserShowJobModel,
} from "../../../models/index.js";
import {
  getEmployeeUserIdOrFail,
  success,
  fail,
  paginate,
  publicJobPopulate,
  isValidObjectId,
  getCompanyIdsFromEmployeeActivity,
} from "../../../helper/employeeDash/employeeDashHelpers.js";
import { buildPublicCompanyPayload } from "../../../services/companyPublicProfile.service.js";

const publicCompanyFilter = {
  status: true,
  accepted: true,
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildCompanyFilter = (query = {}) => {
  const { search, country, city, type, industry_id, is_verified } = query;
  const filter = { ...publicCompanyFilter };

  if (search) {
    const regex = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [
      { company_name: regex },
      { description: regex },
      { company_email: regex },
      { industry_name: regex },
      { company_type: regex },
    ];
  }

  if (country) filter.company_country = country;
  if (city) filter.company_city = new RegExp(escapeRegex(String(city).trim()), "i");
  if (type) filter.company_type = type;
  if (industry_id && isValidObjectId(industry_id)) filter.industry_id = industry_id;
  if (is_verified !== undefined) filter.is_verified = String(is_verified) === "true";

  return filter;
};

export const browseCompanies = async (req, res, next) => {
  try {
    const result = await paginate(CompanyModel, buildCompanyFilter(req.query), req, {
      sort: { is_verified: -1, createdAt: -1, _id: -1 },
      populate: [{ path: "industry_id" }],
    });

    return success(res, result.items, "companies_list", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const companyDetails = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    if (!isValidObjectId(companyId)) return fail(res, "invalid_company_id", 400);

    const company = await CompanyModel.findOne({ _id: companyId, ...publicCompanyFilter })
      .populate([{ path: "industry_id" }])
      .lean();

    if (!company) return fail(res, "company_not_found", 404);

    const publicJobFilter = {
      company_id: companyId,
      status: true,
      is_accepted: true,
      publish_status: { $in: ["published", null] },
    };

    const [openJobs, stats, reviews] = await Promise.all([
      jobsModel
        .find(publicJobFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate(publicJobPopulate)
        .lean(),
      Promise.all([
        jobsModel.countDocuments(publicJobFilter),
        jobsModel.countDocuments({ company_id: companyId, is_accepted: true }),
        CompanyReviewModel.countDocuments({ company_id: companyId, status: "published" }).catch(() => 0),
      ]),
      CompanyReviewModel.find({ company_id: companyId, status: "published" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate([{ path: "user_id", select: "first_name last_name image" }])
        .lean()
        .catch(() => []),
    ]);

    const safeCompany = {
      ...company,
      public_profile:
        company.public_profile?.status === "published"
          ? company.public_profile
          : {},
    };

    return success(
      res,
      {
        company: buildPublicCompanyPayload(safeCompany, {
          openJobsCount: stats[0],
          reviewCount: stats[2],
        }),
        open_jobs: openJobs,
        reviews,
        stats: {
          open_jobs: stats[0],
          total_jobs: stats[1],
          reviews: stats[2],
        },
      },
      "company_details"
    );
  } catch (error) {
    next(error);
  }
};

export const companiesFromMyActivity = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const companyIds = await getCompanyIdsFromEmployeeActivity(employeeData.userId);
    if (!companyIds.length) return success(res, [], "companies_from_activity", 200, { page: 1, limit: 0, total: 0, pages: 0 });

    const result = await paginate(CompanyModel, { _id: { $in: companyIds }, ...publicCompanyFilter }, req, {
      populate: [{ path: "industry_id" }],
    });

    return success(res, result.items, "companies_from_activity", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

const companyIdsFromJobs = async (jobIds = []) => {
  if (!jobIds.length) return [];
  const jobs = await jobsModel.find({ _id: { $in: jobIds } }).select("company_id").lean();
  return [...new Set(jobs.map((j) => String(j.company_id)).filter(Boolean))];
};

export const companiesIAppliedTo = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const applications = await UserApplyingJobModel.find({ user_id: employeeData.userId }).select("company_id job_id").lean();
    const directCompanyIds = applications.map((x) => String(x.company_id || "")).filter(Boolean);
    const fallbackCompanyIds = await companyIdsFromJobs(applications.map((x) => x.job_id).filter(Boolean));
    const companyIds = [...new Set([...directCompanyIds, ...fallbackCompanyIds])];

    if (!companyIds.length) return success(res, [], "companies_i_applied_to");

    const result = await paginate(CompanyModel, { _id: { $in: companyIds }, ...publicCompanyFilter }, req);
    return success(res, result.items, "companies_i_applied_to", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const companiesFromSavedJobs = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const saved = await UserSavedJobModel.find({ user_id: employeeData.userId }).select("job_id").lean();
    const companyIds = await companyIdsFromJobs(saved.map((x) => x.job_id).filter(Boolean));

    if (!companyIds.length) return success(res, [], "companies_from_saved_jobs");

    const result = await paginate(CompanyModel, { _id: { $in: companyIds }, ...publicCompanyFilter }, req);
    return success(res, result.items, "companies_from_saved_jobs", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const companiesViewedByMe = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const shown = await UserShowJobModel.find({ user_id: employeeData.userId }).select("job_id").lean();
    const companyIds = await companyIdsFromJobs(shown.map((x) => x.job_id).filter(Boolean));

    if (!companyIds.length) return success(res, [], "companies_viewed_by_me");

    const result = await paginate(CompanyModel, { _id: { $in: companyIds }, ...publicCompanyFilter }, req);
    return success(res, result.items, "companies_viewed_by_me", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const reviewCompany = async (req, res, next) => {
  try {
    const employeeData = await getEmployeeUserIdOrFail(req, res);
    if (!employeeData) return;

    const { companyId } = req.params;
    const rating = Number(req.body.rating);
    const message = String(req.body.message || "").trim();

    if (!isValidObjectId(companyId)) return fail(res, "invalid_company_id", 400);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return fail(res, "invalid_rating", 422);

    const company = await CompanyModel.findOne({ _id: companyId, ...publicCompanyFilter }).select("_id");
    if (!company) return fail(res, "company_not_found", 404);

    const review = await CompanyReviewModel.findOneAndUpdate(
      { company_id: companyId, user_id: employeeData.userId },
      {
        company_id: companyId,
        user_id: employeeData.userId,
        rating,
        message,
        status: "published",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return success(res, review, "company_review_saved");
  } catch (error) {
    next(error);
  }
};

export default {
  browseCompanies,
  companyDetails,
  companiesFromMyActivity,
  companiesIAppliedTo,
  companiesFromSavedJobs,
  companiesViewedByMe,
  reviewCompany,
};
