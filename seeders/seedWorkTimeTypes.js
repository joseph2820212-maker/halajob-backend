import dotenv from "dotenv";
import { WorkTimeTypeModel } from "../models/index.js";
import normalizeArabicKeyword from "../helper/normalizeArabicKeyword.js";

dotenv.config();

export const seedWorkTimeTypes = async () => {
  try {
    const workTimeTypes = [
      {
        name: "immediately",

        title_ar: "فورا",
        title_en: "Immediately",

        keyword: [
          "فورا",
          "مباشرة",
          "حالاً",
          "اليوم",
          "الان",
          "جاهز مباشرة",
          "بشكل فوري",
        ],

        max_day: 0,
      },

      {
        name: "same_day",

        title_ar: "نفس اليوم",
        title_en: "Same Day",

        keyword: [
          "نفس اليوم",
          "خلال اليوم",
          "اليوم",
          "خلال ساعات",
        ],

        max_day: 1,
      },

      {
        name: "next_day",

        title_ar: "بعد يوم",
        title_en: "Next Day",

        keyword: [
          "بعد يوم",
          "اليوم التالي",
          "غدا",
          "خلال يوم",
        ],

        max_day: 1,
      },

      {
        name: "within_3_days",

        title_ar: "خلال 3 ايام",
        title_en: "Within 3 Days",

        keyword: [
          "خلال 3 ايام",
          "ثلاثة ايام",
          "بعد كم يوم",
          "خلال ايام",
        ],

        max_day: 3,
      },

      {
        name: "within_week",

        title_ar: "خلال اسبوع",
        title_en: "Within a Week",

        keyword: [
          "خلال اسبوع",
          "اسبوع",
          "بعد اسبوع",
          "خلال 7 ايام",
        ],

        max_day: 7,
      },

      {
        name: "within_2_weeks",

        title_ar: "خلال اسبوعين",
        title_en: "Within 2 Weeks",

        keyword: [
          "اسبوعين",
          "خلال اسبوعين",
          "14 يوم",
          "خلال 14 يوم",
        ],

        max_day: 14,
      },

      {
        name: "within_month",

        title_ar: "خلال شهر",
        title_en: "Within a Month",

        keyword: [
          "خلال شهر",
          "شهر",
          "بعد شهر",
          "خلال 30 يوم",
        ],

        max_day: 30,
      },

      {
        name: "within_2_months",

        title_ar: "خلال شهرين",
        title_en: "Within 2 Months",

        keyword: [
          "شهرين",
          "خلال شهرين",
          "60 يوم",
          "خلال 60 يوم",
        ],

        max_day: 60,
      },

      {
        name: "within_3_months",

        title_ar: "خلال 3 اشهر",
        title_en: "Within 3 Months",

        keyword: [
          "3 اشهر",
          "ثلاثة اشهر",
          "خلال 3 اشهر",
          "90 يوم",
        ],

        max_day: 90,
      },

      {
        name: "flexible",

        title_ar: "مرن",
        title_en: "Flexible",

        keyword: [
          "مرن",
          "قابل للتفاوض",
          "حسب الاتفاق",
          "غير محدد",
        ],

        max_day: 9999,
      },
    ];

    for (const workTimeType of workTimeTypes) {
      await WorkTimeTypeModel.updateOne(
        {
          name: workTimeType.name,
        },
        {
          $set: {
            name: workTimeType.name,

            title_ar: workTimeType.title_ar,
            title_en: workTimeType.title_en,

            keyword: workTimeType.keyword.map(normalizeArabicKeyword),

            max_day: workTimeType.max_day,
          },
        },
        {
          upsert: true,
        }
      );
    }

    console.log("✅ Work time types seeded successfully");
  } catch (error) {
    console.error("❌ Work time types seeder error:", error);
    throw error;
  }
};