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
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";

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

const stateMessage = (lan, state) => {
  const ar = {
    none: "لم يتم إنشاء طلب شركة بعد",
    draft: "طلب الشركة غير مكتمل بعد",
    pending: "طلب الشركة قيد المراجعة",
    rejected: "تم رفض طلب الشركة",
    suspended: "تم إيقاف حساب الشركة مؤقتًا",
    unknown: "حالة حساب الشركة غير معروفة",
  };

  const en = {
    none: "A company request has not been created yet",
    draft: "Company request is not completed yet",
    pending: "Company request is under review",
    rejected: "Company request was rejected",
    suspended: "Company account has been temporarily suspended",
    unknown: "Unknown company account state",
  };

  return lan === "ar" ? ar[state] || ar.unknown : en[state] || en.unknown;
};

/* حالة الشركة */
const companyStatus = async (lan, owner_user_id) => {
  const company = await CompanyModel.findOne(buildCompanyOwnerQuery(owner_user_id)).lean();
  const state = getCompanyRequestState(company);

  if (state !== "approved") {
    return {
      is_error: true,
      status: state === "none" ? 404 : 403,
      message: stateMessage(lan, state),
      data: {
        request_state: state,
        accepted: company?.accepted === true,
        status: company?.status === true,
        can_upload: company?.can_upload === true,
      },
    };
  }

  return { is_error: false, company };
};

/* إحصائيات سريعة للوحة الشركة */
const companyData = async (req, res) => {
  try {
    const user = req.user;
    const lan = (req.get("lan") || "en").toLowerCase();

    const state = await companyStatus(lan, user._id);
    if (state.is_error) {
      return ReturnAppData.getError({
        res,
        message: state.message,
        status: state.status,
        data: state.data,
      });
    }

    const company = state.company;

    const [totalJob, applied, interviewed] = await Promise.all([
      jobsModel.countDocuments({ company_id: company._id }),
      UserApplyingJobModel.countDocuments({ company_id: company._id }),
      UserApplyingJobModel.countDocuments({
        company_id: company._id,
        is_send_interview: true,
      }),
    ]);

    return ReturnAppData.getData({
      res,
      data: { totalJob, applied, interviewed },
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

/* تفاصيل وظيفة محددة */
const getJobDetails = async (req, res) => {
  try {
    const user = req.user;
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = String(req.params.id || "").trim();

    const state = await companyStatus(lan, user._id);
    if (state.is_error) {
      return ReturnAppData.getError({
        res,
        message: state.message,
        status: state.status,
        data: state.data,
      });
    }

    const company = state.company;

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: lan === "ar" ? "معرّف غير صالح" : "Invalid id",
      });
    }

    const job = await jobsModel.findById(id).lean();
    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: lan === "ar" ? "لم يتم العثور على الوظيفة" : "Job not found",
      });
    }

    if (String(job.company_id) !== String(company._id)) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: lan === "ar" ? "ليست ضمن صلاحياتك" : "Forbidden",
      });
    }

    const jobId = new mongoose.Types.ObjectId(job._id);

    const [saved, applying, interviews, show, ratingAgg] = await Promise.all([
      UserSavedJobModel.countDocuments({ job_id: jobId }),
      UserApplyingJobModel.countDocuments({ job_id: jobId }),
      UserApplyingJobModel.countDocuments({
        job_id: jobId,
        is_send_interview: true,
      }),
      UserShowJobModel.countDocuments({ job_id: jobId }),
      UserRatingJobModel.aggregate([
        { $match: { job_id: jobId } },
        {
          $group: {
            _id: "$job_id",
            count: { $sum: 1 },
            avg: { $avg: "$rating" },
          },
        },
        {
          $project: {
            _id: 0,
            count: 1,
            avg: { $ifNull: ["$avg", 0] },
          },
        },
      ]),
    ]);

    const rating_count = ratingAgg[0]?.count ?? 0;
    const rating_avg = Number((ratingAgg[0]?.avg ?? 0).toFixed(2));

    return ReturnAppData.getData({
      res,
      data: { saved, applying, interviews, show, rating_count, rating_avg },
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
