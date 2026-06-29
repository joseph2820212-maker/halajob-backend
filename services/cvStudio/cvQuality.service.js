const hasText = (value) => String(value || "").trim().length > 0;
const hasArray = (value) => Array.isArray(value) && value.length > 0;

const check = ({ key, label, weight, pass, suggestion }) => ({
  key,
  label,
  weight,
  pass: Boolean(pass),
  suggestion,
});

const levelForScore = (score) => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 50) return "fair";
  return "needs_work";
};

export const calculateCvQuality = ({ employee = {}, cv = {} }) => {
  const checks = [
    check({
      key: "headline",
      label: "Clear headline",
      weight: 10,
      pass: hasText(employee.profile_headline || employee.current_job_title),
      suggestion: "Add a clear current or target job title.",
    }),
    check({
      key: "summary",
      label: "Professional summary",
      weight: 15,
      pass: hasText(employee.about_me) && String(employee.about_me || "").trim().length >= 60,
      suggestion: "Write a short summary with your experience, strengths, and target role.",
    }),
    check({
      key: "experience",
      label: "Experience",
      weight: 20,
      pass: hasArray(employee.experience),
      suggestion: "Add work experience, internships, projects, or practical achievements.",
    }),
    check({
      key: "education",
      label: "Education",
      weight: 10,
      pass: hasArray(employee.education),
      suggestion: "Add your latest education or training history.",
    }),
    check({
      key: "skills",
      label: "Skills",
      weight: 15,
      pass: hasArray(employee.skills),
      suggestion: "Add relevant technical and soft skills.",
    }),
    check({
      key: "languages",
      label: "Languages",
      weight: 10,
      pass: hasArray(employee.languages),
      suggestion: "Add languages and proficiency levels.",
    }),
    check({
      key: "contact",
      label: "Contact readiness",
      weight: 10,
      pass: hasText(employee.user_id?.email) || hasText(employee.user_id?.phone_national) || hasText(employee.user_id?.phone),
      suggestion: "Make sure email or phone details are complete.",
    }),
    check({
      key: "cv_file",
      label: "Exportable CV",
      weight: 10,
      pass: hasText(cv.pdf_file) || hasText(cv.template_key),
      suggestion: "Generate or upload a CV file so it can be attached to applications.",
    }),
  ];

  const score = checks.reduce((sum, item) => sum + (item.pass ? item.weight : 0), 0);
  const strong = checks.filter((item) => item.pass).map(({ key, label, weight }) => ({ key, label, weight }));
  const missing = checks.filter((item) => !item.pass).map(({ key, label, weight }) => ({ key, label, weight }));
  const suggestions = checks.filter((item) => !item.pass).map((item) => item.suggestion);

  return {
    score,
    level: levelForScore(score),
    strong,
    missing,
    suggestions,
    checks: Object.fromEntries(checks.map((item) => [item.key, { pass: item.pass, weight: item.weight }])),
  };
};

export const updateCvQuality = async ({ cv, employee }) => {
  const result = calculateCvQuality({ cv, employee });
  cv.quality_score = result.score;
  cv.quality_checks = result;
  await cv.save();
  return result;
};

export default {
  calculateCvQuality,
  updateCvQuality,
};
