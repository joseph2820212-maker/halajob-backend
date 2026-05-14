import dotenv from "dotenv";
import { ExperienceLevelModel } from "../models/index.js";
import normalizeArabicKeyword from "../helper/normalizeArabicKeyword.js";

dotenv.config();

export const seedExperienceLevels = async () => {
  try {
    const experienceLevels = [
      {
        key: "fresh_graduate",

        title_ar: "حديث التخرج",
        title_en: "Fresh Graduate",

        min_years: 0,
        max_years: 0,

        keywords_ar: [
          "حديث التخرج",
          "خريج جديد",
          "متخرج حديثا",
          "بدون خبرة",
          "لا يوجد خبرة",
          "طالب متخرج",
          "خريج جامعة",
          "خريج معهد",
          "entry level",
          "fresh graduate",
        ],

        keywords_en: [
          "fresh graduate",
          "new graduate",
          "recent graduate",
          "graduate",
          "no experience",
          "without experience",
          "entry level",
          "junior candidate",
          "university graduate",
          "college graduate",
        ],

        sort_order: 1,
      },

      {
        key: "intern",

        title_ar: "متدرب",
        title_en: "Intern",

        min_years: 0,
        max_years: 0,

        keywords_ar: [
          "متدرب",
          "تدريب",
          "تدريب عملي",
          "فرصة تدريب",
          "طالب",
          "طالب جامعي",
          "intern",
          "internship",
          "trainee",
        ],

        keywords_en: [
          "intern",
          "internship",
          "trainee",
          "student internship",
          "training",
          "apprentice",
          "practical training",
        ],

        sort_order: 2,
      },

      {
        key: "entry_level",

        title_ar: "مبتدئ",
        title_en: "Entry Level",

        min_years: 0,
        max_years: 1,

        keywords_ar: [
          "مبتدئ",
          "مستوى مبتدئ",
          "خبرة قليلة",
          "سنة خبرة",
          "اقل من سنة",
          "من 0 الى 1 سنة",
          "بداية المسار المهني",
          "entry level",
          "beginner",
        ],

        keywords_en: [
          "entry level",
          "beginner",
          "starter",
          "early career",
          "0 years",
          "0-1 years",
          "less than 1 year",
          "one year experience",
          "limited experience",
        ],

        sort_order: 3,
      },

      {
        key: "junior",

        title_ar: "جونيور",
        title_en: "Junior",

        min_years: 1,
        max_years: 2,

        keywords_ar: [
          "جونيور",
          "مبتدئ",
          "خبرة سنة",
          "خبرة سنتين",
          "من سنة الى سنتين",
          "1-2 سنوات",
          "junior",
          "junior level",
        ],

        keywords_en: [
          "junior",
          "junior level",
          "junior position",
          "1 year experience",
          "2 years experience",
          "1-2 years",
          "early career",
        ],

        sort_order: 4,
      },

      {
        key: "mid_level",

        title_ar: "متوسط الخبرة",
        title_en: "Mid Level",

        min_years: 2,
        max_years: 5,

        keywords_ar: [
          "متوسط الخبرة",
          "مستوى متوسط",
          "خبرة متوسطة",
          "من سنتين الى خمس سنوات",
          "2-5 سنوات",
          "خبرة 3 سنوات",
          "خبرة 4 سنوات",
          "mid level",
          "intermediate",
        ],

        keywords_en: [
          "mid level",
          "mid-level",
          "intermediate",
          "experienced",
          "2-5 years",
          "3 years experience",
          "4 years experience",
          "5 years experience",
        ],

        sort_order: 5,
      },

      {
        key: "senior",

        title_ar: "سينيور",
        title_en: "Senior",

        min_years: 5,
        max_years: 8,

        keywords_ar: [
          "سينيور",
          "خبير",
          "خبرة عالية",
          "مستوى متقدم",
          "اكثر من 5 سنوات",
          "5-8 سنوات",
          "خبرة 6 سنوات",
          "خبرة 7 سنوات",
          "senior",
          "senior level",
        ],

        keywords_en: [
          "senior",
          "senior level",
          "advanced",
          "highly experienced",
          "5+ years",
          "5-8 years",
          "6 years experience",
          "7 years experience",
          "8 years experience",
        ],

        sort_order: 6,
      },

      {
        key: "lead",

        title_ar: "قائد فريق",
        title_en: "Lead",

        min_years: 6,
        max_years: 10,

        keywords_ar: [
          "قائد فريق",
          "تيم ليد",
          "مسؤول فريق",
          "مشرف فريق",
          "قيادة فريق",
          "lead",
          "team lead",
          "technical lead",
        ],

        keywords_en: [
          "lead",
          "team lead",
          "technical lead",
          "tech lead",
          "lead engineer",
          "lead developer",
          "team leadership",
          "6+ years",
        ],

        sort_order: 7,
      },

      {
        key: "principal",

        title_ar: "خبير رئيسي",
        title_en: "Principal",

        min_years: 8,
        max_years: 12,

        keywords_ar: [
          "خبير رئيسي",
          "مستشار تقني",
          "خبير متقدم",
          "principal",
          "principal engineer",
          "principal developer",
          "staff engineer",
        ],

        keywords_en: [
          "principal",
          "principal engineer",
          "principal developer",
          "staff engineer",
          "expert level",
          "senior expert",
          "8+ years",
          "10+ years",
        ],

        sort_order: 8,
      },

      {
        key: "manager",

        title_ar: "مدير",
        title_en: "Manager",

        min_years: 7,
        max_years: 15,

        keywords_ar: [
          "مدير",
          "مدير فريق",
          "مدير قسم",
          "مدير مشروع",
          "مدير عمليات",
          "اداري",
          "management",
          "manager",
        ],

        keywords_en: [
          "manager",
          "management",
          "team manager",
          "department manager",
          "project manager",
          "operations manager",
          "people manager",
          "7+ years",
        ],

        sort_order: 9,
      },

      {
        key: "director",

        title_ar: "مدير تنفيذي / مدير إدارة",
        title_en: "Director",

        min_years: 10,
        max_years: 20,

        keywords_ar: [
          "مدير ادارة",
          "مدير تنفيذي",
          "مدير عام",
          "مدير قطاع",
          "director",
          "head of",
          "رئيس قسم",
          "رئيس ادارة",
        ],

        keywords_en: [
          "director",
          "head of",
          "department head",
          "executive director",
          "business director",
          "senior management",
          "10+ years",
          "15+ years",
        ],

        sort_order: 10,
      },

      {
        key: "executive",

        title_ar: "إدارة عليا",
        title_en: "Executive",

        min_years: 12,
        max_years: null,

        keywords_ar: [
          "ادارة عليا",
          "تنفيذي",
          "الرئيس التنفيذي",
          "مدير تنفيذي",
          "نائب رئيس",
          "شريك مؤسس",
          "executive",
          "c level",
          "ceo",
          "cto",
          "coo",
        ],

        keywords_en: [
          "executive",
          "c-level",
          "c level",
          "chief executive officer",
          "ceo",
          "cto",
          "coo",
          "cfo",
          "vp",
          "vice president",
          "founder",
          "co-founder",
          "12+ years",
        ],

        sort_order: 11,
      },
    ];

    for (const experienceLevel of experienceLevels) {
      await ExperienceLevelModel.updateOne(
        {
          key: experienceLevel.key,
        },
        {
          $set: {
            key: experienceLevel.key,

            title_ar: experienceLevel.title_ar,
            title_en: experienceLevel.title_en,

            min_years: experienceLevel.min_years,
            max_years: experienceLevel.max_years,

            keywords_ar: experienceLevel.keywords_ar.map(normalizeArabicKeyword),
            keywords_en: experienceLevel.keywords_en.map((keyword) =>
              String(keyword).trim().toLowerCase()
            ),

            sort_order: experienceLevel.sort_order,

            is_active: true,
            is_system: true,
          },
        },
        {
          upsert: true,
        }
      );
    }

    console.log("✅ Experience levels seeded successfully");
  } catch (error) {
    console.error("❌ Experience levels seeder error:", error);
    throw error;
  }
};