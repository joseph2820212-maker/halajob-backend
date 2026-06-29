import mongoose from "mongoose";
import {
  InterviewPrepQuestionModel,
  LearningResourceModel,
  UserInterviewPrepProgressModel,
  jobsModel,
} from "../../models/index.js";
import {
  mergeResourceFilters,
  serializeResource,
  visibleResourceFilter,
} from "../resources/learningResource.service.js";

const { Types } = mongoose;

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const objectId = (value) => (isObjectId(value) ? new Types.ObjectId(String(value)) : null);
const escapeRegex = (value) => cleanText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const localized = (value = {}, lang = "en") => {
  if (typeof value === "string") return value;
  const preferred = lang === "ar" ? value.ar : value.en;
  return cleanText(preferred || value.en || value.ar || "");
};

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit || "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const visibleQuestionFilter = () => ({
  status: "published",
  audience: { $in: ["job_seekers", "students", "fresh_graduates", "all"] },
});

export const questionSearchFilter = (query = {}, { includeStatus = false } = {}) => {
  const filter = {};
  const q = cleanText(query.q || query.search);
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { "title.en": regex },
      { "title.ar": regex },
      { "question.en": regex },
      { "question.ar": regex },
      { "answer_tips.en": regex },
      { "answer_tips.ar": regex },
      { category: regex },
      { tags: regex },
    ];
  }
  if (query.category) filter.category = cleanText(query.category).toLowerCase();
  if (query.difficulty) filter.difficulty = cleanText(query.difficulty);
  if (query.job_name_id && isObjectId(query.job_name_id)) filter.job_name_id = objectId(query.job_name_id);
  if (query.industry_id && isObjectId(query.industry_id)) filter.industry_id = objectId(query.industry_id);
  if (query.tag) filter.tags = cleanText(query.tag);
  if (includeStatus && query.status) filter.status = cleanText(query.status);
  return filter;
};

export const serializeQuestion = (question = {}, { lang = "en" } = {}) => ({
  id: String(question._id || question.id || ""),
  title: localized(question.title, lang),
  title_i18n: question.title || {},
  question: localized(question.question, lang),
  question_i18n: question.question || {},
  answer_tips: localized(question.answer_tips, lang),
  answer_tips_i18n: question.answer_tips || {},
  category: question.category || "general",
  job_name_id: question.job_name_id ? String(question.job_name_id?._id || question.job_name_id) : null,
  industry_id: question.industry_id ? String(question.industry_id?._id || question.industry_id) : null,
  audience: question.audience || [],
  difficulty: question.difficulty || "basic",
  tags: question.tags || [],
  status: question.status || "published",
  progress: question.progress
    ? {
        saved: Boolean(question.progress.saved),
        note: question.progress.note || "",
        status: question.progress.status,
        progress_percent: question.progress.progress_percent || 0,
        completed_at: question.progress.completed_at || null,
        last_opened_at: question.progress.last_opened_at || null,
      }
    : null,
});

export const attachQuestionProgress = async ({ questions = [], userId }) => {
  if (!userId || !questions.length) return questions.map((question) => ({ ...question, progress: null }));
  const ids = questions.map((question) => question._id).filter(Boolean);
  const rows = await UserInterviewPrepProgressModel.find({
    user_id: userId,
    question_id: { $in: ids },
  }).lean();
  const byQuestion = new Map(rows.map((row) => [String(row.question_id), row]));
  return questions.map((question) => ({
    ...question,
    progress: byQuestion.get(String(question._id)) || null,
  }));
};

export const upsertQuestionProgress = ({ userId, questionId, patch = {} }) =>
  UserInterviewPrepProgressModel.findOneAndUpdate(
    { user_id: userId, question_id: questionId },
    {
      $set: { ...patch, last_opened_at: new Date() },
      $setOnInsert: { user_id: userId, question_id: questionId },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

export const upsertResourceProgress = ({ userId, resourceId, jobId = null, patch = {} }) =>
  UserInterviewPrepProgressModel.findOneAndUpdate(
    { user_id: userId, resource_id: resourceId },
    {
      $set: { ...patch, job_id: jobId || null, last_opened_at: new Date() },
      $setOnInsert: { user_id: userId, resource_id: resourceId },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const skillTokensFromJob = (job = {}) =>
  (job.skills_required || [])
    .map((item) => cleanText(item?.title).toLowerCase())
    .filter(Boolean);

export const buildJobPrep = async ({ jobId, userId, universityId = null, lang = "en" }) => {
  if (!isObjectId(jobId)) return null;
  const job = await jobsModel.findById(jobId).lean();
  if (!job) return null;

  const skillTokens = skillTokensFromJob(job);
  const title = cleanText(job.job_name || job.title).toLowerCase();
  const exactFilters = [];
  if (job.job_name_id) exactFilters.push({ job_name_id: job.job_name_id });
  if (job.industry_id) exactFilters.push({ industry_id: job.industry_id });
  if (skillTokens.length) exactFilters.push({ tags: { $in: skillTokens } });
  if (title) exactFilters.push({ category: title });

  const questionFilter = {
    ...visibleQuestionFilter(),
    ...(exactFilters.length ? { $or: [...exactFilters, { category: "general" }] } : {}),
  };
  const questions = await InterviewPrepQuestionModel.find(questionFilter)
    .sort({ difficulty: 1, createdAt: -1 })
    .limit(12)
    .lean();
  const withProgress = await attachQuestionProgress({ questions, userId });

  const resourceTags = [...new Set(["interview_preparation", "interview", ...skillTokens])];
  const resources = await LearningResourceModel.find(
    mergeResourceFilters(
      visibleResourceFilter({ universityId }),
      { type: { $in: ["interview_questions", "checklist", "guide"] } },
      { $or: [{ tags: { $in: resourceTags } }, { featured: true }] },
    ),
  )
    .sort({ featured: -1, sort_order: 1, published_at: -1, createdAt: -1 })
    .limit(8)
    .lean();

  return {
    job: {
      id: String(job._id),
      title: job.job_name || "",
      skills: skillTokens,
      company_id: job.company_id ? String(job.company_id) : null,
      experience_level: job.experience_level_info?.title_en || job.experience_level_info?.title || "",
    },
    likely_questions: withProgress.map((question) => serializeQuestion(question, { lang })),
    resources: resources.map((resource) => serializeResource(resource, { lang })),
    checklist: [
      "Review the job description and required skills.",
      "Prepare three short work or study examples.",
      "Prepare two thoughtful questions for the company.",
      "Check camera, microphone, connection, and location.",
      "Prepare salary expectations and notice-period answer.",
      "Review your CV points that match this role.",
    ],
  };
};

export default {
  attachQuestionProgress,
  buildJobPrep,
  parsePagination,
  questionSearchFilter,
  serializeQuestion,
  upsertQuestionProgress,
  upsertResourceProgress,
  visibleQuestionFilter,
};
