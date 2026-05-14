import dotenv from "dotenv";
import { JobSalaryModel } from "../models/index.js";
import normalizeArabicKeyword from "../helper/normalizeArabicKeyword.js";

dotenv.config();

export const seedJobSalaries = async () => {
  try {
    const jobSalaries = [
      {
        name: "monthly_salary",
        title_ar: "راتب شهري",
        title_en: "Monthly Salary",
        keyword: ["راتب شهري", "شهري", "راتب ثابت", "اجر شهري"],
      },
      {
        name: "hourly_wage",
        title_ar: "أجر بالساعة",
        title_en: "Hourly Wage",
        keyword: ["اجر بالساعه", "بالساعه", "ساعة عمل", "اجر ساعي"],
      },
      {
        name: "daily_wage",
        title_ar: "أجر يومي",
        title_en: "Daily Wage",
        keyword: ["اجر يومي", "يومي", "مياومه", "بالنهار"],
      },
      {
        name: "weekly_salary",
        title_ar: "راتب أسبوعي",
        title_en: "Weekly Salary",
        keyword: ["راتب اسبوعي", "اسبوعي", "اجر اسبوعي"],
      },
      {
        name: "biweekly_salary",
        title_ar: "راتب كل أسبوعين",
        title_en: "Biweekly Salary",
        keyword: ["راتب كل اسبوعين", "كل اسبوعين", "نصف شهري"],
      },
      {
        name: "annual_salary",
        title_ar: "راتب سنوي",
        title_en: "Annual Salary",
        keyword: ["راتب سنوي", "سنوي", "اجر سنوي", "الحزمة السنويه"],
      },

      {
        name: "fixed_salary",
        title_ar: "راتب ثابت",
        title_en: "Fixed Salary",
        keyword: ["راتب ثابت", "دخل ثابت", "اجر ثابت"],
      },
      {
        name: "salary_range",
        title_ar: "نطاق راتب",
        title_en: "Salary Range",
        keyword: ["نطاق راتب", "من الى", "رينج راتب", "حد ادنى وحد اقصى"],
      },
      {
        name: "negotiable_salary",
        title_ar: "راتب قابل للتفاوض",
        title_en: "Negotiable Salary",
        keyword: ["قابل للتفاوض", "حسب الخبره", "حسب الاتفاق", "راتب تفاوضي"],
      },
      {
        name: "undisclosed_salary",
        title_ar: "راتب غير معلن",
        title_en: "Undisclosed Salary",
        keyword: ["غير معلن", "غير محدد", "لا يذكر الراتب", "حسب المقابله"],
      },

      {
        name: "commission_based",
        title_ar: "بالعمولة",
        title_en: "Commission Based",
        keyword: ["عموله", "بالعموله", "نسبه مبيعات", "حوافز مبيعات"],
      },
      {
        name: "base_plus_commission",
        title_ar: "راتب أساسي مع عمولة",
        title_en: "Base Salary Plus Commission",
        keyword: ["راتب مع عموله", "اساسي مع عموله", "راتب ونسبه", "راتب وحوافز"],
      },
      {
        name: "performance_based",
        title_ar: "حسب الأداء",
        title_en: "Performance Based",
        keyword: ["حسب الاداء", "راتب حسب الاداء", "حوافز اداء", "انتاجيه"],
      },
      {
        name: "piece_rate",
        title_ar: "حسب القطعة",
        title_en: "Piece Rate",
        keyword: ["حسب القطعه", "بالقطعه", "لكل قطعه", "انتاج بالقطعه"],
      },
      {
        name: "project_based",
        title_ar: "حسب المشروع",
        title_en: "Project Based",
        keyword: ["حسب المشروع", "بالمشروع", "اجر مشروع", "دفعة مشروع"],
      },
      {
        name: "task_based",
        title_ar: "حسب المهمة",
        title_en: "Task Based",
        keyword: ["حسب المهمه", "بالمهمه", "لكل مهمه", "اجر مهمه"],
      },

      {
        name: "stipend",
        title_ar: "مكافأة تدريبية",
        title_en: "Stipend",
        keyword: ["مكافاه تدريبيه", "بدل تدريب", "مكافاه متدرب", "ستايبند"],
      },
      {
        name: "allowance_only",
        title_ar: "بدلات فقط",
        title_en: "Allowance Only",
        keyword: ["بدلات فقط", "بدون راتب", "بدل مواصلات", "بدل طعام"],
      },
      {
        name: "unpaid",
        title_ar: "غير مدفوع",
        title_en: "Unpaid",
        keyword: ["غير مدفوع", "بدون راتب", "تطوعي", "مجاني"],
      },

      {
        name: "equity_based",
        title_ar: "مقابل أسهم",
        title_en: "Equity Based",
        keyword: ["اسهم", "مقابل اسهم", "حصة", "شريك بالاسهم"],
      },
      {
        name: "profit_sharing",
        title_ar: "مشاركة أرباح",
        title_en: "Profit Sharing",
        keyword: ["مشاركه ارباح", "نسبه ارباح", "حصة من الارباح"],
      },
      {
        name: "bonus_based",
        title_ar: "يعتمد على المكافآت",
        title_en: "Bonus Based",
        keyword: ["مكافات", "بونص", "حوافز", "مكافاه سنويه"],
      },

      {
        name: "gross_salary",
        title_ar: "راتب إجمالي",
        title_en: "Gross Salary",
        keyword: ["راتب اجمالي", "قبل الضريبه", "قبل الاقتطاعات", "جروس"],
      },
      {
        name: "net_salary",
        title_ar: "راتب صافي",
        title_en: "Net Salary",
        keyword: ["راتب صافي", "بعد الضريبه", "بعد الاقتطاعات", "نت"],
      },
      {
        name: "ctc",
        title_ar: "تكلفة الشركة للموظف",
        title_en: "Cost to Company",
        keyword: ["تكلفه الشركه", "حزمة الراتب", "ctc", "اجمالي التكلفه"],
      },
    ];

    for (const jobSalary of jobSalaries) {
      await JobSalaryModel.updateOne(
        { name: jobSalary.name },
        {
          $set: {
            name: jobSalary.name,
            title_ar: jobSalary.title_ar,
            title_en: jobSalary.title_en,
            keyword: jobSalary.keyword.map(normalizeArabicKeyword),
          },
        },
        { upsert: true }
      );
    }

    console.log("✅ Job salaries seeded successfully");
  } catch (error) {
    console.error("❌ Job salaries seeder error:", error);
    throw error;
  }
};