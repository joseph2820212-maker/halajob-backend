const cleanText = (value = "") => String(value || "").trim();

const normalizeToken = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, " ")
    .trim();

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toId = (value) => String(value?._id || value?.id || value || "").trim();

const unique = (arr = []) => [
  ...new Set(arr.map((x) => cleanText(x)).filter(Boolean)),
];

const uniqueTokens = (arr = []) => [
  ...new Set(arr.map((x) => normalizeToken(x)).filter(Boolean)),
];

const getLabel = (value) => {
  if (!value) return "";

  if (typeof value === "string") return cleanText(value);

  return cleanText(
    value.title ||
      value.name ||
      value.label ||
      value.title_ar ||
      value.title_en ||
      value.job_name ||
      value.current_job_title ||
      value.profile_headline ||
      ""
  );
};

const getLocalizedTitle = (item, lang = "ar") => {
  if (!item) return "";

  if (typeof item === "string") return cleanText(item);

  if (lang === "ar") {
    return cleanText(item.title_ar || item.name_ar || item.title || item.name || item.title_en || item.label);
  }

  return cleanText(item.title_en || item.name_en || item.title || item.name || item.title_ar || item.label);
};

const makeRegexList = (items = []) =>
  uniqueTokens(items)
    .filter((x) => x.length >= 2)
    .slice(0, 12)
    .map((x) => new RegExp(escapeRegex(x), "i"));

const idsFromArray = (items = []) =>
  unique(
    (Array.isArray(items) ? items : [])
      .map((item) => toId(item))
      .filter(Boolean)
  );

const labelsFromArray = (items = [], nestedKey = null) =>
  unique(
    (Array.isArray(items) ? items : [])
      .map((item) => {
        if (nestedKey && item?.[nestedKey]) return getLabel(item[nestedKey]);
        return getLabel(item);
      })
      .filter(Boolean)
  );

export const collectEmployeeSkillNames = (employee = {}) =>
  labelsFromArray(employee.skills || [], "skill_id").concat(
    labelsFromArray(employee.skills || [])
  );

export const collectEmployeeLanguageNames = (employee = {}) =>
  labelsFromArray(employee.languages || [], "language_id").concat(
    labelsFromArray(employee.languages || [])
  );

export const collectJobSkillNames = (job = {}) => [
  ...labelsFromArray(job.skills_required || [], "skill_id"),
  ...labelsFromArray(job.skills_required || []),
  ...labelsFromArray(job.skills_optional || [], "skill_id"),
  ...labelsFromArray(job.skills_optional || []),
];

export const collectJobLanguageNames = (job = {}) => [
  ...labelsFromArray(job.languages || [], "language_id"),
  ...labelsFromArray(job.languages || []),
];

/**
 * لا يرجع وظائف عامة.
 * في حال الموظف لا يملك أي بيانات مطابقة، يرجع فلتر مستحيل حتى لا تظهر وظائف عشوائية.
 */
export const buildEmployeeCompatibleJobFilter = (employee = {}, baseFilter = {}) => {
  const filter = { ...baseFilter };
  const or = [];

  const jobTypeIds = idsFromArray(employee.job_types || []);
  if (jobTypeIds.length) or.push({ job_type_id: { $in: jobTypeIds } });

  const workModeIds = idsFromArray(employee.preferred_work_modes || []);
  if (workModeIds.length) or.push({ work_mode_id: { $in: workModeIds } });

  const preferredCountries = idsFromArray(employee.preferred_countries || []);
  if (preferredCountries.length) or.push({ countries: { $in: preferredCountries } });

  if (employee.experience_level_id) {
    or.push({ experience_level_id: toId(employee.experience_level_id) });
  }

  const targetMap = {
    student: "students",
    graduate: "graduates",
    fresh_graduate: "fresh_graduates",
    experienced: "experienced",
    career_changer: "career_changers",
  };

  const candidateTarget = targetMap[employee.candidate_stage];
  if (candidateTarget) {
    or.push({ candidate_target: { $in: [candidateTarget, "all"] } });
  }

  const targetJobNames = labelsFromArray(employee.job_names || []);
  const targetJobRegex = makeRegexList([
    ...targetJobNames,
    employee.current_job_title,
    employee.profile_headline,
  ]);

  if (targetJobRegex.length) {
    or.push(
      { job_name: { $in: targetJobRegex } },
      { "search_index.title_norm": { $in: targetJobRegex } },
      { "search_index.text_norm": { $in: targetJobRegex } },
      { "search_projection.matching.text": { $in: targetJobRegex } }
    );
  }

  const skillTokens = uniqueTokens(collectEmployeeSkillNames(employee));
  if (skillTokens.length) {
    or.push(
      { "search_index.skill_tokens": { $in: skillTokens } },
      { "search_index.filters.skills": { $in: skillTokens } },
      { "skills_required.title": { $in: makeRegexList(skillTokens) } },
      { "skills_optional.title": { $in: makeRegexList(skillTokens) } }
    );
  }

  const languageTokens = uniqueTokens(collectEmployeeLanguageNames(employee));
  if (languageTokens.length) {
    or.push(
      { "search_index.filters.languages": { $in: languageTokens } },
      { "languages.name": { $in: makeRegexList(languageTokens) } }
    );
  }

  if (!or.length) {
    return {
      ...filter,
      _id: { $exists: false },
    };
  }

  filter.$or = or;
  return filter;
};

export const getMissingJobRequirementsForEmployee = (employee = {}, job = {}, lang = "ar") => {
  const employeeSkills = new Set(uniqueTokens(collectEmployeeSkillNames(employee)));
  const jobSkills = unique(collectJobSkillNames(job));
  const missingSkills = jobSkills.filter((skill) => {
    const token = normalizeToken(skill);
    return token && !employeeSkills.has(token);
  });

  const employeeLanguages = new Set(uniqueTokens(collectEmployeeLanguageNames(employee)));
  const jobLanguages = unique(collectJobLanguageNames(job));
  const missingLanguages = jobLanguages.filter((language) => {
    const token = normalizeToken(language);
    return token && !employeeLanguages.has(token);
  });

  return {
    missing_skills: missingSkills.slice(0, 6),
    missing_languages: missingLanguages.slice(0, 4),
    has_missing: missingSkills.length > 0 || missingLanguages.length > 0,
  };
};

export const normalizeMatchedJob = (match = {}, employee = null, lang = "ar") => {
  const job = match.job_id || match.job || null;
  const missing = employee && job ? getMissingJobRequirementsForEmployee(employee, job, lang) : {};

  return {
    _id: match._id,
    score: Number(match.score ?? match.match_score ?? 0),
    percentage: Math.round(Number(match.score ?? match.match_score ?? 0)),
    reason: match.reason || match.match_reason || "recommended_by_smart_matching",
    generated_at: match.generated_at || match.createdAt || null,
    matched_skills: match.matched_skills || match.match_details?.matched_skills || [],
    missing_skills: match.missing_skills || match.match_details?.missing_skills || missing.missing_skills || [],
    missing_languages:
      match.missing_languages || match.match_details?.missing_languages || missing.missing_languages || [],
    tips: buildJobTips({
      job,
      missingSkills: match.missing_skills || missing.missing_skills || [],
      missingLanguages: match.missing_languages || missing.missing_languages || [],
      lang,
    }),
    job,
    company: match.company_id || job?.company_id || null,
  };
};

export const normalizeRecommendedFallbackJob = (job = {}, employee = {}, lang = "ar") => {
  const missing = getMissingJobRequirementsForEmployee(employee, job, lang);

  return {
    score: null,
    percentage: null,
    reason: "matched_by_employee_profile",
    matched_skills: [],
    missing_skills: missing.missing_skills || [],
    missing_languages: missing.missing_languages || [],
    tips: buildJobTips({
      job,
      missingSkills: missing.missing_skills || [],
      missingLanguages: missing.missing_languages || [],
      lang,
    }),
    job,
  };
};

export const buildJobTips = ({ job = {}, missingSkills = [], missingLanguages = [], lang = "ar" }) => {
  const tips = [];
  const jobName = getLabel(job.job_name || job) || (lang === "ar" ? "هذه الوظيفة" : "this job");

  missingSkills.slice(0, 3).forEach((skill) => {
    tips.push({
      key: `missing_skill_${normalizeToken(skill).replace(/\s+/g, "_")}`,
      type: "skill",
      priority: "high",
      title: lang === "ar" ? `طوّر مهارة ${skill}` : `Improve ${skill}`,
      description:
        lang === "ar"
          ? `فرصتك في ${jobName} قد تتحسن إذا أضفت أو طوّرت مهارة ${skill}.`
          : `Your chance for ${jobName} may improve if you add or strengthen ${skill}.`,
      action: "skills",
    });
  });

  missingLanguages.slice(0, 2).forEach((language) => {
    tips.push({
      key: `missing_language_${normalizeToken(language).replace(/\s+/g, "_")}`,
      type: "language",
      priority: "medium",
      title: lang === "ar" ? `أضف لغة ${language}` : `Add ${language}`,
      description:
        lang === "ar"
          ? `بعض الوظائف المناسبة لك تطلب لغة ${language}. إضافتها للملف قد يرفع نسبة التطابق.`
          : `Some matched jobs require ${language}. Adding it to your profile may increase your match score.`,
      action: "languages",
    });
  });

  return tips;
};

const pushUniqueTip = (tips, tip) => {
  if (!tip?.key) return;
  if (tips.some((item) => item.key === tip.key)) return;
  tips.push(tip);
};

export const buildDashboardSmartTips = ({
  employee = {},
  profileMissingItems = [],
  recommendedJobs = [],
  matchedJobs = [],
  applications = [],
  lang = "ar",
}) => {
  const tips = [];

  const isAr = lang === "ar";

  if (profileMissingItems.some((item) => item.key === "active_cv")) {
    pushUniqueTip(tips, {
      key: "upload_active_cv",
      type: "profile",
      priority: "high",
      title: isAr ? "ارفع CV فعّال" : "Upload an active CV",
      description: isAr
        ? "وجود CV فعّال يساعدك على التقديم بسرعة ويزيد ثقة الشركات بملفك."
        : "An active CV helps you apply faster and makes your profile more reliable for companies.",
      action: "cv",
    });
  }

  if (profileMissingItems.some((item) => item.key === "skills")) {
    pushUniqueTip(tips, {
      key: "complete_skills",
      type: "profile",
      priority: "high",
      title: isAr ? "أكمل المهارات" : "Complete your skills",
      description: isAr
        ? "الخوارزمية تعتمد على المهارات بشكل أساسي لاقتراح وظائف مناسبة لك."
        : "The matching system relies heavily on skills to recommend relevant jobs.",
      action: "skills",
    });
  }

  if (profileMissingItems.some((item) => item.key === "languages")) {
    pushUniqueTip(tips, {
      key: "complete_languages",
      type: "profile",
      priority: "medium",
      title: isAr ? "أضف اللغات التي تعرفها" : "Add your languages",
      description: isAr
        ? "إضافة اللغات ومستواها تساعد النظام على مطابقتك مع وظائف أدق."
        : "Adding languages and levels helps the system match you with better jobs.",
      action: "languages",
    });
  }

  const allRecommendations = [...recommendedJobs, ...matchedJobs];

  const skillCounts = new Map();
  const languageCounts = new Map();

  allRecommendations.forEach((item) => {
    const missingSkills = item.missing_skills || item.match_analysis?.missing_skills || [];
    const missingLanguages = item.missing_languages || item.match_analysis?.missing_languages || [];

    missingSkills.forEach((skill) => {
      const label = cleanText(skill);
      if (!label) return;
      skillCounts.set(label, (skillCounts.get(label) || 0) + 1);
    });

    missingLanguages.forEach((language) => {
      const label = cleanText(language);
      if (!label) return;
      languageCounts.set(label, (languageCounts.get(label) || 0) + 1);
    });
  });

  [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .forEach(([skill, count]) => {
      pushUniqueTip(tips, {
        key: `dashboard_skill_${normalizeToken(skill).replace(/\s+/g, "_")}`,
        type: "skill",
        priority: count >= 2 ? "high" : "medium",
        title: isAr ? `مهارة مطلوبة: ${skill}` : `In-demand skill: ${skill}`,
        description: isAr
          ? `ظهرت مهارة ${skill} في ${count} من الوظائف المناسبة لك. إضافتها أو تحسينها قد يرفع فرصك.`
          : `${skill} appeared in ${count} matched job(s). Adding or improving it may increase your chances.`,
        action: "skills",
      });
    });

  [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([language, count]) => {
      pushUniqueTip(tips, {
        key: `dashboard_language_${normalizeToken(language).replace(/\s+/g, "_")}`,
        type: "language",
        priority: "medium",
        title: isAr ? `لغة مطلوبة: ${language}` : `Useful language: ${language}`,
        description: isAr
          ? `لغة ${language} مطلوبة في ${count} من الوظائف المتوافقة معك.`
          : `${language} is required in ${count} matched job(s).`,
        action: "languages",
      });
    });

  const rejectedCount = applications.filter((item) => item.status === "rejected").length;
  const waitingCount = applications.filter((item) => item.status === "waiting").length;

  if (rejectedCount >= 2) {
    pushUniqueTip(tips, {
      key: "improve_after_rejections",
      type: "application",
      priority: "high",
      title: isAr ? "راجع أسباب عدم القبول" : "Review rejection patterns",
      description: isAr
        ? "لديك عدة طلبات مرفوضة. راجع المهارات المطلوبة وحدّث CV قبل التقديم التالي."
        : "You have several rejected applications. Review required skills and update your CV before applying again.",
      action: "applications",
    });
  }

  if (waitingCount >= 3) {
    pushUniqueTip(tips, {
      key: "follow_waiting_applications",
      type: "application",
      priority: "low",
      title: isAr ? "تابع طلباتك المعلقة" : "Follow up pending applications",
      description: isAr
        ? "يوجد لديك عدة طلبات قيد الانتظار. تابع حالتها وابق ملفك محدثًا."
        : "You have several pending applications. Keep tracking them and keep your profile updated.",
      action: "applications",
    });
  }

  return tips.slice(0, 8);
};
