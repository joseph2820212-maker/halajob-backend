import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel, jobsModel, UserApplyingJobModel, UserSavedJobModel } from "../../../models/index.js";

const JOBS_COLL = jobsModel.collection.name;
const COMP_COLL = CompanyModel.collection.name;

const toObjectId = (v) => new mongoose.Types.ObjectId(String(v));

const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** مُساعد: تنفيذ تجميعة مع تقسيم صفحات وإخراج total وhasMore */
async function runPagedAggregate(model, { match, lookups = [], project = {}, page, limit, sort = { createdAt: -1, _id: -1 } }) {
  const pipeline = [
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        items: [
          { $skip: page * limit },
          { $limit: limit },
          ...lookups,
          { $project: project },
        ],
        totalArr: [{ $count: "total" }],
      },
    },
    {
      $project: {
        items: 1,
        total: { $ifNull: [{ $arrayElemAt: ["$totalArr.total", 0] }, 0] },
      },
    },
  ];

  const [{ items, total }] = await model.aggregate(pipeline);
  const hasMore = (page + 1) * limit < total;
  return { items, total, hasMore };
}

/** وظائف المستخدم المحفوظة */
const getSavedJob = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const page = parseIntBounded(req.query.page, 0, 0, 100000);
    const limit = parseIntBounded(req.query.limit, 10, 1, 50);

    if (!user?._id) {
      return ReturnAppData.createError({ res, status: 401, message: lan === "ar" ? "غير مصرح" : "Unauthorized" });
    }

    const lookups = [
      {
        $lookup: {
          from: JOBS_COLL,
          localField: "job_id",
          foreignField: "_id",
          as: "job",
          pipeline: [{ $project: { job_name: 1, company_id: 1, jop_type_id: 1 } }],
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: COMP_COLL,
          localField: "job.company_id",
          foreignField: "_id",
          as: "company",
          pipeline: [{ $project: { company_name: 1 } }],
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
    ];

    const project = {
      _id: 1,
      createdAt: 1,
      job_id: "$job._id",
      job_name: "$job.job_name",
      jop_type_id: "$job.jop_type_id",
      company: { _id: "$company._id", company_name: "$company.company_name" },
    };

    const { items, total, hasMore } = await runPagedAggregate(UserSavedJobModel, {
      match: { user_id: toObjectId(user._id) },
      lookups,
      project,
      page,
      limit,
    });

    return ReturnAppData.createData({ res, data: { page, limit, total, hasMore, items } });
  } catch (e) {
    next(e);
  }
};

/** وظائف قدّم عليها المستخدم */
const getAppliedJobs = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const page = parseIntBounded(req.query.page, 0, 0, 100000);
    const limit = parseIntBounded(req.query.limit, 10, 1, 50);

    if (!user?._id) {
      return ReturnAppData.createError({ res, status: 401, message: lan === "ar" ? "غير مصرح" : "Unauthorized" });
    }

    const lookups = [
      {
        $lookup: {
          from: JOBS_COLL,
          localField: "job_id",
          foreignField: "_id",
          as: "job",
          pipeline: [{ $project: { job_name: 1, company_id: 1, jop_type_id: 1, jop_salary_id: 1, rating: 1 } }],
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: COMP_COLL,
          localField: "job.company_id",
          foreignField: "_id",
          as: "company",
          pipeline: [{ $project: { company_name: 1 } }],
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
    ];

    const project = {
      _id: 1,
      createdAt: 1,
      job_id: "$job._id",
      job_name: "$job.job_name",
      jop_type_id: "$job.jop_type_id",
      jop_salary_id: "$job.jop_salary_id",
      rating: "$job.rating",
      company: { _id: "$company._id", company_name: "$company.company_name" },
      user_job_rating: 1,
      is_send_interview: 1,
      "interview_information.date": 1,
      "interview_information.is_online": 1,
      "interview_information.office_address": 1,
    };

    const { items, total, hasMore } = await runPagedAggregate(UserApplyingJobModel, {
      match: { user_id: toObjectId(user._id) },
      lookups,
      project,
      page,
      limit,
    });

    return ReturnAppData.createData({ res, data: { page, limit, total, hasMore, items } });
  } catch (e) {
    next(e);
  }
};

/** وظائف تم إرسال مقابلة لها */
const getInterviewedJobs = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const page = parseIntBounded(req.query.page, 0, 0, 100000);
    const limit = parseIntBounded(req.query.limit, 10, 1, 50);

    if (!user?._id) {
      return ReturnAppData.createError({ res, status: 401, message: lan === "ar" ? "غير مصرح" : "Unauthorized" });
    }

    const lookups = [
      {
        $lookup: {
          from: JOBS_COLL,
          localField: "job_id",
          foreignField: "_id",
          as: "job",
          pipeline: [{ $project: { job_name: 1, company_id: 1, jop_type_id: 1, rating: 1 } }],
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: COMP_COLL,
          localField: "job.company_id",
          foreignField: "_id",
          as: "company",
          pipeline: [{ $project: { company_name: 1 } }],
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
    ];

    const project = {
      _id: 1,
      createdAt: 1,
      job_id: "$job._id",
      job_name: "$job.job_name",
      jop_type_id: "$job.jop_type_id",
      rating: "$job.rating",
      company: { _id: "$company._id", company_name: "$company.company_name" },
      user_job_rating: 1,
      "interview_information.date": 1,
      "interview_information.is_online": 1,
      "interview_information.office_address": 1,
      "interview_information.meet_link": 1,
    };

    const { items, total, hasMore } = await runPagedAggregate(UserApplyingJobModel, {
      match: { user_id: toObjectId(user._id), is_send_interview: true },
      lookups,
      project,
      page,
      limit,
    });

    return ReturnAppData.createData({ res, data: { page, limit, total, hasMore, items } });
  } catch (e) {
    next(e);
  }
};

/** عدد السجلات لكل فئة */
const getUserJobCounts = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const userId = req.user?._id;
    if (!userId) {
      return ReturnAppData.createError({ res, status: 401, message: lan === "ar" ? "غير مصرح" : "Unauthorized" });
    }
    const uid = toObjectId(userId);

    const [saved, applied, interviewed] = await Promise.all([
      UserSavedJobModel.countDocuments({ user_id: uid }),
      UserApplyingJobModel.countDocuments({ user_id: uid }),
      UserApplyingJobModel.countDocuments({ user_id: uid, is_send_interview: true }),
    ]);

    return ReturnAppData.createData({ res, data: { saved, applied, interviewed } });
  } catch (e) {
    next(e);
  }
};

export default { getSavedJob, getAppliedJobs, getInterviewedJobs, getUserJobCounts };
