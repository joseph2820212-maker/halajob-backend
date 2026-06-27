import fs from "node:fs";
import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  ApplicationStatusHistoryModel,
  CampusEventRegistrationModel,
  CompanyModel,
  EmployeeModel,
  InterviewModel,
  UserApplyingJobModel,
  UserOutSideApplyingJobModel,
  UserSavedJobModel,
  jobsModel,
} from "../../../models/index.js";
import { resolveAppAccount } from "../../../services/appAccount.service.js";
import { buildCampusApplicationPage } from "../../../services/campusApplicationPaging.service.js";
import {
  applicationPopulateForEmployee,
  interviewPopulateForEmployee,
  normalizeApplicationForEmployee,
  normalizeInterviewForEmployee,
} from "../../../helper/employeeDash/employeeJobActivityHelpers.js";

const { Types } = mongoose;
const CAMPUS_CONTENT_PATH = new URL("../../../data/campusContent.json", import.meta.url);
let campusContentCache = null;

const cleanText = (value = "") => String(value || "").trim();
const toObjectId = (value) =>
  mongoose.isValidObjectId(String(value || "")) ? new Types.ObjectId(String(value)) : null;
const APPLICATION_MESSAGE_CHANNELS = new Set(["email", "sms", "notification", "phone", "whatsapp", "internal"]);

function readCampusContent() {
  if (!campusContentCache) {
    campusContentCache = JSON.parse(fs.readFileSync(CAMPUS_CONTENT_PATH, "utf8"));
  }

  return JSON.parse(JSON.stringify(campusContentCache));
}

function publicCampusJobFilter() {
  const now = new Date();
  return {
    status: true,
    is_accepted: true,
    publish_status: { $in: ["published", null] },
    deleted_at: null,
    $and: [
      { $or: [{ started_date: null }, { started_date: { $lte: now } }] },
      { $or: [{ end_date: null }, { end_date: { $gte: now } }] },
      { $or: [{ apply_deadline: null }, { apply_deadline: { $gte: now } }] },
    ],
    $or: [
      { candidate_target: { $in: ["students", "all"] } },
      { is_for_students: true },
      { "search_index.filters.candidate_target": { $in: ["students", "all"] } },
      { "search_index.filters.is_for_students": true },
    ],
  };
}

function isCampusJob(job = {}) {
  const targets = Array.isArray(job.candidate_target) ? job.candidate_target : [job.candidate_target];
  const normalizedTargets = targets.map((target) => cleanText(target).toLowerCase());
  return (
    normalizedTargets.some((target) => ["students", "all"].includes(target)) ||
    job.is_for_students === true ||
    job.search_index?.filters?.is_for_students === true ||
    ["students", "all"].includes(cleanText(job.search_index?.filters?.candidate_target).toLowerCase())
  );
}

function campusExternalLink(job = {}) {
  return cleanText(job.out_link || job.outside_link || job.external_link || job.external_url);
}

function normalizeApplicationMessageChannel(value = "") {
  const channel = cleanText(value).toLowerCase();
  return APPLICATION_MESSAGE_CHANNELS.has(channel) ? channel : "internal";
}

function isCampusExternalOpportunity(job = {}) {
  const method = cleanText(job.apply_method).toLowerCase();
  return (
    Boolean(campusExternalLink(job)) &&
    (job.is_out_side === true ||
      job.is_out_side === 1 ||
      job.is_external === true ||
      ["external", "outside", "company_site"].includes(method))
  );
}

function isCampusEmployee(employee = {}) {
  return employee?.is_student === true || employee?.candidate_stage === "student";
}

async function getCampusEmployee(req) {
  if (req.campusEmployee?._id) return req.campusEmployee;
  const account = req.appAccount || (await resolveAppAccount(req.user, { createMissingEmployee: false }));
  const employee = account?.employee;
  if (account?.accountType !== "employee" || !employee?._id || !isCampusEmployee(employee)) return null;
  req.appAccount = account;
  req.campusEmployee = employee;
  return employee;
}

function studentSummary(employee = {}) {
  const student = employee?.student_profile || {};
  return {
    university: student.university || "",
    specialty: student.specialty || "",
    sub_specialty: student.sub_specialty || "",
    academic_year: student.academic_year || "",
    graduation_year: employee?.graduation_year ?? null,
    gpa: student.gpa || "",
    technical_skills: student.technical_skills || [],
    soft_skills: student.soft_skills || [],
    projects: student.projects || [],
    work_readiness: student.work_readiness || "",
    preferred_work_location: student.preferred_work_location || "",
    cv_status: student.cv_status || "",
    mini_cv_ready: student.mini_cv_ready === true,
    readiness_score: Number(student.readiness_score || 0),
  };
}

async function findCampusOpportunity(jobId) {
  const normalizedJobId = toObjectId(jobId);
  if (!normalizedJobId) return null;
  return jobsModel.findOne({ _id: normalizedJobId, ...publicCampusJobFilter() }).lean();
}

async function decorateOpportunity(job, userId) {
  const jobId = toObjectId(job?._id);
  const [saved, internalApplication, externalApplication] = await Promise.all([
    UserSavedJobModel.exists({ user_id: userId, job_id: jobId }),
    UserApplyingJobModel.findOne({ user_id: userId, job_id: jobId }).select("_id status createdAt updatedAt").lean(),
    UserOutSideApplyingJobModel.findOne({ user_id: userId, job_id: jobId }).select("_id createdAt updatedAt").lean(),
  ]);

  return {
    ...job,
    id: job._id,
    title: job.job_name || job.title || "",
    company: job.company_id || null,
    is_external: isCampusExternalOpportunity(job),
    out_link: campusExternalLink(job),
    viewer_state: {
      is_saved: Boolean(saved),
      has_applied: Boolean(internalApplication || externalApplication),
      application_id: internalApplication?._id || externalApplication?._id || null,
      application_status: internalApplication?.status || (externalApplication ? "external_started" : null),
      application_source: externalApplication && !internalApplication ? "external" : "direct",
    },
  };
}

const requireCampusStudent = async (req, res, next) => {
  try {
    const employee = await getCampusEmployee(req);
    if (!employee) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: "Campus mode is available for student accounts only.",
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireCampusOpportunity = async (req, res, next) => {
  try {
    const job = await findCampusOpportunity(req.params.id);
    if (!job) return ReturnAppData.getError({ res, status: 404, message: "Opportunity not found." });
    req.campusOpportunity = job;
    return next();
  } catch (error) {
    return next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const employee = await getCampusEmployee(req);
    const userId = toObjectId(req.user?._id);
    const now = new Date();

    const [opportunitiesCount, savedJobs, applicationsCount, waitingApplications, upcomingInterviews, recentApplications] =
      await Promise.all([
        jobsModel.countDocuments(publicCampusJobFilter()),
        UserSavedJobModel.countDocuments({ user_id: userId }),
        UserApplyingJobModel.countDocuments({ user_id: userId }),
        UserApplyingJobModel.countDocuments({ user_id: userId, status: { $in: ["waiting", "new", "screening", "shortlisted"] } }),
        InterviewModel.countDocuments({
          employee_user_id: userId,
          status: { $in: ["scheduled", "rescheduled"] },
          start_at: { $gte: now },
        }),
        UserApplyingJobModel.find({ user_id: userId })
          .sort({ last_activity_at: -1, createdAt: -1 })
          .limit(5)
          .populate(applicationPopulateForEmployee)
          .lean(),
      ]);

    return ReturnAppData.getData({
      res,
      data: {
        account: {
          type: "campus",
          id: employee._id,
          profile_completion: Number(employee.profile_completion || 0),
          candidate_stage: employee.candidate_stage || "student",
          is_student: true,
        },
        campus: studentSummary(employee),
        cards: {
          campus_opportunities: opportunitiesCount,
          saved_jobs: savedJobs,
          total_applications: applicationsCount,
          waiting_applications: waitingApplications,
          upcoming_interviews: upcomingInterviews,
          profile_completion: Number(employee.profile_completion || 0),
        },
        recent: {
          applications: recentApplications.filter((item) => isCampusJob(item.job_id)).map(normalizeApplicationForEmployee),
        },
        next_actions: {
          complete_profile: Number(employee.profile_completion || 0) < 80,
          add_cv: !Array.isArray(employee.cvs) || employee.cvs.length === 0,
          add_skills: !Array.isArray(employee.skills) || employee.skills.length === 0,
          save_first_opportunity: savedJobs === 0,
        },
      },
      message: "campus_dashboard",
    });
  } catch (error) {
    next(error);
  }
};

const content = async (req, res, next) => {
  try {
    const registrations = await CampusEventRegistrationModel.find({
      user_id: req.user._id,
      status: "registered",
    })
      .select("event_id title organizer kind date_label mode status updatedAt")
      .lean();

    return ReturnAppData.getData({
      res,
      data: {
        ...readCampusContent(),
        event_registrations: registrations,
        meta: { source: "backend", version: "campus-content-v1" },
      },
      message: "campus_content",
    });
  } catch (error) {
    next(error);
  }
};

const events = async (req, res, next) => {
  try {
    const registrations = await CampusEventRegistrationModel.find({
      user_id: req.user._id,
      status: "registered",
    })
      .select("event_id title organizer kind date_label mode status updatedAt")
      .lean();
    const registeredEventIds = registrations
      .map((registration) => cleanText(registration.event_id))
      .filter(Boolean);

    return ReturnAppData.getData({
      res,
      data: {
        events: readCampusContent().events || [],
        event_registrations: registrations,
        registered_event_ids: registeredEventIds,
        meta: { source: "backend", version: "campus-events-v1" },
      },
      message: "campus_events",
    });
  } catch (error) {
    next(error);
  }
};

const cancelEventRegistration = async (req, res, next) => {
  try {
    const eventId = cleanText(req.params.eventId || req.body?.event_id);
    if (!eventId) return ReturnAppData.getError({ res, status: 422, message: "event_id_required" });

    const registration = await CampusEventRegistrationModel.findOneAndUpdate(
      { user_id: req.user._id, event_id: eventId },
      { $set: { status: "cancelled" } },
      { new: true, runValidators: true }
    ).lean();

    if (!registration) {
      return ReturnAppData.getError({ res, status: 404, message: "Campus event registration not found." });
    }

    return ReturnAppData.createData({
      res,
      data: registration,
      message: "Campus event registration cancelled.",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const opportunities = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;
    const match = publicCampusJobFilter();

    if (cleanText(req.query.q || req.query.search)) {
      const regex = new RegExp(cleanText(req.query.q || req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$and.push({
        $or: [{ job_name: regex }, { description: regex }, { job_keywords: regex }],
      });
    }

    if (String(req.query.saved_only || "").toLowerCase() === "true") {
      const saved = await UserSavedJobModel.find({ user_id: userId }).select("job_id").lean();
      match._id = { $in: saved.map((item) => item.job_id) };
    }

    const [rows, total] = await Promise.all([
      jobsModel
        .find(match)
        .sort({ priority: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "company_id", select: "company_name image logo is_verified rating_avg rating_count" })
        .lean(),
      jobsModel.countDocuments(match),
    ]);

    const data = await Promise.all(rows.map((item) => decorateOpportunity(item, userId)));
    return ReturnAppData.getData({
      res,
      data,
      other: { pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total } },
      message: "campus_opportunities",
    });
  } catch (error) {
    next(error);
  }
};

const opportunityDetails = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const jobId = toObjectId(req.params.id);
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: "Invalid id." });

    const job = await jobsModel
      .findOne({ _id: jobId, ...publicCampusJobFilter() })
      .populate({ path: "company_id", select: "company_name image logo is_verified rating_avg rating_count" })
      .lean();

    if (!job) return ReturnAppData.getError({ res, status: 404, message: "Opportunity not found." });
    return ReturnAppData.getData({ res, data: await decorateOpportunity(job, userId), message: "campus_opportunity" });
  } catch (error) {
    next(error);
  }
};

async function updateSaveCounter(jobId, delta) {
  if (delta >= 0) return jobsModel.updateOne({ _id: jobId }, { $inc: { user_saved: delta } });
  return jobsModel.updateOne({ _id: jobId, user_saved: { $gt: 0 } }, { $inc: { user_saved: delta } });
}

const saveOpportunity = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const jobId = toObjectId(req.params.id);
    const job = await findCampusOpportunity(jobId);
    if (!job) return ReturnAppData.getError({ res, status: 404, message: "Opportunity not found." });

    const existing = await UserSavedJobModel.findOne({ user_id: userId, job_id: jobId }).lean();
    if (!existing) {
      await UserSavedJobModel.create({ user_id: userId, job_id: jobId });
      await updateSaveCounter(jobId, 1);
    }

    return ReturnAppData.createData({ res, data: { is_saved: true, job_id: jobId }, message: "Opportunity saved." });
  } catch (error) {
    if (error?.code === 11000) {
      return ReturnAppData.createData({ res, data: { is_saved: true, job_id: req.params.id }, message: "Opportunity already saved." });
    }
    next(error);
  }
};

const unsaveOpportunity = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const jobId = toObjectId(req.params.id);
    const deleted = await UserSavedJobModel.findOneAndDelete({ user_id: userId, job_id: jobId });
    if (deleted) await updateSaveCounter(jobId, -1);
    return ReturnAppData.createData({ res, data: { is_saved: false, job_id: jobId }, message: "Opportunity removed from saved." });
  } catch (error) {
    next(error);
  }
};

const toggleSaveOpportunity = async (req, res, next) => {
  try {
    const existing = await UserSavedJobModel.findOne({ user_id: req.user._id, job_id: req.params.id }).lean();
    return existing ? unsaveOpportunity(req, res, next) : saveOpportunity(req, res, next);
  } catch (error) {
    next(error);
  }
};

const applyExternalOpportunity = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const jobId = toObjectId(req.params.id);
    const job = req.campusOpportunity || (await findCampusOpportunity(jobId));
    if (!job) return ReturnAppData.getError({ res, status: 404, message: "Opportunity not found." });

    const outLink = campusExternalLink(job);
    if (!isCampusExternalOpportunity(job) || !outLink) {
      return ReturnAppData.getError({ res, status: 400, message: "This campus opportunity is not an external application." });
    }

    const existing = await UserOutSideApplyingJobModel.findOne({ user_id: userId, job_id: jobId }).lean();
    if (existing) {
      return ReturnAppData.getError({
        res,
        status: 409,
        message: "External application already recorded.",
        other: { data: { out_link: outLink, application: existing } },
      });
    }

    const application = await UserOutSideApplyingJobModel.create({ user_id: userId, job_id: jobId });
    await jobsModel.updateOne({ _id: jobId }, { $inc: { out_side_applying: 1 } });
    return ReturnAppData.createData({ res, data: { application, out_link: outLink }, message: "External application recorded." });
  } catch (error) {
    if (error?.code === 11000) {
      return ReturnAppData.getError({ res, status: 409, message: "External application already recorded." });
    }
    next(error);
  }
};

const normalizeCampusExternalApplicationDetail = async (external) => {
  if (!external?._id) return null;
  const job = await findCampusOpportunity(external.job_id);
  if (!job) return null;
  const company = job.company_id ? await CompanyModel.findById(job.company_id).select("company_name image logo").lean() : null;

  return {
    _id: external._id,
    id: external._id,
    status: "external_started",
    visible_status: "external_started",
    source: "external",
    applied_at: external.createdAt,
    last_activity_at: external.updatedAt || external.createdAt,
    job: { _id: job._id, id: job._id, job_name: job.job_name || "", title: job.job_name || "", out_link: campusExternalLink(job) },
    company,
    communication_log: [],
    messages: [],
    histories: [],
    interviews: [],
  };
};

const applications = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;
    const fetchLimit = skip + limit;
    const status = cleanText(req.query.status);
    const internalFilter = { user_id: userId };
    if (status) internalFilter.status = status;

    const [internalRows, internalTotal, outsideRows, outsideTotalResult] = await Promise.all([
      UserApplyingJobModel.find(internalFilter)
        .sort({ last_activity_at: -1, createdAt: -1 })
        .limit(fetchLimit)
        .populate(applicationPopulateForEmployee)
        .lean(),
      UserApplyingJobModel.countDocuments(internalFilter),
      UserOutSideApplyingJobModel.find({ user_id: userId }).sort({ createdAt: -1, _id: -1 }).limit(fetchLimit).lean(),
      UserOutSideApplyingJobModel.countDocuments({ user_id: userId }).then((total) => [{ total }]),
    ]);

    const internalItems = internalRows.filter((item) => isCampusJob(item.job_id)).map(normalizeApplicationForEmployee);
    const outsideItems = (await Promise.all(outsideRows.map(normalizeCampusExternalApplicationDetail))).filter(Boolean);
    const pageResult = buildCampusApplicationPage({
      internalAgg: [{ items: internalItems, meta: [{ total: internalTotal }] }],
      outsideRows: outsideItems,
      outsideTotalResult,
      skip,
      limit,
    });

    return ReturnAppData.getData({
      res,
      data: pageResult.items,
      other: { pagination: { page, limit, total: pageResult.total, pages: Math.ceil(pageResult.total / limit) } },
      message: "campus_applications",
    });
  } catch (error) {
    next(error);
  }
};

const applicationDetails = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const applicationId = toObjectId(req.params.id);
    if (!userId || !applicationId) return ReturnAppData.getError({ res, status: 400, message: "Invalid application id." });

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, user_id: userId })
      .populate(applicationPopulateForEmployee)
      .lean();

    if (application && isCampusJob(application.job_id)) {
      const [histories, interviews] = await Promise.all([
        ApplicationStatusHistoryModel.find({ application_id: application._id, user_id: userId }).sort({ createdAt: -1 }).lean(),
        InterviewModel.find({ application_id: application._id, employee_user_id: userId })
          .sort({ start_at: -1, createdAt: -1 })
          .populate(interviewPopulateForEmployee)
          .lean(),
      ]);

      return ReturnAppData.getData({
        res,
        data: { ...normalizeApplicationForEmployee(application), histories, interviews: interviews.map(normalizeInterviewForEmployee) },
        message: "application_details",
      });
    }

    const external = await UserOutSideApplyingJobModel.findOne({ _id: applicationId, user_id: userId }).lean();
    const externalDetail = await normalizeCampusExternalApplicationDetail(external);
    if (externalDetail) return ReturnAppData.getData({ res, data: externalDetail, message: "application_details" });

    return ReturnAppData.getError({ res, status: 404, message: "Campus application not found." });
  } catch (error) {
    next(error);
  }
};

const sendApplicationMessage = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const applicationId = toObjectId(req.params.id);
    if (!userId || !applicationId) return ReturnAppData.getError({ res, status: 400, message: "Invalid application id." });

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, user_id: userId });
    if (!application) {
      const external = await UserOutSideApplyingJobModel.findOne({ _id: applicationId, user_id: userId }).lean();
      return ReturnAppData.getError({
        res,
        status: external ? 409 : 404,
        message: external ? "Messaging is available for direct campus applications only." : "Campus application not found.",
      });
    }

    const message = cleanText(req.body?.message || req.body?.body || req.body?.note);
    if (!message) return ReturnAppData.getError({ res, status: 422, message: "message_required" });

    const channel = normalizeApplicationMessageChannel(req.body?.channel || "internal");
    const oldStatus = application.status;
    application.communication_log = application.communication_log || [];
    application.communication_log.push({ channel, message, created_by: userId, created_at: new Date() });
    application.last_activity_at = new Date();
    await application.save();

    await ApplicationStatusHistoryModel.create({
      application_id: application._id,
      job_id: application.job_id,
      company_id: application.company_id,
      user_id: application.user_id,
      old_status: oldStatus || null,
      new_status: application.status || oldStatus || "waiting",
      changed_by: userId,
      actor_type: "employee",
      action: "campus_student_message_sent",
      note: message,
      visible_to_candidate: true,
      metadata: { channel },
    }).catch(() => null);

    const updated = await UserApplyingJobModel.findById(application._id).populate(applicationPopulateForEmployee).lean();
    return ReturnAppData.createData({
      res,
      data: normalizeApplicationForEmployee(updated || application),
      message: "application_message_sent",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const canWithdrawCampusApplication = (status = "") =>
  !["accepted", "hired", "rejected", "withdrawn", "auto_cancel", "offer_declined"].includes(cleanText(status).toLowerCase());

const cancelApplication = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user?._id);
    const applicationId = toObjectId(req.params.id);
    if (!userId || !applicationId) return ReturnAppData.getError({ res, status: 400, message: "Invalid application id." });

    const application = await UserApplyingJobModel.findOne({ _id: applicationId, user_id: userId });
    if (application) {
      if (!canWithdrawCampusApplication(application.status)) {
        return ReturnAppData.getError({ res, status: 409, message: "This campus application cannot be withdrawn." });
      }

      const oldStatus = application.status;
      application.status = "withdrawn";
      application.status_changed_at = new Date();
      application.last_activity_at = new Date();
      await application.save();

      await ApplicationStatusHistoryModel.create({
        application_id: application._id,
        job_id: application.job_id,
        company_id: application.company_id,
        user_id: application.user_id,
        old_status: oldStatus || null,
        new_status: "withdrawn",
        changed_by: userId,
        actor_type: "employee",
        action: "withdrawn_by_campus_student",
        note: cleanText(req.body?.note || "Application withdrawn by campus student"),
        visible_to_candidate: true,
      }).catch(() => null);

      return ReturnAppData.createData({
        res,
        data: normalizeApplicationForEmployee(application),
        message: "Application withdrawn.",
        status: 200,
      });
    }

    const external = await UserOutSideApplyingJobModel.findOne({ _id: applicationId, user_id: userId });
    if (external) {
      await UserOutSideApplyingJobModel.deleteOne({ _id: external._id });
      return ReturnAppData.createData({
        res,
        data: { id: external._id, status: "withdrawn", visible_status: "withdrawn", source: "external" },
        message: "External application withdrawn.",
        status: 200,
      });
    }

    return ReturnAppData.getError({ res, status: 404, message: "Campus application not found." });
  } catch (error) {
    next(error);
  }
};

export default {
  requireCampusStudent,
  requireCampusOpportunity,
  dashboard,
  content,
  events,
  cancelEventRegistration,
  opportunities,
  opportunityDetails,
  saveOpportunity,
  unsaveOpportunity,
  toggleSaveOpportunity,
  applyExternalOpportunity,
  applications,
  applicationDetails,
  sendApplicationMessage,
  cancelApplication,
};
