import mongoose from "mongoose";

export const clean = (value = "") => String(value || "").trim();

export const normalizeText = (value = "") =>
  clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, " ")
    .trim();

export const slugifyTitle = (value = "") =>
  normalizeText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");

export const titleFromSlug = (value = "") => clean(value).replace(/[-_]+/g, " ");

export const objectIdOrNull = (value) => {
  const id = clean(value?._id || value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

export const numberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const normalizeCurrency = (value = "USD") => clean(value || "USD").toUpperCase() || "USD";

export const salaryInsightKey = ({
  title = "",
  city = "",
  country = "",
  experienceLevelId = null,
  industryId = null,
  currencyCode = "USD",
} = {}) =>
  [
    normalizeText(title) || "all",
    normalizeText(city) || "all",
    normalizeText(country) || "all",
    objectIdOrNull(experienceLevelId)?.toString() || "all",
    objectIdOrNull(industryId)?.toString() || "all",
    normalizeCurrency(currencyCode),
  ].join("|");

export const percentile = (values = [], p = 0.5) => {
  const nums = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!nums.length) return null;
  if (nums.length === 1) return nums[0];
  const index = (nums.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return nums[lower];
  return nums[lower] + (nums[upper] - nums[lower]) * (index - lower);
};

export const roundMoney = (value) =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : null;

export default {
  clean,
  normalizeCurrency,
  normalizeText,
  numberOrNull,
  objectIdOrNull,
  percentile,
  roundMoney,
  salaryInsightKey,
  slugifyTitle,
  titleFromSlug,
};
