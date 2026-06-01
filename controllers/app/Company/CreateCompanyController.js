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

const getLan = (req) => String(req.get("lan") || "en").toLowerCase();
const t = (lan, ar, en) => (lan === "ar" ? ar : en);

const fail = (res, lan, status, ar, en, extra = {}) =>
  ReturnAppData.createError({
    res,
    status,
    message: t(lan, ar, en),
    ...extra,
  });

const success = (res, lan, status, ar, en, data = {}) =>
  ReturnAppData.createData({
    res,
    status,
    message: t(lan, ar, en),
    data,
  });

const trimStr = (value) => (typeof value === "string" ? value.trim() : value);
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // الطلب محفوظ كمسودة، ويمكن رفع/حذف ملفات وتعديل الاسم/الإيميل.
  if (!accepted && !active && canUpload) return "draft";

  // تم إرسال الطلب للإدارة، ولا يمكن تعديله.
  if (!accepted && !active && !canUpload) return "pending";

  // منطق الرفض الحالي حسب الحقول المتاحة في الموديل.
  // في لوحة الإدارة عند الرفض اجعل:
  // accepted=false, status=true, can_upload=true
  if (!accepted && active) return "rejected";

  return "unknown";
};

const canEditCompanyRequest = (company) => {
  const state = getCompanyRequestState(company);
  return state === "none" || state === "draft" || state === "rejected";
};

const ensureCompanyRole = async () => {
  return (
    (await RoleModel.findOne({ role_number: 3, log_to: "company" })) ||
    (await RoleModel.findOne({ role_number: 3 }))
  );
};

const validateJoinPayload = (body = {}, lan) => {
  const company_name = trimStr(body.company_name);
  const company_email = normalizeEmail(body.company_email);

  if (!company_name || !company_email) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "هنالك بعض البيانات المفقودة", "There's some missing data."),
    };
  }

  if (company_name.length < 2 || company_name.length > 100) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "اسم الشركة يجب أن يكون بين 2 و 100 حرف", "Company name must be 2-100 characters"),
    };
  }

  if (!emailRegex.test(company_email)) {
    return {
      valid: false,
      status: 400,
      message: t(lan, "البريد الإلكتروني غير صالح", "Invalid email format"),
    };
  }

  return {
    valid: true,
    payload: {
      company_name,
      company_email,
    },
  };
};

const validateUploadedFile = (file) => {
  if (!file?.filename) {
    return {
      valid: false,
      ar: "لم يتم ارسال أي ملف",
      en: "No file sent",
    };
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

const serializeCompanyRequest = (company) => ({
  id: company?._id,
  request_state: getCompanyRequestState(company),
  can_upload: company?.can_upload === true,
  accepted: company?.accepted === true,
  status: company?.status === true,
  company_name: company?.company_name || "",
  company_email: company?.company_email || "",
  files_count: Array.isArray(company?.files) ? company.files.length : 0,
  files: Array.isArray(company?.files)
    ? company.files.map((filename) => ({
        filename,
        url: buildPublicUrl(filename),
      }))
    : [],
});

/**
 * POST /company/join-request
 *
 * المطلوب فقط:
 * {
 *   "company_name": "...",
 *   "company_email": "..."
 * }
 *
 * ملاحظة مهمة:
 * CompanyModel الحالي يجعل company_name/company_email/owner_user_id حقول required.
 * لذلك لا يجوز أن يقوم uploadFile بإنشاء شركة فارغة قبل joinRequest.
 *
 * التدفق الصحيح:
 * 1) joinRequest يحفظ الاسم والإيميل كـ draft إذا لا توجد ملفات.
 * 2) uploadFile يضيف الملف على نفس الشركة.
 * 3) joinRequest مرة ثانية يرسل الطلب للإدارة ويصبح pending.
 */
const joinRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);

    if (!user?._id) {
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    const validation = validateJoinPayload(req.body || {}, lan);
    if (!validation.valid) {
      return ReturnAppData.createError({
        res,
        status: validation.status,
        message: validation.message,
      });
    }

    const { company_name, company_email } = validation.payload;

    let company = await CompanyModel.findOne(buildCompanyOwnerQuery(user._id));
    const currentState = getCompanyRequestState(company);

    if (["pending", "approved", "suspended"].includes(currentState)) {
      const messages = {
        pending: [
          "طلب الشركة قيد المراجعة ولا يمكن تعديله الآن",
          "Company request is under review and cannot be changed now",
        ],
        approved: [
          "حساب الشركة مقبول بالفعل",
          "Company account is already approved",
        ],
        suspended: [
          "حساب الشركة موقوف مؤقتًا",
          "Company account is temporarily suspended",
        ],
      };

      return fail(res, lan, 403, messages[currentState][0], messages[currentState][1], {
        data: serializeCompanyRequest(company),
      });
    }

    const duplicateName = await CompanyModel.findOne({
      company_name,
      ...(company?._id ? { _id: { $ne: company._id } } : {}),
    }).collation({ locale: "en", strength: 2 });

    if (duplicateName) {
      return fail(res, lan, 400, "اسم الشركة مستخدم بالفعل", "Company name already exists");
    }

    const duplicateEmail = await CompanyModel.findOne({
      company_email,
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
        owner_user_id: user._id,
        role_id: role._id,
        company_name,
        company_email,
        status: false,
        accepted: false,
        can_upload: true,
        files: [],
      });
    } else {
      company.company_name = company_name;
      company.company_email = company_email;

      if (!company.role_id) {
        const role = await ensureCompanyRole();
        if (role?._id) company.role_id = role._id;
      }

      // عند تعديل طلب مرفوض نعيده لمسودة قابلة للرفع قبل الإرسال.
      company.status = false;
      company.accepted = false;
      company.can_upload = true;

      await company.save();
    }

    const files = Array.isArray(company.files) ? company.files : [];

    if (files.length < 1) {
      company.status = false;
      company.accepted = false;
      company.can_upload = true;
      await company.save();

      return success(
        res,
        lan,
        200,
        "تم حفظ بيانات الشركة، يرجى رفع ملف واحد على الأقل ثم إرسال الطلب",
        "Company data saved. Please upload at least one file, then submit the request",
        serializeCompanyRequest(company)
      );
    }

    // يوجد ملف واحد على الأقل، إذن أرسل الطلب للإدارة.
    company.status = false;
    company.accepted = false;
    company.can_upload = false;
    await company.save();

    return success(
      res,
      lan,
      201,
      "تم إرسال طلب الشركة بنجاح، يرجى انتظار موافقة الإدارة",
      "Company request submitted successfully. Please wait for admin approval",
      serializeCompanyRequest(company)
    );
  } catch (err) {
    if (err?.code === 11000) {
      const lan = getLan(req);
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return fail(
        res,
        lan,
        400,
        `القيمة مستخدمة بالفعل لحقل: ${field}`,
        `Duplicate value for field: ${field}`
      );
    }

    next(err);
  }
};

/**
 * POST /company/upload-file
 *
 * لا ينشئ شركة فارغة.
 * يجب تنفيذ joinRequest أولًا لأنه ينشئ الشركة بالحقول المطلوبة في الموديل.
 */
const uploadFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const file = req.file;

    if (!user?._id) {
      if (file?.filename) await deleteUploadedFile(file.filename);
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    const fileValidation = validateUploadedFile(file);
    if (!fileValidation.valid) {
      if (file?.filename) await deleteUploadedFile(file.filename);
      return fail(res, lan, 400, fileValidation.ar, fileValidation.en);
    }

    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(user._id));

    if (!company) {
      await deleteUploadedFile(file.filename);
      return fail(
        res,
        lan,
        400,
        "يجب إرسال اسم الشركة والبريد الإلكتروني أولًا قبل رفع الملفات",
        "You must send company name and email before uploading files"
      );
    }

    if (!canEditCompanyRequest(company)) {
      await deleteUploadedFile(file.filename);
      return fail(
        res,
        lan,
        403,
        "لا يمكن تعديل ملفات الشركة في هذه المرحلة",
        "Company files cannot be changed at this stage"
      );
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

    return success(
      res,
      lan,
      201,
      "تم إضافة الملف بنجاح",
      "The file was added successfully",
      serializeCompanyRequest(company)
    );
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const filename = path.basename(req.params?.filename || req.query?.filename || req.body?.filename || "");

    if (!user?._id) {
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    if (!filename) {
      return fail(res, lan, 400, "اسم الملف مفقود", "Filename is required");
    }

    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(user._id));
    if (!company) {
      return fail(res, lan, 404, "الحساب غير موجود", "Company not found");
    }

    if (!canEditCompanyRequest(company)) {
      return fail(
        res,
        lan,
        403,
        "لا يمكن حذف الملفات في هذه المرحلة",
        "Files cannot be deleted at this stage"
      );
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

    return success(
      res,
      lan,
      200,
      "تم حذف الملف",
      "File deleted",
      serializeCompanyRequest(company)
    );
  } catch (err) {
    next(err);
  }
};

const getFileLinks = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);

    if (!user?._id) {
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(user._id)).lean();
    if (!company) {
      return fail(res, lan, 404, "الحساب غير موجود", "Company not found");
    }

    return success(
      res,
      lan,
      200,
      "تم جلب الروابط",
      "Links fetched",
      {
        ...serializeCompanyRequest(company),
        can_edit_files: canEditCompanyRequest(company),
      }
    );
  } catch (err) {
    next(err);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const filename = path.basename(req.params?.filename || req.query?.filename || "");

    if (!user?._id) {
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    if (!filename) {
      return fail(res, lan, 400, "اسم الملف مفقود", "Filename is required");
    }

    const company = await CompanyModel.findOne(buildCompanyOwnerQuery(user._id)).lean();
    const files = Array.isArray(company?.files) ? company.files : [];

    if (!company || !files.includes(filename)) {
      return fail(res, lan, 404, "الملف غير موجود", "File not found");
    }

    const filePath = buildFilePath(filename);
    if (!existsSync(filePath)) {
      return fail(
        res,
        lan,
        404,
        "الملف غير موجود على الخادم",
        "File not found on server"
      );
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
