import * as yup from "yup";
import { setLocale } from "yup";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel, jobsModel } from "../../../models/index.js";

/* نفس buildLocale الموجود لديك */
const buildLocale = (lan="en") => lan === "ar"
  ? {
      mixed: { required: "${path} مطلوب", notType: "${path} نوع غير صحيح" },
      string: { required: "${path} مطلوب", url: "${path} يجب أن يكون رابطًا صالحًا", email: "${path} يجب أن يكون بريدًا صحيحًا" },
      array: { min: "${path} يجب أن يحوي على الأقل ${min} عنصر" },
      boolean: { isValue: "${path} قيمة غير صحيحة" },
    }
  : undefined;

/* مخطط التعديل: جميع الحقول اختيارية مع نفس شروط الاعتمادية */
const editSchema = yup.object({
  job_name: yup.string().optional(),
  job_name_id: yup.string().optional(),

  jop_type_id: yup.string().optional(),
  jop_type_info: yup.object().optional(),

  jop_salary_id: yup.string().optional(),
  jop_salary_info: yup.object().optional(),

  languages: yup.object().optional(),

  description: yup.string().optional(),

  countries: yup.array().of(yup.string().trim().min(1)).min(1).optional(),
  currency_id: yup.string().optional(),

  is_send_emails: yup.boolean().optional(),
  emails: yup.array()
    .of(yup.string().trim().email())
    .when("is_send_emails", {
      is: true,
      then: (s) => s.min(1).required(),
      otherwise: (s) => s.optional(),
    }),

  is_cv_required: yup.boolean().optional(),
  is_contact_on_emails: yup.boolean().optional(),

  jop_time_id: yup.string().optional(),
  jop_time_info: yup.object().optional(),

  jop_service: yup.array().of(yup.string()).optional(),

  is_out_side: yup.boolean().optional(),
  show_company_information: yup.boolean().optional(),

  out_link: yup.string().url().when("is_out_side", {
    is: true,
    then: (s) => s.required("out_link مطلوب عند is_out_side=true"),
    otherwise: (s) => s.optional(),
  }),

  questions: yup.array().of(yup.object()).max(5).optional(),
})
.noUnknown(true, "حقل غير معروف: ${unknown}");

/* حقول لا يُسمح بتعديلها */
const PROTECTED_FIELDS = [
  "_id","user_id","company_id",
  "user_saved","user_review","out_side_applying","user_applying",
  "rating","rating_counts","rating_total",
  "createdAt","updatedAt",
];

export const update = async (req, res) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    setLocale(buildLocale(lan));

    const jobId = req.params.id;
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return ReturnAppData.createError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }

    // شركة المستخدم يجب أن تكون مفعلة ومقبولة
    const company = await CompanyModel.findOne({
      user_id: req.user._id,
      status: true,
      accepted: true,
    });
    if (!company) {
      return ReturnAppData.createError({
        res,
        message: lan === "ar"
          ? "لا يمكن تعديل الوظيفة حالياً. يرجى تفعيل حساب الشركة."
          : "Cannot edit job now. Activate your company account.",
      });
    }

    // التحقق من ملكية الوظيفة
    const job = await jobsModel.findById(jobId).select("_id company_id");
    if (!job || String(job.company_id) !== String(company._id)) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "الوظيفة غير موجودة أو لا تملك صلاحية تعديلها" : "Job not found or not owned",
      });
    }

    // منع تمرير الحقول المحمية حتى لو أُرسلت
    for (const k of PROTECTED_FIELDS) delete req.body[k];

    // تحقق الحمولة مع حذف الحقول غير المعروفة
    const payload = await editSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (Object.keys(payload).length === 0) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "لا توجد حقول صالحة للتعديل" : "No valid fields to update",
      });
    }
    payload.status=false;
    payload.is_update=true;
    const updated = await jobsModel.findOneAndUpdate(
      { _id: jobId, company_id: company._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    return ReturnAppData.createData({
      res,
      data: updated,
      message: lan === "ar" ? "تم تحديث الوظيفة" : "Job updated",
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
        status: 422,
        message: lan === "ar" ? "البيانات غير صالحة" : "Invalid payload",
        errors,
      });
    }
    return ReturnAppData.createError({
      res,
      status: 500,
      message: "Server error",
      errors: e?.message,
    });
  }
};

export default { update };
