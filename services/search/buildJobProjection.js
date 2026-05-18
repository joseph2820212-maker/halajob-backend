import { CompanyModel } from "../../models/index.js";
import {
  normalizeText,
  uniqueCleanArray,
  buildTokens,
  buildSearchText,
  pickLocalizedName,
} from "./normalizeSearch.js";

const getInfoName = (info = {}) => pickLocalizedName(info);

export const calculateJobRanking = (job, company) => {
  const qualityScore =
    Number(Boolean(job.description)) * 20 +
    Number((job.skills_required || []).length > 0) * 20 +
    Number(Boolean(job.salary?.currency_code)) * 10 +
    Number(Boolean(job.apply_deadline)) * 10 +
    Number(Boolean(job.job_name)) * 20 +
    Number(Boolean(company?.logo)) * 20;

  const popularityScore =
    Number(job.user_show || 0) * 0.2 +
    Number(job.user_saved || 0) * 1 +
    Number(job.user_applying || 0) * 2 +
    Number(job.rating || 0) * 10;

  const companyScore =
    Number(company?.is_verified || false) * 25 +
    Number(company?.accepted || false) * 20 +
    Number(company?.status || false) * 15 +
    Number(company?.rating_avg || 0) * 8 +
    Math.min(Number(company?.active_jobs_count || 0), 20);

  const now = new Date();
  const createdAt = job.createdAt ? new Date(job.createdAt) : now;
  const ageDays = Math.max(1, (now - createdAt) / (1000 * 60 * 60 * 24));
  const freshnessScore = Math.max(0, 100 - ageDays * 2);

  const totalScore =
    qualityScore * 0.35 + popularityScore * 0.2 + companyScore * 0.25 + freshnessScore * 0.2;

  return {
    quality_score: Math.round(qualityScore),
    freshness_score: Math.round(freshnessScore),
    popularity_score: Math.round(popularityScore),
    company_score: Math.round(companyScore),
    total_score: Math.round(totalScore),
  };
};

export const buildJobProjection = async (job) => {
  const company = await CompanyModel.findById(job.company_id).lean();

  const requiredSkills = (job.skills_required || []).map((s) => s.title);
  const optionalSkills = (job.skills_optional || []).map((s) => s.title);
  const languages = (job.languages || []).map((l) => l.name);

  const jobType = getInfoName(job.job_type_info);
  const workMode = getInfoName(job.work_mode_info);
  const workTime = getInfoName(job.job_time_info);
  const salaryType = getInfoName(job.job_salary_info);
  const experienceLevel = getInfoName(job.experience_level_info);
  const educationLevel = getInfoName(job.education_level_info);

  const tokens = buildTokens(
    job.job_name,
    job.description,
    job.job_keywords,
    requiredSkills,
    optionalSkills,
    languages,
    job.countries,
    job.city,
    company?.company_name,
    company?.industry_name,
    company?.specialties,
    company?.benefits,
    jobType,
    workMode,
    workTime,
    salaryType,
    experienceLevel,
    educationLevel
  );

  const text = buildSearchText(
    job.job_name,
    job.description,
    job.job_keywords,
    requiredSkills,
    optionalSkills,
    languages,
    job.countries,
    job.city,
    company?.company_name,
    company?.industry_name,
    company?.specialties,
    company?.benefits,
    jobType,
    workMode,
    workTime,
    salaryType,
    experienceLevel,
    educationLevel
  );

  return {
    company: {
      id: company?._id || null,
      name: company?.company_name || "",
      logo: company?.logo || null,
      industry_name: company?.industry_name || "",
      company_size_type: company?.company_size_type || "unknown",
      company_type: company?.company_type || "",
      country: company?.company_country || "",
      city: company?.company_city || "",
      verified: Boolean(company?.is_verified),
      rating: Number(company?.rating_avg || 0),
      active_jobs_count: Number(company?.active_jobs_count || 0),
    },
    requirements: {
      skills: uniqueCleanArray([...requiredSkills, ...optionalSkills]),
      languages: uniqueCleanArray(languages),
      countries: uniqueCleanArray(job.countries || []),
      work_mode: normalizeText(workMode),
      job_type: normalizeText(jobType),
      work_time: normalizeText(workTime),
      experience_level: normalizeText(experienceLevel),
      education_level: normalizeText(educationLevel),
      min_experience_years: Number(job.min_experience_years || 0),
      max_experience_years: job.max_experience_years ?? null,
      salary_min_usd: job.salary?.min_usd ?? null,
      salary_max_usd: job.salary?.max_usd ?? null,
      candidate_target: job.candidate_target || [],
      is_remote: Boolean(job.is_remote),
    },
    ranking: calculateJobRanking(job, company),
    matching: {
      tokens,
      text,
      normalized_skills: uniqueCleanArray([...requiredSkills, ...optionalSkills]),
      normalized_titles: uniqueCleanArray([job.job_name]),
    },
  };
};
