import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CompanyModel,
  EmployeeModel,
  PageModel,
  UniversityModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  InterviewModel,
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

const allowedTargets = new Set(["students", "graduates", "fresh_graduates"]);

const normalizeLimit = (value, fallback = 12, max = 50) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(Math.floor(number), max);
};

const getEmployee = async (req) =>
  EmployeeModel.findOne({ user_id: req.user._id })
    .populate({ path: "user_id", select: "first_name mid_name last_name email image" })
    .lean();

const campusJobQuery = (target = "students") => {
  const normalizedTarget = allowedTargets.has(target) ? target : "students";
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
    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(req.user._id)).select("_id owner_user_id").lean();
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

const universityOverview = async (req, res, next) => {
  try {
    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(req.user._id)).lean();
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

const companyOpportunities = async (req, res, next) => {
  try {
    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(req.user._id)).select("_id").lean();
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
    const { university_id: universityId, company_id: companyId, note = "" } = req.body || {};
    if (!isValidObjectId(universityId) || !isValidObjectId(companyId)) {
      return ReturnAppData.createError({ res, status: 400, message: "invalid_university_or_company_id" });
    }

    const university = await UniversityModel.findOneAndUpdate(
      { _id: universityId, "partners.company_id": { $ne: companyId } },
      { $push: { partners: { company_id: companyId, status: "pending", note } } },
      { new: true }
    ).lean();

    if (!university) {
      return ReturnAppData.createError({ res, status: 409, message: "partner_already_exists_or_university_missing" });
    }

    return ReturnAppData.createData({ res, data: university, message: "campus_partner_added" });
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
  universityOverview,
  companyOpportunities,
  createCompanyOpportunity,
  students,
  partners,
  addPartner,
  listUniversities,
  createUniversity,
  updateUniversityStatus,
};
