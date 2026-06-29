import { CompanyModel } from "../../models/index.js";
import { fail, paginate, success } from "../../helper/companyDash/companyDashHelpers.js";
import {
  PUBLIC_COMPANY_BASE_FILTER,
  buildCompanyPublicSearchFilter,
  buildPublicCompanyPayload,
  listPublicJobsForCompany,
  listPublicReviewsForCompany,
  publicCompanyLookup,
  publicJobFilterForCompany,
} from "../../services/companyPublicProfile.service.js";
import { jobsModel } from "../../models/index.js";

export const listCompanies = async (req, res, next) => {
  try {
    const filter = buildCompanyPublicSearchFilter(req.query || {});
    const result = await paginate(CompanyModel, filter, req, {
      sort: { is_verified: -1, "public_profile.published_at": -1, createdAt: -1 },
      populate: [{ path: "industry_id" }],
      lean: true,
    });
    const items = result.items.map((company) => buildPublicCompanyPayload(company));
    return success(res, items, "public_companies", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getCompany = async (req, res, next) => {
  try {
    const company = await CompanyModel.findOne({
      ...PUBLIC_COMPANY_BASE_FILTER,
      ...publicCompanyLookup(req.params.slugOrId),
    })
      .populate([{ path: "industry_id" }])
      .lean();
    if (!company) return fail(res, "public_company_not_found", 404);

    const [openJobs, openJobsCount, reviews] = await Promise.all([
      listPublicJobsForCompany(company._id, 10),
      jobsModel.countDocuments(publicJobFilterForCompany(company._id)),
      listPublicReviewsForCompany(company, 5),
    ]);

    return success(
      res,
      {
        company: buildPublicCompanyPayload(company, {
          openJobsCount,
          reviewCount: reviews.length,
        }),
        open_jobs: openJobs,
        reviews,
      },
      "public_company",
    );
  } catch (error) {
    next(error);
  }
};

export const getCompanyJobs = async (req, res, next) => {
  try {
    const company = await CompanyModel.findOne({
      ...PUBLIC_COMPANY_BASE_FILTER,
      ...publicCompanyLookup(req.params.slugOrId),
    }).select("_id").lean();
    if (!company) return fail(res, "public_company_not_found", 404);

    const result = await paginate(jobsModel, publicJobFilterForCompany(company._id), req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [],
      lean: true,
    });
    return success(res, result.items, "public_company_jobs", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getCompanyReviews = async (req, res, next) => {
  try {
    const company = await CompanyModel.findOne({
      ...PUBLIC_COMPANY_BASE_FILTER,
      ...publicCompanyLookup(req.params.slugOrId),
    }).lean();
    if (!company) return fail(res, "public_company_not_found", 404);

    const reviews = await listPublicReviewsForCompany(company, Number(req.query.limit) || 25);
    return success(res, reviews, "public_company_reviews", 200, {
      page: 1,
      limit: reviews.length,
      total: reviews.length,
      pages: 1,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listCompanies,
  getCompany,
  getCompanyJobs,
  getCompanyReviews,
};
