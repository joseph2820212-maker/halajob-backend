import { buildTokens, buildSearchText, uniqueCleanArray } from "./normalizeSearch.js";

export const calculateEmployeeSeniorityScore = (employee) => {
  const years = Number(employee.experience_years || 0);
  if (years >= 10) return 100;
  if (years >= 7) return 85;
  if (years >= 5) return 70;
  if (years >= 3) return 55;
  if (years >= 1) return 35;
  return 15;
};

export const buildEmployeeProjection = async (employee) => {
  const skillTitles = (employee.skills || []).map((s) => s.title);
  const languageNames = employee.search_filters?.languages?.names || [];
  const jobTitles = [
    employee.current_job_title,
    employee.profile_headline,
    employee.latest_work_experience?.position,
    ...(employee.experience || []).map((e) => e.position),
  ];

  const educationTexts = [
    ...(employee.education || []).map((e) => e.level),
    ...(employee.education || []).map((e) => e.study),
    ...(employee.education || []).map((e) => e.institution),
  ];

  const preferredCountries = employee.search_filters?.preferred_countries?.values || [];
  const preferredWorkModes =
    employee.search_filters?.preferred_work_modes?.keys ||
    employee.search_filters?.preferred_work_modes?.titles_en ||
    [];

  const tokens = buildTokens(
    employee.profile_headline,
    employee.current_job_title,
    employee.about_me,
    skillTitles,
    languageNames,
    jobTitles,
    educationTexts,
    preferredCountries,
    preferredWorkModes,
    employee.candidate_stage,
    employee.work_location
  );

  const searchableText = buildSearchText(
    employee.profile_headline,
    employee.current_job_title,
    employee.about_me,
    skillTitles,
    languageNames,
    jobTitles,
    educationTexts,
    preferredCountries,
    preferredWorkModes,
    employee.candidate_stage,
    employee.work_location
  );

  return {
    normalized_skills: uniqueCleanArray(skillTitles),
    normalized_languages: uniqueCleanArray(languageNames),
    normalized_titles: uniqueCleanArray(jobTitles),
    normalized_job_names: uniqueCleanArray(employee.search_filters?.job_names?.keywords || []),
    normalized_job_types: uniqueCleanArray(employee.search_filters?.job_types?.names || []),
    preferred_country_values: uniqueCleanArray(preferredCountries),
    preferred_work_mode_keys: uniqueCleanArray(preferredWorkModes),
    career_tags: uniqueCleanArray([
      employee.candidate_stage,
      employee.work_location,
      employee.is_student ? "student" : "",
      employee.is_free_for_work ? "free_for_work" : "",
      employee.is_can_move ? "can_move" : "",
    ]),
    searchable_tokens: tokens,
    searchable_text: searchableText,
    seniority_score: calculateEmployeeSeniorityScore(employee),
    salary_min_base: employee.expected_salary?.min_base ?? null,
    salary_max_base: employee.expected_salary?.max_base ?? null,
    remote_ready: employee.work_location === "remote" || employee.work_location === "hybrid",
    relocation_ready: Boolean(employee.is_can_move),
    free_for_work: Boolean(employee.is_free_for_work),
  };
};
