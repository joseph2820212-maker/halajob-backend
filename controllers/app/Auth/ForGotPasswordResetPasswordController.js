import { RefreshTokenModel, UserModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { generateAuthTokens } from "../../../services/tokenService.js";
import {
  buildRoleDto,
  buildUserDto,
  resolveAppAccount,
  serializeCompany,
  serializeEmployee,
} from "../../../services/appAccount.service.js";
import bcryptjs from "bcrypt";
import { setRefreshCookie, webAuthScope } from "../../../services/authCookie.service.js";

const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");
const normEmail = (e) => (e || "").trim().toLowerCase();
function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}
const toBool = (v) =>
  typeof v === "boolean"
    ? v
    : typeof v === "number"
    ? v !== 0
    : ["true", "1", "yes", "y"].includes(String(v).trim().toLowerCase());

function isDeviceMatch(a = {}, b = {}) {
  const brandA = normStr(a.brand), brandB = normStr(b.brand);
  const modelA = normStr(a.model_name), modelB = normStr(b.model_name);
  const isDevA = !!a.is_device, isDevB = !!b.is_device;

  // Important: do NOT use build_id/model_id as hard identity keys.
  // They can change after OS/app updates and would make the same phone look like a new device.
  if (!brandA || !modelA || !brandB || !modelB) return false;
  return brandA === brandB && modelA === modelB && isDevA === isDevB;
}

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;
  if (user.device && typeof user.device === "object") user.device = [user.device];
  else user.device = [];
}

function addOrUpdateDevice(user, dev, { makeDefault = true } = {}) {
  ensureDeviceArray(user);
  const idx = user.device.findIndex((d) => isDeviceMatch(d, dev));
  if (idx >= 0) {
    const existing = user.device[idx];
    if (dev.build_id) existing.build_id = dev.build_id;
    if (dev.model_id && !existing.model_id) existing.model_id = dev.model_id;
    existing.last_seen_at = new Date();
    if (makeDefault) user.device = user.device.map((d, i) => ({ ...d, is_default: i === idx }));
    return { inserted: false, index: idx };
  } else {
    if (makeDefault) user.device = user.device.map((d) => ({ ...d, is_default: false }));
    user.device.push({
      brand: dev.brand,
      model_name: dev.model_name,
      model_id: dev.model_id ?? null,
      is_device: !!dev.is_device,
      build_id: dev.build_id ?? null,
      is_default: !!makeDefault,
      last_seen_at: new Date(),
    });
    return { inserted: true, index: user.device.length - 1 };
  }
}

const strongPasswordRe =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const resetPassword = async (req, res, next) => {
  const lan = req.get("lan") || "en";
  try {
    const { email, password, device } = req.body || {};

    if (!email || !password || !device) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar"
          ? "البريد الإلكتروني وكلمة المرور  والجهاز مطلوبة."
          : "Email, password,  and device are required.",
      });
    }

    const hasBrand = typeof device.brand === "string" && device.brand.trim();
    const hasModel = typeof device.model_name === "string" && device.model_name.trim();
    const hasIsDevice = Object.prototype.hasOwnProperty.call(device, "is_device");

    if (!hasBrand || !hasModel || !hasIsDevice) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar" ? "بيانات الجهاز مفقودة." : "Device data is missing.",
      });
    }

    if (!strongPasswordRe.test(password)) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar"
          ? "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، حرف كبير واحد، حرف صغير واحد، رقم واحد، وحرف خاص واحد."
          : "Password must be 8+ chars with 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
      });
    }

    // Fetch user who completed OTP verification recently.
    const user = email.includes("@")
      ? await UserModel.findOne({ email: normEmail(email), can_update_password: true })
      : await UserModel.findOne({ phone_national: email, can_update_password: true });

    if (!user) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    if (!user.passcode_expires_at || new Date() >= new Date(user.passcode_expires_at)) {
      user.can_update_password = false;
      user.passcode_expires_at = undefined;
      await user.save();

      return ReturnAppData.createError({
        res,
        status: 403,
        message: lan === "ar" ? "انتهت صلاحية جلسة استعادة كلمة المرور." : "Password reset session has expired.",
      });
    }

    // Hash & set the new password
    user.password = await bcryptjs.hash(password, 10);

    // Clear passcode state and disable further resets until requested again
    user.passcode = undefined;
    user.passcode_expires_at = undefined;
    user.can_update_password = false;

    // If there was a pending device (2FA flow), clear it now
    user.another_device_code = undefined;
    user.another_device_expires_at = undefined;
    user.pending_device = undefined;

    // Add/update the device and make it default
    const incomingDevice = {
      brand: safeStr(device.brand),
      model_name: safeStr(device.model_name),
      model_id: typeof device.model_id === "string" ? safeStr(device.model_id) : null,
      is_device: toBool(device.is_device),
      build_id: typeof device.build_id === "string" ? safeStr(device.build_id) : null,
      is_default: true,
      last_seen_at: new Date(),
    };
    const result = addOrUpdateDevice(user, incomingDevice, { makeDefault: true });

    // Persist changes
    await user.save();

    // Revoke all old refresh tokens
    await RefreshTokenModel.deleteMany({ userRef: user._id });

    // Issue fresh tokens
    const tokens = await generateAuthTokens(user, incomingDevice);
    setRefreshCookie(req, res, tokens.refreshToken, webAuthScope(req, "seeker"));

    const account = await resolveAppAccount(user, { createMissingEmployee: true });
    const userDto = buildUserDto(user);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        user: userDto,
        user_id: user._id,
        first_name: user.first_name,
        mid_name: user.mid_name,
        last_name: user.last_name,
        image:user.image?buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image):null,
        phone_code: user.phone_code,
        phone: user.phone_national,
        gender: user.gender,
        role: buildRoleDto(account.role, user),
        accountType: account.accountType,
        user_type: account.accountType,
        employee: account.accountType === "employee" ? serializeEmployee(account.employee) : null,
        company: account.accountType === "company" ? serializeCompany(account.company) : null,
        available_accounts: account.availableAccounts,
        tokens,
      },
      message:
        lan === "ar"
          ? result.inserted
            ? "تم تحديث كلمة المرور واعتماد الجهاز."
            : "تم تحديث كلمة المرور وتحديث معلومات الجهاز."
          : result.inserted
          ? "Password updated and device added."
          : "Password updated and device info refreshed.",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return ReturnAppData.createError({
      res, status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { resetPassword };
