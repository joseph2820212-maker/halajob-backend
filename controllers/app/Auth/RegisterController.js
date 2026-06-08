import bcryptjs from "bcryptjs";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import RoleModel from "../../../models/RoleModel.js";
import { EmployeeModel, UserModel } from "../../../models/index.js";
import { createNewUser, fetchUserFromEmail } from "../../../services/authService.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import crypto from "crypto";

const strongPasswordRe =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPLOYEE_ROLE_NUMBER = 4;

// التسجيل يحتاج حالة دراسية حقيقية، لذلك لا نقبل unknown في إنشاء الحساب.
const REGISTER_CANDIDATE_STAGES = [
  "student",
  "graduate",
  "fresh_graduate",
  "experienced",
  "career_changer",
];

function normalizeCode(code = "") {
  const c = String(code).trim();
  if (!c) return "";
  return c.startsWith("+") ? c : `+${c}`;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    return ["true", "1", "yes", "y"].includes(v.trim().toLowerCase());
  }
  return false;
}

function parseBirthday(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // لا نقبل تاريخ ميلاد في المستقبل أو تاريخاً غير منطقي جداً.
  const oldestAllowed = new Date(today);
  oldestAllowed.setFullYear(today.getFullYear() - 120);

  if (normalized > today || normalized < oldestAllowed) return null;
  return normalized;
}

function normalizeCandidateStage(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function createPasscode() {
  if (process.env.NODE_ENV !== "production") return 12345;
  return crypto.randomInt(10000, 100000);
}

async function getEmployeeRole() {
  return RoleModel.findOne({
    role_number: EMPLOYEE_ROLE_NUMBER,
    log_to: "employee",
    status: true,
  }).lean();
}

async function ensureEmployeeProfile({ userId, roleId, candidateStage, isStudent, birthdayDate, countryId, cityId, country, city, studentProfile }) {
  return EmployeeModel.findOneAndUpdate(
    { user_id: userId },
    {
      $setOnInsert: {
        user_id: userId,
        role_id: roleId,
        status: true,
        accepted: false,
      },
      $set: {
        candidate_stage: candidateStage,
        is_student: isStudent,
        "search_filters.career.candidate_stage": candidateStage,
        "search_filters.career.is_student": isStudent,
        birthday: birthdayDate,
        current_country_id: countryId || null,
        current_city_id: cityId || null,
        current_country: country || "",
        current_city: city || "",
        student_profile: studentProfile || {},
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
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
      birthday,
      candidate_stage,
      is_student,
      device = {},
      phone_code,
      phone_number,
      country_id,
      city_id,
      country,
      city,
      accept_terms,
      student_profile = {},
    } = req.body || {};
    if (!email || !password || !first_name || !last_name || !gender || !birthday || !candidate_stage) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "هنالك بعض البيانات المفقودة" : "There's some missing data.",
      });
    }

    if (accept_terms !== undefined && !toBool(accept_terms)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية." : "You must accept the terms and privacy policy.",
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

    const birthdayDate = parseBirthday(birthday);
    if (!birthdayDate) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "تاريخ الميلاد مطلوب ويجب أن يكون تاريخاً صحيحاً وغير مستقبلي."
            : "Birthday is required and must be a valid non-future date.",
      });
    }

    const candidateStage = normalizeCandidateStage(candidate_stage);
    if (!REGISTER_CANDIDATE_STAGES.includes(candidateStage)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? `الحالة الدراسية غير صالحة. القيم المقبولة: ${REGISTER_CANDIDATE_STAGES.join(", ")}`
            : `Invalid candidate_stage. Allowed values: ${REGISTER_CANDIDATE_STAGES.join(", ")}`,
      });
    }

    const isStudent = is_student === undefined ? candidateStage === "student" : toBool(is_student);
    if (candidateStage === "student" && isStudent !== true) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "عند اختيار student يجب أن تكون is_student = true."
            : "When candidate_stage is student, is_student must be true.",
      });
    }

    if (candidateStage !== "student" && isStudent === true) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message:
          lan === "ar"
            ? "لا يمكن إرسال is_student = true مع حالة دراسية ليست student."
            : "is_student cannot be true when candidate_stage is not student.",
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

    // التسجيل في تطبيق الموظفين يجب أن يكون Employee فقط.
    // لا تعتمد على دومين البريد لتحديد شركة/موظف.
    const roleDoc = await getEmployeeRole();
    if (!roleDoc?._id) {
      return ReturnAppData.createError({
        res,
        status: 500,
        message: lan === "ar" ? "تعذر تحديد صلاحية الموظف." : "Unable to resolve employee role.",
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
        birthday: birthdayDate,
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

      await ensureEmployeeProfile({
        userId: newUser._id,
        roleId: roleDoc._id,
        candidateStage,
        isStudent,
        birthdayDate,
        countryId: country_id || null,
        cityId: city_id || null,
        country: country || "",
        city: city || "",
        studentProfile: student_profile,
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
      data: {
        user_id: newUser?._id,
        step: "ENTER_PASSCODE",
        accountType: "employee",
        birthday: birthdayDate,
        candidate_stage: candidateStage,
        is_student: isStudent,
        country_id: country_id || null,
        city_id: city_id || null,
      },
      message:
        lan === "ar"
          ? "تم إنشاء حساب الموظف بنجاح، يرجى إدخال رمز التحقق المرسل إلى البريد الإلكتروني."
          : "The employee account has been created successfully. Please enter the verification code sent to your email.",
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
