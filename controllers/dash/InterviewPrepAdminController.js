import mongoose from "mongoose";
import { InterviewPrepQuestionModel } from "../../models/index.js";
import {
  parsePagination,
  questionSearchFilter,
  serializeQuestion,
} from "../../services/interviewPrep/interviewPrep.service.js";

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const adminId = (req) => req.admin?._id || req.user?._id || null;

const ok = (res, data, message = "success", status = 200, other = undefined) => {
  const payload = { success: true, status: true, message, data };
  if (other) payload.other = other;
  return res.status(status).json(payload);
};

const fail = (res, message, status = 400) => res.status(status).json({ success: false, status: false, message });

const hasField = (body = {}, field) =>
  Object.prototype.hasOwnProperty.call(body, field) ||
  Object.prototype.hasOwnProperty.call(body, `${field}_en`) ||
  Object.prototype.hasOwnProperty.call(body, `${field}_ar`);

const localized = (body = {}, field) => {
  const direct = body[field];
  if (direct && typeof direct === "object") return direct;
  return {
    en: cleanText(body[`${field}_en`] || direct),
    ar: cleanText(body[`${field}_ar`]),
  };
};

const normalizePayload = (body = {}, actor = null, { partial = false } = {}) => {
  const payload = { updated_by: actor };

  if (!partial || hasField(body, "title")) payload.title = localized(body, "title");
  if (!partial || hasField(body, "question")) payload.question = localized(body, "question");
  if (!partial || hasField(body, "answer_tips")) payload.answer_tips = localized(body, "answer_tips");
  if (!partial || Object.prototype.hasOwnProperty.call(body, "category")) {
    payload.category = cleanText(body.category).toLowerCase() || "general";
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "job_name_id")) {
    payload.job_name_id = isObjectId(body.job_name_id) ? body.job_name_id : null;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "industry_id")) {
    payload.industry_id = isObjectId(body.industry_id) ? body.industry_id : null;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "audience")) {
    const audience = Array.isArray(body.audience)
      ? body.audience.map(cleanText).filter(Boolean)
      : cleanText(body.audience).split(/[,;]+/).map(cleanText).filter(Boolean);
    payload.audience = audience.length ? audience : ["job_seekers"];
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "difficulty")) {
    payload.difficulty = ["basic", "medium", "advanced"].includes(body.difficulty) ? body.difficulty : "basic";
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "tags")) {
    payload.tags = Array.isArray(body.tags)
      ? body.tags.map(cleanText).filter(Boolean)
      : cleanText(body.tags).split(/[,;]+/).map(cleanText).filter(Boolean);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "status")) {
    payload.status = ["draft", "published", "archived"].includes(body.status) ? body.status : "published";
  }

  return payload;
};

export const listQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = questionSearchFilter(req.query, { includeStatus: true });
    const [questions, total] = await Promise.all([
      InterviewPrepQuestionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      InterviewPrepQuestionModel.countDocuments(filter),
    ]);
    return ok(res, questions.map((question) => serializeQuestion(question)), "interview_prep_questions", 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit), has_more: page * limit < total },
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body, adminId(req));
    payload.created_by = adminId(req);
    const question = await InterviewPrepQuestionModel.create(payload);
    return ok(res, serializeQuestion(question), "interview_prep_question_created", 201);
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const question = await InterviewPrepQuestionModel.findByIdAndUpdate(
      req.params.id,
      { $set: normalizePayload(req.body, adminId(req), { partial: true }) },
      { new: true, runValidators: true },
    );
    if (!question) return fail(res, "question_not_found", 404);
    return ok(res, serializeQuestion(question), "interview_prep_question_updated");
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const question = await InterviewPrepQuestionModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "archived", updated_by: adminId(req) } },
      { new: true },
    );
    if (!question) return fail(res, "question_not_found", 404);
    return ok(res, serializeQuestion(question), "interview_prep_question_archived");
  } catch (error) {
    next(error);
  }
};

export default {
  createQuestion,
  deleteQuestion,
  listQuestions,
  updateQuestion,
};
