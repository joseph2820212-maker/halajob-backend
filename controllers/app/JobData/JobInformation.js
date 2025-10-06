import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  UserReviewJobModel,
  UserOutSideApplyingJobModel,
  UserRatingJobModel,
  UserSavedJobModel,
} from "../../../models/index.js";

/* أدوات مساعدة */
const incJob = (jobId, inc) => jobsModel.updateOne({ _id: jobId }, { $inc: inc });
const clampSavedMinus1 = (jobId) =>
  jobsModel.updateOne(
    { _id: jobId },
    [
      {
        $set: {
          user_saved: {
            $max: [0, { $add: ["$user_saved", -1] }],
          },
        },
      },
    ]
  );

/* يحسب المتوسط ويحدّث jobs.rating */
async function recomputeJobRating(jobId) {
  const agg = await UserRatingJobModel.aggregate([
    { $match: { job_id: new mongoose.Types.ObjectId(jobId) } },
    { $group: { _id: "$job_id", avg: { $avg: "$rating" } } },
  ]);
  const avg = agg[0]?.avg ?? 0;
  await jobsModel.updateOne({ _id: jobId }, { $set: { rating: Number(avg.toFixed(1)) } });
  return avg;
}

/* -------------------------------------------
   مراجعة وظيفة: يزيد user_review عند الإنشاء فقط
------------------------------------------- */
 const reviewJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const { message } = req.body;

    const MSG = {
      MISSING: lan === "ar" ? "البيانات ناقصة." : "Missing required fields.",
      JOB_404: lan === "ar" ? "الوظيفة غير موجودة." : "Job not found.",
      OK_NEW: lan === "ar" ? "تم إضافة المراجعة." : "Review created.",
      OK_UPDATE: lan === "ar" ? "تم تحديث المراجعة." : "Review updated.",
    };

    if (!mongoose.isValidObjectId(id) || !message?.trim()) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.MISSING });
    }

    const job = await jobsModel.findById(id).select("_id");
    if (!job) return ReturnAppData.createError({ res, status: 404, message: MSG.JOB_404 });

    const raw = await UserReviewJobModel.findOneAndUpdate(
      { user_id: user._id, job_id: id },
      { $set: { message: message.trim() } },
      { upsert: true, new: true, rawResult: true }
    );

    const created = Boolean(raw?.lastErrorObject?.upserted);
    if (created) await incJob(id, { user_review: 1 });

    return ReturnAppData.createData({
      res,
      data: raw.value,
      message: created ? MSG.OK_NEW : MSG.OK_UPDATE,
    });
  } catch (e) {
    next(e);
  }
};

/* -------------------------------------------
   طلب توظيف خارجي: يزيد out_side_applying
------------------------------------------- */
 const applyOutsideJob = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const id = req.params.id;

    const MSG = {
      MISSING: lan === "ar" ? "البيانات ناقصة." : "Missing fields.",
      BAD_ID: lan === "ar" ? "معرّف الوظيفة غير صالح." : "Invalid job id.",
      JOB_404: lan === "ar" ? "الوظيفة غير موجودة." : "Job not found.",
      OK: lan === "ar" ? "تم تقديم الطلب." : "Application submitted.",
    };

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.MISSING });
    }
    const job = await jobsModel.findById(id).select("_id");
    if (!job) return ReturnAppData.createError({ res, status: 404, message: MSG.JOB_404 });

    const doc = await UserOutSideApplyingJobModel.create({
      user_id: user._id,
      job_id:id,
    });

    await incJob(id, { out_side_applying: 1 });

    return ReturnAppData.createData({ res, data: doc, message: MSG.OK });
  } catch (e) {
    next(e);
  }
};

/* -------------------------------------------
   تقييم وظيفة: يحدّث متوسط rating في jobs
------------------------------------------- */
 const rateJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const { rating } = req.body;

    const MSG = {
      INVALID: lan === "ar" ? "تقييم غير صالح." : "Invalid rating.",
      OK_NEW: lan === "ar" ? "تم إضافة التقييم." : "Rating added.",
      OK_UPDATE: lan === "ar" ? "تم تحديث التقييم." : "Rating updated.",
    };

    if (!mongoose.isValidObjectId(id) || typeof rating !== "number" || rating < 1 || rating > 5) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.INVALID });
    }

    const raw = await UserRatingJobModel.findOneAndUpdate(
      { user_id: user._id, job_id: id },
      { $set: { rating } },
      { upsert: true, new: true, rawResult: true }
    );
    const created = Boolean(raw?.lastErrorObject?.upserted);

    const avg = await recomputeJobRating(id);

    return ReturnAppData.createData({
      res,
      data: { ratingDoc: raw.value, jobRatingAvg: avg, created },
      message: created ? MSG.OK_NEW : MSG.OK_UPDATE,
    });
  } catch (e) {
    next(e);
  }
};

/* -------------------------------------------
   حفظ/إلغاء حفظ وظيفة: يعدّل user_saved
------------------------------------------- */
 const toggleSaveJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;

    const MSG = {
      SAVED: lan === "ar" ? "تم حفظ الوظيفة." : "Job saved.",
      REMOVED: lan === "ar" ? "تم إزالة الوظيفة من المحفوظات." : "Job removed.",
    };

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: "bad id" });
    }

    const existing = await UserSavedJobModel.findOne({ user_id: user._id, job_id: id });

    if (existing) {
      await UserSavedJobModel.deleteOne({ _id: existing._id });
      // إنقاص مع عدم السماح بالسالب
      await clampSavedMinus1(id);
      return ReturnAppData.createData({ res, message: MSG.REMOVED });
    }

    await UserSavedJobModel.create({ user_id: user._id, job_id: id });
    await incJob(id, { user_saved: 1 });
    return ReturnAppData.createData({ res, message: MSG.SAVED });
  } catch (e) {
    next(e);
  }
};

//-------------------------------------------

/* ========== 1) جلب آخر التعليقات 5 مع اسم المستخدم ========== */
 const listJobReviews = async (req, res, next) => {
  try {
    const id = req.params.id;
    const page = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = 5;

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: "bad id" });
    }

    // lookup على مجموعة users لإرجاع الاسم ومعرّف المستخدم
    const rows = await UserReviewJobModel.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(id) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: page * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "u",
          pipeline: [{ $project: { first_name: 1, last_name: 1 } }],
        },
      },
      {
        $project: {
          _id: 1,
          message: 1,
          createdAt: 1,
          user: {
            _id: "$user_id",
            name: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: [{ $arrayElemAt: ["$u.first_name", 0] }, ""] },
                    " ",
                    { $ifNull: [{ $arrayElemAt: ["$u.last_name", 0] }, ""] },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    return ReturnAppData.getData({
      res,
      data:rows,
      other: { page, hasMore: rows.length === limit }
    });
  } catch (e) {
    next(e);
  }
};

/* ========== 2) إعادة احتساب تقييم الوظيفة مع تفصيل العدّادات ========== */
/**
 * يحسب توزيع التقييمات 1..5 من UserRatingJobModel
 * ويحدّث jobs.rating و jobs.rating_counts و jobs.rating_total
 */
 const recomputeJobRatingBreakdown = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: "bad id" });
    }

    const agg = await UserRatingJobModel.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$rating", c: { $sum: 1 } } },
    ]);

    // بناء counts بشكل ثابت للمستويات 1..5
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of agg) {
      const key = String(r._id);
      if (counts[key] !== undefined) counts[key] = r.c;
    }

    const total =
      counts[1] + counts[2] + counts[3] + counts[4] + counts[5];

    const weighted =
      total === 0
        ? 0
        : (1 * counts[1] +
           2 * counts[2] +
           3 * counts[3] +
           4 * counts[4] +
           5 * counts[5]) / total;

    const avg = Number(weighted.toFixed(1));

    await jobsModel.updateOne(
      { _id: id },
      {
        $set: {
          rating: avg,
          rating_counts: counts, // مثال: {1:2, 2:6, 3:7, 4:8, 5:56}
          rating_total: total,
        },
      }
    );

    return ReturnAppData.getData({
      res,
      data: { avg, counts, total },
      message: "rating recomputed",
    });
  } catch (e) {
    next(e);
  }
};

/* ========== 3) جلب من حفظ الوظيفة 5 بالأحدث مع الاسم والمعرّف ========== */
 const listJobSavers = async (req, res, next) => {
  try {
    const id = req.params.id;
    const page = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = 5;

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: "bad id" });
    }

    const rows = await UserSavedJobModel.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(id) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: page * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "u",
          pipeline: [{ $project: { first_name: 1, last_name: 1 } }],
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          user: {
            _id: "$user_id",
            name: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: [{ $arrayElemAt: ["$u.first_name", 0] }, ""] },
                    " ",
                    { $ifNull: [{ $arrayElemAt: ["$u.last_name", 0] }, ""] },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    return ReturnAppData.getData({
      res,
      data:rows ,
      other:{ page, hasMore: rows.length === limit }
    });
  } catch (e) {
    next(e);
  }
};

/* ========== صدّر مع الدوال السابقة لديك ========== */
export default {
  reviewJob,
  applyOutsideJob,
  rateJob,
  toggleSaveJob,
  listJobReviews,
  recomputeJobRatingBreakdown,
  listJobSavers,
};

