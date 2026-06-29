import mongoose from "mongoose";
import "../config/loadEnv.js";
import { LearningResourceCategoryModel } from "../models/index.js";
import { DEFAULT_RESOURCE_CATEGORIES } from "../services/resources/learningResource.service.js";

const TITLES = {
  cv_writing: ["CV Writing", "كتابة السيرة الذاتية"],
  interview_preparation: ["Interview Preparation", "التحضير للمقابلات"],
  first_job: ["First Job", "الوظيفة الأولى"],
  internships: ["Internships", "التدريب العملي"],
  freelancing: ["Freelancing", "العمل الحر"],
  remote_work: ["Remote Work", "العمل عن بعد"],
  career_planning: ["Career Planning", "التخطيط المهني"],
  salary_negotiation: ["Salary Negotiation", "التفاوض على الراتب"],
  soft_skills: ["Soft Skills", "المهارات الشخصية"],
  workplace_basics: ["Workplace Basics", "أساسيات بيئة العمل"],
  major_to_career: ["Major to Career", "من التخصص إلى المسار المهني"],
  portfolio_projects: ["Portfolio Projects", "مشاريع معرض الأعمال"],
  linkedin_profile: ["LinkedIn Profile", "ملف لينكدإن"],
  job_search_strategy: ["Job Search Strategy", "استراتيجية البحث عن عمل"],
};

const slug = (key) => key.replaceAll("_", "-");

async function main() {
  if (!process.env.CONNECTION_URL) {
    throw new Error("CONNECTION_URL is required");
  }
  await mongoose.connect(process.env.CONNECTION_URL);

  let sortOrder = 10;
  for (const key of DEFAULT_RESOURCE_CATEGORIES) {
    const [en, ar] = TITLES[key] || [key.replaceAll("_", " "), key];
    await LearningResourceCategoryModel.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          slug: slug(key),
          title: { en, ar },
          description: { en: "", ar: "" },
          sort_order: sortOrder,
          status: "active",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    sortOrder += 10;
  }

  console.log(`Seeded ${DEFAULT_RESOURCE_CATEGORIES.length} learning resource categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
