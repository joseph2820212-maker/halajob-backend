import dotenv from "dotenv";
import { JobTypeModel } from "../models/index.js";
import normalizeArabicKeyword from "../helper/normalizeArabicKeyword.js";

dotenv.config();

export const seedJobTypes = async () => {
 try {
  const jobTypes = [
   {
    name: "full_time",

    title_ar: "دوام كامل",
    title_en: "Full Time",

    keyword: [
     "دوام كامل",
     "كامل",
     "فل تايم",
     "عمل كامل",
     "وظيفة كاملة",
    ],
   },

   {
    name: "part_time",

    title_ar: "دوام جزئي",
    title_en: "Part Time",

    keyword: [
     "دوام جزئي",
     "جزئي",
     "بارت تايم",
     "نصف دوام",
     "ساعات قليلة",
    ],
   },

   {
    name: "contract",

    title_ar: "عقد",
    title_en: "Contract",

    keyword: [
     "عقد",
     "بعقد",
     "تعاقد",
     "عمل بعقد",
     "موظف متعاقد",
    ],
   },

   {
    name: "temporary",

    title_ar: "مؤقت",
    title_en: "Temporary",

    keyword: [
     "مؤقت",
     "لفترة محددة",
     "محدود المدة",
     "عمل مؤقت",
    ],
   },

   {
    name: "permanent",

    title_ar: "دائم",
    title_en: "Permanent",

    keyword: [
     "دائم",
     "وظيفة دائمة",
     "استقرار وظيفي",
     "عمل دائم",
    ],
   },

   {
    name: "internship",

    title_ar: "تدريب",
    title_en: "Internship",

    keyword: [
     "تدريب",
     "متدرب",
     "انترنشيب",
     "تدريب عملي",
     "تدريب مهني",
    ],
   },

   {
    name: "paid_internship",

    title_ar: "تدريب مدفوع",
    title_en: "Paid Internship",

    keyword: [
     "تدريب مدفوع",
     "تدريب باجر",
     "تدريب براتب",
     "متدرب مدفوع",
    ],
   },

   {
    name: "unpaid_internship",

    title_ar: "تدريب غير مدفوع",
    title_en: "Unpaid Internship",

    keyword: [
     "تدريب غير مدفوع",
     "تدريب مجاني",
     "بدون راتب",
     "متدرب بدون اجر",
    ],
   },

   {
    name: "freelance",

    title_ar: "عمل حر",
    title_en: "Freelance",

    keyword: [
     "عمل حر",
     "فريلانسر",
     "فريلانس",
     "مستقل",
     "مشاريع حرة",
    ],
   },

   {
    name: "project_based",

    title_ar: "حسب المشروع",
    title_en: "Project Based",

    keyword: [
     "حسب المشروع",
     "بالمشروع",
     "مشروع مؤقت",
     "عمل مشروع",
    ],
   },

   {
    name: "seasonal",

    title_ar: "موسمي",
    title_en: "Seasonal",

    keyword: [
     "موسمي",
     "عمل موسمي",
     "موسم",
     "وظيفة موسمية",
    ],
   },

   {
    name: "shift_based",

    title_ar: "ورديات",
    title_en: "Shift Based",

    keyword: [
     "ورديات",
     "شفتات",
     "نظام ورديات",
     "شيفتات",
    ],
   },

   {
    name: "weekend",

    title_ar: "عطلة نهاية الاسبوع",
    title_en: "Weekend",

    keyword: [
     "ويكند",
     "عطلة نهاية الاسبوع",
     "ايام العطل",
     "عمل ويكند",
    ],
   },

   {
    name: "night_shift",

    title_ar: "دوام ليلي",
    title_en: "Night Shift",

    keyword: [
     "ليلي",
     "دوام ليلي",
     "شفت ليلي",
     "مناوبة ليلية",
    ],
   },

   {
    name: "day_shift",

    title_ar: "دوام نهاري",
    title_en: "Day Shift",

    keyword: [
     "نهاري",
     "دوام نهاري",
     "صباحي",
     "دوام صباحي",
    ],
   },

   {
    name: "remote_contract",

    title_ar: "عقد عن بعد",
    title_en: "Remote Contract",

    keyword: [
     "عقد عن بعد",
     "ريموت بعقد",
     "عمل عن بعد بعقد",
    ],
   },

   {
    name: "commission_based",

    title_ar: "بالعمولة",
    title_en: "Commission Based",

    keyword: [
     "عمولة",
     "بالعمولة",
     "راتب عمولة",
     "نسبة مبيعات",
    ],
   },

   {
    name: "volunteer",

    title_ar: "تطوعي",
    title_en: "Volunteer",

    keyword: [
     "تطوعي",
     "متطوع",
     "بدون اجر",
     "عمل تطوعي",
    ],
   },

   {
    name: "apprenticeship",

    title_ar: "تلمذة مهنية",
    title_en: "Apprenticeship",

    keyword: [
     "تلمذة",
     "تدريب مهني",
     "تدريب حرفي",
     "متدرب مهني",
    ],
   },

   {
    name: "graduate_program",

    title_ar: "برنامج خريجين",
    title_en: "Graduate Program",

    keyword: [
     "برنامج خريجين",
     "حديث تخرج",
     "خريجين",
     "برنامج تدريبي للخريجين",
    ],
   },

   {
    name: "trainee",

    title_ar: "متدرب",
    title_en: "Trainee",

    keyword: [
     "متدرب",
     "تدريب",
     "تدريب عملي",
     "تطوير مهني",
    ],
   },

   {
    name: "probation",

    title_ar: "فترة تجربة",
    title_en: "Probation",

    keyword: [
     "تجربة",
     "فترة تجربة",
     "تحت التجربة",
     "اختبار وظيفي",
    ],
   },

   {
    name: "consultancy",

    title_ar: "استشاري",
    title_en: "Consultancy",

    keyword: [
     "استشاري",
     "استشارة",
     "خبير",
     "مستشار",
    ],
   },

   {
    name: "gig",

    title_ar: "مهمة قصيرة",
    title_en: "Gig",

    keyword: [
     "مهمة قصيرة",
     "مهمة مؤقتة",
     "عمل سريع",
     "جيج",
    ],
   },

   {
    name: "on_call",

    title_ar: "عند الطلب",
    title_en: "On Call",

    keyword: [
     "عند الطلب",
     "حسب الحاجة",
     "استدعاء",
     "متاح عند الطلب",
    ],
   },
  ];

  for (const jobType of jobTypes) {
   await JobTypeModel.updateOne(
    {
     name: jobType.name,
    },
    {
     $set: {
      name: jobType.name,

      title_ar: jobType.title_ar,
      title_en: jobType.title_en,
      keyword: jobType.keyword.map(normalizeArabicKeyword),
     },
    },
    {
     upsert: true,
    }
   );
  }

  console.log("✅ Job types seeded successfully");
 } catch (error) {
  console.error("❌ Job types seeder error:", error);
  throw error;
 }
};