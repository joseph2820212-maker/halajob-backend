import bcryptjs from "bcryptjs";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import RoleModel from "../../../models/RoleModel.js";
import { UserModel } from "../../../models/index.js";
import { createNewUser, fetchUserFromEmail } from "../../../services/authService.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import crypto from "crypto";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "aol.com",
]);

const strongPasswordRe =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeCode(code = "") {
  const c = String(code).trim();
  if (!c) return "";
  return c.startsWith("+") ? c : `+${c}`;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  return false;
}

function createPasscode() {
  return 12345; // For testing purposes, replace with actual random code generation in production
  return crypto.randomInt(10000, 100000);
}

const register = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const {
      email,
      password,
      first_name,
      last_name,
      mid_name,
      gender,
      device = {},
      phone_code,
      phone_number,
    } = req.body || {};

    if (!email || !password || !first_name || !last_name || !gender) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "هنالك بعض البيانات المفقودة" : "There's some missing data.",
      });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const firstName = String(first_name).trim();
    const lastName = String(last_name).trim();
    const midName = typeof mid_name === "string" && mid_name.trim() ? mid_name.trim() : null;

    if (!emailRe.test(emailNorm)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format.",
      });
    }

    const existing = await fetchUserFromEmail(emailNorm);
    if (existing) {
      return ReturnAppData.createError({
        res,
        status: 409,
        message: lan === "ar" ? "البريد الإلكتروني مسجل مسبقًا" : "Email already registered.",
      });
    }

    if (!strongPasswordRe.test(String(password))) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، حرف كبير واحد، حرف صغير واحد، رقم واحد، وحرف خاص واحد."
            : "Password must be 8+ chars with 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
      });
    }

    if (firstName.length < 2 || lastName.length < 2) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "الاسم يجب أن لا يقل عن حرفين." : "Name must be at least 2 characters long.",
      });
    }

    const { brand, model_name, model_id, is_device, build_id } = device || {};
    if (
      typeof brand !== "string" ||
      !brand.trim() ||
      typeof model_name !== "string" ||
      !model_name.trim() ||
      !Object.prototype.hasOwnProperty.call(device, "is_device")
    ) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "بيانات الجهاز مفقودة" : "Device data is missing.",
      });
    }

    if (!phone_code || !phone_number) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "رقم الهاتف أو رمز الاتصال مفقود" : "Phone code or number is missing.",
      });
    }

    const code = normalizeCode(phone_code);
    const nationalDigits = String(phone_number).replace(/\D/g, "");
    const raw = `${code}${nationalDigits}`;
    const phoneParsed = parsePhoneNumberFromString(raw);

    if (!phoneParsed || !phoneParsed.isValid()) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "رقم الهاتف أو رمز الاتصال غير صحيح" : "Invalid phone number or calling code.",
      });
    }

    const inputDigits = code.replace(/\D/g, "");
    if (phoneParsed.countryCallingCode !== inputDigits) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "رمز الاتصال لا يطابق الرقم" : "Calling code does not match the number.",
      });
    }

    const phone_e164 = phoneParsed.number;
    const phone_country = phoneParsed.country || null;
    const phone_code_norm = `+${phoneParsed.countryCallingCode}`;
    const phone_national = phoneParsed.nationalNumber;

    const phoneExists = await UserModel.exists({
      $or: [{ phone_e164 }, { phone_national }],
    });
    if (phoneExists) {
      return ReturnAppData.createError({
        res,
        status: 409,
        message: lan === "ar" ? "رقم الهاتف مستخدم مسبقًا" : "Phone number already registered.",
      });
    }

    const domain = emailNorm.split("@")[1];
    const is_company = !PUBLIC_EMAIL_DOMAINS.has(domain);

    const roleDoc = await RoleModel.findOne({ role_number: is_company ? 3 : 4 }).lean();
    if (!roleDoc?._id) {
      return ReturnAppData.createError({
        res,
        status: 500,
        message: lan === "ar" ? "تعذر تحديد صلاحية المستخدم." : "Unable to resolve user role.",
      });
    }

    const hashedPassword = await bcryptjs.hash(String(password), 10);
    const passcode = createPasscode();
    const passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    let newUser;
    try {
      newUser = await createNewUser({
        email: emailNorm,
        passcode,
        passcode_expires_at,
        password: hashedPassword,
        source: "email",
        role_id: roleDoc._id,
        first_name: firstName,
        mid_name: midName,
        last_name: lastName,
        lan,
        gender,
        status: false,
        passcode_active: false,
        phone_e164,
        phone_country,
        phone_code: phone_code_norm,
        phone_national,
        device: [
          {
            brand: brand.trim(),
            model_name: model_name.trim(),
            model_id: typeof model_id === "string" && model_id.trim() ? model_id.trim() : null,
            is_default: true,
            is_device: toBool(is_device),
            build_id: typeof build_id === "string" && build_id.trim() ? build_id.trim() : null,
            last_seen_at: new Date(),
          },
        ],
      });
    } catch (err) {
      if (err && err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        const msg =
          lan === "ar"
            ? field.includes("phone")
              ? "رقم الهاتف مستخدم مسبقًا"
              : "البريد الإلكتروني مسجل مسبقًا"
            : field.includes("phone")
            ? "Phone number already registered."
            : "Email already registered.";
        return ReturnAppData.createError({ res, status: 409, message: msg });
      }
      throw err;
    }

    try {
      await sendRecoveryEmail({ to: emailNorm, passcode });
    } catch (emailErr) {
      console.error("register email error:", emailErr);
      return ReturnAppData.createError({
        res,
        status: 502,
        message:
          lan === "ar"
            ? "تعذر إرسال رمز التحقق إلى البريد الإلكتروني. حاول لاحقًا."
            : "Failed to send verification code to email. Please try again shortly.",
      });
    }

    return ReturnAppData.createData({
      res,
      status: 201,
      data: { user_id: newUser?._id, step: "ENTER_PASSCODE" },
      message:
        lan === "ar"
          ? "تم إنشاء الحساب بنجاح، يرجى إدخال رمز التحقق المرسل إلى البريد الإلكتروني."
          : "The account has been created successfully. Please enter the verification code sent to your email.",
    });
  } catch (err) {
    console.error("register error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { register };
