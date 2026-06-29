import { CompanyModel } from "../../models/index.js";
import { fail, paginate, success } from "../../helper/companyDash/companyDashHelpers.js";
import { buildPublicCompanyPayload } from "../../services/companyPublicProfile.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";

const reviewerId = (req) => req.user?._id || req.auth?.userId || null;

export const listPending = async (req, res, next) => {
  try {
    const result = await paginate(CompanyModel, { "public_profile.status": "pending_review" }, req, {
      sort: { "public_profile.submitted_at": 1, updatedAt: 1 },
      populate: [{ path: "industry_id" }],
      lean: true,
    });
    const items = result.items.map((company) => buildPublicCompanyPayload(company, { includeDraftStatus: true }));
    return success(res, items, "company_public_profiles_pending", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const company = await CompanyModel.findById(req.params.companyId);
    if (!company) return fail(res, "company_not_found", 404);

    company.set("public_profile.status", "published");
    company.set("public_profile.published_at", new Date());
    company.set("public_profile.reviewed_by", reviewerId(req));
    company.set("public_profile.rejection_reason", "");
    await company.save();

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: reviewerId(req),
      actorType: "admin",
      action: "company_public_profile_approved",
      entityType: "company",
      entityId: company._id,
      newValue: { public_profile: company.public_profile },
    });

    return success(res, buildPublicCompanyPayload(company, { includeDraftStatus: true }), "company_public_profile_approved");
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const company = await CompanyModel.findById(req.params.companyId);
    if (!company) return fail(res, "company_not_found", 404);

    company.set("public_profile.status", "rejected");
    company.set("public_profile.reviewed_by", reviewerId(req));
    company.set("public_profile.rejection_reason", String(req.body?.reason || req.body?.rejection_reason || "Profile needs changes.").trim());
    await company.save();

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: reviewerId(req),
      actorType: "admin",
      action: "company_public_profile_rejected",
      entityType: "company",
      entityId: company._id,
      newValue: { public_profile: company.public_profile },
    });

    return success(res, buildPublicCompanyPayload(company, { includeDraftStatus: true }), "company_public_profile_rejected");
  } catch (error) {
    next(error);
  }
};

export default {
  listPending,
  approve,
  reject,
};
