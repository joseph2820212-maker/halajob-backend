import { AuditLogModel } from "../models/index.js";

const idOf = (value) => value?._id || value || null;
const REDACTED = "[REDACTED]";
const MAX_AUDIT_STRING_LENGTH = 2000;
const sensitiveKeyPatterns = [
  /password/i,
  /passcode/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /otp/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /device[_-]?code/i,
];

const isSensitiveKey = (key = "") => sensitiveKeyPatterns.some((pattern) => pattern.test(String(key)));

const cleanStringValue = (value = "") => {
  if (value.length <= MAX_AUDIT_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_AUDIT_STRING_LENGTH)}...[truncated]`;
};

export const redactAuditValue = (value, seen = new WeakSet()) => {
  if (value === null || typeof value === "undefined") return value;
  if (typeof value === "string") return cleanStringValue(value);
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (value?._bsontype && typeof value.toString === "function") return value;
  if (Buffer.isBuffer(value)) return `[binary:${value.length}]`;

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactAuditValue(item, seen));
  }

  const plain = typeof value.toObject === "function" ? value.toObject() : value;
  if (plain && typeof plain === "object" && plain !== value) {
    if (seen.has(plain)) return "[Circular]";
    seen.add(plain);
  }
  return Object.entries(plain).reduce((safe, [key, nestedValue]) => {
    safe[key] = isSensitiveKey(key) ? REDACTED : redactAuditValue(nestedValue, seen);
    return safe;
  }, {});
};

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
      old_value: redactAuditValue(oldValue),
      new_value: redactAuditValue(newValue),
      note: typeof note === "string" ? cleanStringValue(note) : note,
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      user_agent: req?.headers?.["user-agent"] || "",
      metadata: redactAuditValue(metadata) || {},
    });
  } catch (error) {
    console.error("audit_log_write_failed", { message: error?.message, action, entityType });
    return null;
  }
};
