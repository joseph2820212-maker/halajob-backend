import mongoose from "mongoose";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import {
  CampusEventModel,
  CampusEventRegistrationModel,
  CampusOpportunityModel,
  AuditLogModel,
  CompanyModel,
  EmployeeModel,
  PageModel,
  UniversityModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  InterviewModel,
  JobZainTalentRequestModel,
  LearningResourceModel,
  StudentVerificationModel,
  UniversityMembershipModel,
  UniversityOpportunityRequestModel,
  UserModel,
  jobsModel,
} from "../../../models/index.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";
import {
  defaultUniversityPermissionsForRole,
  syncAccountContextsForUser,
} from "../../../services/accountContext.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";
import { getCareerPassportSafeViewForEmployee } from "../../../services/careerPassport.service.js";
import {
  attachProgress,
  mergeResourceFilters,
  resourceAudienceFilter,
  resourceSearchFilter,
  resolveStudentProfile,
  serializeResource,
  universityIdFromEmployee,
  visibleResourceFilter,
} from "../../../services/resources/learningResource.service.js";
import {
  campusEventRegisteredNotification,
  campusVerificationApprovedNotification,
  campusVerificationMoreInfoNotification,
  campusVerificationRejectedNotification,
} from "../../../notification/CampusNotifications.js";

const { isValidObjectId } = mongoose;
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const PRIVATE_VERIFICATION_DOCUMENT_DIR = path.resolve(
  UPLOADS_ROOT,
  "files",
  "student-verifications",
);
const VERIFICATION_DOCUMENT_PREFIX = "uploads/files/student-verifications";
const LEGACY_UPLOAD_PREFIX = "uploads";
const VERIFICATION_DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
  deleted_at: null,
};

const allowedTargets = new Set([
  "all",
  "students",
  "graduates",
  "fresh_graduates",
]);

const PARTNER_ACCESS_LEVELS = new Set([
  "jobs_only",
  "applicants_only",
  "talent_pool_limited",
]);

const CAMPUS_VISIBLE_FIELD_DEFAULTS = {
  contact: false,
  cv: false,
  projects: true,
  gpa: false,
};

const normalizeLimit = (value, fallback = 12, max = 50) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(Math.floor(number), max);
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "undefined" || value === null || value === "")
    return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const toStringArray = (value) => {
  if (Array.isArray(value))
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const uniqueStringArray = (value) => [...new Set(toStringArray(value))];
const cleanText = (value) => String(value || "").trim();
const normalizePartnerAccessLevel = (value) => {
  const accessLevel = cleanText(value).toLowerCase();
  return PARTNER_ACCESS_LEVELS.has(accessLevel)
    ? accessLevel
    : "talent_pool_limited";
};
const normalizeCampusOpportunityTarget = (value) => {
  const target = cleanText(value).toLowerCase();
  return target === "fresh_graduates" || target === "graduates"
    ? "fresh_graduates"
    : "students";
};
const campusCandidateTargets = (target) =>
  target === "fresh_graduates" ? ["fresh_graduates"] : ["students"];
const normalizeEmail = (value) => cleanText(value).toLowerCase();
const idOf = (value) => value?._id || value || null;
const UNIVERSITY_MEMBER_ROLES = new Set([
  "owner",
  "admin",
  "career_center",
  "advisor",
  "viewer",
]);
const UNIVERSITY_MEMBER_STATUSES = new Set([
  "active",
  "invited",
  "suspended",
  "removed",
]);
const CAMPUS_EVENT_STATUSES = new Set([
  "draft",
  "published",
  "archived",
  "cancelled",
]);
const CAMPUS_EVENT_VISIBILITIES = new Set(["public", "campus"]);

const normalizeUniversityMemberRole = (value) => {
  const role = cleanText(value).toLowerCase();
  return UNIVERSITY_MEMBER_ROLES.has(role) ? role : "career_center";
};

const normalizeUniversityMemberStatus = (value, fallback = "active") => {
  const status = cleanText(value).toLowerCase();
  return UNIVERSITY_MEMBER_STATUSES.has(status) ? status : fallback;
};

const normalizeCampusEventStatus = (value, fallback = "draft") => {
  const status = cleanText(value).toLowerCase();
  return CAMPUS_EVENT_STATUSES.has(status) ? status : fallback;
};

const normalizeCampusEventVisibility = (value, fallback = "campus") => {
  const visibility = cleanText(value).toLowerCase();
  return CAMPUS_EVENT_VISIBILITIES.has(visibility) ? visibility : fallback;
};

const campusEventSlug = (value = "", fallback = "campus-event") => {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};

const buildCampusEventId = ({ university, title }) => {
  const universityPart = String(university?._id || "global").slice(-6);
  const titlePart = campusEventSlug(title, "event");
  const suffix = Date.now().toString(36);
  return `university-${universityPart}-${titlePart}-${suffix}`;
};

const numberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const campusEventQueryForScope = (scope, eventId = null) => {
  const query = {};
  if (!scope?.superAdmin) query.university_id = scope?.university?._id || null;
  if (scope?.superAdmin && scope?.university?._id)
    query.university_id = scope.university._id;
  if (eventId) query._id = eventId;
  return query;
};

const serializeCampusEvent = (event = {}) => ({
  id: String(event._id || ""),
  _id: event._id,
  university_id: idOf(event.university_id),
  event_id: event.event_id || "",
  title: event.title || "",
  summary: event.summary || "",
  description: event.description || "",
  organizer: event.organizer || "",
  host: event.organizer || "",
  kind: event.kind || "",
  tag: event.kind || event.mode || "",
  mode: event.mode || "",
  date_label: event.date_label || "",
  meta: [event.date_label, event.mode, event.location].filter(Boolean).join(" | "),
  start_at: event.start_at || null,
  end_at: event.end_at || null,
  location: event.location || "",
  campus_name: event.campus_name || "",
  registration_url: event.registration_url || "",
  capacity: event.capacity ?? null,
  registered_count: Number(event.registered_count || 0),
  featured: event.featured === true,
  tags: event.tags || [],
  bullets: event.bullets || [],
  status: event.status || "draft",
  visibility: event.visibility || "campus",
  sort_order: Number(event.sort_order || 0),
  source: "campus_events",
  created_at: event.createdAt || null,
  updated_at: event.updatedAt || null,
});

const findPublishedCampusEvent = async (eventId) => {
  const normalizedId = cleanText(eventId).toLowerCase();
  if (!normalizedId) return null;
  const clauses = [{ event_id: normalizedId }];
  if (isValidObjectId(normalizedId)) clauses.push({ _id: normalizedId });
  return CampusEventModel.findOne({
    status: "published",
    $or: clauses,
  }).lean();
};

const permissionsForUniversityRole = (role, provided = undefined) => {
  const permissions = uniqueStringArray(provided);
  return permissions.length
    ? permissions
    : defaultUniversityPermissionsForRole(role);
};

const toStoredUploadPath = (relativePath = "") =>
  String(relativePath || "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");

const persistPrivateVerificationDocument = async (file) => {
  if (!file?.filename || !file?.path) return "";
  const extension = path.extname(file.filename).toLowerCase();
  if (!VERIFICATION_DOCUMENT_EXTENSIONS.has(extension)) return "";

  const safeName = path.basename(file.filename).replace(/["\\]/g, "_");
  const sourcePath = path.resolve(file.path);
  const destinationPath = path.resolve(
    PRIVATE_VERIFICATION_DOCUMENT_DIR,
    safeName,
  );
  if (
    !sourcePath.startsWith(UPLOADS_ROOT + path.sep) ||
    !destinationPath.startsWith(PRIVATE_VERIFICATION_DOCUMENT_DIR + path.sep)
  ) {
    return "";
  }

  await fs.mkdir(PRIVATE_VERIFICATION_DOCUMENT_DIR, { recursive: true });
  await fs.rename(sourcePath, destinationPath);
  return `${VERIFICATION_DOCUMENT_PREFIX}/${safeName}`;
};

const normalizeVerificationDocumentUrl = (value = "") => {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^https:\/\//i.test(raw)) return raw;

  const stored = toStoredUploadPath(raw);
  if (stored.startsWith(`${VERIFICATION_DOCUMENT_PREFIX}/`)) return stored;
  return "";
};

const resolveVerificationDocumentPath = (documentUrl = "") => {
  const stored = toStoredUploadPath(documentUrl);
  if (!stored || /^https?:\/\//i.test(stored) || stored.includes(".."))
    return null;

  const relative = stored.startsWith(`${VERIFICATION_DOCUMENT_PREFIX}/`)
    ? stored.slice(VERIFICATION_DOCUMENT_PREFIX.length + 1)
    : stored.startsWith(`${LEGACY_UPLOAD_PREFIX}/`)
      ? stored.slice(LEGACY_UPLOAD_PREFIX.length + 1)
      : "";
  if (!relative || relative.includes("/") || relative.includes("\\"))
    return null;

  const extension = path.extname(relative).toLowerCase();
  if (!VERIFICATION_DOCUMENT_EXTENSIONS.has(extension)) return null;

  const baseDir = stored.startsWith(`${VERIFICATION_DOCUMENT_PREFIX}/`)
    ? PRIVATE_VERIFICATION_DOCUMENT_DIR
    : UPLOADS_ROOT;
  const filePath = path.resolve(baseDir, relative);
  if (!filePath.startsWith(baseDir + path.sep)) return null;
  return filePath;
};

const sendVerificationDocumentFile = async ({
  req,
  res,
  verification,
  actorType,
}) => {
  const filePath = resolveVerificationDocumentPath(verification?.document_url);
  if (!filePath) {
    return ReturnAppData.getError({
      res,
      status: 404,
      message: "student_verification_document_not_found",
    });
  }

  try {
    await fs.access(filePath);
  } catch {
    return ReturnAppData.getError({
      res,
      status: 404,
      message: "student_verification_document_not_found",
    });
  }

  await writeAuditLog({
    req,
    actorUserId: req.user?._id,
    actorType,
    action: "campus_verification_document_downloaded",
    entityType: "other",
    entityId: verification._id,
    newValue: {
      university_id: verification.university_id,
      has_document: true,
    },
  });

  const safeName = path.basename(filePath).replace(/["\\]/g, "_");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
  return res.sendFile(filePath);
};

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hashVerificationCode = ({ code, userId }) =>
  crypto
    .createHash("sha256")
    .update(`${code}:${userId}:${process.env.JWT_SECRET}`)
    .digest("hex");

// Keep student verification aligned with the mobile/auth 5-digit OTP input.
// The stored value is already HMAC-hashed via hashVerificationCode below.
const createVerificationCode = () => String(crypto.randomInt(10000, 100000));

const normalizeVerificationMethod = (value) => {
  const method = cleanText(value).toLowerCase();
  if (["email", "document", "invite_code", "manual"].includes(method))
    return method;
  return "email";
};

const normalizeGraduationYear = (value) => {
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  const rounded = Math.floor(year);
  return rounded >= 1900 && rounded <= 2200 ? rounded : null;
};

const ACADEMIC_YEAR_VALUES = new Set([
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "diploma",
  "postgraduate",
  "internship",
  "graduated",
]);

const normalizeAcademicYear = (value) => {
  const academicYear = cleanText(value).toLowerCase();
  return ACADEMIC_YEAR_VALUES.has(academicYear) ? academicYear : "";
};

const publicUniversity = (university = {}) => ({
  id: String(university._id || ""),
  _id: university._id,
  name: university.name || "",
  name_en: university.name_en || university.name || "",
  logo: university.logo || "",
  city: university.city || "",
  country: university.country || "",
  email_domain: university.email_domain || "",
  verified: university.verified === true,
  status: university.status || "pending",
  campuses: university.campuses || [],
});

const campusVisibilityFromProfile = (profile = {}) => {
  const visibility = profile.campus_visibility || {};
  const visibleFields = visibility.visible_fields || {};
  return {
    talent_pool_opt_in: visibility.talent_pool_opt_in === true,
    visible_to_partner_companies:
      visibility.visible_to_partner_companies === true,
    visible_fields: {
      contact: visibleFields.contact === true,
      cv: visibleFields.cv === true,
      projects:
        typeof visibleFields.projects === "undefined"
          ? true
          : visibleFields.projects === true,
      gpa: visibleFields.gpa === true,
    },
    opted_in_at: visibility.opted_in_at || null,
    opted_out_at: visibility.opted_out_at || null,
  };
};

const serializeCampusTalentVisibility = (employee = {}) => {
  const profile = employee.student_profile || {};
  const visibility = campusVisibilityFromProfile(profile);
  return {
    employee_id: employee._id || null,
    is_student: employee.is_student === true,
    verified: profile.student_email_verified === true,
    university: profile.university || "",
    university_id: profile.university_id || employee.university_id || null,
    specialty: profile.specialty || "",
    academic_year: profile.academic_year || "",
    campus_visibility: visibility,
    legacy_visibility: {
      campus_discovery_visibility:
        profile.campus_discovery_visibility || "partner_companies",
      contact_visibility: profile.contact_visibility || "hidden",
      cv_visibility: profile.cv_visibility || "hidden",
    },
  };
};

const campusVisibilityUpdateFromBody = (body = {}, currentVisibility = {}) => {
  const currentFields = currentVisibility.visible_fields || {};
  const submittedFields =
    body.visible_fields && typeof body.visible_fields === "object"
      ? body.visible_fields
      : {};
  const talentOptIn = normalizeBoolean(
    body.talent_pool_opt_in ?? body.opt_in ?? body.enabled,
    currentVisibility.talent_pool_opt_in === true,
  );
  const visibleToPartnerCompanies = talentOptIn
    ? normalizeBoolean(
        body.visible_to_partner_companies ??
          body.partner_companies ??
          body.visible_to_partners,
        currentVisibility.visible_to_partner_companies === true ||
          typeof body.talent_pool_opt_in !== "undefined" ||
          typeof body.opt_in !== "undefined",
      )
    : false;
  const visibleFields = {
    contact: normalizeBoolean(
      submittedFields.contact ?? body.contact_visible,
      currentFields.contact === true,
    ),
    cv: normalizeBoolean(
      submittedFields.cv ?? body.cv_visible,
      currentFields.cv === true,
    ),
    projects: normalizeBoolean(
      submittedFields.projects ?? body.projects_visible,
      typeof currentFields.projects === "undefined"
        ? CAMPUS_VISIBLE_FIELD_DEFAULTS.projects
        : currentFields.projects === true,
    ),
    gpa: normalizeBoolean(
      submittedFields.gpa ?? body.gpa_visible,
      currentFields.gpa === true,
    ),
  };
  const now = new Date();

  return {
    talent_pool_opt_in: talentOptIn,
    visible_to_partner_companies: visibleToPartnerCompanies,
    visible_fields: visibleFields,
    opted_in_at: talentOptIn
      ? currentVisibility.opted_in_at || now
      : currentVisibility.opted_in_at || null,
    opted_out_at: talentOptIn ? null : now,
  };
};

const activeTalentPoolPartnerElemMatch = (companyId, now = new Date()) => ({
  company_id: companyId,
  status: "active",
  $and: [
    {
      $or: [
        { expires_at: null },
        { expires_at: { $exists: false } },
        { expires_at: { $gt: now } },
      ],
    },
    {
      $or: [
        { access_level: "talent_pool_limited" },
        { access_level: "" },
        { access_level: { $exists: false } },
      ],
    },
  ],
});

const partnerIsActiveForTalentPool = (partner = {}, now = new Date()) => {
  if (partner.status !== "active") return false;
  const expiresAt = partner.expires_at ? new Date(partner.expires_at) : null;
  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt <= now)
    return false;
  const accessLevel = cleanText(partner.access_level || "talent_pool_limited");
  return !accessLevel || accessLevel === "talent_pool_limited";
};

const activePartnerUniversitiesForCompany = (companyId, select = "_id name name_en") =>
  UniversityModel.find({
    status: { $ne: "suspended" },
    partners: { $elemMatch: activeTalentPoolPartnerElemMatch(companyId) },
  })
    .select(select)
    .lean();

const normalizeUniversityCreatePayload = (body = {}) => {
  const name = cleanText(body.name || body.name_en);
  const emailDomain = cleanText(body.email_domain)
    .toLowerCase()
    .replace(/^@+/, "");
  const careerCenterEmail =
    cleanText(body.career_center_email).toLowerCase() ||
    (emailDomain ? `careers@${emailDomain}` : "");
  const status = ["active", "pending", "suspended"].includes(
    cleanText(body.status).toLowerCase(),
  )
    ? cleanText(body.status).toLowerCase()
    : "pending";
  const studentsCount = Number(body.students_count || 0);

  return {
    name,
    name_en: cleanText(body.name_en || name),
    logo: cleanText(body.logo),
    city: cleanText(body.city),
    country: cleanText(body.country),
    email_domain: emailDomain,
    career_center_email: careerCenterEmail,
    status,
    verified: status === "active",
    students_count:
      Number.isFinite(studentsCount) && studentsCount >= 0
        ? Math.floor(studentsCount)
        : 0,
  };
};

const getEmployee = async (req) =>
  EmployeeModel.findOne({ user_id: req.user._id })
    .populate({
      path: "user_id",
      select: "first_name mid_name last_name email image",
    })
    .lean();

const getCompanyForRequest = async (req, select = "") => {
  if (req.company?._id) {
    const query = CompanyModel.findById(req.company._id);
    return (select ? query.select(select) : query).lean();
  }

  const query = CompanyModel.findOne(buildCompanyOwnerQuery(req.user._id));
  return (select ? query.select(select) : query).lean();
};

const getEmailDomain = (email = "") =>
  String(email).trim().toLowerCase().split("@")[1] || "";

const isAcademicDomain = (domain = "") =>
  domain.endsWith(".edu") ||
  domain.includes(".edu.") ||
  domain.endsWith(".ac") ||
  domain.includes(".ac.");

const titleFromDomain = (domain = "") =>
  String(domain || "")
    .split(".")[0]
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "University";

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUniversityForRequest = async (req) => {
  const email = String(req.user?.email || "")
    .trim()
    .toLowerCase();
  const domain = getEmailDomain(email);
  if (!domain) return null;
  return UniversityModel.findOne({
    $or: [{ email_domain: domain }, { career_center_email: email }],
    status: { $ne: "suspended" },
  }).lean();
};

const ensureUniversityForRequest = async (req) => {
  const existing = await getUniversityForRequest(req);
  if (existing) return existing;
  const email = String(req.user?.email || "")
    .trim()
    .toLowerCase();
  const domain = getEmailDomain(email);
  if (!domain || !isAcademicDomain(domain)) return null;
  const existingAnyStatus = await UniversityModel.findOne({
    $or: [{ email_domain: domain }, { career_center_email: email }],
  }).lean();
  if (existingAnyStatus)
    return existingAnyStatus.status === "suspended" ? null : existingAnyStatus;
  return UniversityModel.findOneAndUpdate(
    { email_domain: domain },
    {
      $setOnInsert: {
        name: titleFromDomain(domain),
        name_en: titleFromDomain(domain),
        email_domain: domain,
        career_center_email: email,
        status: "pending",
        verified: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
};

const getCareerCenterUniversityForRequest = async (req) => {
  const email = String(req.user?.email || "")
    .trim()
    .toLowerCase();
  if (!email) return null;

  return UniversityModel.findOne({
    career_center_email: email,
    status: { $ne: "suspended" },
  }).lean();
};

const getUniversityByRef = async (refInput) => {
  const ref = cleanText(refInput);
  if (!ref) return null;
  const refLower = ref.toLowerCase().replace(/^@+/, "");
  if (isValidObjectId(ref)) {
    return UniversityModel.findOne({
      _id: ref,
      status: { $ne: "suspended" },
    }).lean();
  }

  return UniversityModel.findOne({
    status: { $ne: "suspended" },
    $or: [
      { email_domain: refLower },
      { career_center_email: refLower },
      { name: new RegExp(`^${escapeRegExp(ref)}$`, "i") },
      { name_en: new RegExp(`^${escapeRegExp(ref)}$`, "i") },
    ],
  }).lean();
};

const getUniversityForVerificationBody = async (body = {}) => {
  const ref =
    body.university_id ||
    body.university_ref ||
    body.university ||
    body.email_domain ||
    body.domain;
  return getUniversityByRef(ref);
};

const getUniversityAdminScope = async (req) => {
  const activeContext = req.activeContext || {};

  if (
    activeContext.context_type === "super_admin" &&
    activeContext.status === "active"
  ) {
    const requestedUniversity = await getUniversityByRef(
      req.query?.university_id || req.body?.university_id,
    );
    return { superAdmin: true, university: requestedUniversity || null };
  }

  if (
    activeContext.context_type === "university_admin" &&
    activeContext.status === "active" &&
    isValidObjectId(activeContext.entity_id)
  ) {
    const university = await UniversityModel.findOne({
      _id: activeContext.entity_id,
      status: { $ne: "suspended" },
    }).lean();
    if (!university) return null;

    const membership = await UniversityMembershipModel.exists({
      user_id: req.user._id,
      university_id: university._id,
      status: "active",
    });
    const isCareerCenter =
      normalizeEmail(university.career_center_email) ===
      normalizeEmail(req.user?.email);
    if (membership || isCareerCenter) {
      return { superAdmin: false, university };
    }
  }

  const careerCenterUniversity = await getCareerCenterUniversityForRequest(req);
  if (careerCenterUniversity)
    return { superAdmin: false, university: careerCenterUniversity };
  return null;
};

const serializeUniversityMember = (membership = {}) => {
  const user =
    membership.user_id && typeof membership.user_id === "object"
      ? membership.user_id
      : null;
  const university =
    membership.university_id && typeof membership.university_id === "object"
      ? membership.university_id
      : null;

  return {
    id: String(membership._id || ""),
    _id: membership._id,
    university_id: idOf(membership.university_id),
    university: university ? publicUniversity(university) : null,
    user_id: idOf(membership.user_id),
    user: user
      ? {
          _id: user._id,
          first_name: user.first_name || "",
          mid_name: user.mid_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          image: user.image || null,
        }
      : null,
    role: membership.role || "career_center",
    permissions: membership.permissions || [],
    status: membership.status || "active",
    invited_by: membership.invited_by || null,
    accepted_at: membership.accepted_at || null,
    created_at: membership.createdAt || null,
    updated_at: membership.updatedAt || null,
  };
};

const universityMembershipQueryForScope = (scope, memberId = null) => {
  const query = {};
  if (!scope?.superAdmin) query.university_id = scope?.university?._id || null;
  if (scope?.superAdmin && scope?.university?._id)
    query.university_id = scope.university._id;
  if (memberId) query._id = memberId;
  return query;
};

const requireScopedUniversityForMutation = async (req, scope) => {
  if (scope?.university?._id) return scope.university;
  if (!scope?.superAdmin) return null;
  return getUniversityByRef(
    req.body?.university_id || req.query?.university_id,
  );
};

const ensureUniversityOwnerStillExists = async ({
  universityId,
  currentMemberId,
  nextRole = null,
  nextStatus = null,
}) => {
  if (!universityId) return true;
  const activeOwnerFilter = {
    university_id: universityId,
    role: "owner",
    status: "active",
  };
  const activeOwnerCount =
    await UniversityMembershipModel.countDocuments(activeOwnerFilter);
  if (activeOwnerCount > 1) return true;

  const current = currentMemberId
    ? await UniversityMembershipModel.findOne({
        _id: currentMemberId,
        university_id: universityId,
      }).lean()
    : null;
  if (!current || current.role !== "owner" || current.status !== "active")
    return true;
  if (nextRole === "owner" && (nextStatus === null || nextStatus === "active"))
    return true;
  if (nextRole === null && nextStatus === "active") return true;
  return false;
};

const listUniversityMembers = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });

    const query = universityMembershipQueryForScope(scope);
    const status = cleanText(req.query?.status).toLowerCase();
    if (status && status !== "all")
      query.status = normalizeUniversityMemberStatus(status, status);

    const memberships = await UniversityMembershipModel.find(query)
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(normalizeLimit(req.query.limit, 50, 100))
      .lean();

    return ReturnAppData.getData({
      res,
      data: memberships.map(serializeUniversityMember),
      message: "university_members",
    });
  } catch (error) {
    next(error);
  }
};

const upsertUniversityMember = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.createError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });

    const university = await requireScopedUniversityForMutation(req, scope);
    if (!university?._id)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "university_required",
      });

    const userId = req.body?.user_id || req.body?.user || req.params?.userId;
    if (!isValidObjectId(userId))
      return ReturnAppData.createError({
        res,
        status: 400,
        message: "invalid_user_id",
      });
    const user = await UserModel.findById(userId)
      .select("_id email first_name last_name")
      .lean();
    if (!user)
      return ReturnAppData.createError({
        res,
        status: 404,
        message: "user_not_found",
      });

    const role = normalizeUniversityMemberRole(
      req.body?.role || req.body?.member_role,
    );
    const status = normalizeUniversityMemberStatus(req.body?.status, "active");
    const payload = {
      university_id: university._id,
      user_id: user._id,
      role,
      status,
      permissions: permissionsForUniversityRole(role, req.body?.permissions),
      invited_by: req.user?._id || null,
      accepted_at: status === "active" ? new Date() : null,
    };

    const membership = await UniversityMembershipModel.findOneAndUpdate(
      { university_id: university._id, user_id: user._id },
      { $set: payload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      });

    await syncAccountContextsForUser(user._id);
    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_member_upserted",
      entityType: "other",
      entityId: membership._id,
      newValue: payload,
      metadata: { university_id: String(university._id) },
    });

    return ReturnAppData.createData({
      res,
      data: serializeUniversityMember(membership.toObject()),
      message: "university_member_saved",
    });
  } catch (error) {
    next(error);
  }
};

const updateUniversityMember = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    if (!isValidObjectId(req.params.memberId)) {
      return ReturnAppData.updateError({
        res,
        status: 400,
        message: "invalid_member_id",
      });
    }

    const existing = await UniversityMembershipModel.findOne(
      universityMembershipQueryForScope(scope, req.params.memberId),
    ).lean();
    if (!existing)
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "university_member_not_found",
      });

    const patch = {};
    const nextRole =
      req.body?.role !== undefined || req.body?.member_role !== undefined
        ? normalizeUniversityMemberRole(req.body?.role || req.body?.member_role)
        : null;
    const nextStatus =
      req.body?.status !== undefined
        ? normalizeUniversityMemberStatus(req.body.status, existing.status)
        : null;
    if (nextRole) patch.role = nextRole;
    if (nextStatus) {
      patch.status = nextStatus;
      if (nextStatus === "active" && !existing.accepted_at)
        patch.accepted_at = new Date();
    }
    if (req.body?.permissions !== undefined || nextRole) {
      patch.permissions = permissionsForUniversityRole(
        nextRole || existing.role,
        req.body?.permissions,
      );
    }

    const keepsOwner = await ensureUniversityOwnerStillExists({
      universityId: existing.university_id,
      currentMemberId: existing._id,
      nextRole: nextRole || existing.role,
      nextStatus: nextStatus || existing.status,
    });
    if (!keepsOwner)
      return ReturnAppData.updateError({
        res,
        status: 422,
        message: "university_last_owner_required",
      });

    const membership = await UniversityMembershipModel.findOneAndUpdate(
      { _id: existing._id },
      { $set: patch },
      { new: true, runValidators: true },
    )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      });

    await syncAccountContextsForUser(membership.user_id);
    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_member_updated",
      entityType: "other",
      entityId: membership._id,
      oldValue: {
        role: existing.role,
        permissions: existing.permissions || [],
        status: existing.status,
      },
      newValue: patch,
      metadata: { university_id: String(existing.university_id) },
    });

    return ReturnAppData.updateData({
      res,
      data: serializeUniversityMember(membership.toObject()),
      message: "university_member_updated",
    });
  } catch (error) {
    next(error);
  }
};

const removeUniversityMember = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.deleteError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    if (!isValidObjectId(req.params.memberId)) {
      return ReturnAppData.deleteError({
        res,
        status: 400,
        message: "invalid_member_id",
      });
    }

    const existing = await UniversityMembershipModel.findOne(
      universityMembershipQueryForScope(scope, req.params.memberId),
    ).lean();
    if (!existing)
      return ReturnAppData.deleteError({
        res,
        status: 404,
        message: "university_member_not_found",
      });

    const keepsOwner = await ensureUniversityOwnerStillExists({
      universityId: existing.university_id,
      currentMemberId: existing._id,
      nextRole: existing.role,
      nextStatus: "removed",
    });
    if (!keepsOwner)
      return ReturnAppData.deleteError({
        res,
        status: 422,
        message: "university_last_owner_required",
      });

    const membership = await UniversityMembershipModel.findOneAndUpdate(
      { _id: existing._id },
      { $set: { status: "removed" } },
      { new: true, runValidators: true },
    )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      });

    await syncAccountContextsForUser(membership.user_id);
    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_member_removed",
      entityType: "other",
      entityId: membership._id,
      oldValue: { status: existing.status },
      newValue: { status: "removed" },
      metadata: { university_id: String(existing.university_id) },
    });

    return ReturnAppData.deleteData({
      res,
      status: 200,
      other: { data: serializeUniversityMember(membership.toObject()) },
      message: "university_member_removed",
    });
  } catch (error) {
    next(error);
  }
};

const serializeVerification = (verification = {}) => {
  const university =
    verification.university_id && typeof verification.university_id === "object"
      ? verification.university_id
      : null;
  const verificationId = String(verification._id || "");

  return {
    id: verificationId,
    _id: verification._id,
    method: verification.method || "email",
    status: verification.status || "pending",
    university_id: idOf(verification.university_id),
    university: university ? publicUniversity(university) : null,
    student_email: verification.student_email || "",
    student_id_number: verification.student_id_number || "",
    campus: verification.campus || "",
    faculty_major: verification.faculty_major || "",
    degree_level: verification.degree_level || "",
    graduation_year: verification.graduation_year || null,
    invite_code: verification.invite_code || "",
    document_url: verification.document_url || "",
    document_download_url: verificationId
      ? `/campus/v1/student-verifications/${verificationId}/document`
      : "",
    admin_document_download_url: verificationId
      ? `/university/v1/verifications/${verificationId}/document`
      : "",
    email_confirmed_at: verification.email_confirmed_at || null,
    reviewed_by: verification.reviewed_by || null,
    reviewed_at: verification.reviewed_at || null,
    rejection_reason: verification.rejection_reason || "",
    requested_information: verification.requested_information || "",
    created_at: verification.createdAt || verification.created_at || null,
    updated_at: verification.updatedAt || verification.updated_at || null,
  };
};

const applyVerifiedStudentToEmployee = async ({ verification, university }) => {
  const set = {
    is_student: true,
    candidate_stage: "student",
    university:
      university.name || verification.submitted_payload?.university || "",
    university_id: university._id,
    "student_profile.university": university.name || "",
    "student_profile.university_id": university._id,
    "student_profile.student_email": verification.student_email || "",
    "student_profile.student_email_verified": true,
    "search_filters.career.is_student": true,
  };

  if (verification.faculty_major)
    set["student_profile.specialty"] = verification.faculty_major;
  if (verification.submitted_payload?.academic_year) {
    const academicYear = normalizeAcademicYear(
      verification.submitted_payload.academic_year,
    );
    if (academicYear) set["student_profile.academic_year"] = academicYear;
  }
  if (verification.graduation_year) {
    set.graduation_year = verification.graduation_year;
    set["student_profile.expected_graduation_year"] =
      verification.graduation_year;
  }

  return EmployeeModel.findOneAndUpdate(
    { user_id: verification.user_id },
    { $set: set },
    { new: true, runValidators: true },
  ).lean();
};

const updateStudentProfileFromVerification = async ({
  req,
  university,
  body = {},
  studentEmail = "",
}) => {
  const employee = await EmployeeModel.findOne({
    user_id: req.user._id,
  }).lean();
  if (!employee) return null;

  const set = {
    is_student: true,
    candidate_stage: "student",
    university: university.name || "",
    university_id: university._id,
    "student_profile.university": university.name || "",
    "student_profile.university_id": university._id,
    "student_profile.student_email":
      studentEmail || employee.student_profile?.student_email || "",
    "search_filters.career.is_student": true,
  };
  const major = cleanText(body.faculty_major || body.major || body.specialty);
  const campus = cleanText(body.campus);
  const academicYear = normalizeAcademicYear(body.academic_year);
  const graduationYear = normalizeGraduationYear(
    body.graduation_year || body.expected_graduation_year,
  );

  if (major) set["student_profile.specialty"] = major;
  if (campus) set["student_profile.sub_specialty"] = campus;
  if (academicYear) set["student_profile.academic_year"] = academicYear;
  if (graduationYear) {
    set.graduation_year = graduationYear;
    set["student_profile.expected_graduation_year"] = graduationYear;
  }

  return EmployeeModel.findOneAndUpdate(
    { user_id: req.user._id },
    { $set: set },
    { new: true, runValidators: true },
  ).lean();
};

const buildUniversityStudentQuery = (university) => {
  if (!university?._id) return { _id: null };

  const exactNames = [university.name, university.name_en]
    .map((value) => cleanText(value))
    .filter(Boolean);

  const clauses = [
    { university_id: university._id },
    { "student_profile.university_id": university._id },
  ];

  for (const name of exactNames) {
    const matcher = new RegExp(`^${escapeRegExp(name)}$`, "i");
    clauses.push({ university: matcher });
    clauses.push({ "student_profile.university": matcher });
  }

  return { $or: clauses };
};

const campusJobQuery = (target = "students") => {
  const normalizedTarget = allowedTargets.has(target) ? target : "students";
  if (normalizedTarget === "all") {
    return {
      ...publicJobFilter,
      $or: [
        {
          candidate_target: {
            $in: ["students", "graduates", "fresh_graduates"],
          },
        },
        { is_for_students: true },
        { is_for_graduates: true },
        { is_for_fresh_graduates: true },
        {
          "search_index.filters.candidate_target": {
            $in: ["students", "graduates", "fresh_graduates"],
          },
        },
        { "search_index.filters.is_for_students": true },
        { "search_index.filters.is_for_graduates": true },
        { "search_index.filters.is_for_fresh_graduates": true },
      ],
    };
  }
  const flags = {
    students: { is_for_students: true },
    graduates: { is_for_graduates: true },
    fresh_graduates: { is_for_fresh_graduates: true },
  };
  const searchFlags = {
    students: { "search_index.filters.is_for_students": true },
    graduates: { "search_index.filters.is_for_graduates": true },
    fresh_graduates: { "search_index.filters.is_for_fresh_graduates": true },
  };

  return {
    ...publicJobFilter,
    $or: [
      { candidate_target: normalizedTarget },
      flags[normalizedTarget],
      { "search_index.filters.candidate_target": normalizedTarget },
      searchFlags[normalizedTarget],
    ],
  };
};

const overview = async (req, res, next) => {
  try {
    const employee = await getEmployee(req);
    if (!employee) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }

    const [applications, saved, interviews, recommended] = await Promise.all([
      UserApplyingJobModel.countDocuments({ user_id: req.user._id }),
      UserSavedJobModel.countDocuments({ user_id: req.user._id }),
      InterviewModel.countDocuments({
        employee_user_id: req.user._id,
        status: { $in: ["scheduled", "rescheduled"] },
        start_at: { $gte: new Date() },
      }),
      jobsModel
        .find(
          campusJobQuery(
            employee.candidate_stage === "fresh_graduate"
              ? "fresh_graduates"
              : "students",
          ),
        )
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    return ReturnAppData.getData({
      res,
      data: {
        profile: employee,
        stats: {
          applications,
          saved_jobs: saved,
          upcoming_interviews: interviews,
          readiness_score:
            employee.student_profile?.readiness_score ||
            employee.profile_completion ||
            0,
        },
        recommended_opportunities: recommended,
      },
      message: "campus_overview",
    });
  } catch (error) {
    next(error);
  }
};

const opportunities = async (req, res, next) => {
  try {
    const target = String(
      req.query.target || req.query.candidate_target || "students",
    ).toLowerCase();
    const jobs = await jobsModel
      .find(campusJobQuery(target))
      .sort({ priority: -1, createdAt: -1, _id: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();

    return ReturnAppData.getData({
      res,
      data: jobs,
      message: "campus_opportunities",
    });
  } catch (error) {
    next(error);
  }
};

const createCompanyOpportunity = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req, "_id owner_user_id");
    if (!company)
      return ReturnAppData.createError({
        res,
        status: 403,
        message: "company_not_found",
      });
    const body = req.body || {};
    const title = String(body.title || body.job_name || "").trim();
    if (!title)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "title_required",
      });

    const target = normalizeCampusOpportunityTarget(
      req.body?.target || req.body?.candidate_target,
    );
    const candidateTarget = campusCandidateTargets(target);
    const requestedCount = normalizeLimit(body.requested_count, 5, 500);
    const rawUniversityId = body.university_id || body.universityId || null;
    if (rawUniversityId && !isValidObjectId(rawUniversityId)) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "invalid_university_id",
      });
    }

    const request = await CampusOpportunityModel.create({
      company_id: company._id,
      university_id: rawUniversityId || null,
      requested_by_user_id: req.user._id,
      title,
      description: String(
        body.description ||
          body.details ||
          "Campus opportunity request from the company campus portal.",
      ).trim(),
      required_skills: toStringArray(body.required_skills),
      preferred_skills: toStringArray(body.preferred_skills),
      countries: toStringArray(body.country || body.countries),
      cities: toStringArray(body.location || body.city || body.cities),
      target,
      requested_count: requestedCount,
      notes: [
        {
          by_user_id: req.user._id,
          type: "company",
          note: `Campus opportunity request target: ${candidateTarget.join(", ")}`,
        },
      ],
    });

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: req.user?._id,
      actorType: companyCampusActorType(req),
      action: "company_campus_opportunity_request_created",
      entityType: "other",
      entityId: request._id,
      newValue: {
        title: request.title,
        target: request.target,
        requested_count: request.requested_count,
        university_id: request.university_id,
      },
    });

    return ReturnAppData.createData({
      res,
      status: 202,
      data: request,
      message: "campus_opportunity_request_created",
    });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res, next) => {
  try {
    const employee = await getEmployee(req);
    if (!employee) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }
    return ReturnAppData.getData({
      res,
      data: employee,
      message: "campus_profile",
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    const linkedUniversity = await ensureUniversityForRequest(req);
    const allowed = [
      "university",
      "specialty",
      "sub_specialty",
      "academic_year",
      "gpa",
      "work_readiness",
      "preferred_work_location",
      "readiness_score",
    ];

    const set = {
      is_student: true,
      candidate_stage:
        body.candidate_stage === "fresh_graduate"
          ? "fresh_graduate"
          : "student",
      "search_filters.career.is_student": true,
    };

    for (const field of allowed) {
      if (typeof body[field] !== "undefined") {
        set[`student_profile.${field}`] = body[field];
      }
    }

    if (body.expected_graduation_year)
      set.graduation_year = Number(body.expected_graduation_year);
    if (body.profile_headline)
      set.profile_headline = String(body.profile_headline).trim();
    if (body.about_me) set.about_me = String(body.about_me).trim();

    const normalizedUniversityName =
      cleanText(body.university) || cleanText(linkedUniversity?.name);
    if (normalizedUniversityName) {
      set.university = normalizedUniversityName;
      set["student_profile.university"] = normalizedUniversityName;
    }

    if (linkedUniversity?._id) {
      set.university_id = linkedUniversity._id;
      set["student_profile.university_id"] = linkedUniversity._id;
    }

    const employee = await EmployeeModel.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: set },
      { new: true, runValidators: true },
    ).lean();

    if (!employee) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }

    return ReturnAppData.updateData({
      res,
      data: employee,
      message: "campus_profile_updated",
    });
  } catch (error) {
    next(error);
  }
};

const getTalentVisibility = async (req, res, next) => {
  try {
    const employee = await getEmployee(req);
    if (!employee) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }

    return ReturnAppData.getData({
      res,
      data: serializeCampusTalentVisibility(employee),
      message: "campus_talent_visibility",
    });
  } catch (error) {
    next(error);
  }
};

const updateTalentVisibility = async (req, res, next) => {
  try {
    const employee = await getEmployee(req);
    if (!employee) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }

    const currentVisibility = campusVisibilityFromProfile(
      employee.student_profile || {},
    );
    const nextVisibility = campusVisibilityUpdateFromBody(
      req.body || {},
      currentVisibility,
    );

    const set = {
      "student_profile.campus_visibility.talent_pool_opt_in":
        nextVisibility.talent_pool_opt_in,
      "student_profile.campus_visibility.visible_to_partner_companies":
        nextVisibility.visible_to_partner_companies,
      "student_profile.campus_visibility.visible_fields.contact":
        nextVisibility.visible_fields.contact,
      "student_profile.campus_visibility.visible_fields.cv":
        nextVisibility.visible_fields.cv,
      "student_profile.campus_visibility.visible_fields.projects":
        nextVisibility.visible_fields.projects,
      "student_profile.campus_visibility.visible_fields.gpa":
        nextVisibility.visible_fields.gpa,
      "student_profile.campus_visibility.opted_in_at":
        nextVisibility.opted_in_at,
      "student_profile.campus_visibility.opted_out_at":
        nextVisibility.opted_out_at,
      "student_profile.campus_discovery_visibility":
        nextVisibility.talent_pool_opt_in &&
        nextVisibility.visible_to_partner_companies
          ? "partner_companies"
          : "hidden",
      "student_profile.contact_visibility":
        nextVisibility.talent_pool_opt_in &&
        nextVisibility.visible_fields.contact
          ? "partner_companies"
          : "hidden",
      "student_profile.cv_visibility":
        nextVisibility.talent_pool_opt_in && nextVisibility.visible_fields.cv
          ? "partner_companies"
          : "hidden",
    };

    const updated = await EmployeeModel.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: set },
      { new: true, runValidators: true },
    ).lean();

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: nextVisibility.talent_pool_opt_in
        ? "campus_talent_visibility_opted_in"
        : "campus_talent_visibility_opted_out",
      entityType: "other",
      entityId: employee._id,
      newValue: {
        talent_pool_opt_in: nextVisibility.talent_pool_opt_in,
        visible_to_partner_companies:
          nextVisibility.visible_to_partner_companies,
        visible_fields: nextVisibility.visible_fields,
      },
    });

    return ReturnAppData.updateData({
      res,
      data: serializeCampusTalentVisibility(updated),
      message: "campus_talent_visibility_updated",
    });
  } catch (error) {
    next(error);
  }
};

const resources = async (req, res, next) => {
  try {
    const limit = normalizeLimit(req.query.limit, 8, 20);
    const employee = await resolveStudentProfile(req.user?._id);
    const universityId = universityIdFromEmployee(employee);
    const filter = mergeResourceFilters(
      visibleResourceFilter({ universityId }),
      resourceAudienceFilter(req.query.audience || "students"),
      resourceSearchFilter(req.query),
    );
    const libraryResources = await LearningResourceModel.find(filter)
      .sort({ featured: -1, sort_order: 1, published_at: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    if (libraryResources.length) {
      const withProgress = await attachProgress({
        resources: libraryResources,
        userId: req.user?._id,
      });
      const language = String(req.get("lan") || req.query.lang || "en")
        .toLowerCase()
        .startsWith("ar")
        ? "ar"
        : "en";
      return ReturnAppData.getData({
        res,
        data: withProgress.map((resource) =>
          serializeResource(resource, { lang: language }),
        ),
        message: "campus_resources",
        other: { source: "learning_resources" },
      });
    }

    const pages = await PageModel.find({
      status: true,
      $or: [
        { key: /campus|student|career/i },
        { slug: /campus|student|career/i },
        { title_ar: /جامعة|طالب|مهني/i },
        { title_en: /campus|student|career/i },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return ReturnAppData.getData({
      res,
      data: pages,
      message: "campus_resources",
    });
  } catch (error) {
    next(error);
  }
};

const listUniversityEvents = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });

    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = normalizeLimit(req.query?.limit, 25, 100);
    const query = campusEventQueryForScope(scope);
    const status = cleanText(req.query?.status).toLowerCase();
    if (status && status !== "all") {
      query.status = normalizeCampusEventStatus(status, status);
    } else {
      query.status = { $ne: "archived" };
    }

    const search = cleanText(req.query?.q || req.query?.search);
    if (search) {
      const regex = new RegExp(escapeRegExp(search), "i");
      query.$or = [
        { title: regex },
        { summary: regex },
        { description: regex },
        { organizer: regex },
        { kind: regex },
        { location: regex },
      ];
    }

    const [events, total] = await Promise.all([
      CampusEventModel.find(query)
        .sort({ featured: -1, sort_order: 1, start_at: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CampusEventModel.countDocuments(query),
    ]);

    return ReturnAppData.getData({
      res,
      data: events.map(serializeCampusEvent),
      other: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      message: "university_campus_events",
    });
  } catch (error) {
    next(error);
  }
};

const createUniversityEvent = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.createError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });

    const university = await requireScopedUniversityForMutation(req, scope);
    if (!university?._id)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "university_required",
      });

    const body = req.body || {};
    const title = cleanText(body.title || body.event_title);
    if (!title)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "title_required",
      });

    const event = await CampusEventModel.create({
      university_id: university._id,
      event_id: campusEventSlug(
        body.event_id || buildCampusEventId({ university, title }),
      ),
      title,
      summary: cleanText(body.summary),
      description: cleanText(body.description || body.details),
      organizer: cleanText(body.organizer || body.host),
      kind: cleanText(body.kind || body.tag || body.type),
      mode: cleanText(body.mode),
      date_label: cleanText(body.date_label || body.date || body.meta),
      start_at: parseDateOrNull(body.start_at || body.starts_at),
      end_at: parseDateOrNull(body.end_at || body.ends_at),
      location: cleanText(body.location),
      campus_name: cleanText(body.campus_name || body.campus),
      registration_url: cleanText(body.registration_url || body.url),
      capacity: numberOrNull(body.capacity),
      featured: normalizeBoolean(body.featured, false),
      tags: uniqueStringArray(body.tags),
      bullets: uniqueStringArray(body.bullets || body.highlights || body.agenda),
      status: normalizeCampusEventStatus(body.status, "draft"),
      visibility: normalizeCampusEventVisibility(body.visibility, "campus"),
      sort_order: numberOrNull(body.sort_order || body.order) || 0,
      created_by: req.user?._id || null,
      updated_by: req.user?._id || null,
    });

    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_campus_event_created",
      entityType: "other",
      entityId: event._id,
      newValue: serializeCampusEvent(event.toObject()),
      metadata: { university_id: String(university._id) },
    });

    return ReturnAppData.createData({
      res,
      data: serializeCampusEvent(event.toObject()),
      message: "university_campus_event_created",
    });
  } catch (error) {
    next(error);
  }
};

const updateUniversityEvent = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    if (!isValidObjectId(req.params.id))
      return ReturnAppData.updateError({
        res,
        status: 400,
        message: "invalid_event_id",
      });

    const existing = await CampusEventModel.findOne(
      campusEventQueryForScope(scope, req.params.id),
    ).lean();
    if (!existing)
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "campus_event_not_found",
      });

    const body = req.body || {};
    const set = { updated_by: req.user?._id || null };
    if (body.event_id !== undefined) set.event_id = campusEventSlug(body.event_id, existing.event_id);
    if (body.title !== undefined || body.event_title !== undefined)
      set.title = cleanText(body.title || body.event_title);
    if (body.summary !== undefined) set.summary = cleanText(body.summary);
    if (body.description !== undefined || body.details !== undefined)
      set.description = cleanText(body.description || body.details);
    if (body.organizer !== undefined || body.host !== undefined)
      set.organizer = cleanText(body.organizer || body.host);
    if (body.kind !== undefined || body.tag !== undefined || body.type !== undefined)
      set.kind = cleanText(body.kind || body.tag || body.type);
    if (body.mode !== undefined) set.mode = cleanText(body.mode);
    if (body.date_label !== undefined || body.date !== undefined || body.meta !== undefined)
      set.date_label = cleanText(body.date_label || body.date || body.meta);
    if (body.start_at !== undefined || body.starts_at !== undefined)
      set.start_at = parseDateOrNull(body.start_at || body.starts_at);
    if (body.end_at !== undefined || body.ends_at !== undefined)
      set.end_at = parseDateOrNull(body.end_at || body.ends_at);
    if (body.location !== undefined) set.location = cleanText(body.location);
    if (body.campus_name !== undefined || body.campus !== undefined)
      set.campus_name = cleanText(body.campus_name || body.campus);
    if (body.registration_url !== undefined || body.url !== undefined)
      set.registration_url = cleanText(body.registration_url || body.url);
    if (body.capacity !== undefined) set.capacity = numberOrNull(body.capacity);
    if (body.featured !== undefined)
      set.featured = normalizeBoolean(body.featured, existing.featured === true);
    if (body.tags !== undefined) set.tags = uniqueStringArray(body.tags);
    if (
      body.bullets !== undefined ||
      body.highlights !== undefined ||
      body.agenda !== undefined
    ) {
      set.bullets = uniqueStringArray(body.bullets || body.highlights || body.agenda);
    }
    if (body.status !== undefined)
      set.status = normalizeCampusEventStatus(body.status, existing.status);
    if (body.visibility !== undefined)
      set.visibility = normalizeCampusEventVisibility(
        body.visibility,
        existing.visibility,
      );
    if (body.sort_order !== undefined || body.order !== undefined)
      set.sort_order = numberOrNull(body.sort_order || body.order) || 0;

    const event = await CampusEventModel.findOneAndUpdate(
      campusEventQueryForScope(scope, req.params.id),
      { $set: set },
      { new: true, runValidators: true },
    ).lean();

    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_campus_event_updated",
      entityType: "other",
      entityId: event._id,
      oldValue: serializeCampusEvent(existing),
      newValue: serializeCampusEvent(event),
      metadata: { university_id: String(event.university_id || "") },
    });

    return ReturnAppData.updateData({
      res,
      data: serializeCampusEvent(event),
      message: "university_campus_event_updated",
    });
  } catch (error) {
    next(error);
  }
};

const archiveUniversityEvent = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    if (!scope)
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    if (!isValidObjectId(req.params.id))
      return ReturnAppData.updateError({
        res,
        status: 400,
        message: "invalid_event_id",
      });

    const existing = await CampusEventModel.findOne(
      campusEventQueryForScope(scope, req.params.id),
    ).lean();
    if (!existing)
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "campus_event_not_found",
      });

    const event = await CampusEventModel.findOneAndUpdate(
      campusEventQueryForScope(scope, req.params.id),
      { $set: { status: "archived", updated_by: req.user?._id || null } },
      { new: true, runValidators: true },
    ).lean();

    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_campus_event_archived",
      entityType: "other",
      entityId: event._id,
      oldValue: serializeCampusEvent(existing),
      newValue: serializeCampusEvent(event),
      metadata: { university_id: String(event.university_id || "") },
    });

    return ReturnAppData.updateData({
      res,
      data: serializeCampusEvent(event),
      message: "university_campus_event_archived",
    });
  } catch (error) {
    next(error);
  }
};

const registerEvent = async (req, res, next) => {
  try {
    const eventId = String(
      req.params.eventId || req.body?.event_id || "",
    ).trim();
    if (!eventId)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "event_id_required",
      });

    const employee = await EmployeeModel.findOne({ user_id: req.user._id })
      .select("_id")
      .lean();
    const body = req.body || {};
    const managedEvent = await findPublishedCampusEvent(eventId);
    const startAt = parseDateOrNull(
      body.start_at ||
        body.starts_at ||
        body.event_start_at ||
        body.eventStartAt,
    );
    const payload = {
      user_id: req.user._id,
      employee_id: employee?._id || null,
      event_id: eventId,
      title: String(
        body.title || body.event_title || managedEvent?.title || "Campus event",
      ).trim(),
      organizer: String(body.organizer || managedEvent?.organizer || "").trim(),
      kind: String(body.kind || managedEvent?.kind || "").trim(),
      date_label: String(
        body.date_label || body.date || managedEvent?.date_label || "",
      ).trim(),
      start_at: startAt || managedEvent?.start_at || null,
      mode: String(body.mode || managedEvent?.mode || "").trim(),
      status: "registered",
    };

    const existingRegistration = await CampusEventRegistrationModel.findOne({
      user_id: req.user._id,
      event_id: eventId,
    }).lean();
    if (existingRegistration?.status === "registered") {
      return ReturnAppData.createData({
        res,
        status: 200,
        data: existingRegistration,
        message: "campus_event_already_registered",
      });
    }

    const registration = await CampusEventRegistrationModel.findOneAndUpdate(
      { user_id: req.user._id, event_id: eventId },
      {
        $setOnInsert: {
          user_id: payload.user_id,
          employee_id: payload.employee_id,
          event_id: payload.event_id,
          reminder_sent_at: null,
        },
        $set: {
          title: payload.title,
          organizer: payload.organizer,
          kind: payload.kind,
          date_label: payload.date_label,
          start_at: payload.start_at,
          mode: payload.mode,
          status: "registered",
        },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    if (managedEvent?._id && existingRegistration?.status !== "registered") {
      await CampusEventModel.updateOne(
        { _id: managedEvent._id },
        { $inc: { registered_count: 1 } },
      );
    }

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "campus_event_registered",
      entityType: "other",
      entityId: registration._id,
      newValue: {
        event_id: eventId,
        title: registration.title || payload.title,
        status: "registered",
      },
    });
    campusEventRegisteredNotification(registration).catch?.(console.error);
    await recordAnalyticsEvent({
      req,
      event: "event_joined",
      entityType: "campus",
      entityId: registration._id,
      metadata: {
        event_id: eventId,
        title: registration.title || payload.title,
        start_at: registration.start_at || payload.start_at || null,
        mode: registration.mode || payload.mode,
      },
    }).catch(() => null);

    return ReturnAppData.createData({
      res,
      data: registration,
      message: "campus_event_registered",
    });
  } catch (error) {
    next(error);
  }
};

const studentVerificationStatus = async (req, res, next) => {
  try {
    const verification = await StudentVerificationModel.findOne({
      user_id: req.user._id,
    })
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    if (!verification) {
      return ReturnAppData.getData({
        res,
        data: {
          status: "not_started",
          verification: null,
        },
        message: "student_verification_not_started",
      });
    }

    return ReturnAppData.getData({
      res,
      data: {
        status: verification.status,
        verification: serializeVerification(verification),
      },
      message: "student_verification_status",
    });
  } catch (error) {
    next(error);
  }
};

const startStudentVerification = async (req, res, next) => {
  try {
    const body = req.body || {};
    const employee = await EmployeeModel.findOne({ user_id: req.user._id })
      .select("_id")
      .lean();
    if (!employee) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }

    const university = await getUniversityForVerificationBody(body);
    if (!university) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "university_required",
      });
    }

    const existingVerified = await StudentVerificationModel.findOne({
      user_id: req.user._id,
      university_id: university._id,
      status: "verified",
    }).lean();
    if (existingVerified) {
      return ReturnAppData.createData({
        res,
        status: 200,
        data: {
          status: "verified",
          verification: serializeVerification({
            ...existingVerified,
            university_id: university,
          }),
        },
        message: "student_already_verified",
      });
    }

    const method = normalizeVerificationMethod(
      body.method || body.verification_method,
    );
    const studentEmail = normalizeEmail(body.student_email || req.user?.email);
    const emailDomain = getEmailDomain(studentEmail);
    const universityDomain = normalizeEmail(university.email_domain);

    if (
      method === "email" &&
      (!studentEmail || !universityDomain || emailDomain !== universityDomain)
    ) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "student_email_must_match_university_domain",
      });
    }

    const now = new Date();
    let emailCodeHash = "";
    let emailCodeExpiresAt = null;
    let emailSent = false;
    if (method === "email") {
      const code = createVerificationCode();
      emailCodeHash = hashVerificationCode({ code, userId: req.user._id });
      emailCodeExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);
      const sent = await sendRecoveryEmail({
        to: studentEmail,
        passcode: code,
        lang: req.get("lan") || "en",
        type: "passcode",
      });
      emailSent = Boolean(sent);
    }

    const payload = {
      user_id: req.user._id,
      employee_id: employee._id,
      university_id: university._id,
      method,
      status: "pending",
      student_email: studentEmail,
      student_id_number: cleanText(
        body.student_id_number || body.student_number,
      ),
      campus: cleanText(body.campus),
      faculty_major: cleanText(
        body.faculty_major || body.major || body.specialty,
      ),
      degree_level: cleanText(body.degree_level || body.degree),
      graduation_year: normalizeGraduationYear(
        body.graduation_year || body.expected_graduation_year,
      ),
      invite_code: cleanText(body.invite_code || body.code),
      submitted_payload: {
        university: university.name || "",
        university_id: university._id,
        source: cleanText(body.source || "mobile"),
        academic_year: cleanText(body.academic_year),
        degree_level: cleanText(body.degree_level || body.degree),
      },
      email_code_hash: emailCodeHash,
      email_code_expires_at: emailCodeExpiresAt,
      email_confirmed_at: null,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: "",
      requested_information: "",
    };

    await updateStudentProfileFromVerification({
      req,
      university,
      body,
      studentEmail,
    });

    const existingPending = await StudentVerificationModel.findOne({
      user_id: req.user._id,
      university_id: university._id,
      status: { $ne: "verified" },
    }).sort({ updatedAt: -1 });

    const verification = existingPending
      ? await StudentVerificationModel.findByIdAndUpdate(
          existingPending._id,
          { $set: payload },
          { new: true, runValidators: true },
        ).lean()
      : await StudentVerificationModel.create(payload);
    const verificationObject = verification.toObject
      ? verification.toObject()
      : verification;

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "campus_verification_started",
      entityType: "other",
      entityId: verificationObject._id,
      newValue: {
        method,
        status: verificationObject.status,
        university_id: university._id,
      },
    });
    await recordAnalyticsEvent({
      req,
      event: "campus_verification_started",
      entityType: "campus",
      entityId: verificationObject._id,
      metadata: {
        method,
        status: verificationObject.status,
        university_id: String(university._id || ""),
        email_sent: emailSent,
      },
    }).catch(() => null);

    return ReturnAppData.createData({
      res,
      status: 202,
      data: {
        status: verificationObject.status,
        email_sent: emailSent,
        verification: serializeVerification({
          ...verificationObject,
          university_id: university,
        }),
      },
      message: "student_verification_started",
    });
  } catch (error) {
    next(error);
  }
};

const confirmStudentVerificationEmail = async (req, res, next) => {
  try {
    const body = req.body || {};
    const code = cleanText(body.code || body.passcode || body.otp);
    if (!code)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "verification_code_required",
      });

    const verificationId = cleanText(body.verification_id || body.id);
    const query =
      verificationId && isValidObjectId(verificationId)
        ? { _id: verificationId, user_id: req.user._id }
        : { user_id: req.user._id, method: "email", status: "pending" };

    const verification = await StudentVerificationModel.findOne(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      });

    if (!verification) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }

    if (verification.status !== "pending") {
      return ReturnAppData.createError({
        res,
        status: 409,
        message: "student_verification_not_pending",
      });
    }

    if (
      verification.email_code_expires_at &&
      verification.email_code_expires_at.getTime() < Date.now()
    ) {
      verification.status = "expired";
      await verification.save();
      return ReturnAppData.createError({
        res,
        status: 410,
        message: "student_verification_code_expired",
      });
    }

    const expectedHash = hashVerificationCode({ code, userId: req.user._id });
    if (
      !verification.email_code_hash ||
      verification.email_code_hash !== expectedHash
    ) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "invalid_verification_code",
      });
    }

    verification.status = "verified";
    verification.email_confirmed_at = new Date();
    verification.reviewed_at = new Date();
    verification.rejection_reason = "";
    verification.requested_information = "";
    await verification.save();

    await applyVerifiedStudentToEmployee({
      verification: verification.toObject(),
      university: verification.university_id,
    });

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "campus_verification_email_confirmed",
      entityType: "other",
      entityId: verification._id,
      newValue: {
        status: "verified",
        university_id:
          verification.university_id?._id || verification.university_id,
      },
    });

    return ReturnAppData.updateData({
      res,
      data: {
        status: "verified",
        verification: serializeVerification(verification.toObject()),
      },
      message: "student_verification_verified",
    });
  } catch (error) {
    next(error);
  }
};

const uploadStudentVerificationDocument = async (req, res, next) => {
  try {
    const body = req.body || {};
    const employee = await EmployeeModel.findOne({ user_id: req.user._id })
      .select("_id")
      .lean();
    if (!employee) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: "campus_profile_not_found",
      });
    }

    const verificationId = cleanText(body.verification_id || body.id);
    let verification =
      verificationId && isValidObjectId(verificationId)
        ? await StudentVerificationModel.findOne({
            _id: verificationId,
            user_id: req.user._id,
          })
        : null;

    const university = verification
      ? await UniversityModel.findById(verification.university_id).lean()
      : await getUniversityForVerificationBody(body);

    if (!university) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "university_required",
      });
    }

    const uploadedDocumentUrl = req.file
      ? await persistPrivateVerificationDocument(req.file)
      : "";
    if (req.file && !uploadedDocumentUrl) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: "invalid_student_document",
      });
    }

    const documentUrl =
      uploadedDocumentUrl ||
      normalizeVerificationDocumentUrl(body.document_url);
    if (!documentUrl) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "student_document_required",
      });
    }

    const payload = {
      user_id: req.user._id,
      employee_id: employee._id,
      university_id: university._id,
      method: "document",
      status: "pending",
      student_email: normalizeEmail(
        body.student_email || verification?.student_email || req.user?.email,
      ),
      student_id_number: cleanText(
        body.student_id_number || verification?.student_id_number,
      ),
      campus: cleanText(body.campus || verification?.campus),
      faculty_major: cleanText(
        body.faculty_major ||
          body.major ||
          body.specialty ||
          verification?.faculty_major,
      ),
      degree_level: cleanText(
        body.degree_level || body.degree || verification?.degree_level,
      ),
      graduation_year:
        normalizeGraduationYear(
          body.graduation_year || body.expected_graduation_year,
        ) ||
        verification?.graduation_year ||
        null,
      document_url: documentUrl,
      submitted_payload: {
        university: university.name || "",
        university_id: university._id,
        source: cleanText(body.source || "mobile"),
        academic_year: cleanText(
          body.academic_year || verification?.submitted_payload?.academic_year,
        ),
        degree_level: cleanText(
          body.degree_level || body.degree || verification?.degree_level,
        ),
      },
      email_code_hash: "",
      email_code_expires_at: null,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: "",
      requested_information: "",
    };

    await updateStudentProfileFromVerification({
      req,
      university,
      body: payload,
      studentEmail: payload.student_email,
    });

    verification = verification
      ? await StudentVerificationModel.findByIdAndUpdate(
          verification._id,
          { $set: payload },
          { new: true, runValidators: true },
        ).lean()
      : await StudentVerificationModel.create(payload);
    const verificationObject = verification.toObject
      ? verification.toObject()
      : verification;

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "campus_verification_document_uploaded",
      entityType: "other",
      entityId: verificationObject._id,
      newValue: {
        status: verificationObject.status,
        university_id: university._id,
        has_document: Boolean(documentUrl),
      },
    });

    return ReturnAppData.createData({
      res,
      status: 202,
      data: {
        status: verificationObject.status,
        verification: serializeVerification({
          ...verificationObject,
          university_id: university,
        }),
      },
      message: "student_verification_document_uploaded",
    });
  } catch (error) {
    next(error);
  }
};

const downloadStudentVerificationDocument = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_student_verification_id",
      });
    }

    const verification = await StudentVerificationModel.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    }).lean();
    if (!verification) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }

    return sendVerificationDocumentFile({
      req,
      res,
      verification,
      actorType: "employee",
    });
  } catch (error) {
    next(error);
  }
};

const adminDownloadStudentVerificationDocument = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_student_verification_id",
      });
    }

    const scope = await getUniversityAdminScope(req);
    if (!scope) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }

    const query = { _id: req.params.id };
    if (!scope.superAdmin) {
      query.university_id = scope.university._id;
    } else if (scope.university?._id) {
      query.university_id = scope.university._id;
    }

    const verification = await StudentVerificationModel.findOne(query).lean();
    if (!verification) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }

    return sendVerificationDocumentFile({
      req,
      res,
      verification,
      actorType: scope.superAdmin ? "admin" : "university_admin",
    });
  } catch (error) {
    next(error);
  }
};

const resubmitStudentVerification = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: "invalid_student_verification_id",
      });
    }

    const verification = await StudentVerificationModel.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (!verification) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }
    if (
      !["rejected", "needs_more_information", "expired", "pending"].includes(
        verification.status,
      )
    ) {
      return ReturnAppData.createError({
        res,
        status: 409,
        message: "student_verification_cannot_be_resubmitted",
      });
    }

    verification.status = "pending";
    verification.rejection_reason = "";
    verification.requested_information = "";
    verification.submitted_payload = {
      ...(verification.submitted_payload || {}),
      resubmitted_at: new Date(),
      note: cleanText(req.body?.note),
    };
    await verification.save();

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "campus_verification_resubmitted",
      entityType: "other",
      entityId: verification._id,
      newValue: { status: "pending" },
    });

    return ReturnAppData.updateData({
      res,
      data: {
        status: verification.status,
        verification: serializeVerification(verification.toObject()),
      },
      message: "student_verification_resubmitted",
    });
  } catch (error) {
    next(error);
  }
};

const universityOverview = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req);
    const [students, internships, universities] = await Promise.all([
      EmployeeModel.countDocuments({ is_student: true }),
      jobsModel.countDocuments({
        $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }],
      }),
      UniversityModel.countDocuments({ status: { $ne: "suspended" } }),
    ]);

    return ReturnAppData.getData({
      res,
      data: {
        company,
        stats: {
          registered_students: students,
          internships_posted: internships,
          university_partners: universities,
          placements: 0,
        },
      },
      message: "campus_university_overview",
    });
  } catch (error) {
    next(error);
  }
};

const userUniversityOverview = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });

    const partnerCompanyIds = (university.partners || [])
      .map((partner) => partner.company_id)
      .filter(Boolean);
    const universityStudentQuery = buildUniversityStudentQuery(university);
    const [
      studentsCount,
      opportunitiesCount,
      requestsCount,
      placements,
      verificationStats,
    ] = await Promise.all([
      EmployeeModel.countDocuments(universityStudentQuery),
      jobsModel.countDocuments({
        $or: [
          { is_for_students: true },
          { is_for_fresh_graduates: true },
          { candidate_target: { $in: ["students", "fresh_graduates"] } },
        ],
        ...(partnerCompanyIds.length
          ? { company_id: { $in: partnerCompanyIds } }
          : {}),
      }),
      UniversityOpportunityRequestModel.countDocuments({
        university_id: university._id,
        status: { $nin: ["closed", "cancelled"] },
      }),
      UserApplyingJobModel.countDocuments({
        status: { $in: ["accepted", "hired"] },
        ...(partnerCompanyIds.length
          ? { company_id: { $in: partnerCompanyIds } }
          : {}),
      }),
      StudentVerificationModel.aggregate([
        { $match: { university_id: university._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    const verificationCounts = Object.fromEntries(
      (verificationStats || []).map((item) => [item._id, item.count]),
    );

    return ReturnAppData.getData({
      res,
      data: {
        university,
        stats: {
          registered_students: studentsCount || university.students_count || 0,
          verified_students: verificationCounts.verified || 0,
          pending_verifications: verificationCounts.pending || 0,
          rejected_verifications: verificationCounts.rejected || 0,
          needs_more_information:
            verificationCounts.needs_more_information || 0,
          internships_posted: opportunitiesCount,
          active_requests: requestsCount,
          placements,
        },
      },
      message: "campus_university_overview",
    });
  } catch (error) {
    next(error);
  }
};

const clampScore = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const readinessScoreForStudent = (student = {}) =>
  clampScore(
    student.student_profile?.readiness_score || student.profile_completion || 0,
  );

const countBy = (items, readKey) =>
  items.reduce((totals, item) => {
    const key = cleanText(readKey(item)) || "unknown";
    totals[key] = (totals[key] || 0) + 1;
    return totals;
  }, {});

const topEntries = (counts, limit = 10) =>
  Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .filter((item) => item.label && item.label !== "unknown")
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);

const skillTitle = (skill = {}) =>
  cleanText(skill.title || skill.name || skill.label);

const skillCountsFromStudents = (students = []) => {
  const counts = {};
  for (const student of students) {
    const skills = [
      ...(student.skills || []),
      ...(student.student_profile?.technical_skills || []),
      ...(student.student_profile?.soft_skills || []),
    ];
    for (const skill of skills) {
      const title = skillTitle(skill);
      if (title) counts[title] = (counts[title] || 0) + 1;
    }
  }
  return counts;
};

const buildUniversityDashboardReport = async (req) => {
  const scope = await getUniversityAdminScope(req);
  const university = scope?.university;
  if (!university) return null;

  const studentQuery = buildUniversityStudentQuery(university);
  const students = await EmployeeModel.find(studentQuery)
    .select(
      "profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion user_id cvs skills",
    )
    .lean();
  const studentUserIds = students
    .map((student) => idOf(student.user_id))
    .filter(Boolean);
  const applicationMatch = studentUserIds.length
    ? { user_id: { $in: studentUserIds } }
    : { _id: null };

  const [
    verificationStats,
    applicationStats,
    missingSkills,
    interviewCount,
    topCompanyRows,
  ] = await Promise.all([
    StudentVerificationModel.aggregate([
      { $match: { university_id: university._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    UserApplyingJobModel.aggregate([
      { $match: applicationMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    UserApplyingJobModel.aggregate([
      {
        $match: {
          ...applicationMatch,
          "filter_result.missing_skills": { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$filter_result.missing_skills" },
      { $group: { _id: "$filter_result.missing_skills", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    InterviewModel.countDocuments({
      ...(studentUserIds.length
        ? { employee_user_id: { $in: studentUserIds } }
        : { _id: null }),
      status: { $in: ["scheduled", "rescheduled", "accepted", "completed"] },
    }),
    UserApplyingJobModel.aggregate([
      { $match: applicationMatch },
      { $group: { _id: "$company_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          company_id: "$_id",
          company_name: { $ifNull: ["$company.company_name", "Company"] },
          count: 1,
        },
      },
    ]),
  ]);

  const verificationByStatus = Object.fromEntries(
    (verificationStats || []).map((item) => [
      item._id || "unknown",
      item.count,
    ]),
  );
  const applicationsByStatus = Object.fromEntries(
    (applicationStats || []).map((item) => [item._id || "unknown", item.count]),
  );
  const readinessScores = students.map(readinessScoreForStudent);
  const averageReadiness = readinessScores.length
    ? Math.round(
        readinessScores.reduce((sum, score) => sum + score, 0) /
          readinessScores.length,
      )
    : 0;
  const readinessBands = {
    under_50: readinessScores.filter((score) => score < 50).length,
    between_50_79: readinessScores.filter((score) => score >= 50 && score < 80)
      .length,
    over_80: readinessScores.filter((score) => score >= 80).length,
  };
  const cvUploadedCount = students.filter(
    (student) => Array.isArray(student.cvs) && student.cvs.length > 0,
  ).length;
  const majorCounts = countBy(
    students,
    (student) =>
      student.student_profile?.specialty ||
      student.current_job_title ||
      student.candidate_stage,
  );
  const recordedSkillCounts = skillCountsFromStudents(students);
  const applicationTotal = Object.values(applicationsByStatus).reduce(
    (sum, count) => sum + count,
    0,
  );

  return {
    university: publicUniversity(university),
    metrics: {
      registered_students: students.length || university.students_count || 0,
      verified_students: verificationByStatus.verified || 0,
      pending_verifications: verificationByStatus.pending || 0,
      rejected_verifications: verificationByStatus.rejected || 0,
      needs_more_information: verificationByStatus.needs_more_information || 0,
      average_employability_score: averageReadiness,
      cv_completion_rate: students.length
        ? Math.round((cvUploadedCount / students.length) * 100)
        : 0,
      internship_applications: applicationTotal,
      hired_students:
        (applicationsByStatus.hired || 0) +
        (applicationsByStatus.accepted || 0),
      interview_scheduled_count:
        interviewCount +
        (applicationsByStatus.interview || 0) +
        (applicationsByStatus.interview_scheduled || 0),
    },
    readiness: {
      average_score: averageReadiness,
      bands: readinessBands,
    },
    cv: {
      uploaded_count: cvUploadedCount,
      missing_cv_count: Math.max(0, students.length - cvUploadedCount),
      completion_rate: students.length
        ? Math.round((cvUploadedCount / students.length) * 100)
        : 0,
    },
    applications: {
      total: applicationTotal,
      by_status: applicationsByStatus,
      shortlisted: applicationsByStatus.shortlisted || 0,
      interviews: interviewCount,
      offers: applicationsByStatus.offer || 0,
      hired:
        (applicationsByStatus.hired || 0) +
        (applicationsByStatus.accepted || 0),
    },
    skills: {
      top_missing_skills: (missingSkills || []).map((item) => ({
        label: item._id,
        count: item.count,
      })),
      top_recorded_skills: topEntries(recordedSkillCounts),
    },
    majors: topEntries(majorCounts),
    companies: topCompanyRows,
    generated_at: new Date().toISOString(),
  };
};

const adminVerificationsQuery = async (req) => {
  const scope = await getUniversityAdminScope(req);
  if (!scope) return null;

  const query = {};
  if (!scope.superAdmin) {
    query.university_id = scope.university._id;
  } else if (scope.university?._id) {
    query.university_id = scope.university._id;
  }

  const status = cleanText(req.query?.status || req.body?.status).toLowerCase();
  if (status && status !== "all") query.status = status;

  return { scope, query };
};

const adminListVerifications = async (req, res, next) => {
  try {
    const scoped = await adminVerificationsQuery(req);
    if (!scoped) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }

    const limit = normalizeLimit(req.query.limit, 25, 100);
    const verifications = await StudentVerificationModel.find(scoped.query)
      .populate({
        path: "university_id",
        select:
          "name name_en logo city country email_domain verified status campuses",
      })
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    return ReturnAppData.getData({
      res,
      data: verifications.map(serializeVerification),
      message: "student_verification_queue",
    });
  } catch (error) {
    next(error);
  }
};

const findAdminVerification = async (req) => {
  if (!isValidObjectId(req.params.id))
    return { scoped: await adminVerificationsQuery(req), verification: null };
  const scoped = await adminVerificationsQuery(req);
  if (!scoped) return { scoped: null, verification: null };
  const query = {
    _id: req.params.id,
    ...scoped.query,
  };
  delete query.status;
  const verification = await StudentVerificationModel.findOne(query).populate({
    path: "university_id",
    select:
      "name name_en logo city country email_domain verified status campuses",
  });
  return { scoped, verification };
};

const adminApproveVerification = async (req, res, next) => {
  try {
    const { scoped, verification } = await findAdminVerification(req);
    if (!scoped) {
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }
    if (!verification) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }

    verification.status = "verified";
    verification.reviewed_by = req.user._id;
    verification.reviewed_at = new Date();
    verification.rejection_reason = "";
    verification.requested_information = "";
    await verification.save();

    await applyVerifiedStudentToEmployee({
      verification: verification.toObject(),
      university: verification.university_id,
    });

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: scoped.superAdmin ? "admin" : "university_admin",
      action: "campus_verification_approved",
      entityType: "other",
      entityId: verification._id,
      newValue: {
        status: "verified",
        university_id:
          verification.university_id?._id || verification.university_id,
      },
    });

    campusVerificationApprovedNotification(verification.toObject()).catch?.(
      console.error,
    );
    await recordAnalyticsEvent({
      req,
      event: "campus_verification_approved",
      userId: verification.user_id,
      entityType: "campus",
      entityId: verification._id,
      metadata: {
        university_id: String(
          verification.university_id?._id || verification.university_id || "",
        ),
        reviewed_by: String(req.user._id || ""),
        admin_scope: scoped.superAdmin ? "super_admin" : "university_admin",
      },
    }).catch(() => null);

    return ReturnAppData.updateData({
      res,
      data: serializeVerification(verification.toObject()),
      message: "student_verification_approved",
    });
  } catch (error) {
    next(error);
  }
};

const adminRejectVerification = async (req, res, next) => {
  try {
    const { scoped, verification } = await findAdminVerification(req);
    if (!scoped) {
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }
    if (!verification) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }

    const reason = cleanText(
      req.body?.reason ||
        req.body?.rejection_reason ||
        "Verification evidence was not accepted.",
    );
    verification.status = "rejected";
    verification.reviewed_by = req.user._id;
    verification.reviewed_at = new Date();
    verification.rejection_reason = reason;
    verification.requested_information = "";
    await verification.save();

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: scoped.superAdmin ? "admin" : "university_admin",
      action: "campus_verification_rejected",
      entityType: "other",
      entityId: verification._id,
      newValue: {
        status: "rejected",
        reason,
      },
    });

    campusVerificationRejectedNotification(
      verification.toObject(),
      reason,
    ).catch?.(console.error);

    return ReturnAppData.updateData({
      res,
      data: serializeVerification(verification.toObject()),
      message: "student_verification_rejected",
    });
  } catch (error) {
    next(error);
  }
};

const adminRequestVerificationInfo = async (req, res, next) => {
  try {
    const { scoped, verification } = await findAdminVerification(req);
    if (!scoped) {
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }
    if (!verification) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "student_verification_not_found",
      });
    }

    const requestedInformation = cleanText(
      req.body?.reason ||
        req.body?.requested_information ||
        "More information is required.",
    );
    verification.status = "needs_more_information";
    verification.reviewed_by = req.user._id;
    verification.reviewed_at = new Date();
    verification.requested_information = requestedInformation;
    verification.rejection_reason = "";
    await verification.save();

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: scoped.superAdmin ? "admin" : "university_admin",
      action: "campus_verification_more_information_requested",
      entityType: "other",
      entityId: verification._id,
      newValue: {
        status: "needs_more_information",
        requested_information: requestedInformation,
      },
    });

    campusVerificationMoreInfoNotification(
      verification.toObject(),
      requestedInformation,
    ).catch?.(console.error);

    return ReturnAppData.updateData({
      res,
      data: serializeVerification(verification.toObject()),
      message: "student_verification_more_information_requested",
    });
  } catch (error) {
    next(error);
  }
};

const userUniversityOpportunities = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });
    const partnerCompanyIds = (university.partners || [])
      .map((partner) => partner.company_id)
      .filter(Boolean);
    const limit = normalizeLimit(req.query.limit);
    const [jobs, requests] = await Promise.all([
      jobsModel
        .find({
          $or: [
            { is_for_students: true },
            { is_for_fresh_graduates: true },
            { candidate_target: { $in: ["students", "fresh_graduates"] } },
          ],
          ...(partnerCompanyIds.length
            ? { company_id: { $in: partnerCompanyIds } }
            : {}),
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      UniversityOpportunityRequestModel.find({ university_id: university._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const submittedRequests = requests.map((request) => ({
      ...request,
      _id: request._id,
      job_name: request.title,
      candidate_target: request.target,
      is_for_students: request.target === "students",
      is_for_fresh_graduates: request.target === "fresh_graduates",
      publish_status: request.status,
      work_mode: "Campus request",
      location: { city: university.city || "Campus" },
      source: "university_opportunity_request",
    }));

    const opportunities = [...submittedRequests, ...jobs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, limit);

    return ReturnAppData.getData({
      res,
      data: opportunities,
      message: "campus_university_opportunities",
    });
  } catch (error) {
    next(error);
  }
};

const userUniversityStudents = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });
    const studentsList = await EmployeeModel.find(
      buildUniversityStudentQuery(university),
    )
      .select(
        "profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion user_id",
      )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .sort({ updatedAt: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();
    return ReturnAppData.getData({
      res,
      data: studentsList,
      message: "campus_university_students",
    });
  } catch (error) {
    next(error);
  }
};

const userUniversityStudentDetail = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });
    const studentId = cleanText(req.params.studentId || req.params.id);
    if (!isValidObjectId(studentId)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_student_id",
      });
    }

    const student = await EmployeeModel.findOne({
      _id: studentId,
      ...buildUniversityStudentQuery(university),
    })
      .select(
        "profile_headline current_job_title about_me candidate_stage student_profile graduation_year profile_completion user_id skills languages links cvs",
      )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name email image",
      })
      .lean();

    if (!student) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_student_not_found",
      });
    }

    return ReturnAppData.getData({
      res,
      data: student,
      message: "campus_university_student",
    });
  } catch (error) {
    next(error);
  }
};

const userUniversityStudentCareerPassport = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }

    if (!isValidObjectId(req.params.studentId)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_student_id",
      });
    }

    const student = await EmployeeModel.findOne({
      _id: req.params.studentId,
      $and: [
        buildUniversityStudentQuery(university),
        {
          $or: [
            { student_email_verified: true },
            { "student_profile.student_email_verified": true },
          ],
        },
      ],
    })
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name image",
      })
      .lean();

    if (!student) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "verified_student_not_found",
      });
    }

    const result = await getCareerPassportSafeViewForEmployee({
      employee: student,
      viewerType: "university",
    });

    return ReturnAppData.getData({
      res,
      data: {
        student: {
          id: String(student._id || ""),
          name: result.snapshot.identity.name,
          university: result.snapshot.education.university,
          major: result.snapshot.education.major,
          verification_status: result.snapshot.education.verification_status,
        },
        passport: result.snapshot,
        score: result.score,
        visibility: result.visibility,
        viewer_type: result.viewerType,
      },
      message: "university_student_career_passport",
    });
  } catch (error) {
    next(error);
  }
};

const serializeUniversityPartner = (partner = {}) => {
  const company =
    partner.company_id && typeof partner.company_id === "object"
      ? partner.company_id
      : null;
  return {
    _id: partner._id,
    company_id: idOf(partner.company_id),
    company: company
      ? {
          _id: company._id,
          company_name: company.company_name || "",
          logo: company.logo || "",
          company_country: company.company_country || "",
          company_city: company.company_city || "",
          is_verified: company.is_verified === true,
        }
      : null,
    status: partner.status || "pending",
    note: partner.note || "",
    company_note: partner.company_note || partner.note || "",
    university_note: partner.university_note || "",
    requested_by_user_id: partner.requested_by_user_id || null,
    reviewed_by_user_id: partner.reviewed_by_user_id || null,
    reviewed_at: partner.reviewed_at || null,
    expires_at: partner.expires_at || null,
    allowed_departments: partner.allowed_departments || [],
    allowed_programs: partner.allowed_programs || [],
    allowed_campuses: partner.allowed_campuses || [],
    access_level: partner.access_level || "talent_pool_limited",
    is_active_for_talent_pool: partnerIsActiveForTalentPool(partner),
    created_at: partner.createdAt || null,
    updated_at: partner.updatedAt || null,
  };
};

const userUniversityPartners = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = await UniversityModel.findOne({
      _id: scope?.university?._id,
    })
      .populate({
        path: "partners.company_id",
        select: "company_name logo company_country company_city is_verified",
      })
      .lean();
    if (!university)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });
    return ReturnAppData.getData({
      res,
      data: (university.partners || []).map(serializeUniversityPartner),
      message: "campus_university_partners",
    });
  } catch (error) {
    next(error);
  }
};

const updateUniversityPartnerStatus = (nextStatus) => async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const universityId = scope?.university?._id;
    if (!universityId) {
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }

    const partnerId = cleanText(req.params.partnerId || req.params.id);
    if (!isValidObjectId(partnerId)) {
      return ReturnAppData.updateError({
        res,
        status: 400,
        message: "invalid_partner_id",
      });
    }

    const set = {
      "partners.$.status": nextStatus,
      "partners.$.reviewed_by_user_id": req.user?._id || null,
      "partners.$.reviewed_at": new Date(),
      "partners.$.university_note": cleanText(
        req.body?.university_note || req.body?.note || req.body?.reason,
      ),
    };
    if (nextStatus === "active") {
      set["partners.$.access_level"] = normalizePartnerAccessLevel(
        req.body?.access_level,
      );
      set["partners.$.expires_at"] = parseDateOrNull(req.body?.expires_at);
      set["partners.$.allowed_departments"] = uniqueStringArray(
        req.body?.allowed_departments,
      );
      set["partners.$.allowed_programs"] = uniqueStringArray(
        req.body?.allowed_programs,
      );
      set["partners.$.allowed_campuses"] = uniqueStringArray(
        req.body?.allowed_campuses,
      );
    }

    const university = await UniversityModel.findOneAndUpdate(
      { _id: universityId, "partners._id": partnerId },
      { $set: set },
      { new: true, runValidators: true },
    )
      .populate({
        path: "partners.company_id",
        select: "company_name logo company_country company_city is_verified",
      })
      .lean();

    if (!university) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "campus_partner_not_found",
      });
    }

    const partner = (university.partners || []).find(
      (entry) => String(entry._id) === String(partnerId),
    );

    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: "university_admin",
      action: `campus_partner_${nextStatus}`,
      entityType: "other",
      entityId: partnerId,
      newValue: {
        university_id: universityId,
        status: nextStatus,
        company_id: idOf(partner?.company_id),
      },
    });

    return ReturnAppData.updateData({
      res,
      data: serializeUniversityPartner(partner),
      message: `campus_partner_${nextStatus}`,
    });
  } catch (error) {
    next(error);
  }
};

const approveUniversityPartner = updateUniversityPartnerStatus("active");
const rejectUniversityPartner = updateUniversityPartnerStatus("rejected");
const suspendUniversityPartner = updateUniversityPartnerStatus("suspended");

const userUniversityEmployabilityAnalytics = async (req, res, next) => {
  try {
    const report = await buildUniversityDashboardReport(req);
    if (!report) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }

    return ReturnAppData.getData({
      res,
      data: {
        university: report.university,
        metrics: report.metrics,
        readiness: report.readiness,
        cv: report.cv,
        skills: report.skills,
        majors: report.majors,
        generated_at: report.generated_at,
      },
      message: "university_employability_analytics",
    });
  } catch (error) {
    next(error);
  }
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const userUniversityOutcomeReport = async (req, res, next) => {
  try {
    const report = await buildUniversityDashboardReport(req);
    if (!report) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "university_admin_context_required",
      });
    }

    const rows = [
      ["metric", "value"],
      ["registered_students", report.metrics.registered_students],
      ["verified_students", report.metrics.verified_students],
      ["pending_verifications", report.metrics.pending_verifications],
      [
        "average_employability_score",
        report.metrics.average_employability_score,
      ],
      ["cv_completion_rate", report.metrics.cv_completion_rate],
      ["internship_applications", report.metrics.internship_applications],
      ["interview_scheduled_count", report.metrics.interview_scheduled_count],
      ["hired_students", report.metrics.hired_students],
    ];

    if (cleanText(req.query?.format).toLowerCase() === "csv") {
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="university-outcomes.csv"',
      );
      return res.status(200).send(csv);
    }

    return ReturnAppData.getData({
      res,
      data: {
        university: report.university,
        summary: report.metrics,
        applications: report.applications,
        verification: {
          verified: report.metrics.verified_students,
          pending: report.metrics.pending_verifications,
          rejected: report.metrics.rejected_verifications,
          needs_more_information: report.metrics.needs_more_information,
        },
        readiness: report.readiness,
        cv: report.cv,
        skills: report.skills,
        majors: report.majors,
        companies: report.companies,
        export_formats: ["json", "csv"],
        generated_at: report.generated_at,
      },
      message: "university_outcomes_report",
    });
  } catch (error) {
    next(error);
  }
};

const createUniversityOpportunityRequest = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university)
      return ReturnAppData.createError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });
    const title = String(
      req.body?.title || req.body?.job_name || "Campus internship request",
    ).trim();
    if (!title)
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "title_required",
      });
    const target =
      String(
        req.body?.target || req.body?.candidate_target || "students",
      ).toLowerCase() === "fresh_graduates"
        ? "fresh_graduates"
        : "students";
    const request = await UniversityOpportunityRequestModel.create({
      university_id: university._id,
      requested_by_user_id: req.user._id,
      title,
      description: String(
        req.body?.description ||
          req.body?.details ||
          "Career center opportunity request.",
      ).trim(),
      target,
      requested_count: Number(req.body?.requested_count || 25),
      note: String(req.body?.note || "").trim(),
    });
    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: scope.superAdmin ? "admin" : "university_admin",
      action: "university_opportunity_request_created",
      entityType: "other",
      entityId: request._id,
      newValue: {
        university_id: university._id,
        target,
        requested_count: request.requested_count,
      },
    });
    return ReturnAppData.createData({
      res,
      status: 202,
      data: request,
      message: "campus_university_opportunity_request_created",
    });
  } catch (error) {
    next(error);
  }
};

const companyOpportunities = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req, "_id");
    if (!company)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "company_not_found",
      });

    const limit = normalizeLimit(req.query.limit);
    const [jobs, campusRequests, legacyRequests] = await Promise.all([
      jobsModel
        .find({
          company_id: company._id,
          $or: [
            { is_for_students: true },
            { is_for_fresh_graduates: true },
            { candidate_target: { $in: ["students", "fresh_graduates"] } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      CampusOpportunityModel.find({
        company_id: company._id,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      JobZainTalentRequestModel.find({
        company_id: company._id,
        "notes.note": /^Campus target:/,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const submittedCampusRequests = campusRequests.map((request) => ({
      ...request,
      _id: request._id,
      job_name: request.title,
      candidate_target: campusCandidateTargets(request.target),
      is_for_students: request.target !== "fresh_graduates",
      is_for_fresh_graduates: request.target === "fresh_graduates",
      publish_status: request.lifecycle_status,
      request_status: request.request_status,
      lifecycle_status: request.lifecycle_status,
      work_mode: "Campus request",
      city: request.cities?.[0] || "Campus",
      source: "campus_opportunity",
    }));

    const submittedLegacyRequests = legacyRequests.map((request) => ({
      ...request,
      _id: request._id,
      job_name: request.title,
      candidate_target: request.notes?.[0]?.note?.includes("fresh_graduates")
        ? ["fresh_graduates"]
        : ["students"],
      is_for_students: !request.notes?.[0]?.note?.includes("fresh_graduates"),
      is_for_fresh_graduates:
        request.notes?.[0]?.note?.includes("fresh_graduates"),
      publish_status: request.status,
      work_mode: "Campus request",
      city: request.cities?.[0] || "Campus",
      source: "company_campus_opportunity_request",
    }));

    const opportunities = [...submittedCampusRequests, ...submittedLegacyRequests, ...jobs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, limit);

    return ReturnAppData.getData({
      res,
      data: opportunities,
      message: "campus_company_opportunities",
    });
  } catch (error) {
    next(error);
  }
};

const companyCampusActorType = (req) =>
  req.activeContext?.context_type === "company_member"
    ? "company_member"
    : "company_owner";

const sanitizeCampusStudentForCompany = (student = {}) => {
  const profile = student.student_profile || {};
  const visibility = campusVisibilityFromProfile(profile);
  const user =
    student.user_id && typeof student.user_id === "object"
      ? student.user_id
      : null;
  const contactVisibility =
    cleanText(profile.contact_visibility || "hidden") || "hidden";
  const cvVisibility = cleanText(profile.cv_visibility || "hidden") || "hidden";
  const discoveryVisibility =
    cleanText(profile.campus_discovery_visibility || "partner_companies") ||
    "partner_companies";

  const studentProfile = {
    university: profile.university || "",
    university_id: profile.university_id || null,
    specialty: profile.specialty || "",
    sub_specialty: profile.sub_specialty || "",
    academic_year: profile.academic_year || "",
    enrollment_status: profile.enrollment_status || "",
    expected_graduation_year:
      profile.expected_graduation_year || student.graduation_year || null,
    student_email_verified: profile.student_email_verified === true,
    readiness_score: profile.readiness_score || student.profile_completion || 0,
    mini_cv_ready: profile.mini_cv_ready === true,
    campus_discovery_visibility: discoveryVisibility,
    campus_visibility: visibility,
  };
  if (visibility.visible_fields.projects) {
    studentProfile.projects = profile.projects || [];
  }
  if (visibility.visible_fields.gpa) {
    studentProfile.gpa = profile.gpa || "";
  }

  return {
    _id: student._id,
    profile_headline: student.profile_headline || "",
    current_job_title: student.current_job_title || "",
    candidate_stage: student.candidate_stage || "",
    graduation_year:
      student.graduation_year || profile.expected_graduation_year || null,
    profile_completion: student.profile_completion || 0,
    profile_visibility: student.profile_visibility || "public",
    user_id: user
      ? {
          _id: user._id,
          first_name: user.first_name || "",
          mid_name: user.mid_name || "",
          last_name: user.last_name || "",
          image: user.image || "",
        }
      : null,
    student_profile: studentProfile,
    skills: student.skills || [],
    languages: student.languages || [],
    links:
      student.profile_visibility === "public"
        ? (student.links || []).map((link) => ({
            title: link.title || "",
            url: link.url || "",
          }))
        : [],
    privacy: {
      opted_in: visibility.talent_pool_opt_in === true,
      partner_visible: visibility.visible_to_partner_companies === true,
      contact_redacted: contactVisibility === "hidden",
      cv_redacted: cvVisibility === "hidden",
      gpa_redacted: visibility.visible_fields.gpa !== true,
      directory_access: "partner_university_only",
    },
  };
};

const campusStudentDirectoryQuery = ({
  companyId,
  partnerUniversityIds = [],
  employeeId = null,
}) => ({
  ...(employeeId ? { _id: employeeId } : {}),
  is_student: true,
  status: true,
  accepted: true,
  profile_visibility: { $ne: "private" },
  blocked_companies: { $ne: companyId },
  "student_profile.student_email_verified": true,
  "student_profile.campus_visibility.talent_pool_opt_in": true,
  "student_profile.campus_visibility.visible_to_partner_companies": true,
  $or: [
    { "student_profile.university_id": { $in: partnerUniversityIds } },
    { university_id: { $in: partnerUniversityIds } },
  ],
});

const students = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req, "_id");
    if (!company)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "company_not_found",
      });

    const partnerUniversities = await activePartnerUniversitiesForCompany(
      company._id,
    );
    const partnerUniversityIds = partnerUniversities
      .map((university) => university._id)
      .filter(Boolean);

    if (!partnerUniversityIds.length) {
      await writeAuditLog({
        req,
        companyId: company._id,
        actorUserId: req.user?._id,
        actorType: companyCampusActorType(req),
        action: "campus_student_directory_denied",
        entityType: "company",
        entityId: company._id,
        newValue: { reason: "no_active_university_partnership" },
      });

      return ReturnAppData.getData({
        res,
        data: [],
        message: "campus_students_partner_access_required",
        other: {
          access: {
            requires_active_partnership: true,
            partner_university_count: 0,
            returned_count: 0,
          },
        },
      });
    }

    const list = await EmployeeModel.find(
      campusStudentDirectoryQuery({
        companyId: company._id,
        partnerUniversityIds,
      }),
    )
      .select(
        "profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion profile_visibility user_id skills languages links",
      )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name image",
      })
      .sort({ updatedAt: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: req.user?._id,
      actorType: companyCampusActorType(req),
      action: "campus_student_directory_viewed",
      entityType: "company",
      entityId: company._id,
      newValue: {
        returned_count: list.length,
        partner_university_count: partnerUniversityIds.length,
        student_ids: list.map((student) => student._id),
      },
    });

    return ReturnAppData.getData({
      res,
      data: list.map(sanitizeCampusStudentForCompany),
      message: "campus_students",
      other: {
        access: {
          requires_active_partnership: true,
          partner_university_count: partnerUniversityIds.length,
          returned_count: list.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const companyStudentDetail = async (req, res, next) => {
  try {
    const employeeId = cleanText(req.params.employeeId || req.params.id);
    if (!isValidObjectId(employeeId)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_employee_id",
      });
    }

    const company = await getCompanyForRequest(req, "_id");
    if (!company)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "company_not_found",
      });

    const partnerUniversities = await activePartnerUniversitiesForCompany(
      company._id,
    );
    const partnerUniversityIds = partnerUniversities
      .map((university) => university._id)
      .filter(Boolean);

    if (!partnerUniversityIds.length) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "campus_students_partner_access_required",
      });
    }

    const student = await EmployeeModel.findOne(
      campusStudentDirectoryQuery({
        companyId: company._id,
        partnerUniversityIds,
        employeeId,
      }),
    )
      .select(
        "profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion profile_visibility user_id skills languages links",
      )
      .populate({
        path: "user_id",
        select: "first_name mid_name last_name image",
      })
      .lean();

    if (!student) {
      await writeAuditLog({
        req,
        companyId: company._id,
        actorUserId: req.user?._id,
        actorType: companyCampusActorType(req),
        action: "campus_student_profile_denied",
        entityType: "company",
        entityId: company._id,
        newValue: { employee_id: employeeId },
      });
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_student_not_found_or_not_visible",
      });
    }

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: req.user?._id,
      actorType: companyCampusActorType(req),
      action: "campus_student_profile_viewed",
      entityType: "company",
      entityId: company._id,
      newValue: { employee_id: student._id },
    });

    return ReturnAppData.getData({
      res,
      data: sanitizeCampusStudentForCompany(student),
      message: "campus_student",
    });
  } catch (error) {
    next(error);
  }
};

const partners = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req, "_id");
    if (!company)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "company_not_found",
      });

    const universities = await UniversityModel.find({
      status: { $ne: "suspended" },
    })
      .populate({
        path: "partners.company_id",
        select: "company_name logo company_country company_city is_verified",
      })
      .sort({ verified: -1, name: 1 })
      .limit(normalizeLimit(req.query.limit, 20, 100))
      .lean();

    return ReturnAppData.getData({
      res,
      data: universities.map((university) =>
        serializeCompanyPartnerUniversity(university, company._id),
      ),
      message: "campus_partners",
    });
  } catch (error) {
    next(error);
  }
};

const serializeCompanyPartnerUniversity = (university = {}, companyId) => {
  const partner =
    (university.partners || []).find(
      (entry) => String(idOf(entry.company_id)) === String(companyId),
    ) || null;
  return {
    ...publicUniversity(university),
    partner: partner
      ? {
          _id: partner._id,
          company_id: idOf(partner.company_id),
          status: partner.status || "pending",
          note: partner.note || "",
          company_note: partner.company_note || partner.note || "",
          university_note: partner.university_note || "",
          access_level: partner.access_level || "talent_pool_limited",
          expires_at: partner.expires_at || null,
          is_active_for_talent_pool: partnerIsActiveForTalentPool(partner),
        }
      : null,
  };
};

const companyPartnerDetail = async (req, res, next) => {
  try {
    const universityId = cleanText(req.params.universityId || req.params.id);
    if (!isValidObjectId(universityId)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_university_id",
      });
    }

    const company = await getCompanyForRequest(req, "_id");
    if (!company)
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "company_not_found",
      });

    const university = await UniversityModel.findOne({
      _id: universityId,
      status: { $ne: "suspended" },
    })
      .populate({
        path: "partners.company_id",
        select: "company_name logo company_country company_city is_verified",
      })
      .lean();

    if (!university) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "campus_university_not_found",
      });
    }

    return ReturnAppData.getData({
      res,
      data: serializeCompanyPartnerUniversity(university, company._id),
      message: "campus_partner",
    });
  } catch (error) {
    next(error);
  }
};

const addPartner = async (req, res, next) => {
  try {
    const {
      university_id: submittedUniversityId,
      university_ref: universityRef,
      note = "",
    } = req.body || {};
    const ref = String(universityRef || submittedUniversityId || "").trim();
    const refLower = ref.toLowerCase();
    const university = isValidObjectId(ref)
      ? await UniversityModel.findById(ref).select("_id").lean()
      : await UniversityModel.findOne({
          status: { $ne: "suspended" },
          $or: [
            { email_domain: refLower },
            { career_center_email: refLower },
            { name: new RegExp(`^${escapeRegExp(ref)}$`, "i") },
            { name_en: new RegExp(`^${escapeRegExp(ref)}$`, "i") },
          ],
        })
          .select("_id")
          .lean();
    const company = await getCompanyForRequest(req, "_id");
    const companyId = company?._id;

    if (!university?._id || !isValidObjectId(companyId)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: "invalid_university_or_company_id",
      });
    }

    const updatedUniversity = await UniversityModel.findOneAndUpdate(
      { _id: university._id, "partners.company_id": { $ne: companyId } },
      {
        $push: {
          partners: {
            company_id: companyId,
            status: "pending",
            note,
            company_note: cleanText(req.body?.company_note || note),
            requested_by_user_id: req.user?._id || null,
            access_level: normalizePartnerAccessLevel(req.body?.access_level),
          },
        },
      },
      { new: true },
    ).lean();

    if (!updatedUniversity) {
      return ReturnAppData.createError({
        res,
        status: 409,
        message: "partner_already_exists_or_university_missing",
      });
    }

    return ReturnAppData.createData({
      res,
      data: serializeCompanyPartnerUniversity(updatedUniversity, companyId),
      message: "campus_partner_requested",
    });
  } catch (error) {
    next(error);
  }
};

const cancelCompanyPartnerRequest = async (req, res, next) => {
  try {
    const universityId = cleanText(req.params.universityId || req.params.id);
    if (!isValidObjectId(universityId)) {
      return ReturnAppData.updateError({
        res,
        status: 400,
        message: "invalid_university_id",
      });
    }

    const company = await getCompanyForRequest(req, "_id");
    if (!company)
      return ReturnAppData.updateError({
        res,
        status: 403,
        message: "company_not_found",
      });

    const updatedUniversity = await UniversityModel.findOneAndUpdate(
      {
        _id: universityId,
        partners: {
          $elemMatch: { company_id: company._id, status: "pending" },
        },
      },
      {
        $set: {
          "partners.$.status": "rejected",
          "partners.$.company_note": cleanText(
            req.body?.company_note || req.body?.note || "Cancelled by company",
          ),
          "partners.$.reviewed_at": new Date(),
        },
      },
      { new: true, runValidators: true },
    ).lean();

    if (!updatedUniversity) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "pending_campus_partner_request_not_found",
      });
    }

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: req.user?._id,
      actorType: companyCampusActorType(req),
      action: "campus_partner_request_cancelled",
      entityType: "company",
      entityId: company._id,
      newValue: { university_id: universityId },
    });

    return ReturnAppData.updateData({
      res,
      data: serializeCompanyPartnerUniversity(updatedUniversity, company._id),
      message: "campus_partner_request_cancelled",
    });
  } catch (error) {
    next(error);
  }
};

const adminCampusPartners = async (req, res, next) => {
  try {
    const status = cleanText(req.query?.status).toLowerCase();
    const universities = await UniversityModel.find({
      ...(status && status !== "all" ? { "partners.status": status } : {}),
    })
      .populate({
        path: "partners.company_id",
        select: "company_name logo company_country company_city is_verified",
      })
      .sort({ updatedAt: -1 })
      .limit(normalizeLimit(req.query.limit, 50, 200))
      .lean();

    const rows = [];
    for (const university of universities) {
      for (const partner of university.partners || []) {
        if (status && status !== "all" && partner.status !== status) continue;
        rows.push({
          university: publicUniversity(university),
          partner: serializeUniversityPartner(partner),
        });
      }
    }

    return ReturnAppData.getData({
      res,
      data: rows,
      message: "campus_partners",
    });
  } catch (error) {
    next(error);
  }
};

const adminCampusPrivacyAudit = async (req, res, next) => {
  try {
    const logs = await AuditLogModel.find({
      action: {
        $in: [
          "campus_student_directory_denied",
          "campus_student_directory_viewed",
          "campus_student_profile_denied",
          "campus_student_profile_viewed",
          "campus_talent_visibility_opted_in",
          "campus_talent_visibility_opted_out",
        ],
      },
    })
      .populate({ path: "company_id", select: "company_name logo" })
      .populate({
        path: "actor_user_id",
        select: "first_name mid_name last_name email",
      })
      .sort({ createdAt: -1 })
      .limit(normalizeLimit(req.query.limit, 50, 200))
      .lean();

    return ReturnAppData.getData({
      res,
      data: logs,
      message: "campus_privacy_audit",
    });
  } catch (error) {
    next(error);
  }
};

const listUniversities = async (req, res, next) => {
  try {
    const universities = await UniversityModel.find({})
      .sort({ createdAt: -1 })
      .limit(normalizeLimit(req.query.limit, 50, 100))
      .lean();

    return ReturnAppData.getData({
      res,
      data: universities.map(publicUniversity),
      message: "universities",
    });
  } catch (error) {
    next(error);
  }
};

const listUniversityCampuses = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "invalid_university_id",
      });
    }

    const university = await UniversityModel.findOne({
      _id: req.params.id,
      status: { $ne: "suspended" },
    }).lean();
    if (!university) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "university_not_found",
      });
    }

    const campuses =
      Array.isArray(university.campuses) && university.campuses.length
        ? university.campuses
        : [
            {
              id: String(university._id),
              name: university.name || university.name_en || "Main campus",
              city: university.city || "",
              status: "active",
            },
          ];

    return ReturnAppData.getData({
      res,
      data: campuses,
      message: "university_campuses",
    });
  } catch (error) {
    next(error);
  }
};

const createUniversity = async (req, res, next) => {
  try {
    const payload = normalizeUniversityCreatePayload(req.body || {});
    if (
      !payload.name ||
      !payload.email_domain ||
      !payload.career_center_email
    ) {
      return ReturnAppData.createError({
        res,
        status: 422,
        message: "university_name_and_email_domain_required",
      });
    }

    const university = await UniversityModel.create(payload);
    return ReturnAppData.createData({
      res,
      data: university,
      message: "university_created",
    });
  } catch (error) {
    next(error);
  }
};

const updateUniversityStatus = async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toLowerCase();
    if (!["active", "pending", "suspended"].includes(status)) {
      return ReturnAppData.updateError({
        res,
        status: 400,
        message: "invalid_university_status",
      });
    }

    const university = await UniversityModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          verified: status === "active",
        },
      },
      { new: true, runValidators: true },
    ).lean();

    if (!university)
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "university_not_found",
      });

    return ReturnAppData.updateData({
      res,
      data: university,
      message: "university_status_updated",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  overview,
  opportunities,
  profile,
  updateProfile,
  getTalentVisibility,
  updateTalentVisibility,
  resources,
  listUniversityEvents,
  createUniversityEvent,
  updateUniversityEvent,
  archiveUniversityEvent,
  registerEvent,
  studentVerificationStatus,
  startStudentVerification,
  confirmStudentVerificationEmail,
  uploadStudentVerificationDocument,
  downloadStudentVerificationDocument,
  adminDownloadStudentVerificationDocument,
  resubmitStudentVerification,
  adminListVerifications,
  adminApproveVerification,
  adminRejectVerification,
  adminRequestVerificationInfo,
  listUniversityMembers,
  upsertUniversityMember,
  updateUniversityMember,
  removeUniversityMember,
  universityOverview,
  userUniversityOverview,
  userUniversityOpportunities,
  userUniversityStudents,
  userUniversityStudentDetail,
  userUniversityStudentCareerPassport,
  userUniversityPartners,
  approveUniversityPartner,
  rejectUniversityPartner,
  suspendUniversityPartner,
  userUniversityEmployabilityAnalytics,
  userUniversityOutcomeReport,
  createUniversityOpportunityRequest,
  companyOpportunities,
  createCompanyOpportunity,
  students,
  companyStudentDetail,
  partners,
  companyPartnerDetail,
  addPartner,
  cancelCompanyPartnerRequest,
  adminCampusPartners,
  adminCampusPrivacyAudit,
  listUniversities,
  listUniversityCampuses,
  createUniversity,
  updateUniversityStatus,
};
