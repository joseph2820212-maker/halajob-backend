import * as yup from "yup";
import { setLocale } from "yup";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel, jobsModel } from "../../../models/index.js";

const buildLocale = (lan="en") => lan === "ar"
  ? {
      mixed: {
        required: "${path} مطلوب",
        notType: "${path} نوع غير صحيح",
      },
      string: {
        required: "${path} مطلوب",
        url: "${path} يجب أن يكون رابطًا صالحًا",
        email: "${path} يجب أن يكون بريدًا صحيحًا",
      },
      array: {
        min: "${path} يجب أن يحوي على الأقل ${min} عنصر",
      },
      boolean: {
        isValue: "${path} قيمة غير صحيحة",
      },
    }
  : undefined; // استخدم الافتراضي بالإنجليزية

const jobSchema = yup.object({
  job_name: yup.string().required(),
  job_name_id: yup.string().optional(),

  jop_type_id: yup.string().required(),
  jop_type_info: yup.object().optional(),

  jop_salary_id: yup.string().required(),
  jop_salary_info: yup.object().required(),
languages:yup.object().optional(),
  description: yup.string().required(),

  countries: yup.array().of(yup.string().trim().min(1)).min(1).required(),
  currency_id: yup.string().required(),

  is_send_emails: yup.boolean().required(),
  emails: yup.array()
    .of(yup.string().trim().email())
    .when("is_send_emails", {
      is: true,
      then: (s) => s.min(1).required(),
      otherwise: (s) => s.optional(),
    }),

  is_cv_required: yup.boolean().required(),
  is_contact_on_emails: yup.boolean().required(),

  jop_time_id: yup.string().required(),
  jop_time_info: yup.object().optional(),

  jop_service: yup.array().of(yup.string()).optional(),

  is_out_side: yup.boolean().required(),
  show_company_information: yup.boolean().required(),

  out_link: yup.string().url().when("is_out_side", {
    is: true,
    then: (s) => s.required("out_link مطلوب عند is_out_side=true"),
    otherwise: (s) => s.optional(),
  }),

  questions: yup.array().of(yup.object()).max(5).optional(),
})
.noUnknown(true, "حقل غير معروف: ${unknown}");

export const create = async (req, res) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    setLocale(buildLocale(lan));

    const company = await CompanyModel.findOne({
      user_id: req.user._id,
      status: true,
      accepted: true,
    });
    if (!company) {
      return ReturnAppData.createError({
        res,
        message: lan === "ar"
          ? "لا يمكن إضافة وظيفة حالياً. يرجى تفعيل حساب الشركة."
          : "It is not possible to add a job currently. Please activate your company account.",
      });
    }

    const validated = await jobSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const job = await jobsModel.create({
      ...validated,
      company_id: company._id,
      user_id: req.user._id,
    });

    return ReturnAppData.createData({
      res,
      data: job,
      message: lan === "ar" ? "تم إنشاء الوظيفة" : "Job created",
    });
  } catch (e) {
    if (e.name === "ValidationError") {
      const lan = (req.get("lan") || "en").toLowerCase();
      const errors = e.inner?.length
        ? e.inner.reduce((acc, curr) => {
            const path = curr.path || "_";
            (acc[path] ||= []).push(curr.message);
            return acc;
          }, {})
        : { _: [e.message] };

      return ReturnAppData.createError({
        res,
        message: lan === "ar" ? "البيانات غير صالحة" : "Invalid payload",
        errors,
      });
    }
    return ReturnAppData.createError({ res, message: "Server error", errors: e?.message });
  }
};

export default { create };
