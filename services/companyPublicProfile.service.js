import mongoose from "mongoose";
import { CompanyReviewModel, jobsModel } from "../models/index.js";
import { publicJobPopulate } from "../helper/employeeDash/employeeDashHelpers.js";

const { ObjectId } = mongoose.Types;

export const PUBLIC_COMPANY_BASE_FILTER = {
  status: true,
  accepted: true,
  "public_profile.status": "published",
};

const clean = (value = "") => String(value ?? "").trim();
const isObjectId = (value) => ObjectId.isValid(String(value || ""));
const escapeRegex = (value = "") => clean(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toPlain = (doc) => doc?.toObject?.() || doc || {};

const uniqueStrings = (value) => {
  const raw = Array.isArray(value) ? value : clean(value).split(/[,;|\n]+/);
  return [...new Set(raw.map(clean).filter(Boolean).map((item) => item.slice(0, 160)))];
};

export const normalizePublicProfilePatch = (body = {}) => {
  const patch = {};
  const brandingPatch = {};

  for (const field of ["seo_title", "seo_description", "hiring_process", "why_work_with_us"]) {
    if (body[field] !== undefined) patch[`public_profile.${field}`] = clean(body[field]);
  }

  for (const field of ["description", "company_short_description", "mission", "vision", "culture", "company_website"]) {
    if (body[field] !== undefined) brandingPatch[field] = clean(body[field]);
  }

  if (body.slug !== undefined) {
    brandingPatch.slug = clean(body.slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (body.logo !== undefined) brandingPatch.logo = clean(body.logo);
  if (body.cover_image !== undefined) brandingPatch.cover_image = clean(body.cover_image);
  if (body.benefits !== undefined) brandingPatch.benefits = uniqueStrings(body.benefits);
  if (body.specialties !== undefined) brandingPatch.specialties = uniqueStrings(body.specialties);

  if (body.gallery !== undefined) {
    const gallery = Array.isArray(body.gallery) ? body.gallery : [];
    brandingPatch.gallery = gallery
      .map((item) => (typeof item === "object" && item ? item : { url: item }))
      .map((item) => ({
        type: ["image", "video"].includes(item.type) ? item.type : "image",
        url: clean(item.url),
        title: clean(item.title),
      }))
      .filter((item) => item.url);
  }

  if (body.social_links !== undefined || body.socialLinks !== undefined) {
    const links = Array.isArray(body.social_links) ? body.social_links : Array.isArray(body.socialLinks) ? body.socialLinks : [];
    brandingPatch.social_links = links
      .map((item) => (typeof item === "object" && item ? item : { url: item }))
      .map((item) => ({
        type: clean(item.type || "other").toLowerCase(),
        url: clean(item.url),
      }))
      .filter((item) => item.url);
  }

  return { patch, brandingPatch };
};

export const publicCompanyLookup = (slugOrId) => {
  const value = clean(slugOrId);
  return isObjectId(value) ? { _id: value } : { slug: value.toLowerCase() };
};

export const buildCompanyPublicSearchFilter = (query = {}) => {
  const filter = { ...PUBLIC_COMPANY_BASE_FILTER };
  const search = clean(query.search || query.q);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { company_name: regex },
      { company_short_description: regex },
      { description: regex },
      { industry_name: regex },
      { specialties: regex },
    ];
  }
  if (query.country) filter.company_country = clean(query.country);
  if (query.city) filter.company_city = new RegExp(escapeRegex(query.city), "i");
  if (query.industry_id && isObjectId(query.industry_id)) filter.industry_id = query.industry_id;
  if (query.verified !== undefined || query.is_verified !== undefined) {
    filter.is_verified = String(query.verified ?? query.is_verified) === "true";
  }
  return filter;
};

const safeLocation = (company) => {
  const visibility = company.location_visibility || {};
  const privacy = company.privacy_settings || {};
  if (privacy.show_location === false) return {};
  return {
    company_country: visibility.show_country === false ? "" : company.company_country || "",
    company_city: visibility.show_country === false ? "" : company.company_city || "",
    company_address: visibility.show_address === false ? "" : company.company_address || "",
    site_type: company.site_type || "",
    company_locations: (company.company_locations || []).map((location) => ({
      country: location.visibility?.show_country === false ? "" : location.country || "",
      city: location.visibility?.show_country === false ? "" : location.city || "",
      address: location.visibility?.show_address === false ? "" : location.address || "",
      site_type: location.site_type || "headquarters",
      is_primary: Boolean(location.is_primary),
    })),
  };
};

const safeSocialLinks = (company) => {
  if (company.privacy_settings?.show_contact_info === false) return [];
  return (company.social_links || [])
    .map((link) => ({ type: link.type || "other", url: link.url || "" }))
    .filter((link) => link.url);
};

export const buildPublicCompanyPayload = (companyDoc, options = {}) => {
  const company = toPlain(companyDoc);
  const publicProfile = company.public_profile || {};
  const includeDraftStatus = options.includeDraftStatus === true;
  const location = safeLocation(company);

  return {
    _id: company._id,
    slug: company.slug || "",
    company_name: company.company_name || "",
    logo: company.logo || company.image || "",
    cover_image: company.cover_image || "",
    is_verified: company.is_verified === true,
    verified_at: company.verified_at || null,
    company_short_description: company.company_short_description || "",
    description: company.description || "",
    industry_id: company.industry_id || null,
    industry_name: company.industry_name || "",
    company_type: company.company_type || "",
    company_size_type: company.company_size_type || "unknown",
    benefits: company.benefits || [],
    specialties: company.specialties || [],
    mission: company.mission || "",
    vision: company.vision || "",
    culture: company.culture || "",
    gallery: (company.gallery || [])
      .map((item) => ({ type: item.type || "image", url: item.url || "", title: item.title || "" }))
      .filter((item) => item.url),
    company_website: company.privacy_settings?.show_contact_info === false ? "" : company.company_website || "",
    social_links: safeSocialLinks(company),
    public_profile: {
      ...(includeDraftStatus ? { status: publicProfile.status || "draft", rejection_reason: publicProfile.rejection_reason || "" } : {}),
      seo_title: publicProfile.seo_title || "",
      seo_description: publicProfile.seo_description || "",
      hiring_process: publicProfile.hiring_process || "",
      why_work_with_us: publicProfile.why_work_with_us || "",
      submitted_at: includeDraftStatus ? publicProfile.submitted_at || null : undefined,
      published_at: publicProfile.published_at || null,
    },
    stats: {
      open_jobs: options.openJobsCount ?? company.active_jobs_count ?? 0,
      reviews: options.reviewCount ?? company.rating_count ?? 0,
      rating_avg: company.privacy_settings?.show_reviews === false ? 0 : company.rating_avg || 0,
      rating_count: company.privacy_settings?.show_reviews === false ? 0 : company.rating_count || 0,
    },
    ...location,
  };
};

export const publicJobFilterForCompany = (companyId) => ({
  company_id: companyId,
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
});

export const listPublicJobsForCompany = (companyId, limit = 10) =>
  jobsModel
    .find(publicJobFilterForCompany(companyId))
    .sort({ createdAt: -1, _id: -1 })
    .limit(Number(limit) || 10)
    .populate(publicJobPopulate)
    .lean();

export const listPublicReviewsForCompany = async (company, limit = 10) => {
  if (company?.privacy_settings?.show_reviews === false) return [];
  return CompanyReviewModel.find({ company_id: company._id, status: "published" })
    .sort({ createdAt: -1, _id: -1 })
    .limit(Number(limit) || 10)
    .populate([{ path: "user_id", select: "first_name last_name image" }])
    .lean()
    .catch(() => []);
};
