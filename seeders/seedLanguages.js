import dotenv from "dotenv";
import { LanguageModel } from "../models/index.js";

dotenv.config();

export const seedLanguages = async () => {
  try {
    const languages = [
      {
        name: "english",
        title_ar: "الإنجليزية",
        title_en: "English",
      },
      {
        name: "arabic",
        title_ar: "العربية",
        title_en: "Arabic",
      },
      {
        name: "chinese",
        title_ar: "الصينية",
        title_en: "Chinese",
      },
      {
        name: "spanish",
        title_ar: "الإسبانية",
        title_en: "Spanish",
      },
      {
        name: "french",
        title_ar: "الفرنسية",
        title_en: "French",
      },
      {
        name: "german",
        title_ar: "الألمانية",
        title_en: "German",
      },
      {
        name: "russian",
        title_ar: "الروسية",
        title_en: "Russian",
      },
      {
        name: "portuguese",
        title_ar: "البرتغالية",
        title_en: "Portuguese",
      },
      {
        name: "hindi",
        title_ar: "الهندية",
        title_en: "Hindi",
      },
      {
        name: "urdu",
        title_ar: "الأردية",
        title_en: "Urdu",
      },
      {
        name: "turkish",
        title_ar: "التركية",
        title_en: "Turkish",
      },
      {
        name: "italian",
        title_ar: "الإيطالية",
        title_en: "Italian",
      },
      {
        name: "japanese",
        title_ar: "اليابانية",
        title_en: "Japanese",
      },
      {
        name: "korean",
        title_ar: "الكورية",
        title_en: "Korean",
      },
      {
        name: "persian",
        title_ar: "الفارسية",
        title_en: "Persian",
      },
      {
        name: "dutch",
        title_ar: "الهولندية",
        title_en: "Dutch",
      },
      {
        name: "swedish",
        title_ar: "السويدية",
        title_en: "Swedish",
      },
      {
        name: "greek",
        title_ar: "اليونانية",
        title_en: "Greek",
      },
      {
        name: "hebrew",
        title_ar: "العبرية",
        title_en: "Hebrew",
      },
      {
        name: "indonesian",
        title_ar: "الإندونيسية",
        title_en: "Indonesian",
      },
      {
        name: "malay",
        title_ar: "الملايوية",
        title_en: "Malay",
      },
      {
        name: "thai",
        title_ar: "التايلندية",
        title_en: "Thai",
      },
      {
        name: "vietnamese",
        title_ar: "الفيتنامية",
        title_en: "Vietnamese",
      },
      {
        name: "polish",
        title_ar: "البولندية",
        title_en: "Polish",
      },
      {
        name: "romanian",
        title_ar: "الرومانية",
        title_en: "Romanian",
      },
      {
        name: "ukrainian",
        title_ar: "الأوكرانية",
        title_en: "Ukrainian",
      },
      {
        name: "bengali",
        title_ar: "البنغالية",
        title_en: "Bengali",
      },
      {
        name: "swahili",
        title_ar: "السواحيلية",
        title_en: "Swahili",
      },
      {
        name: "other",
        title_ar: "أخرى",
        title_en: "Other",
      },
    ];

    for (const language of languages) {
      await LanguageModel.updateOne(
        {
          name: language.name,
        },
        {
          $set: {
            name: language.name,
            title_ar: language.title_ar,
            title_en: language.title_en,
          },
        },
        {
          upsert: true,
        }
      );
    }

    console.log("✅ Languages seeded successfully");
  } catch (error) {
    console.error("❌ Languages seeder error:", error);
    throw error;
  }
};