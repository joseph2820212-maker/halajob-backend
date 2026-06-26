import mongoose from "mongoose";
import crypto from "crypto";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import {
  CampusEventRegistrationModel,
  CompanyModel,
  EmployeeModel,
  PageModel,
  UniversityModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  InterviewModel,
  JobZainTalentRequestModel,
  StudentVerificationModel,
  UniversityMembershipModel,
  UniversityOpportunityRequestModel,
  jobsModel,
} from "../../../models/index.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";
import {
  campusEventRegisteredNotification,
  campusVerificationApprovedNotification,
  campusVerificationMoreInfoNotification,
  campusVerificationRejectedNotification,
} from "../../../notification/CampusNotifications.js";

const { isValidObjectId } = mongoose;

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
  deleted_at: null,
};

const allowedTargets = new Set(["all", "students", "graduates", "fresh_graduates"]);

const normalizeLimit = (value, fallback = 12, max = 50) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(Math.floor(number), max);
};

const toStringArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const cleanText = (value) => String(value || "").trim();
const normalizeEmail = (value) => cleanText(value).toLowerCase();
const idOf = (value) => value?._id || value || null;

const hashVerificationCode = ({ code, userId }) =>
  crypto
    .createHash("sha256")
    .update(`${code}:${userId}:${process.env.JWT_SECRET || "halajob-campus"}`)
    .digest("hex");

const createVerificationCode = () => String(crypto.randomInt(100000, 1000000));

const normalizeVerificationMethod = (value) => {
  const method = cleanText(value).toLowerCase();
  if (["email", "document", "invite_code", "manual"].includes(method)) return method;
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

const normalizeUniversityCreatePayload = (body = {}) => {
  const name = cleanText(body.name || body.name_en);
  const emailDomain = cleanText(body.email_domain).toLowerCase().replace(/^@+/, "");
  const careerCenterEmail = cleanText(body.career_center_email).toLowerCase() || (emailDomain ? `careers@${emailDomain}` : "");
  const status = ["active", "pending", "suspended"].includes(cleanText(body.status).toLowerCase())
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
    students_count: Number.isFinite(studentsCount) && studentsCount >= 0 ? Math.floor(studentsCount) : 0,
  };
};

const getEmployee = async (req) =>
  EmployeeModel.findOne({ user_id: req.user._id })
    .populate({ path: "user_id", select: "first_name mid_name last_name email image" })
    .lean();

const getCompanyForRequest = async (req, select = "") => {
  if (req.company?._id) {
    const query = CompanyModel.findById(req.company._id);
    return (select ? query.select(select) : query).lean();
  }

  const query = CompanyModel.findOne(buildCompanyOwnerQuery(req.user._id));
  return (select ? query.select(select) : query).lean();
};

const getEmailDomain = (email = "") => String(email).trim().toLowerCase().split("@")[1] || "";

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

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUniversityForRequest = async (req) => {
  const email = String(req.user?.email || "").trim().toLowerCase();
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
  const email = String(req.user?.email || "").trim().toLowerCase();
  const domain = getEmailDomain(email);
  if (!domain || !isAcademicDomain(domain)) return null;
  const existingAnyStatus = await UniversityModel.findOne({
    $or: [{ email_domain: domain }, { career_center_email: email }],
  }).lean();
  if (existingAnyStatus) return existingAnyStatus.status === "suspended" ? null : existingAnyStatus;
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
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean();
};

const getCareerCenterUniversityForRequest = async (req) => {
  const email = String(req.user?.email || "").trim().toLowerCase();
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
    return UniversityModel.findOne({ _id: ref, status: { $ne: "suspended" } }).lean();
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

  if (activeContext.context_type === "super_admin" && activeContext.status === "active") {
    const requestedUniversity = await getUniversityByRef(req.query?.university_id || req.body?.university_id);
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
    const isCareerCenter = normalizeEmail(university.career_center_email) === normalizeEmail(req.user?.email);
    if (membership || isCareerCenter) {
      return { superAdmin: false, university };
    }
  }

  const careerCenterUniversity = await getCareerCenterUniversityForRequest(req);
  if (careerCenterUniversity) return { superAdmin: false, university: careerCenterUniversity };
  return null;
};

const serializeVerification = (verification = {}) => {
  const university =
    verification.university_id && typeof verification.university_id === "object"
      ? verification.university_id
      : null;

  return {
    id: String(verification._id || ""),
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
    university: university.name || verification.submitted_payload?.university || "",
    university_id: university._id,
    "student_profile.university": university.name || "",
    "student_profile.university_id": university._id,
    "student_profile.student_email": verification.student_email || "",
    "student_profile.student_email_verified": true,
    "search_filters.career.is_student": true,
  };

  if (verification.faculty_major) set["student_profile.specialty"] = verification.faculty_major;
  if (verification.submitted_payload?.academic_year) {
    const academicYear = normalizeAcademicYear(verification.submitted_payload.academic_year);
    if (academicYear) set["student_profile.academic_year"] = academicYear;
  }
  if (verification.graduation_year) {
    set.graduation_year = verification.graduation_year;
    set["student_profile.expected_graduation_year"] = verification.graduation_year;
  }

  return EmployeeModel.findOneAndUpdate(
    { user_id: verification.user_id },
    { $set: set },
    { new: true, runValidators: true }
  ).lean();
};

const updateStudentProfileFromVerification = async ({ req, university, body = {}, studentEmail = "" }) => {
  const employee = await EmployeeModel.findOne({ user_id: req.user._id }).lean();
  if (!employee) return null;

  const set = {
    is_student: true,
    candidate_stage: "student",
    university: university.name || "",
    university_id: university._id,
    "student_profile.university": university.name || "",
    "student_profile.university_id": university._id,
    "student_profile.student_email": studentEmail || employee.student_profile?.student_email || "",
    "search_filters.career.is_student": true,
  };
  const major = cleanText(body.faculty_major || body.major || body.specialty);
  const campus = cleanText(body.campus);
  const academicYear = normalizeAcademicYear(body.academic_year);
  const graduationYear = normalizeGraduationYear(body.graduation_year || body.expected_graduation_year);

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
    { new: true, runValidators: true }
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
        { candidate_target: { $in: ["students", "graduates", "fresh_graduates"] } },
        { is_for_students: true },
        { is_for_graduates: true },
        { is_for_fresh_graduates: true },
        { "search_index.filters.candidate_target": { $in: ["students", "graduates", "fresh_graduates"] } },
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
      return ReturnAppData.getError({ res, status: 404, message: "campus_profile_not_found" });
    }

    const [applications, saved, interviews, recommended] = await Promise.all([
      UserApplyingJobModel.countDocuments({ user_id: req.user._id }),
      UserSavedJobModel.countDocuments({ user_id: req.user._id }),
      InterviewModel.countDocuments({
        employee_user_id: req.user._id,
        status: { $in: ["scheduled", "rescheduled"] },
        start_at: { $gte: new Date() },
      }),
      jobsModel.find(campusJobQuery(employee.candidate_stage === "fresh_graduate" ? "fresh_graduates" : "students")).sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    return ReturnAppData.getData({
      res,
      data: {
        profile: employee,
        stats: {
          applications,
          saved_jobs: saved,
          upcoming_interviews: interviews,
          readiness_score: employee.student_profile?.readiness_score || employee.profile_completion || 0,
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
    const target = String(req.query.target || req.query.candidate_target || "students").toLowerCase();
    const jobs = await jobsModel
      .find(campusJobQuery(target))
      .sort({ priority: -1, createdAt: -1, _id: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();

    return ReturnAppData.getData({ res, data: jobs, message: "campus_opportunities" });
  } catch (error) {
    next(error);
  }
};

const createCompanyOpportunity = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req, "_id owner_user_id");
    if (!company) return ReturnAppData.createError({ res, status: 403, message: "company_not_found" });
    const body = req.body || {};
    const title = String(body.title || body.job_name || "").trim();
    if (!title) return ReturnAppData.createError({ res, status: 422, message: "title_required" });

    const target = String(req.body?.target || req.body?.candidate_target || "students").toLowerCase();
    const candidateTarget = target === "fresh_graduates" ? ["fresh_graduates"] : ["students"];
    const requestedCount = normalizeLimit(body.requested_count, 5, 500);

    const request = await JobZainTalentRequestModel.create({
      company_id: company._id,
      requested_by_user_id: req.user._id,
      title,
      description: String(body.description || body.details || "Campus opportunity request from the company campus portal.").trim(),
      required_skills: toStringArray(body.required_skills),
      preferred_skills: toStringArray(body.preferred_skills),
      countries: toStringArray(body.country || body.countries),
      cities: toStringArray(body.location || body.city || body.cities),
      priority: "normal",
      requested_count: requestedCount,
      notes: [
        {
          by_user_id: req.user._id,
          type: "company",
          note: `Campus target: ${candidateTarget.join(", ")}`,
        },
      ],
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
      return ReturnAppData.getError({ res, status: 404, message: "campus_profile_not_found" });
    }
    return ReturnAppData.getData({ res, data: employee, message: "campus_profile" });
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
      candidate_stage: body.candidate_stage === "fresh_graduate" ? "fresh_graduate" : "student",
      "search_filters.career.is_student": true,
    };

    for (const field of allowed) {
      if (typeof body[field] !== "undefined") {
        set[`student_profile.${field}`] = body[field];
      }
    }

    if (body.expected_graduation_year) set.graduation_year = Number(body.expected_graduation_year);
    if (body.profile_headline) set.profile_headline = String(body.profile_headline).trim();
    if (body.about_me) set.about_me = String(body.about_me).trim();

    const normalizedUniversityName = cleanText(body.university) || cleanText(linkedUniversity?.name);
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
      { new: true, runValidators: true }
    ).lean();

    if (!employee) {
      return ReturnAppData.getError({ res, status: 404, message: "campus_profile_not_found" });
    }

    return ReturnAppData.updateData({ res, data: employee, message: "campus_profile_updated" });
  } catch (error) {
    next(error);
  }
};

const resources = async (req, res, next) => {
  try {
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
      .limit(normalizeLimit(req.query.limit, 8, 20))
      .lean();

    return ReturnAppData.getData({ res, data: pages, message: "campus_resources" });
  } catch (error) {
    next(error);
  }
};

const registerEvent = async (req, res, next) => {
  try {
    const eventId = String(req.params.eventId || req.body?.event_id || "").trim();
    if (!eventId) return ReturnAppData.createError({ res, status: 422, message: "event_id_required" });

    const employee = await EmployeeModel.findOne({ user_id: req.user._id }).select("_id").lean();
    const body = req.body || {};
    const payload = {
      user_id: req.user._id,
      employee_id: employee?._id || null,
      event_id: eventId,
      title: String(body.title || body.event_title || "Campus event").trim(),
      organizer: String(body.organizer || "").trim(),
      kind: String(body.kind || "").trim(),
      date_label: String(body.date_label || body.date || "").trim(),
      mode: String(body.mode || "").trim(),
      status: "registered",
    };

    const registration = await CampusEventRegistrationModel.findOneAndUpdate(
      { user_id: req.user._id, event_id: eventId },
      { $setOnInsert: payload, $set: { status: "registered" } },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    campusEventRegisteredNotification(registration).catch?.(console.error);

    return ReturnAppData.createData({ res, data: registration, message: "campus_event_registered" });
  } catch (error) {
    next(error);
  }
};

const studentVerificationStatus = async (req, res, next) => {
  try {
    const verification = await StudentVerificationModel.findOne({ user_id: req.user._id })
      .populate({ path: "university_id", select: "name name_en logo city country email_domain verified status campuses" })
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
    const employee = await EmployeeModel.findOne({ user_id: req.user._id }).select("_id").lean();
    if (!employee) {
      return ReturnAppData.createError({ res, status: 404, message: "campus_profile_not_found" });
    }

    const university = await getUniversityForVerificationBody(body);
    if (!university) {
      return ReturnAppData.createError({ res, status: 422, message: "university_required" });
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
          verification: serializeVerification({ ...existingVerified, university_id: university }),
        },
        message: "student_already_verified",
      });
    }

    const method = normalizeVerificationMethod(body.method || body.verification_method);
    const studentEmail = normalizeEmail(body.student_email || req.user?.email);
    const emailDomain = getEmailDomain(studentEmail);
    const universityDomain = normalizeEmail(university.email_domain);

    if (method === "email" && (!studentEmail || !universityDomain || emailDomain !== universityDomain)) {
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
      student_id_number: cleanText(body.student_id_number || body.student_number),
      campus: cleanText(body.campus),
      faculty_major: cleanText(body.faculty_major || body.major || body.specialty),
      degree_level: cleanText(body.degree_level || body.degree),
      graduation_year: normalizeGraduationYear(body.graduation_year || body.expected_graduation_year),
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

    await updateStudentProfileFromVerification({ req, university, body, studentEmail });

    const existingPending = await StudentVerificationModel.findOne({
      user_id: req.user._id,
      university_id: university._id,
      status: { $ne: "verified" },
    }).sort({ updatedAt: -1 });

    const verification = existingPending
      ? await StudentVerificationModel.findByIdAndUpdate(
          existingPending._id,
          { $set: payload },
          { new: true, runValidators: true }
        ).lean()
      : await StudentVerificationModel.create(payload);
    const verificationObject = verification.toObject ? verification.toObject() : verification;

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

    return ReturnAppData.createData({
      res,
      status: 202,
      data: {
        status: verificationObject.status,
        email_sent: emailSent,
        verification: serializeVerification({ ...verificationObject, university_id: university }),
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
    if (!code) return ReturnAppData.createError({ res, status: 422, message: "verification_code_required" });

    const verificationId = cleanText(body.verification_id || body.id);
    const query = verificationId && isValidObjectId(verificationId)
      ? { _id: verificationId, user_id: req.user._id }
      : { user_id: req.user._id, method: "email", status: "pending" };

    const verification = await StudentVerificationModel.findOne(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate({ path: "university_id", select: "name name_en logo city country email_domain verified status campuses" });

    if (!verification) {
      return ReturnAppData.createError({ res, status: 404, message: "student_verification_not_found" });
    }

    if (verification.status !== "pending") {
      return ReturnAppData.createError({ res, status: 409, message: "student_verification_not_pending" });
    }

    if (verification.email_code_expires_at && verification.email_code_expires_at.getTime() < Date.now()) {
      verification.status = "expired";
      await verification.save();
      return ReturnAppData.createError({ res, status: 410, message: "student_verification_code_expired" });
    }

    const expectedHash = hashVerificationCode({ code, userId: req.user._id });
    if (!verification.email_code_hash || verification.email_code_hash !== expectedHash) {
      return ReturnAppData.createError({ res, status: 422, message: "invalid_verification_code" });
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
        university_id: verification.university_id?._id || verification.university_id,
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
    const employee = await EmployeeModel.findOne({ user_id: req.user._id }).select("_id").lean();
    if (!employee) {
      return ReturnAppData.createError({ res, status: 404, message: "campus_profile_not_found" });
    }

    const verificationId = cleanText(body.verification_id || body.id);
    let verification = verificationId && isValidObjectId(verificationId)
      ? await StudentVerificationModel.findOne({ _id: verificationId, user_id: req.user._id })
      : null;

    const university = verification
      ? await UniversityModel.findById(verification.university_id).lean()
      : await getUniversityForVerificationBody(body);

    if (!university) {
      return ReturnAppData.createError({ res, status: 422, message: "university_required" });
    }

    const documentUrl = req.file?.filename
      ? `/uploads/${req.file.filename}`
      : cleanText(body.document_url);
    if (!documentUrl) {
      return ReturnAppData.createError({ res, status: 422, message: "student_document_required" });
    }

    const payload = {
      user_id: req.user._id,
      employee_id: employee._id,
      university_id: university._id,
      method: "document",
      status: "pending",
      student_email: normalizeEmail(body.student_email || verification?.student_email || req.user?.email),
      student_id_number: cleanText(body.student_id_number || verification?.student_id_number),
      campus: cleanText(body.campus || verification?.campus),
      faculty_major: cleanText(body.faculty_major || body.major || body.specialty || verification?.faculty_major),
      degree_level: cleanText(body.degree_level || body.degree || verification?.degree_level),
      graduation_year:
        normalizeGraduationYear(body.graduation_year || body.expected_graduation_year) ||
        verification?.graduation_year ||
        null,
      document_url: documentUrl,
      submitted_payload: {
        university: university.name || "",
        university_id: university._id,
        source: cleanText(body.source || "mobile"),
        academic_year: cleanText(body.academic_year || verification?.submitted_payload?.academic_year),
        degree_level: cleanText(body.degree_level || body.degree || verification?.degree_level),
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
          { new: true, runValidators: true }
        ).lean()
      : await StudentVerificationModel.create(payload);
    const verificationObject = verification.toObject ? verification.toObject() : verification;

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
        verification: serializeVerification({ ...verificationObject, university_id: university }),
      },
      message: "student_verification_document_uploaded",
    });
  } catch (error) {
    next(error);
  }
};

const resubmitStudentVerification = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return ReturnAppData.createError({ res, status: 400, message: "invalid_student_verification_id" });
    }

    const verification = await StudentVerificationModel.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (!verification) {
      return ReturnAppData.createError({ res, status: 404, message: "student_verification_not_found" });
    }
    if (!["rejected", "needs_more_information", "expired", "pending"].includes(verification.status)) {
      return ReturnAppData.createError({ res, status: 409, message: "student_verification_cannot_be_resubmitted" });
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
      jobsModel.countDocuments({ $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }] }),
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
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });

    const partnerCompanyIds = (university.partners || []).map((partner) => partner.company_id).filter(Boolean);
    const universityStudentQuery = buildUniversityStudentQuery(university);
    const [studentsCount, opportunitiesCount, requestsCount, placements, verificationStats] = await Promise.all([
      EmployeeModel.countDocuments(universityStudentQuery),
      jobsModel.countDocuments({
        $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }, { candidate_target: { $in: ["students", "fresh_graduates"] } }],
        ...(partnerCompanyIds.length ? { company_id: { $in: partnerCompanyIds } } : {}),
      }),
      UniversityOpportunityRequestModel.countDocuments({ university_id: university._id, status: { $nin: ["closed", "cancelled"] } }),
      UserApplyingJobModel.countDocuments({ status: { $in: ["accepted", "hired"] }, ...(partnerCompanyIds.length ? { company_id: { $in: partnerCompanyIds } } : {}) }),
      StudentVerificationModel.aggregate([
        { $match: { university_id: university._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    const verificationCounts = Object.fromEntries((verificationStats || []).map((item) => [item._id, item.count]));

    return ReturnAppData.getData({
      res,
      data: {
        university,
        stats: {
          registered_students: studentsCount || university.students_count || 0,
          verified_students: verificationCounts.verified || 0,
          pending_verifications: verificationCounts.pending || 0,
          rejected_verifications: verificationCounts.rejected || 0,
          needs_more_information: verificationCounts.needs_more_information || 0,
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
  clampScore(student.student_profile?.readiness_score || student.profile_completion || 0);

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

const skillTitle = (skill = {}) => cleanText(skill.title || skill.name || skill.label);

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
    .select("profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion user_id cvs skills")
    .lean();
  const studentUserIds = students.map((student) => idOf(student.user_id)).filter(Boolean);
  const applicationMatch = studentUserIds.length ? { user_id: { $in: studentUserIds } } : { _id: null };

  const [verificationStats, applicationStats, missingSkills, interviewCount, topCompanyRows] = await Promise.all([
    StudentVerificationModel.aggregate([
      { $match: { university_id: university._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    UserApplyingJobModel.aggregate([
      { $match: applicationMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    UserApplyingJobModel.aggregate([
      { $match: { ...applicationMatch, "filter_result.missing_skills": { $exists: true, $ne: [] } } },
      { $unwind: "$filter_result.missing_skills" },
      { $group: { _id: "$filter_result.missing_skills", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    InterviewModel.countDocuments({
      ...(studentUserIds.length ? { employee_user_id: { $in: studentUserIds } } : { _id: null }),
      status: { $in: ["scheduled", "rescheduled", "accepted", "completed"] },
    }),
    UserApplyingJobModel.aggregate([
      { $match: applicationMatch },
      { $group: { _id: "$company_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: "companies", localField: "_id", foreignField: "_id", as: "company" } },
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

  const verificationByStatus = Object.fromEntries((verificationStats || []).map((item) => [item._id || "unknown", item.count]));
  const applicationsByStatus = Object.fromEntries((applicationStats || []).map((item) => [item._id || "unknown", item.count]));
  const readinessScores = students.map(readinessScoreForStudent);
  const averageReadiness = readinessScores.length
    ? Math.round(readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length)
    : 0;
  const readinessBands = {
    under_50: readinessScores.filter((score) => score < 50).length,
    between_50_79: readinessScores.filter((score) => score >= 50 && score < 80).length,
    over_80: readinessScores.filter((score) => score >= 80).length,
  };
  const cvUploadedCount = students.filter((student) => Array.isArray(student.cvs) && student.cvs.length > 0).length;
  const majorCounts = countBy(students, (student) => student.student_profile?.specialty || student.current_job_title || student.candidate_stage);
  const recordedSkillCounts = skillCountsFromStudents(students);
  const applicationTotal = Object.values(applicationsByStatus).reduce((sum, count) => sum + count, 0);

  return {
    university: publicUniversity(university),
    metrics: {
      registered_students: students.length || university.students_count || 0,
      verified_students: verificationByStatus.verified || 0,
      pending_verifications: verificationByStatus.pending || 0,
      rejected_verifications: verificationByStatus.rejected || 0,
      needs_more_information: verificationByStatus.needs_more_information || 0,
      average_employability_score: averageReadiness,
      cv_completion_rate: students.length ? Math.round((cvUploadedCount / students.length) * 100) : 0,
      internship_applications: applicationTotal,
      hired_students: (applicationsByStatus.hired || 0) + (applicationsByStatus.accepted || 0),
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
      completion_rate: students.length ? Math.round((cvUploadedCount / students.length) * 100) : 0,
    },
    applications: {
      total: applicationTotal,
      by_status: applicationsByStatus,
      shortlisted: applicationsByStatus.shortlisted || 0,
      interviews: interviewCount,
      offers: applicationsByStatus.offer || 0,
      hired: (applicationsByStatus.hired || 0) + (applicationsByStatus.accepted || 0),
    },
    skills: {
      top_missing_skills: (missingSkills || []).map((item) => ({ label: item._id, count: item.count })),
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
      return ReturnAppData.getError({ res, status: 403, message: "university_admin_context_required" });
    }

    const limit = normalizeLimit(req.query.limit, 25, 100);
    const verifications = await StudentVerificationModel.find(scoped.query)
      .populate({ path: "university_id", select: "name name_en logo city country email_domain verified status campuses" })
      .populate({ path: "user_id", select: "first_name mid_name last_name email image" })
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
  if (!isValidObjectId(req.params.id)) return { scoped: await adminVerificationsQuery(req), verification: null };
  const scoped = await adminVerificationsQuery(req);
  if (!scoped) return { scoped: null, verification: null };
  const query = {
    _id: req.params.id,
    ...scoped.query,
  };
  delete query.status;
  const verification = await StudentVerificationModel.findOne(query).populate({
    path: "university_id",
    select: "name name_en logo city country email_domain verified status campuses",
  });
  return { scoped, verification };
};

const adminApproveVerification = async (req, res, next) => {
  try {
    const { scoped, verification } = await findAdminVerification(req);
    if (!scoped) {
      return ReturnAppData.updateError({ res, status: 403, message: "university_admin_context_required" });
    }
    if (!verification) {
      return ReturnAppData.updateError({ res, status: 404, message: "student_verification_not_found" });
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
        university_id: verification.university_id?._id || verification.university_id,
      },
    });

    campusVerificationApprovedNotification(verification.toObject()).catch?.(console.error);

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
      return ReturnAppData.updateError({ res, status: 403, message: "university_admin_context_required" });
    }
    if (!verification) {
      return ReturnAppData.updateError({ res, status: 404, message: "student_verification_not_found" });
    }

    const reason = cleanText(req.body?.reason || req.body?.rejection_reason || "Verification evidence was not accepted.");
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

    campusVerificationRejectedNotification(verification.toObject(), reason).catch?.(console.error);

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
      return ReturnAppData.updateError({ res, status: 403, message: "university_admin_context_required" });
    }
    if (!verification) {
      return ReturnAppData.updateError({ res, status: 404, message: "student_verification_not_found" });
    }

    const requestedInformation = cleanText(req.body?.reason || req.body?.requested_information || "More information is required.");
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

    campusVerificationMoreInfoNotification(verification.toObject(), requestedInformation).catch?.(console.error);

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
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });
    const partnerCompanyIds = (university.partners || []).map((partner) => partner.company_id).filter(Boolean);
    const limit = normalizeLimit(req.query.limit);
    const [jobs, requests] = await Promise.all([
      jobsModel
        .find({
          $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }, { candidate_target: { $in: ["students", "fresh_graduates"] } }],
          ...(partnerCompanyIds.length ? { company_id: { $in: partnerCompanyIds } } : {}),
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
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);

    return ReturnAppData.getData({ res, data: opportunities, message: "campus_university_opportunities" });
  } catch (error) {
    next(error);
  }
};

const userUniversityStudents = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = scope?.university;
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });
    const studentsList = await EmployeeModel.find(buildUniversityStudentQuery(university))
      .select("profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion user_id")
      .populate({ path: "user_id", select: "first_name mid_name last_name email image" })
      .sort({ updatedAt: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();
    return ReturnAppData.getData({ res, data: studentsList, message: "campus_university_students" });
  } catch (error) {
    next(error);
  }
};

const userUniversityPartners = async (req, res, next) => {
  try {
    const scope = await getUniversityAdminScope(req);
    const university = await UniversityModel.findOne({ _id: scope?.university?._id })
      .populate({ path: "partners.company_id", select: "company_name logo company_country company_city is_verified" })
      .lean();
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });
    return ReturnAppData.getData({ res, data: university.partners || [], message: "campus_university_partners" });
  } catch (error) {
    next(error);
  }
};

const userUniversityEmployabilityAnalytics = async (req, res, next) => {
  try {
    const report = await buildUniversityDashboardReport(req);
    if (!report) {
      return ReturnAppData.getError({ res, status: 403, message: "university_admin_context_required" });
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
      return ReturnAppData.getError({ res, status: 403, message: "university_admin_context_required" });
    }

    const rows = [
      ["metric", "value"],
      ["registered_students", report.metrics.registered_students],
      ["verified_students", report.metrics.verified_students],
      ["pending_verifications", report.metrics.pending_verifications],
      ["average_employability_score", report.metrics.average_employability_score],
      ["cv_completion_rate", report.metrics.cv_completion_rate],
      ["internship_applications", report.metrics.internship_applications],
      ["interview_scheduled_count", report.metrics.interview_scheduled_count],
      ["hired_students", report.metrics.hired_students],
    ];

    if (cleanText(req.query?.format).toLowerCase() === "csv") {
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="university-outcomes.csv"');
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
    if (!university) return ReturnAppData.createError({ res, status: 404, message: "campus_university_not_found" });
    const title = String(req.body?.title || req.body?.job_name || "Campus internship request").trim();
    if (!title) return ReturnAppData.createError({ res, status: 422, message: "title_required" });
    const target = String(req.body?.target || req.body?.candidate_target || "students").toLowerCase() === "fresh_graduates" ? "fresh_graduates" : "students";
    const request = await UniversityOpportunityRequestModel.create({
      university_id: university._id,
      requested_by_user_id: req.user._id,
      title,
      description: String(req.body?.description || req.body?.details || "Career center opportunity request.").trim(),
      target,
      requested_count: Number(req.body?.requested_count || 25),
      note: String(req.body?.note || "").trim(),
    });
    return ReturnAppData.createData({ res, status: 202, data: request, message: "campus_university_opportunity_request_created" });
  } catch (error) {
    next(error);
  }
};

const companyOpportunities = async (req, res, next) => {
  try {
    const company = await getCompanyForRequest(req, "_id");
    if (!company) return ReturnAppData.getError({ res, status: 403, message: "company_not_found" });

    const limit = normalizeLimit(req.query.limit);
    const [jobs, requests] = await Promise.all([
      jobsModel
        .find({
          company_id: company._id,
          $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }, { candidate_target: { $in: ["students", "fresh_graduates"] } }],
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

    const submittedRequests = requests.map((request) => ({
      ...request,
      _id: request._id,
      job_name: request.title,
      candidate_target: request.notes?.[0]?.note?.includes("fresh_graduates") ? ["fresh_graduates"] : ["students"],
      is_for_students: !request.notes?.[0]?.note?.includes("fresh_graduates"),
      is_for_fresh_graduates: request.notes?.[0]?.note?.includes("fresh_graduates"),
      publish_status: request.status,
      work_mode: "Campus request",
      city: request.cities?.[0] || "Campus",
      source: "company_campus_opportunity_request",
    }));

    const opportunities = [...submittedRequests, ...jobs]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);

    return ReturnAppData.getData({ res, data: opportunities, message: "campus_company_opportunities" });
  } catch (error) {
    next(error);
  }
};

const students = async (req, res, next) => {
  try {
    const list = await EmployeeModel.find({ is_student: true, status: true })
      .select("profile_headline current_job_title candidate_stage student_profile graduation_year profile_completion user_id")
      .populate({ path: "user_id", select: "first_name mid_name last_name email image" })
      .sort({ updatedAt: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();

    return ReturnAppData.getData({ res, data: list, message: "campus_students" });
  } catch (error) {
    next(error);
  }
};

const partners = async (req, res, next) => {
  try {
    const universities = await UniversityModel.find({ status: { $ne: "suspended" } })
      .populate({ path: "partners.company_id", select: "company_name logo company_country company_city is_verified" })
      .sort({ verified: -1, name: 1 })
      .limit(normalizeLimit(req.query.limit, 20, 100))
      .lean();

    return ReturnAppData.getData({ res, data: universities, message: "campus_partners" });
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
        }).select("_id").lean();
    const company = await getCompanyForRequest(req, "_id");
    const companyId = company?._id;

    if (!university?._id || !isValidObjectId(companyId)) {
      return ReturnAppData.createError({ res, status: 400, message: "invalid_university_or_company_id" });
    }

    const updatedUniversity = await UniversityModel.findOneAndUpdate(
      { _id: university._id, "partners.company_id": { $ne: companyId } },
      { $push: { partners: { company_id: companyId, status: "pending", note } } },
      { new: true }
    ).lean();

    if (!updatedUniversity) {
      return ReturnAppData.createError({ res, status: 409, message: "partner_already_exists_or_university_missing" });
    }

    return ReturnAppData.createData({ res, data: updatedUniversity, message: "campus_partner_added" });
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

    return ReturnAppData.getData({ res, data: universities.map(publicUniversity), message: "universities" });
  } catch (error) {
    next(error);
  }
};

const listUniversityCampuses = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return ReturnAppData.getError({ res, status: 400, message: "invalid_university_id" });
    }

    const university = await UniversityModel.findOne({
      _id: req.params.id,
      status: { $ne: "suspended" },
    }).lean();
    if (!university) {
      return ReturnAppData.getError({ res, status: 404, message: "university_not_found" });
    }

    const campuses = Array.isArray(university.campuses) && university.campuses.length
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
    if (!payload.name || !payload.email_domain || !payload.career_center_email) {
      return ReturnAppData.createError({ res, status: 422, message: "university_name_and_email_domain_required" });
    }

    const university = await UniversityModel.create(payload);
    return ReturnAppData.createData({ res, data: university, message: "university_created" });
  } catch (error) {
    next(error);
  }
};

const updateUniversityStatus = async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toLowerCase();
    if (!["active", "pending", "suspended"].includes(status)) {
      return ReturnAppData.updateError({ res, status: 400, message: "invalid_university_status" });
    }

    const university = await UniversityModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          verified: status === "active",
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!university) return ReturnAppData.updateError({ res, status: 404, message: "university_not_found" });

    return ReturnAppData.updateData({ res, data: university, message: "university_status_updated" });
  } catch (error) {
    next(error);
  }
};

export default {
  overview,
  opportunities,
  profile,
  updateProfile,
  resources,
  registerEvent,
  studentVerificationStatus,
  startStudentVerification,
  confirmStudentVerificationEmail,
  uploadStudentVerificationDocument,
  resubmitStudentVerification,
  adminListVerifications,
  adminApproveVerification,
  adminRejectVerification,
  adminRequestVerificationInfo,
  universityOverview,
  userUniversityOverview,
  userUniversityOpportunities,
  userUniversityStudents,
  userUniversityPartners,
  userUniversityEmployabilityAnalytics,
  userUniversityOutcomeReport,
  createUniversityOpportunityRequest,
  companyOpportunities,
  createCompanyOpportunity,
  students,
  partners,
  addPartner,
  listUniversities,
  listUniversityCampuses,
  createUniversity,
  updateUniversityStatus,
};
