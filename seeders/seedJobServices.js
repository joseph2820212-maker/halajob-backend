import dotenv from "dotenv";
import { JobServiceModel } from "../models/index.js";
import normalizeArabicKeyword from "../helper/normalizeArabicKeyword.js";

dotenv.config();

export const seedJobServices = async () => {
  try {
    const jobServices = [
      {
        name: "health_insurance",
        title_ar: "تامين صحي",
        title_en: "Health Insurance",
        keyword: ["تامين صحي", "تأمين طبي", "رعاية صحية", "تغطية صحية"],
      },
      {
        name: "life_insurance",
        title_ar: "تامين حياة",
        title_en: "Life Insurance",
        keyword: ["تامين حياة", "تأمين على الحياة", "تعويض وفاة"],
      },
      {
        name: "social_security",
        title_ar: "تأمينات اجتماعية",
        title_en: "Social Security",
        keyword: ["تأمينات اجتماعية", "ضمان اجتماعي", "تسجيل بالتامينات"],
      },
      {
        name: "paid_leave",
        title_ar: "اجازات مدفوعة",
        title_en: "Paid Leave",
        keyword: ["اجازات مدفوعة", "اجازة سنوية", "عطل مدفوعة", "راحة مدفوعة"],
      },
      {
        name: "sick_leave",
        title_ar: "اجازة مرضية",
        title_en: "Sick Leave",
        keyword: ["اجازة مرضية", "مرضية", "اجازات صحية"],
      },
      {
        name: "maternity_leave",
        title_ar: "اجازة امومة",
        title_en: "Maternity Leave",
        keyword: ["اجازة امومة", "امومة", "ولادة"],
      },
      {
        name: "paternity_leave",
        title_ar: "اجازة ابوة",
        title_en: "Paternity Leave",
        keyword: ["اجازة ابوة", "ابوة", "اجازة مولود"],
      },
      {
        name: "annual_bonus",
        title_ar: "مكافاة سنوية",
        title_en: "Annual Bonus",
        keyword: ["مكافاة سنوية", "بونص سنوي", "حافز سنوي"],
      },
      {
        name: "performance_bonus",
        title_ar: "مكافاة اداء",
        title_en: "Performance Bonus",
        keyword: ["مكافاة اداء", "حافز اداء", "بونص اداء"],
      },
      {
        name: "commission",
        title_ar: "عمولات",
        title_en: "Commission",
        keyword: ["عمولة", "عمولات", "نسبة مبيعات", "حوافز مبيعات"],
      },
      {
        name: "profit_sharing",
        title_ar: "مشاركة ارباح",
        title_en: "Profit Sharing",
        keyword: ["مشاركة ارباح", "نسبة من الارباح", "ارباح الشركة"],
      },
      {
        name: "stock_options",
        title_ar: "اسهم او خيارات اسهم",
        title_en: "Stock Options",
        keyword: ["اسهم", "خيارات اسهم", "حصة بالشركة", "ملكية موظفين"],
      },
      {
        name: "retirement_plan",
        title_ar: "خطة تقاعد",
        title_en: "Retirement Plan",
        keyword: ["تقاعد", "خطة تقاعد", "صندوق تقاعد", "معاش"],
      },
      {
        name: "transportation_allowance",
        title_ar: "بدل مواصلات",
        title_en: "Transportation Allowance",
        keyword: ["بدل مواصلات", "مواصلات", "تنقل", "اجرة طريق"],
      },
      {
        name: "company_transport",
        title_ar: "مواصلات الشركة",
        title_en: "Company Transportation",
        keyword: ["مواصلات الشركة", "باص الشركة", "نقل موظفين"],
      },
      {
        name: "fuel_allowance",
        title_ar: "بدل وقود",
        title_en: "Fuel Allowance",
        keyword: ["بدل وقود", "بنزين", "محروقات", "وقود"],
      },
      {
        name: "company_car",
        title_ar: "سيارة شركة",
        title_en: "Company Car",
        keyword: ["سيارة شركة", "سيارة عمل", "مركبة شركة"],
      },
      {
        name: "housing_allowance",
        title_ar: "بدل سكن",
        title_en: "Housing Allowance",
        keyword: ["بدل سكن", "سكن", "مساعدة سكن", "ايجار"],
      },
      {
        name: "company_housing",
        title_ar: "سكن مقدم من الشركة",
        title_en: "Company Housing",
        keyword: ["سكن شركة", "سكن مقدم", "اقامة", "سكن موظفين"],
      },
      {
        name: "meal_allowance",
        title_ar: "بدل طعام",
        title_en: "Meal Allowance",
        keyword: ["بدل طعام", "وجبات", "اكل", "غداء"],
      },
      {
        name: "free_meals",
        title_ar: "وجبات مجانية",
        title_en: "Free Meals",
        keyword: ["وجبات مجانية", "طعام مجاني", "غداء مجاني", "اكل مجاني"],
      },
      {
        name: "mobile_allowance",
        title_ar: "بدل هاتف",
        title_en: "Mobile Allowance",
        keyword: ["بدل هاتف", "موبايل", "جوال", "اتصالات"],
      },
      {
        name: "internet_allowance",
        title_ar: "بدل انترنت",
        title_en: "Internet Allowance",
        keyword: ["بدل انترنت", "انترنت", "اشتراك انترنت"],
      },
      {
        name: "equipment_provided",
        title_ar: "معدات عمل مقدمة",
        title_en: "Equipment Provided",
        keyword: ["معدات عمل", "تجهيزات", "لابتوب", "ادوات عمل"],
      },
      {
        name: "company_laptop",
        title_ar: "لابتوب شركة",
        title_en: "Company Laptop",
        keyword: ["لابتوب", "حاسوب", "كمبيوتر شركة", "جهاز عمل"],
      },
      {
        name: "training_programs",
        title_ar: "برامج تدريب",
        title_en: "Training Programs",
        keyword: ["تدريب", "دورات", "تطوير مهني", "برامج تدريب"],
      },
      {
        name: "certification_support",
        title_ar: "دعم الشهادات المهنية",
        title_en: "Certification Support",
        keyword: ["شهادات مهنية", "دعم شهادات", "تكلفة شهادة", "امتحانات مهنية"],
      },
      {
        name: "education_allowance",
        title_ar: "بدل تعليم",
        title_en: "Education Allowance",
        keyword: ["بدل تعليم", "تعليم", "دراسة", "رسوم تعليم"],
      },
      {
        name: "career_growth",
        title_ar: "فرص تطور وظيفي",
        title_en: "Career Growth",
        keyword: ["تطور وظيفي", "ترقية", "مسار مهني", "نمو مهني"],
      },
      {
        name: "mentorship",
        title_ar: "ارشاد مهني",
        title_en: "Mentorship",
        keyword: ["ارشاد", "منتور", "توجيه مهني", "مرشد"],
      },
      {
        name: "flexible_hours",
        title_ar: "ساعات عمل مرنة",
        title_en: "Flexible Hours",
        keyword: ["ساعات مرنة", "دوام مرن", "مرونة بالدوام"],
      },
      {
        name: "remote_work",
        title_ar: "امكانية العمل عن بعد",
        title_en: "Remote Work",
        keyword: ["عمل عن بعد", "ريموت", "من المنزل", "اونلاين"],
      },
      {
        name: "hybrid_work",
        title_ar: "نظام عمل هجين",
        title_en: "Hybrid Work",
        keyword: ["هجين", "مختلط", "عن بعد وحضوري", "دوام هجين"],
      },
      {
        name: "four_day_work_week",
        title_ar: "اربعة ايام عمل اسبوعيا",
        title_en: "Four-Day Work Week",
        keyword: ["اربعة ايام", "اسبوع عمل قصير", "دوام 4 ايام"],
      },
      {
        name: "overtime_pay",
        title_ar: "بدل ساعات اضافية",
        title_en: "Overtime Pay",
        keyword: ["ساعات اضافية", "بدل اضافي", "اوفر تايم"],
      },
      {
        name: "night_shift_allowance",
        title_ar: "بدل دوام ليلي",
        title_en: "Night Shift Allowance",
        keyword: ["بدل ليلي", "دوام ليلي", "شفت ليلي"],
      },
      {
        name: "relocation_support",
        title_ar: "دعم الانتقال",
        title_en: "Relocation Support",
        keyword: ["دعم انتقال", "نقل سكن", "انتقال لمدينة", "مصاريف انتقال"],
      },
      {
        name: "visa_sponsorship",
        title_ar: "رعاية فيزا",
        title_en: "Visa Sponsorship",
        keyword: ["فيزا", "رعاية فيزا", "تصريح عمل", "اقامة عمل"],
      },
      {
        name: "work_permit_support",
        title_ar: "دعم تصريح العمل",
        title_en: "Work Permit Support",
        keyword: ["تصريح عمل", "اذن عمل", "اقامة", "اوراق عمل"],
      },
      {
        name: "gym_membership",
        title_ar: "اشتراك نادي رياضي",
        title_en: "Gym Membership",
        keyword: ["نادي رياضي", "جيم", "رياضة", "اشتراك رياضي"],
      },
      {
        name: "wellness_program",
        title_ar: "برنامج رفاهية الموظفين",
        title_en: "Wellness Program",
        keyword: ["رفاهية", "صحة نفسية", "عافية", "برنامج رفاهية"],
      },
      {
        name: "mental_health_support",
        title_ar: "دعم الصحة النفسية",
        title_en: "Mental Health Support",
        keyword: ["صحة نفسية", "دعم نفسي", "استشارات نفسية"],
      },
      {
        name: "childcare_support",
        title_ar: "دعم رعاية الاطفال",
        title_en: "Childcare Support",
        keyword: ["رعاية اطفال", "حضانة", "اطفال", "بدل حضانة"],
      },
      {
        name: "family_insurance",
        title_ar: "تامين للعائلة",
        title_en: "Family Insurance",
        keyword: ["تامين عائلي", "تامين للعائلة", "تغطية عائلية"],
      },
      {
        name: "employee_discounts",
        title_ar: "خصومات للموظفين",
        title_en: "Employee Discounts",
        keyword: ["خصومات", "عروض موظفين", "حسم موظفين"],
      },
      {
        name: "company_events",
        title_ar: "فعاليات الشركة",
        title_en: "Company Events",
        keyword: ["فعاليات", "انشطة الشركة", "رحلات", "مناسبات"],
      },
      {
        name: "paid_training",
        title_ar: "تدريب مدفوع",
        title_en: "Paid Training",
        keyword: ["تدريب مدفوع", "تدريب براتب", "دورات مدفوعة"],
      },
      {
        name: "uniform_provided",
        title_ar: "لباس عمل مقدم",
        title_en: "Uniform Provided",
        keyword: ["لباس عمل", "يونيفورم", "زي رسمي", "ملابس عمل"],
      },
      {
        name: "safety_equipment",
        title_ar: "معدات سلامة",
        title_en: "Safety Equipment",
        keyword: ["معدات سلامة", "خوذة", "حماية", "ادوات سلامة"],
      },
      {
        name: "parking",
        title_ar: "موقف سيارات",
        title_en: "Parking",
        keyword: ["موقف سيارات", "باركينغ", "ركن سيارة"],
      },
      {
        name: "paid_holidays",
        title_ar: "عطل رسمية مدفوعة",
        title_en: "Paid Holidays",
        keyword: ["عطل رسمية", "اجازات رسمية", "عطل مدفوعة"],
      },
      {
        name: "end_of_service_benefits",
        title_ar: "مكافاة نهاية الخدمة",
        title_en: "End of Service Benefits",
        keyword: ["نهاية الخدمة", "مكافاة نهاية الخدمة", "تعويض نهاية خدمة"],
      },
    ];

    for (const jobService of jobServices) {
      await JobServiceModel.updateOne(
        { name: jobService.name },
        {
          $set: {
            name: jobService.name,
            title_ar: normalizeArabicKeyword(jobService.title_ar),
            title_en: jobService.title_en,
            keyword: jobService.keyword.map(normalizeArabicKeyword),
          },
        },
        { upsert: true }
      );
    }

    console.log("✅ Job services seeded successfully");
  } catch (error) {
    console.error("❌ Job services seeder error:", error);
    throw error;
  }
};