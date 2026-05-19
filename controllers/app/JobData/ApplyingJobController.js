import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  EmployeeModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  JobEmployeeMatchModel,
} from "../../../models/index.js";
import { calculateJobEmployeeMatch } from "../../../services/matching/jobEmployeeMatching.js";
import { job_applied_notification } from "../../../notification/JobCompanyNotifications.js";

const { Types } = mongoose;
const toObjectId = (value) => (mongoose.isValidObjectId(String(value || "")) ? new Types.ObjectId(String(value)) : null);

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

const msg = (req, ar, en) => (String(req.get("lan") || "en").toLowerCase().startsWith("ar") ? ar : en);

const normalizeAnswers = (answers = [], questions = []) => {
  const list = Array.isArray(answers) ? answers : [];
  const byId = new Map(list.map((a) => [String(a.question_id || a.id || ""), a]));
  return (questions || []).map((q) => {
    const answer = byId.get(String(q._id)) || list.find((a) => String(a.question || "").trim() === String(q.question || "").trim());
    return {
      question_id: q._id || null,
      question: q.question || answer?.question || "",
      answer: answer?.answer ?? answer?.value ?? null,
    };
  }).filter((a) => a.question || a.answer !== null);
};

const missingRequiredAnswers = (answers = [], questions = []) => {
  const answerMap = new Map(answers.map((a) => [String(a.question_id || ""), a.answer]));
  return (questions || []).filter((q) => {
    if (!q.is_required) return false;
    const value = answerMap.get(String(q._id));
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || String(value).trim() === "";
  });
};

const getEmployee = (userId) => EmployeeModel.findOne({ user_id: userId }).lean();

const applyJob = async (req, res, next) => {
  try {
    const user = req.user;
    const jobId = toObjectId(req.params.id);
    if (!user?._id) return ReturnAppData.getError({ res, status: 401, message: msg(req, "غير مصرح.", "Unauthorized.") });
    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: msg(req, "معرّف الوظيفة غير صالح.", "Invalid job id.") });

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() }).lean();
    if (!job) return ReturnAppData.getError({ res, status: 404, message: msg(req, "الوظيفة غير موجودة أو غير متاحة للتقديم.", "Job not found or not available for applications.") });
    if (job.is_out_side) return ReturnAppData.getError({ res, status: 400, message: msg(req, "هذه الوظيفة خارجية، استخدم رابط التقديم الخارجي.", "This is an external job. Use external application flow.") });

    const employee = await getEmployee(user._id);
    const answers = normalizeAnswers(req.body.answers, job.questions || []);
    const missing = missingRequiredAnswers(answers, job.questions || []);
    if (missing.length) {
      return ReturnAppData.getError({
        res,
        status: 422,
        message: msg(req, "يجب الإجابة على الأسئلة المطلوبة.", "Required questions must be answered."),
        other: { missing_questions: missing.map((q) => ({ id: q._id, question: q.question })) },
      });
    }

    const cv = String(req.body.cv || req.body.cv_url || employee?.cvs?.find((x) => x.is_default)?.url || employee?.cvs?.[0]?.url || "").trim();
    if (job.is_cv_required !== false && !cv) {
      return ReturnAppData.getError({ res, status: 422, message: msg(req, "السيرة الذاتية مطلوبة لهذه الوظيفة.", "CV is required for this job.") });
    }

    const countryId = toObjectId(req.body.country_id || user.country_id || employee?.preferred_countries?.[0]);
    if (!countryId) return ReturnAppData.getError({ res, status: 422, message: msg(req, "الدولة مطلوبة للتقديم.", "Country is required for application.") });

    const matchResult = employee ? calculateJobEmployeeMatch(job, employee) : null;
    const payload = {
      user_id: user._id,
      employee_id: employee?._id || null,
      job_id: job._id,
      company_id: job.company_id,
      first_name: user.first_name || employee?.first_name || "Employee",
      last_name: user.last_name || employee?.last_name || ".",
      email: user.email,
      phone_code: user.phone_code || req.body.phone_code || "+963",
      phone_national: user.phone_national || req.body.phone_national || "000000000",
      country_id: countryId,
      answers,
      cv,
      cover_letter: String(req.body.cover_letter || "").trim(),
      source: "app",
      is_filter: Boolean(matchResult),
      filter_on: Boolean(matchResult),
      filter_result: matchResult ? {
        score: matchResult.score,
        matched_skills: matchResult.matched_skills || [],
        missing_skills: matchResult.missing_skills || [],
        reason: "calculated_from_employee_profile",
      } : undefined,
      last_activity_at: new Date(),
    };

    let created;
    try {
      created = await UserApplyingJobModel.create(payload);
    } catch (error) {
      if (error?.code === 11000) return ReturnAppData.getError({ res, status: 409, message: msg(req, "لقد قدمت على هذه الوظيفة مسبقاً.", "You already applied for this job.") });
      throw error;
    }

    await Promise.all([
      jobsModel.updateOne({ _id: job._id }, { $inc: { user_applying: 1, "search_index.score_signals.applies": 1 } }),
      employee?._id && matchResult ? JobEmployeeMatchModel.findOneAndUpdate(
        { job_id: job._id, employee_id: employee._id },
        { job_id: job._id, employee_id: employee._id, company_id: job.company_id, user_id: user._id, ...matchResult, generated_at: new Date() },
        { upsert: true, setDefaultsOnInsert: true }
      ) : null,
    ]);

    job_applied_notification(job).catch?.(console.error);
    return ReturnAppData.createData({ res, data: created, message: msg(req, "تم تقديم الطلب بنجاح.", "Application submitted successfully.") });
  } catch (error) {
    next(error);
  }
};

const getAppliedJobs = async (req, res, next) => {
  try {
    const user = req.user;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;
    const status = String(req.query.status || "").trim();

    const match = { user_id: new Types.ObjectId(user._id) };
    if (status) match.status = status;

    const [agg] = await UserApplyingJobModel.aggregate([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip }, { $limit: limit },
            { $lookup: { from: "jobs", localField: "job_id", foreignField: "_id", as: "job", pipeline: [{ $project: { job_name: 1, company_id: 1, is_remote: 1, search_projection: 1, salary: 1, apply_deadline: 1, publish_status: 1 } }] } },
            { $set: { job: { $first: "$job" } } },
            { $lookup: { from: "companies", localField: "company_id", foreignField: "_id", as: "company", pipeline: [{ $project: { company_name: 1, image: 1, logo: 1 } }] } },
            { $set: { company: { $first: "$company" } } },
            { $lookup: { from: UserSavedJobModel.collection.name, let: { jid: "$job_id", uid: "$user_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$job_id", "$$jid"] }, { $eq: ["$user_id", "$$uid"] }] } } }, { $limit: 1 }], as: "saved" } },
            { $project: { status: 1, status_changed_at: 1, applied_at: "$createdAt", filter_result: 1, source: 1, cv: 1, cover_letter: 1, job: { id: "$job._id", title: "$job.job_name", is_remote: "$job.is_remote", salary: "$job.salary", apply_deadline: "$job.apply_deadline", publish_status: "$job.publish_status" }, company: { id: "$company._id", name: "$company.company_name", image: { $ifNull: ["$company.image", "$company.logo"] } }, is_saved: { $gt: [{ $size: "$saved" }, 0] } } },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]).allowDiskUse(true);

    const items = agg?.items || [];
    const total = agg?.meta?.[0]?.total || 0;
    return ReturnAppData.getData({ res, data: items, other: { pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total } } });
  } catch (error) {
    next(error);
  }
};

export default { applyJob, getAppliedJobs };
