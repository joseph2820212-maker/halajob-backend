import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel } from "../../../models/index.js";
import fs from 'fs';
import path from "path";
/**
 * GET /company
 * Returns the company if the account is usable; otherwise returns a localized reason.
 */
const get = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = (req.get("lan") || "en").toLowerCase();

    const company = await CompanyModel.findOne({ user_id: user._id }).lean();
    if (!company) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message:
          lan === "ar"
            ? "لم يتم انشاء حساب شركة بعد"
            : "A company account has not been created yet",
      });
    }

    // Normalize boolean flags to avoid undefined traps
    const canUpload = company.can_upload === true;
    const accepted = company.accepted === true;
    const active = company.status === true;

    // Blocked states (order matters, make these mutually exclusive and clear)
    if (!canUpload) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message:
          lan === "ar"
            ? "لم يتم اكمال الطلب بعد"
            : "The application has not been completed yet",
      });
    }

    if (!accepted && active !== true) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message:
          lan === "ar"
            ? "لم يتم الموافقة على الطلب بعد"
            : "The application has not yet been approved",
      });
    }

    if (company.accepted === false) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: lan === "ar" ? "تم رفض الطلب" : "The application was rejected",
      });
    }

    if (accepted && !active) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message:
          lan === "ar"
            ? "تم ايقاف الحساب بشكل مؤقت"
            : "The account has been temporarily suspended",
      });
    }

    return ReturnAppData.getData({ res, data: company });
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
 * Allows updating company_name / company_email for active & accepted accounts.
 */
const update = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = (req.get("lan") || "en").toLowerCase();

    // Gather payload
    let {
      company_name,
      company_email,
      description,
      company_size,
      company_type,
      company_country,
      company_address,
      company_contact,
      company_phone,
      company_phone_code,
      company_website,
      show_on_all,
    } = req.body || {};

    // Fetch active & accepted company
    const company = await CompanyModel.findOne({
      user_id: user._id,
      status: true,
      accepted: true,
    });

    if (!company) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message:
          lan === "ar" ? "لا يمكن اكمال الطلب" : "The application cannot be completed",
      });
    }

    // Helper: check provided (not undefined/null)
    const provided = v => v !== undefined && v !== null;

    // Require at least one field to update
    if (
      ![
        company_name, company_email, description, company_size, company_type,
        company_country, company_address, company_contact, company_phone,
        company_phone_code, company_website, show_on_all
      ].some(provided)
    ) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "يرجى إرسال حقل واحد على الأقل للتحديث"
            : "Provide at least one field to update",
      });
    }

    // Normalize basic strings
    const trimStr = v => (typeof v === "string" ? v.trim() : v);
    company_name       = trimStr(company_name);
    company_email      = typeof company_email === "string" ? company_email.trim().toLowerCase() : company_email;
    description        = trimStr(description);
    company_type       = trimStr(company_type);
    company_country    = trimStr(company_country);
    company_address    = trimStr(company_address);
    company_phone      = trimStr(company_phone);
    company_phone_code = trimStr(company_phone_code);
    company_website    = trimStr(company_website);

    // === Validation rules ===
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const e164Phone  = /^\+[1-9]\d{7,14}$/; // E.164: + and 8–15 digits total
    const phoneCode  = /^\+\d{1,4}$/;
    const isEmail    = v => emailRegex.test(v);
    const isPhone    = v => e164Phone.test(v);

    const fail = (ar, en, statusCode = 400) =>
      ReturnAppData.getError({
        res,
        status: statusCode,
        message: lan === "ar" ? ar : en,
      });

    // company_email (optional)
    if (provided(company_email)) {
      if (!emailRegex.test(company_email)) {
        return fail("البريد الإلكتروني غير صالح", "Invalid email format");
      }
      const existingCompanyByEmail = await CompanyModel.findOne({
        company_email: company_email,
        _id: { $ne: company._id },
      }).collation({ locale: "en", strength: 2 });
      if (existingCompanyByEmail) {
        return fail("البريد الإلكتروني مستخدم بالفعل", "Company email already exists");
      }
    }

    // company_name (optional)
    if (provided(company_name)) {
      if (!company_name || company_name.length < 2 || company_name.length > 100) {
        return fail("اسم الشركة يجب أن يكون بين 2 و 100 حرف", "Company name must be 2–100 characters");
      }
      const existingCompanyByName = await CompanyModel.findOne({
        company_name: company_name,
        _id: { $ne: company._id },
      }).collation({ locale: "en", strength: 2 });
      if (existingCompanyByName) {
        return fail("اسم الشركة مستخدم بالفعل", "Company name already exists");
      }
    }

    // description (optional)
    if (provided(description)) {
      if (typeof description !== "string" || description.length > 1000) {
        return fail("الوصف يجب أن يكون نصًا وبحد أقصى 1000 حرف", "Description must be a string up to 1000 chars");
      }
    }

    // company_size (optional)
    if (provided(company_size)) {
      const n = Number(company_size);
      if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
        return fail("حجم الشركة يجب أن يكون عددًا صحيحًا بين 1 و 1,000,000", "company_size must be an integer between 1 and 1,000,000");
      }
      company_size = n;
    }

    // company_type (optional)
    if (provided(company_type)) {
      if (typeof company_type !== "string" || company_type.length < 2 || company_type.length > 150) {
        return fail("نوع الشركة يجب أن يكون نصًا بين 2 و 150 حرفًا", "company_type must be 2–150 characters");
      }
    }

    // company_country (optional)
    if (provided(company_country)) {
      if (typeof company_country !== "string" || company_country.length < 2 || company_country.length > 150) {
        return fail("الدولة يجب أن تكون نصًا بين 2 و 150 حرفًا", "company_country must be 2–150 characters");
      }
    }

    // company_address (optional)
    if (provided(company_address)) {
      if (typeof company_address !== "string" || company_address.length < 5 || company_address.length > 200) {
        return fail("العنوان يجب أن يكون نصًا بين 5 و 200 حرف", "company_address must be 5–200 characters");
      }
    }
    // company_contact (optional) -> array of strings: each email OR E.164 phone
    if (provided(company_contact)) {
      if (!Array.isArray(company_contact)) {
       console.log('====================================');
       console.log(company_contact);
       console.log('====================================');
        return fail("جهات الاتصال يجب أن تكون مصفوفة نصوص", "company_contact must be an array of strings");
      }
      const badIndex = company_contact.findIndex(item => {
        const v = trimStr(item || "");
        return typeof v !== "string" || v.length === 0 || (!isEmail(v) && !isPhone(v));
      });
 
      // normalize entries (trim/lowercase emails)
      company_contact = company_contact.map(item => {
        const v = trimStr(item || "");
        return isEmail(v) ? v.toLowerCase() : v; // phones already normalized by regex
      });
    }

    // company_phone (optional)
    if (provided(company_phone)) {
      if (!isPhone(company_phone)) {
        return fail("رقم الهاتف يجب أن يكون بصيغة E.164 مثل +201234567890", "company_phone must be E.164 like +201234567890");
      }
    }

    // company_phone_code (optional)
    if (provided(company_phone_code)) {
      if (!phoneCode.test(company_phone_code)) {
        return fail("كود الهاتف يجب أن يكون بصيغة +<رمز> مثل +20", "company_phone_code must be like +20");
      }
    }

    // company_website (optional)
    if (provided(company_website)) {
      try {
        const url = new URL(company_website);
        if (!/^https?:$/.test(url.protocol)) {
          return fail("يجب أن يبدأ الموقع بـ http أو https", "Website must start with http or https");
        }
        // Normalize: remove trailing slash
        company_website = url.toString().replace(/\/+$/, "");
      } catch {
        return fail("رابط الموقع غير صالح", "Invalid website URL");
      }
    }

    // status (optional)
    if (provided(show_on_all)) {
      if (typeof show_on_all !== "boolean") {
        return fail("قيمة الحالة يجب أن تكون منطقية (Boolean)", "show on all must be a boolean");
      }
    }

    // === Apply updates (only provided fields) ===
    if (provided(company_name))        company.company_name = company_name;
    if (provided(company_email))       company.company_email = company_email;
    if (provided(description))         company.description = description;
    if (provided(company_size))        company.company_size = company_size;
    if (provided(company_type))        company.company_type = company_type;
    if (provided(company_country))     company.company_country = company_country;
    if (provided(company_address))     company.company_address = company_address;
    if (provided(company_contact))     company.company_contact = company_contact;
    if (provided(company_phone))       company.company_phone = company_phone;
    if (provided(company_phone_code))  company.company_phone_code = company_phone_code;
    if (provided(company_website))     company.company_website = company_website;
    if (provided(show_on_all))              company.show_on_all = show_on_all;

    await company.save();

    return ReturnAppData.getData({
      res,
      status: 200,
      data: {
        _id: company._id,
        company_name: company.company_name,
        company_email: company.company_email,
        description: company.description,
        company_size: company.company_size,
        company_type: company.company_type,
        company_country: company.company_country,
        company_address: company.company_address,
        company_contact: company.company_contact,
        company_phone: company.company_phone,
        company_phone_code: company.company_phone_code,
        company_website: company.company_website,
        show_on_all: company.show_on_all,
      },
      message: lan === "ar" ? "تم التحديث بنجاح" : "Updated successfully",
    });
  } catch (err) {
   console.log('====================================');
   console.log(err);
   console.log('====================================');
    if (err?.code === 11000) {
      const lan = (req.get("lan") || "en").toLowerCase();
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return ReturnAppData.getError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? `القيمة مستخدمة بالفعل لحقل: ${field}`
            : `Duplicate value for field: ${field}`,
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

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads"); // e.g. /app/uploads

function buildPublicUrl(base, filename) {
  // base: e.g. https://api.example.com
  // Result: https://api.example.com/uploads/<filename>
  const cleanBase = (base || "").replace(/\/+$/, "");
  const cleanFile = (filename || "").replace(/^\/+/, "");
  return `${cleanBase}/uploads/${cleanFile}`;
}

const updateImage = async (req, res, next) => {
  const lan = (req.get("lan") || "en").toLowerCase();

  try {
    const user = req.user;
    const file = req.file; // set by multer

    if (!user?. _id) {
      return ReturnAppData.getError({
        res,
        status: 401,
        message: lan === "ar" ? "غير مصرح." : "Unauthorized.",
      });
    }

    if (!file?.filename) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: lan === "ar" ? "الصورة غير موجودة." : "Image not found.",
      });
    }

    // Basic MIME & extension allowlist (tweak as needed)
    const allowedMime = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    const allowedExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

    const ext = path.extname(file.originalname || file.filename).toLowerCase();
    if (!allowedMime.has(file.mimetype) || !allowedExt.has(ext)) {
      // If you want to reject and also delete the just-uploaded temp file:
      try {
        const tempPath = path.resolve(UPLOADS_DIR, path.basename(file.filename));
        await fs.unlink(tempPath);
      } catch (_) {}
      return ReturnAppData.getError({
        res,
        status: 400,
        message:
          lan === "ar" ? "نوع ملف الصورة غير مسموح." : "Unsupported image type.",
      });
    }

    const company = await CompanyModel.findOne({
      user_id: user._id,
      status: true,
      accepted: true,
    });

    if (!company) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message:
          lan === "ar" ? "لا يمكن اكمال الطلب" : "The application cannot be completed",
      });
    }

    // Delete old image if present—safely within uploads/
    if (company.image) {
      const oldName = path.basename(company.image); // neutralize traversal
      const oldPath = path.resolve(UPLOADS_DIR, oldName);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        // Ignore missing file; surface anything else
        if (err?.code !== "ENOENT") throw err;
      }
    }

    // Save only the filename we control (multer should already place the file in UPLOADS_DIR)
    const newFilename = path.basename(file.filename); // neutralize traversal

    // Persist on the doc
    company.image = newFilename;
    await company.save();

    const imageUrl = buildPublicUrl(process.env.PUBLIC_BASE_URL, newFilename);

    return ReturnAppData.getData({
      res,
      status: 200,
      data: { image: imageUrl },
      message:
        lan === "ar" ? "تم تحديث الصورة بنجاح." : "Image updated successfully.",
    });
  } catch (err) {
    console.error("updateImage error:", err);
    return ReturnAppData.getError({
      res,
      status: 500,
      message:
        lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
      meta: { error: err?.message },
    });
  }
};
export default { get, update,updateImage };
