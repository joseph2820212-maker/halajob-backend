import { CompanyModel, RoleModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const DOCS_DIR = "files";
const DEFAULT_DIR = "";
const MAX_FILES = 10;

const ALLOWED_FILE_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const REQUIRED_JOIN_FIELDS = [
  "company_name",
  "company_email",
  "description",
  "company_size",
  "company_type",
  "company_country",
  "company_address",
  "company_phone",
  "company_phone_code",
];

const getLan = (req) => String(req.get("lan") || "en").toLowerCase();
const t = (lan, ar, en) => (lan === "ar" ? ar : en);
const provided = (value) => value !== undefined && value !== null;
const trimStr = (value) => (typeof value === "string" ? value.trim() : value);
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneCodeRegex = /^\+\d{1,4}$/;
const e164Regex = /^\+[1-9]\d{7,14}$/;

const getDirForFilename = (filename = "") => {
  const ext = path.extname(filename).toLowerCase();
  return [".pdf", ".doc", ".docx"].includes(ext) ? DOCS_DIR : DEFAULT_DIR;
};

const buildFilePath = (filename) => {
  const safe = path.basename(filename || "");
  const dir = getDirForFilename(safe);
  return path.join(UPLOADS_ROOT, dir, safe);
};

const buildPublicUrl = (filename) => {
  const safe = path.basename(filename || "");
  const dir = getDirForFilename(safe);
  const relativePath = dir ? `${dir}/${safe}` : safe;
  const base = (process.env.FILE_BASE_URL || process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return base ? `${base}/${relativePath}` : relativePath;
};

const deleteUploadedFile = async (filename) => {
  if (!filename) return;
  const filePath = buildFilePath(filename);
  if (existsSync(filePath)) {
    await fs.unlink(filePath).catch(() => {});
  }
};

const getCompanyRequestState = (company) => {
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
};

const canEditRequestFiles = (company) => {
  const state = getCompanyRequestState(company);
  return state === "none" || state === "draft" || state === "rejected";
};

const fail = (res, lan, status, ar, en) =>
  ReturnAppData.createError({
    res,
    status,
    message: t(lan, ar, en),
  });

const validateUploadedFile = (file) => {
  if (!file?.filename) {
    return { valid: false, ar: "لم يتم ارسال أي ملف", en: "No file sent" };
  }

  const ext = path.extname(file.originalname || file.filename).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.has(ext) || !ALLOWED_FILE_MIME_TYPES.has(file.mimetype)) {
    return {
      valid: false,
      ar: "نوع الملف غير مسموح. المسموح: PDF, DOC, DOCX, PNG, JPG, WEBP",
      en: "Unsupported file type. Allowed: PDF, DOC, DOCX, PNG, JPG, WEBP",
    };
  }

  return { valid: true };
};

const normalizePhone = ({ company_phone, company_phone_code }) => {
  const phoneCode = String(company_phone_code || "").trim();
  const phone = String(company_phone || "").trim().replace(/[\s-]/g, "");

  if (!phoneCodeRegex.test(phoneCode)) return null;

  if (phone.startsWith("+")) {
    return e164Regex.test(phone) ? phone : null;
  }

  const national = phone.replace(/^0+/, "");
  const fullPhone = `${phoneCode}${national}`;
  return e164Regex.test(fullPhone) ? fullPhone : null;
};

const normalizeJoinPayload = (body = {}) => {
  const payload = {
    company_name: trimStr(body.company_name),
    company_email: normalizeEmail(body.company_email),
    description: trimStr(body.description),
    company_size: body.company_size,
    company_type: trimStr(body.company_type),
    company_country: trimStr(body.company_country),
    company_address: trimStr(body.company_address),
    company_phone: trimStr(body.company_phone),
    company_phone_code: trimStr(body.company_phone_code),
    company_website: trimStr(body.company_website),
    company_contact: body.company_contact,
    created_year: body.created_year,
  };

  return payload;
};

const validateJoinPayload = (payload, lan) => {
  const missing = REQUIRED_JOIN_FIELDS.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length) {
    return {
      valid: false,
      status: 400,
      message: t(
        lan,
        `الحقول التالية مطلوبة: ${missing.join(", ")}`,
        `Missing required fields: ${missing.join(", ")}`
      ),
    };
  }

  if (payload.company_name.length < 2 || payload.company_name.length > 100) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "اسم الشركة يجب أن يكون بين 2 و 100 حرف", "Company name must be 2-100 characters"),
    };
  }

  if (!emailRegex.test(payload.company_email)) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "البريد الإلكتروني غير صالح", "Invalid email format"),
    };
  }

  if (payload.description.length < 20 || payload.description.length > 2000) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "وصف الشركة يجب أن يكون بين 20 و 2000 حرف", "Description must be 20-2000 characters"),
    };
  }

  const companySize = Number(payload.company_size);
  if (!Number.isInteger(companySize) || companySize < 1 || companySize > 1000000) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "حجم الشركة يجب أن يكون عددًا صحيحًا بين 1 و 1,000,000", "company_size must be an integer between 1 and 1,000,000"),
    };
  }
  payload.company_size = companySize;

  if (payload.company_type.length < 2 || payload.company_type.length > 150) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "نوع الشركة يجب أن يكون بين 2 و 150 حرفًا", "company_type must be 2-150 characters"),
    };
  }

  if (payload.company_country.length < 2 || payload.company_country.length > 150) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "الدولة يجب أن تكون بين 2 و 150 حرفًا", "company_country must be 2-150 characters"),
    };
  }

  if (payload.company_address.length < 5 || payload.company_address.length > 250) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "العنوان يجب أن يكون بين 5 و 250 حرفًا", "company_address must be 5-250 characters"),
    };
  }

  const normalizedPhone = normalizePhone(payload);
  if (!normalizedPhone) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "رقم الهاتف أو كود الدولة غير صالح", "Invalid company phone or phone code"),
    };
  }
  payload.company_phone = normalizedPhone;

  if (provided(payload.company_website) && String(payload.company_website).trim() !== "") {
    try {
      const url = new URL(payload.company_website);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
      payload.company_website = url.toString().replace(/\/+$/, "");
    } catch {
      return {
        valid: false,
        status: 400,
        message: t(lan, "رابط الموقع غير صالح", "Invalid website URL"),
      };
    }
  } else {
    payload.company_website = "";
  }

  if (provided(payload.created_year) && payload.created_year !== "") {
    const year = Number(payload.created_year);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1800 || year > currentYear) {
      return {
        valid: false,
        status: 400,
        message: t(lan, "سنة تأسيس الشركة غير صالحة", "Invalid company creation year"),
      };
    }
    payload.created_year = year;
  }

  if (provided(payload.company_contact)) {
    if (!Array.isArray(payload.company_contact)) {
      return {
        valid: false,
        status: 400,
        message: t(lan, "جهات الاتصال يجب أن تكون مصفوفة", "company_contact must be an array"),
      };
    }

    const normalizedContacts = payload.company_contact
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    if (normalizedContacts.length > 10 || normalizedContacts.some((item) => item.length > 200)) {
      return {
        valid: false,
        status: 400,
        message: t(lan, "جهات الاتصال غير صالحة", "Invalid company_contact values"),
      };
    }

    payload.company_contact = [...new Set(normalizedContacts)];
  } else {
    payload.company_contact = [];
  }

  return { valid: true };
};

const ensureCompanyRole = async () => {
  const role =
    (await RoleModel.findOne({ role_number: 3, log_to: "company" })) ||
    (await RoleModel.findOne({ role_number: 3 }));

  return role;
};

const applyJoinPayloadToCompany = (company, payload) => {
  company.company_name = payload.company_name;
  company.company_email = payload.company_email;
  company.description = payload.description;
  company.company_size = payload.company_size;
  company.company_type = payload.company_type;
  company.company_country = payload.company_country;
  company.company_address = payload.company_address;
  company.company_phone = payload.company_phone;
  company.company_phone_code = payload.company_phone_code;
  company.company_website = payload.company_website;
  company.company_contact = payload.company_contact;
  if (provided(payload.created_year) && payload.created_year !== "") {
    company.created_year = payload.created_year;
  }
};

const serializeCompanyRequest = (company) => ({
  id: company._id,
  request_state: getCompanyRequestState(company),
  can_upload: company.can_upload === true,
  accepted: company.accepted === true,
  status: company.status === true,
  company_name: company.company_name || "",
  company_email: company.company_email || "",
  files_count: Array.isArray(company.files) ? company.files.length : 0,
});

const joinRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);

    if (!user?._id) {
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    const payload = normalizeJoinPayload(req.body || {});
    const validation = validateJoinPayload(payload, lan);
    if (!validation.valid) {
      return ReturnAppData.createError({ res, status: validation.status, message: validation.message });
    }

    let company = await CompanyModel.findOne({ user_id: user._id });
    const state = getCompanyRequestState(company);

    if (["pending", "approved", "suspended"].includes(state)) {
      const messages = {
        pending: ["طلب الشركة قيد المراجعة ولا يمكن تعديله الآن", "Company request is under review and cannot be changed now"],
        approved: ["حساب الشركة مقبول بالفعل", "Company account is already approved"],
        suspended: ["حساب الشركة موقوف مؤقتًا", "Company account is temporarily suspended"],
      };
      return fail(res, lan, 403, messages[state][0], messages[state][1]);
    }

    const duplicateName = await CompanyModel.findOne({
      company_name: payload.company_name,
      ...(company?._id ? { _id: { $ne: company._id } } : {}),
    }).collation({ locale: "en", strength: 2 });

    if (duplicateName) {
      return fail(res, lan, 400, "اسم الشركة مستخدم بالفعل", "Company name already exists");
    }

    const duplicateEmail = await CompanyModel.findOne({
      company_email: payload.company_email,
      ...(company?._id ? { _id: { $ne: company._id } } : {}),
    }).collation({ locale: "en", strength: 2 });

    if (duplicateEmail) {
      return fail(res, lan, 400, "البريد الإلكتروني مستخدم بالفعل", "Company email already exists");
    }

    if (!company) {
      const role = await ensureCompanyRole();
      if (!role?._id) {
        return fail(res, lan, 500, "لم يتم العثور على دور الشركة", "Company role was not found");
      }

      company = await CompanyModel.create({
        user_id: user._id,
        role_id: role._id,
        status: false,
        accepted: false,
        can_upload: true,
        files: [],
      });
    }

    if (!company.role_id) {
      const role = await ensureCompanyRole();
      if (role?._id) company.role_id = role._id;
    }

    applyJoinPayloadToCompany(company, payload);

    const files = Array.isArray(company.files) ? company.files : [];
    if (files.length < 1) {
      company.status = false;
      company.accepted = false;
      company.can_upload = true;
      await company.save();

      return ReturnAppData.createError({
        res,
        status: 400,
        message: t(lan, "أكمل بيانات الشركة، ثم ارفع ملف إثبات واحد على الأقل قبل إرسال الطلب", "Complete the company data, then upload at least one verification file before submitting the request"),
        data: serializeCompanyRequest(company),
      });
    }

    company.status = false;
    company.accepted = false;
    company.can_upload = false;
    await company.save();

    return ReturnAppData.createData({
      res,
      status: 201,
      data: serializeCompanyRequest(company),
      message: t(lan, "تم إرسال طلب الشركة بنجاح، يرجى انتظار موافقة الإدارة", "Company request submitted successfully. Please wait for admin approval"),
    });
  } catch (err) {
    next(err);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const file = req.file;

    const fileValidation = validateUploadedFile(file);
    if (!fileValidation.valid) {
      if (file?.filename) await deleteUploadedFile(file.filename);
      return fail(res, lan, 400, fileValidation.ar, fileValidation.en);
    }

    let company = await CompanyModel.findOne({ user_id: user._id });
    const state = getCompanyRequestState(company);

    if (["pending", "approved", "suspended"].includes(state)) {
      await deleteUploadedFile(file.filename);
      return fail(
        res,
        lan,
        403,
        "لا يمكن تعديل ملفات الشركة في هذه المرحلة",
        "Company files cannot be changed at this stage"
      );
    }

    if (!company) {
      const role = await ensureCompanyRole();
      if (!role?._id) {
        await deleteUploadedFile(file.filename);
        return fail(res, lan, 500, "لم يتم العثور على دور الشركة", "Company role was not found");
      }

      company = await CompanyModel.create({
        user_id: user._id,
        role_id: role._id,
        status: false,
        accepted: false,
        can_upload: true,
        files: [],
      });
    }

    if (!canEditRequestFiles(company)) {
      await deleteUploadedFile(file.filename);
      return fail(res, lan, 403, "لا يمكن تعديل ملفات الشركة الآن", "Company files cannot be changed now");
    }

    const files = Array.isArray(company.files) ? company.files : [];
    if (files.length >= MAX_FILES) {
      await deleteUploadedFile(file.filename);
      return fail(res, lan, 400, "لا يمكن رفع أكثر من 10 ملفات", "You cannot upload more than 10 files");
    }

    company.status = false;
    company.accepted = false;
    company.can_upload = true;
    company.files = [...files, path.basename(file.filename)];
    await company.save();

    return ReturnAppData.createData({
      res,
      status: 201,
      data: {
        request_state: getCompanyRequestState(company),
        filename: path.basename(file.filename),
        url: buildPublicUrl(file.filename),
        files_count: company.files.length,
      },
      message: t(lan, "تم إضافة الملف بنجاح", "The file was added successfully"),
    });
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const filename = path.basename(req.params?.filename || req.query?.filename || req.body?.filename || "");

    if (!filename) {
      return fail(res, lan, 400, "اسم الملف مفقود", "Filename is required");
    }

    const company = await CompanyModel.findOne({ user_id: user._id });
    if (!company) {
      return fail(res, lan, 404, "الحساب غير موجود", "Company not found");
    }

    if (!canEditRequestFiles(company)) {
      return fail(res, lan, 403, "لا يمكن حذف الملفات في هذه المرحلة", "Files cannot be deleted at this stage");
    }

    const files = Array.isArray(company.files) ? company.files : [];
    if (!files.includes(filename)) {
      return fail(res, lan, 404, "الملف غير موجود", "File not found");
    }

    await deleteUploadedFile(filename);
    company.files = files.filter((item) => item !== filename);
    company.status = false;
    company.accepted = false;
    company.can_upload = true;
    await company.save();

    return ReturnAppData.createData({
      res,
      data: {
        request_state: getCompanyRequestState(company),
        files_count: company.files.length,
      },
      message: t(lan, "تم حذف الملف", "File deleted"),
    });
  } catch (err) {
    next(err);
  }
};

const getFileLinks = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const company = await CompanyModel.findOne({ user_id: user._id }).lean();

    if (!company) {
      return fail(res, lan, 404, "الحساب غير موجود", "Company not found");
    }

    const files = Array.isArray(company.files) ? company.files : [];
    const links = files.map((name) => ({
      filename: name,
      url: buildPublicUrl(name),
    }));

    return ReturnAppData.createData({
      res,
      data: {
        request_state: getCompanyRequestState(company),
        can_edit_files: canEditRequestFiles(company),
        files: links,
      },
      message: t(lan, "تم جلب الروابط", "Links fetched"),
    });
  } catch (err) {
    next(err);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const filename = path.basename(req.params?.filename || req.query?.filename || "");

    if (!filename) {
      return fail(res, lan, 400, "اسم الملف مفقود", "Filename is required");
    }

    const company = await CompanyModel.findOne({ user_id: user._id }).lean();
    const files = Array.isArray(company?.files) ? company.files : [];
    if (!company || !files.includes(filename)) {
      return fail(res, lan, 404, "الملف غير موجود", "File not found");
    }

    const filePath = buildFilePath(filename);
    if (!existsSync(filePath)) {
      return fail(res, lan, 404, "الملف غير موجود على الخادم", "File not found on server");
    }

    return res.download(filePath, filename, (err) => {
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};

export default {
  joinRequest,
  uploadFile,
  deleteFile,
  getFileLinks,
  downloadFile,
};
