import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CountryModel,
  CurrencyModel,
  WorkModeModel,
} from "../../../models/index.js";
import {
  SUPPORTED_LAUNCH_CURRENCIES,
  SUPPORTED_LAUNCH_WORK_MODES,
  launchCurrencyQuery,
  launchWorkModeDefinition,
  launchWorkModeQuery,
} from "../../../services/globalLaunchContract.service.js";

const langFromReq = (req) =>
  String(req.get("lan") || req.get("x-language") || req.query.lan || "en")
    .toLowerCase()
    .startsWith("ar")
    ? "ar"
    : "en";

const cleanText = (value = "") => String(value || "").trim();

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const limitFromReq = (req, fallback = 100, max = 250) => {
  const n = Number.parseInt(req.query.limit, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const currencyFallback = (code) => ({
  id: code,
  title: code,
  name: code,
  code,
  symbol: code,
  rate_base: "USD",
  rate: 1,
  launch_supported: true,
});

const currencyMapper = (doc = {}, lang = "en") => ({
  id: String(doc._id || doc.id || doc.code || ""),
  title: lang === "ar" ? doc.name_ar || doc.code : doc.name_en || doc.code,
  name: doc.code,
  code: doc.code,
  symbol: lang === "ar" ? doc.symbol_ar || doc.code : doc.symbol_en || doc.code,
  symbol_ar: doc.symbol_ar || undefined,
  symbol_en: doc.symbol_en || undefined,
  name_ar: doc.name_ar || undefined,
  name_en: doc.name_en || undefined,
  rate: doc.rate ?? 1,
  rate_base: doc.rate_base || "USD",
  launch_supported: true,
});

const workModeMapper = (doc = {}, lang = "en") => ({
  id: String(doc._id || doc.id || doc.key || ""),
  key: doc.key,
  title: lang === "ar" ? doc.title_ar || doc.title_en : doc.title_en || doc.title_ar,
  title_ar: doc.title_ar || undefined,
  title_en: doc.title_en || undefined,
  icon: doc.icon || undefined,
  launch_supported: true,
});

const countryMapper = (doc = {}, lang = "en") => ({
  id: String(doc._id || doc.id || ""),
  title: lang === "ar" ? doc.city_name_ar : doc.city_name_en,
  country_code: doc.country_code || undefined,
  country_name: lang === "ar" ? doc.country_name_ar : doc.country_name_en,
  city_name: lang === "ar" ? doc.city_name_ar : doc.city_name_en,
  country_name_ar: doc.country_name_ar || undefined,
  country_name_en: doc.country_name_en || undefined,
  city_name_ar: doc.city_name_ar || undefined,
  city_name_en: doc.city_name_en || undefined,
});

export const currencies = async (req, res, next) => {
  try {
    const lang = langFromReq(req);
    const docs = await CurrencyModel.find({
      is_active: { $ne: false },
      ...launchCurrencyQuery(),
    })
      .sort({ code: 1 })
      .lean();

    const byCode = new Map(docs.map((doc) => [doc.code, doc]));
    const data = SUPPORTED_LAUNCH_CURRENCIES.map((code) =>
      currencyMapper(byCode.get(code) || currencyFallback(code), lang)
    );

    return ReturnAppData.getData({
      res,
      data,
      message: "global_currencies",
    });
  } catch (error) {
    next(error);
  }
};

export const workModes = async (req, res, next) => {
  try {
    const lang = langFromReq(req);
    const docs = await WorkModeModel.find({
      is_active: { $ne: false },
      ...launchWorkModeQuery(),
    })
      .sort({ sort_order: 1, title_en: 1 })
      .lean();

    const byKey = new Map(docs.map((doc) => [doc.key, doc]));
    const data = SUPPORTED_LAUNCH_WORK_MODES.map((key) =>
      workModeMapper(byKey.get(key) || launchWorkModeDefinition(key), lang)
    );

    return ReturnAppData.getData({
      res,
      data,
      message: "global_work_modes",
    });
  } catch (error) {
    next(error);
  }
};

export const countries = async (req, res, next) => {
  try {
    const lang = langFromReq(req);
    const limit = limitFromReq(req);
    const search = cleanText(req.query.search || req.query.q || req.query.country || req.query.city);
    const countryCode = cleanText(req.query.country_code || req.query.code).toUpperCase();
    const query = {};

    if (countryCode) query.country_code = countryCode;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { country_code: regex },
        { country_name_ar: regex },
        { country_name_en: regex },
        { city_name_ar: regex },
        { city_name_en: regex },
      ];
    }

    const docs = await CountryModel.find(query)
      .sort({ country_name_en: 1, city_name_en: 1 })
      .limit(limit)
      .lean();

    return ReturnAppData.getData({
      res,
      data: docs.map((doc) => countryMapper(doc, lang)),
      message: "global_countries",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  countries,
  currencies,
  workModes,
};
