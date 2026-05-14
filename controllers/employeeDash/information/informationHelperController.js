import { fail, success } from "../../../helper/employeeDash/employeeDashHelpers.js";
import { CountryModel, CurrencyModel, ExperienceLevelModel, JobTypeModel, LanguageModel, WorkModeModel } from "../../../models/index.js"

const getLanguages = async (req, res, next) => {
 try {
  const is_ar = req.get("lan") === "ar"
  const languages = await LanguageModel.find();
  const response = languages.map(d => {
   return {
    id: d._id,
    name: is_ar ? d.title_ar : d.title_en
   }
  })
  return success(res, response, "success");
 } catch (error) {
  return fail(res, message)
 }
}
const getJobType= async (req, res, next) => {
 try {
  const is_ar = req.get("lan") === "ar"
  const languages = await JobTypeModel.find();
  const response = languages.map(d => {
   return {
    id: d._id,
    name: is_ar ? d.title_ar : d.title_en
   }
  })
  return success(res, response, "success");
 } catch (error) {
  return fail(res, message)
 }
}
const getCurrencies= async (req, res, next) => {
 try {
  const is_ar = req.get("lan") === "ar"
  const languages = await CurrencyModel.find();
  const response = languages.map(d => {
   return {
    id: d._id,
    name: is_ar ? d.name_ar : d.name_en
   }
  })
  return success(res, response, "success");
 } catch (error) {
  return fail(res, message)
 }
}
const experienceLevel=async(req, res, next) => {
 try {
  const is_ar = req.get("lan") === "ar"
  const languages = await ExperienceLevelModel.find();
  const response = languages.map(d => {
   return {
    id: d._id,
    name: is_ar ? d.title_ar : d.title_en
   }
  })
  return success(res, response, "success");
 } catch (error) {
  return fail(res, message)
 }
}
const workMode=async(req, res, next) => {
 try {
  const is_ar = req.get("lan") === "ar"
  const languages = await WorkModeModel.find();
  const response = languages.map(d => {
   return {
    id: d._id,
    name: is_ar ? d.title_ar : d.title_en
   }
  })
  return success(res, response, "success");
 } catch (error) {
  return fail(res, message)
 }
}
const cities=async(req, res, next) => {
 try {
  const is_ar = req.get("lan") === "ar"
  const languages = await CountryModel.find();
  const response = languages.map(d => {
   return {
    id: d._id,
    name: is_ar ? d.city_name_ar : d.city_name_en
   }
  })
  return success(res, response, "success");
 } catch (error) {
  return fail(res, message)
 }
}
export default {
 getLanguages,
 getJobType,
 getCurrencies,
 experienceLevel,
 workMode,
 cities
}