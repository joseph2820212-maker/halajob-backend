import {
  SalaryInsightAggregateModel,
  jobsModel,
} from "../../models/index.js";
import {
  clean,
  normalizeCurrency,
  normalizeText,
  numberOrNull,
  objectIdOrNull,
  percentile,
  roundMoney,
  salaryInsightKey,
} from "./salaryNormalize.service.js";

const confidenceForSampleSize = (sampleSize) => {
  if (sampleSize >= 20) return "high";
  if (sampleSize >= 5) return "medium";
  return "low";
};

const visibleSalaryFilter = () => ({
  status: true,
  is_accepted: true,
  publish_status: "published",
  deleted_at: null,
  "salary.is_visible": { $ne: false },
  "salary.mode": { $ne: "hidden" },
  "salary.min": { $ne: null },
  "salary.max": { $ne: null },
});

export const buildSalaryInsightFilter = ({
  title = "",
  city = "",
  country = "",
  experienceLevelId = null,
  industryId = null,
  currencyCode = "",
} = {}) => {
  const filter = visibleSalaryFilter();
  const titleNorm = normalizeText(title);
  const cityNorm = normalizeText(city);
  const countryNorm = normalizeText(country);
  const experienceId = objectIdOrNull(experienceLevelId);
  const industry = objectIdOrNull(industryId);
  const currency = clean(currencyCode);

  if (titleNorm) {
    const escaped = titleNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { "search_index.title_norm": new RegExp(escaped, "i") },
      { job_name: new RegExp(escaped, "i") },
    ];
  }
  if (cityNorm) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { city: new RegExp(cityNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { "search_index.filters.city": cityNorm },
          { cities: new RegExp(cityNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        ],
      },
    ];
  }
  if (countryNorm) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { countries: new RegExp(countryNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { "search_index.filters.countries": countryNorm },
        ],
      },
    ];
  }
  if (experienceId) filter.experience_level_id = experienceId;
  if (industry) filter.industry_id = industry;
  if (currency) filter["salary.currency_code"] = normalizeCurrency(currency);
  return filter;
};

const midpoint = (min, max) => {
  const minNumber = numberOrNull(min);
  const maxNumber = numberOrNull(max);
  if (minNumber === null || maxNumber === null) return null;
  return (minNumber + maxNumber) / 2;
};

const salaryPointFromJob = (job, { useUsdDisplay = false } = {}) => {
  const localMid = midpoint(job.salary?.min, job.salary?.max);
  const usdMid = midpoint(job.salary?.min_usd, job.salary?.max_usd);
  const displayValue = useUsdDisplay ? usdMid : localMid;
  if (!Number.isFinite(displayValue) || !Number.isFinite(usdMid)) return null;
  return {
    display: displayValue,
    usd: usdMid,
  };
};

const removeOutliers = (points = []) => {
  if (points.length < 5) return points;
  const medianUsd = percentile(points.map((point) => point.usd), 0.5);
  if (!Number.isFinite(medianUsd) || medianUsd <= 0) return points;
  return points.filter((point) => point.usd >= medianUsd / 5 && point.usd <= medianUsd * 5);
};

export const serializeSalaryInsight = (aggregate = {}, filters = {}) => ({
  key: aggregate.key || "",
  title: clean(filters.title || aggregate.job_title_norm),
  city: clean(filters.city || aggregate.city_norm),
  country: clean(filters.country || aggregate.country_norm),
  job_title_norm: aggregate.job_title_norm || "",
  city_norm: aggregate.city_norm || "",
  country_norm: aggregate.country_norm || "",
  experience_level_id: aggregate.experience_level_id ? String(aggregate.experience_level_id) : null,
  industry_id: aggregate.industry_id ? String(aggregate.industry_id) : null,
  currency_code: aggregate.currency_code || "USD",
  sample_size: aggregate.sample_size || 0,
  min: aggregate.min ?? null,
  p25: aggregate.p25 ?? null,
  median: aggregate.median ?? null,
  p75: aggregate.p75 ?? null,
  max: aggregate.max ?? null,
  min_usd: aggregate.min_usd ?? null,
  median_usd: aggregate.median_usd ?? null,
  max_usd: aggregate.max_usd ?? null,
  confidence: aggregate.confidence || "low",
  source_label: "Based on Hala Job listings",
  low_sample_warning:
    (aggregate.sample_size || 0) < 5
      ? "Low confidence: sample size is small."
      : "",
  generated_at: aggregate.generated_at || null,
});

export const computeSalaryInsightAggregate = async ({
  title = "",
  city = "",
  country = "",
  experienceLevelId = null,
  industryId = null,
  currencyCode = "",
  persist = true,
  limit = 1000,
} = {}) => {
  const currency = clean(currencyCode);
  const useUsdDisplay = !currency;
  const filter = buildSalaryInsightFilter({
    title,
    city,
    country,
    experienceLevelId,
    industryId,
    currencyCode: currency,
  });
  const jobs = await jobsModel
    .find(filter)
    .select("job_name city cities countries experience_level_id industry_id salary search_index")
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 1000, 1), 5000))
    .lean();

  const points = removeOutliers(
    jobs
      .map((job) => salaryPointFromJob(job, { useUsdDisplay }))
      .filter(Boolean),
  );
  const displayValues = points.map((point) => point.display);
  const usdValues = points.map((point) => point.usd);
  const sampleSize = points.length;
  const aggregate = {
    key: salaryInsightKey({
      title,
      city,
      country,
      experienceLevelId,
      industryId,
      currencyCode: useUsdDisplay ? "USD" : currency,
    }),
    job_title_norm: normalizeText(title),
    city_norm: normalizeText(city),
    country_norm: normalizeText(country),
    experience_level_id: objectIdOrNull(experienceLevelId),
    industry_id: objectIdOrNull(industryId),
    currency_code: useUsdDisplay ? "USD" : normalizeCurrency(currency),
    sample_size: sampleSize,
    min: roundMoney(percentile(displayValues, 0)),
    p25: roundMoney(percentile(displayValues, 0.25)),
    median: roundMoney(percentile(displayValues, 0.5)),
    p75: roundMoney(percentile(displayValues, 0.75)),
    max: roundMoney(percentile(displayValues, 1)),
    min_usd: roundMoney(percentile(usdValues, 0)),
    median_usd: roundMoney(percentile(usdValues, 0.5)),
    max_usd: roundMoney(percentile(usdValues, 1)),
    confidence: confidenceForSampleSize(sampleSize),
    generated_at: new Date(),
  };

  if (persist) {
    await SalaryInsightAggregateModel.findOneAndUpdate(
      { key: aggregate.key },
      { $set: aggregate },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  return serializeSalaryInsight(aggregate, { title, city, country });
};

export const rebuildSalaryInsightAggregates = async ({ limit = 200 } = {}) => {
  const jobs = await jobsModel
    .find(visibleSalaryFilter())
    .select("job_name city cities countries experience_level_id industry_id salary")
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 200, 1), 1000))
    .lean();
  const combos = new Map();
  jobs.forEach((job) => {
    const city = clean(job.city || job.cities?.[0]);
    const country = clean(job.countries?.[0]);
    const currencyCode = clean(job.salary?.currency_code);
    const key = salaryInsightKey({
      title: job.job_name,
      city,
      country,
      experienceLevelId: job.experience_level_id,
      industryId: job.industry_id,
      currencyCode,
    });
    if (!combos.has(key)) {
      combos.set(key, {
        title: job.job_name,
        city,
        country,
        experienceLevelId: job.experience_level_id,
        industryId: job.industry_id,
        currencyCode,
      });
    }
  });

  const aggregates = [];
  for (const combo of combos.values()) {
    aggregates.push(await computeSalaryInsightAggregate({ ...combo, persist: true }));
  }
  return { rebuilt: aggregates.length, aggregates };
};

export default {
  buildSalaryInsightFilter,
  computeSalaryInsightAggregate,
  rebuildSalaryInsightAggregates,
  serializeSalaryInsight,
};
