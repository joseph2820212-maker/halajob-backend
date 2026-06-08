import { calculateJobEmployeeMatch } from "./jobEmployeeMatching.js";

const normalizeText = (value = "") =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
};

const answersEqual = (actual, expected) => {
  if (expected === undefined || expected === null || expected === "") return true;
  const actualArr = toArray(actual).map(normalizeText).filter(Boolean);
  const expectedArr = toArray(expected).map(normalizeText).filter(Boolean);
  if (!expectedArr.length) return true;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    return expectedArr.every((item) => actualArr.includes(item));
  }
  return normalizeText(actual) === normalizeText(expected);
};

const answerHasValue = (answer) => {
  if (Array.isArray(answer)) return answer.length > 0;
  return answer !== undefined && answer !== null && String(answer).trim() !== "";
};

export const evaluateApplicationQuestions = (job = {}, answers = []) => {
  const questions = Array.isArray(job.questions) ? job.questions : [];
  const answerMap = new Map(answers.map((item) => [String(item.question_id || item.id || ""), item.answer]));
  const details = [];
  const failedQuestions = [];
  let totalWeight = 0;
  let gainedWeight = 0;
  let knockoutAction = "none";

  questions.forEach((question) => {
    const questionId = String(question._id || question.id || "");
    const answer = answerMap.has(questionId)
      ? answerMap.get(questionId)
      : answers.find((item) => normalizeText(item.question) === normalizeText(question.question))?.answer;

    const weight = Math.max(Number(question.weight ?? 1), 0);
    const hasValue = answerHasValue(answer);
    const expected = question.knockout_expected_answer ?? question.correct_answer ?? null;
    const passedExpected = answersEqual(answer, expected);
    const isKnockout = Boolean(question.is_knockout);
    const failedRequired = Boolean(question.is_required) && !hasValue;
    const failedKnockout = isKnockout && (!hasValue || !passedExpected);

    if (!isKnockout) {
      totalWeight += weight;
      if (hasValue && passedExpected) gainedWeight += weight;
      else if (hasValue && expected === null) gainedWeight += weight;
    }

    if (failedKnockout) {
      failedQuestions.push(question.question || questionId);
      const action = question.knockout_action || "mark_not_match";
      if (action === "reject") knockoutAction = "reject";
      else if (action === "needs_manual_review" && knockoutAction !== "reject") knockoutAction = "needs_manual_review";
      else if (knockoutAction === "none") knockoutAction = "mark_not_match";
    }

    details.push({
      question_id: questionId || null,
      question: question.question || "",
      type: question.type || "text",
      is_required: Boolean(question.is_required),
      is_knockout: isKnockout,
      weight,
      answer,
      expected_answer: expected,
      passed: !failedRequired && !failedKnockout && (expected === null || passedExpected),
      failed_required: failedRequired,
      failed_knockout: failedKnockout,
    });
  });

  const score = totalWeight > 0 ? Math.round((gainedWeight / totalWeight) * 100) : 100;
  return {
    score,
    details,
    knockout: {
      has_failed: failedQuestions.length > 0,
      failed_questions: failedQuestions,
      action: failedQuestions.length ? knockoutAction : "none",
    },
  };
};

export const calculateAtsApplicationResult = ({ job, employee, answers = [] }) => {
  const profileResult = employee ? calculateJobEmployeeMatch(job, employee) : null;
  const questionResult = evaluateApplicationQuestions(job, answers);
  const weights = {
    skills: Number(job?.ats_settings?.weights?.skills ?? 35),
    experience: Number(job?.ats_settings?.weights?.experience ?? 20),
    education: Number(job?.ats_settings?.weights?.education ?? 10),
    languages: Number(job?.ats_settings?.weights?.languages ?? 10),
    location: Number(job?.ats_settings?.weights?.location ?? 10),
    salary: Number(job?.ats_settings?.weights?.salary ?? 5),
    questions: Number(job?.ats_settings?.weights?.questions ?? 10),
  };
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Math.max(value, 0), 0) || 100;
  const breakdown = profileResult?.breakdown || {};
  const educationScore = breakdown.education ?? 100;
  const weightedTotal =
    (breakdown.skills ?? 100) * weights.skills +
    (breakdown.experience ?? 100) * weights.experience +
    educationScore * weights.education +
    (breakdown.language ?? 100) * weights.languages +
    (breakdown.location ?? 100) * weights.location +
    (breakdown.salary ?? 100) * weights.salary +
    questionResult.score * weights.questions;

  let score = Math.round(weightedTotal / totalWeight);
  if (questionResult.knockout.has_failed && questionResult.knockout.action === "reject") score = Math.min(score, 20);
  if (questionResult.knockout.has_failed && questionResult.knockout.action === "mark_not_match") score = Math.min(score, 49);

  const decision = score >= 80 ? "strong_match" : score >= 50 ? "needs_review" : "not_match";

  return {
    score,
    summary: questionResult.knockout.has_failed ? "failed_knockout_question" : decision,
    decision,
    weights,
    profile: profileResult || null,
    questions: questionResult,
    breakdown: {
      skills: breakdown.skills ?? null,
      experience: breakdown.experience ?? null,
      education: educationScore,
      languages: breakdown.language ?? null,
      location: breakdown.location ?? null,
      salary: breakdown.salary ?? null,
      questions: questionResult.score,
    },
  };
};
