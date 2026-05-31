import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel } from "../../../models/index.js";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const getLan = (req) => String(req.get("lan") || "en").toLowerCase();
const t = (lan, ar, en) => (lan === "ar" ? ar : en);
const provided = (value) => value !== undefined && value !== null;
const trimStr = (value) => (typeof value === "string" ? value.trim() : value);
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneCodeRegex = /^\+\d{1,4}$/;
const e164Regex = /^\+[1-9]\d{7,14}$/;

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function buildPublicUrl(base, rel) {
  if (!rel) return null;
  const cleaned = String(rel).replace(/^\/+/, "");
  if (!base) return cleaned;
  const normalizedBase = String(base).replace(/\/+$/, "");
  return `${normalizedBase}/${cleaned}`;
}

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

const isCompanyApproved = (company) => getCompanyRequestState(company) === "approved";

const requestStateMessage = (lan, state) => {
  const messages = {
    none: ["لم يتم إنشاء حساب شركة بعد", "A company account has not been created yet"],
    draft: ["لم يتم إكمال طلب الشركة بعد", "The company request has not been completed yet"],
    pending: ["طلب الشركة قيد المراجعة", "The company request is under review"],
    rejected: ["تم رفض طلب الشركة، يمكنك تعديل البيانات وإعادة الإرسال", "The company request was rejected. You can update it and resubmit"],
    suspended: ["تم إيقاف حساب الشركة مؤقتًا", "The company account has been temporarily suspended"],
    unknown: ["حالة الشركة غير معروفة", "Unknown company state"],
  };

  const message = messages[state] || messages.unknown;
  return t(lan, message[0], message[1]);
};

const fail = (res, lan, status, ar, en) =>
  ReturnAppData.getError({
    res,
    status,
    message: t(lan, ar, en),
  });

const serializeCompany = (company) => {
  const requestState = getCompanyRequestState(company);
  const files = Array.isArray(company.files) ? company.files : [];

  return {
    id: company._id,
    request_state: requestState,
    can_access_dashboard: requestState === "approved",
    can_upload_files: requestState === "draft" || requestState === "rejected",
    can_update_profile: requestState === "approved",

    name: company.company_name || "",
    company_name: company.company_name || "",
    image: company.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.image) : null,
    company_email: company.company_email || "",
    created_year: company.created_year ?? null,
    description: company.description || "",
    company_size: company.company_size ?? null,
    company_type: company.company_type || "",
    company_country: company.company_country || "",
    company_address: company.company_address || "",
    company_contact: Array.isArray(company.company_contact) ? company.company_contact : [],
    company_phone: company.company_phone || "",
    company_phone_code: company.company_phone_code || "",
    company_website: company.company_website || "",
    show_on_all: company.show_on_all === true,

    files_count: files.length,
    accepted: company.accepted === true,
    status: company.status === true,
    can_upload: company.can_upload === true,
  };
};

const normalizePhone = ({ company_phone, company_phone_code }) => {
  const phoneCode = String(company_phone_code || "").trim();
  const phone = String(company_phone || "").trim().replace(/[\s-]/g, "");

  if (!phoneCodeRegex.test(phoneCode)) return null;
  if (phone.startsWith("+")) return e164Regex.test(phone) ? phone : null;

  const national = phone.replace(/^0+/, "");
  const fullPhone = `${phoneCode}${national}`;
  return e164Regex.test(fullPhone) ? fullPhone : null;
};

const validateAndNormalizeUpdatePayload = (payload, lan) => {
  if (provided(payload.company_name)) {
    payload.company_name = trimStr(payload.company_name);
    if (!payload.company_name || payload.company_name.length < 2 || payload.company_name.length > 100) {
      return { valid: false, message: t(lan, "اسم الشركة يجب أن يكون بين 2 و 100 حرف", "Company name must be 2-100 characters") };
    }
  }

  if (provided(payload.company_email)) {
    payload.company_email = normalizeEmail(payload.company_email);
    if (!emailRegex.test(payload.company_email)) {
      return { valid: false, message: t(lan, "البريد الإلكتروني غير صالح", "Invalid email format") };
    }
  }

  if (provided(payload.description)) {
    payload.description = trimStr(payload.description);
    if (typeof payload.description !== "string" || payload.description.length > 2000) {
      return { valid: false, message: t(lan, "الوصف يجب أن يكون نصًا وبحد أقصى 2000 حرف", "Description must be a string up to 2000 characters") };
    }
  }

  if (provided(payload.company_size)) {
    const n = Number(payload.company_size);
    if (!Number.isInteger(n) || n < 1 || n > 1000000) {
      return { valid: false, message: t(lan, "حجم الشركة يجب أن يكون عددًا صحيحًا بين 1 و 1,000,000", "company_size must be an integer between 1 and 1,000,000") };
    }
    payload.company_size = n;
  }

  if (provided(payload.created_year) && payload.created_year !== "") {
    const year = Number(payload.created_year);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1800 || year > currentYear) {
      return { valid: false, message: t(lan, "سنة تأسيس الشركة غير صالحة", "Invalid company creation year") };
    }
    payload.created_year = year;
  }

  for (const field of ["company_type", "company_country", "company_address", "company_phone_code", "company_website"]) {
    if (provided(payload[field])) payload[field] = trimStr(payload[field]);
  }

  if (provided(payload.company_type) && (payload.company_type.length < 2 || payload.company_type.length > 150)) {
    return { valid: false, message: t(lan, "نوع الشركة يجب أن يكون بين 2 و 150 حرفًا", "company_type must be 2-150 characters") };
  }

  if (provided(payload.company_country) && (payload.company_country.length < 2 || payload.company_country.length > 150)) {
    return { valid: false, message: t(lan, "الدولة يجب أن تكون بين 2 و 150 حرفًا", "company_country must be 2-150 characters") };
  }

  if (provided(payload.company_address) && (payload.company_address.length < 5 || payload.company_address.length > 250)) {
    return { valid: false, message: t(lan, "العنوان يجب أن يكون بين 5 و 250 حرفًا", "company_address must be 5-250 characters") };
  }

  if (provided(payload.company_phone) || provided(payload.company_phone_code)) {
    const normalizedPhone = normalizePhone(payload);
    if (!normalizedPhone) {
      return { valid: false, message: t(lan, "رقم الهاتف أو كود الدولة غير صالح", "Invalid company phone or phone code") };
    }
    payload.company_phone = normalizedPhone;
  }

  if (provided(payload.company_website) && String(payload.company_website).trim() !== "") {
    try {
      const url = new URL(payload.company_website);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
      payload.company_website = url.toString().replace(/\/+$/, "");
    } catch {
      return { valid: false, message: t(lan, "رابط الموقع غير صالح", "Invalid website URL") };
    }
  }

  if (provided(payload.company_contact)) {
    if (!Array.isArray(payload.company_contact)) {
      return { valid: false, message: t(lan, "جهات الاتصال يجب أن تكون مصفوفة", "company_contact must be an array") };
    }

    const normalizedContacts = payload.company_contact
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    if (normalizedContacts.length > 10 || normalizedContacts.some((item) => item.length > 200)) {
      return { valid: false, message: t(lan, "جهات الاتصال غير صالحة", "Invalid company_contact values") };
    }

    payload.company_contact = [...new Set(normalizedContacts)];
  }

  if (provided(payload.show_on_all) && typeof payload.show_on_all !== "boolean") {
    return { valid: false, message: t(lan, "قيمة show_on_all يجب أن تكون boolean", "show_on_all must be a boolean") };
  }

  return { valid: true };
};

const get = async (req, res) => {
  try {
    const user = req.user;
    const lan = getLan(req);

    const company = await CompanyModel.findOne({ user_id: user._id }).lean();
    if (!company) {
      return fail(res, lan, 404, "لم يتم إنشاء حساب شركة بعد", "A company account has not been created yet");
    }

    const requestState = getCompanyRequestState(company);
    return ReturnAppData.getData({
      res,
      data: {
        ...serializeCompany(company),
        message: requestState === "approved" ? null : requestStateMessage(lan, requestState),
      },
    });
  } catch (err) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: "Internal Server Error",
      meta: { error: err?.message },
    });
  }
};

const update = async (req, res) => {
  try {
    const user = req.user;
    const lan = getLan(req);

    const allowedFields = [
      "company_name",
      "company_email",
      "description",
      "company_size",
      "created_year",
      "company_type",
      "company_country",
      "company_address",
      "company_contact",
      "company_phone",
      "company_phone_code",
      "company_website",
      "show_on_all",
    ];

    const payload = Object.fromEntries(
      allowedFields
        .filter((field) => provided(req.body?.[field]))
        .map((field) => [field, req.body[field]])
    );

    if (!Object.keys(payload).length) {
      return fail(res, lan, 400, "يرجى إرسال حقل واحد على الأقل للتحديث", "Provide at least one field to update");
    }

    const company = await CompanyModel.findOne({ user_id: user._id });
    if (!company) {
      return fail(res, lan, 404, "لم يتم إنشاء حساب شركة بعد", "A company account has not been created yet");
    }

    if (!isCompanyApproved(company)) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: requestStateMessage(lan, getCompanyRequestState(company)),
      });
    }

    const validation = validateAndNormalizeUpdatePayload(payload, lan);
    if (!validation.valid) {
      return ReturnAppData.getError({ res, status: 400, message: validation.message });
    }

    if (provided(payload.company_email)) {
      const duplicateEmail = await CompanyModel.findOne({
        company_email: payload.company_email,
        _id: { $ne: company._id },
      }).collation({ locale: "en", strength: 2 });

      if (duplicateEmail) {
        return fail(res, lan, 400, "البريد الإلكتروني مستخدم بالفعل", "Company email already exists");
      }
    }

    if (provided(payload.company_name)) {
      const duplicateName = await CompanyModel.findOne({
        company_name: payload.company_name,
        _id: { $ne: company._id },
      }).collation({ locale: "en", strength: 2 });

      if (duplicateName) {
        return fail(res, lan, 400, "اسم الشركة مستخدم بالفعل", "Company name already exists");
      }
    }

    for (const [field, value] of Object.entries(payload)) {
      company[field] = value;
    }

    await company.save();

    return ReturnAppData.getData({
      res,
      status: 200,
      data: serializeCompany(company),
      message: t(lan, "تم التحديث بنجاح", "Updated successfully"),
    });
  } catch (err) {
    if (err?.code === 11000) {
      const lan = getLan(req);
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return ReturnAppData.getError({
        res,
        status: 400,
        message: t(lan, `القيمة مستخدمة بالفعل لحقل: ${field}`, `Duplicate value for field: ${field}`),
      });
    }

    return ReturnAppData.getError({
      res,
      status: 500,
      message: "Internal Server Error",
      meta: { error: err?.message },
    });
  }
};

const deleteUploadedImage = async (filename) => {
  if (!filename) return;
  const imagePath = path.resolve(UPLOADS_DIR, path.basename(filename));
  await fs.unlink(imagePath).catch((err) => {
    if (err?.code !== "ENOENT") throw err;
  });
};

const updateImage = async (req, res) => {
  const lan = getLan(req);

  try {
    const user = req.user;
    const file = req.file;

    if (!user?._id) {
      return fail(res, lan, 401, "غير مصرح", "Unauthorized");
    }

    if (!file?.filename) {
      return fail(res, lan, 400, "الصورة غير موجودة", "Image not found");
    }

    const ext = path.extname(file.originalname || file.filename).toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype) || !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      await deleteUploadedImage(file.filename);
      return fail(res, lan, 400, "نوع ملف الصورة غير مسموح", "Unsupported image type");
    }

    const company = await CompanyModel.findOne({ user_id: user._id });
    if (!company) {
      await deleteUploadedImage(file.filename);
      return fail(res, lan, 404, "لم يتم إنشاء حساب شركة بعد", "A company account has not been created yet");
    }

    if (!isCompanyApproved(company)) {
      await deleteUploadedImage(file.filename);
      return ReturnAppData.getError({
        res,
        status: 403,
        message: requestStateMessage(lan, getCompanyRequestState(company)),
      });
    }

    if (company.image) {
      await deleteUploadedImage(company.image);
    }

    company.image = path.basename(file.filename);
    await company.save();

    const imageUrl = buildPublicUrl(process.env.PUBLIC_BASE_URL, company.image);

    return ReturnAppData.getData({
      res,
      status: 200,
      data: { image: imageUrl },
      message: t(lan, "تم تحديث الصورة بنجاح", "Image updated successfully"),
    });
  } catch (err) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: t(lan, "حدث خطأ غير متوقع", "An unexpected error occurred"),
      meta: { error: err?.message },
    });
  }
};

export default { get, update, updateImage };
