import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { jobsModel, UserApplyingJobModel } from "../../../models/index.js";
import { job_applied_notification } from "../../../notification/JobCompanyNotifications.js";

/**
 * تقديم طلب توظيف داخلي
 */
const applyJob = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const { answers = [], cv = "", cover_letter = "" } = req.body;
    const id = req.params.id;

    const MSG = {
      MISSING : lan === "ar" ? "المعطيات ناقصة." : "Missing required fields.",
      BAD_ID  : lan === "ar" ? "معرّف الوظيفة غير صالح." : "Invalid job id.",
      JOB_404 : lan === "ar" ? "الوظيفة غير موجودة." : "Job not found.",
      DUPLICATE: lan === "ar" ? "لقد قدمت طلبًا لهذه الوظيفة مسبقًا." : "Application already submitted.",
      OK      : lan === "ar" ? "تم تقديم الطلب بنجاح." : "Application submitted successfully.",
    };

    if (!mongoose.isValidObjectId(id))
      return ReturnAppData.createError({ res, status: 400, message: MSG.BAD_ID });

    if (!user?.first_name || !user?.last_name || !user?.email || !user?.phone_code || !user?.phone_national)
      return ReturnAppData.createError({ res, status: 400, message: MSG.MISSING });

    const job = await jobsModel.findById(id).lean();
    if (!job)
      return ReturnAppData.createError({ res, status: 404, message: MSG.JOB_404 });

    const countryId =
      mongoose.isValidObjectId(req.body.country_id) ? req.body.country_id
      : mongoose.isValidObjectId(user.country_id)   ? user.country_id
      : undefined;

    const payload = {
      user_id: user._id,
      job_id: id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_code: user.phone_code,
      phone_national: user.phone_national,
      answers: Array.isArray(answers) ? answers : [],
      cv,
      cover_letter,
    };
    if (countryId) payload.country_id = countryId;

    // 1) أنشئ الطلب. الفهرس الفريد يمنع التكرار.
    let created;
    try {
      created = await UserApplyingJobModel.create(payload);
    } catch (e) {
      if (e?.code === 11000) {
        return ReturnAppData.createError({ res, status: 409, message: MSG.DUPLICATE });
      }
      throw e;
    }

    // 2) زد العداد بعد نجاح الإنشاء.
    await jobsModel.updateOne({ _id: id }, { $inc: { user_applying: 1 } });

    // 3) الإشعار خارج مسار الاستجابة.
    job_applied_notification(job).catch(console.error);

    return ReturnAppData.createData({ res, data: created, message: MSG.OK });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

/**
 * وظائف قدّم لها المستخدم الحالي مع job_name و company_name و is_saved
 * GET /user/v1/applied-jobs?page=0&limit=5
 */

const getAppliedJobs = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;

    const page  = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "5", 10)));

    if (!user?._id) {
      return ReturnAppData.createError({ res, status: 401, message: lan === "ar" ? "غير مصرح" : "Unauthorized" });
    }

    const items = await UserApplyingJobModel.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(user._id) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: page * limit },
      { $limit: limit },

      // الوظيفة
      {
        $lookup: {
          from: "jobs",
          localField: "job_id",
          foreignField: "_id",
          as: "job",
          pipeline: [
            { $project: { _id: 1, job_name: 1, company_id: 1 } } // استخدم job_name فعليًا
          ]
        }
      },
      { $set: { job: { $first: "$job" } } },

      // الشركة
      {
        $lookup: {
          from: "companies",
          localField: "job.company_id",
          foreignField: "_id",
          as: "company",
          pipeline: [
            { $project: { _id: 1, company_name: 1 } } // استخدم company_name فعليًا
          ]
        }
      },
      { $set: { company: { $first: "$company" } } },

      // هل محفوظ
      {
        $lookup: {
          from: "user_saved_jobs",
          let: { jid: "$job_id", uid: "$user_id" },
          pipeline: [
            { $match: { $expr: { $and: [
              { $eq: ["$job_id", "$$jid"] },
              { $eq: ["$user_id", "$$uid"] },
            ] } } },
            { $limit: 1 }
          ],
          as: "saved"
        }
      },

      // الإخراج
      {
        $project: {
          _id: 1,
          status:1,
          status_changed_at:1,
          applied_at: "$createdAt",
          job: {
            _id: "$job._id",
            job_name: { $ifNull: ["$job.job_name", ""] }
          },
          company: {
            _id: "$company._id",
            company_name: { $ifNull: ["$company.company_name", ""] }
          },
          is_saved: { $gt: [{ $size: "$saved" }, 0] }
        }
      }
    ]);

    return ReturnAppData.createData({
      res,
      data: { page, limit, hasMore: items.length === limit, items },
    });
  } catch (e) {
    next(e);
  }
};

export default { applyJob ,getAppliedJobs};
