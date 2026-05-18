import { buildTokens, buildSearchText, uniqueCleanArray, normalizeText } from "./normalizeSearch.js";

export const calculateCompanyScores = (company) => {
  const hiringScore =
    Number(company.is_hiring || false) * 35 +
    Math.min(Number(company.active_jobs_count || 0) * 5, 35) +
    Math.min(Number(company.free_post_balance || 0) * 2, 15) +
    Number(company.can_upload || false) * 15;

  const trustScore =
    Number(company.status || false) * 20 +
    Number(company.accepted || false) * 25 +
    Number(company.is_verified || false) * 30 +
    Number(company.rating_avg || 0) * 5;

  const activityScore =
    Math.min(Number(company.jobs_count || 0) * 2, 30) +
    Math.min(Number(company.views_count || 0) * 0.05, 30) +
    Math.min(Number(company.followers_count || 0) * 0.2, 25) +
    Math.min(Number(company.employees_count || 0) * 0.5, 15);

  const brandingScore =
    Number(Boolean(company.logo)) * 20 +
    Number(Boolean(company.cover_image)) * 15 +
    Number(Boolean(company.description)) * 20 +
    Number((company.specialties || []).length > 0) * 15 +
    Number((company.benefits || []).length > 0) * 15 +
    Number((company.social_links || []).length > 0) * 15;

  const totalScore =
    hiringScore * 0.3 + trustScore * 0.3 + activityScore * 0.2 + brandingScore * 0.2;

  return {
    hiring_score: Math.round(hiringScore),
    trust_score: Math.round(trustScore),
    activity_score: Math.round(activityScore),
    branding_score: Math.round(brandingScore),
    total_score: Math.round(totalScore),
  };
};

export const buildCompanyProjection = async (company) => {
  const tokens = buildTokens(
    company.company_name,
    company.slug,
    company.description,
    company.mission,
    company.vision,
    company.culture,
    company.industry_name,
    company.company_type,
    company.company_size_type,
    company.specialties,
    company.benefits,
    company.company_country,
    company.company_city,
    company.company_address
  );

  const searchableText = buildSearchText(
    company.company_name,
    company.slug,
    company.description,
    company.mission,
    company.vision,
    company.culture,
    company.industry_name,
    company.company_type,
    company.company_size_type,
    company.specialties,
    company.benefits,
    company.company_country,
    company.company_city,
    company.company_address
  );

  return {
    searchable_tokens: tokens,
    searchable_text: searchableText,
    ...calculateCompanyScores(company),
    normalized_specialties: uniqueCleanArray(company.specialties || []),
    normalized_benefits: uniqueCleanArray(company.benefits || []),
    normalized_industry: normalizeText(company.industry_name),
    normalized_location: uniqueCleanArray([
      company.company_country,
      company.company_city,
      company.timezone,
    ]),
  };
};
