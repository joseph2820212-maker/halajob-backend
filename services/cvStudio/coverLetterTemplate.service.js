const cleanText = (value = "", fallback = "") => String(value || fallback || "").trim();

export const COVER_LETTER_TEMPLATES = [
  {
    key: "direct",
    title: "Direct application",
    tone: "professional",
  },
  {
    key: "graduate",
    title: "Graduate or early career",
    tone: "warm",
  },
  {
    key: "career_change",
    title: "Career change",
    tone: "confident",
  },
];

export const listCoverLetterTemplates = () => COVER_LETTER_TEMPLATES;

export const renderCoverLetter = ({ templateKey = "direct", employee = {}, job = {}, company = {}, custom = {} }) => {
  const template = COVER_LETTER_TEMPLATES.find((item) => item.key === templateKey) || COVER_LETTER_TEMPLATES[0];
  const user = employee.user_id || {};
  const fullName = cleanText(
    [user.first_name, user.last_name].filter(Boolean).join(" "),
    "Candidate"
  );
  const role = cleanText(job.job_name || custom.job_title, "the role");
  const companyName = cleanText(company.company_name || custom.company_name, "your team");
  const headline = cleanText(employee.profile_headline || employee.current_job_title, "motivated candidate");
  const summary = cleanText(employee.about_me, "I would welcome the chance to contribute with discipline, curiosity, and practical execution.");

  const body =
    template.key === "graduate"
      ? `Dear ${companyName},\n\nI am applying for ${role}. As a ${headline}, I am eager to grow through meaningful work and bring strong learning energy to your team.\n\n${summary}\n\nThank you for considering my application.\n\n${fullName}`
      : template.key === "career_change"
        ? `Dear ${companyName},\n\nI am interested in ${role}. My background as a ${headline} gives me transferable strengths and a practical understanding of how to learn quickly, adapt, and deliver.\n\n${summary}\n\nI would be glad to discuss how my experience can support your goals.\n\n${fullName}`
        : `Dear ${companyName},\n\nI am applying for ${role}. My profile as a ${headline} aligns with this opportunity, and I am interested in contributing to your team.\n\n${summary}\n\nThank you for your time and consideration.\n\n${fullName}`;

  return {
    template,
    text: body,
  };
};

export default {
  COVER_LETTER_TEMPLATES,
  listCoverLetterTemplates,
  renderCoverLetter,
};
