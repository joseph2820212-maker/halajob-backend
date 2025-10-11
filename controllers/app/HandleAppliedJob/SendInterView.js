import mongoose from "mongoose";
import { jobsModel, UserApplyingJobModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { SendInterViewNotification } from "../../../notification/JobEmployeeNotifications.js";

export const SendInterView = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = String(req.params.id || "");
    const {
      meet_link,
      date,
      is_online = false,
      is_on_app = false,
      is_in_office = false,
      office_address = "",
      note = "",
      longitude,
      latitude,
    } = req.body || {};
    const user = req.user;

    const MSG = {
      BAD_ID: lan === "ar" ? "معرّف الطلب غير صالح." : "Invalid application id.",
      APP_404: lan === "ar" ? "طلب التوظيف غير موجود." : "Application not found.",
      JOB_403: lan === "ar" ? "غير مخوّل لهذه الوظيفة." : "Not authorized for this job.",
      BAD_MEET: lan === "ar" ? "رابط أو تاريخ المقابلة غير صالح." : "Invalid interview link or date.",
      OK: lan === "ar" ? "تم إرسال تفاصيل المقابلة." : "Interview details sent.",
    };

    // تحقق من المعرّف
    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.BAD_ID });
    }

    // اجلب الطلب
    const applied = await UserApplyingJobModel.findById(id);
    if (!applied) {
      return ReturnAppData.createError({ res, status: 404, message: MSG.APP_404 });
    }

    // تأكيد ملكية صاحب العمل للوظيفة
    const job = await jobsModel.findOne({
      _id: applied.job_id,
      user_id: user._id,
    });
    if (!job) {
      return ReturnAppData.createError({ res, status: 403, message: MSG.JOB_403 });
    }

    // تحقق من بيانات المقابلة
    const interviewDate = new Date(date);
    const validDate = !isNaN(interviewDate.getTime());
    const validLink = typeof meet_link === "string" && meet_link.trim().length > 0;
    if (!validDate || !validLink) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.BAD_MEET });
    }

    // طبّق التحديث
    applied.is_send_interview = true;
    applied.send_interview_at = new Date();
    applied.interview_information = {
      meet_link: meet_link.trim(),
      date: interviewDate,
      is_online: Boolean(is_online),
      is_on_app: Boolean(is_on_app),
      is_in_office: Boolean(is_in_office),
      office_address: String(office_address || ""),
      note: String(note || ""),
      longitude: Number.isFinite(+longitude) ? +longitude : undefined,
      latitude: Number.isFinite(+latitude) ? +latitude : undefined,
    };
    await applied.save();

    // إشعار المتقدم
    await SendInterViewNotification({
      user_id: applied.user_id,
      job_id: applied.job_id,
      application_id: applied._id,
      job_name: job.title ?? job.job_name ?? "",
      meet_link: applied.interview_information.meet_link,
      date: applied.interview_information.date,
      is_online: applied.interview_information.is_online,
      is_on_app: applied.interview_information.is_on_app,
      is_in_office: applied.interview_information.is_in_office,
      office_address: applied.interview_information.office_address,
      note: applied.interview_information.note,
      longitude: applied.interview_information.longitude,
      latitude: applied.interview_information.latitude,
    });

    return ReturnAppData.createResponse({
      res,
      status: 200,
      message: MSG.OK,
      data: {
        application_id: applied._id,
        job_id: applied.job_id,
        interview_information: applied.interview_information,
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

export default { SendInterView };
