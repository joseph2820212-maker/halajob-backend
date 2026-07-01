import mongoose from "mongoose";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import bcryptjs from "bcrypt";
import {
  getCompanyOrFail,
  getCompanyPlain,
  success,
  fail,
  calculateCompanyProfileCompletion,
  buildCompanyMissingItems,
  buildCompanyProfileStrength,
  buildCompanyDashboardQuickActions,
  rebuildCompanySearchFilters,
  shouldRebuildCompanySearchFilters,
  applyCompletionAndSearchFilters,
  companyPopulate
} from "../../../helper/companyDash/companyDashHelpers.js";

import { CountryModel, IndustryModel, LanguageModel, RefreshTokenModel, UserModel } from "../../../models/index.js";
import normalizeArabicKeyword from "../../../helper/normalizeArabicKeyword.js";
import { deleteImage, processUploadImage } from "../../../services/imageService.js";
import { applyCompanyProjection, rebuildCompanyJobsProjection } from "../../../services/search/rebuildSearchData.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";
import tz_lookup from "tz-lookup";

const SINGLE_FIELDS = new Set([
  "company_name",
  "slug",
  "company_email",
  "created_year",
  "description",
  "company_short_description",
  "mission",
  "vision",
  "culture",
  "industry_id",
  "industry_name",
  "company_size",
  "company_size_type",
  "company_type",
  "country_id",
  "city_id",
  "company_country",
  "company_city",
  "company_address",
  "timezone",
  "site_type",
  "company_phone",
  "company_whatsapp",
  "company_phone_code",
  "company_website",
  "hr_name",
  "hr_email",
  "hr_phone",
  "is_hiring",
]);

const ARRAY_FIELDS = new Set(["files", "gallery", "company_contact", "social_links", "benefits", "specialties", "languages", "verification_documents", "company_locations"]);
const BOOLEAN_FIELDS = new Set(["is_hiring"]);
const OBJECT_FIELDS = new Set(["location_visibility", "privacy_settings"]);
const OBJECT_ID_SINGLE_FIELDS = new Set(["industry_id", "country_id", "city_id"]);
const NUMBER_FIELDS = new Set(["created_year", "company_size"]);
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const DOCS_DIR = "files";
const MAX_COMPANY_FILES = 10;
const COMPANY_FILE_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"]);
const COMPANY_DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const normalizeCompanyFileName = (value = "") => {
  const raw = String(value || "").trim();
  const safe = path.basename(raw);
  if (!raw || raw !== safe || raw.includes("/") || raw.includes("\\") || raw.includes("..")) return "";
  return safe;
};

const getCompanyFileDirForFilename = (filename = "") => {
  const ext = path.extname(filename).toLowerCase();
  return COMPANY_DOCUMENT_EXTENSIONS.has(ext) ? DOCS_DIR : "";
};

const buildCompanyFilePath = (filename = "") => {
  const safe = normalizeCompanyFileName(filename);
  const dir = getCompanyFileDirForFilename(safe);
  return path.join(UPLOADS_ROOT, dir, safe);
};

const buildCompanyFileUrl = (filename = "") => {
  const safe = normalizeCompanyFileName(filename);
  if (!safe) return "";
  return `/company/v1/global/profile/files/${encodeURIComponent(safe)}/download`;
};

const serializeCompanyFiles = (company = {}) => {
  const files = Array.isArray(company.files) ? company.files : [];
  return {
    files_count: files.length,
    files: files
      .map((filename) => normalizeCompanyFileName(filename))
      .filter(Boolean)
      .map((filename) => ({
        filename,
        file_name: filename,
        url: buildCompanyFileUrl(filename),
        download_path: `/company/v1/global/profile/files/${encodeURIComponent(filename)}/download`,
      })),
  };
};

const recordCompanyProfileUpdated = ({ req, company, section = "profile", fields = [] }) => {
  if (!company?._id) return;
  recordAnalyticsEvent({
    req,
    event: "company_profile_updated",
    userId: company.owner_user_id || req?.user?._id,
    companyId: company._id,
    entityType: "company",
    entityId: company._id,
    metadata: {
      section,
      fields,
    },
  }).catch(() => null);
};

const companyActorType = (req) =>
  req.companyAccess?.role === "owner" ? "company_owner" : "company_member";

const deleteCompanyUploadedFile = async (filename = "") => {
  const safe = normalizeCompanyFileName(filename);
  if (!safe) return;
  const filePath = buildCompanyFilePath(safe);
  if (existsSync(filePath)) await fs.unlink(filePath).catch(() => {});
};

const parseBool = (value) => {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return value;
};

const parseJsonIfString = (value, fallback = value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return fallback;
  try { return JSON.parse(trimmed); } catch { return fallback; }
};

const normalizeArrayPayload = (body = {}, key = "items") => {
  const value = body?.[key] ?? body?.items ?? body?.data ?? body;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  if (value && typeof value === "object") return [value];
  return [];
};

const uniqueStringArray = (items = []) => [...new Set(items.flat(Infinity).map((x) => String(x || "").trim()).filter(Boolean))];
const normalizeSlug = (value = "") => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const validateCompanyTextField = (field, value) => {
  const text = String(value || "").trim();
  const rules = {
    company_short_description: { max: 200 },
    description: { min: 200, max: 1500 },
    mission: { min: 100, max: 300 },
    vision: { min: 100, max: 300 },
    culture: { min: 100, max: 300 },
  }[field];

  if (!rules || !text) return;
  if (rules.min && text.length < rules.min) throw new Error(`${field}_too_short`);
  if (rules.max && text.length > rules.max) throw new Error(`${field}_too_long`);
};

const cleanSocialLink = (item = {}) => {
  const parsed = parseJsonIfString(item, item) || {};
  return { type: String(parsed.type || "other").trim().toLowerCase(), url: String(parsed.url || "").trim() };
};

const cleanGalleryItem = (item = {}) => {
  const parsed = parseJsonIfString(item, item) || {};
  return { type: ["image", "video"].includes(parsed.type) ? parsed.type : "image", url: String(parsed.url || "").trim(), title: String(parsed.title || "").trim() };
};
const cleanCompanyLocation = (item = {}) => {
  const parsed = parseJsonIfString(item, item) || {};
  const location = parseJsonIfString(parsed.location, parsed.location) || {};
  const visibility = parseJsonIfString(parsed.visibility, parsed.visibility) || {};

  return {
    country_id: parsed.country_id && mongoose.Types.ObjectId.isValid(String(parsed.country_id)) ? parsed.country_id : null,
    city_id: parsed.city_id && mongoose.Types.ObjectId.isValid(String(parsed.city_id)) ? parsed.city_id : null,
    country: String(parsed.country || parsed.company_country || "").trim(),
    city: String(parsed.city || parsed.company_city || "").trim(),
    address: String(parsed.address || parsed.company_address || "").trim(),
    site_type: ["headquarters", "branch", "representative_office", "remote", "other"].includes(parsed.site_type) ? parsed.site_type : "headquarters",
    location: {
      latitude: location.latitude === "" || location.latitude === undefined ? null : Number(location.latitude),
      longitude: location.longitude === "" || location.longitude === undefined ? null : Number(location.longitude),
    },
    visibility: {
      show_country: parseBool(visibility.show_country ?? parsed.show_country ?? true) !== false,
      show_address: parseBool(visibility.show_address ?? parsed.show_address ?? true) !== false,
      show_map: parseBool(visibility.show_map ?? parsed.show_map ?? true) !== false,
    },
    is_primary: parseBool(parsed.is_primary) === true,
  };
};

const cleanVerificationDocument = (item = {}, keepStatus = false) => {
  const parsed = parseJsonIfString(item, item) || {};

  const doc = {
    type: String(parsed.type || "").trim(),
    file: String(parsed.file || "").trim(),
    note: String(parsed.note || "").trim(),
  };

  if (keepStatus) {
    doc.status = ["pending", "approved", "rejected"].includes(parsed.status)
      ? parsed.status
      : "pending";
  }

  return doc;
};
const normalizeCompanyArrayField = async (section, body = {}) => {
  const raw = normalizeArrayPayload(body, section);

  if (section === "languages") {
    return normalizeCompanyLanguages(body);
  }

  if (section === "social_links") {
    return raw.map(cleanSocialLink).filter((item) => item.type || item.url);
  }

  if (section === "gallery") {
    return raw.map(cleanGalleryItem).filter((item) => item.url);
  }

  if (section === "verification_documents") {
    return raw
      .map((item) => cleanVerificationDocument(item, false))
      .filter((item) => item.file)
      .map((item) => ({
        ...item,
        status: "pending",
        note: "",
      }));
  }

  if (section === "company_locations") {
    return raw.map(cleanCompanyLocation).filter((item) => item.country || item.city || item.address || item.location.latitude != null || item.location.longitude != null);
  }

  return uniqueStringArray(raw);
};

const applyCountryData = async (company, field, value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(String(value))) {
    company[field] = null;
    return;
  }

  const country = await CountryModel.findById(value).lean();
  if (!country) {
    company[field] = null;
    return;
  }

  company[field] = country._id;
  if (field === "country_id") company.company_country = country.country_name_en || company.company_country || "";
  if (field === "city_id") {
    company.company_city = country.city_name_en || company.company_city || "";
    company.company_country = country.country_name_en || company.company_country || "";
  }
};
const normalizeEnglishKeyword = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const buildIndustryKey = (value = "") => {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return base || `industry_${Date.now()}`;
};

const resolveOrCreateIndustry = async (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const industry = await IndustryModel.findById(raw);
    if (industry) return industry;
  }

  const normalizedAr = normalizeArabicKeyword(raw);
  const normalizedEn = normalizeEnglishKeyword(raw);
  const key = buildIndustryKey(raw);

  let industry = await IndustryModel.findOne({
    $or: [
      { key },
      { title_ar: raw },
      { title_en: raw },
      { keywords_ar: normalizedAr },
      { keywords_en: normalizedEn },
    ],
  });

  if (industry) return industry;

  industry = await IndustryModel.create({
    key,
    title_ar: raw,
    title_en: raw,
    keywords_ar: [normalizedAr],
    keywords_en: [normalizedEn],
    is_active: true,
    is_system: false,
  });

  return industry;
};
const buildLanguageKey = (value = "") => {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return base || `language_${Date.now()}`;
};

const resolveOrCreateLanguage = async (value) => {
  const rawValue = parseJsonIfString(value, value);

  const raw =
    typeof rawValue === "object"
      ? String(rawValue.language_id || rawValue._id || rawValue.id || rawValue.name || rawValue.title_en || rawValue.title_ar || "").trim()
      : String(rawValue || "").trim();

  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const language = await LanguageModel.findById(raw);
    if (language) return language;
  }

  const normalizedAr = normalizeArabicKeyword(raw);
  const normalizedEn = normalizeEnglishKeyword(raw);
  const key = buildLanguageKey(raw);

  let language = await LanguageModel.findOne({
    $or: [
      { key },
      { title_ar: raw },
      { title_en: raw },
      { name_ar: raw },
      { name_en: raw },
      { language_name_ar: raw },
      { language_name_en: raw },
      { keywords_ar: normalizedAr },
      { keywords_en: normalizedEn },
    ],
  });

  if (language) return language;

  language = await LanguageModel.create({
    key,
    title_ar: raw,
    title_en: raw,
    keywords_ar: [normalizedAr],
    keywords_en: [normalizedEn],
    is_active: true,
    is_system: false,
  });

  return language;
};

const normalizeCompanyLanguages = async (body = {}) => {
  const raw = normalizeArrayPayload(body, "languages");

  const languageIds = [];

  for (const item of raw) {
    const language = await resolveOrCreateLanguage(item);
    if (language?._id) languageIds.push(String(language._id));
  }

  return [...new Set(languageIds)].map((languageId) => ({
    language_id: languageId,
  }));
};
const applyIndustryData = async (company, value) => {
  const industry = await resolveOrCreateIndustry(value);

  if (!industry) {
    company.industry_id = null;
    company.industry_name = "";
    return;
  }

  company.industry_id = industry._id;
  company.industry_name = industry.title_en || industry.title_ar || "";
};
const applySingleField = async (company, field, value) => {
  if (BOOLEAN_FIELDS.has(field)) {
    company[field] = parseBool(value);
    return;
  }

  if (field === "country_id" || field === "city_id") {
    await applyCountryData(company, field, value);
    return;
  }

  if (field === "industry_id" || field === "industry_name") {
    await applyIndustryData(company, value);
    return;
  }

  if (OBJECT_FIELDS.has(field)) {
    company[field] = parseJsonIfString(value, value) || {};
    return;
  }

  if (OBJECT_ID_SINGLE_FIELDS.has(field)) {
    company[field] = value && mongoose.Types.ObjectId.isValid(String(value)) ? value : null;
    return;
  }
  if (field === "slug") {
    const slug = normalizeSlug(value);

    if (!slug || !SLUG_REGEX.test(slug)) {
      throw new Error("invalid_company_slug");
    }

    company.slug = slug;
    return;
  }

  if (NUMBER_FIELDS.has(field)) {
    company[field] = value === "" || value === null || value === undefined
      ? null
      : Number(value);
    return;
  }

  validateCompanyTextField(field, value);
  company[field] = value;
};



const populateCompanyBase = async (company) => {
  await company.populate([
    { path: "owner_user_id", select: "-password -passcode -another_device_code -pending_device -device" },
    { path: "role_id" },
    { path: "industry_id" },
    { path: "country_id" },
    { path: "city_id" },
    { path: "languages.language_id" },
  ]);
};

export const getMyCompanyProfile = async (req, res, next) => {
  try {
    const company = await getCompanyOrFail(req, res);
    if (!company) return;

    const completion = calculateCompanyProfileCompletion(company);
    if (company.profile_completion !== completion) {
      company.profile_completion = completion;
      await rebuildCompanySearchFilters(company);
      await applyCompanyProjection(company);
      await company.save();
    }

    const missing_items = buildCompanyMissingItems(company);
    const strength = buildCompanyProfileStrength(completion, missing_items);
    const quick_actions = buildCompanyDashboardQuickActions(missing_items);

    return success(res, { company, completion, missing_items, strength, quick_actions, is_completed: missing_items.length === 0 });
  } catch (error) { next(error); }
};

export const getMyCompanyCompletion = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;

    const completion = calculateCompanyProfileCompletion(company);
    if (company.profile_completion !== completion) {
      company.profile_completion = completion;
      await rebuildCompanySearchFilters(company);
      await applyCompanyProjection(company);
      await company.save();
    }

    const missing_items = buildCompanyMissingItems(company);
    const strength = buildCompanyProfileStrength(completion, missing_items);
    return success(res, { completion, missing_items, strength, is_completed: missing_items.length === 0 });
  } catch (error) { next(error); }
};

export const updateBasicCompanyProfile = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const touchedFields = [];

    for (const field of SINGLE_FIELDS) {
      if (req.body[field] !== undefined) {
        await applySingleField(company, field, req.body[field]);
        touchedFields.push(field);
      }
    }

    if (req.body.location !== undefined) {
      const location = parseJsonIfString(req.body.location, req.body.location) || {};
      company.location = {
        latitude: location.latitude === "" || location.latitude === undefined ? null : Number(location.latitude),
        longitude: location.longitude === "" || location.longitude === undefined ? null : Number(location.longitude),
      };
      touchedFields.push("location");
    }

    for (const field of ARRAY_FIELDS) {
      if (req.body[field] !== undefined) {
        company[field] = await normalizeCompanyArrayField(field, req.body);
        touchedFields.push(field);
      }
    }

    await applyCompletionAndSearchFilters(company, touchedFields);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    await populateCompanyBase(company);
    recordCompanyProfileUpdated({ req, company, section: "basic", fields: touchedFields });
    return success(res, company, "company_profile_updated");
  } catch (error) {
    if (error.message === "invalid_company_slug") return fail(res, "invalid_company_slug", 400);
    if (error.code === 11000) return fail(res, "company_unique_field_already_exists", 409, error.keyValue);
    next(error);
  }
};

export const updateCompanyAbout = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const touchedFields = [];
    const fields = ["description", "mission", "vision", "culture"];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
        touchedFields.push(field);
      }
    }
    if (req.body.benefits !== undefined) {
      company.benefits = await normalizeCompanyArrayField("benefits", req.body);
      touchedFields.push("benefits");
    }
    if (req.body.specialties !== undefined) {
      company.specialties = await normalizeCompanyArrayField("specialties", req.body);
      touchedFields.push("specialties");
    }

    await applyCompletionAndSearchFilters(company, touchedFields);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    recordCompanyProfileUpdated({ req, company, section: "about", fields: touchedFields });
    return success(res, company, "company_about_updated");
  } catch (error) { next(error); }
};

export const updateCompanyContact = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const touchedFields = [];
    const fields = ["company_website", "company_email", "company_phone", "company_phone_code", "company_whatsapp", "hr_name", "hr_email", "hr_phone"];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        await applySingleField(company, field, req.body[field]);
        touchedFields.push(field);
      }
    }
    if (req.body.company_contact !== undefined) {
      company.company_contact = await normalizeCompanyArrayField("company_contact", req.body);
      touchedFields.push("company_contact");
    }
    if (req.body.social_links !== undefined) {
      company.social_links = await normalizeCompanyArrayField("social_links", req.body);
      touchedFields.push("social_links");
    }

    await applyCompletionAndSearchFilters(company, touchedFields);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    recordCompanyProfileUpdated({ req, company, section: "contact", fields: touchedFields });
    return success(res, company, "company_contact_updated");
  } catch (error) {
    if (error.code === 11000) return fail(res, "company_unique_field_already_exists", 409, error.keyValue);
    next(error);
  }
};
const getTimezoneFromCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return "";
  }

  try {
    return tz_lookup(lat, lng);
  } catch {
    return "";
  }
};
export const updateCompanyLocation = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const touchedFields = [];
    const fields = ["company_country", "company_city", "company_address", "timezone", "site_type"];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
        touchedFields.push(field);
      }
    }
    if (req.body.country_id !== undefined) {
      await applySingleField(company, "country_id", req.body.country_id);
      touchedFields.push("country_id");
    }
    if (req.body.city_id !== undefined) {
      await applySingleField(company, "city_id", req.body.city_id);
      touchedFields.push("city_id");
    }
    if (req.body.location_visibility !== undefined) {
      await applySingleField(company, "location_visibility", req.body.location_visibility);
      touchedFields.push("location_visibility");
    }
    if (req.body.latitude !== undefined || req.body.longitude !== undefined || req.body.location !== undefined) {
      const location = parseJsonIfString(req.body.location, req.body.location) || {};
      const latitude = req.body.latitude ?? location.latitude;
      const longitude = req.body.longitude ?? location.longitude;
      const lat =
        latitude === "" || latitude === undefined || latitude === null
          ? null
          : Number(latitude);

      const lng =
        longitude === "" || longitude === undefined || longitude === null
          ? null
          : Number(longitude);

      company.location = {
        latitude: lat,
        longitude: lng,
      };

      touchedFields.push("location");

      const timezone = getTimezoneFromCoordinates(lat, lng);

      if (timezone) {
        company.timezone = timezone;
        touchedFields.push("timezone");
      }
    }

    await applyCompletionAndSearchFilters(company, touchedFields);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    await company.populate([{ path: "country_id" }, { path: "city_id" }]);
    recordCompanyProfileUpdated({ req, company, section: "location", fields: touchedFields });
    return success(res, company, "company_location_updated");
  } catch (error) { next(error); }
};

export const updateCompanyMedia = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;

    const touchedFields = [];

    const logoFile = req.files?.logo?.[0];
    const coverFile = req.files?.cover_image?.[0];

    if (logoFile) {
      const oldLogo = company.logo;

      const uploaded = await processUploadImage(logoFile, {
        targetDir: "company",
        webpQuality: 82,
      });

      company.logo = uploaded;
      touchedFields.push("logo");

      if (oldLogo) await deleteImage(oldLogo);
    }

    if (coverFile) {
      const oldCover = company.cover_image;

      const uploaded = await processUploadImage(coverFile, {
        targetDir: "company",
        webpQuality: 82,
      });

      company.cover_image = uploaded;
      touchedFields.push("cover_image");

      if (oldCover) await deleteImage(oldCover);
    }

    await applyCompletionAndSearchFilters(company, touchedFields);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);

    await company.populate(companyPopulate);

    recordCompanyProfileUpdated({ req, company, section: "media", fields: touchedFields });
    return success(res, company, "company_media_updated_successfully");
  } catch (error) {
    next(error);
  }
};

export const listCompanyFiles = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;

    return success(res, serializeCompanyFiles(company), "company_files_loaded");
  } catch (error) {
    next(error);
  }
};

export const uploadCompanyFile = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) {
      if (req.file?.filename) await deleteCompanyUploadedFile(req.file.filename);
      return;
    }

    const filename = normalizeCompanyFileName(req.file?.filename);
    if (!filename) return fail(res, "company_file_missing", 400);

    const ext = path.extname(filename).toLowerCase();
    if (!COMPANY_FILE_EXTENSIONS.has(ext)) {
      await deleteCompanyUploadedFile(filename);
      return fail(res, "unsupported_company_file_type", 400);
    }

    const files = Array.isArray(company.files) ? company.files : [];
    if (files.length >= MAX_COMPANY_FILES) {
      await deleteCompanyUploadedFile(filename);
      return fail(res, "company_file_limit_reached", 400);
    }

    company.files = [...files, filename];
    company.markModified("files");

    await applyCompletionAndSearchFilters(company, ["files"]);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);

    recordCompanyProfileUpdated({ req, company, section: "files", fields: ["files"] });
    return success(res, serializeCompanyFiles(company), "company_file_uploaded", 201);
  } catch (error) {
    if (req.file?.filename) await deleteCompanyUploadedFile(req.file.filename);
    next(error);
  }
};

export const deleteCompanyFile = async (req, res, next) => {
  try {
    const filename = normalizeCompanyFileName(req.params?.filename);
    if (!filename) return fail(res, "company_file_missing", 400);

    const company = await getCompanyPlain(req, res);
    if (!company) return;

    const files = Array.isArray(company.files) ? company.files : [];
    if (!files.includes(filename)) {
      return fail(res, "company_file_not_found", 404);
    }

    await deleteCompanyUploadedFile(filename);
    company.files = files.filter((item) => item !== filename);
    company.markModified("files");

    await applyCompletionAndSearchFilters(company, ["files"]);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);

    recordCompanyProfileUpdated({ req, company, section: "files", fields: ["files"] });
    return success(res, serializeCompanyFiles(company), "company_file_deleted");
  } catch (error) {
    next(error);
  }
};

export const downloadCompanyFile = async (req, res, next) => {
  try {
    const filename = normalizeCompanyFileName(req.params?.filename);
    if (!filename) return fail(res, "company_file_missing", 400);

    const company = await getCompanyPlain(req, res);
    if (!company) return;

    const files = Array.isArray(company.files) ? company.files : [];
    if (!files.includes(filename)) {
      return fail(res, "company_file_not_found", 404);
    }

    const filePath = buildCompanyFilePath(filename);
    if (!existsSync(filePath)) {
      return fail(res, "company_file_not_found_on_server", 404);
    }

    return res.download(filePath, filename, (error) => {
      if (error) return next(error);
      writeAuditLog({
        req,
        companyId: company._id,
        actorUserId: req.user?._id || req.auth?.userId || company.owner_user_id,
        actorType: companyActorType(req),
        action: "company_file_downloaded",
        entityType: "company",
        entityId: company._id,
        metadata: {
          filename,
          extension: path.extname(filename).toLowerCase(),
          profile_file: true,
        },
      }).catch(() => null);
    });
  } catch (error) {
    next(error);
  }
};

export const replaceSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    if (!ARRAY_FIELDS.has(section) && !SINGLE_FIELDS.has(section) && !OBJECT_FIELDS.has(section) && section !== "location") return fail(res, "invalid_company_section", 400);

    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const touchedFields = [section];

    if (ARRAY_FIELDS.has(section)) {
      company[section] = await normalizeCompanyArrayField(section, req.body);
    } else if (section === "location") {
      const location = parseJsonIfString(req.body.location, req.body) || {};
      company.location = {
        latitude: location.latitude === "" || location.latitude === undefined ? null : Number(location.latitude),
        longitude: location.longitude === "" || location.longitude === undefined ? null : Number(location.longitude),
      };
    } else if (OBJECT_FIELDS.has(section)) {
      company[section] = parseJsonIfString(req.body[section], req.body) || {};
    } else {
      await applySingleField(company, section, req.body?.[section] !== undefined ? req.body[section] : req.body);
    }

    await applyCompletionAndSearchFilters(company, touchedFields);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    recordCompanyProfileUpdated({ req, company, section, fields: touchedFields });
    return success(res, company, `${section}_replaced`);
  } catch (error) {
    if (error.message === "invalid_company_slug") return fail(res, "invalid_company_slug", 400);
    if (error.code === 11000) return fail(res, "company_unique_field_already_exists", 409, error.keyValue);
    next(error);
  }
};

export const addSectionItems = async (req, res, next) => {
  try {
    const { section } = req.params;
    if (!ARRAY_FIELDS.has(section)) return fail(res, "invalid_company_section", 400);

    const company = await getCompanyPlain(req, res);
    if (!company) return;
    const items = await normalizeCompanyArrayField(section, req.body);
    if (!items.length) return fail(res, "no_items_provided", 400);

    if (["social_links", "gallery", "verification_documents", "company_locations"].includes(section)) {
      company[section].push(...items);
    } else {
      company[section] = [...new Set([...(company[section] || []), ...items])];
    }

    await applyCompletionAndSearchFilters(company, [section]);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    recordCompanyProfileUpdated({ req, company, section, fields: [section] });
    return success(res, company[section], `${section}_items_added`, 201);
  } catch (error) { next(error); }
};

export const updateSectionItem = async (req, res, next) => {
  try {
    const { section, itemId } = req.params;
    if (!ARRAY_FIELDS.has(section)) return fail(res, "invalid_company_section", 400);

    const company = await getCompanyPlain(req, res);
    if (!company) return;

    if (["social_links", "gallery", "verification_documents", "company_locations"].includes(section)) {
      const item = company[section].id?.(itemId);
      if (!item) return fail(res, "company_section_item_not_found", 404);
      if (section === "social_links") item.set(cleanSocialLink(req.body));
      if (section === "gallery") item.set(cleanGalleryItem(req.body));
      if (section === "verification_documents") item.set(cleanVerificationDocument(req.body));
      if (section === "company_locations") item.set(cleanCompanyLocation(req.body));
    } else {
      return fail(res, "section_item_update_not_supported_for_scalar_arrays", 422);
    }

    await applyCompletionAndSearchFilters(company, [section]);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    recordCompanyProfileUpdated({ req, company, section, fields: [section] });
    return success(res, company[section], `${section}_item_updated`);
  } catch (error) { next(error); }
};

export const deleteSectionItem = async (req, res, next) => {
  try {
    const { section, itemId } = req.params;

    if (!ARRAY_FIELDS.has(section)) {
      return fail(res, "invalid_company_section", 400);
    }

    const company = await getCompanyPlain(req, res);
    if (!company) return;

    const currentLength = company[section]?.length || 0;

    if (["social_links", "gallery", "verification_documents", "company_locations"].includes(section)) {
      company[section] = (company[section] || []).filter(
        (item) => String(item._id) !== String(itemId)
      );
    } else if (section === "languages") {
      company.languages = (company.languages || []).filter(
        (item) =>
          String(item._id) !== String(itemId) &&
          String(item.language_id) !== String(itemId)
      );
    } else {
      company[section] = (company[section] || []).filter(
        (value) => String(value) !== String(itemId)
      );
    }

    const newLength = company[section]?.length || 0;

    if (newLength === currentLength) {
      return fail(res, "company_section_item_not_found", 404);
    }

    company.markModified(section);

    await applyCompletionAndSearchFilters(company, [section]);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);

    recordCompanyProfileUpdated({ req, company, section, fields: [section] });
    return success(res, company, `${section}_item_deleted`);
  } catch (error) {
    next(error);
  }
};
export const getMyBasicCompanyProfile = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;

    await company.populate("owner_user_id", "-password -passcode -another_device_code -pending_device -device");

    return success(res, {
      user: {
        id: company.owner_user_id?._id,
        first_name: company.owner_user_id?.first_name,
        mid_name: company.owner_user_id?.mid_name,
        last_name: company.owner_user_id?.last_name,
        email: company.owner_user_id?.email,
        phone_code: company.owner_user_id?.phone_code,
        phone: company.owner_user_id?.phone_national,
        gender: company.owner_user_id?.gender,
        image: company.owner_user_id?.image,
        status: company.owner_user_id?.status,
      },
      company: {
        id: company._id,
        company_name: company.company_name,
        slug: company.slug,
        company_email: company.company_email,
        image: company.logo || company.image,
        logo: company.logo,
        cover_image: company.cover_image,
        industry_name: company.industry_name,
        country_id: company.country_id,
        city_id: company.city_id,
        company_country: company.company_country,
        company_city: company.company_city,
        status: company.status,
        accepted: company.accepted,
        is_verified: company.is_verified,
        is_hiring: company.is_hiring,
        profile_completion: company.profile_completion,
      },
    });
  } catch (error) { next(error); }
};


export const updateMyCompanyUserProfile = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;

    const user = await UserModel.findById(company.owner_user_id);
    if (!user) return fail(res, "company_owner_user_not_found", 404);

    let revokeAllSessions = false;

    ["first_name", "mid_name", "last_name", "gender"].forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (req.body.email !== undefined) {
      const nextEmail = String(req.body.email || "").trim().toLowerCase();
      if (nextEmail && !EMAIL_REGEX.test(nextEmail)) {
        return fail(res, "invalid_email", 400);
      }
      if (nextEmail && nextEmail !== user.email) {
        user.email = nextEmail;
        revokeAllSessions = true;
      }
    }

    if (req.body.password !== undefined && String(req.body.password || "").trim()) {
      const nextPassword = String(req.body.password);
      if (!STRONG_PASSWORD_REGEX.test(nextPassword)) {
        return fail(res, "weak_password", 400);
      }
      user.password = await bcryptjs.hash(nextPassword, 10);
      revokeAllSessions = true;
    }

    if (req.body.phone !== undefined || req.body.phone_number !== undefined) {
      const national = String(req.body.phone ?? req.body.phone_number ?? "").replace(/[^0-9]/g, "");
      const code = String(req.body.phone_code || user.phone_code || "").replace(/[^0-9]/g, "");
      if (national && code) {
        user.phone_code = code;
        user.phone_national = national;
        user.phone_country = code;
        user.phone_e164 = `+${code}${national}`;
        user.phone = `${code}${national}`;
      }
    }

    const imageFile = req.file || req.files?.image?.[0];
    if (imageFile) {
      const oldImage = user.image;
      user.image = await processUploadImage(imageFile, { targetDir: "users", webpQuality: 82 });
      if (oldImage) await deleteImage(oldImage);
    }

    await user.save();

    if (revokeAllSessions) {
      await RefreshTokenModel.deleteMany({ userRef: user._id });
    }

    return success(res, {
      id: user._id,
      first_name: user.first_name,
      mid_name: user.mid_name,
      last_name: user.last_name,
      email: user.email,
      phone_code: user.phone_code,
      phone: user.phone_national,
      gender: user.gender,
      image: user.image,
      status: user.status,
      require_relogin: revokeAllSessions,
    }, "company_user_profile_updated");
  } catch (error) {
    if (error.code === 11000) return fail(res, "user_unique_field_already_exists", 409, error.keyValue);
    next(error);
  }
};

export const getMySection = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (
      !ARRAY_FIELDS.has(section) &&
      !SINGLE_FIELDS.has(section) &&
      section !== "location"
    ) {
      return fail(res, "invalid_company_section", 400);
    }

    const company = await getCompanyPlain(req, res);
    if (!company) return;

    if (section === "location") {
      return success(res, company.location, `${section}_section`);
    }

    if (section === "languages") {
      await company.populate({
        path: "languages.language_id",
      });

      return success(res, company.languages, "languages_section");
    }

    return success(res, company[section], `${section}_section`);
  } catch (error) {
    next(error);
  }
};

export const rebuildMyCompanySearchFilters = async (req, res, next) => {
  try {
    const company = await getCompanyPlain(req, res);
    if (!company) return;

    company.profile_completion = calculateCompanyProfileCompletion(company);
    await rebuildCompanySearchFilters(company);
    await applyCompanyProjection(company);
    await company.save();
    await rebuildCompanyJobsProjection(company._id);
    return success(res, company.search_filters, "company_search_filters_rebuilt");
  } catch (error) { next(error); }
};

export default {
  getMyCompanyProfile,
  getMyCompanyCompletion,
  updateBasicCompanyProfile,
  updateCompanyAbout,
  updateCompanyContact,
  updateCompanyLocation,
  updateCompanyMedia,
  listCompanyFiles,
  uploadCompanyFile,
  deleteCompanyFile,
  downloadCompanyFile,
  replaceSection,
  addSectionItems,
  updateSectionItem,
  deleteSectionItem,
  getMyBasicCompanyProfile,
  updateMyCompanyUserProfile,
  getMySection,
  rebuildMyCompanySearchFilters,
};
