import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CompanyModel,
  jobsModel,
  UserApplyingJobModel,
  UserRatingJobModel,
  UserSavedJobModel,
  UserShowJobModel,
} from "../../../models/index.js";

const t = (lan, ar, en) => (lan === "ar" ? ar : en);
const getLan = (req) => String(req.get("lan") || "en").toLowerCase();

const getCompanyRequestState = (company) => {
  if (!company) return "none";

  const accepted = company.accepted === true;
  const active = company.status === true;
  const canUpload = company.can_upload === true;

  if (accepted && active) return "approved";
  if (accepted && !active) return "suspended";
  if (!accepted && !active && canUpload) return "draft";
  if (!accepted && !active && !canUpload) return "pending";
  if (!accepted && active) return "rejected";

  return "unknown";
};

const requestStateMessage = (lan, state) => {
  const messages = {
    none: ["لم يتم إنشاء حساب شركة بعد", "A company account has not been created yet"],
    draft: ["لم يتم إكمال طلب الشركة بعد", "The company request has not been completed yet"],
    pending: ["طلب الشركة قيد المراجعة", "The company request is under review"],
    rejected: ["تم رفض طلب الشركة، يمكنك تعديل البيانات وإعادة الإرسال", "The company request was rejected. You can update it and resubmit"],
    suspended: ["تم إيقاف حساب الشركة مؤقتًا", "The company account has been temporarily suspended"],
    unknown: ["حالة الشركة غير معروفة", "Unknown company state"],
  };

  const message = messages[state] || messages.unknown;
  return t(lan, message[0], message[1]);
};

const companyStatus = async (lan, user_id) => {
  const company = await CompanyModel.findOne({ user_id }).lean();
  const state = getCompanyRequestState(company);

  if (state !== "approved") {
    return {
      is_error: true,
      status: state === "none" ? 404 : 403,
      request_state: state,
      message: requestStateMessage(lan, state),
    };
  }

  return { is_error: false, request_state: state, company };
};

const companyData = async (req, res) => {
  try {
    const user = req.user;
    const lan = getLan(req);

    const state = await companyStatus(lan, user._id);
    if (state.is_error) {
      return ReturnAppData.getError({
        res,
        status: state.status,
        message: state.message,
        data: { request_state: state.request_state },
      });
    }

    const company = state.company;
    const companyId = new mongoose.Types.ObjectId(company._id);

    const [totalJob, activeJobs, applied, interviewed] = await Promise.all([
      jobsModel.countDocuments({ company_id: companyId }),
      jobsModel.countDocuments({ company_id: companyId, status: true }),
      UserApplyingJobModel.countDocuments({ company_id: companyId }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, is_send_interview: true }),
    ]);

    return ReturnAppData.getData({
      res,
      data: {
        request_state: state.request_state,
        totalJob,
        activeJobs,
        applied,
        interviewed,
      },
    });
  } catch (error) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: "internal error",
      meta: { error: error?.message },
    });
  }
};

const getJobDetails = async (req, res) => {
  try {
    const user = req.user;
    const lan = getLan(req);
    const id = String(req.params.id || "").trim();

    const state = await companyStatus(lan, user._id);
    if (state.is_error) {
      return ReturnAppData.getError({
        res,
        status: state.status,
        message: state.message,
        data: { request_state: state.request_state },
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: t(lan, "معرّف غير صالح", "Invalid id"),
      });
    }

    const company = state.company;
    const companyId = new mongoose.Types.ObjectId(company._id);
    const jobId = new mongoose.Types.ObjectId(id);

    const job = await jobsModel.findOne({ _id: jobId, company_id: companyId }).lean();
    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: t(lan, "لم يتم العثور على الوظيفة ضمن شركتك", "Job was not found under your company"),
      });
    }

    const [saved, applying, interviews, show, ratingAgg] = await Promise.all([
      UserSavedJobModel.countDocuments({ job_id: jobId }),
      UserApplyingJobModel.countDocuments({ job_id: jobId, company_id: companyId }),
      UserApplyingJobModel.countDocuments({ job_id: jobId, company_id: companyId, is_send_interview: true }),
      UserShowJobModel.countDocuments({ job_id: jobId }),
      UserRatingJobModel.aggregate([
        { $match: { job_id: jobId } },
        { $group: { _id: "$job_id", count: { $sum: 1 }, avg: { $avg: "$rating" } } },
        { $project: { _id: 0, count: 1, avg: { $ifNull: ["$avg", 0] } } },
      ]),
    ]);

    const rating_count = ratingAgg[0]?.count ?? 0;
    const rating_avg = Number((ratingAgg[0]?.avg ?? 0).toFixed(2));

    return ReturnAppData.getData({
      res,
      data: {
        request_state: state.request_state,
        job: {
          id: job._id,
          title: job.title || job.job_title || job.name || "",
          status: job.status,
          createdAt: job.createdAt,
        },
        metrics: {
          saved,
          applying,
          interviews,
          show,
          rating_count,
          rating_avg,
        },
      },
    });
  } catch (error) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: "internal error",
      meta: { error: error?.message },
    });
  }
};

export default { companyData, getJobDetails };
