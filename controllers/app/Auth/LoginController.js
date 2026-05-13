import bcryptjs from "bcryptjs";
import crypto from "crypto";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import { CompanyModel, RoleModel, UserModel } from "../../../models/index.js";
import { verifyUserFromRefreshTokenPayload } from "../../../services/authService.js";
import {
  clearRefreshToken,
  generateAccessTokenFromRefreshTokenPayload,
  generateAuthTokens,
  verifyRefreshToken,
} from "../../../services/tokenService.js";

const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");
const normEmail = (e) => (e || "").trim().toLowerCase();

function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  return false;
};

function isDeviceMatch(a = {}, b = {}) {
  const brandA = normStr(a.brand), brandB = normStr(b.brand);
  const modelA = normStr(a.model_name), modelB = normStr(b.model_name);
  const isDevA = !!a.is_device, isDevB = !!b.is_device;
  if (!brandA || !modelA) return false;
  if (brandA !== brandB || modelA !== modelB || isDevA !== isDevB) return false;
  const midA = normStr(a.model_id || "");
  const midB = normStr(b.model_id || "");
  if (midA && midB && midA !== midB) return false;
  return true;
}

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;
  if (user.device && typeof user.device === "object") user.device = [user.device];
  else user.device = [];
}

function makeDefaultDevice(user, idx) {
  user.device = user.device.map((d, i) => ({ ...d, is_default: i === idx }));
}

function createPasscode() {
  return crypto.randomInt(10000, 100000);
}
async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);

  const role = user.role_id
    ? await RoleModel.findById(user.role_id).lean()
    : null;

  const company = await CompanyModel.findOne(
    { user_id: user._id, status: true },
    {
      _id: 1,
      company_name: 1,
      logo: 1,
      status: 1,
      accepted: 1,
    }
  ).lean();

  return {
    user: {
      id: user._id,
      first_name: user.first_name,
      mid_name: user.mid_name,
      last_name: user.last_name,
      full_name: [user.first_name, user.mid_name, user.last_name]
        .filter(Boolean)
        .join(" "),
      image: user.image
        ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image)
        : null,
      phone_code: user.phone_code,
      phone: user.phone_national,
      gender: user.gender,
    },

    role: role
      ? {
          id: role._id,
          name: role.name,
          title_ar: role.title_ar,
          title_en: role.title_en,
          permissions: user.permissions || [],
        }
      : null,

    company: company
      ? {
          id: company._id,
          company_name: company.company_name,
          logo: company.logo
            ? buildPublicUrl(process.env.PUBLIC_BASE_URL, company.logo)
            : null,
          status: company.status,
          accepted: company.accepted,
        }
      : null,

    tokens,
  };
}

const login = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const { email, password, device = {} } = req.body || {};

    if (!email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البريد وكلمة المرور مطلوبة." : "Email and password are required.",
      });
    }

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

    const identifier = String(email).trim();
    const user = identifier.includes("@")
      ? await UserModel.findOne({ email: normEmail(identifier) })
      : await UserModel.findOne({ phone_national: identifier });

    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    const ok = await bcryptjs.compare(String(password), user.password || "");
    if (!ok) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    const incomingDevice = {
      brand: safeStr(device.brand),
      model_name: safeStr(device.model_name),
      model_id: typeof device.model_id === "string" ? safeStr(device.model_id) : null,
      is_device: toBool(device.is_device),
      build_id: typeof device.build_id === "string" ? safeStr(device.build_id) : null,
      is_default: false,
      last_seen_at: new Date(),
    };

    // الحساب غير مفعل: أعد إرسال كود التفعيل ولا تعطي tokens.
    if (!user.status || user.passcode_active === false) {
      const passcode = createPasscode();
      user.passcode = passcode;
      user.passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendRecoveryEmail({ to: user.email, passcode });

      return ReturnAppData.createData({
        res,
        status: 202,
        data: { step: "ENTER_PASSCODE" },
        message:
          lan === "ar"
            ? "الحساب غير مفعل. أرسلنا رمز تحقق إلى بريدك."
            : "Account is not verified. We sent a verification code to your email.",
      });
    }

    ensureDeviceArray(user);
    const idx = user.device.findIndex((d) => isDeviceMatch(d, incomingDevice));

    if (idx >= 0) {
      user.device[idx].last_seen_at = new Date();
      if (incomingDevice.build_id) user.device[idx].build_id = incomingDevice.build_id;
      if (incomingDevice.model_id && !user.device[idx].model_id) user.device[idx].model_id = incomingDevice.model_id;
      makeDefaultDevice(user, idx);
      user.markModified?.("device");
      await user.save();

      return ReturnAppData.createData({
        res,
        status: 200,
        data: await buildAuthPayload(user, user.device[idx]),
        message: lan === "ar" ? "تم تسجيل الدخول بنجاح." : "Logged in successfully.",
      });
    }

    const twofa = createPasscode();
    const twofaExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.another_device_code = twofa;
    user.another_device_expires_at = twofaExpiresAt;
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
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "رمز التحديث مطلوب." : "Refresh token is required.",
      });
    }
    await clearRefreshToken(refreshToken);
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
  const lan = req.get("lan") || "en";
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "رمز التحديث مطلوب." : "Refresh token is required.",
      });
    }
    const refreshTokenPayload = await verifyRefreshToken(refreshToken);
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
