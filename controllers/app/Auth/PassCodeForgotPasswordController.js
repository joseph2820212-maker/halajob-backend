import { UserModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

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
    const recoveryCodeValid =
      user.passcode &&
      String(user.passcode) === String(passcode).trim() &&
      user.passcode_expires_at &&
      now < new Date(user.passcode_expires_at);

    const newDeviceCodeValid =
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

    if (newDeviceCodeValid) {
      const dev = user.pending_device || incomingDevice;
      if (!dev) {
        return ReturnAppData.createError({
          res,
          status: 409,
          message: lan === "ar" ? "لا يوجد جهاز قيد التحقق." : "No device pending verification.",
        });
      }
      addOrUpdateDevice(user, dev, { makeDefault: true });
      user.another_device_code = undefined;
      user.another_device_expires_at = undefined;
      user.pending_device = undefined;
      user.can_update_password = true;
      user.passcode = undefined;
      user.passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
      user.markModified?.("device");
      await user.save();

      return ReturnAppData.createData({
        res,
        status: 200,
        data: { step: "RESET_PASSWORD" },
        message:
          lan === "ar"
            ? "تم التحقق من الجهاز. يمكنك تغيير كلمة المرور الآن."
            : "Device verified. You can reset your password now.",
      });
    }

    if (recoveryCodeValid) {
      user.passcode = undefined;
      user.passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
      user.can_update_password = true;
      if (incomingDevice?.brand && incomingDevice?.model_name) {
        addOrUpdateDevice(user, incomingDevice, { makeDefault: true });
        user.markModified?.("device");
      }
      await user.save();

      return ReturnAppData.createData({
        res,
        status: 200,
        data: { step: "RESET_PASSWORD" },
        message:
          lan === "ar"
            ? "تم التحقق من الحساب. يمكنك تغيير كلمة المرور الآن."
            : "Account verified. You can reset your password now.",
      });
    }

    return ReturnAppData.createError({
      res,
      status: 400,
      message: lan === "ar" ? "رمز غير صحيح أو منتهي الصلاحية." : "Invalid or expired code.",
    });
  } catch (err) {
    console.error("forgot passcodeVerify error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { passcodeVerify };
