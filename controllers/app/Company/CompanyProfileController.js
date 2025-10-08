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

/* حالة الشركة */
const companyStatus = async (lan, user_id) => {
  const company = await CompanyModel.findOne({ user_id }).lean();
  if (!company) {
    return {
      is_error: true,
      status: 404,
      message: lan === "ar" ? "لم يتم انشاء حساب شركة بعد" : "A company account has not been created yet",
    };
  }

  const canUpload = company.can_upload === true;
  const accepted  = company.accepted   === true;
  const active    = company.status     === true;

  if (canUpload) {
    return {
      is_error: true,
      status: 403,
      message: lan === "ar" ? "لم يتم اكمال الطلب بعد" : "The application has not been completed yet",
    };
  }

  if (!accepted) {
    return {
      is_error: true,
      status: 403,
      message: lan === "ar" ? "لم يتم الموافقة على الطلب بعد" : "The application has not yet been approved",
    };
  }

  if (accepted && !active) {
    return {
      is_error: true,
      status: 403,
      message: lan === "ar" ? "تم ايقاف الحساب بشكل مؤقت" : "The account has been temporarily suspended",
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
      return ReturnAppData.getError({ res, message: state.message, status: state.status });
    }
    const company = state.company;

    const [totalJob, applied, interviewed] = await Promise.all([
      jobsModel.countDocuments({ company_id: company._id }),
      UserApplyingJobModel.countDocuments({ company_id: company._id }),                // كان country_id
      UserApplyingJobModel.countDocuments({ company_id: company._id, is_send_interview: true }),
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
      return ReturnAppData.getError({ res, message: state.message, status: state.status });
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
      UserApplyingJobModel.countDocuments({ job_id: jobId, is_send_interview: true }),
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
      data: { saved, applying, interviews, show, rating_count, rating_avg },
    });
  } catch (error) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: "internal error",
    });
  }
};

export default { companyData, getJobDetails };
