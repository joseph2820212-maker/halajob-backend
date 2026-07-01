import assert from "node:assert/strict";
import mongoose from "mongoose";
import "../models/index.js";

const ALLOWED_MIXED_FIELDS = {
  "Notification.body": "localized notification body may be a string or bilingual object during legacy/mobile compatibility",
  "Notification.data": "FCM/navigation payload is provider- and client-version dependent",
  "RefreshToken.device": "device fingerprint snapshot from heterogeneous clients",
  "account_contexts.metadata": "account-context audit metadata bag",
  "ai_requests.input_summary": "AI request input summary varies by feature",
  "ai_requests.output_json": "AI provider output varies by feature/provider",
  "analytics_events.metadata": "event-specific analytics dimensions",
  "application_status_history.metadata": "status-transition metadata varies by action",
  "audit_logs.metadata": "audit metadata varies by entity/action",
  "audit_logs.new_value": "redacted before/after audit value can be any safe JSON shape",
  "audit_logs.old_value": "redacted before/after audit value can be any safe JSON shape",
  "campus_content.payload": "packaged campus content sections (metrics/opportunities/events/resources) are versioned JSON that mirrors the mobile asset contract",
  "career_passports.snapshot": "career-passport export snapshot intentionally stores denormalized sections",
  "communication_delivery_logs.payload_redacted": "redacted per-channel/provider delivery payload differs by channel and never stores raw secrets",
  "company_invoices.metadata": "payment/manual billing provider metadata",
  "company_question_library.expected_answer": "question answers can be string, number, boolean, or arrays",
  "company_settings.ats": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "company_settings.billing": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "company_settings.campus": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "company_settings.preferences": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "company_settings.privacy": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "company_settings.security": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "company_settings.support": "company settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "content_translations.metadata": "translation provider/review metadata",
  "content_translations.original_text": "source content can be string or structured job/CV text",
  "content_translations.translated_text": "translated content can be string or structured job/CV text",
  "cv_parse_jobs.normalized_result": "CV parser preview data is normalized and versioned before user confirmation",
  "cv_parse_jobs.raw_result": "raw CV parser provider output is provider-specific and select:false",
  "employee_cvs.quality_checks": "rules-based CV quality details are versioned scoring-service output",
  "jobs.questions.correct_answer": "job screening answers can be scalar or multi-choice arrays",
  "jobs.questions.knockout_expected_answer": "job screening answers can be scalar or multi-choice arrays",
  "platform_settings.ai": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.billing": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.campus": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.features": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.general": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.integrations": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.jobs": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.maintenance": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.notifications": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.privacy": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.security": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "platform_settings.uploads": "platform settings sections are DB-backed launch configuration normalized before public exposure",
  "scheduled_job_locks.last_stats": "scheduler run stats differ by job type",
  "search_history.filters": "search filters differ across seeker/company/campus surfaces",
  "student_verifications.submitted_payload": "submitted verification form snapshot varies by method",
  "university_settings.campus": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "university_settings.members": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "university_settings.preferences": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "university_settings.privacy": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "university_settings.security": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "university_settings.support": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "university_settings.verification": "university settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "user_applying_job.answers.answer": "application answers can be text, boolean, number, file reference, or multi-choice arrays",
  "user_applying_job.matching_details": "ATS/matching breakdown is versioned algorithm output",
  "user_settings.consent": "user settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "user_settings.job_alerts": "user settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "user_settings.preferences": "user settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "user_settings.privacy": "user settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "user_settings.security": "user settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
  "user_settings.support": "user settings sections are whitelisted JSON preference bags managed by SettingsCenterController",
};

const FORBIDDEN_MIXED_FIELDS = [
  "companies.subscription.features",
  "companies.subscription.limits",
  "jobs.work_mode_info",
  "jobs.job_type_info",
  "jobs.job_time_info",
  "jobs.job_salary_info",
  "jobs.experience_level_info",
  "jobs.education_level_info",
];

const normalizePath = (value) => value.replace(/\[\]\./g, ".").replace(/\[\]/g, "");

const collectMixedPaths = (schema, modelName, prefix = "", output = new Set()) => {
  for (const [path, schemaType] of Object.entries(schema.paths)) {
    if (path.startsWith("__")) continue;
    const fullPath = prefix ? `${prefix}.${path}` : path;

    if (schemaType.instance === "Mixed") output.add(`${modelName}.${normalizePath(fullPath)}`);

    if (schemaType.schema) collectMixedPaths(schemaType.schema, modelName, fullPath, output);

    const embeddedType = schemaType.$embeddedSchemaType || schemaType.caster;
    if (embeddedType?.schema) collectMixedPaths(embeddedType.schema, modelName, `${fullPath}[]`, output);
    if (embeddedType?.instance === "Mixed") output.add(`${modelName}.${normalizePath(`${fullPath}[]`)}`);
  }

  return output;
};

const mixedFields = new Set();
for (const modelName of mongoose.modelNames()) {
  collectMixedPaths(mongoose.model(modelName).schema, modelName, "", mixedFields);
}

const actual = [...mixedFields].sort();
const allowed = Object.keys(ALLOWED_MIXED_FIELDS).sort();

assert.deepEqual(actual, allowed, "Mixed field register is out of sync with live Mongoose schemas");

for (const field of FORBIDDEN_MIXED_FIELDS) {
  assert.equal(mixedFields.has(field), false, `${field} must stay typed and must not regress to Mixed`);
}

console.log(`[mixed-field-register] ok (${actual.length} allowed Mixed fields)`);
