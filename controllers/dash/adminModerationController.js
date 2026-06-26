import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  CompanyModel,
  JobZainTalentRequestModel,
  RoleModel,
  UserModel,
  jobsModel,
} from "../../models/index.js";
import {
  assignPlanToCompany,
  ensureCompanySubscription,
  ensureFreeSubscriptionPlan,
  getCompanySubscriptionSummary,
} from "../../services/subscriptions/companySubscription.service.js";
import { rebuildJobIntegration } from "../../services/search/rebuildSearchData.js";
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const toObjectId = (id) => (isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null);
const clean = (value = "") => String(value || "").trim();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toInt = (value, fallback = 1, min = 1, max = 200) => {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const paginate = async (model, filter, req, options = {}) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 20, 1, 200);
  const skip = (page - 1) * limit;
  let query = model.find(filter);
  (options.populate || []).forEach((p) => { query = query.populate(p); });
  const [items, total] = await Promise.all([
    query.sort(options.sort || { createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit), has_next: page * limit < total, has_prev: page > 1 },
  };
};

const adminId = (req) => req.admin?._id || req.user?._id || null;

const companyRequestState = (company) => {
  if (!company) return "none";
  if (company.accepted === true && company.status === true) return "approved";
  if (company.accepted === true && company.status !== true) return "suspended";
  if (company.accepted !== true && company.status !== true && company.can_upload === true) return "draft";
  if (company.accepted !== true && company.status !== true && company.can_upload !== true) return "pending";
  if (company.accepted !== true && company.status === true) return "rejected";
  return "unknown";
};

const companyRequestFilter = (req) => {
  const state = clean(req.query.state || req.query.request_state || req.query.status || "pending").toLowerCase();
  const filter = {};

  if (state === "all") {
    // no-op
  } else if (state === "pending") {
    Object.assign(filter, { accepted: false, status: false, can_upload: false });
  } else if (state === "draft") {
    Object.assign(filter, { accepted: false, status: false, can_upload: true });
  } else if (state === "approved") {
    Object.assign(filter, { accepted: true, status: true });
  } else if (state === "rejected") {
    Object.assign(filter, { accepted: false, status: true });
  } else if (state === "suspended") {
    Object.assign(filter, { accepted: true, status: false });
  }

  const q = clean(req.query.search || req.query.q || req.query.keyword);
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { company_name: regex },
      { company_email: regex },
      { slug: regex },
      { industry_name: regex },
      { company_country: regex },
      { company_city: regex },
    ];
    if (isValidObjectId(q)) filter.$or.push({ _id: toObjectId(q) }, { owner_user_id: toObjectId(q) });
  }

  return filter;
};

export const listCompanyRequests = async (req, res) => {
  try {
    const result = await paginate(CompanyModel, companyRequestFilter(req), req, {
      sort: { updatedAt: -1, createdAt: -1 },
      populate: [
        { path: "owner_user_id", select: "first_name mid_name last_name email phone_national phone_e164 role_id" },
        { path: "role_id" },
        { path: "subscription.plan_id" },
        { path: "subscription.subscription_id" },
      ],
    });

    const data = result.items.map((company) => ({ ...company, request_state: companyRequestState(company) }));
    return ReturnDashData.getData({ res, data, other: { pagination: result.pagination } });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "company_requests_failed" });
  }
};

export const approveCompanyRequest = async (req, res) => {
  try {
    const id = req.params.id || req.params.companyId || req.body.company_id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_company_id" });

    const company = await CompanyModel.findById(id);
    if (!company) return ReturnDashData.updateError({ res, status: 404, message: "company_request_not_found" });

    const companyRole =
      (await RoleModel.findOne({ role_number: 3, log_to: "company", status: true })) ||
      (await RoleModel.findOne({ log_to: "company", status: true })) ||
      (await RoleModel.findOne({ role_number: 3 }));

    company.accepted = true;
    company.status = true;
    company.can_upload = false;
    company.rejection_reason = "";
    company.reviewed_at = new Date();
    company.reviewed_by = adminId(req);
    if (companyRole?._id) company.role_id = companyRole._id;
    if (req.body?.is_verified !== undefined) company.is_verified = req.body.is_verified === true || req.body.is_verified === "true";
    if (company.is_verified && !company.verified_at) {
      company.verified_at = new Date();
      company.verified_by = adminId(req);
    }
    await company.save();

    if (companyRole?._id && company.owner_user_id) {
      await UserModel.findByIdAndUpdate(company.owner_user_id, { $set: { role_id: companyRole._id, status: true } });
    }

    const planId = req.body?.plan_id || req.body?.subscription_plan_id;
    const planKey = req.body?.plan_key || req.body?.subscription_plan_key;
    const subscription = planId || planKey
      ? await assignPlanToCompany({
          companyId: company._id,
          planId,
          planKey,
          assignedBy: adminId(req),
          startsAt: req.body?.starts_at,
          endsAt: req.body?.ends_at,
          adminNote: req.body?.admin_note || "assigned_on_company_approval",
        })
      : await ensureCompanySubscription(company._id, { assigned_by: adminId(req) });

    const populated = await CompanyModel.findById(company._id)
      .populate("owner_user_id", "first_name mid_name last_name email role_id")
      .populate("role_id")
      .populate("subscription.plan_id")
      .populate("subscription.subscription_id")
      .lean();

    return ReturnDashData.updateData({
      res,
      data: { ...populated, request_state: companyRequestState(populated), subscription },
      message: "company_request_approved",
    });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: error.statusCode || 500, message: error.message || "company_approve_failed" });
  }
};

export const rejectCompanyRequest = async (req, res) => {
  try {
    const id = req.params.id || req.params.companyId || req.body.company_id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_company_id" });

    const company = await CompanyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          accepted: false,
          status: true,
          can_upload: true,
          reviewed_at: new Date(),
          reviewed_by: adminId(req),
          rejection_reason: clean(req.body?.reason || req.body?.message || req.body?.rejection_reason || "rejected_by_admin"),
        },
      },
      { new: true, runValidators: true }
    )
      .populate("owner_user_id", "first_name mid_name last_name email role_id")
      .populate("role_id")
      .lean();

    if (!company) return ReturnDashData.updateError({ res, status: 404, message: "company_request_not_found" });
    return ReturnDashData.updateData({ res, data: { ...company, request_state: companyRequestState(company) }, message: "company_request_rejected" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "company_reject_failed" });
  }
};

const jobReviewFilter = (req) => {
  const status = clean(req.query.status || req.query.publish_status || "pending_review");
  const filter = {};
  if (status !== "all") filter.publish_status = status;
  if (req.query.company_id && isValidObjectId(req.query.company_id)) filter.company_id = req.query.company_id;
  if (req.query.is_accepted !== undefined) filter.is_accepted = req.query.is_accepted === "true" || req.query.is_accepted === true;

  const q = clean(req.query.search || req.query.q || req.query.keyword);
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { job_name: regex },
      { description: regex },
      { city: regex },
      { countries: regex },
      { cities: regex },
      { job_keywords: regex },
      { keywords_norm: regex },
      { phrases_norm: regex },
      { "search_index.text_norm": regex },
      { "search_index.tokens": regex },
      { "search_projection.company.name": regex },
    ];
    if (isValidObjectId(q)) filter.$or.push({ _id: toObjectId(q) }, { company_id: toObjectId(q) }, { user_id: toObjectId(q) });
  }
  return filter;
};

export const listJobReviewQueue = async (req, res) => {
  try {
    const result = await paginate(jobsModel, jobReviewFilter(req), req, {
      sort: { updatedAt: -1, createdAt: -1 },
      populate: [
        { path: "company_id", select: "company_name company_email logo accepted status is_verified subscription" },
        { path: "user_id", select: "first_name mid_name last_name email" },
        { path: "job_type_id" },
        { path: "work_mode_id" },
        { path: "job_time_id" },
        { path: "job_salary_id" },
      ],
    });
    return ReturnDashData.getData({ res, data: result.items, other: { pagination: result.pagination } });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "job_review_queue_failed" });
  }
};

export const approveJob = async (req, res) => {
  try {
    const id = req.params.id || req.params.jobId || req.body.job_id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_job_id" });

    const allowedPublishStatuses = new Set(["published", "paused", "closed"]);
    const publishStatus = allowedPublishStatuses.has(clean(req.body?.publish_status))
      ? clean(req.body.publish_status)
      : "published";

    const job = await jobsModel.findByIdAndUpdate(
      id,
      {
        $set: {
          is_accepted: true,
          status: publishStatus === "published",
          publish_status: publishStatus,
          reviewed_by: adminId(req),
          reviewed_at: new Date(),
          rejection_reason: "",
          admin_note: clean(req.body?.admin_note || req.body?.note || ""),
        },
      },
      { new: true, runValidators: true }
    ).populate("company_id");

    if (!job) return ReturnDashData.updateError({ res, status: 404, message: "job_not_found" });
    await rebuildJobIntegration(job._id, { rebuildMatches: true });
    if (publishStatus === "published") {
      recordAnalyticsEvent({
        req,
        event: "job_published",
        userId: job.user_id,
        companyId: job.company_id?._id || job.company_id,
        entityType: "job",
        entityId: job._id,
        jobId: job._id,
        metadata: {
          source: "admin_approval",
          reviewed_by: String(adminId(req) || ""),
          publish_status: publishStatus,
        },
      }).catch(() => null);
    }
    return ReturnDashData.updateData({ res, data: job, message: "job_approved" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "job_approve_failed" });
  }
};

export const rejectJob = async (req, res) => {
  try {
    const id = req.params.id || req.params.jobId || req.body.job_id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_job_id" });

    const job = await jobsModel.findByIdAndUpdate(
      id,
      {
        $set: {
          is_accepted: false,
          status: false,
          publish_status: "rejected",
          reviewed_by: adminId(req),
          reviewed_at: new Date(),
          rejection_reason: clean(req.body?.reason || req.body?.message || req.body?.rejection_reason || "rejected_by_admin"),
        },
      },
      { new: true, runValidators: true }
    ).populate("company_id");

    if (!job) return ReturnDashData.updateError({ res, status: 404, message: "job_not_found" });
    await rebuildJobIntegration(job._id, { rebuildMatches: false });
    return ReturnDashData.updateData({ res, data: job, message: "job_rejected" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "job_reject_failed" });
  }
};

const talentFilter = (req) => {
  const filter = {};
  const status = clean(req.query.status || req.query.request_status || "all");
  if (status && status !== "all") filter.status = status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.company_id && isValidObjectId(req.query.company_id)) filter.company_id = req.query.company_id;
  if (req.query.job_id && isValidObjectId(req.query.job_id)) filter.job_id = req.query.job_id;

  const q = clean(req.query.search || req.query.q || req.query.keyword);
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { required_skills: regex },
      { preferred_skills: regex },
      { countries: regex },
      { cities: regex },
      { status: regex },
      { priority: regex },
      { admin_note: regex },
    ];
    if (isValidObjectId(q)) filter.$or.push({ _id: toObjectId(q) }, { company_id: toObjectId(q) }, { job_id: toObjectId(q) });
  }
  return filter;
};

export const listTalentRequests = async (req, res) => {
  try {
    const result = await paginate(JobZainTalentRequestModel, talentFilter(req), req, {
      sort: { priority: -1, createdAt: -1 },
      populate: [
        { path: "company_id", select: "company_name company_email logo subscription" },
        { path: "requested_by_user_id", select: "first_name mid_name last_name email" },
        { path: "job_id", select: "job_name publish_status status is_accepted" },
      ],
    });
    return ReturnDashData.getData({ res, data: result.items, other: { pagination: result.pagination } });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "talent_requests_failed" });
  }
};

export const updateTalentRequestStatus = async (req, res) => {
  try {
    const id = req.params.id || req.params.requestId;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_request_id" });

    const allowed = new Set(["new", "in_progress", "candidates_sent", "closed", "cancelled"]);
    const status = clean(req.body?.status || req.params.status);
    if (!allowed.has(status)) return ReturnDashData.updateError({ res, status: 422, message: "invalid_talent_request_status" });

    const patch = {
      status,
      admin_note: clean(req.body?.admin_note || req.body?.note || ""),
    };
    if (["closed", "cancelled"].includes(status)) patch.closed_at = new Date();

    const pushNote = clean(req.body?.note || req.body?.admin_note)
      ? { notes: { by_user_id: adminId(req), note: clean(req.body.note || req.body.admin_note), type: "admin" } }
      : undefined;

    const request = await JobZainTalentRequestModel.findByIdAndUpdate(
      id,
      { $set: patch, ...(pushNote ? { $push: pushNote } : {}) },
      { new: true, runValidators: true }
    )
      .populate("company_id", "company_name company_email logo")
      .populate("requested_by_user_id", "first_name mid_name last_name email")
      .populate("job_id", "job_name publish_status")
      .lean();

    if (!request) return ReturnDashData.updateError({ res, status: 404, message: "talent_request_not_found" });
    return ReturnDashData.updateData({ res, data: request, message: "talent_request_status_updated" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "talent_request_update_failed" });
  }
};

export const seedFreePlan = async (req, res) => {
  try {
    const plan = await ensureFreeSubscriptionPlan();
    return ReturnDashData.createData({ res, data: plan, message: "free_subscription_plan_ready" });
  } catch (error) {
    return ReturnDashData.createError({ res, status: 500, message: error.message || "free_plan_seed_failed" });
  }
};

export const assignSubscriptionPlan = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.body.company_id;
    const subscription = await assignPlanToCompany({
      companyId,
      planId: req.body.plan_id,
      planKey: req.body.plan_key,
      assignedBy: adminId(req),
      startsAt: req.body.starts_at,
      endsAt: req.body.ends_at,
      status: req.body.status || "active",
      adminNote: req.body.admin_note || "assigned_by_admin",
    });
    return ReturnDashData.createData({ res, data: subscription, message: "company_subscription_assigned" });
  } catch (error) {
    return ReturnDashData.createError({ res, status: error.statusCode || 500, message: error.message || "subscription_assign_failed" });
  }
};

export const getCompanySubscription = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.query.company_id;
    if (!isValidObjectId(companyId)) return ReturnDashData.getError({ res, status: 400, message: "invalid_company_id" });
    const data = await getCompanySubscriptionSummary(companyId);
    return ReturnDashData.getData({ res, data });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "company_subscription_failed" });
  }
};

export default {
  listCompanyRequests,
  approveCompanyRequest,
  rejectCompanyRequest,
  listJobReviewQueue,
  approveJob,
  rejectJob,
  listTalentRequests,
  updateTalentRequestStatus,
  seedFreePlan,
  assignSubscriptionPlan,
  getCompanySubscription,
};
