import bcryptjs from "bcryptjs";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import RoleModel from "../../../models/RoleModel.js";
import { CountryModel, EmployeeModel, UserModel } from "../../../models/index.js";
import { createNewUser, fetchUserFromEmail } from "../../../services/authService.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";
import { generatePasscode, hashPasscode } from "../../../services/passcodeHash.service.js";
import mongoose from "mongoose";

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


function safeString(value = "") {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function objectIdOrNull(value) {
  const text = safeString(value);
  return mongoose.Types.ObjectId.isValid(text) ? new mongoose.Types.ObjectId(text) : null;
}

function uniqueObjectIds(values = []) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const objectId = objectIdOrNull(value);
    if (!objectId) continue;

    const key = String(objectId);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(objectId);
  }

  return result;
}

function firstFilled(values = []) {
  for (const value of values) {
    const text = safeString(value);
    if (text) return text;
  }
  return "";
}

function normalizeRegistrationProfile(value = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function helperItems(value) {
  return asArray(value)
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: safeString(item.id || item._id || item.value),
      key: safeString(item.key || item.name || item.code),
      title: safeString(item.title || item.label || item.name),
      level: Number.isFinite(Number(item.level)) ? Number(item.level) : undefined,
      years: Number.isFinite(Number(item.years)) ? Number(item.years) : undefined,
    }))
    .filter((item) => item.id || item.key || item.title);
}

function normalizeAcademicYear(value = "") {
  const normalized = safeString(value).toLowerCase();
  const map = {
    first_year: "first",
    second_year: "second",
    third_year: "third",
    fourth_year: "fourth",
    fifth_year: "fifth",
    sixth_year: "sixth",
    internship_year: "internship",
  };
  return map[normalized] || normalized;
}

function normalizeReadiness(value = "") {
  const normalized = safeString(value).toLowerCase();
  if (["immediately", "immediate", "now"].includes(normalized)) return "immediately";
  if (["within_week", "within_a_week", "week"].includes(normalized)) return "within_week";
  if (["within_month", "within_a_month", "month"].includes(normalized)) return "within_month";
  return "";
}

function normalizeWorkLocationEnum({ id = "", title = "" } = {}) {
  const raw = `${id} ${title}`.toLowerCase();
  if (raw.includes("remote") || raw.includes("عن بعد")) return "remote";
  if (raw.includes("hybrid") || raw.includes("هجين")) return "hybrid";
  if (raw.includes("onsite") || raw.includes("on_site") || raw.includes("office") || raw.includes("مقر")) return "onsite";
  if (raw.includes("field") || raw.includes("ميداني")) return "field";
  return "unknown";
}

function skillPayload(items = []) {
  return helperItems(items).map((item) => ({
    skill_id: objectIdOrNull(item.id),
    title: item.title || item.key,
    years: item.years ?? 0,
    level: item.level && item.level >= 1 && item.level <= 5 ? item.level : 3,
  }));
}

function languagePayload(items = []) {
  return helperItems(items).map((item) => ({
    language_id: objectIdOrNull(item.id),
    level: item.level && item.level >= 1 && item.level <= 5 ? item.level : 3,
  }));
}

function splitWords(value = "") {
  return safeString(value)
    .split(/[،,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPlainSkills(value = "") {
  return splitWords(value).map((title) => ({
    skill_id: null,
    title,
    years: 0,
    level: 3,
  }));
}

async function resolveLocation({ countryId, cityId, countryCode, countryName, cityName }) {
  const cleanCountryCode = firstFilled([countryCode, countryId]).toUpperCase();
  const cleanCountryName = safeString(countryName);
  const cleanCityName = safeString(cityName);

  let cityDoc = null;

  const cityObjectId = objectIdOrNull(cityId);
  if (cityObjectId) {
    cityDoc = await CountryModel.findById(cityObjectId).lean();
  }

  if (!cityDoc && cleanCountryCode && cleanCityName) {
    cityDoc = await CountryModel.findOne({
      country_code: cleanCountryCode,
      $or: [
        { city_name_ar: new RegExp(`^${cleanCityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        { city_name_en: new RegExp(`^${cleanCityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
    }).lean();
  }

  let countryDoc = null;
  const countryObjectId = objectIdOrNull(countryId);
  if (countryObjectId) {
    countryDoc = await CountryModel.findById(countryObjectId).lean();
  }

  if (!countryDoc && cityDoc) countryDoc = cityDoc;

  if (!countryDoc && cleanCountryCode) {
    countryDoc = await CountryModel.findOne({ country_code: cleanCountryCode }).lean();
  }

  const resolvedCountryCode = firstFilled([countryDoc?.country_code, cleanCountryCode]).toUpperCase();

  return {
    countryObjectId: objectIdOrNull(countryDoc?._id),
    cityObjectId: objectIdOrNull(cityDoc?._id || cityId),
    countryCode: resolvedCountryCode,
    countryName: firstFilled([cleanCountryName, countryDoc?.country_name_ar, countryDoc?.country_name_en]),
    cityName: firstFilled([cleanCityName, cityDoc?.city_name_ar, cityDoc?.city_name_en]),
    countryNameAr: safeString(countryDoc?.country_name_ar),
    countryNameEn: safeString(countryDoc?.country_name_en),
    cityNameAr: safeString(cityDoc?.city_name_ar),
    cityNameEn: safeString(cityDoc?.city_name_en),
  };
}

function buildProfileUpdate({
  registrationProfile,
  candidateStage,
  isStudent,
  birthdayDate,
  location,
}) {
  const profile = normalizeRegistrationProfile(registrationProfile);

  const selectedSkills = helperItems(profile.skills);
  const selectedLanguages = helperItems(profile.languages_selected || profile.languages);

  const jobNameId = objectIdOrNull(profile.target_job_name_id || profile.job_name_id);
  const jobTypeId = objectIdOrNull(profile.preferred_job_type_id || profile.job_type_id);
  const workModeId = objectIdOrNull(profile.preferred_work_mode_id || profile.work_mode_id);
  const noticePeriodId = objectIdOrNull(profile.job_time_id || profile.notice_period_id);
  const educationLevelId = objectIdOrNull(profile.education_level_id);
  const experienceLevelId = objectIdOrNull(profile.experience_level_id);

  const targetJobTitle = safeString(profile.target_job_name || profile.job_name);
  const jobTypeTitle = safeString(profile.preferred_job_type || profile.job_type);
  const workModeTitle = safeString(profile.preferred_work_mode || profile.work_mode);
  const workLocationTitle = safeString(profile.preferred_work_location || profile.work_location);
  const educationLevelTitle = safeString(profile.education_level);
  const experienceLevelTitle = safeString(profile.experience_level);

  const skills = skillPayload(selectedSkills);
  const languages = languagePayload(selectedLanguages);
  const technicalSkills = buildPlainSkills(profile.technical_skills);
  const softSkills = buildPlainSkills(profile.soft_skills);

  const workLocation = normalizeWorkLocationEnum({
    id: profile.preferred_work_location_id || profile.preferred_work_location_key,
    title: workLocationTitle,
  });

  const readiness = normalizeReadiness(profile.work_readiness || profile.job_time_key || profile.job_time_id);
  const academicYear = normalizeAcademicYear(profile.study_year || profile.academic_year);

  const education = educationLevelId || educationLevelTitle
    ? [{ education_level_id: educationLevelId, level: educationLevelTitle }]
    : [];

  const projectsText = safeString(profile.projects);
  const projects = projectsText
    ? [{ name: "Student project", description: projectsText, type: "", technologies: [], url: "" }]
    : [];

  const jobNameIds = jobNameId ? [jobNameId] : [];
  const jobTypeIds = jobTypeId ? [jobTypeId] : [];
  const workModeIds = workModeId ? [workModeId] : [];
  const preferredCountryIds = uniqueObjectIds([location.cityObjectId, location.countryObjectId]);
  const skillIds = uniqueObjectIds(selectedSkills.map((item) => item.id));
  const languageIds = uniqueObjectIds(selectedLanguages.map((item) => item.id));
  const educationIds = educationLevelId ? [educationLevelId] : [];

  const textParts = [
    targetJobTitle,
    jobTypeTitle,
    workModeTitle,
    workLocationTitle,
    educationLevelTitle,
    experienceLevelTitle,
    ...selectedSkills.map((item) => item.title || item.key),
    ...selectedLanguages.map((item) => item.title || item.key),
    location.countryName,
    location.cityName,
  ].filter(Boolean);

  const set = {
    candidate_stage: candidateStage,
    is_student: isStudent,
    birthday: birthdayDate,
    current_country_id: location.countryObjectId,
    current_city_id: location.cityObjectId,
    current_country: location.countryName,
    current_city: location.cityName,
    "search_filters.career.candidate_stage": candidateStage,
    "search_filters.career.is_student": isStudent,
    "search_filters.career.status": true,
    "search_filters.career.accepted": false,
    "search_filters.career.profile_visibility": "public",
    "search_filters.career.work_location": workLocation,
    work_location: workLocation,
    "search_filters.text.profile": textParts,
    "search_filters.text.all": textParts,
    "search_filters.preferred_countries.values": [location.countryName, location.cityName].filter(Boolean),
    "search_filters.preferred_countries.country_codes": location.countryCode ? [location.countryCode] : [],
    "search_filters.preferred_countries.country_names_ar": location.countryNameAr ? [location.countryNameAr] : [],
    "search_filters.preferred_countries.country_names_en": location.countryNameEn ? [location.countryNameEn] : [],
    "search_filters.preferred_countries.city_names_ar": location.cityNameAr ? [location.cityNameAr] : [],
    "search_filters.preferred_countries.city_names_en": location.cityNameEn ? [location.cityNameEn] : [],
    "matching_profile.searchable_text": textParts.join(" "),
    "matching_profile.searchable_tokens": textParts,
    "matching_profile.preferred_country_values": [location.countryName, location.cityName, location.countryCode].filter(Boolean),
    "matching_profile.free_for_work": true,
    "matching_profile.remote_ready": workLocation === "remote" || workLocation === "hybrid",
  };

  if (targetJobTitle) {
    set.current_job_title = targetJobTitle;
    set.profile_headline = targetJobTitle;
    set["matching_profile.normalized_titles"] = [targetJobTitle];
    set["matching_profile.normalized_job_names"] = [targetJobTitle];
    set["search_filters.job_names.titles_ar"] = [targetJobTitle];
    set["search_filters.job_names.titles_en"] = [targetJobTitle];
  }
  if (jobNameIds.length) {
    set.job_names = jobNameIds;
    set["search_filters.job_names.ids"] = jobNameIds;
  }
  if (jobTypeIds.length) {
    set.job_types = jobTypeIds;
    set["search_filters.job_types.ids"] = jobTypeIds;
  }
  if (jobTypeTitle) {
    set["matching_profile.normalized_job_types"] = [jobTypeTitle];
    set["search_filters.job_types.names"] = [jobTypeTitle];
    set["search_filters.job_types.titles_ar"] = [jobTypeTitle];
    set["search_filters.job_types.titles_en"] = [jobTypeTitle];
  }
  if (workModeIds.length) {
    set.preferred_work_modes = workModeIds;
    set["search_filters.preferred_work_modes.ids"] = workModeIds;
  }
  if (workModeTitle) {
    set["matching_profile.preferred_work_mode_keys"] = [workModeTitle];
    set["search_filters.preferred_work_modes.titles_ar"] = [workModeTitle];
    set["search_filters.preferred_work_modes.titles_en"] = [workModeTitle];
  }
  if (preferredCountryIds.length) {
    set.preferred_countries = preferredCountryIds;
  }
  if (noticePeriodId) {
    set.notice_period_id = noticePeriodId;
    set["search_filters.career.notice_period_id"] = noticePeriodId;
  }
  if (education.length) {
    set.education = education;
    set["search_filters.education.level_ids"] = educationIds;
    set["search_filters.education.levels"] = educationLevelTitle ? [educationLevelTitle] : [];
  }
  if (experienceLevelId) {
    set.experience_level_id = experienceLevelId;
    set["search_filters.career.experience_level_id"] = experienceLevelId;
  }
  if (skills.length || technicalSkills.length || softSkills.length) {
    set.skills = [...skills, ...technicalSkills, ...softSkills];
  }
  if (skillIds.length || selectedSkills.length) {
    set["search_filters.skills.ids"] = skillIds;
    set["search_filters.skills.titles_custom"] = selectedSkills.map((item) => item.title || item.key).filter(Boolean);
    set["matching_profile.normalized_skills"] = selectedSkills.map((item) => item.title || item.key).filter(Boolean);
  }
  if (languages.length) {
    set.languages = languages;
  }
  if (languageIds.length || selectedLanguages.length) {
    set["search_filters.languages.ids"] = languageIds;
    set["search_filters.languages.names"] = selectedLanguages.map((item) => item.title || item.key).filter(Boolean);
    set["matching_profile.normalized_languages"] = selectedLanguages.map((item) => item.title || item.key).filter(Boolean);
  }

  const studentProfile = {
    university: safeString(profile.university),
    specialty: safeString(profile.major || profile.specialty),
    sub_specialty: safeString(profile.sub_major || profile.sub_specialty),
    academic_year: ["first", "second", "third", "fourth", "fifth", "sixth", "diploma", "postgraduate", "internship", "graduated", ""].includes(academicYear) ? academicYear : "",
    gpa: safeString(profile.gpa),
    technical_skills: technicalSkills,
    soft_skills: softSkills,
    projects,
    work_readiness: readiness,
    preferred_work_location: workLocationTitle,
    mini_cv_ready: Boolean(profile.about_me || targetJobTitle || skills.length || technicalSkills.length),
    readiness_score: Number.isFinite(Number(profile.completion_percent)) ? Number(profile.completion_percent) : 0,
  };

  set.student_profile = studentProfile;
  if (safeString(profile.about_me)) set.about_me = safeString(profile.about_me);

  return set;
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

const createPasscode = generatePasscode;

async function getEmployeeRole() {
  return RoleModel.findOne({
    role_number: EMPLOYEE_ROLE_NUMBER,
    log_to: "employee",
    status: true,
  }).lean();
}

async function ensureEmployeeProfile({
  userId,
  roleId,
  candidateStage,
  isStudent,
  birthdayDate,
  countryId,
  cityId,
  countryCode,
  country,
  city,
  studentProfile,
  registrationProfile,
}) {
  const location = await resolveLocation({
    countryId,
    cityId,
    countryCode,
    countryName: country,
    cityName: city,
  });

  const profileSet = buildProfileUpdate({
    registrationProfile,
    candidateStage,
    isStudent,
    birthdayDate,
    location,
  });

  if (studentProfile && Object.keys(studentProfile).length) {
    profileSet.student_profile = {
      ...(profileSet.student_profile || {}),
      ...studentProfile,
    };

    const universityName = safeString(studentProfile.university);
    const universityId = objectIdOrNull(studentProfile.university_id);

    if (universityName) profileSet.university = universityName;
    if (universityId) profileSet.university_id = universityId;
  }

  return EmployeeModel.findOneAndUpdate(
    { user_id: userId },
    {
      $setOnInsert: {
        user_id: userId,
        role_id: roleId,
        status: true,
        accepted: false,
      },
      $set: profileSet,
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
      country_code,
      country,
      country_name,
      city,
      city_name,
      accept_terms,
      terms_accepted,
      student_profile = {},
      registration_profile = {},
    } = req.body || {};
    if (!email || !password || !first_name || !last_name || !gender || !birthday || !candidate_stage) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "هنالك بعض البيانات المفقودة" : "There's some missing data.",
      });
    }

    const acceptedTermsValue = accept_terms ?? terms_accepted;
    if (acceptedTermsValue !== undefined && !toBool(acceptedTermsValue)) {
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
        passcode: hashPasscode(passcode),
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
        countryCode: country_code || null,
        country: country_name || country || "",
        city: city_name || city || "",
        studentProfile: student_profile,
        registrationProfile: registration_profile,
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
        country_code: country_code || null,
        registration_profile_saved: Boolean(registration_profile && Object.keys(registration_profile).length),
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
