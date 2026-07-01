import bcryptjs from "bcrypt";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import { RoleModel, UserModel } from "../../../models/index.js";
import { generatePasscode, hashPasscode } from "../../../services/passcodeHash.service.js";
import { burnBcryptCycles } from "../../../services/authTiming.service.js";
import { verifyUserFromRefreshTokenPayload } from "../../../services/authService.js";
import {
  clearRefreshToken,
  generateAuthTokens,
  rotateRefreshToken,
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
  const brandA = normStr(a.brand);
  const brandB = normStr(b.brand);
  const modelA = normStr(a.model_name);
  const modelB = normStr(b.model_name);
  const isDevA = !!a.is_device;
  const isDevB = !!b.is_device;

  if (!brandA || !modelA || !brandB || !modelB) return false;
  return brandA === brandB && modelA === modelB && isDevA === isDevB;
}

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;
  if (user.device && typeof user.device === "object") user.device = [user.device];
  else user.device = [];
}

function makeDefaultDevice(user, idx) {
  user.device = user.device.map((d, i) => ({ ...d, is_default: i === idx }));
}

// Shared 6-digit issuer; matches every other OTP-issuing controller.
const createPasscode = generatePasscode;

function buildUserDto(user) {
  return {
    id: user._id,
    first_name: user.first_name,
    mid_name: user.mid_name,
    last_name: user.last_name,
    full_name: [user.first_name, user.mid_name, user.last_name].filter(Boolean).join(" "),
    image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
    phone_code: user.phone_code,
    phone: user.phone_national,
    gender: user.gender,
  };
}

async function getUserRole(user) {
  return user.role_id ? await RoleModel.findById(user.role_id).lean() : null;
}

function buildRoleDto(role, user) {
  return role
    ? {
        id: role._id,
        name: role.name,
        title_ar: role.title_ar,
        title_en: role.title_en,
        permissions: user.permissions || [],
      }
    : null;
}

async function sendLoginPasscode(user) {
  const passcode = createPasscode();
  user.passcode = hashPasscode(passcode);
  user.passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendRecoveryEmail({ to: user.email, passcode });
}

async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);
  const role = await getUserRole(user);
  const employee = buildUserDto(user);

  // Important: this auth response must never return company data for employee login.
  // The mobile app should determine employee flow from `employee` + role.name === "employee".
  return {
    user: employee,
    role: buildRoleDto(role, user),
    employee,
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
      await burnBcryptCycles(password);
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

    const role = await getUserRole(user);
    const roleName = normStr(role?.name);

    // Employee login must go to passcode step and must not receive tokens/company from login.
    if (roleName === "employee") {
      await sendLoginPasscode(user);
      return ReturnAppData.createData({
        res,
        status: 202,
        data: {
          step: "ENTER_PASSCODE",
          user_type: "employee",
        },
        message: lan === "ar" ? "أرسلنا رمز تحقق إلى بريدك." : "We sent a verification code to your email.",
      });
    }

    // الحساب غير مفعل: أعد إرسال كود التفعيل ولا تعطي tokens.
    if (!user.status || user.passcode_active === false) {
      await sendLoginPasscode(user);
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
      if (incomingDevice.model_id) user.device[idx].model_id = incomingDevice.model_id;

      makeDefaultDevice(user, idx);

      user.another_device_code = undefined;
      user.another_device_expires_at = undefined;
      user.pending_device = undefined;
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
    user.another_device_code = hashPasscode(twofa);
    user.another_device_expires_at = new Date(Date.now() + 10 * 60 * 1000);
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
    const { tokenPayload, tokens } = await rotateRefreshToken(refreshToken);
    await verifyUserFromRefreshTokenPayload(tokenPayload);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: tokens,
    });
  } catch (error) {
    return next(error);
  }
};

export default { login, logout, refreshToken };
