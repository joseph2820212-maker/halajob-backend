/**
 * Demo data seed for UI/UX review (NOT for production).
 *
 * Creates a clearly-labelled, loginable demo seeker + demo company plus a few
 * jobs / applications / an interview / a saved job / a support ticket, so every
 * authenticated screen fills with REAL API data during review. Everything is
 * tagged by the `@demo.halajob.local` email convention so `--teardown` can wipe
 * it cleanly (Mongoose strict mode drops arbitrary marker fields, so we key off
 * the email domain instead).
 *
 * Usage:
 *   CONNECTION_URL=<mongo-uri> npm run seed           # first: catalog lookups
 *   CONNECTION_URL=<mongo-uri> node scripts/seedDemoData.js            # add demo
 *   CONNECTION_URL=<mongo-uri> node scripts/seedDemoData.js --teardown # remove
 *
 * Login (web + APK): email-based, password `Demo@1234`. The login emails a
 * verification code, but this seed also pre-sets a known demo code so you do NOT
 * need to receive the email — enter the demo code at the passcode step. The code
 * is single-use; re-run this seed to refresh it before logging in again.
 *
 *   Seeker  : seeker@demo.halajob.local
 *   Company : company@demo.halajob.local
 *   Password: Demo@1234
 *   Passcode: 123456
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcryptjs from "bcrypt";
import {
  UserModel,
  RoleModel,
  EmployeeModel,
  CompanyModel,
  jobsModel,
  UserApplyingJobModel,
  InterviewModel,
  UserSavedJobModel,
  SupportTicketModel,
  WorkModeModel,
  JobTypeModel,
  WorkTimeTypeModel,
  JobSalaryModel,
  CurrencyModel,
  CountryModel,
} from "../models/index.js";
import {
  seedCampusDemoContent,
  teardownCampusDemoContent,
} from "./utils/campusDemoContentSeed.js";

dotenv.config();

const DEMO_DOMAIN = "demo.halajob.local";
const DEMO_PASSWORD = "Demo@1234";
const DEMO_PASSCODE = "123456";
const FAR_FUTURE = new Date("2035-01-01T00:00:00Z");
const CONNECTION_URL =
  process.env.CONNECTION_URL ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/halajob";

const isTeardown = process.argv.includes("--teardown");
const log = (...args) => console.log("[demo-seed]", ...args);

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

async function ensureRole(roleNumber, logTo, name, titleEn, titleAr) {
  return RoleModel.findOneAndUpdate(
    { role_number: roleNumber },
    {
      $setOnInsert: {
        role_number: roleNumber,
        log_to: logTo,
        name,
        title_en: titleEn,
        title_ar: titleAr,
        status: true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function requireLookups() {
  const [workMode, jobType, jobTime, jobSalary, currency, country] =
    await Promise.all([
      WorkModeModel.findOne().lean(),
      JobTypeModel.findOne().lean(),
      WorkTimeTypeModel.findOne().lean(),
      JobSalaryModel.findOne().lean(),
      CurrencyModel.findOne().lean(),
      CountryModel.findOne().lean(),
    ]);
  const missing = [];
  if (!workMode) missing.push("work_modes");
  if (!jobType) missing.push("job_type");
  if (!jobTime) missing.push("work_time");
  if (!jobSalary) missing.push("job_salary");
  if (!currency) missing.push("currencies");
  if (!country) missing.push("countries");
  if (missing.length) {
    throw new Error(
      `Missing catalog lookups: ${missing.join(", ")}. Run "npm run seed" first to create the catalogs, then re-run this script.`,
    );
  }
  return { workMode, jobType, jobTime, jobSalary, currency, country };
}

async function upsertLoginableUser({
  email,
  firstName,
  lastName,
  gender,
  roleId,
  phoneNational,
  phoneE164,
  passwordHash,
}) {
  return UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        first_name: firstName,
        last_name: lastName,
        gender,
        role_id: roleId,
        password: passwordHash,
        status: true,
        passcode_active: true,
        passcode: DEMO_PASSCODE,
        passcode_expires_at: FAR_FUTURE,
        phone_country: "SY",
        phone_code: "+963",
        phone_national: phoneNational,
        phone_e164: phoneE164,
        lan: "en",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function seed() {
  const [employeeRole, companyRole] = await Promise.all([
    ensureRole(4, "employee", "employee", "Employee", "موظف"),
    ensureRole(3, "company", "company", "Company", "شركة"),
  ]);
  const passwordHash = await bcryptjs.hash(DEMO_PASSWORD, 10);
  const { workMode, jobType, jobTime, jobSalary, currency, country } =
    await requireLookups();

  // Seeker account (+ employee record for app-account resolution).
  const seeker = await upsertLoginableUser({
    email: `seeker@${DEMO_DOMAIN}`,
    firstName: "Demo",
    lastName: "Seeker",
    gender: "female",
    roleId: employeeRole._id,
    phoneNational: "0900000001",
    phoneE164: "+963900000001",
    passwordHash,
  });
  await EmployeeModel.findOneAndUpdate(
    { user_id: seeker._id },
    { $setOnInsert: { user_id: seeker._id, role_id: employeeRole._id, status: true, accepted: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  // Company owner account + accepted, active company.
  const owner = await upsertLoginableUser({
    email: `company@${DEMO_DOMAIN}`,
    firstName: "Demo",
    lastName: "Recruiter",
    gender: "male",
    roleId: companyRole._id,
    phoneNational: "0900000002",
    phoneE164: "+963900000002",
    passwordHash,
  });
  const company = await CompanyModel.findOneAndUpdate(
    { company_email: `info@${DEMO_DOMAIN}` },
    {
      $set: {
        company_name: "DEMO — Hala Tech",
        company_email: `info@${DEMO_DOMAIN}`,
        owner_user_id: owner._id,
        role_id: companyRole._id,
        accepted: true,
        status: true,
        can_upload: true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  // A few published jobs owned by the demo company.
  const jobDefs = [
    {
      name: "DEMO — Junior Frontend Developer",
      desc: "Build and maintain Hala Job's seeker web experience using React and TypeScript. Great first role for a Syria-based graduate ready to grow.",
      min: 400,
      max: 800,
    },
    {
      name: "DEMO — Customer Support Specialist",
      desc: "Help Syrian job seekers and employers get the most out of Hala Job over chat and email. Strong Arabic and English communication required.",
      min: 300,
      max: 600,
    },
    {
      name: "DEMO — Marketing Intern",
      desc: "Support campus outreach and social campaigns for Hala Job across Syrian universities. A learning-focused internship with mentorship.",
      min: 150,
      max: 300,
    },
  ];

  const jobs = [];
  for (const def of jobDefs) {
    let job = await jobsModel.findOne({ job_name: def.name, company_id: company._id });
    if (!job) {
      job = new jobsModel({
        job_name: def.name,
        description: def.desc,
        work_mode_id: workMode._id,
        job_type_id: jobType._id,
        job_time_id: jobTime._id,
        job_salary_id: jobSalary._id,
        salary: {
          currency_id: currency._id,
          currency_code: String(currency.code || "USD").toUpperCase(),
          currency_rate_snapshot: 1,
          min: def.min,
          max: def.max,
          is_visible: true,
        },
        company_id: company._id,
        user_id: owner._id,
        // pre("validate") coerces is_accepted + status to true when published.
        publish_status: "published",
        started_date: new Date(),
      });
      await job.save();
    }
    jobs.push(job);
  }

  // Applications from the seeker to the first two jobs.
  const applications = [];
  for (let i = 0; i < Math.min(2, jobs.length); i += 1) {
    const job = jobs[i];
    const app = await UserApplyingJobModel.findOneAndUpdate(
      { user_id: seeker._id, job_id: job._id },
      {
        $setOnInsert: {
          user_id: seeker._id,
          job_id: job._id,
          company_id: company._id,
          first_name: "Demo",
          last_name: "Seeker",
          email: seeker.email,
          phone_code: "+963",
          phone_national: "0900000001",
          country_id: country._id,
          status: i === 0 ? "interview" : "reviewing",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    applications.push(app);
  }

  // One scheduled interview for the first application.
  if (applications[0]) {
    await InterviewModel.findOneAndUpdate(
      { application_id: applications[0]._id },
      {
        $setOnInsert: {
          application_id: applications[0]._id,
          job_id: jobs[0]._id,
          company_id: company._id,
          employee_user_id: seeker._id,
          start_at: addDays(2),
          type: "online",
          status: "scheduled",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  // A saved job (the third one) for the My Jobs / Saved view.
  if (jobs[2]) {
    await UserSavedJobModel.findOneAndUpdate(
      { user_id: seeker._id, job_id: jobs[2]._id },
      { $setOnInsert: { user_id: seeker._id, job_id: jobs[2]._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  // A support ticket for the user support queue.
  await SupportTicketModel.findOneAndUpdate(
    { requesterUserId: seeker._id, subject: "DEMO — How do I update my CV?" },
    {
      $setOnInsert: {
        ticketNo: `HS-DEMO-${Date.now().toString(36).toUpperCase()}`,
        requesterUserId: seeker._id,
        requesterRole: "seeker",
        requesterEmail: seeker.email,
        subject: "DEMO — How do I update my CV?",
        message: "This is a demo support ticket created for UI review.",
        status: "open",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const campusContent = await seedCampusDemoContent();

  log("Demo data seeded.");
  log(`  Seeker : seeker@${DEMO_DOMAIN}  / ${DEMO_PASSWORD}`);
  log(`  Company: company@${DEMO_DOMAIN} / ${DEMO_PASSWORD}`);
  log(`  Passcode (pre-set, single-use): ${DEMO_PASSCODE} — re-run this seed to refresh it.`);
  log(`  Jobs: ${jobs.length}, applications: ${applications.length}.`);
  log(
    `  Campus content: ${campusContent.key} (${campusContent.version}) seeded into backend DB.`,
  );
}

async function teardown() {
  const userDomain = new RegExp(`@${DEMO_DOMAIN.replace(/\./g, "\\.")}$`, "i");
  const [demoUsers, demoCompanies] = await Promise.all([
    UserModel.find({ email: userDomain }).select("_id").lean(),
    CompanyModel.find({ company_email: userDomain }).select("_id").lean(),
  ]);
  const userIds = demoUsers.map((u) => u._id);
  const companyIds = demoCompanies.map((c) => c._id);

  const removed = {};
  removed.interviews = (
    await InterviewModel.deleteMany({
      $or: [{ company_id: { $in: companyIds } }, { employee_user_id: { $in: userIds } }],
    })
  ).deletedCount;
  removed.applications = (
    await UserApplyingJobModel.deleteMany({
      $or: [{ company_id: { $in: companyIds } }, { user_id: { $in: userIds } }],
    })
  ).deletedCount;
  removed.saved = (await UserSavedJobModel.deleteMany({ user_id: { $in: userIds } })).deletedCount;
  removed.tickets = (
    await SupportTicketModel.deleteMany({ requesterUserId: { $in: userIds } })
  ).deletedCount;
  removed.jobs = (await jobsModel.deleteMany({ company_id: { $in: companyIds } })).deletedCount;
  removed.companies = (await CompanyModel.deleteMany({ _id: { $in: companyIds } })).deletedCount;
  removed.employees = (await EmployeeModel.deleteMany({ user_id: { $in: userIds } })).deletedCount;
  removed.users = (await UserModel.deleteMany({ _id: { $in: userIds } })).deletedCount;
  removed.campusContent = (await teardownCampusDemoContent()).deletedCount;

  log("Demo data removed:", JSON.stringify(removed));
}

(async () => {
  // Hard production guard: this seed creates loginable accounts with a
  // published password (`Demo@1234`) and a pre-set passcode valid until 2035.
  // It must never run against a production database. Seeding (not teardown)
  // is refused when NODE_ENV=production unless ALLOW_DEMO_SEED=true is set
  // explicitly by an operator who has accepted the risk.
  if (
    !isTeardown &&
    process.env.NODE_ENV === "production" &&
    String(process.env.ALLOW_DEMO_SEED).toLowerCase() !== "true"
  ) {
    console.error(
      "[demo-seed] refused: NODE_ENV=production. Demo accounts use a published password/passcode and must not exist in production. Set ALLOW_DEMO_SEED=true only if you accept this, or run with --teardown to remove demo data.",
    );
    process.exitCode = 1;
    return;
  }
  if (!process.env.CONNECTION_URL && !process.env.MONGODB_URI) {
    log("WARNING: CONNECTION_URL not set; falling back to local mongo at 127.0.0.1.");
  }
  await mongoose.connect(CONNECTION_URL);
  try {
    if (isTeardown) {
      await teardown();
    } else {
      await seed();
    }
  } finally {
    await mongoose.connection.close();
  }
})().catch((err) => {
  console.error("[demo-seed] failed:", err?.message || err);
  process.exitCode = 1;
});
