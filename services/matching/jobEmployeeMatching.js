const intersection = (a = [], b = []) => {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
};

const difference = (a = [], b = []) => {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x));
};

const percentage = (matched, total) => {
  if (!total) return 100;
  return Math.round((matched / total) * 100);
};

export const calculateJobEmployeeMatch = (job, employee) => {
  const jobReq = job.search_projection?.requirements || {};
  const employeeProfile = employee.matching_profile || {};

  const jobSkills = jobReq.skills || [];
  const employeeSkills = employeeProfile.normalized_skills || [];
  const matchedSkills = intersection(jobSkills, employeeSkills);
  const missingSkills = difference(jobSkills, employeeSkills);
  const skillsScore = percentage(matchedSkills.length, jobSkills.length);

  const employeeYears = Number(employee.experience_years || 0);
  const minYears = Number(jobReq.min_experience_years || 0);
  const maxYears = jobReq.max_experience_years;

  let experienceScore = 100;
  if (employeeYears < minYears) {
    experienceScore = Math.max(0, Math.round((employeeYears / Math.max(minYears, 1)) * 100));
  }
  if (maxYears != null && employeeYears > maxYears + 3) experienceScore = 75;

  const jobCountries = jobReq.countries || [];
  const employeeCountries = employeeProfile.preferred_country_values || [];
  const locationMatched =
    jobCountries.length === 0 ||
    employeeCountries.length === 0 ||
    intersection(jobCountries, employeeCountries).length > 0;
  const locationScore = locationMatched ? 100 : employeeProfile.relocation_ready ? 70 : 30;

  const jobWorkMode = jobReq.work_mode || "";
  const employeeWorkModes = employeeProfile.preferred_work_mode_keys || [];
  const workModeScore =
    !jobWorkMode || employeeWorkModes.includes(jobWorkMode) || (jobReq.is_remote && employeeProfile.remote_ready)
      ? 100
      : 50;

  const jobMinSalary = jobReq.salary_min_usd;
  const jobMaxSalary = jobReq.salary_max_usd;
  const employeeMinSalary = employeeProfile.salary_min_base;
  let salaryScore = 100;
  if (employeeMinSalary && jobMaxSalary && employeeMinSalary > jobMaxSalary) salaryScore = 40;
  else if (employeeMinSalary && jobMinSalary && employeeMinSalary > jobMinSalary) salaryScore = 75;

  const jobLanguages = jobReq.languages || [];
  const employeeLanguages = employeeProfile.normalized_languages || [];
  const matchedLanguages = intersection(jobLanguages, employeeLanguages);
  const missingLanguages = difference(jobLanguages, employeeLanguages);
  const languageScore = percentage(matchedLanguages.length, jobLanguages.length);

  const total =
    skillsScore * 0.35 +
    experienceScore * 0.2 +
    locationScore * 0.15 +
    salaryScore * 0.1 +
    workModeScore * 0.1 +
    languageScore * 0.1;

  return {
    score: Math.round(total),
    breakdown: {
      skills: skillsScore,
      experience: experienceScore,
      location: locationScore,
      salary: salaryScore,
      work_mode: workModeScore,
      language: languageScore,
    },
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    matched_languages: matchedLanguages,
    missing_languages: missingLanguages,
  };
};
