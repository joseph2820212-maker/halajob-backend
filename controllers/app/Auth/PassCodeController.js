import { UserModel } from "../../../models/index.js";
import {
  buildRoleDto,
  buildUserDto,
  resolveAppAccount,
  serializeCompany,
  serializeEmployee,
} from "../../../services/appAccount.service.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { generateAuthTokens } from "../../../services/tokenService.js";
import { syncAccountContextsForUser } from "../../../services/accountContext.service.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";
import { setRefreshCookie, webAuthScope } from "../../../services/authCookie.service.js";

const MAX_PASSCODE_ATTEMPTS = 5;

const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");
const normEmail = (e) => (e || "").trim().toLowerCase();
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
    existing.build_id = dev.build_id ?? existing.build_id ?? null;
    existing.model_id = dev.model_id ?? existing.model_id ?? null;
    existing.last_seen_at = new Date();
    if (makeDefault) user.device = user.device.map((d, i) => ({ ...d, is_default: i === idx }));
    return { inserted: false, updated: true, index: idx };
  }

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
  return { inserted: true, updated: false, index: user.device.length - 1 };
}

async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);
  const account = await resolveAppAccount(user, {
    createMissingEmployee: true,
  });

  const userDto = buildUserDto(user);
  const employee = account.accountType === "employee" ? serializeEmployee(account.employee) : null;
  const company = account.accountType === "company" ? serializeCompany(account.company) : null;
  const accountContexts = await syncAccountContextsForUser(user);

  return {
    user: userDto,
    role: buildRoleDto(account.role, user),
    accountType: account.accountType,
    user_type: account.accountType,
    employee,
    company,
    available_accounts: account.availableAccounts,
    contexts: accountContexts.contexts,
    active_context: accountContexts.activeContext,
    permissions: accountContexts.activeContext?.permissions || [],
    tokens,
  };
}

export const passcodeVerify = async (req, res, next) => {
  const lan = req.get("lan") || "en";
  try {
    const { email, passcode, device } = req.body || {};
    if (!email || !passcode) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البريد والرمز مطلوبان." : "Email and code are required.",
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

    const now = new Date();

    // Brute-force lockout: too many wrong attempts while a code is still valid.
    const codeStillValid =
      (user.passcode_expires_at && now < new Date(user.passcode_expires_at)) ||
      (user.another_device_expires_at &&
        now < new Date(user.another_device_expires_at));
    if ((user.passcode_attempts || 0) >= MAX_PASSCODE_ATTEMPTS && codeStillValid) {
      return ReturnAppData.createError({
        res,
        status: 429,
        message:
          lan === "ar"
            ? "محاولات كثيرة غير صحيحة. اطلب رمزًا جديدًا."
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    const passcodeValid =
      user.passcode &&
      String(user.passcode) === String(passcode).trim() &&
      user.passcode_expires_at &&
      now < new Date(user.passcode_expires_at);

    const deviceCodeValid =
      user.another_device_code &&
      String(user.another_device_code) === String(passcode).trim() &&
      user.another_device_expires_at &&
      now < new Date(user.another_device_expires_at);

    const incomingDevice = device
      ? {
          brand: safeStr(device.brand),
          model_name: safeStr(device.model_name),
          model_id: typeof device.model_id === "string" ? safeStr(device.model_id) : null,
          is_device: toBool(device.is_device),
          build_id: typeof device.build_id === "string" ? safeStr(device.build_id) : null,
          is_default: false,
          last_seen_at: new Date(),
        }
      : null;

    if (deviceCodeValid) {
      const dev = user.pending_device || incomingDevice;
      if (!dev) {
        return ReturnAppData.createError({
          res,
          status: 409,
          message: lan === "ar" ? "لا يوجد جهاز قيد التحقق." : "No device pending verification.",
        });
      }

      const result = addOrUpdateDevice(user, dev, { makeDefault: true });
      user.another_device_code = undefined;
      user.another_device_expires_at = undefined;
      user.pending_device = undefined;
      user.passcode_attempts = 0;
      user.markModified?.("device");
      user.last_login_at = new Date();
      await user.save();
      const authPayload = await buildAuthPayload(user, dev);
      setRefreshCookie(req, res, authPayload.tokens?.refreshToken, webAuthScope(req, "seeker"));
      recordAnalyticsEvent({
        req,
        event: "login_completed",
        userId: user._id,
        activeContext: authPayload.active_context,
        entityType: "other",
        metadata: {
          source: "device_verification",
          device_inserted: result.inserted,
        },
      }).catch(() => null);

      return ReturnAppData.createData({
        res,
        status: 200,
        data: authPayload,
        message:
          lan === "ar"
            ? result.inserted
              ? "تم اعتماد الجهاز وإضافته."
              : "تم تحديث معلومات الجهاز."
            : result.inserted
            ? "Device verified and added."
            : "Device information updated.",
      });
    }

    if (passcodeValid) {
      const wasSignupCompletion = user.status !== true || user.passcode_active !== true;
      user.passcode_active = true;
      user.status = true;
      user.passcode = undefined;
      user.passcode_expires_at = undefined;
      user.passcode_attempts = 0;

      let dev = incomingDevice;
      if (incomingDevice?.brand && incomingDevice?.model_name) {
        addOrUpdateDevice(user, incomingDevice, { makeDefault: true });
      } else {
        ensureDeviceArray(user);
        dev = user.device.find((d) => d.is_default) || user.device[0] || null;
      }

      user.markModified?.("device");
      user.last_login_at = new Date();
      await user.save();
      const authPayload = await buildAuthPayload(user, dev);
      setRefreshCookie(req, res, authPayload.tokens?.refreshToken, webAuthScope(req, "seeker"));
      if (wasSignupCompletion) {
        recordAnalyticsEvent({
          req,
          event: "signup_completed",
          userId: user._id,
          activeContext: authPayload.active_context,
          entityType: "other",
          metadata: { source: "passcode_activation" },
        }).catch(() => null);
      }
      recordAnalyticsEvent({
        req,
        event: "login_completed",
        userId: user._id,
        activeContext: authPayload.active_context,
        entityType: "other",
        metadata: {
          source: wasSignupCompletion ? "signup_passcode" : "login_passcode",
        },
      }).catch(() => null);

      return ReturnAppData.createData({
        res,
        status: 200,
        data: authPayload,
        message: lan === "ar" ? "تم تسجيل الدخول" : "Logged in",
      });
    }

    // Wrong/expired code: count the failed attempt toward the lockout threshold.
    user.passcode_attempts = (user.passcode_attempts || 0) + 1;
    try {
      await user.save();
    } catch (_) {}

    return ReturnAppData.createError({
      res,
      status: 400,
      message: lan === "ar" ? "رمز غير صحيح أو منتهي الصلاحية." : "Invalid or expired code.",
    });
  } catch (err) {
    console.error("passcodeVerify error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message:
        err.message === "EMPLOYEE_ROLE_NOT_FOUND"
          ? lan === "ar"
            ? "تعذر تحديد صلاحية الموظف."
            : "Unable to resolve employee role."
          : lan === "ar"
          ? "حدث خطأ غير متوقع."
          : "An unexpected error occurred.",
    });
  }
};

export default { passcodeVerify };
