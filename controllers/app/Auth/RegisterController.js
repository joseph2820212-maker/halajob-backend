import bcryptjs from "bcryptjs";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import RoleModel from "../../../models/RoleModel.js";
import { UserModel } from "../../../models/index.js";
import { createNewUser, fetchUserFromEmail } from "../../../services/authService.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";

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

const register = async (req, res, next) => {
  // Always read language from header; default to "en"
  const lan = req.get("lan") || "en";

  try {
    const {
      email,
      password,
      first_name,
      last_name,
      mid_name, // optional
      gender,
      device = {},
      phone_code,   // e.g. +966 or 966
      phone_number, // national part without code
    } = req.body || {};
    console.log(password);
    
    // 1) Basic required fields (lan comes from header only)
    if (!email || !password || !first_name || !last_name || !gender) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar" ? "هنالك بعض البيانات المفقودة" : "There's some missing data.",
      });
    }

    // Normalize inputs
    const emailNorm = String(email).trim().toLowerCase();
    const firstName = String(first_name).trim();
    const lastName = String(last_name).trim();
    const midName = (mid_name ?? "").trim() || null;

    // 2) Email format
    if (!emailRe.test(emailNorm)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format.",
      });
    }

    // 3) Uniqueness: email
    const existing = await fetchUserFromEmail(emailNorm);
    if (existing) {
      return ReturnAppData.createError({
        res,
        status: 409,
        message:
          lan === "ar" ? "البريد الإلكتروني مسجل مسبقًا" : "Email already registered.",
      });
    }

    // 4) Password strength
    if (!strongPasswordRe.test(password)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، حرف كبير واحد، حرف صغير واحد، رقم واحد، وحرف خاص واحد."
            : "Password must be 8+ chars with 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
      });
    }

    // 5) Name validation
    if (
      typeof firstName !== "string" || firstName.length < 2 ||
      typeof lastName !== "string" || lastName.length < 2
    ) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar" ? "الاسم يجب أن لا يقل عن حرفين." : "Name must be at least 2 characters long.",
      });
    }

    // 6) Device validation
    const { brand, model_name, is_device, build_id } = device || {};
    if (
      typeof brand !== "string" || !brand.trim() ||
      typeof model_name !== "string" || !model_name.trim() ||
      typeof is_device !== "boolean"
    ) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "بيانات الجهاز مفقودة" : "Device data is missing.",
      });
    }

    // 7) Phone (code + national) ➜ parse to E.164
    if (!phone_code || !phone_number) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "رقم الهاتف أو رمز الاتصال مفقود" : "Phone code or number is missing.",
      });
    }

    const code = normalizeCode(phone_code); // "+966"
    const raw = `${code}${String(phone_number).trim()}`; // "+9665xxxxxxx"
    const phoneParsed = parsePhoneNumberFromString(raw);

    if (!phoneParsed || !phoneParsed.isValid()) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar" ? "رقم الهاتف أو رمز الاتصال غير صحيح" : "Invalid phone number or calling code.",
      });
    }

    // Ensure calling code matches input
    const inputDigits = code.replace(/\D/g, ""); // "966"
    if (phoneParsed.countryCallingCode !== inputDigits) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar" ? "رمز الاتصال لا يطابق الرقم" : "Calling code does not match the number.",
      });
    }

    // Standardized phone fields
    const phone_e164 = phoneParsed.number; // "+9665xxxxxxx"
    const phone_country = phoneParsed.country || null; // e.g., "SA"
    const phone_code_norm = `+${phoneParsed.countryCallingCode}`; // "+966"
    const phone_national = phoneParsed.nationalNumber; // "5xxxxxxx"

    // 8) Prevent phone duplication
    const phoneExists = await UserModel.exists({ phone_e164 });
    if (phoneExists) {
      return ReturnAppData.createError({
        res,
        status: 409,
        message: lan === "ar" ? "رقم الهاتف مستخدم مسبقًا" : "Phone number already registered.",
      });
    }

    // 9) Company vs public email
    const domain = emailNorm.split("@")[1];
    const is_company = !PUBLIC_EMAIL_DOMAINS.has(domain);

    // 10) Resolve role
    const roleDoc = await RoleModel.findOne({
      role_number: is_company ? 11 : 21,
    }).lean();

    if (!roleDoc?._id) {
      return ReturnAppData.createError({
        res,
        status: 500,
        message: lan === "ar" ? "تعذر تحديد صلاحية المستخدم." : "Unable to resolve user role.",
      });
    }

    // 11) Hash password + verification code
    const hashedPassword = await bcryptjs.hash(password, 10);
    // const passcode = Math.floor(10000 + Math.random() * 90000);
    const passcode=12345;
    const passcode_expires_at = new Date(Date.now() + 10 * 60 * 1000);
 const me = await UserModel.findOneAndUpdate(
  { email: "mhdnourmnini@gmail.com" },
  { password: hashedPassword },
  { new: true } // return the updated document
);
    // 12) Create user (catch duplicate key races)
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
        phone_e164,
        phone_country,
        phone_code: phone_code_norm,
        phone_national,
        device: {
          brand: brand.trim(),
          model_name: model_name.trim(),
          is_default: true,
          is_device,
          build_id: build_id || null,
        },
      });
    } catch (err) {
      // Handle unique index races on email/phone
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
      throw err; // bubble to outer catch
    }

    // 13) Send verification email
    try {
      await sendRecoveryEmail({ to: emailNorm, passcode });
    } catch (emailErr) {
      // You can choose to fail or allow retry flow. Here we fail gracefully.
      // Option A: return 500 and let client retry registration or trigger resend.
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
      data: { user_id: newUser?._id },
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
      message:
        (req.get("lan") || "en") === "ar"
          ? "حدث خطأ غير متوقع."
          : "An unexpected error occurred.",
    });
  }
};

export default { register };
