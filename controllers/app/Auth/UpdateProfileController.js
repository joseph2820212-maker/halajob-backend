import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { UserModel, RefreshTokenModel } from "../../../models/index.js";
import bcryptjs from "bcryptjs";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to join base URL safely with a relative path
function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

// Ensure we only ever delete inside the uploads dir
function safeUploadsPath(relative) {
  const uploadsDir = path.resolve(__dirname, "../../../../uploads");
  const filename = path.basename(relative || ""); // strip any path traversal
  return {
    uploadsDir,
    abs: path.join(uploadsDir, filename),
    filename,
  };
}

export const updateImage = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const user = req.user;
    const file = req.file; // multer puts disk filename at file.filename

    if (!user || !user._id) {
      return ReturnAppData.createError({
        res,
        status: 401,
        message: lan === "ar" ? "غير مصرح." : "Unauthorized.",
      });
    }

    if (!file || !file.filename) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "الصورة غير موجودة." : "Image not found.",
      });
    }

    // Delete old image safely if present
    if (user.image) {
      const { abs, uploadsDir } = safeUploadsPath(user.image);
      if (abs.startsWith(uploadsDir) && fs.existsSync(abs)) {
        fs.unlinkSync(abs);
      }
    }

    // Save only the filename (recommended). Multer should have stored it under /uploads/<filename>
    const newFilename = file.filename;

    const updated = await UserModel.findByIdAndUpdate(
      user._id,
      { image: newFilename },
      { new: true, select: "_id image first_name last_name" }
    ).lean();

    const imageUrl = buildPublicUrl(process.env.PUBLIC_BASE_URL, updated.image);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: { image: imageUrl },
      message: lan === "ar" ? "تم تحديث الصورة بنجاح." : "Image updated successfully.",
    });
  } catch (err) {
    console.error("updateImage error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};


const strongPasswordRe =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normEmail = (e) => (e || "").trim().toLowerCase();
const safeStr   = (v) => (typeof v === "string" ? v.trim() : "");

function normalizeCode(code = "") {
  const c = String(code).trim();
  if (!c) return "";
  return c.startsWith("+") ? c : `+${c}`;
}

 const updateProfile = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    if (!req.user || !req.user._id) {
      return ReturnAppData.createError({
        res,
        status: 401,
        message: lan === "ar" ? "غير مصرح." : "Unauthorized.",
      });
    }

    const {
      first_name,
      last_name,
      mid_name,
      phone_code,
      phone_number,
      email,
      password,
    } = req.body || {};

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "المستخدم غير موجود." : "User not found.",
      });
    }

    let revokeAllSessions = false;

    // --------- names ---------
    if (first_name !== undefined) {
      if (typeof first_name !== "string" || safeStr(first_name).length < 2) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar" ? "الاسم الأول غير صالح." : "Invalid first name.",
        });
      }
      user.first_name = safeStr(first_name);
    }

    if (last_name !== undefined) {
      if (typeof last_name !== "string" || safeStr(last_name).length < 2) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar" ? "اسم العائلة غير صالح." : "Invalid last name.",
        });
      }
      user.last_name = safeStr(last_name);
    }

    if (mid_name !== undefined) {
      if (typeof mid_name !== "string") {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar" ? "الاسم الأوسط غير صالح." : "Invalid middle name.",
        });
      }
      user.mid_name = safeStr(mid_name); // ممكن يكون فارغ
    }

    // --------- phone (must come as a pair) ---------
    const hasPhoneUpdate = phone_code !== undefined || phone_number !== undefined;
    if (hasPhoneUpdate) {
      if (!phone_code || !phone_number) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar"
            ? "رقم الهاتف ورمز الاتصال مطلوبان معاً."
            : "Both phone number and calling code are required.",
        });
      }

      const code = normalizeCode(phone_code);
      const nationalDigits = String(phone_number).replace(/\D/g, ""); // فقط أرقام
      const raw = `${code}${nationalDigits}`; // مثال: +9665xxxxxxx

      const phoneParsed = parsePhoneNumberFromString(raw);
      if (!phoneParsed || !phoneParsed.isValid()) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar"
            ? "رقم الهاتف أو رمز الاتصال غير صحيح."
            : "Invalid phone number or calling code.",
        });
      }

      // تأكد أن رمز الاتصال يطابق الرقم
      const inputDigits = code.replace(/\D/g, "");
      if (phoneParsed.countryCallingCode !== inputDigits) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar"
            ? "رمز الاتصال لا يطابق الرقم."
            : "Calling code does not match the number.",
        });
      }

      // تحقق عدم التكرار لرقم الهاتف الوطني
      const phone_national = phoneParsed.nationalNumber;
      const existsPhone = await UserModel.exists({
        _id: { $ne: user._id },
        phone_national,
      });
      if (existsPhone) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar"
            ? "رقم الهاتف مستخدم من قبل."
            : "Phone number is already in use.",
        });
      }

      user.phone_code = `+${phoneParsed.countryCallingCode}`;
      user.phone_national = phone_national;
      user.phone_country = phoneParsed.country || null;
      user.phone_e164 = phoneParsed.number; // مثل: +9665xxxxxxx
    }

    // --------- email ---------
    if (email !== undefined) {
      const newEmail = normEmail(email);
      if (!emailRe.test(newEmail)) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar" ? "البريد الإلكتروني غير صالح." : "Invalid email address.",
        });
      }
      if (newEmail !== user.email) {
        const exists = await UserModel.exists({
          _id: { $ne: user._id },
          email: newEmail,
        });
        if (exists) {
          return ReturnAppData.createError({
            res, status: 400,
            message: lan === "ar"
              ? "البريد الإلكتروني مستخدم من قبل."
              : "Email is already in use.",
          });
        }
        user.email = newEmail;
        revokeAllSessions = true; // عند تغيير الإيميل سجّل خروج من الكل
        // يمكن أيضاً وضع email_verified=false هنا إن رغبت بإعادة التحقق
      }
    }

    // --------- password ---------
    if (password !== undefined) {
      if (!strongPasswordRe.test(String(password))) {
        return ReturnAppData.createError({
          res, status: 400,
          message: lan === "ar"
            ? "كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص."
            : "Weak password. Must be 8+ chars with uppercase, lowercase, number, and special char.",
        });
      }
      user.password = await bcryptjs.hash(String(password), 10);
      revokeAllSessions = true; // عند تغيير كلمة المرور سجّل خروج من الكل
    }

    await user.save();

    if (revokeAllSessions) {
      await RefreshTokenModel.deleteMany({ userRef: user._id });
    }

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        user_id: user._id,
        first_name: user.first_name,
        mid_name: user.mid_name,
        last_name: user.last_name,
        email: user.email,
        phone_code: user.phone_code,
        image:user.image?buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image):null,
        phone_national: user.phone_national,
        phone_country: user.phone_country,
        phone_e164: user.phone_e164,
        require_relogin: revokeAllSessions, // للعميل كي يعرف ينقل المستخدم لشاشة تسجيل الدخول
      },
      message: revokeAllSessions
        ? (lan === "ar"
            ? "تم تحديث البيانات. تم تسجيل خروجك من جميع الأجهزة بسبب تغيير البريد أو كلمة المرور."
            : "Profile updated. You have been signed out on all devices due to email/password change.")
        : (lan === "ar" ? "تم تحديث البيانات بنجاح." : "Profile updated successfully."),
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { updateImage,updateProfile};
