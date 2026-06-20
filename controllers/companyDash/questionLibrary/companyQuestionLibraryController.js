import { CompanyQuestionLibraryModel } from "../../../models/index.js";
import { getCompanyUserIdOrFail, success, fail, paginate, isValidObjectId } from "../../../helper/companyDash/companyDashHelpers.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const cleanText = (value = "") => String(value ?? "").trim();
const toBool = (value) => [true, "true", "1", 1, "yes", "on"].includes(value);
const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
};
const toArray = (value) => {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed;
  if (parsed === undefined || parsed === null || parsed === "") return [];
  if (typeof parsed === "string") return parsed.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  return [parsed];
};
const normalizeOptions = (value) => toArray(value).map((item) => {
  if (typeof item === "string") return { label: item, value: item, is_correct: false };
  const label = cleanText(item.label || item.title || item.name || item.value);
  if (!label) return null;
  return { label, value: cleanText(item.value || label), is_correct: toBool(item.is_correct ?? item.correct) };
}).filter(Boolean);
const normalizePayload = (body = {}) => ({
  title: cleanText(body.title || body.question),
  question: cleanText(body.question || body.title),
  type: cleanText(body.type || "text"),
  options: normalizeOptions(body.options),
  is_required: toBool(body.is_required ?? body.required),
  is_knockout: toBool(body.is_knockout ?? body.knockout),
  weight: Math.min(Math.max(Number(body.weight ?? 1), 0), 100),
  expected_answer: parseMaybeJson(body.expected_answer ?? body.knockout_expected_answer ?? body.correct_answer ?? null),
  knockout_action: ["mark_not_match", "needs_manual_review", "reject"].includes(body.knockout_action) ? body.knockout_action : "mark_not_match",
  category: cleanText(body.category || "general"),
  tags: toArray(body.tags).map(cleanText).filter(Boolean),
  is_active: body.is_active === undefined ? true : toBool(body.is_active),
});

const normalizePatchPayload = (body = {}) => {
  const payload = {};

  if (body.title !== undefined || body.question !== undefined) {
    payload.title = cleanText(body.title || body.question);
    payload.question = cleanText(body.question || body.title);
  }
  if (body.type !== undefined) payload.type = cleanText(body.type || "text");
  if (body.options !== undefined) payload.options = normalizeOptions(body.options);
  if (body.is_required !== undefined || body.required !== undefined) payload.is_required = toBool(body.is_required ?? body.required);
  if (body.is_knockout !== undefined || body.knockout !== undefined) payload.is_knockout = toBool(body.is_knockout ?? body.knockout);
  if (body.weight !== undefined) payload.weight = Math.min(Math.max(Number(body.weight ?? 1), 0), 100);
  if (body.expected_answer !== undefined || body.knockout_expected_answer !== undefined || body.correct_answer !== undefined) {
    payload.expected_answer = parseMaybeJson(body.expected_answer ?? body.knockout_expected_answer ?? body.correct_answer ?? null);
  }
  if (body.knockout_action !== undefined) {
    payload.knockout_action = ["mark_not_match", "needs_manual_review", "reject"].includes(body.knockout_action) ? body.knockout_action : "mark_not_match";
  }
  if (body.category !== undefined) payload.category = cleanText(body.category || "general");
  if (body.tags !== undefined) payload.tags = toArray(body.tags).map(cleanText).filter(Boolean);
  if (body.is_active !== undefined) payload.is_active = toBool(body.is_active);

  return payload;
};

export const listQuestions = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const filter = { company_id: companyData.company._id };
    if (req.query.type) filter.type = cleanText(req.query.type);
    if (req.query.category) filter.category = cleanText(req.query.category);
    if (req.query.is_active !== undefined) filter.is_active = toBool(req.query.is_active);
    if (req.query.search || req.query.q) {
      const regex = new RegExp(String(req.query.search || req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: regex }, { question: regex }, { tags: regex }];
    }
    const result = await paginate(CompanyQuestionLibraryModel, filter, req, { sort: { createdAt: -1, _id: -1 }, lean: true });
    return success(res, result.items, "company_question_library", 200, result.meta);
  } catch (error) { next(error); }
};

export const createQuestion = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const payload = normalizePayload(req.body);
    if (!payload.question) return fail(res, "question_required", 422);
    const question = await CompanyQuestionLibraryModel.create({ ...payload, company_id: companyData.company._id, created_by: companyData.userId });
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "question_library_created", entityType: "question_library", entityId: question._id, newValue: payload });
    return success(res, question, "question_library_created", 201);
  } catch (error) { next(error); }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.questionId)) return fail(res, "invalid_question_id", 400);
    const oldQuestion = await CompanyQuestionLibraryModel.findOne({ _id: req.params.questionId, company_id: companyData.company._id }).lean();
    if (!oldQuestion) return fail(res, "question_not_found", 404);
    const payload = normalizePatchPayload(req.body);
    if ((req.body.title !== undefined || req.body.question !== undefined) && !payload.question) return fail(res, "question_required", 422);
    const question = await CompanyQuestionLibraryModel.findOneAndUpdate({ _id: req.params.questionId, company_id: companyData.company._id }, { $set: payload }, { new: true, runValidators: true });
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "question_library_updated", entityType: "question_library", entityId: question._id, oldValue: oldQuestion, newValue: payload });
    return success(res, question, "question_library_updated");
  } catch (error) { next(error); }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.questionId)) return fail(res, "invalid_question_id", 400);
    const question = await CompanyQuestionLibraryModel.findOneAndUpdate({ _id: req.params.questionId, company_id: companyData.company._id }, { $set: { is_active: false } }, { new: true });
    if (!question) return fail(res, "question_not_found", 404);
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "question_library_disabled", entityType: "question_library", entityId: question._id });
    return success(res, question, "question_library_disabled");
  } catch (error) { next(error); }
};

export default { listQuestions, createQuestion, updateQuestion, deleteQuestion };
