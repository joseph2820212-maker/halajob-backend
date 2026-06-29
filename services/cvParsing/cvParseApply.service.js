import { normalizeCvParseResult } from "./cvParseNormalizer.js";

const hasText = (value) => String(value || "").trim().length > 0;

const skillItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((title) => ({ title: String(title || "").trim(), years: 0, level: 3 }))
    .filter((item) => item.title);

const languageItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((title) => ({ title: String(title || "").trim(), level: 3 }))
    .filter((item) => item.title);

export const buildEmployeeUpdateFromParsedCv = (parsed = {}) => {
  const normalized = normalizeCvParseResult(parsed);
  const set = {};

  if (hasText(normalized.profile_headline)) set.profile_headline = normalized.profile_headline;
  if (hasText(normalized.current_job_title)) set.current_job_title = normalized.current_job_title;
  if (hasText(normalized.about_me)) set.about_me = normalized.about_me;
  if (normalized.experience.length) set.experience = normalized.experience;
  if (normalized.education.length) set.education = normalized.education;
  if (normalized.links.length) set.links = normalized.links;
  if (normalized.skills.length) set.skills = skillItems(normalized.skills);

  return {
    $set: set,
    languageItems: languageItems(normalized.languages),
  };
};

export const applyParsedCvToEmployee = async ({ employee, parsed }) => {
  const update = buildEmployeeUpdateFromParsedCv(parsed);
  if (Object.keys(update.$set).length) {
    employee.set(update.$set);
  }
  if (update.languageItems.length) {
    employee.set("languages", update.languageItems);
  }
  await employee.save();
  return employee;
};

export default {
  applyParsedCvToEmployee,
  buildEmployeeUpdateFromParsedCv,
};
