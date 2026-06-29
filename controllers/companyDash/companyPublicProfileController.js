import {
  fail,
  getCompanyPlain,
  getCompanyUserIdOrFail,
  success,
} from "../../helper/companyDash/companyDashHelpers.js";
import { applyCompanyProjection, rebuildCompanyJobsProjection } from "../../services/search/rebuildSearchData.js";
import {
  buildPublicCompanyPayload,
  normalizePublicProfilePatch,
} from "../../services/companyPublicProfile.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

const companyActorType = (req) =>
  req.companyAccess?.role === "owner" ? "company_owner" : "company_member";

const saveCompanyPublicDraft = async (company, req, { forceDraft = true } = {}) => {
  const { patch, brandingPatch } = normalizePublicProfilePatch(req.body || {});
  for (const [field, value] of Object.entries(brandingPatch)) company[field] = value;
  for (const [field, value] of Object.entries(patch)) company.set(field, value);
  if (forceDraft && company.public_profile?.status !== "pending_review") {
    company.set("public_profile.status", "draft");
  }
  if (company.public_profile?.status !== "published") {
    company.set("public_profile.rejection_reason", "");
  }
  await applyCompanyProjection(company);
  await company.save();
  await rebuildCompanyJobsProjection(company._id);
  return company;
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;
    return success(res, buildPublicCompanyPayload(company, { includeDraftStatus: true }), "company_public_profile");
  } catch (error) {
    next(error);
  }
};

export const updatePublicProfile = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const company = await saveCompanyPublicDraft(companyData.company, req);

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "company_public_profile_updated",
      entityType: "company",
      entityId: company._id,
      newValue: { public_profile: company.public_profile },
    });

    recordAnalyticsEvent({
      req,
      event: "company_public_profile_updated",
      userId: companyData.userId,
      companyId: company._id,
      entityType: "company",
      entityId: company._id,
    }).catch(() => null);

    return success(res, buildPublicCompanyPayload(company, { includeDraftStatus: true }), "company_public_profile_updated");
  } catch (error) {
    if (error?.code === 11000) return fail(res, "company_public_profile_unique_conflict", 409, error.keyValue);
    next(error);
  }
};

export const submitPublicProfileReview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const company = companyData.company;
    company.set("public_profile.status", "pending_review");
    company.set("public_profile.submitted_at", new Date());
    company.set("public_profile.rejection_reason", "");
    await company.save();

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "company_public_profile_submitted",
      entityType: "company",
      entityId: company._id,
      newValue: { public_profile: company.public_profile },
    });

    return success(res, buildPublicCompanyPayload(company, { includeDraftStatus: true }), "company_public_profile_submitted");
  } catch (error) {
    next(error);
  }
};

export const previewPublicProfile = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const { patch, brandingPatch } = normalizePublicProfilePatch(req.body || {});
    const preview = company.toObject();
    Object.assign(preview, brandingPatch);
    preview.public_profile = { ...(preview.public_profile || {}) };
    for (const [field, value] of Object.entries(patch)) {
      const key = field.replace("public_profile.", "");
      preview.public_profile[key] = value;
    }
    return success(res, buildPublicCompanyPayload(preview, { includeDraftStatus: true }), "company_public_profile_preview");
  } catch (error) {
    next(error);
  }
};

export default {
  getPublicProfile,
  updatePublicProfile,
  submitPublicProfileReview,
  previewPublicProfile,
};
