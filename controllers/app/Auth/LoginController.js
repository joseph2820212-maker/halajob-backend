import bcryptjs from "bcryptjs";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import { UserModel } from "../../../models/index.js";
import { verifyUserFromRefreshTokenPayload } from "../../../services/authService.js";
import {
  clearRefreshToken,
  generateAccessTokenFromRefreshTokenPayload,
  verifyRefreshToken,
} from "../../../services/tokenService.js";

/** تطبيع السلاسل */
const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");

/** تطبيع الإيميل */
const normEmail = (e) => (e || "").trim().toLowerCase();

/** تحويل القيم “المشابهة للمنطقية” إلى Boolean */
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  return false;
};

/** مطابقة جهازين بشكل متسامح مع build_id ومتشدّد مع model_id عند توفره */
function isDeviceMatch(a = {}, b = {}) {
  const brandA = normStr(a.brand),
    brandB = normStr(b.brand);
  const modelA = normStr(a.model_name),
    modelB = normStr(b.model_name);
  const isDevA = !!a.is_device,
    isDevB = !!b.is_device;

  if (!brandA || !modelA) return false;
  if (brandA !== brandB || modelA !== modelB || isDevA !== isDevB) return false;

  const midA = normStr(a.model_id || "");
  const midB = normStr(b.model_id || "");
  if (midA && midB && midA !== midB) return false;

  return true; // لا نعتمد build_id كشرط رفض
}

const login = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const data = req.body || {};
    const { email, password, device = {} } = data;

    // تحقق أساسي
    if (!email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البريد وكلمة المرور مطلوبة." : "Email and password are required.",
      });
    }

    // تحقق الجهاز
    const hasBrand = typeof device.brand === "string" && device.brand.trim();
    const hasModel = typeof device.model_name === "string" && device.model_name.trim();
    const hasIsDevice = Object.prototype.hasOwnProperty.call(device, "is_device");

    if (!hasBrand || !hasModel || !hasIsDevice) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "بيانات الجهاز مفقودة." : "Device data is missing.",
      });
    }

    // جلب المستخدم
    let user = null;
    if (email.includes("@")) {
      user = await UserModel.findOne({ email: normEmail(email) });
    } else {
      user = await UserModel.findOne({ phone_national: email });
    }
    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    // تحقق كلمة المرور
    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    // ضمان مصفوفة الأجهزة
    if (!Array.isArray(user.device)) {
      user.device = user.device ? [user.device] : [];
    }

    // تجهيز الجهاز الوارد
    const incomingDevice = {
      brand: safeStr(device.brand),
      model_name: safeStr(device.model_name),
      model_id: typeof device.model_id === "string" ? safeStr(device.model_id) : null,
      is_device: toBool(device.is_device),
      build_id: typeof device.build_id === "string" ? safeStr(device.build_id) : null,
      is_default: false,
      last_seen_at: new Date(),
    };

    // التعرف على الجهاز
    const idx = user.device.findIndex((d) => isDeviceMatch(d, incomingDevice));
    const known = idx >= 0 ? user.device[idx] : null;

    if (known) {
      // جهاز معروف
      try {
        known.last_seen_at = new Date();

        if (incomingDevice.build_id && (!known.build_id || known.build_id !== incomingDevice.build_id)) {
          known.build_id = incomingDevice.build_id;
        }
        if (incomingDevice.model_id && !known.model_id) {
          known.model_id = incomingDevice.model_id;
        }

        user.markModified?.("device");
        await user.save();
      } catch (_) {
        // تجاهل أخطاء تحديث معلومات الجهاز
      }

      return ReturnAppData.createData({
        res,
        status: 200,
        data: { user_id: user._id, device_recognized: true },
        message: lan === "ar" ? "تم تسجيل الدخول بنجاح." : "Logged in successfully.",
      });
    }

    // جهاز جديد → أرسل كود تحقق 6 أرقام واحفظ الجهاز مؤقتًا فقط
    const twofa = Math.floor(100000 + Math.random() * 900000);
    const twofa_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    user.another_device_code = twofa;
    user.another_device_expires_at = twofa_expires_at;
    user.pending_device = incomingDevice;

    await user.save();

    await sendRecoveryEmail({ to: user.email, passcode: twofa });

    return ReturnAppData.createData({
      res,
      status: 202,
      data: { step: "VERIFY_NEW_DEVICE" },
      message:
        lan === "ar"
          ? "جهاز جديد تم رصده. أرسلنا رمز تحقق إلى بريدك. يرجى إدخاله لإكمال تسجيل الدخول."
          : "New device detected. We sent a verification code to your email. Enter it to complete sign-in.",
    });
  } catch (err) {
    console.error("login error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

const logout = async (req, res, next) => {
  const lan = req.get("lan") || "en";
  try {
    await clearRefreshToken(req.body.refreshToken);
    return ReturnAppData.createData({
      res,
      status: 200,
      message: lan === "ar" ? "تم تسجيل الخروج بنجاح." : "Successfully logged out.",
    });
  } catch (err) {
    console.error("logout error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshTokenPayload = await verifyRefreshToken(req.body.refreshToken);
    await verifyUserFromRefreshTokenPayload(refreshTokenPayload);
    const newAccessToken = await generateAccessTokenFromRefreshTokenPayload(refreshTokenPayload);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    return next(error);
  }
};

export default { login, logout, refreshToken };
