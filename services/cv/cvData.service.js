const levelText = {
  1: { ar: "مبتدئ", en: "Beginner" },
  2: { ar: "أساسي", en: "Basic" },
  3: { ar: "متوسط", en: "Intermediate" },
  4: { ar: "متقدم", en: "Advanced" },
  5: { ar: "خبير", en: "Expert" },
};

export const formatCvDate = (date, lang = "en") => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(lang === "ar" ? "ar" : "en", {
    year: "numeric",
    month: "short",
  });
};

export const buildCvTemplateData = ({
  employee,
  lang = "en",
  colors = {},
  font = {},
  sections = {},
}) => {
  const user = employee.user_id || {};
  const isAr = lang === "ar";

  const fullName = [user.first_name, user.mid_name, user.last_name]
    .filter(Boolean)
    .join(" ");

  const firstCountry = employee.preferred_countries?.[0];

  return {
    lang,
    dir: isAr ? "rtl" : "ltr",

    user,
    employee,

    full_name: fullName,
    initials: fullName
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),

    job_title:
      employee.current_job_title ||
      employee.profile_headline ||
      employee.job_names?.[0]?.[isAr ? "title_ar" : "title_en"] ||
      "",

    summary: employee.about_me || "",

    email: user.email || "",

    phone: [user.phone_code, user.phone_national || user.phone]
      .filter(Boolean)
      .join(""),

    profile_image_url: user.image || "",

    location: firstCountry
      ? `${firstCountry[isAr ? "city_name_ar" : "city_name_en"] || ""}, ${
          firstCountry[isAr ? "country_name_ar" : "country_name_en"] || ""
        }`
      : "",

    experience: (employee.experience || []).map((item) => ({
      position: item.position || "",
      company_name: item.company_name || "",
      start_date: formatCvDate(item.start_date, lang),
      end_date: item.is_until_now
        ? isAr
          ? "حتى الآن"
          : "Present"
        : formatCvDate(item.end_date, lang),
      details: item.details || "",
    })),

    education: (employee.education || []).map((item) => ({
      level:
        item.education_level_id?.[isAr ? "title_ar" : "title_en"] ||
        item.level ||
        "",
      study: item.study || "",
      institution: item.institution || "",
      start_date: formatCvDate(item.start_date, lang),
      end_date: item.is_until_now
        ? isAr
          ? "حتى الآن"
          : "Present"
        : formatCvDate(item.end_date, lang),
    })),

    skills: (employee.skills || []).map((item) => ({
      title: item.skill_id?.[isAr ? "title_ar" : "title_en"] || item.title || "",
      years: item.years || 0,
      level: item.level || 3,
      percent: Math.min(100, Math.max(20, (item.level || 3) * 20)),
      level_text: levelText[item.level || 3]?.[lang] || "",
    })),

    languages: (employee.languages || []).map((item) => ({
      title:
        item.language_id?.[isAr ? "title_ar" : "title_en"] ||
        item.language_id?.name ||
        "",
      level: item.level || 1,
      percent: Math.min(100, Math.max(20, (item.level || 1) * 20)),
      level_text: levelText[item.level || 1]?.[lang] || "",
    })),

    licenses: employee.licenses || [],
    testimony: employee.testimony || [],
    links: employee.links || [],

    job_names: employee.job_names || [],
    job_types: employee.job_types || [],
    preferred_countries: employee.preferred_countries || [],
    preferred_work_modes: employee.preferred_work_modes || [],

    expected_salary: employee.expected_salary || {},

    sections,

    background_color: colors.background_color || "#f0ebe3",
    card_color: colors.card_color || "#ffffff",
    sidebar_color: colors.sidebar_color || "#2b2d42",
    accent_color: colors.accent_color || "#ef8354",
    text_color: colors.text_color || "#555555",

    font_family: font.family || "Arial",
    font_size: font.size || 14,
  };
};