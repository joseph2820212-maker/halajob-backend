import dotenv from "dotenv";
import { EducationLevelModel } from "../models/index.js";

dotenv.config();

export const seedEducationLevels = async () => {
  try {
    const educationLevels = [
      {
        key: "high-school",
        title_ar: "ثانوية عامة",
        title_en: "High School",
        sort_order: 1,
        keywords_ar: ["بكالوريا", "ثانوية", "تعليم ثانوي"],
        keywords_en: ["high school", "secondary school", "baccalaureate"],
        is_active: true,
        is_system: true,
      },

      {
        key: "diploma",
        title_ar: "دبلوم",
        title_en: "Diploma",
        sort_order: 2,
        keywords_ar: ["معهد", "دبلوم متوسط", "تعليم مهني"],
        keywords_en: ["diploma", "institute", "vocational"],
        is_active: true,
        is_system: true,
      },

      {
        key: "associate-degree",
        title_ar: "درجة مشارك",
        title_en: "Associate Degree",
        sort_order: 3,
        keywords_ar: ["associate", "درجة متوسطة"],
        keywords_en: ["associate degree", "foundation degree"],
        is_active: true,
        is_system: true,
      },

      {
        key: "bachelor",
        title_ar: "بكالوريوس",
        title_en: "Bachelor's Degree",
        sort_order: 4,
        keywords_ar: ["إجازة جامعية", "بكالوريوس", "جامعة"],
        keywords_en: ["bachelor", "bachelor degree", "undergraduate"],
        is_active: true,
        is_system: true,
      },

      {
        key: "postgraduate-diploma",
        title_ar: "دبلوم دراسات عليا",
        title_en: "Postgraduate Diploma",
        sort_order: 5,
        keywords_ar: ["دراسات عليا", "دبلوم عالي"],
        keywords_en: ["postgraduate diploma", "graduate diploma"],
        is_active: true,
        is_system: true,
      },

      {
        key: "master",
        title_ar: "ماجستير",
        title_en: "Master's Degree",
        sort_order: 6,
        keywords_ar: ["ماستر", "دراسات عليا", "ماجستير"],
        keywords_en: ["master", "masters degree", "graduate degree"],
        is_active: true,
        is_system: true,
      },

      {
        key: "mba",
        title_ar: "ماجستير إدارة أعمال",
        title_en: "MBA",
        sort_order: 7,
        keywords_ar: ["إدارة أعمال", "mba"],
        keywords_en: ["mba", "business administration"],
        is_active: true,
        is_system: true,
      },

      {
        key: "phd",
        title_ar: "دكتوراه",
        title_en: "PhD",
        sort_order: 8,
        keywords_ar: ["دكتوراه", "باحث", "دكتور"],
        keywords_en: ["phd", "doctorate", "doctoral degree"],
        is_active: true,
        is_system: true,
      },

      {
        key: "professional-certification",
        title_ar: "شهادة احترافية",
        title_en: "Professional Certification",
        sort_order: 9,
        keywords_ar: ["شهادة", "اعتماد مهني", "احترافي"],
        keywords_en: ["certification", "professional certificate", "license"],
        is_active: true,
        is_system: true,
      },

      {
        key: "bootcamp",
        title_ar: "معسكر تدريبي",
        title_en: "Bootcamp",
        sort_order: 10,
        keywords_ar: ["بوتكامب", "تدريب مكثف"],
        keywords_en: ["bootcamp", "intensive training"],
        is_active: true,
        is_system: true,
      },

      {
        key: "self-taught",
        title_ar: "تعلم ذاتي",
        title_en: "Self-Taught",
        sort_order: 11,
        keywords_ar: ["تعلم ذاتي", "تعلم مستقل"],
        keywords_en: ["self taught", "independent learning"],
        is_active: true,
        is_system: true,
      },
    ];

    for (const level of educationLevels) {
      await EducationLevelModel.updateOne(
        { key: level.key },
        {
          $set: level,
        },
        { upsert: true }
      );
    }

    console.log("✅ Education levels seeded successfully");
  } catch (error) {
    console.error("❌ Education levels seeder error:", error);
    throw error;
  }
};

export default seedEducationLevels;