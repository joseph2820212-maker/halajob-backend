import bcrypt from "bcrypt";
import mongoose from "mongoose";

import {
  UserModel,
  RoleModel,
  EmployeeModel,
  SkillModel,
  LanguageModel,
  CountryModel,
  JobNameModel,
  JobTypeModel,
  WorkModeModel,
  EducationLevelModel,
} from "../models/index.js";

const employees = [
  {
    first_name: "Ahmad",
    mid_name: "Mohammed",
    last_name: "Saleh",
    email: "employee1@gmail.com",
    gender: "male",
    candidate_stage: "graduate",
    current_job_title: "Frontend Developer",
    profile_headline: "React & Next.js Frontend Developer",
    about_me:
      "Frontend developer with experience building scalable dashboards and admin systems.",
    is_student: false,
    graduation_year: 2022,
  },
  {
    first_name: "Sara",
    mid_name: "Ali",
    last_name: "Hamdan",
    email: "employee2@gmail.com",
    gender: "female",
    candidate_stage: "student",
    current_job_title: "UI UX Designer",
    profile_headline: "Creative UI UX Designer",
    about_me:
      "Passionate about mobile-first design systems and user experience.",
    is_student: true,
    graduation_year: 2026,
  },
  {
    first_name: "Omar",
    mid_name: "Khaled",
    last_name: "Darwish",
    email: "employee3@gmail.com",
    gender: "male",
    candidate_stage: "graduate",
    current_job_title: "Backend Developer",
    profile_headline: "Node.js Backend Engineer",
    about_me:
      "Backend engineer specialized in Express.js, MongoDB, and scalable APIs.",
    is_student: false,
    graduation_year: 2021,
  },
  {
    first_name: "Lina",
    mid_name: "Maher",
    last_name: "Nasser",
    email: "employee4@gmail.com",
    gender: "female",
    candidate_stage: "student",
    current_job_title: "Mobile Developer",
    profile_headline: "Flutter Mobile Developer",
    about_me:
      "Flutter developer building production-ready mobile applications.",
    is_student: true,
    graduation_year: 2025,
  },
  {
    first_name: "Yousef",
    mid_name: "Fadi",
    last_name: "Qassem",
    email: "employee5@gmail.com",
    gender: "male",
    candidate_stage: "graduate",
    current_job_title: "DevOps Engineer",
    profile_headline: "Cloud & DevOps Engineer",
    about_me:
      "Experienced in Docker, CI/CD pipelines, and cloud deployments.",
    is_student: false,
    graduation_year: 2020,
  },
  {
    first_name: "Maya",
    mid_name: "Samer",
    last_name: "Khatib",
    email: "employee6@gmail.com",
    gender: "female",
    candidate_stage: "graduate",
    current_job_title: "QA Engineer",
    profile_headline: "Software QA Specialist",
    about_me:
      "Focused on automation testing and software quality assurance.",
    is_student: false,
    graduation_year: 2021,
  },
  {
    first_name: "Kareem",
    mid_name: "Hassan",
    last_name: "Jamal",
    email: "employee7@gmail.com",
    gender: "male",
    candidate_stage: "student",
    current_job_title: "Data Analyst",
    profile_headline: "Junior Data Analyst",
    about_me:
      "Interested in BI dashboards, SQL analytics, and reporting.",
    is_student: true,
    graduation_year: 2026,
  },
  {
    first_name: "Rama",
    mid_name: "Adnan",
    last_name: "Shami",
    email: "employee8@gmail.com",
    gender: "female",
    candidate_stage: "graduate",
    current_job_title: "Project Coordinator",
    profile_headline: "IT Project Coordinator",
    about_me:
      "Experienced in coordinating agile software teams and workflows.",
    is_student: false,
    graduation_year: 2019,
  },
  {
    first_name: "Tariq",
    mid_name: "Ziad",
    last_name: "Mansour",
    email: "employee9@gmail.com",
    gender: "male",
    candidate_stage: "graduate",
    current_job_title: "Cyber Security Analyst",
    profile_headline: "Cyber Security Specialist",
    about_me:
      "Focused on penetration testing and security monitoring.",
    is_student: false,
    graduation_year: 2020,
  },
  {
    first_name: "Noor",
    mid_name: "Rami",
    last_name: "Haddad",
    email: "employee10@gmail.com",
    gender: "female",
    candidate_stage: "student",
    current_job_title: "AI Engineer",
    profile_headline: "Machine Learning Engineer",
    about_me:
      "Working on AI systems, deep learning, and NLP solutions.",
    is_student: true,
    graduation_year: 2027,
  },
];

const PASSWORD = process.env.SEED_EMPLOYEE_PASSWORD;

const randomItem = (arr = []) =>
  arr[Math.floor(Math.random() * arr.length)] || null;

const asArray = (value) => (Array.isArray(value) ? value : []);

const randomItems = (arr = [], count = 2) => {
  const safeArray = asArray(arr).filter((item) => item?._id);
  const shuffled = [...safeArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((item) => item._id);
};

export const seedEmployees = async () => {
  if (!PASSWORD) {
    console.log("Employee seeding skipped. Set SEED_EMPLOYEE_PASSWORD to create demo employees.");
    return;
  }

  const employeeRole = await RoleModel.findOne({ log_to: "employee" });

  if (!employeeRole) {
    throw new Error("employee role not found. Please run roles seeder first.");
  }

  const [
    skills,
    languages,
    countries,
    jobNames,
    jobTypes,
    workModes,
    educationLevels,
  ] = await Promise.all([
    SkillModel.find().limit(20),
    LanguageModel.find().limit(20),
    CountryModel.find().limit(20),
    JobNameModel.find().limit(20),
    JobTypeModel.find().limit(20),
    WorkModeModel.find().limit(20),
    EducationLevelModel.find().limit(20),
  ]);

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (let index = 0; index < employees.length; index++) {
    const employee = employees[index];

    const phoneNational = `999888${String(index).padStart(4, "0")}`;
    const phoneCode = "+963";
    const phoneE164 = `${phoneCode}${phoneNational}`;

    const user = await UserModel.findOneAndUpdate(
      { email: employee.email },
      {
        $set: {
          first_name: employee.first_name,
          mid_name: employee.mid_name,
          last_name: employee.last_name,
          email: employee.email,
          gender: employee.gender,
          phone_country: "SY",
          phone_code: phoneCode,
          phone: phoneE164,
          phone_e164: phoneE164,
          phone_national: phoneNational,
          lan: "en",
          status: true,
          permissions: [],
          device: [],
          password: hashedPassword,
          role_id: employeeRole._id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    await EmployeeModel.findOneAndUpdate(
      { user_id: user._id },
      {
        $set: {
          role_id: employeeRole._id,
          user_id: user._id,

          profile_headline: employee.profile_headline,
          current_job_title: employee.current_job_title,
          about_me: employee.about_me,

          candidate_stage: employee.candidate_stage,
          is_student: employee.is_student,
          graduation_year: employee.graduation_year,

          accepted: true,
          status: true,
          is_free_for_work: Math.random() > 0.5,
          is_can_move: Math.random() > 0.5,

          profile_completion: 85,

          min_salary: {
            currency: "USD",
            amount: 500 + index * 100,
          },

          experience: [
            {
              company_name: "Tech Company",
              position: employee.current_job_title,
              start_date: new Date("2022-01-01"),
              end_date: new Date("2024-01-01"),
              is_until_now: false,
              details: "Worked on enterprise projects and production systems.",
            },
          ],

          education: [
            {
              education_level_id: randomItem(educationLevels)?._id || null,
              level: "Bachelor",
              study: "Computer Science",
              institution: "Damascus University",
              start_date: new Date("2018-01-01"),
              end_date: new Date("2022-01-01"),
              is_until_now: false,
            },
          ],

          skills: randomItems(skills, 4),
          languages: randomItems(languages, 2),
          job_names: randomItems(jobNames, 2),
          job_types: randomItems(jobTypes, 2),
          preferred_work_modes: randomItems(workModes, 2),
          preferred_countries: randomItems(countries, 3),

          licenses: [
            {
              title: "AWS Cloud Practitioner",
              issue_date: new Date("2023-01-01"),
              expiration_date: null,
              issuer: "Amazon",
            },
          ],

          testimony: [
            {
              name: "Mohammed Ali",
              job_title: "Team Lead",
              company_name: "Tech Company",
              phone: "+963999999999",
              email: "reference@gmail.com",
            },
          ],

          links: [
            {
              title: "LinkedIn",
              url: "https://linkedin.com",
            },
            {
              title: "Github",
              url: "https://github.com",
            },
          ],
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`Seeded employee: ${employee.email}`);
  }

  console.log("Employees seeded successfully");
};

export default seedEmployees;

