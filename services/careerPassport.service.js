import crypto from "crypto";
import {
  CareerPassportModel,
  ContentTranslationModel,
  EmployeeModel,
  UserModel,
  UserApplyingJobModel,
  UserSavedJobModel,
} from "../models/index.js";
import { resolveAppAccount } from "./appAccount.service.js";
import { writeAuditLog } from "./auditLog.service.js";
import { handleSafeAiRequest } from "./ai/aiSafety.service.js";

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const idString = (value) => (value?._id || value || "").toString();
const text = (value) => String(value || "").trim();
const hasText = (value) => text(value).length > 0;
const list = (value) => (Array.isArray(value) ? value : []);
const uniqueStrings = (items = []) => [...new Set(items.map(text).filter(Boolean))];
const supportedTranslationLanguages = new Set(["ar", "en"]);

const languageFromReq = (req) => {
  const raw = text(
    req?.query?.lang ||
      req?.query?.language ||
      req?.get?.("lan") ||
      req?.get?.("x-language") ||
      req?.get?.("lang"),
  ).toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("ar")) return "ar";
  if (raw.startsWith("en")) return "en";
  return "";
};

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const hasTranslatedValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.values(value).some(hasTranslatedValue);
  return true;
};

const mergeTranslatedSnapshot = (base, translated) => {
  if (!hasTranslatedValue(translated)) return base;
  if (Array.isArray(translated)) return translated;
  if (!isPlainObject(base) || !isPlainObject(translated)) return translated;

  return Object.entries(translated).reduce(
    (next, [key, value]) => {
      if (!hasTranslatedValue(value)) return next;
      next[key] = mergeTranslatedSnapshot(next[key], value);
      return next;
    },
    { ...base },
  );
};

const translationPayloadForSnapshot = (translation = {}) => {
  const payload = translation.translated_text;
  if (!isPlainObject(payload)) return payload;
  return payload.career_passport || payload.passport || payload.snapshot || payload;
};

const applyApprovedCareerPassportTranslation = async ({
  result,
  employeeId,
  targetLanguage,
}) => {
  if (!employeeId || !supportedTranslationLanguages.has(targetLanguage)) return result;

  const translation = await ContentTranslationModel.findOne({
    entity_type: "career_passport",
    entity_id: employeeId,
    employee_id: employeeId,
    target_language: targetLanguage,
    status: "approved",
  })
    .select("target_language translated_text updatedAt status")
    .lean();

  if (!translation) {
    result.translation = null;
    return result;
  }

  result.snapshot = mergeTranslatedSnapshot(
    result.snapshot || {},
    translationPayloadForSnapshot(translation),
  );
  result.translation = {
    language: targetLanguage,
    status: "approved",
    source: "content_translations",
    translated_text: translation.translated_text || {},
    updated_at: translation.updatedAt || null,
  };
  return result;
};

const dateValue = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const skillTitle = (item = {}) => text(item.title || item.name || item.skill_name || item.skill_id?.title_en || item.skill_id?.name);
const languageName = (item = {}) => text(item.name || item.title || item.language_id?.title_en || item.language_id?.name || item.language_id);

const percentFromBooleans = (checks = []) => {
  if (!checks.length) return 0;
  return clampScore((checks.filter(Boolean).length / checks.length) * 100);
};

const component = ({ key, label, weight, score, explanation }) => ({
  key,
  label,
  weight,
  score: clampScore(score),
  explanation,
});

async function resolveEmployee(user) {
  const account = await resolveAppAccount(user, { createMissingEmployee: true });
  if (account.accountType !== "employee" || !account.employee?._id) {
    const error = new Error("CAREER_PASSPORT_EMPLOYEE_REQUIRED");
    error.statusCode = 403;
    throw error;
  }

  return EmployeeModel.findById(account.employee._id);
}

async function getActivityStats({ userId, employeeId }) {
  const appliedCount = await UserApplyingJobModel.countDocuments({
    $or: [{ user_id: userId }, { employee_id: employeeId }],
  });
  const interviewCount = await UserApplyingJobModel.countDocuments({
    $or: [{ user_id: userId }, { employee_id: employeeId }],
    status: { $in: ["interview", "interview_scheduled", "interview_completed", "offer", "accepted", "hired"] },
  });
  const hiredCount = await UserApplyingJobModel.countDocuments({
    $or: [{ user_id: userId }, { employee_id: employeeId }],
    status: { $in: ["accepted", "hired"] },
  });
  const savedCount = await UserSavedJobModel.countDocuments({ user_id: userId });

  return { appliedCount, interviewCount, hiredCount, savedCount };
}

function buildSnapshot({ user, employee, passport, stats }) {
  const technicalSkills = list(employee.student_profile?.technical_skills).map(skillTitle);
  const softSkills = list(employee.student_profile?.soft_skills).map(skillTitle);
  const skills = uniqueStrings([...list(employee.skills).map(skillTitle), ...technicalSkills, ...softSkills]);
  const languages = uniqueStrings(list(employee.languages).map(languageName));
  const education = list(employee.education).map((item) => ({
    id: idString(item),
    level: text(item.level || item.education_level_id?.title_en || item.education_level_id?.name),
    study: text(item.study),
    institution: text(item.institution),
    start_date: dateValue(item.start_date),
    end_date: dateValue(item.end_date),
    is_until_now: item.is_until_now === true,
  }));
  const experience = list(employee.experience).map((item) => ({
    id: idString(item),
    company_name: text(item.company_name),
    position: text(item.position),
    details: text(item.details),
    start_date: dateValue(item.start_date),
    end_date: dateValue(item.end_date),
    is_until_now: item.is_until_now === true,
  }));
  const projects = list(employee.student_profile?.projects).map((item) => ({
    id: idString(item),
    name: text(item.name),
    description: text(item.description),
    type: text(item.type),
    technologies: uniqueStrings(item.technologies),
    url: text(item.url),
  }));
  const cvs = list(employee.cvs).map((item) => ({
    id: idString(item),
    title: text(item.title || item.fileName || "CV"),
    file_name: text(item.fileName),
    url: text(item.url),
    status: text(item.status || "inactive"),
    template_key: text(item.template_key),
    created_from_builder: item.created_from_builder === true,
  }));
  const links = list(employee.links).map((item) => ({
    id: idString(item),
    title: text(item.title),
    url: text(item.url),
  }));

  return {
    identity: {
      user_id: idString(user),
      employee_id: idString(employee),
      name: [user.first_name, user.mid_name, user.last_name].map(text).filter(Boolean).join(" "),
      headline: text(employee.profile_headline || employee.current_job_title),
      current_job_title: text(employee.current_job_title),
      location_country: text(employee.current_country),
      location_city: text(employee.current_city),
      preferred_work_mode: text(employee.work_location),
      candidate_stage: text(employee.candidate_stage),
      is_student: employee.is_student === true,
      profile_photo: text(user.image),
      badges: {
        student_verified: employee.student_profile?.student_email_verified === true,
        education_added: education.length > 0,
        cv_added: cvs.length > 0,
      },
    },
    education: {
      university: text(employee.student_profile?.university),
      major: text(employee.student_profile?.specialty),
      graduation_year: employee.graduation_year || employee.student_profile?.expected_graduation_year || null,
      verification_status: employee.student_profile?.student_email_verified ? "verified" : "unverified",
      records: education,
      certificates: list(employee.licenses).map((item) => ({
        id: idString(item),
        name: text(item.name),
        end_in: dateValue(item.end_in),
        is_for_ever: item.is_for_ever === true,
      })),
    },
    experience_projects: { experience, projects, links },
    skills: {
      hard_skills: skills,
      soft_skills: uniqueStrings(softSkills),
      languages,
      missing_skills: list(passport?.score?.next_actions).filter((item) => /skill/i.test(item)),
    },
    cv_assets: {
      uploaded_count: cvs.filter((item) => item.url).length,
      generated_count: cvs.filter((item) => item.created_from_builder).length,
      active_cv: cvs.find((item) => item.status === "active") || null,
      cvs,
    },
    readiness: {
      employability_score: passport?.score || null,
      profile_completion: employee.profile_completion || 0,
      interview_count: stats.interviewCount,
      application_count: stats.appliedCount,
      saved_jobs_count: stats.savedCount,
      hired_count: stats.hiredCount,
    },
    privacy: {
      visibility: passport?.visibility || "private",
      share_enabled: passport?.share?.enabled === true,
      share_token: passport?.share?.enabled ? passport.share.token : "",
      share_expires_at: dateValue(passport?.share?.expires_at),
    },
  };
}

const safeDate = (value) => dateValue(value);

const safeText = (value, limit = 500) => text(value).slice(0, limit);

const safeStrings = (items = [], limit = 20) => uniqueStrings(list(items)).slice(0, limit);

const aiStringList = (value, limit = 8) => {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return uniqueStrings(
    items.map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      return (
        item.title ||
        item.label ||
        item.name ||
        item.reason ||
        item.explanation ||
        item.text ||
        ""
      );
    })
  )
    .map((item) => safeText(item, 220))
    .filter(Boolean)
    .slice(0, limit);
};

const nonNegativeInt = (value) => Math.max(0, Math.round(Number(value) || 0));

const safeRecord = (item = {}, fields = []) => {
  const record = {};
  for (const field of fields) {
    if (field === "technologies") {
      const values = safeStrings(item[field], 12);
      if (values.length) record[field] = values;
    } else if (field === "start_date" || field === "end_date" || field === "end_in") {
      const value = safeDate(item[field]);
      if (value) record[field] = value;
    } else if (field === "is_until_now" || field === "is_for_ever" || field === "created_from_builder") {
      record[field] = item[field] === true;
    } else {
      const value = safeText(item[field]);
      if (value) record[field] = value;
    }
  }
  return record;
};

export function sanitizeCareerPassportScore(score = {}) {
  return {
    total: clampScore(score.total ?? score.score),
    source: safeText(score.source || "rule_based_v1", 80),
    generated_by_ai: score.generated_by_ai === true || score.generatedByAi === true,
    explanation: safeText(score.explanation, 1200),
    components: list(score.components)
      .map((item) =>
        component({
          key: safeText(item.key, 80),
          label: safeText(item.label, 120),
          weight: item.weight,
          score: item.score,
          explanation: safeText(item.explanation, 500),
        })
      )
      .filter((item) => item.key || item.label),
    strengths: safeStrings(score.strengths, 12),
    next_actions: safeStrings(score.next_actions || score.nextActions, 12),
    updated_at: safeDate(score.updated_at || score.updatedAt),
  };
}

export function sanitizeCareerPassportSnapshotForShare(snapshot = {}, { viewerType = "public" } = {}) {
  const identity = snapshot.identity || {};
  const education = snapshot.education || {};
  const experienceProjects = snapshot.experience_projects || snapshot.experienceProjects || {};
  const skills = snapshot.skills || {};
  const cvAssets = snapshot.cv_assets || snapshot.cvAssets || {};
  const readiness = snapshot.readiness || {};
  const privacy = snapshot.privacy || {};
  const score = sanitizeCareerPassportScore(readiness.employability_score || snapshot.score || {});

  return {
    identity: {
      name: safeText(identity.name, 160),
      headline: safeText(identity.headline, 160),
      current_job_title: safeText(identity.current_job_title || identity.currentJobTitle, 160),
      location_country: safeText(identity.location_country || identity.locationCountry, 120),
      location_city: safeText(identity.location_city || identity.locationCity, 120),
      preferred_work_mode: safeText(identity.preferred_work_mode || identity.preferredWorkMode, 80),
      candidate_stage: safeText(identity.candidate_stage || identity.candidateStage, 80),
      is_student: identity.is_student === true || identity.isStudent === true,
      badges: {
        student_verified: identity.badges?.student_verified === true || identity.badges?.studentVerified === true,
        education_added: identity.badges?.education_added === true || identity.badges?.educationAdded === true,
        cv_added: identity.badges?.cv_added === true || identity.badges?.cvAdded === true,
      },
    },
    education: {
      university: safeText(education.university, 160),
      major: safeText(education.major, 160),
      graduation_year: safeText(education.graduation_year || education.graduationYear, 20),
      verification_status: safeText(education.verification_status || education.verificationStatus, 80),
      records: list(education.records)
        .map((item) => safeRecord(item, ["level", "study", "institution", "start_date", "end_date", "is_until_now"]))
        .filter((item) => Object.keys(item).length > 0),
      certificates: list(education.certificates)
        .map((item) => safeRecord(item, ["name", "end_in", "is_for_ever"]))
        .filter((item) => Object.keys(item).length > 0),
    },
    experience_projects: {
      experience: list(experienceProjects.experience)
        .map((item) => safeRecord(item, ["company_name", "position", "details", "start_date", "end_date", "is_until_now"]))
        .filter((item) => Object.keys(item).length > 0),
      projects: list(experienceProjects.projects)
        .map((item) => safeRecord(item, ["name", "description", "type", "technologies", "url"]))
        .filter((item) => Object.keys(item).length > 0),
      links: list(experienceProjects.links)
        .map((item) => safeRecord(item, ["title", "url"]))
        .filter((item) => Object.keys(item).length > 0),
    },
    skills: {
      hard_skills: safeStrings(skills.hard_skills || skills.hardSkills, 30),
      soft_skills: safeStrings(skills.soft_skills || skills.softSkills, 30),
      languages: safeStrings(skills.languages, 20),
      missing_skills: safeStrings(skills.missing_skills || skills.missingSkills, 20),
    },
    cv_assets: {
      uploaded_count: nonNegativeInt(cvAssets.uploaded_count || cvAssets.uploadedCount),
      generated_count: nonNegativeInt(cvAssets.generated_count || cvAssets.generatedCount),
      active_cv: cvAssets.active_cv || cvAssets.activeCv
        ? safeRecord(cvAssets.active_cv || cvAssets.activeCv, ["title", "file_name", "status", "template_key", "created_from_builder"])
        : null,
      cvs: list(cvAssets.cvs)
        .map((item) => safeRecord(item, ["title", "file_name", "status", "template_key", "created_from_builder"]))
        .filter((item) => Object.keys(item).length > 0),
    },
    readiness: {
      employability_score: score,
      profile_completion: clampScore(readiness.profile_completion || readiness.profileCompletion),
      interview_count: nonNegativeInt(readiness.interview_count || readiness.interviewCount),
      application_count: nonNegativeInt(readiness.application_count || readiness.applicationCount),
      saved_jobs_count: nonNegativeInt(readiness.saved_jobs_count || readiness.savedJobsCount),
      hired_count: nonNegativeInt(readiness.hired_count || readiness.hiredCount),
    },
    privacy: {
      visibility: safeText(privacy.visibility || "private", 80),
      share_enabled: privacy.share_enabled === true || privacy.shareEnabled === true,
      share_expires_at: safeDate(privacy.share_expires_at || privacy.shareExpiresAt),
      viewer_type: safeText(viewerType, 40),
    },
  };
}

function calculateScore({ employee, snapshot, stats }) {
  const activeCv = snapshot.cv_assets.active_cv;
  const profileCompleteness = employee.profile_completion
    ? clampScore(employee.profile_completion)
    : percentFromBooleans([
        hasText(snapshot.identity.name),
        hasText(snapshot.identity.headline),
        hasText(employee.about_me),
        hasText(snapshot.identity.location_country),
        hasText(snapshot.identity.preferred_work_mode),
        snapshot.education.records.length > 0 || hasText(snapshot.education.university),
        snapshot.experience_projects.experience.length > 0 || snapshot.experience_projects.projects.length > 0,
        snapshot.skills.hard_skills.length > 0,
        snapshot.skills.languages.length > 0,
        snapshot.cv_assets.uploaded_count > 0,
      ]);

  const cvQuality = percentFromBooleans([
    Boolean(activeCv),
    snapshot.cv_assets.uploaded_count > 0,
    snapshot.cv_assets.generated_count > 0,
    hasText(employee.about_me),
    snapshot.experience_projects.experience.length > 0,
    snapshot.education.records.length > 0,
    snapshot.skills.hard_skills.length >= 5,
    snapshot.skills.languages.length > 0,
  ]);

  const skillsMatch = clampScore(Math.min(100, snapshot.skills.hard_skills.length * 12 + snapshot.skills.languages.length * 8));
  const jobReadiness = percentFromBooleans([
    employee.is_free_for_work === true,
    hasText(employee.work_location),
    list(employee.job_names).length > 0 || hasText(employee.profile_headline),
    list(employee.job_types).length > 0,
    list(employee.preferred_work_modes).length > 0 || hasText(employee.work_location),
    list(employee.preferred_countries).length > 0 || hasText(employee.current_country),
    employee.expected_salary?.min || employee.expected_salary?.max,
    stats.savedCount > 0 || stats.appliedCount > 0,
  ]);
  const interviewReadiness = clampScore(Math.min(100, stats.interviewCount * 30 + stats.hiredCount * 40 + (hasText(employee.about_me) ? 20 : 0)));
  const educationVerification = percentFromBooleans([
    snapshot.education.records.length > 0 || hasText(snapshot.education.university),
    employee.student_profile?.student_email_verified === true || !employee.is_student,
  ]);
  const applicationActivity = clampScore(Math.min(100, stats.savedCount * 10 + stats.appliedCount * 20));
  const trustActivity = percentFromBooleans([employee.status !== false, employee.accepted === true || employee.profile_visibility !== "private"]);

  const components = [
    component({ key: "profile_completeness", label: "Profile completeness", weight: 15, score: profileCompleteness, explanation: "Core identity, contact, career, education, skill, and CV fields." }),
    component({ key: "cv_quality", label: "CV quality", weight: 20, score: cvQuality, explanation: "CV presence plus profile sections needed for an employer-ready CV." }),
    component({ key: "skills_match", label: "Skills match", weight: 20, score: skillsMatch, explanation: "Current skills and languages available for matching." }),
    component({ key: "job_readiness", label: "Job readiness", weight: 15, score: jobReadiness, explanation: "Availability, work preferences, salary, and application readiness." }),
    component({ key: "interview_readiness", label: "Interview readiness", weight: 10, score: interviewReadiness, explanation: "Interview activity plus profile narrative readiness." }),
    component({ key: "education_verification", label: "Education verification", weight: 10, score: educationVerification, explanation: "Education record and verified student evidence where relevant." }),
    component({ key: "application_activity", label: "Application activity", weight: 5, score: applicationActivity, explanation: "Healthy saved/applied job activity." }),
    component({ key: "trust_activity", label: "Trust/activity", weight: 5, score: trustActivity, explanation: "Active account and profile trust readiness." }),
  ];

  const total = clampScore(components.reduce((sum, item) => sum + item.score * (item.weight / 100), 0));
  const nextActions = [];
  if (!activeCv) nextActions.push("Upload or generate an active CV.");
  if (!hasText(employee.about_me)) nextActions.push("Add an about-me summary.");
  if (snapshot.skills.hard_skills.length < 5) nextActions.push("Add more role-relevant skills.");
  if (!hasText(snapshot.identity.preferred_work_mode)) nextActions.push("Choose a preferred work mode.");
  if (employee.is_student && !employee.student_profile?.student_email_verified) nextActions.push("Verify your student email or university evidence.");

  const strengths = [];
  if (profileCompleteness >= 75) strengths.push("Profile is mostly complete.");
  if (skillsMatch >= 70) strengths.push("Skills are strong enough for matching.");
  if (cvQuality >= 70) strengths.push("CV assets are ready for employers.");
  if (stats.appliedCount > 0) strengths.push("Application activity is already started.");

  return {
    total,
    source: "rule_based_v1",
    generated_by_ai: false,
    explanation: `Rule-based employability score generated from profile, CV, skills, education, verification, and activity evidence. Current score: ${total}/100.`,
    components,
    strengths,
    next_actions: nextActions,
    updated_at: new Date(),
  };
}

export function mergeCareerPassportScoreWithAiOutput({
  score = {},
  output = {},
  now = new Date(),
} = {}) {
  const sourceScore =
    score && typeof score.toObject === "function" ? score.toObject() : score || {};
  const aiStrengths = aiStringList(output.strengths, 6);
  const weakSections = aiStringList(output.weak_sections, 6);
  const missingFields = aiStringList(output.missing_fields, 6);
  const recommendedEdits = aiStringList(output.recommended_edits, 8);
  const providerScore = Number(output.score);
  const providerSignal = Number.isFinite(providerScore)
    ? `AI profile-score signal: ${clampScore(providerScore)}/100.`
    : "";
  const explanationParts = [
    "AI-assisted explanation layered over the rule-based Career Passport score.",
    providerSignal,
    aiStrengths.length ? `Strengths: ${aiStrengths.join("; ")}.` : "",
    weakSections.length ? `Weak sections: ${weakSections.join("; ")}.` : "",
    recommendedEdits.length ? `Recommended edits: ${recommendedEdits.join("; ")}.` : "",
  ].filter(Boolean);

  return {
    ...sourceScore,
    total: clampScore(sourceScore.total ?? sourceScore.score),
    source: "ai_assisted_v1",
    generated_by_ai: true,
    explanation: safeText(
      explanationParts.join(" ") || sourceScore.explanation,
      1200
    ),
    strengths: safeStrings([...(sourceScore.strengths || []), ...aiStrengths], 12),
    next_actions: safeStrings(
      [
        ...(sourceScore.next_actions || sourceScore.nextActions || []),
        ...missingFields,
        ...weakSections,
        ...recommendedEdits,
      ],
      12
    ),
    updated_at: now,
  };
}

const buildCareerPassportAiRequest = ({ req, snapshot = {}, score = {} }) => ({
  user: req?.user,
  activeContext: req?.activeContext,
  appAccount: req?.appAccount,
  params: {
    ...(req?.params || {}),
    source: "career_passport_score",
  },
  query: req?.query || {},
  body: {
    source: "career_passport_score",
    career_passport: {
      identity: {
        headline: safeText(snapshot.identity?.headline, 160),
        current_job_title: safeText(snapshot.identity?.current_job_title, 160),
        preferred_work_mode: safeText(snapshot.identity?.preferred_work_mode, 80),
        candidate_stage: safeText(snapshot.identity?.candidate_stage, 80),
        is_student: snapshot.identity?.is_student === true,
        student_verified: snapshot.identity?.badges?.student_verified === true,
      },
      education: {
        university: safeText(snapshot.education?.university, 160),
        major: safeText(snapshot.education?.major, 160),
        verification_status: safeText(snapshot.education?.verification_status, 80),
        records_count: list(snapshot.education?.records).length,
      },
      skills: {
        hard_skills: safeStrings(snapshot.skills?.hard_skills, 20),
        soft_skills: safeStrings(snapshot.skills?.soft_skills, 20),
        languages: safeStrings(snapshot.skills?.languages, 12),
      },
      cv_assets: {
        uploaded_count: nonNegativeInt(snapshot.cv_assets?.uploaded_count),
        generated_count: nonNegativeInt(snapshot.cv_assets?.generated_count),
        has_active_cv: Boolean(snapshot.cv_assets?.active_cv),
      },
      readiness: {
        profile_completion: clampScore(snapshot.readiness?.profile_completion),
        interview_count: nonNegativeInt(snapshot.readiness?.interview_count),
        application_count: nonNegativeInt(snapshot.readiness?.application_count),
        saved_jobs_count: nonNegativeInt(snapshot.readiness?.saved_jobs_count),
      },
      score: {
        total: clampScore(score.total ?? score.score),
        source: safeText(score.source || "rule_based_v1", 80),
        components: list(score.components).map((item) => ({
          key: safeText(item.key, 80),
          label: safeText(item.label, 120),
          score: clampScore(item.score),
          weight: Number(item.weight || 0),
        })),
        strengths: safeStrings(score.strengths, 12),
        next_actions: safeStrings(score.next_actions || score.nextActions, 12),
      },
    },
  },
  headers: req?.headers || {},
  ip: req?.ip || "",
});

const buildCareerPassportAiStatus = ({
  score = {},
  aiStatus = {},
  message = "",
} = {}) => ({
  generated_by_ai: score.generated_by_ai === true,
  source: score.source || "rule_based_v1",
  request_id: aiStatus.request_id || null,
  status: aiStatus.status || (score.generated_by_ai ? "completed" : "fallback"),
  reason: aiStatus.reason || (score.generated_by_ai ? "provider_result" : "rule_based_fallback"),
  cached: aiStatus.cached === true,
  message:
    message ||
    (score.generated_by_ai
      ? "AI-assisted score explanation applied. Review suggestions before acting."
      : "Rule-based score returned because AI explanation is unavailable or disabled."),
});

async function applyAiScoreExplanation({ req, result }) {
  const score = result.passport.score || {};

  try {
    const aiResult = await handleSafeAiRequest({
      req: buildCareerPassportAiRequest({
        req,
        snapshot: result.snapshot,
        score,
      }),
      feature: "profile_score",
    });
    const aiStatus = aiResult?.payload?.ai_status || {};
    const output = aiResult?.payload?.output || {};
    const canUseAiOutput =
      aiResult?.success === true &&
      ["completed", "cached"].includes(aiStatus.status) &&
      output &&
      typeof output === "object" &&
      !Array.isArray(output);

    if (!canUseAiOutput) {
      result.aiStatus = buildCareerPassportAiStatus({
        score,
        aiStatus,
      });
      return result;
    }

    const aiScore = mergeCareerPassportScoreWithAiOutput({
      score,
      output,
    });
    result.passport.score = aiScore;
    result.snapshot = {
      ...result.snapshot,
      readiness: {
        ...(result.snapshot?.readiness || {}),
        employability_score: aiScore,
      },
    };
    result.passport.snapshot = result.snapshot;
    result.passport.markModified("score");
    result.passport.markModified("snapshot");
    await result.passport.save();
    result.aiStatus = buildCareerPassportAiStatus({
      score: aiScore,
      aiStatus,
    });
    return result;
  } catch (error) {
    result.aiStatus = buildCareerPassportAiStatus({
      score,
      message: "Rule-based score returned because the AI explanation check failed safely.",
    });
    return result;
  }
}

async function upsertPassport({ user, employee, activeContextId = null, refreshScore = false }) {
  let passport = await CareerPassportModel.findOne({ user_id: user._id });
  if (!passport) {
    passport = new CareerPassportModel({
      user_id: user._id,
      employee_id: employee._id,
      active_context_id: activeContextId,
      visibility: "private",
    });
  }

  const stats = await getActivityStats({ userId: user._id, employeeId: employee._id });
  let snapshot = buildSnapshot({ user, employee, passport, stats });
  if (refreshScore || !passport.score?.updated_at) {
    passport.score = calculateScore({ employee, snapshot, stats });
  }

  passport.employee_id = employee._id;
  passport.active_context_id = activeContextId || passport.active_context_id || null;
  passport.snapshot = buildSnapshot({ user, employee, passport, stats });
  await passport.save();

  snapshot = buildSnapshot({ user, employee, passport, stats });
  return { passport, snapshot };
}

export async function getCareerPassport({ user, req }) {
  const employee = await resolveEmployee(user);
  const result = await upsertPassport({
    user,
    employee,
    activeContextId: req?.activeContext?.id || null,
    refreshScore: false,
  });
  return applyApprovedCareerPassportTranslation({
    result,
    employeeId: employee._id,
    targetLanguage: languageFromReq(req),
  });
}

export async function getSharedCareerPassport({ token, viewerType = "public" }) {
  const normalizedToken = text(token);
  if (
    normalizedToken.length < 16 ||
    normalizedToken.length > 128 ||
    !/^[A-Za-z0-9._-]+$/.test(normalizedToken)
  ) {
    const error = new Error("career_passport_share_not_found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const passport = await CareerPassportModel.findOne({
    "share.token": normalizedToken,
    "share.enabled": true,
    $and: [
      {
        $or: [
          { "share.revoked_at": null },
          { "share.revoked_at": { $exists: false } },
        ],
      },
      {
        $or: [
          { "share.expires_at": null },
          { "share.expires_at": { $exists: false } },
          { "share.expires_at": { $gt: now } },
        ],
      },
    ],
  }).lean();

  if (!passport) {
    const error = new Error("career_passport_share_not_found");
    error.statusCode = 404;
    throw error;
  }

  const snapshot = {
    ...(passport.snapshot || {}),
    readiness: {
      ...((passport.snapshot || {}).readiness || {}),
      employability_score: passport.score || (passport.snapshot || {}).readiness?.employability_score,
    },
    privacy: {
      ...((passport.snapshot || {}).privacy || {}),
      visibility: passport.visibility || (passport.snapshot || {}).privacy?.visibility || "private",
      share_enabled: true,
      share_expires_at: passport.share?.expires_at || null,
    },
  };

  const safeSnapshot = sanitizeCareerPassportSnapshotForShare(snapshot, { viewerType });
  const safeScore = sanitizeCareerPassportScore(passport.score || snapshot.readiness?.employability_score || {});

  return {
    passport,
    snapshot: safeSnapshot,
    score: safeScore,
    visibility: passport.visibility || "private",
    share: {
      enabled: true,
      expires_at: safeDate(passport.share?.expires_at),
    },
    viewerType,
  };
}

async function resolveUserForEmployee(employee = {}) {
  const embeddedUser = employee.user_id && typeof employee.user_id === "object"
    ? employee.user_id
    : null;
  if (embeddedUser?._id) return embeddedUser;

  const userId = idString(employee.user_id);
  if (!userId) return null;
  return UserModel.findById(userId).lean();
}

export async function getCareerPassportSafeViewForEmployee({
  employee,
  viewerType = "university",
}) {
  const user = await resolveUserForEmployee(employee);
  if (!user?._id || !employee?._id) {
    const error = new Error("career_passport_student_not_found");
    error.statusCode = 404;
    throw error;
  }

  const [passport, stats] = await Promise.all([
    CareerPassportModel.findOne({ user_id: user._id }).lean(),
    getActivityStats({ userId: user._id, employeeId: employee._id }),
  ]);

  const passportForSnapshot = passport || {
    visibility: "private",
    share: { enabled: false },
    score: null,
  };
  let snapshot = buildSnapshot({ user, employee, passport: passportForSnapshot, stats });
  const score = passport?.score?.updated_at
    ? passport.score
    : calculateScore({ employee, snapshot, stats });

  snapshot = buildSnapshot({
    user,
    employee,
    passport: { ...passportForSnapshot, score },
    stats,
  });

  return {
    employee,
    user,
    passport,
    snapshot: sanitizeCareerPassportSnapshotForShare(snapshot, { viewerType }),
    score: sanitizeCareerPassportScore(score),
    visibility: passport?.visibility || "private",
    viewerType,
  };
}

export async function refreshCareerPassportScore({ user, req }) {
  const employee = await resolveEmployee(user);
  const result = await applyAiScoreExplanation({
    req,
    result: await upsertPassport({
      user,
      employee,
      activeContextId: req?.activeContext?.id || null,
      refreshScore: true,
    }),
  });

  const generatedByAi = result.passport.score?.generated_by_ai === true;

  await writeAuditLog({
    req,
    actorId: user._id,
    actorType: "employee",
    action: "career_passport_score_refreshed",
    targetType: "career_passport",
    targetId: result.passport._id,
    metadata: {
      score: result.passport.score?.total,
      score_source: result.passport.score?.source,
      generated_by_ai: generatedByAi,
      ai_status: result.aiStatus?.status || "",
      ai_reason: result.aiStatus?.reason || "",
    },
  });

  return result;
}

export async function updateCareerPassport({ user, body = {}, req }) {
  const employee = await resolveEmployee(user);
  const set = {};
  const allowedVisibility = new Set(["private", "companies_only", "public"]);
  const allowedWorkMode = new Set(["remote", "hybrid", "onsite", "field", "unknown", ""]);

  if (body.headline !== undefined) set.profile_headline = text(body.headline).slice(0, 160);
  if (body.current_job_title !== undefined) set.current_job_title = text(body.current_job_title).slice(0, 160);
  if (body.about_me !== undefined) set.about_me = text(body.about_me).slice(0, 2000);
  if (body.preferred_work_mode !== undefined && allowedWorkMode.has(text(body.preferred_work_mode))) {
    set.work_location = text(body.preferred_work_mode) || "unknown";
  }
  if (body.visibility !== undefined && allowedVisibility.has(text(body.visibility))) {
    set.profile_visibility = text(body.visibility);
  }

  if (Object.keys(set).length) {
    await EmployeeModel.updateOne({ _id: employee._id }, { $set: set });
  }

  const refreshedEmployee = await EmployeeModel.findById(employee._id);
  const result = await upsertPassport({
    user,
    employee: refreshedEmployee,
    activeContextId: req?.activeContext?.id || null,
    refreshScore: true,
  });

  if (body.visibility !== undefined && allowedVisibility.has(text(body.visibility))) {
    result.passport.visibility = text(body.visibility);
    await result.passport.save();
    result.snapshot.privacy.visibility = result.passport.visibility;
  }

  await writeAuditLog({
    req,
    actorId: user._id,
    actorType: "employee",
    action: "career_passport_updated",
    targetType: "career_passport",
    targetId: result.passport._id,
    metadata: { fields: Object.keys(set), visibility: result.passport.visibility },
  });

  return result;
}

export async function updateCareerPassportShare({ user, body = {}, req }) {
  const employee = await resolveEmployee(user);
  const result = await upsertPassport({
    user,
    employee,
    activeContextId: req?.activeContext?.id || null,
    refreshScore: false,
  });

  const enabled = body.enabled !== false && body.action !== "revoke";
  if (!enabled) {
    result.passport.share.enabled = false;
    result.passport.share.revoked_at = new Date();
  } else {
    result.passport.share.enabled = true;
    result.passport.share.token = result.passport.share.token || crypto.randomBytes(24).toString("hex");
    result.passport.share.created_at = result.passport.share.created_at || new Date();
    result.passport.share.revoked_at = null;
    result.passport.share.expires_at = body.expires_at ? new Date(body.expires_at) : null;
  }

  await result.passport.save();
  const stats = await getActivityStats({ userId: user._id, employeeId: employee._id });
  result.snapshot = buildSnapshot({ user, employee, passport: result.passport, stats });

  await writeAuditLog({
    req,
    actorId: user._id,
    actorType: "employee",
    action: enabled ? "career_passport_share_enabled" : "career_passport_share_revoked",
    targetType: "career_passport",
    targetId: result.passport._id,
    metadata: { enabled },
  });

  return result;
}
