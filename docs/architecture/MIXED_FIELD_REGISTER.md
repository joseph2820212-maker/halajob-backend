# Mixed Field Register

Generated/verified by `npm run test:mixed-fields`.

HalaJob should not use `Schema.Types.Mixed` for ordinary product data. The fields below are the explicit exceptions where the stored value is intentionally polymorphic, externally shaped, or a redacted audit snapshot.

## Typed During This Pass

| Model | Field | Replacement |
|---|---|---|
| `jobs` | `work_mode_info`, `job_type_info`, `job_time_info`, `job_salary_info`, `experience_level_info`, `education_level_info` | `LookupSnapshotSchema` |
| `companies` | `subscription.features` | `SubscriptionFeatureSnapshotSchema` |
| `companies` | `subscription.limits` | `SubscriptionLimitSnapshotSchema` |

## Approved Mixed Fields

| Model | Field | Reason |
|---|---|---|
| `Notification` | `body` | Localized notification body may be a string or bilingual object during legacy/mobile compatibility. |
| `Notification` | `data` | FCM/navigation payload is provider- and client-version dependent. |
| `RefreshToken` | `device` | Device fingerprint snapshot from heterogeneous clients. |
| `account_contexts` | `metadata` | Account-context audit metadata bag. |
| `ai_requests` | `input_summary` | AI request input summary varies by feature. |
| `ai_requests` | `output_json` | AI provider output varies by feature/provider. |
| `analytics_events` | `metadata` | Event-specific analytics dimensions. |
| `application_status_history` | `metadata` | Status-transition metadata varies by action. |
| `audit_logs` | `old_value`, `new_value`, `metadata` | Redacted audit values and metadata vary by entity/action. |
| `career_passports` | `snapshot` | Career-passport export snapshot stores denormalized sections. |
| `communication_delivery_logs` | `payload_redacted` | Per-channel/provider delivery payloads differ, are already redacted, and are used for delivery diagnostics rather than core product state. |
| `company_invoices` | `metadata` | Payment/manual billing provider metadata. |
| `company_question_library` | `expected_answer` | Question answers can be string, number, boolean, or arrays. |
| `company_settings` | `security`, `privacy`, `preferences`, `billing`, `ats`, `campus`, `support` | Company settings are whitelisted section bags managed through `SettingsCenterController` and route validation. |
| `content_translations` | `original_text`, `translated_text`, `metadata` | Translation content can be string or structured job/CV text; provider/review metadata varies. |
| `cv_parse_jobs` | `raw_result` | Raw parser output is provider-specific and stored with `select: false`; confirmed application uses normalized fields. |
| `cv_parse_jobs` | `normalized_result` | Parser preview data is normalized by `cvParseNormalizer` and confirmed by the user before profile mutation. |
| `employee_cvs` | `quality_checks` | CV quality details are versioned rules-engine output from `cvQuality.service.js`. |
| `jobs` | `questions.correct_answer`, `questions.knockout_expected_answer` | Screening answers can be scalar or multi-choice arrays. |
| `platform_settings` | `general`, `maintenance`, `security`, `uploads`, `features`, `jobs`, `campus`, `billing`, `notifications`, `ai`, `privacy`, `integrations` | Platform settings are DB-backed launch configuration sections normalized by `platformSettings.service.js` before public exposure. |
| `scheduled_job_locks` | `last_stats` | Scheduler run stats differ by job type. |
| `search_history` | `filters` | Search filters differ across seeker/company/campus surfaces. |
| `student_verifications` | `submitted_payload` | Submitted verification form snapshot varies by method. |
| `university_settings` | `security`, `privacy`, `preferences`, `campus`, `verification`, `members`, `support` | University settings are whitelisted section bags managed through `SettingsCenterController` and route validation. |
| `user_applying_job` | `answers.answer` | Application answers can be text, boolean, number, file reference, or multi-choice arrays. |
| `user_applying_job` | `matching_details` | ATS/matching breakdown is versioned algorithm output. |
| `user_settings` | `security`, `privacy`, `preferences`, `support`, `job_alerts`, `consent` | User settings are whitelisted section bags managed through `SettingsCenterController` and route validation. |

## Regression Rule

New `Schema.Types.Mixed` fields must be added to this register with a clear reason, or replaced with a typed sub-schema before merging.
