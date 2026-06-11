import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CountryModel,
  CurrencyModel,
  EducationLevelModel,
  ExperienceLevelModel,
  IndustryModel,
  JobNameModel,
  JobSalaryModel,
  JobServiceModel,
  JobTypeModel,
  LanguageModel,
  SkillModel,
  WorkLocationTypeModel,
  WorkModeModel,
  WorkTimeTypeModel,
} from "../../../models/index.js";

const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_WORD = /[^0-9A-Za-z\u0600-\u06FF\s]/g;

const AR_STOP = new Set([
  "في", "فيه", "من", "على", "علي", "الى", "إلى", "عن", "أن", "إن", "او", "أو", "ثم",
  "حتى", "كل", "كما", "هذا", "هذه", "ذلك", "تلك", "هناك", "هنا", "هو", "هي", "هم", "ما",
  "ماذا", "لم", "لن", "لا", "قد", "لقد", "مع", "بعد", "قبل", "بين", "اي", "أي", "و", "يا", "هل",
]);

const EN_STOP = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "of", "in", "on", "at", "to", "for", "from",
  "by", "is", "are", "was", "were", "be", "this", "that", "these", "those", "with", "about", "as", "it",
  "you", "we", "they", "not", "no", "yes", "do", "does", "did", "have", "has", "can", "could", "should",
]);

const unique = (items = []) => {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = String(item ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
};

const asString = (value = "") => String(value ?? "");

const normalizeArabic = (value = "") =>
  asString(value)
    .replace(AR_DIACRITICS, "")
    .replace(/[\u0622\u0623\u0625\u0671]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0629/g, "ه")
    .replace(/\u0624/g, "و")
    .replace(/\u0626/g, "ي")
    .replace(/\u0640/g, "");

const normalizeEnglish = (value = "") =>
  asString(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeMixed = (value = "") =>
  normalizeEnglish(normalizeArabic(value))
    .replace(NON_WORD, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (value = "") =>
  asString(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const makeFlexiblePattern = (value = "") => {
  const normalized = normalizeArabic(value).replace(NON_WORD, " ").trim();

  return escapeRegex(normalized)
    .replace(/ا/g, "[اأإآٱ]")
    .replace(/ي/g, "[يىئ]")
    .replace(/ه/g, "[هة]")
    .replace(/و/g, "[وؤ]")
    .replace(/\s+/g, "\\s+");
};

const getLanguage = (req) => {
  const lan = String(req.get("lan") || req.get("x-language") || req.query.lan || "en").toLowerCase();
  return lan.startsWith("ar") ? "ar" : "en";
};

const getSearchText = (req) =>
  String(
    req.query.search ??
      req.query.q ??
      req.query.keyword ??
      req.query.title ??
      req.query.name ??
      ""
  ).trim();

const getLimit = (req, fallback = 50) => {
  const n = Number.parseInt(req.query.limit, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
};

const getPage = (req) => {
  const n = Number.parseInt(req.query.page, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const pickTitle = (doc = {}, lan = "en") => {
  if (lan === "ar") {
    return doc.title_ar || doc.name_ar || doc.city_name_ar || doc.country_name_ar || doc.title_en || doc.name_en || doc.name || doc.key || doc.code || "";
  }

  return doc.title_en || doc.name_en || doc.city_name_en || doc.country_name_en || doc.title_ar || doc.name_ar || doc.name || doc.key || doc.code || "";
};

const collectValues = (doc = {}, fields = []) => {
  const values = [];

  for (const field of fields) {
    const value = doc[field];
    if (Array.isArray(value)) values.push(...value.filter(Boolean));
    else if (value !== undefined && value !== null) values.push(value);
  }

  return values.map((value) => asString(value)).filter(Boolean);
};

const tokenize = (text = "") =>
  normalizeMixed(text)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length >= 2 && !AR_STOP.has(token) && !EN_STOP.has(token));

const extractPhrases = (tokens = []) => {
  const phrases = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i + 1]) phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
    if (tokens[i + 1] && tokens[i + 2]) phrases.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }

  return unique(phrases).slice(0, 5);
};

const levenshtein = (a = "", b = "") => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);

  for (let i = 0; i < a.length; i += 1) {
    curr[0] = i + 1;

    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }

    for (let j = 0; j < prev.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
};

const correctTokens = (tokens = [], terms = []) => {
  const normalizedTerms = unique(terms.map(normalizeMixed).filter((term) => term.length > 1));

  return unique(
    tokens.map((token) => {
      if (token.length <= 3) return token;

      let best = token;
      let bestDistance = Infinity;

      for (const term of normalizedTerms) {
        if (Math.abs(term.length - token.length) > Math.max(2, Math.floor(token.length * 0.5))) continue;

        const distance = levenshtein(token, term);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = term;
        }

        if (bestDistance === 0) break;
      }

      return bestDistance <= Math.max(2, Math.floor(token.length * 0.25)) ? best : token;
    })
  );
};

const getSchemaFields = (model, fields = []) =>
  fields.filter((field) => model.schema.path(field));

const getBaseQuery = (model) => {
  const query = {};

  if (model.schema.path("is_active")) query.is_active = { $ne: false };

  return query;
};

const buildSearchQuery = ({ model, fields = [], tokens = [], search = "" }) => {
  const queryFields = getSchemaFields(model, fields);
  const conditions = [];

  if (isValidObjectId(search)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(search) });
  }

  for (const token of tokens) {
    const pattern = makeFlexiblePattern(token);
    if (!pattern) continue;

    const regex = new RegExp(pattern, "i");
    for (const field of queryFields) conditions.push({ [field]: regex });
  }

  const exact = String(search || "").trim();
  if (exact.length >= 1) {
    const rawRegex = new RegExp(escapeRegex(exact), "i");
    for (const field of queryFields) conditions.push({ [field]: rawRegex });
  }

  if (exact.length >= 2) {
    const regex = new RegExp(makeFlexiblePattern(exact), "i");
    for (const field of queryFields) conditions.push({ [field]: regex });
  }

  return conditions.length ? { $or: conditions } : {};
};

const scoreDoc = ({ doc, fields, titleFields, tokens, phrases, search }) => {
  const titleText = normalizeMixed(collectValues(doc, titleFields).join(" "));
  const allText = normalizeMixed(collectValues(doc, fields).join(" "));
  const full = normalizeMixed(search);

  let score = 0;

  if (full) {
    if (titleText === full) score += 100;
    if (titleText.startsWith(full)) score += 35;
    if (titleText.includes(full)) score += 20;
    if (allText.includes(full)) score += 12;
  }

  for (const phrase of phrases) {
    if (titleText.includes(phrase)) score += 10;
    if (allText.includes(phrase)) score += 6;
  }

  for (const token of tokens) {
    if (titleText === token) score += 30;
    if (titleText.startsWith(token)) score += 15;
    if (titleText.includes(token)) score += 8;
    if (allText.includes(token)) score += 4;
  }

  const sortOrder = Number.isFinite(Number(doc.sort_order)) ? Number(doc.sort_order) : 0;
  return score * 1000 - sortOrder;
};

const sortDefault = (items = [], lan = "en") =>
  [...items].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 999999;
    const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 999999;

    if (orderA !== orderB) return orderA - orderB;

    return pickTitle(a, lan).localeCompare(pickTitle(b, lan), lan === "ar" ? "ar" : "en");
  });

const defaultMapper = (doc = {}, lan = "en") => ({
  id: String(doc._id),
  title: pickTitle(doc, lan),
  name: doc.name || doc.key || doc.code || undefined,
  key: doc.key || undefined,
  title_ar: doc.title_ar || undefined,
  title_en: doc.title_en || undefined,
});

const dictionaryFromDocs = (docs = [], fields = []) => {
  const terms = [];

  for (const doc of docs) {
    for (const value of collectValues(doc, fields)) {
      const normalized = normalizeMixed(value);
      if (!normalized) continue;
      terms.push(normalized);
      terms.push(...normalized.split(/\s+/));
    }
  }

  return unique(terms);
};

const runHelper = ({
  req,
  res,
  model,
  fields,
  titleFields = ["title_ar", "title_en", "name", "key"],
  mapper = defaultMapper,
  searchLimit = 250,
  defaultLimit = 50,
  extraQuery = () => ({}),
}) => {
  const lan = getLanguage(req);

  return (async () => {
    const search = getSearchText(req);
    const limit = getLimit(req, defaultLimit);
    const page = getPage(req);
    const skip = (page - 1) * limit;
    let tokens = unique(tokenize(search)).slice(0, 8);
    const phrases = extractPhrases(tokens);
    const extra = extraQuery(req) || {};
    const baseQuery = { ...getBaseQuery(model), ...extra };

    if (!search) {
      const docs = await model
        .find(baseQuery)
        .sort({ sort_order: 1, title_en: 1, title_ar: 1, name_en: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return ReturnAppData.getData({ res, data: sortDefault(docs, lan).map((doc) => mapper(doc, lan)) });
    }

    const query = {
      ...baseQuery,
      ...buildSearchQuery({ model, fields, tokens, search }),
    };

    let docs = await model
      .find(query)
      .limit(searchLimit)
      .lean();

    if (!docs.length && tokens.length) {
      const sampleDocs = await model.find(baseQuery).limit(2000).lean();
      const corrected = correctTokens(tokens, dictionaryFromDocs(sampleDocs, fields));

      if (corrected.join(" ") !== tokens.join(" ")) {
        tokens = corrected;
        docs = await model
          .find({
            ...baseQuery,
            ...buildSearchQuery({ model, fields, tokens, search: corrected.join(" ") }),
          })
          .limit(searchLimit)
          .lean();
      }
    }

    const sorted = docs
      .map((doc) => ({
        doc,
        score: scoreDoc({ doc, fields, titleFields, tokens, phrases, search }),
      }))
      .filter(({ score }) => score > 0 || isValidObjectId(search))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ doc }) => mapper(doc, lan));

    return ReturnAppData.getData({ res, data: sorted });
  })().catch((error) => {
    console.error("[user/v1/helper]", error);
    return ReturnAppData.getError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع" : "server error",
    });
  });
};

const titleKeywordFields = ["name", "key", "title_ar", "title_en", "keyword", "keywords", "keywords_ar", "keywords_en"];

const mapLegacyOptions = (options = [], lan = "en") => {
  if (!Array.isArray(options)) return undefined;

  return options.map((item = {}) => ({
    title: lan === "ar" ? item.title_ar || item.title_en : item.title_en || item.title_ar,
    title_ar: item.title_ar || undefined,
    title_en: item.title_en || undefined,
    type: item.type || undefined,
    option: mapLegacyOptions(item.option, lan),
  }));
};

const titleKeywordMapper = (doc = {}, lan = "en") => {
  const option = mapLegacyOptions(doc.option, lan);

  return {
    id: String(doc._id),
    title: pickTitle(doc, lan),
    name: doc.name || doc.key || undefined,
    key: doc.key || undefined,
    title_ar: doc.title_ar || undefined,
    title_en: doc.title_en || undefined,
    ...(option ? { option } : {}),
  };
};

const jobNameMapper = (doc = {}, lan = "en") => ({
  id: String(doc._id),
  title: pickTitle(doc, lan),
  title_ar: doc.title_ar || undefined,
  title_en: doc.title_en || undefined,
  sector_ar: doc.sector_ar || undefined,
  sector_en: doc.sector_en || undefined,
  subSector_ar: doc.subSector_ar || undefined,
  subSector_en: doc.subSector_en || undefined,
});

const currencyMapper = (doc = {}, lan = "en") => ({
  id: String(doc._id),
  title: lan === "ar" ? doc.name_ar : doc.name_en,
  name: doc.code,
  code: doc.code,
  symbol: lan === "ar" ? doc.symbol_ar : doc.symbol_en,
  symbol_ar: doc.symbol_ar || undefined,
  symbol_en: doc.symbol_en || undefined,
  name_ar: doc.name_ar || undefined,
  name_en: doc.name_en || undefined,
  rate: doc.rate,
  rate_base: doc.rate_base,
});

const countryMapper = (doc = {}, lan = "en") => ({
  id: String(doc._id),
  title: lan === "ar" ? doc.city_name_ar : doc.city_name_en,
  symbol: doc.country_code || undefined,
  country_code: doc.country_code || undefined,
  country_name: lan === "ar" ? doc.country_name_ar : doc.country_name_en,
  city_name: lan === "ar" ? doc.city_name_ar : doc.city_name_en,
  country_name_ar: doc.country_name_ar || undefined,
  country_name_en: doc.country_name_en || undefined,
  city_name_ar: doc.city_name_ar || undefined,
  city_name_en: doc.city_name_en || undefined,
});

const languageMapper = (doc = {}, lan = "en") => ({
  id: String(doc._id),
  title: pickTitle(doc, lan),
  name: doc.name || undefined,
  title_ar: doc.title_ar || undefined,
  title_en: doc.title_en || undefined,
});

const experienceMapper = (doc = {}, lan = "en") => ({
  ...titleKeywordMapper(doc, lan),
  min_years: doc.min_years,
  max_years: doc.max_years,
});

const workModeMapper = (doc = {}, lan = "en") => ({
  ...titleKeywordMapper(doc, lan),
  icon: doc.icon || undefined,
});

const createHandler = (config) => (req, res) => runHelper({ req, res, ...config });

const jobName = createHandler({
  model: JobNameModel,
  fields: ["title_ar", "title_en", "sector_ar", "sector_en", "subSector_ar", "subSector_en", "keywords", "dedupeKey"],
  titleFields: ["title_ar", "title_en"],
  mapper: jobNameMapper,
  searchLimit: 300,
});

const jobSalary = createHandler({
  model: JobSalaryModel,
  fields: titleKeywordFields,
  mapper: titleKeywordMapper,
});

const jobService = createHandler({
  model: JobServiceModel,
  fields: titleKeywordFields,
  mapper: titleKeywordMapper,
});

const jobType = createHandler({
  model: JobTypeModel,
  fields: titleKeywordFields,
  mapper: titleKeywordMapper,
});

const jobLocation = createHandler({
  model: WorkLocationTypeModel,
  fields: titleKeywordFields,
  mapper: titleKeywordMapper,
});

const jobTime = createHandler({
  model: WorkTimeTypeModel,
  fields: [...titleKeywordFields, "max_day"],
  mapper: (doc, lan) => ({
    ...titleKeywordMapper(doc, lan),
    max_day: doc.max_day,
  }),
});

const currency = createHandler({
  model: CurrencyModel,
  fields: ["code", "name_ar", "name_en", "symbol_ar", "symbol_en", "rate_base"],
  titleFields: ["name_ar", "name_en", "code"],
  mapper: currencyMapper,
});
const countryExtraQuery = (req) => {
  const countryCode = String(req.query.country_code || req.query.code || "").trim().toUpperCase();
  const countryId = String(req.query.country_id || "").trim();
  const query = {};

  if (countryCode) query.country_code = countryCode;

  if (countryId) {
    if (isValidObjectId(countryId)) query._id = new mongoose.Types.ObjectId(countryId);
    else query.country_code = countryId.toUpperCase();
  }

  return query;
};
const country = createHandler({
  model: CountryModel,
  fields: ["country_code", "country_name_ar", "country_name_en", "city_name_ar", "city_name_en"],
  titleFields: ["city_name_ar", "city_name_en", "country_name_ar", "country_name_en"],
  mapper: countryMapper,
  searchLimit: 500,
  extraQuery: countryExtraQuery,
});




const language = createHandler({
  model: LanguageModel,
  fields: ["name", "title_ar", "title_en"],
  mapper: languageMapper,
});

const skill = createHandler({
  model: SkillModel,
  fields: ["key", "title_ar", "title_en", "category", "keywords_ar", "keywords_en"],
  mapper: (doc, lan) => ({
    ...titleKeywordMapper(doc, lan),
    category: doc.category || undefined,
  }),
  searchLimit: 300,
});

const educationLevel = createHandler({
  model: EducationLevelModel,
  fields: ["key", "title_ar", "title_en", "keywords_ar", "keywords_en"],
  mapper: titleKeywordMapper,
});

const experienceLevel = createHandler({
  model: ExperienceLevelModel,
  fields: ["key", "title_ar", "title_en", "keywords_ar", "keywords_en"],
  mapper: experienceMapper,
});

const workMode = createHandler({
  model: WorkModeModel,
  fields: ["key", "title_ar", "title_en", "keywords_ar", "keywords_en"],
  mapper: workModeMapper,
});

const industry = createHandler({
  model: IndustryModel,
  fields: ["key", "title_ar", "title_en", "keywords_ar", "keywords_en"],
  mapper: titleKeywordMapper,
});

export default {
  jobName,
  jobSalary,
  jobService,
  jobType,
  jobLocation,
  jobTime,
  currency,
  country,
  language,
  skill,
  educationLevel,
  experienceLevel,
  workMode,
  industry,
};
