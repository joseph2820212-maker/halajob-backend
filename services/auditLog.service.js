import { AuditLogModel } from "../models/index.js";

const idOf = (value) => value?._id || value || null;

export const writeAuditLog = async ({
  req = null,
  companyId = null,
  actorUserId = null,
  actorType = "system",
  action,
  entityType = "other",
  entityId = null,
  jobId = null,
  applicationId = null,
  oldValue = null,
  newValue = null,
  note = "",
  metadata = {},
}) => {
  if (!action) return null;
  try {
    return await AuditLogModel.create({
      company_id: idOf(companyId),
      actor_user_id: idOf(actorUserId),
      actor_type: actorType,
      action,
      entity_type: entityType,
      entity_id: idOf(entityId),
      job_id: idOf(jobId),
      application_id: idOf(applicationId),
      old_value: oldValue,
      new_value: newValue,
      note,
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      user_agent: req?.headers?.["user-agent"] || "",
      metadata,
    });
  } catch (error) {
    console.error("audit_log_write_failed", { message: error?.message, action, entityType });
    return null;
  }
};
