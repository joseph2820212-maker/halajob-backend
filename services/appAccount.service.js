import mongoose from "mongoose";
import { CompanyModel, EmployeeModel, RoleModel } from "../models/index.js";

const COMPANY_ROLE_NUMBER = 3;
const EMPLOYEE_ROLE_NUMBER = 4;

const norm = (value) => String(value || "").trim().toLowerCase();

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;
};

export function getCompanyRequestState(company) {
  if (!company) return "none";

  const accepted = company.accepted === true;
  const active = company.status === true;
  const canUpload = company.can_upload === true;

  if (accepted && active) return "approved";
  if (accepted && !active) return "suspended";
  if (!accepted && !active && canUpload) return "draft";
  if (!accepted && !active && !canUpload) return "pending";
  if (!accepted && active) return "rejected";

  return "unknown";
}

export function accountMessage(lan = "en", accountType = "unknown", companyState = "none") {
  const isAr = norm(lan) === "ar";

  if (accountType === "employee") {
    return isAr
      ? "هذا الإجراء متاح للموظفين فقط."
      : "This action is available for employee accounts only.";
  }

  if (accountType === "company") {
    const messages = {
      none: ["لم يتم إنشاء طلب شركة بعد.", "A company request has not been created yet."],
      draft: ["طلب الشركة غير مكتمل بعد.", "Company request is not completed yet."],
      pending: ["طلب الشركة قيد المراجعة.", "Company request is under review."],
      rejected: ["تم رفض طلب الشركة.", "Company request was rejected."],
      suspended: ["تم إيقاف حساب الشركة مؤقتًا.", "Company account has been temporarily suspended."],
      unknown: ["حالة حساب الشركة غير معروفة.", "Unknown company account state."],
      approved: ["هذا الإجراء متاح للشركات فقط.", "This action is available for company accounts only."],
    };

    const pair = messages[companyState] || messages.unknown;
    return isAr ? pair[0] : pair[1];
  }

  return isAr ? "نوع الحساب غير معروف." : "Unknown account type.";
}

export async function getRoleForUser(user) {
  const populatedRole = user?.role_id;
  if (populatedRole && typeof populatedRole === "object" && populatedRole._id) {
    return populatedRole;
  }

  const roleId = toObjectId(populatedRole);
  if (!roleId) return null;
  return RoleModel.findById(roleId).lean();
}

export function getRoleAccountType(role) {
  const logTo = norm(role?.log_to);
  const name = norm(role?.name);
  const number = Number(role?.role_number);

  if (logTo === "company" || name === "company" || number === COMPANY_ROLE_NUMBER) return "company";
  if (logTo === "employee" || name === "employee" || number === EMPLOYEE_ROLE_NUMBER) return "employee";

  return "unknown";
}

export async function getCompanyRole() {
  return (
    (await RoleModel.findOne({ role_number: COMPANY_ROLE_NUMBER, log_to: "company", status: true }).lean()) ||
    (await RoleModel.findOne({ log_to: "company", status: true }).lean()) ||
    (await RoleModel.findOne({ role_number: COMPANY_ROLE_NUMBER }).lean())
  );
}

export async function getEmployeeRole() {
  return (
    (await RoleModel.findOne({ role_number: EMPLOYEE_ROLE_NUMBER, log_to: "employee", status: true }).lean()) ||
    (await RoleModel.findOne({ log_to: "employee", status: true }).lean()) ||
    (await RoleModel.findOne({ role_number: EMPLOYEE_ROLE_NUMBER }).lean())
  );
}

export function buildCompanyOwnerQuery(userId) {
  const objectId = toObjectId(userId);
  if (!objectId) return { _id: null };

  // owner_user_id is the current schema field. user_id is kept only for legacy records/controllers.
  return {
    $or: [{ owner_user_id: objectId }, { user_id: objectId }],
  };
}

export async function findCompanyByUserId(userId, extra = {}) {
  return CompanyModel.findOne({ ...buildCompanyOwnerQuery(userId), ...extra }).lean();
}

export async function findEmployeeByUserId(userId, extra = {}) {
  const objectId = toObjectId(userId);
  if (!objectId) return null;
  return EmployeeModel.findOne({ user_id: objectId, ...extra }).lean();
}

export async function ensureEmployeeProfileForUser(user, roleDoc = null) {
  const userId = toObjectId(user?._id || user?.id);
  if (!userId) return null;

  const role = roleDoc || (await getEmployeeRole());
  if (!role?._id) {
    const err = new Error("EMPLOYEE_ROLE_NOT_FOUND");
    err.statusCode = 500;
    throw err;
  }

  return EmployeeModel.findOneAndUpdate(
    { user_id: userId },
    {
      $setOnInsert: {
        user_id: userId,
        role_id: role._id,
        status: true,
        accepted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export function buildPublicUrl(base, rel) {
  if (!rel) return null;
  if (/^https?:\/\//i.test(String(rel))) return rel;
  const cleaned = String(rel).replace(/^\/+/, "");
  if (!base) return cleaned;
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

export function buildUserDto(user) {
  return {
    id: user?._id || user?.id,
    first_name: user?.first_name || "",
    mid_name: user?.mid_name || "",
    last_name: user?.last_name || "",
    full_name: [user?.first_name, user?.mid_name, user?.last_name].filter(Boolean).join(" "),
    image: user?.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
    email: user?.email || "",
    phone_country: user?.phone_country || null,
    phone_code: user?.phone_code || null,
    phone: user?.phone_national || user?.phone || null,
    phone_national: user?.phone_national || null,
    gender: user?.gender || null,
    birthday: user?.birthday || null,
    status: user?.status === true,
  };
}

export function buildRoleDto(role, user = {}) {
  if (!role) return null;
  return {
    id: role._id,
    name: role.name,
    log_to: role.log_to,
    role_number: role.role_number,
    title_ar: role.title_ar,
    title_en: role.title_en,
    permissions: user.permissions || [],
  };
}

export function serializeEmployee(employee) {
  if (!employee) return null;
  return {
    id: employee._id,
    user_id: employee.user_id,
    role_id: employee.role_id,
    profile_headline: employee.profile_headline || "",
    current_job_title: employee.current_job_title || "",
    about_me: employee.about_me || "",
    profile_completion: employee.profile_completion || 0,
    candidate_stage: employee.candidate_stage || "unknown",
    is_student: employee.is_student === true,
    graduation_year: employee.graduation_year ?? null,
    experience_years: employee.experience_years ?? 0,
    status: employee.status === true,
    accepted: employee.accepted === true,
  };
}

export function serializeCompany(company) {
  if (!company) return null;
  return {
    id: company._id,
    owner_user_id: company.owner_user_id || company.user_id,
    role_id: company.role_id,
    request_state: getCompanyRequestState(company),
    company_name: company.company_name || "",
    name: company.company_name || "",
    company_email: company.company_email || "",
    image: company.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.image) : null,
    logo: company.logo ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.logo) : null,
    cover_image: company.cover_image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.cover_image) : null,
    status: company.status === true,
    accepted: company.accepted === true,
    can_upload: company.can_upload === true,
    is_verified: company.is_verified === true,
    profile_completion: company.profile_completion || 0,
  };
}

export async function resolveAppAccount(user, options = {}) {
  const userId = toObjectId(user?._id || user?.id);
  if (!userId) {
    return {
      accountType: "unknown",
      roleType: "unknown",
      role: null,
      employee: null,
      company: null,
      companyState: "none",
    };
  }

  const [role, company, employee] = await Promise.all([
    getRoleForUser(user),
    findCompanyByUserId(userId),
    findEmployeeByUserId(userId),
  ]);

  const roleType = getRoleAccountType(role);
  const companyState = getCompanyRequestState(company);

  let accountType = "unknown";

  // Approved company profile is the strongest signal. This also fixes old accounts
  // where the dashboard accepted the company but did not update users.role_id.
  if (companyState === "approved") accountType = "company";
  else if (roleType === "company") accountType = "company";
  else if (roleType === "employee") accountType = "employee";
  else if (employee?._id) accountType = "employee";
  else if (company?._id) accountType = "company";

  let resolvedEmployee = employee;
  if (!resolvedEmployee && accountType === "employee" && options.createMissingEmployee === true) {
    resolvedEmployee = await ensureEmployeeProfileForUser(user, roleType === "employee" ? role : null);
  }

  return {
    accountType,
    roleType,
    role,
    employee: resolvedEmployee,
    company,
    companyState,
    isEmployee: accountType === "employee",
    isCompany: accountType === "company",
    availableAccounts: {
      employee: Boolean(resolvedEmployee?._id),
      company: Boolean(company?._id),
      company_state: companyState,
    },
  };
}
