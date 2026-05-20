import { CompanyModel, RoleModel, UserModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { generateAuthTokens } from "../../../services/tokenService.js";

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
  const role = user.role_id ? await RoleModel.findById(user.role_id).lean() : null;
  const company = await CompanyModel.findOne({ user_id: user._id, status: true }).lean();

  return {
    user_id: user._id,
    first_name: user.first_name,
    mid_name: user.mid_name,
    last_name: user.last_name,
    phone_code: user.phone_code,
    image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
    phone: user.phone_national,
    gender: user.gender,
    role: role
      ? {
          id: role._id,
          title_ar: role.title_ar,
          title_en: role.title_en,
          permissions: user.permissions || [],
        }
      : null,
    tokens,
    company,
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
      user.markModified?.("device");
      await user.save();

      return ReturnAppData.createData({
        res,
        status: 200,
        data: await buildAuthPayload(user, dev),
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
      user.passcode_active = true;
      user.status = true;
      user.passcode = undefined;
      user.passcode_expires_at = undefined;

      let dev = incomingDevice;
      if (incomingDevice?.brand && incomingDevice?.model_name) {
        addOrUpdateDevice(user, incomingDevice, { makeDefault: true });
      } else {
        ensureDeviceArray(user);
        dev = user.device.find((d) => d.is_default) || user.device[0] || null;
      }

      user.markModified?.("device");
      await user.save();

      return ReturnAppData.createData({
        res,
        status: 200,
        data: await buildAuthPayload(user, dev),
        message: lan === "ar" ? "تم تسجيل الدخول" : "Logged in",
      });
    }

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
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { passcodeVerify };
