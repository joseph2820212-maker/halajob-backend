import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  InterviewPrepQuestionModel,
  LearningResourceModel,
} from "../../../models/index.js";
import {
  attachQuestionProgress,
  buildJobPrep,
  parsePagination,
  questionSearchFilter,
  serializeQuestion,
  upsertQuestionProgress,
  upsertResourceProgress,
  visibleQuestionFilter,
} from "../../../services/interviewPrep/interviewPrep.service.js";
import {
  mergeResourceFilters,
  resolveStudentProfile,
  serializeResource,
  universityIdFromEmployee,
  visibleResourceFilter,
} from "../../../services/resources/learningResource.service.js";

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const lang = (req) =>
  String(req.get("lan") || req.query.lang || "en")
    .toLowerCase()
    .startsWith("ar")
    ? "ar"
    : "en";

const userIdOf = (req) => req.user?._id || req.auth?.user_id || req.auth?.userId || null;

const resolveContext = async (req) => {
  const userId = userIdOf(req);
  const employee = await resolveStudentProfile(userId);
  return {
    userId,
    employee,
    universityId: universityIdFromEmployee(employee),
  };
};

export const overview = async (req, res, next) => {
  try {
    const { userId, universityId } = await resolveContext(req);
    const language = lang(req);
    const [questions, resources] = await Promise.all([
      InterviewPrepQuestionModel.find(visibleQuestionFilter())
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      LearningResourceModel.find(
        mergeResourceFilters(visibleResourceFilter({ universityId }), {
          type: { $in: ["interview_questions", "checklist", "guide"] },
          status: "published",
        }),
      )
        .sort({ featured: -1, sort_order: 1, published_at: -1, createdAt: -1 })
        .limit(8)
        .lean(),
    ]);
    const withProgress = await attachQuestionProgress({ questions, userId });
    return ReturnAppData.getData({
      res,
      data: {
        questions: withProgress.map((question) => serializeQuestion(question, { lang: language })),
        resources: resources.map((resource) => serializeResource(resource, { lang: language })),
        checklist: [
          "Review job description",
          "Prepare three examples",
          "Test camera/microphone",
          "Prepare salary expectation",
          "Review company page",
        ],
      },
      message: "interview_prep",
    });
  } catch (error) {
    next(error);
  }
};

export const questions = async (req, res, next) => {
  try {
    const { userId } = await resolveContext(req);
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {
      ...visibleQuestionFilter(),
      ...questionSearchFilter(req.query),
    };
    const [items, total] = await Promise.all([
      InterviewPrepQuestionModel.find(filter)
        .sort({ category: 1, difficulty: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InterviewPrepQuestionModel.countDocuments(filter),
    ]);
    const withProgress = await attachQuestionProgress({ questions: items, userId });
    return ReturnAppData.getData({
      res,
      data: withProgress.map((question) => serializeQuestion(question, { lang: lang(req) })),
      other: { pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total } },
      message: "interview_prep_questions",
    });
  } catch (error) {
    next(error);
  }
};

export const jobPrep = async (req, res, next) => {
  try {
    const { userId, universityId } = await resolveContext(req);
    const prep = await buildJobPrep({
      jobId: req.params.jobId,
      userId,
      universityId,
      lang: lang(req),
    });
    if (!prep) {
      return ReturnAppData.getError({ res, status: 404, message: "job_not_found" });
    }
    return ReturnAppData.getData({ res, data: prep, message: "job_interview_prep" });
  } catch (error) {
    next(error);
  }
};

export const saveQuestionNote = async (req, res, next) => {
  try {
    const { userId } = await resolveContext(req);
    const question = await InterviewPrepQuestionModel.findOne({
      _id: req.params.id,
      ...visibleQuestionFilter(),
    }).lean();
    if (!question) {
      return ReturnAppData.getError({ res, status: 404, message: "question_not_found" });
    }
    const progress = await upsertQuestionProgress({
      userId,
      questionId: question._id,
      patch: {
        note: cleanText(req.body.note),
        saved: req.body.saved === false ? false : true,
        status: cleanText(req.body.status) || "in_progress",
        progress_percent: Math.max(0, Math.min(100, Number(req.body.progress_percent || 0))),
      },
    });
    return ReturnAppData.getData({ res, data: progress, message: "interview_prep_note_saved" });
  } catch (error) {
    next(error);
  }
};

export const updateChecklistProgress = async (req, res, next) => {
  try {
    const { userId, universityId } = await resolveContext(req);
    if (!isObjectId(req.params.id)) {
      return ReturnAppData.getError({ res, status: 400, message: "invalid_checklist_id" });
    }
    const resource = await LearningResourceModel.findOne(
      mergeResourceFilters(
        { _id: req.params.id, type: { $in: ["checklist", "guide", "interview_questions"] } },
        visibleResourceFilter({ universityId }),
      ),
    ).lean();
    if (!resource) {
      return ReturnAppData.getError({ res, status: 404, message: "checklist_not_found" });
    }
    const percent = Math.max(0, Math.min(100, Number(req.body.progress_percent ?? req.body.progress ?? 0)));
    const status =
      cleanText(req.body.status) || (percent >= 100 ? "completed" : percent > 0 ? "in_progress" : "not_started");
    const progress = await upsertResourceProgress({
      userId,
      resourceId: resource._id,
      jobId: req.body.job_id,
      patch: {
        status,
        progress_percent: percent,
        completed_at: status === "completed" || percent >= 100 ? new Date() : null,
      },
    });
    return ReturnAppData.getData({ res, data: progress, message: "interview_checklist_progress_updated" });
  } catch (error) {
    next(error);
  }
};

export default {
  jobPrep,
  overview,
  questions,
  saveQuestionNote,
  updateChecklistProgress,
};
