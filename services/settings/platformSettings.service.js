import { PlatformSettingsModel } from "../../models/index.js";

const envValue = (name) => {
  const value = process.env[name];
  return value === undefined || value === null ? "" : String(value).trim();
};

const envBool = (name, fallback = false) => {
  const value = envValue(name);
  if (!value) return fallback;
  if (["true", "1", "yes", "on", "enabled"].includes(value.toLowerCase())) {
    return true;
  }
  if (["false", "0", "no", "off", "disabled"].includes(value.toLowerCase())) {
    return false;
  }
  return fallback;
};

const envText = (name, fallback = "") => envValue(name) || fallback;

export const PLATFORM_SETTINGS_DEFAULTS = {
  general: {
    platform_name: "Hala Job",
    default_language: "ar",
    default_currency: envText("SALARY_INSIGHTS_DEFAULT_CURRENCY", "SYP"),
  },
  features: {
    campus_mode: true,
    ai_tools: envBool("FEATURE_AI_TOOLS_ENABLED", false),
    ai_tools_enabled: envBool("FEATURE_AI_TOOLS_ENABLED", false),
    cv_parsing_enabled: envBool("FEATURE_CV_PARSING_ENABLED", false),
    cv_studio_enabled: envBool("FEATURE_CV_STUDIO_ENABLED", true),
    resource_library_enabled: envBool("FEATURE_RESOURCE_LIBRARY_ENABLED", true),
    interview_prep_enabled: envBool("FEATURE_INTERVIEW_PREP_ENABLED", true),
    saved_searches_enabled: envBool("FEATURE_SAVED_SEARCHES_ENABLED", true),
    sms_enabled: envBool("FEATURE_SMS_ENABLED", false),
    manual_whatsapp_share_enabled: envBool(
      "FEATURE_MANUAL_WHATSAPP_SHARE_ENABLED",
      true,
    ),
    official_whatsapp_provider_enabled: envBool(
      "FEATURE_OFFICIAL_WHATSAPP_PROVIDER_ENABLED",
      false,
    ),
    salary_insights_enabled: envBool("FEATURE_SALARY_INSIGHTS_ENABLED", true),
    campus_career_center_enabled: envBool(
      "FEATURE_CAMPUS_CAREER_CENTER_ENABLED",
      true,
    ),
    video_interviews_enabled: envBool("FEATURE_VIDEO_INTERVIEWS_ENABLED", true),
    talent_pool_crm_enabled: envBool("FEATURE_TALENT_POOL_CRM_ENABLED", true),
    employer_branding_enabled: envBool(
      "FEATURE_EMPLOYER_BRANDING_ENABLED",
      true,
    ),
    payments_mode: envText("FEATURE_PAYMENTS_MODE", "manual"),
    company_self_register: envBool("FEATURE_COMPANY_SELF_REGISTER_ENABLED", true),
  },
  security: {
    otp_digits: 5,
    otp_max_attempts: 5,
  },
  uploads: {
    allowed_file_types: "pdf, docx, png, jpg",
    max_file_mb: 10,
    private_documents: true,
  },
  campus: {
    campus_opportunities_enabled: true,
    require_student_email: true,
    university_approval_required: true,
  },
  billing: {
    mode: "manual",
  },
};

const CACHE_TTL_MS = 30_000;
let cachedSettings = null;
let cachedAt = 0;

const cleanText = (value) => String(value || "").trim();

const settingSection = (settings = {}, section) =>
  settings?.[section] && typeof settings[section] === "object"
    ? settings[section]
    : {};

const boolSetting = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const intSetting = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
};

const textSetting = (value, fallback = "") => {
  const clean = cleanText(value);
  return clean || fallback;
};

const valueAtPath = (source = {}, dottedPath = "") =>
  dottedPath.split(".").reduce((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return value[key];
  }, source);

const normalizeFeatures = (features = {}) => {
  const defaults = PLATFORM_SETTINGS_DEFAULTS.features;
  const aiTools = boolSetting(
    features.ai_tools_enabled ?? features.ai_tools,
    defaults.ai_tools_enabled,
  );

  return {
    campus_mode: boolSetting(features.campus_mode, defaults.campus_mode),
    ai_tools: aiTools,
    ai_tools_enabled: aiTools,
    cv_parsing_enabled: boolSetting(
      features.cv_parsing_enabled,
      defaults.cv_parsing_enabled,
    ),
    cv_studio_enabled: boolSetting(
      features.cv_studio_enabled,
      defaults.cv_studio_enabled,
    ),
    resource_library_enabled: boolSetting(
      features.resource_library_enabled,
      defaults.resource_library_enabled,
    ),
    interview_prep_enabled: boolSetting(
      features.interview_prep_enabled,
      defaults.interview_prep_enabled,
    ),
    saved_searches_enabled: boolSetting(
      features.saved_searches_enabled,
      defaults.saved_searches_enabled,
    ),
    sms_enabled: boolSetting(features.sms_enabled, defaults.sms_enabled),
    manual_whatsapp_share_enabled: boolSetting(
      features.manual_whatsapp_share_enabled,
      defaults.manual_whatsapp_share_enabled,
    ),
    official_whatsapp_provider_enabled: boolSetting(
      features.official_whatsapp_provider_enabled,
      defaults.official_whatsapp_provider_enabled,
    ),
    salary_insights_enabled: boolSetting(
      features.salary_insights_enabled,
      defaults.salary_insights_enabled,
    ),
    campus_career_center_enabled: boolSetting(
      features.campus_career_center_enabled,
      defaults.campus_career_center_enabled,
    ),
    video_interviews_enabled: boolSetting(
      features.video_interviews_enabled,
      defaults.video_interviews_enabled,
    ),
    talent_pool_crm_enabled: boolSetting(
      features.talent_pool_crm_enabled,
      defaults.talent_pool_crm_enabled,
    ),
    employer_branding_enabled: boolSetting(
      features.employer_branding_enabled,
      defaults.employer_branding_enabled,
    ),
    payments_mode: textSetting(features.payments_mode, defaults.payments_mode),
    company_self_register: boolSetting(
      features.company_self_register,
      defaults.company_self_register,
    ),
  };
};

export const clientSettingsFromPlatform = (settings = {}) => {
  const general = settingSection(settings, "general");
  const security = settingSection(settings, "security");
  const uploads = settingSection(settings, "uploads");
  const campus = settingSection(settings, "campus");
  const billing = settingSection(settings, "billing");

  return {
    general: {
      platform_name: textSetting(
        general.platform_name,
        PLATFORM_SETTINGS_DEFAULTS.general.platform_name,
      ),
      default_language: textSetting(
        general.default_language,
        PLATFORM_SETTINGS_DEFAULTS.general.default_language,
      ),
      default_currency: textSetting(
        general.default_currency,
        PLATFORM_SETTINGS_DEFAULTS.general.default_currency,
      ),
    },
    features: normalizeFeatures(settingSection(settings, "features")),
    security: {
      otp_digits: intSetting(
        security.otp_digits,
        PLATFORM_SETTINGS_DEFAULTS.security.otp_digits,
      ),
      otp_max_attempts: intSetting(
        security.otp_max_attempts,
        PLATFORM_SETTINGS_DEFAULTS.security.otp_max_attempts,
      ),
    },
    uploads: {
      allowed_file_types: textSetting(
        uploads.allowed_file_types,
        PLATFORM_SETTINGS_DEFAULTS.uploads.allowed_file_types,
      ),
      max_file_mb: intSetting(
        uploads.max_file_mb,
        PLATFORM_SETTINGS_DEFAULTS.uploads.max_file_mb,
      ),
      private_documents: boolSetting(
        uploads.private_documents,
        PLATFORM_SETTINGS_DEFAULTS.uploads.private_documents,
      ),
    },
    campus: {
      campus_opportunities_enabled: boolSetting(
        campus.campus_opportunities_enabled,
        PLATFORM_SETTINGS_DEFAULTS.campus.campus_opportunities_enabled,
      ),
      require_student_email: boolSetting(
        campus.require_student_email,
        PLATFORM_SETTINGS_DEFAULTS.campus.require_student_email,
      ),
      university_approval_required: boolSetting(
        campus.university_approval_required,
        PLATFORM_SETTINGS_DEFAULTS.campus.university_approval_required,
      ),
    },
    billing: {
      mode: textSetting(billing.mode, PLATFORM_SETTINGS_DEFAULTS.billing.mode),
    },
  };
};

export const clearPlatformSettingsCache = () => {
  cachedSettings = null;
  cachedAt = 0;
};

export const loadPlatformSettings = async ({ upsert = false, useCache = true } = {}) => {
  const now = Date.now();
  if (useCache && cachedSettings && now - cachedAt < CACHE_TTL_MS) {
    return cachedSettings;
  }

  const query = { key: "default" };
  const settings = upsert
    ? await PlatformSettingsModel.findOneAndUpdate(
        query,
        { $setOnInsert: { key: "default" } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean()
    : await PlatformSettingsModel.findOne(query).lean();

  cachedSettings = settings || { key: "default" };
  cachedAt = now;
  return cachedSettings;
};

export const getPlatformSetting = async (path, fallback) => {
  const settings = await loadPlatformSettings();
  const value = valueAtPath(settings, path);
  if (value !== undefined) return value;
  const defaultValue = valueAtPath(PLATFORM_SETTINGS_DEFAULTS, path);
  return defaultValue !== undefined ? defaultValue : fallback;
};

export const isFeatureEnabled = async (key, fallback = false) => {
  const path = key.startsWith("features.") ? key : `features.${key}`;
  const settings = await loadPlatformSettings();
  const features = clientSettingsFromPlatform(settings).features;
  const normalizedKey = path.slice("features.".length);
  if (Object.prototype.hasOwnProperty.call(features, normalizedKey)) {
    return features[normalizedKey] === true;
  }
  return boolSetting(valueAtPath(settings, path), fallback);
};

export default {
  PLATFORM_SETTINGS_DEFAULTS,
  clientSettingsFromPlatform,
  clearPlatformSettingsCache,
  getPlatformSetting,
  isFeatureEnabled,
  loadPlatformSettings,
};
