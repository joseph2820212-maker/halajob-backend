import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
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
  UniversityOpportunityRequestModel,
  jobsModel,
} from "../../../models/index.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";

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
    const target = String(req.body?.target || req.body?.candidate_target || "students").toLowerCase();
    const candidateTarget = target === "fresh_graduates" ? ["fresh_graduates"] : ["students"];

    const payload = {
      ...(req.body || {}),
      company_id: company._id,
      user_id: req.user._id,
      candidate_target: candidateTarget,
      is_for_students: candidateTarget.includes("students"),
      is_for_fresh_graduates: candidateTarget.includes("fresh_graduates"),
      publish_status: "pending_review",
      is_accepted: false,
      status: true,
    };

    const hasFullJobPayload = [
      "job_name",
      "description",
      "work_mode_id",
      "job_type_id",
      "job_time_id",
      "job_salary_id",
      "salary",
    ].every((field) => typeof payload[field] !== "undefined" && payload[field] !== "");

    if (!hasFullJobPayload) {
      const request = await JobZainTalentRequestModel.create({
        company_id: company._id,
        requested_by_user_id: req.user._id,
        title: req.body?.title || req.body?.job_name || "Campus internship request",
        description: req.body?.description || req.body?.details || "Campus opportunity request from the university portal.",
        required_skills: Array.isArray(req.body?.required_skills) ? req.body.required_skills : [],
        preferred_skills: Array.isArray(req.body?.preferred_skills) ? req.body.preferred_skills : [],
        countries: req.body?.country ? [req.body.country] : [],
        cities: req.body?.location ? [req.body.location] : req.body?.city ? [req.body.city] : [],
        priority: "normal",
        requested_count: Number(req.body?.requested_count || 5),
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
    }

    const job = await jobsModel.create(payload);
    return ReturnAppData.createData({ res, data: job, message: "campus_opportunity_created" });
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

    return ReturnAppData.createData({ res, data: registration, message: "campus_event_registered" });
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
    const university = await ensureUniversityForRequest(req);
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });

    const partnerCompanyIds = (university.partners || []).map((partner) => partner.company_id).filter(Boolean);
    const [studentsCount, opportunitiesCount, requestsCount, placements] = await Promise.all([
      EmployeeModel.countDocuments({ $or: [{ university_id: university._id }, { university: university.name }] }),
      jobsModel.countDocuments({
        $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }, { candidate_target: { $in: ["students", "fresh_graduates"] } }],
        ...(partnerCompanyIds.length ? { company_id: { $in: partnerCompanyIds } } : {}),
      }),
      UniversityOpportunityRequestModel.countDocuments({ university_id: university._id, status: { $nin: ["closed", "cancelled"] } }),
      UserApplyingJobModel.countDocuments({ status: { $in: ["accepted", "hired"] }, ...(partnerCompanyIds.length ? { company_id: { $in: partnerCompanyIds } } : {}) }),
    ]);

    return ReturnAppData.getData({
      res,
      data: {
        university,
        stats: {
          registered_students: studentsCount || university.students_count || 0,
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

const userUniversityOpportunities = async (req, res, next) => {
  try {
    const university = await ensureUniversityForRequest(req);
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
    const university = await ensureUniversityForRequest(req);
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });
    const studentsList = await EmployeeModel.find({ $or: [{ university_id: university._id }, { university: university.name }] })
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
    const university = await UniversityModel.findOne({ _id: (await ensureUniversityForRequest(req))?._id })
      .populate({ path: "partners.company_id", select: "company_name logo company_country company_city is_verified" })
      .lean();
    if (!university) return ReturnAppData.getError({ res, status: 404, message: "campus_university_not_found" });
    return ReturnAppData.getData({ res, data: university.partners || [], message: "campus_university_partners" });
  } catch (error) {
    next(error);
  }
};

const createUniversityOpportunityRequest = async (req, res, next) => {
  try {
    const university = await ensureUniversityForRequest(req);
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

    const jobs = await jobsModel
      .find({
        company_id: company._id,
        $or: [{ is_for_students: true }, { is_for_fresh_graduates: true }, { candidate_target: { $in: ["students", "fresh_graduates"] } }],
      })
      .sort({ createdAt: -1 })
      .limit(normalizeLimit(req.query.limit))
      .lean();

    return ReturnAppData.getData({ res, data: jobs, message: "campus_company_opportunities" });
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

    return ReturnAppData.getData({ res, data: universities, message: "universities" });
  } catch (error) {
    next(error);
  }
};

const createUniversity = async (req, res, next) => {
  try {
    const university = await UniversityModel.create(req.body || {});
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
  universityOverview,
  userUniversityOverview,
  userUniversityOpportunities,
  userUniversityStudents,
  userUniversityPartners,
  createUniversityOpportunityRequest,
  companyOpportunities,
  createCompanyOpportunity,
  students,
  partners,
  addPartner,
  listUniversities,
  createUniversity,
  updateUniversityStatus,
};
