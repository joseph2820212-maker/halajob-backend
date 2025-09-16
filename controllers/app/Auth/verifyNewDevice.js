import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { UserModel } from "../../../models/index.js";

const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

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

function addOrUpdateDevice(user, dev, { makeDefault = false } = {}) {
  ensureDeviceArray(user);
  const idx = user.device.findIndex((d) => isDeviceMatch(d, dev));
  if (idx >= 0) {
    const existing = user.device[idx];
    existing.build_id = dev.build_id ?? existing.build_id ?? null;
    existing.model_id = dev.model_id ?? existing.model_id ?? null;
    existing.last_seen_at = new Date();
    if (makeDefault) user.device = user.device.map((d, i) => ({ ...d, is_default: i === idx }));
  } else {
    const toInsert = {
      brand: dev.brand,
      model_name: dev.model_name,
      model_id: dev.model_id ?? null,
      is_device: !!dev.is_device,
      build_id: dev.build_id ?? null,
      is_default: !!makeDefault,
      last_seen_at: new Date(),
    };
    if (makeDefault) user.device = user.device.map((d) => ({ ...d, is_default: false }));
    user.device.push(toInsert);
  }
}

export const verifyNewDevice = async (req, res) => {
  const lan = req.get("lan") || "en";

  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar" ? "البريد والرمز مطلوبان." : "Email and code are required."
      });
    }

    const user = email.includes("@")
      ? await UserModel.findOne({ email: email.trim().toLowerCase() })
      : await UserModel.findOne({ phone_national: email });

    if (!user) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect."
      });
    }

    if (!user.another_device_code || !user.another_device_expires_at || !user.pending_device) {
      return ReturnAppData.createError({
        res, status: 409,
        message: lan === "ar" ? "لا يوجد جهاز قيد التحقق." : "No device pending verification."
      });
    }

    const now = new Date();
    const expired = now > new Date(user.another_device_expires_at);
    const codeMatches = String(code).trim() === String(user.another_device_code);

    if (expired) {
      user.another_device_code = undefined;
      user.another_device_expires_at = undefined;
      user.pending_device = undefined;
      await user.save();
      return ReturnAppData.createError({
        res, status: 410,
        message: lan === "ar" ? "انتهت صلاحية الرمز. أعد المحاولة." : "Code expired. Please try again."
      });
    }

    if (!codeMatches) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar" ? "رمز غير صحيح." : "Invalid code."
      });
    }

    addOrUpdateDevice(user, user.pending_device, { makeDefault: false });

    user.another_device_code = undefined;
    user.another_device_expires_at = undefined;
    user.pending_device = undefined;

    user.markModified?.("device");
    await user.save();

    return ReturnAppData.createData({
      res, status: 200,
      data: { user_id: user._id, device_added: true },
      message: lan === "ar" ? "تم اعتماد الجهاز وإضافته إلى قائمة الأجهزة." : "Device verified and added."
    });
  } catch (err) {
    console.error("verifyNewDevice error:", err);
    return ReturnAppData.createError({
      res, status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred."
    });
  }
};

export default { verifyNewDevice };
