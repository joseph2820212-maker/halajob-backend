import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel } from "../../../models/index.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const getLan = (req) => String(req.get("lan") || "en").toLowerCase();
const t = (lan, ar, en) => (lan === "ar" ? ar : en);

function buildPublicUrl(base, rel) {
  if (!rel) return null;
  if (/^https?:\/\//i.test(rel)) return rel;

  const cleaned = String(rel).replace(/^\/+/, "");
  if (!base) return cleaned;

  const cleanBase = String(base).replace(/\/+$/, "");
  return `${cleanBase}/${cleaned}`;
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

const requestStateMessage = (lan, state) => {
  const messages = {
    none: [
      "لم يتم إنشاء طلب شركة بعد",
      "A company request has not been created yet",
    ],
    draft: [
      "طلب الشركة غير مكتمل بعد",
      "Company request is not completed yet",
    ],
    pending: [
      "طلب الشركة قيد المراجعة",
      "Company request is under review",
    ],
    rejected: [
      "تم رفض طلب الشركة",
      "Company request was rejected",
    ],
    suspended: [
      "تم إيقاف حساب الشركة مؤقتًا",
      "Company account has been temporarily suspended",
    ],
    unknown: [
      "حالة حساب الشركة غير معروفة",
      "Unknown company account state",
    ],
  };

  const pair = messages[state] || messages.unknown;
  return t(lan, pair[0], pair[1]);
};

const serializeCompany = (company) => ({
  id: company._id,
  request_state: getCompanyRequestState(company),
  name: company.company_name || "",
  company_name: company.company_name || "",
  image: company?.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.image) : null,
  logo: company?.logo ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.logo) : null,
  cover_image: company?.cover_image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.cover_image) : null,
  company_email: company.company_email || "",
  created_year: company.created_year ?? null,
  description: company.description || "",
  company_size: company.company_size ?? null,
  company_size_type: company.company_size_type || "unknown",
  company_type: company.company_type || "",
  company_country: company.company_country || "",
  company_city: company.company_city || "",
  company_address: company.company_address || "",
  company_contact: Array.isArray(company.company_contact) ? company.company_contact : [],
  company_phone: company.company_phone || "",
  company_phone_code: company.company_phone_code || "",
  company_website: company.company_website || "",
  accepted: company.accepted === true,
  status: company.status === true,
  can_upload: company.can_upload === true,
  is_verified: company.is_verified === true,
  profile_completion: company.profile_completion ?? 0,
});

const fail = (res, lan, status, ar, en, data) =>
  ReturnAppData.getError({
    res,
    status,
    message: t(lan, ar, en),
    ...(data ? { data } : {}),
  });

const getApprovedCompanyOrError = async (req, res) => {
  const lan = getLan(req);
  const user = req.user;

  if (!user?._id) {
    ReturnAppData.getError({
      res,
      status: 401,
      message: t(lan, "غير مصرح", "Unauthorized"),
    });
    return null;
  }

  const company = await CompanyModel.findOne(buildCompanyOwnerQuery(user._id));
  const state = getCompanyRequestState(company);

  if (state !== "approved") {
    ReturnAppData.getError({
      res,
      status: state === "none" ? 404 : 403,
      message: requestStateMessage(lan, state),
      data: company
        ? {
            request_state: state,
            accepted: company.accepted === true,
            status: company.status === true,
            can_upload: company.can_upload === true,
          }
        : { request_state: "none" },
    });
    return null;
  }

  return company;
};

/**
 * GET /company
 * يرجع بيانات الشركة فقط إذا كانت approved.
 */
const get = async (req, res, next) => {
  try {
    const company = await getApprovedCompanyOrError(req, res);
    if (!company) return;

    return ReturnAppData.getData({
      res,
      data: serializeCompany(company),
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

/**
 * PATCH /company
 * تعديل بيانات شركة مقبولة فقط.
 */
const update = async (req, res, next) => {
  try {
    const lan = getLan(req);
    const company = await getApprovedCompanyOrError(req, res);
    if (!company) return;

    let {
      company_name,
      company_email,
      description,
      company_size,
      company_size_type,
      company_type,
      company_country,
      company_city,
      company_address,
      company_contact,
      company_phone,
      company_phone_code,
      company_website,
      created_year,
    } = req.body || {};

    const provided = (v) => v !== undefined && v !== null;
    const trimStr = (v) => (typeof v === "string" ? v.trim() : v);

    if (
      ![
        company_name,
        company_email,
        description,
        company_size,
        company_size_type,
        company_type,
        company_country,
        company_city,
        company_address,
        company_contact,
        company_phone,
        company_phone_code,
        company_website,
        created_year,
      ].some(provided)
    ) {
      return fail(
        res,
        lan,
        400,
        "يرجى إرسال حقل واحد على الأقل للتحديث",
        "Provide at least one field to update"
      );
    }

    company_name = trimStr(company_name);
    company_email =
      typeof company_email === "string" ? company_email.trim().toLowerCase() : company_email;
    description = trimStr(description);
    company_size_type = trimStr(company_size_type);
    company_type = trimStr(company_type);
    company_country = trimStr(company_country);
    company_city = trimStr(company_city);
    company_address = trimStr(company_address);
    company_phone = trimStr(company_phone);
    company_phone_code = trimStr(company_phone_code);
    company_website = trimStr(company_website);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneCodeRegex = /^\+\d{1,4}$/;
    const allowedCompanySizeTypes = new Set([
      "startup",
      "small",
      "medium",
      "large",
      "enterprise",
      "unknown",
    ]);

    if (provided(company_name)) {
      if (!company_name || company_name.length < 2 || company_name.length > 100) {
        return fail(
          res,
          lan,
          400,
          "اسم الشركة يجب أن يكون بين 2 و 100 حرف",
          "Company name must be 2-100 characters"
        );
      }

      const exists = await CompanyModel.findOne({
        company_name,
        _id: { $ne: company._id },
      }).collation({ locale: "en", strength: 2 });

      if (exists) {
        return fail(res, lan, 400, "اسم الشركة مستخدم بالفعل", "Company name already exists");
      }

      company.company_name = company_name;
    }

    if (provided(company_email)) {
      if (!emailRegex.test(company_email)) {
        return fail(res, lan, 400, "البريد الإلكتروني غير صالح", "Invalid email format");
      }

      const exists = await CompanyModel.findOne({
        company_email,
        _id: { $ne: company._id },
      }).collation({ locale: "en", strength: 2 });

      if (exists) {
        return fail(res, lan, 400, "البريد الإلكتروني مستخدم بالفعل", "Company email already exists");
      }

      company.company_email = company_email;
    }

    if (provided(description)) {
      if (typeof description !== "string" || description.length > 2000) {
        return fail(
          res,
          lan,
          400,
          "الوصف يجب أن يكون نصًا وبحد أقصى 2000 حرف",
          "Description must be a string up to 2000 characters"
        );
      }
      company.description = description;
    }

    if (provided(company_size)) {
      const n = Number(company_size);
      if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
        return fail(
          res,
          lan,
          400,
          "حجم الشركة يجب أن يكون عددًا صحيحًا بين 1 و 1,000,000",
          "company_size must be an integer between 1 and 1,000,000"
        );
      }
      company.company_size = n;
    }

    if (provided(company_size_type)) {
      if (!allowedCompanySizeTypes.has(company_size_type)) {
        return fail(
          res,
          lan,
          400,
          "نوع حجم الشركة غير صالح",
          "Invalid company_size_type"
        );
      }
      company.company_size_type = company_size_type;
    }

    if (provided(company_type)) {
      if (typeof company_type !== "string" || company_type.length > 150) {
        return fail(
          res,
          lan,
          400,
          "نوع الشركة يجب ألا يتجاوز 150 حرفًا",
          "company_type must not exceed 150 characters"
        );
      }
      company.company_type = company_type;
    }

    if (provided(company_country)) {
      if (typeof company_country !== "string" || company_country.length > 150) {
        return fail(
          res,
          lan,
          400,
          "الدولة يجب ألا تتجاوز 150 حرفًا",
          "company_country must not exceed 150 characters"
        );
      }
      company.company_country = company_country;
    }

    if (provided(company_city)) {
      if (typeof company_city !== "string" || company_city.length > 150) {
        return fail(
          res,
          lan,
          400,
          "المدينة يجب ألا تتجاوز 150 حرفًا",
          "company_city must not exceed 150 characters"
        );
      }
      company.company_city = company_city;
    }

    if (provided(company_address)) {
      if (typeof company_address !== "string" || company_address.length > 250) {
        return fail(
          res,
          lan,
          400,
          "العنوان يجب ألا يتجاوز 250 حرفًا",
          "company_address must not exceed 250 characters"
        );
      }
      company.company_address = company_address;
    }

    if (provided(company_phone_code)) {
      if (company_phone_code !== "" && !phoneCodeRegex.test(company_phone_code)) {
        return fail(
          res,
          lan,
          400,
          "كود الهاتف يجب أن يكون بصيغة +<رمز> مثل +963",
          "company_phone_code must be like +963"
        );
      }
      company.company_phone_code = company_phone_code;
    }

    if (provided(company_phone)) {
      if (typeof company_phone !== "string" || company_phone.length > 30) {
        return fail(
          res,
          lan,
          400,
          "رقم الهاتف غير صالح",
          "Invalid company phone"
        );
      }
      company.company_phone = company_phone;
    }

    if (provided(company_website)) {
      if (String(company_website).trim() === "") {
        company.company_website = "";
      } else {
        try {
          const url = new URL(company_website);
          if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
          company.company_website = url.toString().replace(/\/+$/, "");
        } catch {
          return fail(res, lan, 400, "رابط الموقع غير صالح", "Invalid website URL");
        }
      }
    }

    if (provided(company_contact)) {
      if (!Array.isArray(company_contact)) {
        return fail(
          res,
          lan,
          400,
          "جهات الاتصال يجب أن تكون مصفوفة نصوص",
          "company_contact must be an array of strings"
        );
      }

      const normalized = company_contact
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      if (normalized.length > 10 || normalized.some((item) => item.length > 200)) {
        return fail(res, lan, 400, "جهات الاتصال غير صالحة", "Invalid company_contact values");
      }

      company.company_contact = [...new Set(normalized)];
    }

    if (provided(created_year)) {
      if (created_year === "" || created_year === null) {
        company.created_year = null;
      } else {
        const year = Number(created_year);
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(year) || year < 1800 || year > currentYear) {
          return fail(res, lan, 400, "سنة التأسيس غير صالحة", "Invalid created_year");
        }
        company.created_year = year;
      }
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

const updateImage = async (req, res, next) => {
  const lan = getLan(req);

  try {
    const company = await getApprovedCompanyOrError(req, res);
    if (!company) return;

    const file = req.file;

    if (!file?.filename) {
      return fail(res, lan, 400, "الصورة غير موجودة.", "Image not found.");
    }

    const allowedMime = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    const allowedExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

    const ext = path.extname(file.originalname || file.filename).toLowerCase();
    if (!allowedMime.has(file.mimetype) || !allowedExt.has(ext)) {
      const tempPath = path.resolve(UPLOADS_DIR, path.basename(file.filename));
      if (existsSync(tempPath)) await fs.unlink(tempPath).catch(() => {});

      return fail(
        res,
        lan,
        400,
        "نوع ملف الصورة غير مسموح.",
        "Unsupported image type."
      );
    }

    if (company.image) {
      const oldName = path.basename(company.image);
      const oldPath = path.resolve(UPLOADS_DIR, oldName);
      if (existsSync(oldPath)) await fs.unlink(oldPath).catch(() => {});
    }

    company.image = path.basename(file.filename);
    await company.save();

    return ReturnAppData.getData({
      res,
      status: 200,
      data: {
        image: buildPublicUrl(process.env.PUBLIC_BASE_URL, company.image),
      },
      message: t(lan, "تم تحديث الصورة بنجاح.", "Image updated successfully."),
    });
  } catch (err) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: t(lan, "حدث خطأ غير متوقع.", "An unexpected error occurred."),
      meta: { error: err?.message },
    });
  }
};

export default { get, update, updateImage };
