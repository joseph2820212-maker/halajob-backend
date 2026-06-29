import {
  computeSalaryInsightAggregate,
} from "./salaryAggregate.service.js";
import {
  clean,
  normalizeCurrency,
  numberOrNull,
} from "./salaryNormalize.service.js";

const midpoint = (min, max) => {
  const minNumber = numberOrNull(min);
  const maxNumber = numberOrNull(max);
  if (minNumber === null && maxNumber === null) return null;
  if (minNumber === null) return maxNumber;
  if (maxNumber === null) return minNumber;
  return (minNumber + maxNumber) / 2;
};

export const checkSalaryCompetitiveness = async ({
  title = "",
  job_title = "",
  city = "",
  country = "Syria",
  experience_level_id = null,
  experienceLevelId = null,
  industry_id = null,
  industryId = null,
  currency_code = "USD",
  currency = "",
  currency_rate_snapshot = 1,
  salary = {},
  min,
  max,
  salary_min,
  salary_max,
} = {}) => {
  const currencyCode = normalizeCurrency(currency_code || currency || salary.currency_code || "USD");
  const proposedMin = numberOrNull(salary.min ?? min ?? salary_min);
  const proposedMax = numberOrNull(salary.max ?? max ?? salary_max);
  const proposedMid = midpoint(proposedMin, proposedMax);
  if (proposedMid === null) {
    const error = new Error("salary_range_required");
    error.statusCode = 400;
    throw error;
  }

  const rate = Number(currency_rate_snapshot || salary.currency_rate_snapshot || 1) || 1;
  const proposedMidUsd = currencyCode === "USD" ? proposedMid : proposedMid / rate;
  const insight = await computeSalaryInsightAggregate({
    title: title || job_title,
    city,
    country,
    experienceLevelId: experienceLevelId || experience_level_id,
    industryId: industryId || industry_id,
    currencyCode,
  });

  const median = Number(insight.median);
  const medianUsd = Number(insight.median_usd);
  const compareMedian = Number.isFinite(median) ? median : medianUsd;
  const compareValue = Number.isFinite(median) ? proposedMid : proposedMidUsd;

  let status = "unknown";
  let label = "Not enough salary insight data yet.";
  if (Number.isFinite(compareMedian) && compareMedian > 0) {
    if (compareValue < compareMedian * 0.85) {
      status = "below";
      label = "Your salary appears below the typical Hala Job listing range.";
    } else if (compareValue > compareMedian * 1.15) {
      status = "above";
      label = "Your salary appears above the typical Hala Job listing range.";
    } else {
      status = "fair";
      label = "Your salary appears competitive for similar Hala Job listings.";
    }
  }

  return {
    status,
    label,
    proposed: {
      min: proposedMin,
      max: proposedMax,
      midpoint: proposedMid,
      midpoint_usd: proposedMidUsd,
      currency_code: currencyCode,
    },
    insight,
    source_label: "Based on Hala Job listings",
    low_confidence: insight.confidence === "low",
    warning:
      insight.confidence === "low"
        ? "Low confidence: sample size is small."
        : "",
    title: clean(title || job_title),
    city: clean(city),
    country: clean(country || "Syria"),
  };
};

export default {
  checkSalaryCompetitiveness,
};
