import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const exists = (relativePath) => existsSync(join(root, relativePath));

const packageJson = JSON.parse(read("package.json"));
const packageScripts = packageJson.scripts || {};

const requiredDocs = [
  {
    path: "docs/CV_STUDIO.md",
    minLength: 700,
    needles: [
      "EmployeeCvModel",
      "CvTemplateModel",
      "ResumeModel",
      "UserResumeModel",
      "npm run test:integration:cv-studio",
    ],
  },
  {
    path: "docs/CV_PARSING.md",
    minLength: 650,
    needles: [
      "CvParseJobModel",
      "provider",
      "fails honestly",
      "npm run test:integration:cv-parsing",
    ],
  },
  {
    path: "docs/RESOURCE_LIBRARY.md",
    minLength: 750,
    needles: [
      "LearningResourceModel",
      "UniversityResourceAssignmentModel",
      "/dash/v1/learning-resources",
      "/dash/v1/resources",
      "npm run test:integration:learning-resources",
    ],
  },
  {
    path: "docs/INTERVIEW_PREP.md",
    minLength: 650,
    needles: [
      "not an AI dependency",
      "InterviewPrepQuestionModel",
      "job-specific prep",
      "npm run test:integration:interview-prep",
    ],
  },
  {
    path: "docs/SAVED_SEARCHES_JOB_ALERTS.md",
    minLength: 750,
    needles: [
      "SavedSearchModel",
      "JobAlertLogModel",
      "migrateEmployeeJobAlertsToSavedSearches",
      "npm run scheduled:saved-search-alerts",
      "npm run test:integration:saved-search-alerts",
    ],
  },
  {
    path: "docs/COMMUNICATION_HUB_SYRIA.md",
    minLength: 850,
    needles: [
      "manual WhatsApp",
      "Official WhatsApp Business API sending is not required",
      "SMS",
      "delivery logs",
      "npm run test:integration:communication-hub",
    ],
  },
  {
    path: "docs/SALARY_INSIGHTS.md",
    minLength: 750,
    needles: [
      "JobModel.salary",
      "JobSalaryModel",
      "visible salary",
      "confidence",
      "npm run test:integration:salary-insights",
    ],
  },
  {
    path: "docs/CAMPUS_CAREER_CENTER.md",
    minLength: 850,
    needles: [
      "Companies cannot browse all students",
      "active university partnership",
      "opt into partner-company talent visibility",
      "UniversityModel",
      "npm run test:integration:campus-privacy",
    ],
  },
  {
    path: "docs/INTERVIEW_SCHEDULING.md",
    minLength: 650,
    needles: [
      "InterviewModel",
      "VideoInterviewModel",
      "candidate response",
      "npm run test:integration:interview-scheduling",
    ],
  },
  {
    path: "docs/COMPANY_TALENT_POOL.md",
    minLength: 750,
    needles: [
      "CompanySavedCandidateModel",
      "CompanyCandidateNoteModel",
      "same company",
      "do-not-contact",
      "npm run test:integration:talent-pool-crm",
    ],
  },
  {
    path: "docs/EMPLOYER_BRANDING.md",
    minLength: 750,
    needles: [
      "CompanyModel",
      "Do not create a second company profile system",
      "public_profile",
      "npm run test:integration:company-branding",
    ],
  },
  {
    path: "docs/PLATFORM_SETTINGS.md",
    minLength: 1200,
    needles: [
      "FEATURE_AI_TOOLS_ENABLED=false",
      "settings.view",
      "settings.manage",
      "dashboard.view",
      "Manual WhatsApp",
    ],
  },
  {
    path: "docs/SYRIA_LAUNCH_PRODUCT_QA.md",
    minLength: 1500,
    needles: [
      "npm run test:launch-gate",
      "npm run test:launch-gate:backend",
      "npm run test:launch-gate:ui-contracts",
      "Mobile:",
      "Known Owner-Side Checks",
    ],
  },
  {
    path: "docs/OPERATOR_GUIDE.md",
    minLength: 1200,
    needles: [
      "Publish Resources",
      "Approve Company Public Profiles",
      "Manage CV And Message Templates",
      "communication logs",
      "Manual WhatsApp",
      "Rebuild Salary Insights",
      "Manage Campus Partnerships",
      "Moderate Support, Legal, And Trust",
    ],
  },
];

const readme = read("README.md");
for (const doc of requiredDocs) {
  assert.ok(exists(doc.path), `${doc.path} is missing.`);
  const source = read(doc.path);
  assert.ok(
    source.trimStart().startsWith("# "),
    `${doc.path} must start with a top-level title.`,
  );
  assert.ok(
    source.length >= doc.minLength,
    `${doc.path} looks too thin for launch handover (${source.length} chars).`,
  );
  for (const needle of doc.needles) {
    assert.ok(source.includes(needle), `${doc.path} is missing ${needle}.`);
  }
  assert.ok(readme.includes(doc.path), `README.md must link ${doc.path}.`);
}

for (const doc of requiredDocs.filter((item) => item.path !== "docs/OPERATOR_GUIDE.md")) {
  const source = read(doc.path);
  const commands = [...source.matchAll(/\bnpm run ([a-z0-9:_-]+)/gi)].map(
    (match) => match[1],
  );
  for (const command of commands) {
    assert.ok(
      packageScripts[command],
      `${doc.path} references missing package script ${command}.`,
    );
  }
}

const envExample = read(".env.example");
const environmentDoc = read("docs/ENVIRONMENT.md");
const requiredEnvLines = [
  "FEATURE_AI_TOOLS_ENABLED=false",
  "FEATURE_CV_PARSING_ENABLED=true",
  "FEATURE_RESOURCE_LIBRARY_ENABLED=true",
  "FEATURE_SALARY_INSIGHTS_ENABLED=true",
  "FEATURE_MANUAL_WHATSAPP_SHARE_ENABLED=true",
  "FEATURE_OFFICIAL_WHATSAPP_PROVIDER_ENABLED=false",
  "CV_PARSER_PROVIDER=manual",
  "CV_PARSER_API_KEY=",
  "CV_PARSER_API_URL=",
  "CV_PARSE_JOB_TTL_DAYS=30",
  "SMS_PROVIDER=disabled",
  "SMS_API_KEY=",
  "SMS_API_URL=",
  "SMS_SENDER_ID=HalaJob",
  "COMMUNICATION_LOG_RETENTION_DAYS=180",
  "WHATSAPP_BUSINESS_ENABLED=false",
  "OFFICIAL_WHATSAPP_ENABLED=false",
  "SALARY_INSIGHTS_MIN_SAMPLE_SIZE=3",
  "SALARY_INSIGHTS_CACHE_TTL_SECONDS=3600",
  "SALARY_INSIGHTS_DEFAULT_CURRENCY=SYP",
  "PUBLIC_COMPANY_PROFILE_BASE_URL=",
  "PUBLIC_CV_SHARE_BASE_URL=",
];

for (const line of requiredEnvLines) {
  assert.ok(envExample.includes(line), `.env.example is missing ${line}.`);
  const name = line.split("=")[0];
  assert.ok(
    environmentDoc.includes(`\`${name}\``),
    `docs/ENVIRONMENT.md is missing ${name}.`,
  );
}

const qaDoc = read("docs/SYRIA_LAUNCH_PRODUCT_QA.md");
[
  "Production secret rotation",
  "Live SMTP, push, storage, hosting, and domain smoke tests",
  "Production Android signing and device QA",
  "Online payments remain blocked until the owner chooses a payment provider",
  "AI provider credentials, pricing, and live output QA",
  "CV parser adapter and live parser proof if auto-fill is desired",
  "Owner real-device UI approval from a final APK/AAB",
].forEach((blocker) => {
  assert.ok(
    qaDoc.includes(blocker),
    `Syria launch QA doc must keep owner-side blocker: ${blocker}.`,
  );
});

const readinessReport = read("docs/HALAJOB_9_5_FINAL_COMPLETION_REPORT.md");
[
  ["AI provider", "AI is feature-gated; no provider output is claimed."],
  [
    "CV parser provider",
    "Parser defaults disabled and UI states this honestly.",
  ],
  [
    "SMTP/Firebase/storage",
    "Local contracts exist; live providers are not claimed.",
  ],
  ["Payments", "Online checkout/webhooks are not claimed."],
  [
    "Production Android release",
    "Tester APK flow exists; no production-signed APK/AAB is claimed.",
  ],
  ["Owner UI approval", "Not done in code."],
].forEach(([blocker, stance]) => {
  assert.ok(
    readinessReport.includes(blocker),
    `Readiness report must keep provider/owner blocker row: ${blocker}.`,
  );
  assert.ok(
    readinessReport.includes(stance),
    `Readiness report must keep honest current stance for ${blocker}.`,
  );
});

console.log(
  `Syria documentation contract verified for ${requiredDocs.length} docs and ${requiredEnvLines.length} env entries.`,
);
