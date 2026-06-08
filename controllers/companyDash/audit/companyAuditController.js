import { AuditLogModel } from "../../../models/index.js";
import { getCompanyUserIdOrFail, success, fail, paginate, isValidObjectId } from "../../../helper/companyDash/companyDashHelpers.js";

const cleanText = (value = "") => String(value ?? "").trim();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildFilter = (companyId, query = {}) => {
  const filter = { company_id: companyId };
  if (query.entity_type) filter.entity_type = cleanText(query.entity_type);
  if (query.action) filter.action = cleanText(query.action);
  if (query.job_id && isValidObjectId(query.job_id)) filter.job_id = query.job_id;
  if (query.application_id && isValidObjectId(query.application_id)) filter.application_id = query.application_id;
  if (query.actor_user_id && isValidObjectId(query.actor_user_id)) filter.actor_user_id = query.actor_user_id;
  if (query.entity_id && isValidObjectId(query.entity_id)) filter.entity_id = query.entity_id;
  if (query.search || query.q) {
    const regex = new RegExp(escapeRegex(query.search || query.q), "i");
    filter.$or = [{ action: regex }, { note: regex }, { entity_type: regex }];
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  return filter;
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const filter = buildFilter(companyData.company._id, req.query);
    const result = await paginate(AuditLogModel, filter, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [{ path: "actor_user_id", select: "first_name mid_name last_name email image" }],
      lean: true,
    });
    return success(res, result.items, "company_audit_logs", 200, result.meta);
  } catch (error) { next(error); }
};

export const getJobAuditLogs = async (req, res, next) => {
  req.query.job_id = req.params.jobId;
  return getAuditLogs(req, res, next);
};

export const getApplicationAuditLogs = async (req, res, next) => {
  req.query.application_id = req.params.applicationId;
  return getAuditLogs(req, res, next);
};

export default { getAuditLogs, getJobAuditLogs, getApplicationAuditLogs };
