import { CompanyModel, RoleModel, UserModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { generateAuthTokens } from "../../../services/tokenService.js";

/** Utils */
const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");
const normEmail = (e) => (e || "").trim().toLowerCase();
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
  if (!brandA || !modelA) return false;
  if (brandA !== brandB || modelA !== modelB || isDevA !== isDevB) return false;

  // لو model_id موجود في الاثنين واختلف → جهاز مختلف
  const midA = normStr(a.model_id || "");
  const midB = normStr(b.model_id || "");
  if (midA && midB && midA !== midB) return false;

  // نتجاهل build_id لأنه يتغيّر مع تحديثات النظام
  return true;
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
    return { updated: true, index: idx };
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

    // جلب المستخدم
    const user = email.includes("@")
      ? await UserModel.findOne({ email: normEmail(email) })
      : await UserModel.findOne({ phone_national: email });

    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    const now = new Date();

    // صلاحية كود تفعيل الحساب
    const passcodeValid =
      user.passcode &&
      String(user.passcode) === String(passcode) &&
      user.passcode_expires_at &&
      now < new Date(user.passcode_expires_at);

    // صلاحية كود اعتماد جهاز جديد
    const deviceCodeValid =
      user.another_device_code &&
      String(user.another_device_code) === String(passcode) &&
      user.another_device_expires_at &&
      now < new Date(user.another_device_expires_at);

    // جهّز الجهاز الوارد (اختياري)
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

    // 1) كود الجهاز الجديد (2FA للجهاز)
    if (deviceCodeValid) {
      const dev = user.pending_device || incomingDevice;
      if (!dev) {
        return ReturnAppData.createError({
          res,
          status: 409,
          message:
            lan === "ar" ? "لا يوجد جهاز قيد التحقق." : "No device pending verification.",
        });
      }

      const result = addOrUpdateDevice(user, dev, { makeDefault: true });

      // نظّف الحقول المؤقتة
      user.another_device_code = undefined;
      user.another_device_expires_at = undefined;
      user.pending_device = undefined;
      user.can_update_password=true;
      user.markModified?.("device");
      await user.save();
     return ReturnAppData.createData({
        res,
        status: 200,
         message:
          lan === "ar"?
           "تم التحقق من الحساب يمكنك تغيير كلمة المرور الان":
           "The account is verified, you can change the password now"
      });
    }

    // 2) كود تفعيل الحساب
    if (passcodeValid) {
      user.passcode_active = true;
      user.status = true;

      // نظّف كود التفعيل
      user.passcode = undefined;
      user.passcode_expires_at = undefined;
user.can_update_password=true;
      await user.save();

      // بإمكانك هنا عدم إضافة الجهاز نهائيًا (الإضافة تتم عبر 2FA للجهاز)،
      // لكن سنُرجع هل الجهاز معروف أم لا إن تم تمريره.
      let device_recognized = false;
      if (incomingDevice) {
        ensureDeviceArray(user);
        device_recognized = user.device.some((d) => isDeviceMatch(d, incomingDevice));
      }

      return ReturnAppData.createData({
        res,
        status: 200,
         message:
         lan === "ar"?
           "تم التحقق من الحساب يمكنك تغيير كلمة المرور الان":
           "The account is verified, you can change the password now"
      });
      
    }

    // 3) كود غير صحيح/منتهي
    return ReturnAppData.createError({
      res,
      status: 400,
      message:
        lan === "ar" ? "رمز غير صحيح أو منتهي الصلاحية." : "Invalid or expired code.",
    });
  } catch (err) {
    console.error("passcodeVerify error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { passcodeVerify };
