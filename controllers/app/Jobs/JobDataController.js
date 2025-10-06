import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CompanyModel,
  jobsModel,
  UserReviewJobModel,
  UserRatingJobModel,
  UserSavedJobModel,
} from "../../../models/index.js";

/* أسماء المجموعات المساعدة للعدّ */
const REV_COLL = UserReviewJobModel.collection.name;
const SAVE_COLL = UserSavedJobModel.collection.name;

/* تحقق شركة المالك */
async function ensureCompany(req, res) {
  const lan = (req.get("lan") || "en").toLowerCase();
  const company = await CompanyModel.findOne({
    user_id: req.user._id,
    status: true,
    accepted: true,
  }).select("_id");
  if (!company) {
    ReturnAppData.getError({
      res,
      status: 403,
      message: lan === "ar"
        ? "لا يمكن عرض بيانات الوظيفة حالياً."
        : "Job data cannot be displayed currently.",
    });
    return null;
  }
  return company;
}

/* 0) الوظائف التي أنشأتها الشركة (بالأحدث) */
 const getCreatedJobs = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const page = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "10", 10)));
    const q = (req.query.q ?? "").trim();

    const company = await ensureCompany(req, res);
    if (!company) return;

    const $match = { company_id: company._id };
    if (q) {
      $match.$or = [
        { job_name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const items = await jobsModel.aggregate([
      { $match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: page * limit },
      { $limit: limit },

      // عدّ المراجعات
      {
        $lookup: {
          from: REV_COLL,
          let: { jid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$job_id", "$$jid"] } } },
            { $count: "c" },
          ],
          as: "reviews",
        },
      },
      // عدّ الحفظ
      {
        $lookup: {
          from: SAVE_COLL,
          let: { jid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$job_id", "$$jid"] } } },
            { $count: "c" },
          ],
          as: "saves",
        },
      },

      {
        $project: {
          _id: 1,
          job_name: 1,
          jop_type_id: 1,
          jop_salary_id: 1,
          rating: 1,
          createdAt: 1,
          updatedAt: 1,
          reviews_count: { $ifNull: [{ $arrayElemAt: ["$reviews.c", 0] }, 0] },
          saves_count: { $ifNull: [{ $arrayElemAt: ["$saves.c", 0] }, 0] },
        },
      },
    ]);

    // hasMore تقريبي دون total كامل لتوفير الاستعلام
    const hasMore = items.length === limit;

    return ReturnAppData.createData({
      res,
      data: { page, limit, hasMore, items },
    });
  } catch (e) {
    next(e);
  }
};

/* 1) بيانات الوظيفة بالمعرّف */
const getJobById = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.getError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }
    const company = await ensureCompany(req, res);
    if (!company) return;

    const job = await jobsModel.findOne({ _id: id, company_id: company._id }).select("job_name createdAt updatedAt").lean();
    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: lan === "ar" ? "لم يتم العثور على الوظيفة" : "Job not found",
      });
    }
    return ReturnAppData.getData({ res, data: job });
  } catch (e) {
    next(e);
  }
};

/* 2) تعليقات الوظيفة */
 const getJobReviews = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = req.params.id;
    const page = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "5", 10)));

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.getError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }
    const company = await ensureCompany(req, res);
    if (!company) return;

    const owned = await jobsModel.exists({ _id: id, company_id: company._id });
    if (!owned) {
      return ReturnAppData.getError({ res, status: 404, message: lan === "ar" ? "الوظيفة غير موجودة" : "Job not found" });
    }

    const items = await UserReviewJobModel.aggregate([
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

    return ReturnAppData.createData({
      res,
      data: { page, limit, hasMore: items.length === limit, items },
    });
  } catch (e) {
    next(e);
  }
};

/* 3) توزيع وتفاصيل التقييم دون تعديل قاعدة البيانات */
 const getJobRatingStats = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.getError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }
    const company = await ensureCompany(req, res);
    if (!company) return;

    const owned = await jobsModel.exists({ _id: id, company_id: company._id });
    if (!owned) {
      return ReturnAppData.getError({ res, status: 404, message: lan === "ar" ? "الوظيفة غير موجودة" : "Job not found" });
    }

    const agg = await UserRatingJobModel.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$rating", c: { $sum: 1 } } },
    ]);

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of agg) {
      const key = String(r._id);
      if (counts[key] !== undefined) counts[key] = r.c;
    }
    const total = counts[1] + counts[2] + counts[3] + counts[4] + counts[5];
    const avg = total
      ? Number(
          (
            (1 * counts[1] + 2 * counts[2] + 3 * counts[3] + 4 * counts[4] + 5 * counts[5]) /
            total
          ).toFixed(1)
        )
      : 0;

    return ReturnAppData.createData({ res, data: { avg, counts, total } });
  } catch (e) {
    next(e);
  }
};

/* 4) من قام بحفظ الوظيفة */
 const getJobSavers = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = req.params.id;
    const page = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "5", 10)));

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.getError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }
    const company = await ensureCompany(req, res);
    if (!company) return;

    const owned = await jobsModel.exists({ _id: id, company_id: company._id });
    if (!owned) {
      return ReturnAppData.getError({ res, status: 404, message: lan === "ar" ? "الوظيفة غير موجودة" : "Job not found" });
    }

    const items = await UserSavedJobModel.aggregate([
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

    return ReturnAppData.createData({
      res,
      data: { page, limit, hasMore: items.length === limit, items },
    });
  } catch (e) {
    next(e);
  }
};

export default {
  getCreatedJobs,
  getJobById,
  getJobReviews,
  getJobRatingStats,
  getJobSavers,
};
