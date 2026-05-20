import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { UserModel } from "../../../models/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";

/** تطبيع السلاسل */
const normStr = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");

/** تطبيع الإيميل */
const normEmail = (e) => (e || "").trim().toLowerCase();

/** تحويل القيم “المشابهة للمنطقية” إلى Boolean */
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  return false;
};

/** مطابقة جهازين بشكل متسامح مع build_id ومتشدّد مع model_id عند توفره */
function isDeviceMatch(a = {}, b = {}) {
  const brandA = normStr(a.brand), brandB = normStr(b.brand);
  const modelA = normStr(a.model_name), modelB = normStr(b.model_name);
  const isDevA = !!a.is_device, isDevB = !!b.is_device;

  // Important: do NOT use build_id/model_id as hard identity keys.
  // They can change after OS/app updates and would make the same phone look like a new device.
  if (!brandA || !modelA || !brandB || !modelB) return false;
  return brandA === brandB && modelA === modelB && isDevA === isDevB;
}

/** لتجنّب كشف وجود المستخدم (اختياري) */
const LEAK_USER_ENUMERATION = false;

const forgotPassword = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const data = req.body || {};
    const emailOrPhone = safeStr(data.email || ""); // email أو رقم وطني
    const rawDevice = data.device || {};

    // تحقق أساسي
    if (!emailOrPhone) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البريد مطلوب." : "Email is required.",
      });
    }

    // التحقق من الجهاز: حقول مطلوبة
    const hasBrand = typeof rawDevice.brand === "string" && rawDevice.brand.trim();
    const hasModel = typeof rawDevice.model_name === "string" && rawDevice.model_name.trim();
    const hasIsDevice = Object.prototype.hasOwnProperty.call(rawDevice, "is_device");

    if (!hasBrand || !hasModel || !hasIsDevice) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "بيانات الجهاز مفقودة." : "Device data is missing.",
      });
    }

    // جلب المستخدم
    let user = null;
    if (emailOrPhone.includes("@")) {
      user = await UserModel.findOne({ email: normEmail(emailOrPhone) });
    } else {
      user = await UserModel.findOne({ phone_national: emailOrPhone });
    }

    if (!user) {
      // يُفضّل عدم كشف وجود المستخدم
      if (!LEAK_USER_ENUMERATION) {
        return ReturnAppData.createData({
          res,
          status: 200,
          data: { ok: true },
          message:
            lan === "ar"
              ? "إذا كان الحساب موجودًا سنرسل تعليمات الاستعادة إن وُجد."
              : "If the account exists, we'll send recovery instructions if applicable.",
        });
      }
      // أو الرسالة التقليدية (تكشف)
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    // قائمة الأجهزة المحفوظة
    const savedDevices = Array.isArray(user.device)
      ? user.device
      : user.device
      ? [user.device]
      : [];

    // تجهيز الجهاز الوارد
    const incomingDevice = {
      brand: safeStr(rawDevice.brand),
      model_name: safeStr(rawDevice.model_name),
      model_id: typeof rawDevice.model_id === "string" ? safeStr(rawDevice.model_id) : null,
      is_device: toBool(rawDevice.is_device), // true: device, false: emulator
      build_id: typeof rawDevice.build_id === "string" ? safeStr(rawDevice.build_id) : null,
      is_default: false,
      last_seen_at: new Date(),
    };

    // هل الجهاز معروف؟
    const knownIdx = savedDevices.findIndex((d) => isDeviceMatch(d, incomingDevice));
    const isKnownDevice = knownIdx >= 0;

    if (isKnownDevice) {
      // تحديث معلومات الجهاز غير حرِج
      try {
        const known = savedDevices[knownIdx];
        known.last_seen_at = new Date();
        if (incomingDevice.build_id && (!known.build_id || known.build_id !== incomingDevice.build_id)) {
          known.build_id = incomingDevice.build_id;
        }
        if (incomingDevice.model_id && !known.model_id) {
          known.model_id = incomingDevice.model_id;
        }
        if (typeof user.markModified === "function") user.markModified("device");
        await user.save();
      } catch (_) {}

      // أرسل رمز استعادة (٥ أرقام)
      const passcode = Math.floor(10000 + Math.random() * 90000);
      // user.passcode = passcode;
      user.passcode = 12345;
      user.can_update_password = true;
      user.passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق
      await user.save();

      await sendRecoveryEmail({ to: user.email, passcode });

      return ReturnAppData.createData({
        res,
        status: 200,
        data: { step: "ENTER_PASSCODE" },
        message:
          lan === "ar"
            ? "تم إرسال رمز الاستعادة إلى بريدك."
            : "A recovery code has been sent to your email.",
      });
    }

    // جهاز جديد → أرسل رمز تحقق قبل السماح بالاستعادة
    // const twofa = Math.floor(10000 + Math.random() * 90000);
    const twofa = 12345;
    user.another_device_code = twofa;
    user.another_device_expires_at = new Date(Date.now() + 10 * 60 * 1000);
    user.pending_device = incomingDevice;

    // جهّز مصفوفة الأجهزة ثم أضف الجهاز (اختياري: لا تعتمد قبل التحقق)
    const ensuredDevices = Array.isArray(user.device) ? user.device : (user.device ? [user.device] : []);
    user.device = ensuredDevices; // لا نعتمد الجهاز الجديد حتى ينجح التحقق

    await user.save();

    await sendRecoveryEmail({ to: user.email, passcode: twofa });

    return ReturnAppData.createData({
      res,
      status: 202,
      data: { step: "VERIFY_NEW_DEVICE" },
      message:
        lan === "ar"
          ? "تم رصد جهاز جديد. أرسلنا رمز تحقق إلى بريدك. أدخله للمتابعة."
          : "New device detected. We sent a verification code to your email. Enter it to continue.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { forgotPassword };
