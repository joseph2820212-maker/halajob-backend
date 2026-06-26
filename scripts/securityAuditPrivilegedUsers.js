import "../config/loadEnv.js";
import mongoose from "mongoose";
import {
  CompanyMemberModel,
  CompanyModel,
  PermissionModel,
  RefreshTokenModel,
  RoleModel,
  UniversityMembershipModel,
  UserModel,
} from "../models/index.js";

const connectionUrl = String(process.env.CONNECTION_URL || "").trim();

if (!connectionUrl) {
  console.error("Missing CONNECTION_URL. Run this against the database you need to audit.");
  process.exit(1);
}

const id = (value) => (value ? String(value._id || value) : null);

const safeUser = (user = {}) => ({
  id: id(user),
  email: user.email || "",
  phone_e164: user.phone_e164 || user.phone || "",
  status: user.status === true ? "active" : "inactive",
  role: user.role_id
    ? {
        id: id(user.role_id),
        name: user.role_id.name || "",
        log_to: user.role_id.log_to || "",
        role_number: user.role_id.role_number || null,
      }
    : null,
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null,
});

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const itemId = id(item);
    if (!itemId || seen.has(itemId)) return false;
    seen.add(itemId);
    return true;
  });
};

try {
  await mongoose.connect(connectionUrl, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });

  const privilegedRoles = await RoleModel.find({
    $or: [
      { log_to: "dash" },
      { role_number: 1 },
      { name: { $in: ["admin", "super_admin", "superadmin", "platform_admin"] } },
    ],
  })
    .populate("permissions")
    .lean();
  const privilegedRoleIds = privilegedRoles.map((role) => role._id);

  const wildcardPermissions = await PermissionModel.find({ key: { $in: ["*", "all", "admin.*"] } }).lean();
  const wildcardPermissionIds = wildcardPermissions.map((permission) => permission._id);

  const platformAdmins = await UserModel.find({
    $or: [
      { role_id: { $in: privilegedRoleIds } },
      ...(wildcardPermissionIds.length ? [{ permissions: { $in: wildcardPermissionIds } }] : []),
    ],
  })
    .select("-password -passcode -another_device_code -pending_device -device")
    .populate("role_id")
    .populate("permissions")
    .lean();

  const platformAdminIds = platformAdmins.map((user) => id(user)).filter(Boolean);

  const [companyOwners, elevatedCompanyMembers, universityAdmins, inactivePrivilegedSessions, seededLookingAccounts] =
    await Promise.all([
      CompanyModel.find({ owner_user_id: { $ne: null } })
        .select("company_name company_email owner_user_id status request_state is_accepted createdAt updatedAt")
        .populate({ path: "owner_user_id", select: "email phone_e164 phone status role_id createdAt updatedAt", populate: { path: "role_id" } })
        .lean(),
      CompanyMemberModel.find({
        member_role: { $in: ["owner", "admin", "hr_manager"] },
        status: { $ne: "removed" },
      })
        .populate("company_id", "company_name company_email owner_user_id status request_state")
        .populate({ path: "user_id", select: "email phone_e164 phone status role_id createdAt updatedAt", populate: { path: "role_id" } })
        .lean(),
      UniversityMembershipModel.find({
        role: { $in: ["owner", "admin", "career_center", "advisor"] },
        status: { $ne: "removed" },
      })
        .populate("university_id", "name name_en email_domain status")
        .populate({ path: "user_id", select: "email phone_e164 phone status role_id createdAt updatedAt", populate: { path: "role_id" } })
        .lean(),
      RefreshTokenModel.aggregate([
        { $match: { userRef: { $in: platformAdminIds } } },
        { $group: { _id: "$userRef", sessionCount: { $sum: 1 }, lastLoginTime: { $max: "$loginTime" } } },
      ]),
      UserModel.find({
        $or: [
          { phone_e164: "+963999999999" },
          { phone_national: "999999999" },
          { email: /(^admin@|seed|test|example)/i },
        ],
      })
        .select("-password -passcode -another_device_code -pending_device -device")
        .populate("role_id")
        .lean(),
    ]);

  const inactiveAdminIds = new Set(platformAdmins.filter((user) => user.status !== true).map((user) => id(user)));
  const inactiveAdminSessions = inactivePrivilegedSessions.filter((session) => inactiveAdminIds.has(String(session._id)));

  const report = {
    generatedAt: new Date().toISOString(),
    database: {
      host: new URL(connectionUrl).host,
      name: mongoose.connection.name,
    },
    summary: {
      platformAdminCount: platformAdmins.length,
      companyOwnerCount: companyOwners.length,
      elevatedCompanyMemberCount: elevatedCompanyMembers.length,
      universityAdminCount: universityAdmins.length,
      wildcardPermissionCount: wildcardPermissions.length,
      inactivePrivilegedSessionCount: inactiveAdminSessions.length,
      seededLookingAccountCount: seededLookingAccounts.length,
    },
    platformAdmins: uniqueById(platformAdmins).map(safeUser),
    companyOwners: companyOwners.map((company) => ({
      companyId: id(company),
      companyName: company.company_name || "",
      companyEmail: company.company_email || "",
      owner: safeUser(company.owner_user_id || {}),
      status: company.status ?? null,
      request_state: company.request_state || null,
      is_accepted: company.is_accepted ?? null,
    })),
    elevatedCompanyMembers: elevatedCompanyMembers.map((member) => ({
      memberId: id(member),
      role: member.member_role,
      permissions: member.permissions || [],
      status: member.status,
      company: member.company_id
        ? {
            id: id(member.company_id),
            name: member.company_id.company_name || "",
            email: member.company_id.company_email || "",
          }
        : null,
      user: safeUser(member.user_id || {}),
    })),
    universityAdmins: universityAdmins.map((membership) => ({
      membershipId: id(membership),
      role: membership.role,
      permissions: membership.permissions || [],
      status: membership.status,
      university: membership.university_id
        ? {
            id: id(membership.university_id),
            name: membership.university_id.name_en || membership.university_id.name || "",
            email_domain: membership.university_id.email_domain || "",
            status: membership.university_id.status || "",
          }
        : null,
      user: safeUser(membership.user_id || {}),
    })),
    wildcardPermissions: wildcardPermissions.map((permission) => ({
      id: id(permission),
      key: permission.key,
      group: permission.group,
      action: permission.action,
      status: permission.status === true ? "active" : "inactive",
    })),
    inactivePrivilegedSessions: inactiveAdminSessions.map((session) => ({
      userId: String(session._id),
      sessionCount: session.sessionCount,
      lastLoginTime: session.lastLoginTime,
    })),
    seededLookingAccounts: uniqueById(seededLookingAccounts).map(safeUser),
    ownerReviewRequired: [
      "Confirm each platform admin is approved by the owner.",
      "Confirm each company owner/elevated member belongs to the right company.",
      "Confirm each university admin belongs to the right university.",
      "Remove inactive privileged sessions with logout-all/password reset if any are listed.",
      "Disable or remove seeded-looking accounts that are not approved test accounts.",
    ],
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  await mongoose.connection.close(false);
}
