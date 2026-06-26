import assert from "node:assert/strict";
import fs from "node:fs";

const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const requiredHooks = [
  {
    file: "controllers/app/JobData/GetJobController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "job_viewed"',
      '"remote_filter_used"',
      '"hybrid_filter_used"',
    ],
  },
  {
    file: "controllers/app/JobData/JobInformation.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "job_saved"',
      'event: "job_applied"',
      'source: "external_application"',
    ],
  },
  {
    file: "controllers/app/JobData/ApplyingJobController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "job_applied"',
      'source: "internal_application"',
      "ats_score",
    ],
  },
  {
    file: "controllers/app/campus/campusController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "event_joined"',
      'event: "campus_verification_started"',
      'event: "campus_verification_approved"',
    ],
  },
  {
    file: "controllers/companyDash/companyWithJobs/companyWithJobsController.js",
    snippets: [
      "recordCompanyJobAnalytics",
      'event: "job_created"',
      'event: "job_published"',
    ],
  },
  {
    file: "controllers/dash/adminModerationController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "job_published"',
      'source: "admin_approval"',
    ],
  },
  {
    file: "controllers/companyDash/companyWithJobs/companyJobHiringController.js",
    snippets: [
      "recordCompanyHiringAnalytics",
      'event: "candidate_shortlisted"',
      'event: "interview_scheduled"',
      'event: "cv_exported"',
    ],
  },
  {
    file: "controllers/companyDash/companyWithApplicants/companyWithApplicantsController.js",
    snippets: [
      "recordCompanyApplicationAnalytics",
      'event: "candidate_shortlisted"',
      'event: "interview_scheduled"',
    ],
  },
  {
    file: "controllers/companyDash/information/companyInformationController.js",
    snippets: [
      "recordCompanyProfileUpdated",
      'event: "company_profile_updated"',
      'section: "basic"',
      'section: "media"',
    ],
  },
  {
    file: "controllers/app/Jobs/CreateJobController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "job_created"',
      'event: "job_published"',
      'source: "legacy_company_job_create"',
    ],
  },
  {
    file: "controllers/app/HandleAppliedJob/SendInterView.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "interview_scheduled"',
      'source: "legacy_send_interview"',
    ],
  },
  {
    file: "controllers/app/Auth/PassCodeController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "signup_completed"',
      'event: "login_completed"',
      "wasSignupCompletion",
    ],
  },
  {
    file: "controllers/companyDash/Auth/loginController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "login_completed"',
      'source: "company_dashboard_login"',
    ],
  },
  {
    file: "controllers/employeeDash/Auth/loginController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "login_completed"',
      'source: "employee_dashboard_login"',
    ],
  },
  {
    file: "controllers/app/Me/AccountContextController.js",
    snippets: [
      "recordAnalyticsEvent",
      'event: "account_context_switched"',
      "requested_context_id",
    ],
  },
  {
    file: "controllers/employeeDash/information/employeeInformationController.js",
    snippets: [
      "recordProfileCompletedIfNeeded",
      "recordGlobalPreferenceAnalytics",
      'event: "profile_completed"',
      'event: "country_changed"',
      'event: "currency_selected"',
    ],
  },
];

const failures = [];

for (const hook of requiredHooks) {
  const source = readSource(hook.file);
  for (const snippet of hook.snippets) {
    if (!source.includes(snippet)) {
      failures.push(`${hook.file} missing ${snippet}`);
    }
  }
}

assert.deepEqual(failures, [], "Missing automatic analytics event hooks");

console.log(`Analytics event hooks verified (${requiredHooks.length} controller checks).`);
