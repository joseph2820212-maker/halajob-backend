// controllers/employee/EditProfileController.js
import Joi from "joi";
import mongoose from "mongoose";
import { EmployeeModel } from "../../../models/index.js";
import { resolveAppAccount } from "../../../services/appAccount.service.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";


const CANDIDATE_STAGES = [
  "student",
  "graduate",
  "fresh_graduate",
  "experienced",
  "career_changer",
  "unknown",
];

const WORK_LOCATIONS = ["remote", "hybrid", "onsite", "field", "unknown"];
const PROFILE_VISIBILITY = ["public", "private", "companies_only"];
const CV_STATUS = ["active", "inactive"];

function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

function isObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

const objectId = () =>
  Joi.string()
    .trim()
    .custom((v, helpers) => {
      if (!isObjectId(v)) return helpers.error("any.invalid");
      return v;
    });

const nullableObjectId = () => Joi.alternatives().try(objectId(), Joi.valid(null));

const dateNullable = Joi.alternatives().try(Joi.date(), Joi.valid(null));

const experienceItemSchema = Joi.object({
  company_name: Joi.string().trim().allow("").max(200),
  position: Joi.string().trim().allow("").max(200),
  start_date: dateNullable,
  end_date: dateNullable,
  is_until_now: Joi.boolean(),
  details: Joi.string().trim().allow("").max(2000),
})
  .min(1)
  .custom((value, helpers) => {
    if (value.start_date && value.end_date && new Date(value.end_date) < new Date(value.start_date)) {
      return helpers.error("any.invalid");
    }
    return value;
  });

const educationItemSchema = Joi.object({
  education_level_id: nullableObjectId(),
  level: Joi.string().trim().allow("").max(100),
  study: Joi.string().trim().allow("").max(200),
  institution: Joi.string().trim().allow("").max(200),
  start_date: dateNullable,
  end_date: dateNullable,
  is_until_now: Joi.boolean(),
})
  .min(1)
  .custom((value, helpers) => {
    if (value.start_date && value.end_date && new Date(value.end_date) < new Date(value.start_date)) {
      return helpers.error("any.invalid");
    }
    return value;
  });

const skillItemSchema = Joi.object({
  skill_id: nullableObjectId(),
  title: Joi.string().trim().allow("").max(100),
  years: Joi.number().integer().min(0).max(80),
  level: Joi.number().integer().min(1).max(5),
}).min(1);

const languageItemSchema = Joi.object({
  language_id: nullableObjectId(),
  level: Joi.number().integer().min(1).max(5),
}).min(1);

const certificateItemSchema = Joi.object({
  name: Joi.string().trim().allow("").max(150),
  end_in: dateNullable,
  is_for_ever: Joi.boolean(),
})
  .min(1)
  .custom((value, helpers) => {
    if (value.is_for_ever === false && !value.end_in) {
      return helpers.message("end_in is required when is_for_ever is false");
    }
    return value;
  });

const linkItemSchema = Joi.object({
  title: Joi.string().trim().allow("").max(120),
  url: Joi.string().trim().uri().allow(""),
}).min(1);

const cvItemSchema = Joi.object({
  url: Joi.string().trim().required(),
  fileName: Joi.string().trim().required(),
  template_key: Joi.string().trim().allow("").max(120),
  title: Joi.string().trim().allow("").max(160),
  status: Joi.string().valid(...CV_STATUS),
  created_from_builder: Joi.boolean(),
}).min(1);

const expectedSalarySchema = Joi.object({
  min: Joi.number().min(0).allow(null),
  max: Joi.number().min(0).allow(null),
  currency_id: nullableObjectId(),
  currency_code: Joi.string().trim().uppercase().allow("").max(12),
  currency_symbol: Joi.string().trim().allow("").max(12),
  currency_rate_base: Joi.string().trim().uppercase().allow("").max(12),
  currency_rate: Joi.number().min(0),
  min_base: Joi.number().min(0).allow(null),
  max_base: Joi.number().min(0).allow(null),
})
  .min(1)
  .custom((value, helpers) => {
    if (value.min != null && value.max != null && Number(value.min) > Number(value.max)) {
      return helpers.message("expected_salary.min must be less than or equal to expected_salary.max");
    }
    if (value.min_base != null && value.max_base != null && Number(value.min_base) > Number(value.max_base)) {
      return helpers.message("expected_salary.min_base must be less than or equal to expected_salary.max_base");
    }
    return value;
  });

const schema = Joi.object({
  profile_headline: Joi.string().trim().allow("").max(160),
  current_job_title: Joi.string().trim().allow("").max(160),
  about_me: Joi.string().trim().allow("").max(5000),
  profile_completion: Joi.number().integer().min(0).max(100),

  candidate_stage: Joi.string().valid(...CANDIDATE_STAGES),
  is_student: Joi.boolean(),
  graduation_year: Joi.number().integer().min(1900).max(2200).allow(null),
  experience_years: Joi.number().integer().min(0).max(80),
  experience_level_id: nullableObjectId(),

  latest_work_experience: Joi.alternatives().try(experienceItemSchema, Joi.valid(null)),
  experience: Joi.array().items(experienceItemSchema),
  education: Joi.array().items(educationItemSchema),
  skills: Joi.array().items(skillItemSchema),
  languages: Joi.array().items(languageItemSchema),
  licenses: Joi.array().items(certificateItemSchema),
  testimony: Joi.array().items(certificateItemSchema),
  cvs: Joi.array().items(cvItemSchema),

  job_names: Joi.array().items(objectId()),
  job_types: Joi.array().items(objectId()),
  preferred_work_modes: Joi.array().items(objectId()),
  preferred_countries: Joi.array().items(objectId()),

  expected_salary: expectedSalarySchema,
  // min_salary كان موجودًا في الكنترولر القديم، لكنه غير موجود في EmployeeModel.
  min_salary: Joi.forbidden(),

  notice_period_id: nullableObjectId(),
  is_can_move: Joi.boolean(),
  is_free_for_work: Joi.boolean(),
  work_location: Joi.string().valid(...WORK_LOCATIONS),
  profile_visibility: Joi.string().valid(...PROFILE_VISIBILITY),
  links: Joi.array().items(linkItemSchema),
}).min(1);

async function ensureEmployeeForUser(user) {
  const account = await resolveAppAccount(user, { createMissingEmployee: true });
  if (account.accountType !== "employee" || !account.employee?._id) {
    const err = new Error("APP_ACCOUNT_NOT_EMPLOYEE");
    err.statusCode = 403;
    throw err;
  }
  return account.employee;
}

function normalizeCareerConsistency(value, employee) {
  const nextCandidateStage = value.candidate_stage ?? employee?.candidate_stage;
  const nextIsStudent = value.is_student ?? employee?.is_student;

  if (value.candidate_stage === "student" && value.is_student === undefined) {
    value.is_student = true;
  }

  if (value.is_student === true && value.candidate_stage === undefined && nextCandidateStage === "unknown") {
    value.candidate_stage = "student";
  }

  if (nextCandidateStage === "student" && nextIsStudent === false) {
    return {
      valid: false,
      messageAr: "لا يمكن أن تكون المرحلة student بينما is_student = false.",
      messageEn: "candidate_stage cannot be student while is_student is false.",
    };
  }

  return { valid: true };
}

function buildSearchFiltersPatch(value) {
  const patch = {};

  const careerFields = [
    "candidate_stage",
    "is_student",
    "graduation_year",
    "experience_years",
    "experience_level_id",
    "notice_period_id",
    "work_location",
    "is_can_move",
    "is_free_for_work",
    "profile_visibility",
  ];

  for (const field of careerFields) {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      patch[`search_filters.career.${field}`] = value[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(value, "expected_salary")) {
    const salary = value.expected_salary || {};
    for (const field of ["min", "max", "min_base", "max_base", "currency_id", "currency_code"]) {
      if (Object.prototype.hasOwnProperty.call(salary, field)) {
        patch[`search_filters.salary.${field}`] = salary[field];
      }
    }
  }

  return patch;
}

function buildEmployeeResponse(employee) {
  return {
    id: employee._id,
    profile_headline: employee.profile_headline,
    current_job_title: employee.current_job_title,
    about_me: employee.about_me,
    profile_completion: employee.profile_completion,
    candidate_stage: employee.candidate_stage,
    is_student: employee.is_student,
    graduation_year: employee.graduation_year,
    experience_years: employee.experience_years,
    experience_level_id: employee.experience_level_id,
    latest_work_experience: employee.latest_work_experience,
    experience: employee.experience,
    education: employee.education,
    skills: employee.skills,
    languages: employee.languages,
    licenses: employee.licenses,
    testimony: employee.testimony,
    cvs: employee.cvs,
    job_names: employee.job_names,
    job_types: employee.job_types,
    preferred_work_modes: employee.preferred_work_modes,
    preferred_countries: employee.preferred_countries,
    expected_salary: employee.expected_salary,
    notice_period_id: employee.notice_period_id,
    work_location: employee.work_location,
    profile_visibility: employee.profile_visibility,
    is_can_move: employee.is_can_move,
    is_free_for_work: employee.is_free_for_work,
    links: employee.links,
    status: employee.status,
    accepted: employee.accepted,
  };
}

const update = async (req, res, next) => {
  const lan = (req.get("lan") || "en").toLowerCase();

  try {
    const user = req.user;
    let employee = await ensureEmployeeForUser(user);

    if (employee.status === false) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: lan === "ar" ? "حسابك غير مفعل او تم حظره" : "Your account is inactive or blocked",
      });
    }

    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message.replace(/\"/g, "")).join("; ");
      return ReturnAppData.getError({
        res,
        status: 422,
        message:
          lan === "ar"
            ? `خطأ في التحقق من البيانات: ${details}`
            : `Validation error: ${details}`,
      });
    }

    const careerCheck = normalizeCareerConsistency(value, employee);
    if (!careerCheck.valid) {
      return ReturnAppData.getError({
        res,
        status: 422,
        message: lan === "ar" ? careerCheck.messageAr : careerCheck.messageEn,
      });
    }

    const updateDoc = { ...value, ...buildSearchFiltersPatch(value) };

    employee = await EmployeeModel.findOneAndUpdate(
      { user_id: user._id },
      { $set: updateDoc },
      { new: true, runValidators: true, context: "query" }
    );

    const response = {
      user: {
        id: user._id,
        first_name: user.first_name,
        mid_name: user.mid_name,
        last_name: user.last_name,
        full_name: [user.first_name, user.mid_name, user.last_name].filter(Boolean).join(" "),
        image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
        phone_country: user.phone_country,
        phone_code: user.phone_code,
        phone_national: user.phone_national,
        gender: user.gender,
      },
      employee: buildEmployeeResponse(employee),
    };

    return ReturnAppData.getData({
      res,
      data: response,
      message: lan === "ar" ? "تم تحديث ملف الموظف بنجاح." : "Employee profile updated successfully.",
    });
  } catch (err) {
    console.error("employee profile update error:", err);
    return ReturnAppData.getError({
      res,
      status: err.statusCode || 500,
      message:
        err.message === "EMPLOYEE_ROLE_NOT_FOUND"
          ? lan === "ar"
            ? "تعذر تحديد صلاحية الموظف."
            : "Unable to resolve employee role."
          : err.message === "APP_ACCOUNT_NOT_EMPLOYEE"
          ? lan === "ar"
            ? "هذا الإجراء متاح للموظفين فقط."
            : "This action is available for employee accounts only."
          : lan === "ar"
          ? "حدث خطأ غير متوقع."
          : "Internal server error.",
    });
  }
};

export default { update };
