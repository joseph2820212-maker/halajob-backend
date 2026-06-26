import mongoose from "mongoose";
import {
  AccountContextModel,
  CompanyMemberModel,
  CompanyModel,
  EmployeeModel,
  RoleModel,
  UniversityMembershipModel,
  UniversityModel,
  UserModel,
} from "../models/index.js";
import { getCompanyRequestState, getRoleAccountType } from "./appAccount.service.js";
import { writeAuditLog } from "./auditLog.service.js";
import ApiError from "../utils/apiError.js";

const ACTIVE_STATUSES = new Set(["active", "pending"]);

const DEFAULT_PERMISSIONS = {
  job_seeker: [
    "jobs.search",
    "jobs.save",
    "jobs.apply",
    "applications.manage",
    "career_passport.manage",
  ],
  student: [
    "campus.profile.manage",
    "campus.opportunities.apply",
    "campus.events.register",
    "career_passport.manage",
  ],
  company_member: ["ats.view"],
  company_admin: ["*"],
  university_admin: [
    "campus.verifications.manage",
    "campus.dashboard.view",
    "campus.events.manage",
    "campus.students.view",
  ],
  super_admin: ["*"],
};

const norm = (value) => String(value || "").trim().toLowerCase();

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;
};

const contextAccessError = (statusCode, message) => new ApiError(statusCode, message, "Account Context");

const idOf = (value) => value?._id || value || null;

const buildPublicUrl = (base, rel) => {
  if (!rel) return "";
  if (/^https?:\/\//i.test(String(rel))) return String(rel);
  const cleaned = String(rel).replace(/^\/+/, "");
  if (!base) return cleaned;
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
};

const fullName = (user = {}) =>
  [user.first_name, user.mid_name, user.last_name].map((part) => String(part || "").trim()).filter(Boolean).join(" ");

const contextKey = (contextType, entityId) => `${contextType}:${String(entityId || "self")}`;

const statusFromCompany = (company) => {
  const state = getCompanyRequestState(company);
  if (state === "approved") return "active";
  if (state === "suspended") return "suspended";
  if (state === "rejected") return "removed";
  return "pending";
};

const statusFromMembership = (status) => {
  if (status === "active") return "active";
  if (status === "invited") return "pending";
  if (status === "suspended") return "suspended";
  return "removed";
};

const isSuperAdminRole = (role) => {
  const roleName = norm(role?.name);
  const roleLogTo = norm(role?.log_to);
  const roleNumber = Number(role?.role_number);
  return roleLogTo === "admin" || roleName.includes("admin") || roleNumber === 1;
};

const rolePermissions = (role, user = {}) => {
  const fromRole = Array.isArray(role?.permissions)
    ? role.permissions.map((item) => item?.key || item?.name || item).filter(Boolean)
    : [];
  const fromUser = Array.isArray(user?.permissions)
    ? user.permissions.map((item) => item?.key || item?.name || item).filter(Boolean)
    : [];
  return [...new Set([...fromRole, ...fromUser].map(String))];
};

export const serializeAccountContext = (context, activeId = null) => {
  if (!context) return null;
  const id = String(context._id || "");
  return {
    id,
    context_key: context.context_key,
    type: context.context_type,
    context_type: context.context_type,
    entity_id: context.entity_id || null,
    entity_model: context.entity_model || "",
    display_name: context.display_name || "",
    avatar_url: context.avatar_url || "",
    status: context.status || "active",
    permissions: context.permissions || [],
    is_default: context.is_default === true,
    is_active: activeId ? id === String(activeId) : context.is_default === true,
    last_used_at: context.last_used_at || null,
    metadata: context.metadata || {},
  };
};

async function getUserWithRole(userInput) {
  const userId = toObjectId(userInput?._id || userInput?.id || userInput);
  if (!userId) return null;
  return UserModel.findById(userId)
    .select("-password -passcode -another_device_code -pending_device -device")
    .populate({ path: "role_id", populate: { path: "permissions" } })
    .populate("permissions")
    .lean();
}

async function upsertDerivedContext({
  userId,
  contextType,
  entityId,
  entityModel,
  displayName,
  avatarUrl = "",
  status = "active",
  permissions = [],
  metadata = {},
}) {
  const entityObjectId = toObjectId(entityId);
  const key = contextKey(contextType, entityObjectId || "self");
  const cleanPermissions = permissions.length ? permissions : DEFAULT_PERMISSIONS[contextType] || [];
  return AccountContextModel.findOneAndUpdate(
    { user_id: userId, context_key: key },
    {
      $set: {
        context_type: contextType,
        entity_id: entityObjectId,
        entity_model: entityModel || "",
        display_name: displayName || contextType,
        avatar_url: avatarUrl || "",
        status,
        permissions: cleanPermissions,
        metadata: {
          source: "derived",
          ...metadata,
        },
      },
      $setOnInsert: {
        user_id: userId,
        context_key: key,
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function syncAccountContextsForUser(userInput) {
  const user = await getUserWithRole(userInput);
  const userId = toObjectId(user?._id);
  if (!userId) return { contexts: [], activeContext: null };

  const [employee, ownedCompanies, companyMemberships, universityMemberships, careerUniversity] = await Promise.all([
    EmployeeModel.findOne({ user_id: userId }).lean(),
    CompanyModel.find({ $or: [{ owner_user_id: userId }, { user_id: userId }] }).lean(),
    CompanyMemberModel.find({ user_id: userId, status: { $ne: "removed" } }).populate("company_id").lean(),
    UniversityMembershipModel.find({ user_id: userId, status: { $ne: "removed" } }).populate("university_id").lean(),
    UniversityModel.findOne({
      career_center_email: norm(user.email),
      status: { $ne: "suspended" },
    }).lean(),
  ]);

  const seenKeys = new Set();
  const upserts = [];
  const userDisplayName = fullName(user) || user.email || "Job seeker";
  const userAvatar = buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image);

  upserts.push(
    upsertDerivedContext({
      userId,
      contextType: "job_seeker",
      entityId: employee?._id || userId,
      entityModel: employee?._id ? "employees" : "users",
      displayName: userDisplayName,
      avatarUrl: userAvatar,
      status: "active",
    })
  );
  seenKeys.add(contextKey("job_seeker", employee?._id || userId));

  if (employee?.is_student === true || norm(employee?.candidate_stage) === "student") {
    upserts.push(
      upsertDerivedContext({
        userId,
        contextType: "student",
        entityId: employee._id,
        entityModel: "employees",
        displayName: employee.university || employee.student_profile?.university || `${userDisplayName} student`,
        avatarUrl: userAvatar,
        status: "active",
        metadata: {
          university_id: employee.university_id || employee.student_profile?.university_id || null,
          student_email_verified: employee.student_email_verified === true || employee.student_profile?.student_email_verified === true,
        },
      })
    );
    seenKeys.add(contextKey("student", employee._id));
  }

  const ownerCompanyIds = new Set();
  for (const company of ownedCompanies) {
    const companyId = idOf(company);
    if (!companyId) continue;
    ownerCompanyIds.add(String(companyId));
    upserts.push(
      upsertDerivedContext({
        userId,
        contextType: "company_admin",
        entityId: companyId,
        entityModel: "companies",
        displayName: company.company_name || company.name || "Company admin",
        avatarUrl: buildPublicUrl(process.env.PUBLIC_BASE_URL, company.logo || company.image),
        status: statusFromCompany(company),
        permissions: ["*"],
        metadata: {
          company_state: getCompanyRequestState(company),
          role: "owner",
        },
      })
    );
    seenKeys.add(contextKey("company_admin", companyId));
  }

  for (const member of companyMemberships) {
    const company = member.company_id && typeof member.company_id === "object" ? member.company_id : null;
    const companyId = idOf(company || member.company_id);
    if (!companyId || ownerCompanyIds.has(String(companyId))) continue;
    const memberRole = member.member_role || "recruiter";
    const contextType = ["owner", "admin"].includes(memberRole) ? "company_admin" : "company_member";
    upserts.push(
      upsertDerivedContext({
        userId,
        contextType,
        entityId: companyId,
        entityModel: "companies",
        displayName: company?.company_name || company?.name || "Company member",
        avatarUrl: buildPublicUrl(process.env.PUBLIC_BASE_URL, company?.logo || company?.image),
        status: statusFromMembership(member.status),
        permissions: member.permissions || DEFAULT_PERMISSIONS[contextType],
        metadata: {
          member_id: member._id,
          role: memberRole,
        },
      })
    );
    seenKeys.add(contextKey(contextType, companyId));
  }

  const addUniversityContext = (university, membership = null) => {
    const universityId = idOf(university);
    if (!universityId) return;
    const permissions = membership?.permissions?.length ? membership.permissions : DEFAULT_PERMISSIONS.university_admin;
    upserts.push(
      upsertDerivedContext({
        userId,
        contextType: "university_admin",
        entityId: universityId,
        entityModel: "universities",
        displayName: university.name_en || university.name || "University admin",
        status: membership ? statusFromMembership(membership.status) : "active",
        permissions,
        metadata: {
          membership_id: membership?._id || null,
          role: membership?.role || "career_center",
        },
      })
    );
    seenKeys.add(contextKey("university_admin", universityId));
  };

  for (const membership of universityMemberships) {
    const university = membership.university_id && typeof membership.university_id === "object" ? membership.university_id : null;
    addUniversityContext(university || { _id: membership.university_id }, membership);
  }
  if (careerUniversity) addUniversityContext(careerUniversity);

  if (isSuperAdminRole(user.role_id)) {
    upserts.push(
      upsertDerivedContext({
        userId,
        contextType: "super_admin",
        entityId: userId,
        entityModel: "platform",
        displayName: "Platform admin",
        status: "active",
        permissions: rolePermissions(user.role_id, user).length ? rolePermissions(user.role_id, user) : ["*"],
      })
    );
    seenKeys.add(contextKey("super_admin", userId));
  }

  await Promise.all(upserts);
  await AccountContextModel.updateMany(
    {
      user_id: userId,
      "metadata.source": "derived",
      context_key: { $nin: [...seenKeys] },
    },
    { $set: { status: "removed", is_default: false } }
  );

  const contexts = await AccountContextModel.find({ user_id: userId, status: { $ne: "removed" } })
    .sort({ is_default: -1, last_used_at: -1, createdAt: 1, _id: 1 })
    .lean();

  const requestedDefault = contexts.find(
    (item) => String(item._id) === String(user.default_context_id || "") && ACTIVE_STATUSES.has(item.status)
  );
  const roleAccountType = getRoleAccountType(user.role_id);
  const preferredForRole =
    roleAccountType === "company"
      ? ["company_admin", "company_member"]
      : roleAccountType === "employee"
      ? ["job_seeker", "student"]
      : isSuperAdminRole(user.role_id)
      ? ["super_admin"]
      : ["job_seeker", "student", "company_admin", "company_member", "university_admin", "super_admin"];

  const activeContext =
    requestedDefault ||
    contexts.find((item) => item.is_default && ACTIVE_STATUSES.has(item.status)) ||
    contexts.find((item) => preferredForRole.includes(item.context_type) && ACTIVE_STATUSES.has(item.status)) ||
    contexts.find((item) => item.context_type === "job_seeker" && ACTIVE_STATUSES.has(item.status)) ||
    contexts.find((item) => ACTIVE_STATUSES.has(item.status)) ||
    contexts[0] ||
    null;

  if (activeContext) {
    await Promise.all([
      UserModel.updateOne({ _id: userId }, { $set: { default_context_id: activeContext._id } }),
      AccountContextModel.updateMany({ user_id: userId, _id: { $ne: activeContext._id } }, { $set: { is_default: false } }),
      AccountContextModel.updateOne(
        { _id: activeContext._id },
        { $set: { is_default: true, last_used_at: activeContext.last_used_at || new Date() } }
      ),
    ]);
  }

  const refreshed = await AccountContextModel.find({ user_id: userId, status: { $ne: "removed" } })
    .sort({ is_default: -1, last_used_at: -1, createdAt: 1, _id: 1 })
    .lean();
  const refreshedActive = activeContext
    ? refreshed.find((item) => String(item._id) === String(activeContext._id)) || activeContext
    : null;

  return {
    contexts: refreshed.map((item) => serializeAccountContext(item, refreshedActive?._id)),
    activeContext: serializeAccountContext(refreshedActive, refreshedActive?._id),
  };
}

export async function setActiveAccountContext({ user, contextId, req = null }) {
  const userId = toObjectId(user?._id || user?.id);
  const requestedId = toObjectId(contextId);
  if (!userId || !requestedId) {
    const error = new Error("INVALID_CONTEXT_ID");
    error.statusCode = 400;
    throw error;
  }

  await syncAccountContextsForUser(user);
  const context = await AccountContextModel.findOne({
    _id: requestedId,
    user_id: userId,
    status: { $in: ["active", "pending"] },
  }).lean();

  if (!context) {
    const error = new Error("CONTEXT_NOT_FOUND");
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    UserModel.updateOne({ _id: userId }, { $set: { default_context_id: context._id } }),
    AccountContextModel.updateMany({ user_id: userId, _id: { $ne: context._id } }, { $set: { is_default: false } }),
    AccountContextModel.updateOne(
      { _id: context._id },
      { $set: { is_default: true, last_used_at: new Date() } }
    ),
    writeAuditLog({
      req,
      actorUserId: userId,
      actorType: "employee",
      action: "account_context_switched",
      entityType: "other",
      entityId: context._id,
      newValue: {
        context_type: context.context_type,
        entity_id: context.entity_id,
        status: context.status,
      },
    }),
  ]);

  return syncAccountContextsForUser(user);
}

export async function resolveActiveContextForUser(userInput, requestedContextId = null) {
  const userId = toObjectId(userInput?._id || userInput?.id);
  if (!userId) return null;
  const hasRequestedContext =
    requestedContextId !== null &&
    requestedContextId !== undefined &&
    String(requestedContextId).trim() !== "";
  const requestedId = toObjectId(requestedContextId);
  const defaultId = toObjectId(userInput?.default_context_id);

  if (hasRequestedContext) {
    if (!requestedId) {
      throw contextAccessError(400, "invalid_active_context_id");
    }

    const requestedContext = await AccountContextModel.findById(requestedId).lean();
    if (!requestedContext || String(requestedContext.user_id || "") !== String(userId)) {
      throw contextAccessError(403, "active_context_forbidden");
    }

    if (!ACTIVE_STATUSES.has(requestedContext.status)) {
      throw contextAccessError(403, "active_context_not_available");
    }

    return serializeAccountContext(requestedContext, requestedContext._id);
  }

  let context = null;
  if (!context && defaultId) {
    context = await AccountContextModel.findOne({
      _id: defaultId,
      user_id: userId,
      status: { $in: ["active", "pending"] },
    }).lean();
  }

  if (context) return serializeAccountContext(context, context._id);
  const synced = await syncAccountContextsForUser(userInput);
  return synced.activeContext;
}

export async function getAccountPermissions(userInput) {
  const synced = await syncAccountContextsForUser(userInput);
  return {
    activeContext: synced.activeContext,
    permissions: synced.activeContext?.permissions || [],
    contexts: synced.contexts,
  };
}
