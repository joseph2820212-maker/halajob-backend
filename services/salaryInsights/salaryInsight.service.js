import {
  SalaryInsightAggregateModel,
  jobsModel,
} from "../../models/index.js";
import {
  computeSalaryInsightAggregate,
  rebuildSalaryInsightAggregates,
  serializeSalaryInsight,
} from "./salaryAggregate.service.js";
import {
  clean,
  normalizeCurrency,
  normalizeText,
  objectIdOrNull,
  titleFromSlug,
} from "./salaryNormalize.service.js";

export const salaryInsightFromQuery = async (query = {}) =>
  computeSalaryInsightAggregate({
    title: query.title || query.job_title || query.q || query.search || "",
    city: query.city || "",
    country: query.country || "Syria",
    experienceLevelId: query.experience_level_id || query.experienceLevelId,
    industryId: query.industry_id || query.industryId,
    currencyCode: query.currency_code || query.currency || "",
  });

export const salaryInsightByTitleSlug = async (titleSlug, query = {}) =>
  computeSalaryInsightAggregate({
    title: titleFromSlug(titleSlug),
    city: query.city || "",
    country: query.country || "Syria",
    experienceLevelId: query.experience_level_id || query.experienceLevelId,
    industryId: query.industry_id || query.industryId,
    currencyCode: query.currency_code || query.currency || "",
  });

export const salaryInsightForJob = async (jobId) => {
  const id = objectIdOrNull(jobId);
  if (!id) {
    const error = new Error("invalid_job_id");
    error.statusCode = 400;
    throw error;
  }
  const job = await jobsModel.findById(id).lean();
  if (!job) {
    const error = new Error("job_not_found");
    error.statusCode = 404;
    throw error;
  }

  const city = clean(job.city || job.cities?.[0]);
  const country = clean(job.countries?.[0] || "Syria");
  const insight = await computeSalaryInsightAggregate({
    title: job.job_name,
    city,
    country,
    experienceLevelId: job.experience_level_id,
    industryId: job.industry_id,
    currencyCode: job.salary?.currency_code,
  });

  return {
    job_id: String(job._id),
    job_title: job.job_name,
    salary: job.salary || {},
    insight,
  };
};

export const listSalaryInsightAggregates = async (query = {}) => {
  const filter = {};
  const title = normalizeText(query.title || query.q || query.search);
  const city = normalizeText(query.city);
  const country = normalizeText(query.country);
  const currencyCode = clean(query.currency_code || query.currency);
  if (title) filter.job_title_norm = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (city) filter.city_norm = city;
  if (country) filter.country_norm = country;
  if (currencyCode) filter.currency_code = normalizeCurrency(currencyCode);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 200);
  const items = await SalaryInsightAggregateModel.find(filter)
    .sort({ generated_at: -1, sample_size: -1 })
    .limit(limit)
    .lean();
  return items.map((item) => serializeSalaryInsight(item));
};

export const salaryInsightsHealth = async () => {
  const [aggregateCount, visibleSalaryJobCount] = await Promise.all([
    SalaryInsightAggregateModel.countDocuments(),
    jobsModel.countDocuments({
      status: true,
      is_accepted: true,
      publish_status: "published",
      "salary.is_visible": { $ne: false },
      "salary.mode": { $ne: "hidden" },
      "salary.min": { $ne: null },
      "salary.max": { $ne: null },
    }),
  ]);
  return {
    aggregate_count: aggregateCount,
    visible_salary_job_count: visibleSalaryJobCount,
    source_label: "Based on Hala Job listings",
    status: visibleSalaryJobCount > 0 ? "ready" : "empty",
  };
};

export { rebuildSalaryInsightAggregates };

export default {
  listSalaryInsightAggregates,
  rebuildSalaryInsightAggregates,
  salaryInsightByTitleSlug,
  salaryInsightForJob,
  salaryInsightFromQuery,
  salaryInsightsHealth,
};
