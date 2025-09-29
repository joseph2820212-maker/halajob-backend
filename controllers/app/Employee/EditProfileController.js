// controllers/employee/update.js
import Joi from "joi";
import mongoose from "mongoose";
import { EmployeeModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}
// Validator helpers
const objectId = () =>
  Joi.string().custom((v, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(v)) return helpers.error("any.invalid");
    return v;
  });

const schema = Joi.object({
  // كل الحقول اختيارية للتحديث الجزئي
  latest_work_experience: Joi.object({
    name: Joi.string().trim().min(2).max(200),
    company: Joi.string().trim().min(2).max(200),
  }).min(1),

  education: Joi.array()
    .items(
      Joi.object({
        level: Joi.string().trim().min(2).max(100).required(),
        study: Joi.string().trim().min(2).max(200).required(),
      })
    )
    .min(1),

  skills: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().min(2).max(100).required(),
        years: Joi.number().integer().min(0).max(80).required(),
      })
    )
    .min(1),

  languages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        level: Joi.number().integer().min(1).max(5).required(),
      })
    )
    .min(1),

  licenses: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(2).max(150).required(),
        end_in: Joi.date().allow(null),
        is_for_ever: Joi.boolean().required(),
      }).custom((val, helpers) => {
        if (!val.is_for_ever && !val.end_in) {
          return helpers.error("any.required", { key: "end_in" });
        }
        return val;
      })
    )
    .min(1),

  testimony: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(2).max(150).required(),
        end_in: Joi.date().allow(null),
        is_for_ever: Joi.boolean().required(),
      }).custom((val, helpers) => {
        if (!val.is_for_ever && !val.end_in) {
          return helpers.error("any.required", { key: "end_in" });
        }
        return val;
      })
    )
    .min(1),

  job_names: Joi.array().items(Joi.string().trim().min(2).max(120)).min(1),

  job_types: Joi.array().items(objectId()).min(1),

  min_salary: Joi.array()
    .items(
      Joi.object({
        amount: Joi.number().min(0).required(),
        ber: Joi.string().valid("year", "month", "day", "hour").required(),
      })
    )
    .min(1),

  work_location: Joi.string().valid("remote", "personal", "in_office"),

  is_can_move: Joi.boolean(),
  is_free_for_work: Joi.boolean(),
}).min(1); // يجب أن يحتوي الطلب على حقل واحد على الأقل

 const update = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = (req.get("lan") || "en").toLowerCase();

    // تحقق من وجود حساب موظف
    let employee = await EmployeeModel.findOne({ user_id: user._id });
    if (!employee) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message:
          lan === "ar"
            ? "حسابك غير مفعل او تم حظره"
            : "Your account is inactive or blocked",
      });
    }

    // تحقق الإدخال
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details =
        lan === "ar"
          ? error.details.map((d) => d.message.replace(/\"/g, "")).join("; ")
          : error.details.map((d) => d.message).join("; ");

      return ReturnAppData.getError({
        res,
        status: 422,
        message:
          lan === "ar"
            ? `خطأ في التحقق من البيانات: ${details}`
            : `Validation error: ${details}`,
      });
    }

    // تحضير بيانات التحديث فقط لما أرسله العميل
    const updateDoc = {};
    for (const key of Object.keys(value)) {
      updateDoc[key] = value[key];
    }

    // تنفيذ التحديث
    employee = await EmployeeModel.findOneAndUpdate(
      { user_id: user._id },
      { $set: updateDoc },
      { new: true }
    );

    // بناء الاستجابة
    const response = {
      user: {
        first_name: user.first_name,
        mid_name: user.mid_name,
        last_name: user.last_name,
        image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
        phone_country: user.phone_country,
        phone_national: user.phone_national,
      },
      employee: {
        latest_work_experience: employee.latest_work_experience,
        education: employee.education,
        skills: employee.skills,
        languages: employee.languages,
        licenses: employee.licenses,
        testimony: employee.testimony,
        job_names: employee.job_names,
        job_types: employee.job_types,
        min_salary: employee.min_salary,
        work_location: employee.work_location,
        is_can_move: employee.is_can_move,
        is_free_for_work: employee.is_free_for_work,
      },
    };

    return ReturnAppData.getData({ res, data: response });
  } catch (err) {
   console.log('====================================');
   console.log(err);
   console.log('====================================');
    return ReturnAppData.getError({
      res,
      status: 500,
      message: "Internal server error",
      debug: err,
    });
  }
};

export default {update};
