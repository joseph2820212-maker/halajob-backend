import mongoose from "mongoose";
import {
  fail,
  success,
} from "../../../helper/employeeDash/employeeDashHelpers.js";

import {
  CountryModel,
  CurrencyModel,
  EducationLevelModel,
  ExperienceLevelModel,
  IndustryModel,
  JobSalaryModel,
  JobServiceModel,
  JobTypeModel,
  LanguageModel,
  SkillModel,
  WorkModeModel,
  WorkTimeTypeModel,
} from "../../../models/index.js";

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getSearchText = (req) => {
  return String(
    req.query.search ||
      req.query.q ||
      req.query.keyword ||
      ""
  ).trim();
};

const buildTitleKeywordSearch = (req) => {
  const search = getSearchText(req);

  if (!search) return {};

  const regex = new RegExp(escapeRegex(search), "i");

  const conditions = [
    { title_ar: regex },
    { title_en: regex },
    { keywords_ar: regex },
    { keywords_en: regex },
  ];

  if (mongoose.Types.ObjectId.isValid(search)) {
    conditions.push({
      _id: new mongoose.Types.ObjectId(search),
    });
  }

  return {
    $or: conditions,
  };
};

const buildCurrencySearch = (req) => {
  const search = getSearchText(req);

  if (!search) return {};

  const regex = new RegExp(escapeRegex(search), "i");

  const conditions = [
    { name_ar: regex },
    { name_en: regex },
    { code: regex },
    { symbol: regex },
  ];

  if (mongoose.Types.ObjectId.isValid(search)) {
    conditions.unshift({
      _id: new mongoose.Types.ObjectId(search),
    });
  }

  return {
    $or: conditions,
  };
};

const buildCitySearch = (req) => {
  const search = getSearchText(req);

  if (!search) return {};

  const regex = new RegExp(escapeRegex(search), "i");

  return {
    $or: [
      { city_name_ar: regex },
      { city_name_en: regex },
      { country_name_ar: regex },
      { country_name_en: regex },
      { title_ar: regex },
      { title_en: regex },
      { keywords_ar: regex },
      { keywords_en: regex },
    ],
  };
};

const mapTitleKeywordResponse = (items, is_ar) => {
  return items.map((d) => ({
    id: d._id,
    name: is_ar ? d.title_ar : d.title_en,
    title_ar: d.title_ar,
    title_en: d.title_en,
    keywords_ar: d.keywords_ar || [],
    keywords_en: d.keywords_en || [],
  }));
};

const getList = async ({
  req,
  res,
  model,
  searchBuilder = buildTitleKeywordSearch,
  mapper = mapTitleKeywordResponse,
  sort = { sort_order: 1, title_en: 1 },
}) => {
  try {
    const is_ar = req.get("lan") === "ar";
    const query = searchBuilder(req);

    const items = await model
      .find(query)
      .sort(sort)
      .limit(30)
      .lean();

    return success(res, mapper(items, is_ar), "success");
  } catch (error) {
    return fail(res, error.message || "Failed to get data");
  }
};

const getLanguages = async (req, res, next) => {
  return getList({
    req,
    res,
    model: LanguageModel,
  });
};

const getJobType = async (req, res, next) => {
  return getList({
    req,
    res,
    model: JobTypeModel,
  });
};

const getCurrencies = async (req, res, next) => {
  return getList({
    req,
    res,
    model: CurrencyModel,
    searchBuilder: buildCurrencySearch,
    sort: { code: 1, name_en: 1 },
    mapper: (items, is_ar) =>
      items.map((d) => ({
        id: d._id,
        name: is_ar ? d.name_ar : d.name_en,
        name_ar: d.name_ar,
        name_en: d.name_en,
        code: d.code,
        symbol: d.symbol,
      })),
  });
};

const experienceLevel = async (req, res, next) => {
  return getList({
    req,
    res,
    model: ExperienceLevelModel,
  });
};

const workMode = async (req, res, next) => {
  return getList({
    req,
    res,
    model: WorkModeModel,
  });
};

const cities = async (req, res, next) => {
  return getList({
    req,
    res,
    model: CountryModel,
    searchBuilder: buildCitySearch,
    sort: { city_name_en: 1 },
    mapper: (items, is_ar) =>
      items.map((d) => ({
        id: d._id,
        name: is_ar ? d.city_name_ar : d.city_name_en,
        city_name_ar: d.city_name_ar,
        city_name_en: d.city_name_en,
        country_name_ar: d.country_name_ar,
        country_name_en: d.country_name_en,
      })),
  });
};

const industry = async (req, res, next) => {
  return getList({
    req,
    res,
    model: IndustryModel,
  });
};

const workTime = async (req, res, next) => {
  return getList({
    req,
    res,
    model: WorkTimeTypeModel,
  });
};

const salaryType = async (req, res, next) => {
  return getList({
    req,
    res,
    model: JobSalaryModel,
  });
};

const skills = async (req, res, next) => {
  return getList({
    req,
    res,
    model: SkillModel,
  });
};

const educationLevel = async (req, res, next) => {
  return getList({
    req,
    res,
    model: EducationLevelModel,
  });
};
const services = async (req, res, next) => {
  return getList({
    req,
    res,
    model: JobServiceModel,
  });
};

export default {
  getLanguages,
  getJobType,
  getCurrencies,
  experienceLevel,
  workMode,
  cities,
  industry,
  workTime,
  salaryType,
  skills,
  educationLevel,
  services
};