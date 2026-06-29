const cleanText = (value = "", max = 2000) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const cleanList = (value, maxItems = 40, maxLength = 120) => {
  const source = Array.isArray(value) ? value : String(value || "").split(/[,;\n]+/);
  return [
    ...new Set(
      source
        .map((item) => cleanText(item, maxLength))
        .filter(Boolean)
    ),
  ].slice(0, maxItems);
};

const normalizeExperience = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item = {}) => ({
      company_name: cleanText(item.company_name || item.company || "", 180),
      position: cleanText(item.position || item.title || "", 180),
      details: cleanText(item.details || item.description || "", 1500),
    }))
    .filter((item) => item.company_name || item.position || item.details)
    .slice(0, 20);

const normalizeEducation = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item = {}) => ({
      level: cleanText(item.level || item.degree || "", 180),
      study: cleanText(item.study || item.field || "", 180),
      institution: cleanText(item.institution || item.school || "", 180),
    }))
    .filter((item) => item.level || item.study || item.institution)
    .slice(0, 20);

export const normalizeCvParseResult = (input = {}) => ({
  profile_headline: cleanText(input.profile_headline || input.headline || input.title || "", 180),
  current_job_title: cleanText(input.current_job_title || input.job_title || input.role || "", 180),
  about_me: cleanText(input.about_me || input.summary || input.objective || "", 3000),
  skills: cleanList(input.skills || input.technical_skills),
  languages: cleanList(input.languages, 20, 80),
  links: cleanList(input.links || input.urls, 20, 300).map((url) => ({ title: "", url })),
  experience: normalizeExperience(input.experience || input.work_experience),
  education: normalizeEducation(input.education),
});

export default {
  normalizeCvParseResult,
};
