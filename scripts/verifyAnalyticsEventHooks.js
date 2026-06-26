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
