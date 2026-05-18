import mongoose from "mongoose";
import dotenv from "dotenv";

// import { seedPermissions } from "./permissionSeeder.js";
import { seedRoles } from "./roleSeeder.js";
import { seedAdmins } from "./adminSeeder.js";
import { seedEmployees } from "./employeeSeed.js";
import { seedCountries } from "./citySeeder.js";
import { seedWorkModes } from "./workModeSeeder.js";
import { seedWorkTimeTypes } from "./seedWorkTimeTypes.js";
import { seedWorkLocationTypes } from "./seedWorkLocationTypes.js";
import { seedJobTypes } from "./seedJobTypes.js";
import { seedJobServices } from "./seedJobServices.js";
import { seedJobSalaries } from "./seedJobSalaries.js";
import { seedCurrencies } from "./seedCurrencies.js";
import { seedLanguages } from "./seedLanguages.js";
import { seedExperienceLevels } from "./seedExperienceLevels.js";
import { seedCvTemplates } from "./seedCvTemplates.js";
import { seedCompanies } from "./seedCompanies.js";
import { seedIndustries } from "./seedIndustries.js";
import { seedSkillsFromEsco } from "./seedSkills.js";
import { seedEducationLevels } from "./seedEducationLevels.js";
import { seedJobsAndApplications } from "./seedJobsAndApplications.js";

dotenv.config();

const seeders = {
  // permissions: seedPermissions,
  roles: seedRoles,
  admin: seedAdmins,
  employee:seedEmployees,
  city:seedCountries,
  workMode:seedWorkModes,
  workTime:seedWorkTimeTypes,
  workLocation:seedWorkLocationTypes,
  jobTypes:seedJobTypes,
  jobServices:seedJobServices,
  jobSalaries:seedJobSalaries,
  currencies:seedCurrencies,
  languages:seedLanguages,
  experienceLevels:seedExperienceLevels,
  cv:seedCvTemplates,
  company:seedCompanies,
  industries:seedIndustries,
  skills:seedSkillsFromEsco,
  educationLevel:seedEducationLevels,
  jobsAndApplications:seedJobsAndApplications
};

// ترتيب التشغيل
const executionOrder = [
  // "permissions",
  "roles",
  "admin",
  "employee",
  "city",
  "workMode",
  "workTime",
  "workLocation",
  "jobTypes",
  "jobServices",
  "jobSalaries",
  "currencies",
  "languages",
  "experienceLevels",
  "cv",
  "industries",
  "company",
  "skills",
  "educationLevel",
  "jobsAndApplications"

];

const run = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);

    console.log("✅ MongoDB connected");

    const arg = process.argv[2];

    // =========================
    // RUN ALL
    // =========================

    if (!arg || arg === "all") {
      for (const key of executionOrder) {
        console.log(`🚀 Running ${key} seeder...`);

        await seeders[key]();
      }

      console.log("🎉 All seeders completed");

      process.exit(0);
    }

    // =========================
    // RUN SINGLE SEEDER
    // =========================

    if (!seeders[arg]) {
      console.log("❌ Seeder not found");

      console.log("Available seeders:");

      Object.keys(seeders).forEach((key) => {
        console.log(`- ${key}`);
      });

      process.exit(1);
    }

    console.log(`🚀 Running ${arg} seeder...`);

    await seeders[arg]();

    console.log(`🎉 ${arg} seeder completed`);

    process.exit(0);

  } catch (error) {
    console.error("❌ Seeder error:", error);

    process.exit(1);
  }
};

run();