import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  UserReviewJobModel,
  UserOutSideApplyingJobModel,
  UserRatingJobModel,
  UserSavedJobModel,
  JobReportModel,
} from "../../../models/index.js";
import {
  job_applied_notification,
  job_rated_notification,
  job_reviewed_notification,
  job_seeker_saved_notification,
} from "../../../notification/JobCompanyNotifications.js";

const { Types } = mongoose;
const toObjectId = (value) => (mongoose.isValidObjectId(String(value || "")) ? new Types.ObjectId(String(value)) : null);
const msg = (req, ar, en) => (String(req.get("lan") || "en").toLowerCase().startsWith("ar") ? ar : en);
const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const publicJobFilter = () => {
  const now = new Date();
  return {
    status: true,
    is_accepted: true,
    publish_status: { $in: ["published", null] },
    $and: [
      { $or: [{ started_date: null }, { started_date: { $lte: now } }] },
      { $or: [{ end_date: null }, { end_date: { $gte: now } }] },
      { $or: [{ apply_deadline: null }, { apply_deadline: { $gte: now } }] },
    ],
  };
};

const clampInc = (jobId, field, value) => {
  if (value >= 0) return jobsModel.updateOne({ _id: jobId }, { $inc: { [field]: value, [`search_index.score_signals.${field === "user_saved" ? "saves" : field === "user_review" ? "reviews" : "views"}`]: value } });
  return jobsModel.updateOne({ _id: jobId }, [{ $set: { [field]: { $max: [0, { $add: [`$${field}`, value] }] } } }]);
};

const recomputeJobRating = async (jobId) => {
  const agg = await UserRatingJobModel.aggregate([
    { $match: { job_id: new Types.ObjectId(jobId) } },
    { $group: { _id: "$job_id", avg: { $avg: "$rating" }, total: { $sum: 1 } } },
  ]);
  const avg = Number((agg[0]?.avg || 0).toFixed(1));
  await jobsModel.updateOne({ _id: jobId }, { $set: { rating: avg, "search_index.score_signals.rating": avg } });
  return { avg, total: agg[0]?.total || 0 };
};

const reviewJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    const message = String(req.body.message || "").trim();
    if (!jobId || !message) return ReturnAppData.getError({ res, status: 400, message: msg(req, "البيانات ناقصة.", "Missing data.") });

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() });
    if (!job) return ReturnAppData.getError({ res, status: 404, message: msg(req, "الوظيفة غير موجودة.", "Job not found.") });

    const old = await UserReviewJobModel.findOne({ user_id: req.user._id, job_id: jobId });
    const doc = await UserReviewJobModel.findOneAndUpdate(
      { user_id: req.user._id, job_id: jobId },
      { $set: { message } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (!old) await clampInc(jobId, "user_review", 1);
    job_reviewed_notification(job, { candidate_user_id: req.user._id }).catch?.(console.error);
    return ReturnAppData.createData({ res, data: doc, message: old ? msg(req, "تم تحديث المراجعة.", "Review updated.") : msg(req, "تم إضافة المراجعة.", "Review created.") });
  } catch (error) { next(error); }
};

const applyOutsideJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: msg(req, "معرّف غير صالح.", "Invalid id.") });

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() });
    if (!job) return ReturnAppData.getError({ res, status: 404, message: msg(req, "الوظيفة غير موجودة.", "Job not found.") });
    if (!job.is_out_side || !job.out_link) return ReturnAppData.getError({ res, status: 400, message: msg(req, "هذه الوظيفة ليست وظيفة خارجية.", "This job is not external.") });

    const existed = await UserOutSideApplyingJobModel.findOne({ user_id: req.user._id, job_id: jobId });
    if (existed) return ReturnAppData.getError({ res, status: 409, message: msg(req, "تم تسجيل التقديم الخارجي مسبقاً.", "External application already recorded."), other: { out_link: job.out_link } });

    const doc = await UserOutSideApplyingJobModel.create({ user_id: req.user._id, job_id: jobId });
    await jobsModel.updateOne({ _id: jobId }, { $inc: { out_side_applying: 1, "search_index.score_signals.applies": 1 } });
    job_applied_notification(job, doc).catch?.(console.error);
    return ReturnAppData.createData({ res, data: { application: doc, out_link: job.out_link }, message: msg(req, "تم تسجيل التقديم الخارجي.", "External application recorded.") });
  } catch (error) {
    if (error?.code === 11000) return ReturnAppData.getError({ res, status: 409, message: msg(req, "تم تسجيل التقديم الخارجي مسبقاً.", "External application already recorded.") });
    next(error);
  }
};

const rateJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    const rating = Number(req.body.rating);
    if (!jobId || !Number.isFinite(rating) || rating < 1 || rating > 5) return ReturnAppData.getError({ res, status: 400, message: msg(req, "تقييم غير صالح.", "Invalid rating.") });

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() });
    if (!job) return ReturnAppData.getError({ res, status: 404, message: msg(req, "الوظيفة غير موجودة.", "Job not found.") });

    const old = await UserRatingJobModel.findOne({ user_id: req.user._id, job_id: jobId });
    const doc = await UserRatingJobModel.findOneAndUpdate(
      { user_id: req.user._id, job_id: jobId },
      { $set: { rating } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const ratingInfo = await recomputeJobRating(jobId);
    job_rated_notification(job, { candidate_user_id: req.user._id, data: { rating } }).catch?.(console.error);
    return ReturnAppData.createData({ res, data: { rating: doc, job_rating: ratingInfo.avg, total: ratingInfo.total }, message: old ? msg(req, "تم تحديث التقييم.", "Rating updated.") : msg(req, "تم إضافة التقييم.", "Rating created.") });
  } catch (error) { next(error); }
};

const toggleSaveJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: msg(req, "معرّف غير صالح.", "Invalid id.") });
    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() });
    if (!job) return ReturnAppData.getError({ res, status: 404, message: msg(req, "الوظيفة غير موجودة.", "Job not found.") });

    const existing = await UserSavedJobModel.findOne({ user_id: req.user._id, job_id: jobId });
    if (existing) {
      await UserSavedJobModel.deleteOne({ _id: existing._id });
      await clampInc(jobId, "user_saved", -1);
      return ReturnAppData.createData({ res, data: { is_saved: false }, message: msg(req, "تم إزالة الوظيفة من المحفوظات.", "Job removed from saved.") });
    }

    await UserSavedJobModel.create({ user_id: req.user._id, job_id: jobId });
    await clampInc(jobId, "user_saved", 1);
    job_seeker_saved_notification(job, { candidate_user_id: req.user._id, dedupeKey: `job:${jobId}:saved:${req.user._id}` }).catch?.(console.error);
    return ReturnAppData.createData({ res, data: { is_saved: true }, message: msg(req, "تم حفظ الوظيفة.", "Job saved.") });
  } catch (error) {
    if (error?.code === 11000) return ReturnAppData.createData({ res, data: { is_saved: true }, message: msg(req, "الوظيفة محفوظة مسبقاً.", "Job already saved.") });
    next(error);
  }
};

const listJobReviews = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    const page = parseIntBounded(req.query.page, 1, 1, 100000);
    const limit = parseIntBounded(req.query.limit, 5, 1, 30);
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: "bad id" });
    const rows = await UserReviewJobModel.aggregate([
      { $match: { job_id: jobId } }, { $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user", pipeline: [{ $project: { first_name: 1, last_name: 1, image: 1 } }] } },
      { $set: { user: { $first: "$user" } } },
      { $project: { message: 1, createdAt: 1, user: { id: "$user_id", first_name: "$user.first_name", last_name: "$user.last_name", image: "$user.image" } } },
    ]);
    return ReturnAppData.getData({ res, data: rows, other: { pagination: { page, limit, has_more: rows.length === limit } } });
  } catch (error) { next(error); }
};

const recomputeJobRatingBreakdown = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: "bad id" });
    const agg = await UserRatingJobModel.aggregate([{ $match: { job_id: jobId } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of agg) if (counts[String(row._id)] !== undefined) counts[String(row._id)] = row.count;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const avg = total ? Number(((1 * counts[1] + 2 * counts[2] + 3 * counts[3] + 4 * counts[4] + 5 * counts[5]) / total).toFixed(1)) : 0;
    await jobsModel.updateOne({ _id: jobId }, { $set: { rating: avg, rating_counts: counts, rating_total: total, "search_index.score_signals.rating": avg } });
    return ReturnAppData.getData({ res, data: { avg, counts, total } });
  } catch (error) { next(error); }
};

const listJobSavers = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    const page = parseIntBounded(req.query.page, 1, 1, 100000);
    const limit = parseIntBounded(req.query.limit, 5, 1, 30);
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: "bad id" });
    const rows = await UserSavedJobModel.aggregate([
      { $match: { job_id: jobId } }, { $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user", pipeline: [{ $project: { first_name: 1, last_name: 1, image: 1 } }] } },
      { $set: { user: { $first: "$user" } } },
      { $project: { createdAt: 1, user: { id: "$user_id", first_name: "$user.first_name", last_name: "$user.last_name", image: "$user.image" } } },
    ]);
    return ReturnAppData.getData({ res, data: rows, other: { pagination: { page, limit, has_more: rows.length === limit } } });
  } catch (error) { next(error); }
};
const reportJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.id);
    const messageText = String(req.body.message || "").trim();

    if (!jobId || !messageText) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: msg(req, "رسالة البلاغ مطلوبة.", "Report message is required."),
      });
    }

    const job = await jobsModel.findOne({
      _id: jobId,
      ...publicJobFilter(),
    });

    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: msg(req, "الوظيفة غير موجودة.", "Job not found."),
      });
    }

    const doc = await JobReportModel.findOneAndUpdate(
      {
        user_id: req.user._id,
        job_id: jobId,
      },
      {
        $set: {
          reason: "other",
          message: messageText,
          company_id: job.company_id || null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return ReturnAppData.createData({
      res,
      data: doc,
      message: msg(req, "تم إرسال البلاغ بنجاح.", "Job report submitted successfully."),
    });
  } catch (error) {
    next(error);
  }
};
export default {
  reviewJob,
  applyOutsideJob,
  rateJob,
  toggleSaveJob,
  listJobReviews,
  recomputeJobRatingBreakdown,
  reportJob,
  listJobSavers,
};
