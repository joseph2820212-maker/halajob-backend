import { CompanyMemberModel, UserModel } from "../../../models/index.js";
import { getCompanyUserIdOrFail, success, fail, paginate, isValidObjectId } from "../../../helper/companyDash/companyDashHelpers.js";
import { syncAccountContextsForUser } from "../../../services/accountContext.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const cleanText = (value = "") => String(value ?? "").trim();
const idOf = (value) => value?._id || value || null;
const toArray = (value) => {
  const items = Array.isArray(value)
    ? value
    : value
    ? String(value).split(/[,;\n]+/)
    : [];
  return [...new Set(items.map((x) => String(x || "").trim()).filter(Boolean))];
};
const companyActorType = (req) => (req.companyAccess?.role === "owner" ? "company_owner" : "company_member");
const MEMBER_ROLES = new Set(["admin", "hr_manager", "recruiter", "viewer"]);
const MEMBER_STATUSES = new Set(["active", "invited", "suspended", "removed"]);
const DEFAULT_PERMISSIONS_BY_ROLE = {
  owner: ["*"],
  admin: ["company.profile.manage", "jobs.manage", "ats.view", "ats.status.change", "ats.notes.add", "ats.messages.send", "ats.interviews.schedule", "ats.reject", "ats.hire", "analytics.view", "audit.view", "company.members.manage", "question_library.manage", "message_templates.manage", "support.manage", "billing.manage"],
  hr_manager: ["jobs.manage", "ats.view", "ats.status.change", "ats.notes.add", "ats.messages.send", "ats.interviews.schedule", "ats.reject", "ats.hire", "analytics.view", "company.members.manage", "question_library.manage", "message_templates.manage", "support.manage", "billing.manage"],
  recruiter: ["ats.view", "ats.status.change", "ats.notes.add", "ats.messages.send", "ats.interviews.schedule"],
  viewer: ["ats.view"],
};

export const listMembers = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const filter = { company_id: companyData.company._id };
    if (req.query.status) filter.status = cleanText(req.query.status);
    if (req.query.role) filter.member_role = cleanText(req.query.role);
    const result = await paginate(CompanyMemberModel, filter, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [{ path: "user_id", select: "first_name mid_name last_name email image" }, { path: "role_id" }],
      lean: true,
    });
    return success(res, result.items, "company_members", 200, result.meta);
  } catch (error) { next(error); }
};

export const upsertMember = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const userId = req.body.user_id || req.params.userId;
    if (!isValidObjectId(userId)) return fail(res, "invalid_user_id", 400);
    if (String(userId) === String(idOf(companyData.company.owner_user_id || companyData.company.user_id))) {
      return fail(res, "company_owner_cannot_be_added_as_member", 422);
    }
    const user = await UserModel.findById(userId).select("_id email").lean();
    if (!user) return fail(res, "user_not_found", 404);
    const memberRole = MEMBER_ROLES.has(req.body.member_role) ? req.body.member_role : "recruiter";
    const permissions = toArray(req.body.permissions);
    const payload = {
      company_id: companyData.company._id,
      user_id: userId,
      role_id: isValidObjectId(req.body.role_id) ? req.body.role_id : null,
      member_role: memberRole,
      permissions: permissions.length ? permissions : DEFAULT_PERMISSIONS_BY_ROLE[memberRole],
      status: MEMBER_STATUSES.has(req.body.status) ? req.body.status : "active",
      invited_by: companyData.userId,
      invited_at: new Date(),
    };
    const member = await CompanyMemberModel.findOneAndUpdate(
      { company_id: companyData.company._id, user_id: userId },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate({ path: "user_id", select: "first_name mid_name last_name email image" });
    await syncAccountContextsForUser(userId);
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "company_member_upserted",
      entityType: "company_member",
      entityId: member._id,
      newValue: payload,
    });
    return success(res, member, "company_member_saved", 201);
  } catch (error) { next(error); }
};

export const updateMember = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.memberId)) return fail(res, "invalid_member_id", 400);
    const patch = {};
    if (req.body.member_role) {
      if (!MEMBER_ROLES.has(req.body.member_role)) return fail(res, "invalid_member_role", 422);
      patch.member_role = req.body.member_role;
    }
    if (req.body.permissions !== undefined) patch.permissions = toArray(req.body.permissions);
    if (req.body.status) {
      if (!MEMBER_STATUSES.has(req.body.status)) return fail(res, "invalid_member_status", 422);
      patch.status = req.body.status;
    }
    if (req.body.role_id !== undefined) patch.role_id = isValidObjectId(req.body.role_id) ? req.body.role_id : null;
    const existing = await CompanyMemberModel.findOne({ _id: req.params.memberId, company_id: companyData.company._id }).lean();
    if (!existing) return fail(res, "company_member_not_found", 404);
    const member = await CompanyMemberModel.findOneAndUpdate(
      { _id: req.params.memberId, company_id: companyData.company._id },
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!member) return fail(res, "company_member_not_found", 404);
    await syncAccountContextsForUser(member.user_id);
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "company_member_updated",
      entityType: "company_member",
      entityId: member._id,
      oldValue: {
        member_role: existing.member_role,
        permissions: existing.permissions || [],
        status: existing.status,
        role_id: existing.role_id || null,
      },
      newValue: patch,
    });
    return success(res, member, "company_member_updated");
  } catch (error) { next(error); }
};

export const removeMember = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.memberId)) return fail(res, "invalid_member_id", 400);
    const existing = await CompanyMemberModel.findOne({ _id: req.params.memberId, company_id: companyData.company._id }).lean();
    if (!existing) return fail(res, "company_member_not_found", 404);
    const member = await CompanyMemberModel.findOneAndUpdate(
      { _id: req.params.memberId, company_id: companyData.company._id },
      { $set: { status: "removed" } },
      { new: true }
    );
    if (!member) return fail(res, "company_member_not_found", 404);
    await syncAccountContextsForUser(member.user_id);
    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "company_member_removed",
      entityType: "company_member",
      entityId: member._id,
      oldValue: { status: existing.status },
      newValue: { status: "removed" },
    });
    return success(res, member, "company_member_removed");
  } catch (error) { next(error); }
};

export default { listMembers, upsertMember, updateMember, removeMember };
