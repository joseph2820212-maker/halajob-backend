import * as yup from "yup";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel, jobsModel } from "../../../models/index.js";

const jobSchema = yup.object({
  job_name: yup.string().required(),
  job_name_id: yup.string().optional(),
  work_location_id: yup.string().required(),
  jop_type_id: yup.string().required(),
  jop_type_info: yup.object().optional(),
  jop_salary_id: yup.string().required(),
  jop_salary_info: yup.object().required(),
  description: yup.string().required(),
  country_id:yup.string().required(),
  currency_id:yup.string().required(),
  is_send_emails: yup.boolean().required(),
  emails: yup.array(yup.string().email()).when("is_send_emails", {
    is: true,
    then: (s) => s.min(1).required(),
    otherwise: (s) => s.optional(),
  }),
  is_cv_required: yup.boolean().required(),
  is_contact_on_emails: yup.boolean().required(),
  jop_time_id: yup.string().required(),
  jop_time_info: yup.object().optional(),
  jop_service: yup.array(yup.string()).optional(),
  is_out_side: yup.boolean().required(),
  show_company_information: yup.boolean().required(),
  out_link: yup.string().url().when("is_out_side", {
    is: true,
    then: (s) => s.required("out_link مطلوب عند is_out_side=true"),
    otherwise: (s) => s.optional(),
  }),
  questions: yup.array(yup.object()).max(5).optional(),
});

const t = (lan, ar, en) => (lan === "ar" ? ar : en);

export const create = async (req, res) => {
  try {
    // عرّف lan هنا
    const lan = (req.get("lan") || "en").toLowerCase();

    const company = await CompanyModel.findOne({
      user_id: req.user._id,
      status: true,
      accepted: true,
    });
    if (!company) {
      return ReturnAppData.createError({
        res,
        message: t(
          lan,
          "لا يمكن إضافة وظيفة حالياً. يرجى تفعيل حساب الشركة.",
          "It is not possible to add a job currently. Please activate your company account."
        ),
      });
    }

    const validated = await jobSchema.validate(req.body, {
      abortEarly: false,
    });

    const data = {
      ...validated,
      company_id: company._id,
      user_id: req.user._id,
    };

    const job = await jobsModel.create(data);

    return ReturnAppData.createData({
      res,
      data: job,
      message: t(lan, "تم إنشاء الوظيفة", "Job created"),
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
        message: t(lan, "البيانات غير صالحة", "Invalid payload"),
        errors,
      });
    }

    return ReturnAppData.createError({
      res,
      message: "Server error",
      errors: e?.message,
    });
  }
};

export default { create };
