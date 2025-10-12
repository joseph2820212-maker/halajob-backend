import mongoose from "mongoose";
import { jobsModel, UserApplyingJobModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { changeJobStatus } from "../../../notification/JobEmployeeNotifications.js";

const ALLOWED_STATUSES = new Set(["waiting", "accepted", "rejected", "auto_cancel"]);

export const changeStatus = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = String(req.params.id || "");
    const { status } = req.body || {};
    const user = req.user;

    const MSG = {
      BAD_ID: lan === "ar" ? "معرّف الطلب غير صالح." : "Invalid application id.",
      BAD_STATUS: lan === "ar" ? "حالة غير مدعومة." : "Unsupported status.",
      APP_404: lan === "ar" ? "طلب التوظيف غير موجود." : "Application not found.",
      JOB_403: lan === "ar" ? "غير مخوّل لتعديل هذه الوظيفة." : "Not authorized to modify this job.",
      OK: lan === "ar" ? "تم تحديث الحالة." : "Status updated.",
    };

    // تحقق من الحالة
    if (!ALLOWED_STATUSES.has(status)) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.BAD_STATUS });
    }

    // تحقق من المعرّف
    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.BAD_ID });
    }

    // اجلب الطلب
    const applied = await UserApplyingJobModel.findById(id).lean(false);
    if (!applied) {
      return ReturnAppData.createError({ res, status: 404, message: MSG.APP_404 });
    }

    // تأكيد ملكية صاحب العمل للوظيفة
    const job = await jobsModel.findOne({
      _id: applied.job_id,          // لا تبحث بالـ id الخاص بالطلب
      user_id: user._id,            // يجب أن تكون الوظيفة تابعة لصاحب الحساب
    }).lean(false);

    if (!job) {
      return ReturnAppData.createError({ res, status: 403, message: MSG.JOB_403 });
    }

    // حدّث حالة الطلب
    applied.status = status;
    applied.status_changed_at = new Date();
    await applied.save();

    // أرسل إشعارًا للمتقدّم
    await changeJobStatus(status, {
      user_id: applied.user_id,
      _id: applied.job_id,
      job_name: job.title ?? job.job_name ?? "",
      title: job.title ?? job.job_name ?? "",
    });

    return ReturnAppData.createData({
      res,
      status: 200,
      message: MSG.OK,
      data: {
        application_id: applied._id,
        job_id: applied.job_id,
        status: applied.status,
      },
    });
  } catch (err) {
    return ReturnAppData.createError({
      res,
      status: 500,
      message: String(err?.message || err),
    });
  }
};

export default { changeStatus };
