export const SUPPORTED_LAUNCH_CURRENCIES = Object.freeze(["USD", "EUR", "GBP"]);

export const SUPPORTED_LAUNCH_WORK_MODES = Object.freeze([
  "onsite",
  "remote",
  "hybrid",
]);

const WORK_MODE_ALIASES = new Map([
  ["onsite", "onsite"],
  ["on site", "onsite"],
  ["on-site", "onsite"],
  ["office", "onsite"],
  ["office based", "onsite"],
  ["in office", "onsite"],
  ["remote", "remote"],
  ["work from home", "remote"],
  ["wfh", "remote"],
  ["hybrid", "hybrid"],
  ["mixed", "hybrid"],
]);

const WORK_MODE_DEFINITIONS = {
  onsite: {
    key: "onsite",
    title_en: "Onsite",
    title_ar: "Onsite",
    keywords_en: ["onsite", "on site", "office"],
    keywords_ar: ["onsite"],
    icon: "business",
    sort_order: 10,
  },
  remote: {
    key: "remote",
    title_en: "Remote",
    title_ar: "Remote",
    keywords_en: ["remote", "work from home"],
    keywords_ar: ["remote"],
    icon: "public",
    sort_order: 20,
  },
  hybrid: {
    key: "hybrid",
    title_en: "Hybrid",
    title_ar: "Hybrid",
    keywords_en: ["hybrid", "mixed"],
    keywords_ar: ["hybrid"],
    icon: "sync_alt",
    sort_order: 30,
  },
};

export const createLaunchContractError = (message, details = {}) => {
  const error = new Error(message);
  error.status = 422;
  error.statusCode = 422;
  error.code = message;
  error.details = details;
  error.isLaunchContractError = true;
  return error;
};

export const isLaunchContractError = (error) =>
  Boolean(error?.isLaunchContractError);

export const normalizeLaunchCurrencyCode = (value = "") =>
  String(value || "").trim().toUpperCase();

export const isSupportedLaunchCurrencyCode = (value = "") =>
  SUPPORTED_LAUNCH_CURRENCIES.includes(normalizeLaunchCurrencyCode(value));

export const assertSupportedLaunchCurrencyCode = (value = "") => {
  const code = normalizeLaunchCurrencyCode(value);
  if (!isSupportedLaunchCurrencyCode(code)) {
    throw createLaunchContractError("unsupported_salary_currency", {
      received: code || null,
      supported: SUPPORTED_LAUNCH_CURRENCIES,
    });
  }
  return code;
};

export const assertSupportedLaunchCurrencyDoc = (doc = {}, fallback = "") => {
  const code = assertSupportedLaunchCurrencyCode(
    doc?.code || doc?.currency_code || fallback
  );
  return { ...doc, code };
};

export const launchCurrencyQuery = () => ({
  code: { $in: [...SUPPORTED_LAUNCH_CURRENCIES] },
});

const normalizeLookupText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const normalizeLaunchWorkModeKey = (value = "") => {
  const raw =
    typeof value === "object" && value !== null
      ? value.key ||
        value.name ||
        value.title ||
        value.title_en ||
        value.label ||
        value.value ||
        ""
      : value;
  const normalized = normalizeLookupText(raw);
  return WORK_MODE_ALIASES.get(normalized) || "";
};

export const isSupportedLaunchWorkModeKey = (value = "") =>
  SUPPORTED_LAUNCH_WORK_MODES.includes(normalizeLaunchWorkModeKey(value));

export const assertSupportedLaunchWorkModeKey = (value = "") => {
  const key = normalizeLaunchWorkModeKey(value);
  if (!isSupportedLaunchWorkModeKey(key)) {
    throw createLaunchContractError("unsupported_work_mode", {
      received: String(value || "").trim() || null,
      supported: SUPPORTED_LAUNCH_WORK_MODES,
    });
  }
  return key;
};

export const assertSupportedLaunchWorkModeDoc = (doc = {}, fallback = "") => {
  const key = assertSupportedLaunchWorkModeKey(doc?.key || fallback || doc);
  return { ...doc, key };
};

export const launchWorkModeQuery = () => ({
  key: { $in: [...SUPPORTED_LAUNCH_WORK_MODES] },
});

export const launchWorkModeDefinition = (key) => {
  const normalized = assertSupportedLaunchWorkModeKey(key);
  return { ...WORK_MODE_DEFINITIONS[normalized] };
};

export const isRemoteLaunchWorkMode = (key) =>
  normalizeLaunchWorkModeKey(key) === "remote";

export const workModeRequiresCity = (key) => {
  const normalized = normalizeLaunchWorkModeKey(key);
  return normalized === "onsite" || normalized === "hybrid";
};

export const assertLaunchJobLocation = ({
  workModeKey,
  city = "",
  cities = [],
} = {}) => {
  if (!workModeRequiresCity(workModeKey)) return;
  const hasCity = String(city || "").trim().length > 0;
  const hasCities = Array.isArray(cities)
    ? cities.some((item) => String(item || "").trim())
    : false;

  if (!hasCity && !hasCities) {
    throw createLaunchContractError("city_required_for_work_mode", {
      work_mode: normalizeLaunchWorkModeKey(workModeKey),
      reason: "onsite_and_hybrid_jobs_require_city",
    });
  }
};
