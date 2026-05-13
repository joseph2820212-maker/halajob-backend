import bcryptjs from "bcryptjs";
import ReturnAppData from "../../helper/ReturnAppData/index.js";
import { RoleModel, UserModel } from "../../models/index.js";
import { generateAuthTokens } from "../../services/tokenService.js";

const msg = (lan, ar, en) => (lan === "ar" ? ar : en);

const normEmail = (email) => String(email || "").trim().toLowerCase();

const safeStr = (value) => String(value || "").trim();

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;

  if (user.device && typeof user.device === "object") {
    user.device = [user.device];
  } else {
    user.device = [];
  }
}

function makeDefaultDevice(user, idx) {
  user.device = user.device.map((d, i) => ({
    ...d,
    is_default: i === idx,
  }));
}

function isDeviceMatch(oldDevice, incomingDevice) {
  return (
    safeStr(oldDevice?.brand) === safeStr(incomingDevice?.brand) &&
    safeStr(oldDevice?.model_name) === safeStr(incomingDevice?.model_name) &&
    safeStr(oldDevice?.model_id) === safeStr(incomingDevice?.model_id)
  );
}

function buildPublicUrl(base, rel) {
  if (!base) return rel;

  const cleaned = rel?.replace(/^\/+/, "") || "";

  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);

  const role = user.role_id?._id
    ? user.role_id
    : user.role_id
      ? await RoleModel.findById(user.role_id).lean()
      : null;

  return {
    user_id: user._id,
    first_name: user.first_name,
    mid_name: user.mid_name,
    last_name: user.last_name,
    image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
    phone_code: user.phone_code,
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
  };
}

const login = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(
          lan,
          "البريد أو رقم الهاتف وكلمة المرور مطلوبة.",
          "Email or phone and password are required."
        ),
      });
    }

    const identifier = String(email).trim();

    const user = identifier.includes("@")
      ? await UserModel.findOne({ email: normEmail(identifier) }).populate("role_id")
      : await UserModel.findOne({ phone_national: identifier }).populate("role_id");

    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, "البيانات المرسلة غير صحيحة.", "The data sent is incorrect."),
      });
    }

    const ok = await bcryptjs.compare(String(password), user.password || "");

    if (!ok) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, "البيانات المرسلة غير صحيحة.", "The data sent is incorrect."),
      });
    }

    const isAdminRole =
      user.role_id?.log_to === "dash" ||
      String(user.role_id?.name || "").toLowerCase() === "admin";

    if (!isAdminRole) {
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(
          lan,
          "هذا الحساب لا يملك صلاحية الدخول كمدير.",
          "This account does not have permission to login as an admin."
        ),
      });
    }

    if (!user.status) {
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(lan, "هذا الحساب غير فعال حالياً.", "This account is currently inactive."),
      });
    }

    const incomingDevice = {
      brand: req.headers["sec-ch-ua"] || "Unknown Browser",

      model_name: `${req.headers["sec-ch-ua-platform"] || "Unknown Platform"} Browser`,

      model_id: req.headers["user-agent"] || null,

      is_device: false,

      build_id: req.headers["sec-ch-ua-mobile"] || null,

      is_default: false,

      last_seen_at: new Date(),
    };

    ensureDeviceArray(user);

    const idx = user.device.findIndex((d) => isDeviceMatch(d, incomingDevice));

    let authDevice;

    if (idx >= 0) {
      user.device[idx].last_seen_at = new Date();

      if (incomingDevice.build_id) {
        user.device[idx].build_id = incomingDevice.build_id;
      }

      if (incomingDevice.model_id && !user.device[idx].model_id) {
        user.device[idx].model_id = incomingDevice.model_id;
      }

      makeDefaultDevice(user, idx);
      authDevice = user.device[idx];
    } else {
      user.device.push({
        ...incomingDevice,
        is_default: true,
      });

      makeDefaultDevice(user, user.device.length - 1);
      authDevice = user.device[user.device.length - 1];
    }

    user.markModified?.("device");
    await user.save();

    const authPayload = await buildAuthPayload(user, authDevice);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        ...authPayload,
        admin: user,
      },
      message: msg(lan, "تم تسجيل الدخول بنجاح.", "Logged in successfully."),
    });
  } catch (err) {
    console.error("admin login error:", err);

    return ReturnAppData.createError({
      res,
      status: 500,
      message: msg(lan, "حدث خطأ غير متوقع.", "An unexpected error occurred."),
    });
  }
};

export default { login };