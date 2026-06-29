import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const source = (relativePath) =>
  readFileSync(path.join(ROOT, relativePath), "utf8");

const checks = [
  {
    path: "scripts/verifyCampusWorkflowIntegration.js",
    strings: [
      "active campus partner should not see opted-out students",
      "company campus students should return opted-in verified students from active partner universities",
      "company should view only opted-in partner student detail",
      "suspended campus partner should lose talent pool access",
      "blocked company should not see opted-in campus student",
      "partnerStudents.data[0].user_id || {}",
      "partnerStudents.data[0].student_profile || {}",
      "Object.prototype.hasOwnProperty.call(partnerStudents.data[0], \"cvs\")",
      "campus_student_directory_viewed",
    ],
  },
  {
    path: "controllers/app/campus/campusController.js",
    strings: [
      "activePartnerUniversitiesForCompany",
      "campusStudentDirectoryQuery",
      "blocked_companies: { $ne: companyId }",
      "\"student_profile.student_email_verified\": true",
      "\"student_profile.campus_visibility.talent_pool_opt_in\": true",
      "\"student_profile.campus_visibility.visible_to_partner_companies\": true",
      "directory_access: \"partner_university_only\"",
      "contact_redacted",
      "cv_redacted",
      "campus_student_directory_viewed",
    ],
  },
  {
    path: "controllers/companyDash/companyTalentPoolController.js",
    strings: [
      "visibility.talent_pool_opt_in !== true",
      "visibility.visible_to_partner_companies !== true",
      "activeCampusPartnerMatch(companyId)",
      "profile_visibility === \"private\"",
    ],
  },
  {
    path: "models/EmployeeModel.js",
    strings: [
      "talent_pool_opt_in: { type: Boolean, default: false, index: true }",
      "visible_to_partner_companies: { type: Boolean, default: false, index: true }",
      "visible_fields",
      "blocked_companies",
    ],
  },
  {
    path: "models/UniversityModel.js",
    strings: [
      "enum: [\"pending\", \"active\", \"rejected\", \"suspended\", \"expired\"]",
      "access_level",
      "\"talent_pool_limited\"",
      "expires_at",
      "allowed_departments",
    ],
  },
];

for (const check of checks) {
  const text = source(check.path);
  for (const expected of check.strings) {
    assert.ok(
      text.includes(expected),
      `${check.path} is missing campus privacy contract string: ${expected}`,
    );
  }
}

console.log("Campus privacy static contract verified; running seeded workflow coverage.");

const workflowScript = path.join(ROOT, "scripts", "verifyCampusWorkflowIntegration.js");
const child = spawn(process.execPath, [workflowScript], {
  cwd: ROOT,
  env: process.env,
  stdio: "inherit",
});

const exitCode = await new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", (code) => resolve(code ?? 1));
});

assert.equal(exitCode, 0, "campus workflow privacy runtime coverage failed");
console.log("Campus privacy integration verified.");
