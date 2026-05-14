import dotenv from "dotenv";
import { CountryModel } from "../models/index.js";

dotenv.config();

export const seedCountries = async () => {
  try {
    const countries = [
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "دمشق",
        city_name_en: "Damascus",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "حلب",
        city_name_en: "Aleppo",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "حمص",
        city_name_en: "Homs",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "حماة",
        city_name_en: "Hama",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "اللاذقية",
        city_name_en: "Latakia",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "طرطوس",
        city_name_en: "Tartus",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "إدلب",
        city_name_en: "Idlib",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "درعا",
        city_name_en: "Daraa",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "السويداء",
        city_name_en: "As-Suwayda",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "القنيطرة",
        city_name_en: "Quneitra",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "دير الزور",
        city_name_en: "Deir ez-Zor",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "الرقة",
        city_name_en: "Raqqa",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "الحسكة",
        city_name_en: "Al-Hasakah",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "القامشلي",
        city_name_en: "Qamishli",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "عفرين",
        city_name_en: "Afrin",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "الباب",
        city_name_en: "Al-Bab",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "منبج",
        city_name_en: "Manbij",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "جبلة",
        city_name_en: "Jableh",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "بانياس",
        city_name_en: "Baniyas",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "السلمية",
        city_name_en: "Salamiyah",
      },
      {
        country_code: "SY",

        country_name_ar: "سوريا",
        country_name_en: "Syria",

        city_name_ar: "تدمر",
        city_name_en: "Palmyra",
      },
    ];

    for (const country of countries) {
      await CountryModel.updateOne(
        {
          country_code: country.country_code,
          city_name_en: country.city_name_en,
        },
        {
          $set: {
            country_code: country.country_code,

            country_name_ar: country.country_name_ar,
            country_name_en: country.country_name_en,

            city_name_ar: country.city_name_ar,
            city_name_en: country.city_name_en,
          },
        },
        {
          upsert: true,
        }
      );
    }

    console.log("✅ Countries seeded successfully");
  } catch (error) {
    console.error("❌ Seeder error:", error);
    throw error;
  }
};