import bcryptjs from "bcryptjs";
import crypto from "crypto";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import { UserModel } from "../../../models/index.js";
import {
  buildRoleDto,
  buildUserDto,
  resolveAppAccount,
  serializeCompany,
  serializeEmployee,
} from "../../../services/appAccount.service.js";
import { verifyUserFromRefreshTokenPayload } from "../../../services/authService.js";
import {
  clearRefreshToken,
  generateAuthTokens,
  rotateRefreshToken,
} from "../../../services/tokenService.js";

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
  if (typeof v === "string") {
    return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  }
  return false;
};

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;
  if (user.device && typeof user.device === "object") user.device = [user.device];
  else user.device = [];
}

function createPasscode() {
  return crypto.randomInt(10000, 100000);
}

async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);
  const account = await resolveAppAccount(user, {
    // لا ننشئ بروفايل موظف إلا عندما يكون الحساب موظفًا فعلاً.
    createMissingEmployee: true,
  });

  const userDto = buildUserDto(user);
  const employee = account.accountType === "employee" ? serializeEmployee(account.employee) : null;
  const company = account.accountType === "company" ? serializeCompany(account.company) : null;

  return {
    user: userDto,
    role: buildRoleDto(account.role, user),
    accountType: account.accountType,
    user_type: account.accountType,
    employee,
    company,
    available_accounts: account.availableAccounts,
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
        message:
          lan === "ar"
            ? "البريد وكلمة المرور مطلوبة."
            : "Email and password are required.",
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
        message:
          lan === "ar"
            ? "البيانات المرسلة غير صحيحة."
            : "The data sent is incorrect.",
      });
    }

    const ok = await bcryptjs.compare(String(password), user.password || "");

    if (!ok) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "البيانات المرسلة غير صحيحة."
            : "The data sent is incorrect.",
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

    const passcode = createPasscode();

    user.another_device_code = passcode;
    user.another_device_expires_at = new Date(Date.now() + 10 * 60 * 1000);
    user.pending_device = incomingDevice;

    if (!user.status || user.passcode_active === false) {
      user.passcode = passcode;
      user.passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
    }

    await user.save();

    await sendRecoveryEmail({
      to: user.email,
      passcode,
    });

    return ReturnAppData.createData({
      res,
      status: 202,
      data: {
        step: "ENTER_PASSCODE",
      },
      message:
        lan === "ar"
          ? "أرسلنا رمز تحقق إلى بريدك."
          : "We sent a verification code to your email.",
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

export default {
  login,
  logout,
  refreshToken,
};
