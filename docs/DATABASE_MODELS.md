# Database Models

Generated: 2026-06-28T08:05:07.142Z
Source: live Mongoose schemas loaded from `models/index.js`.

This is a generated schema inventory. It documents collections, fields, required/default/enum/ref metadata, and declared indexes. Business meaning, migration history, and data-retention rules still need owner/developer review.

## Summary

| Model | Collection | Fields | Indexes |
| --- | --- | --- | --- |
| account_contexts | `account_contexts` | 16 | 8 |
| ai_requests | `ai_requests` | 25 | 12 |
| ai_usage_limits | `ai_usage_limits` | 14 | 6 |
| analytics_events | `analytics_events` | 20 | 16 |
| app_settings | `app_settings` | 5 | 2 |
| application_status_history | `application_status_history` | 17 | 8 |
| audit_logs | `audit_logs` | 18 | 12 |
| banner | `banner` | 5 | 0 |
| campus_event_registrations | `campus_event_registrations` | 15 | 9 |
| career_passports | `career_passports` | 22 | 9 |
| cities | `countries` | 7 | 1 |
| colors | `colors` | 5 | 0 |
| companies | `companies` | 85 | 68 |
| company_invoices | `company_invoices` | 25 | 10 |
| company_members | `company_members` | 13 | 6 |
| company_message_templates | `company_message_templates` | 13 | 6 |
| company_question_library | `company_question_library` | 19 | 9 |
| company_reviews | `company_reviews` | 10 | 5 |
| company_subscriptions | `company_subscriptions` | 18 | 9 |
| company_support_tickets | `company_support_tickets` | 20 | 9 |
| content_translations | `content_translations` | 24 | 15 |
| countries | `countries` | 7 | 1 |
| currencies | `currencies` | 15 | 4 |
| cv_templates | `cv_templates` | 23 | 3 |
| education_levels | `education_levels` | 12 | 3 |
| employee_cvs | `employee_cvs` | 32 | 7 |
| employees | `employees` | 62 | 107 |
| experience_levels | `experience_levels` | 14 | 3 |
| FcmToken | `fcm_tokens` | 18 | 4 |
| fonts | `fonts` | 5 | 0 |
| industries | `industries` | 11 | 3 |
| interviews | `interviews` | 31 | 10 |
| job_employee_matches | `job_employee_matches` | 23 | 13 |
| job_invitations | `job_invitations` | 15 | 8 |
| job_matches | `job_matches` | 14 | 7 |
| job_name | `job_name` | 14 | 3 |
| job_reports | `job_reports` | 12 | 6 |
| job_salary | `job_salary` | 10 | 3 |
| job_service | `job_service` | 10 | 3 |
| job_type | `job_type` | 10 | 3 |
| jobs | `jobs` | 176 | 84 |
| jobzain_talent_requests | `jobzain_talent_requests` | 28 | 12 |
| keyword | `Keywords` | 4 | 2 |
| languages | `languages` | 5 | 1 |
| Notification | `notification` | 19 | 8 |
| NotificationPreference | `notification_preferences` | 10 | 1 |
| pages | `pages` | 13 | 3 |
| permissions | `permissions` | 12 | 5 |
| RefreshToken | `refreshtokens` | 6 | 2 |
| resumes | `resumes` | 12 | 1 |
| roles | `roles` | 12 | 6 |
| scheduled_job_locks | `scheduled_job_locks` | 14 | 3 |
| search_history | `search_history` | 12 | 5 |
| sheet | `sheets` | 6 | 1 |
| skills | `skills` | 12 | 5 |
| student_verifications | `student_verifications` | 25 | 10 |
| subscription_plans | `subscription_plans` | 20 | 9 |
| universities | `universities` | 16 | 9 |
| university_memberships | `university_memberships` | 11 | 6 |
| university_opportunity_requests | `university_opportunity_requests` | 12 | 6 |
| user_applying_job | `user_applying_job` | 54 | 17 |
| user_out_side_applying_job | `user_out_side_applying_job` | 6 | 4 |
| user_rating_job | `user_rating_job` | 7 | 4 |
| user_resumes | `user_resumes` | 9 | 0 |
| user_review_job | `user_review_job` | 7 | 4 |
| user_saved_job | `user_saved_job` | 6 | 4 |
| user_show_job | `user_show_job` | 6 | 5 |
| users | `users` | 35 | 13 |
| work_location | `work_location` | 10 | 3 |
| work_modes | `work_modes` | 13 | 3 |
| work_time | `work_time` | 11 | 3 |

## account_contexts

| Item | Value |
|---|---|
| Collection | `account_contexts` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `context_key` | String | yes |  |  |  |
| `context_type` | String | yes |  | job_seeker, student, company_member, company_admin, university_admin, super_admin |  |
| `entity_id` | ObjectID |  | null |  |  |
| `entity_model` | String |  |  | users, employees, companies, universities, platform,  |  |
| `display_name` | String |  |  |  |  |
| `avatar_url` | String |  |  |  |  |
| `status` | String |  | active | active, pending, suspended, removed |  |
| `permissions` | Array<String> |  | defaultFn |  |  |
| `is_default` | Boolean |  | false |  |  |
| `last_used_at` | Date |  | null |  |  |
| `metadata` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"context_type":1}` (background=true) |
| `{"entity_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"is_default":1}` (background=true) |
| `{"user_id":1,"context_key":1}` (unique=true, background=true) |
| `{"user_id":1,"status":1,"is_default":1}` (background=true) |
| `{"user_id":1,"context_type":1,"status":1}` (background=true) |

## ai_requests

| Item | Value |
|---|---|
| Collection | `ai_requests` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `feature` | String | yes |  |  |  |
| `input_hash` | String | yes |  |  |  |
| `input_summary` | Mixed |  | function |  |  |
| `output_json` | Mixed |  | null |  |  |
| `provider` | String |  |  |  |  |
| `model` | String |  |  |  |  |
| `status` | String |  | queued | queued, processing, completed, failed, blocked, cached |  |
| `error` | String |  |  |  |  |
| `token_estimate` | Number |  | 0 |  |  |
| `cost_estimate` | Number |  | 0 |  |  |
| `user_id` | ObjectID |  | null |  | users |
| `active_context_id` | String |  |  |  |  |
| `active_context_type` | String |  |  |  |  |
| `company_id` | ObjectID |  | null |  | companies |
| `employee_id` | ObjectID |  | null |  | employees |
| `job_id` | ObjectID |  | null |  | jobs |
| `request_ip` | String |  |  |  |  |
| `user_agent` | String |  |  |  |  |
| `safety.suggestion_only` | Boolean |  | true |  |  |
| `safety.human_approval_required` | Boolean |  | true |  |  |
| `safety.auto_action_performed` | Boolean |  | false |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"feature":1}` (background=true) |
| `{"input_hash":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"active_context_id":1}` (background=true) |
| `{"active_context_type":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"feature":1,"user_id":1,"input_hash":1,"status":1,"createdAt":-1}` (background=true) |
| `{"feature":1,"active_context_id":1,"createdAt":-1}` (background=true) |
| `{"user_id":1,"createdAt":-1}` (background=true) |

## ai_usage_limits

| Item | Value |
|---|---|
| Collection | `ai_usage_limits` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `feature` | String | yes |  |  |  |
| `scope_type` | String |  | global | global, user, context, company, university |  |
| `scope_id` | String |  | global |  |  |
| `enabled` | Boolean |  | false |  |  |
| `daily_limit` | Number |  | 0 |  |  |
| `monthly_limit` | Number |  | 0 |  |  |
| `provider` | String |  |  |  |  |
| `model` | String |  |  |  |  |
| `is_active` | Boolean |  | true |  |  |
| `note` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"feature":1}` (background=true) |
| `{"scope_type":1}` (background=true) |
| `{"scope_id":1}` (background=true) |
| `{"is_active":1}` (background=true) |
| `{"feature":1,"scope_type":1,"scope_id":1}` (unique=true, background=true) |
| `{"feature":1,"is_active":1}` (background=true) |

## analytics_events

| Item | Value |
|---|---|
| Collection | `analytics_events` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `event` | String | yes |  |  |  |
| `group` | String | yes |  | activation, ai, jobs, company, campus, global |  |
| `user_id` | ObjectID |  | null |  | users |
| `company_id` | ObjectID |  | null |  | companies |
| `active_context_id` | ObjectID |  | null |  | account_contexts |
| `context_type` | String |  |  |  |  |
| `entity_type` | String |  | other | job, application, interview, job_invitation, company, campus, university, ai_request, notification, cv, career_passport, translation, other |  |
| `entity_id` | ObjectID |  | null |  |  |
| `job_id` | ObjectID |  | null |  | jobs |
| `application_id` | ObjectID |  | null |  | user_applying_job |
| `session_id` | String |  |  |  |  |
| `platform` | String |  |  |  |  |
| `app_version` | String |  |  |  |  |
| `ip` | String |  |  |  |  |
| `user_agent` | String |  |  |  |  |
| `metadata` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"event":1}` (background=true) |
| `{"group":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"active_context_id":1}` (background=true) |
| `{"context_type":1}` (background=true) |
| `{"entity_type":1}` (background=true) |
| `{"entity_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"application_id":1}` (background=true) |
| `{"session_id":1}` (background=true) |
| `{"event":1,"createdAt":-1}` (background=true) |
| `{"group":1,"createdAt":-1}` (background=true) |
| `{"user_id":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"createdAt":-1}` (background=true) |
| `{"context_type":1,"event":1,"createdAt":-1}` (background=true) |

## app_settings

| Item | Value |
|---|---|
| Collection | `app_settings` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `for` | String | yes |  | app, dash, company, employee |  |
| `title` | String | yes |  |  |  |
| `free_post` | Number |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

| Index |
| --- |
| `{"for":1}` (unique=true, background=true) |
| `{"title":1}` (unique=true, background=true) |

## application_status_history

| Item | Value |
|---|---|
| Collection | `application_status_history` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `application_id` | ObjectID | yes |  |  | user_applying_job |
| `job_id` | ObjectID | yes |  |  | jobs |
| `company_id` | ObjectID | yes |  |  | companies |
| `user_id` | ObjectID | yes |  |  | users |
| `old_status` | String |  | null |  |  |
| `new_status` | String | yes |  |  |  |
| `changed_by` | ObjectID |  | null |  | users |
| `actor_type` | String |  | system | system, company, employee, admin |  |
| `action` | String |  | status_changed |  |  |
| `note` | String |  |  |  |  |
| `rejection_reason_code` | String |  |  |  |  |
| `visible_to_candidate` | Boolean |  | false |  |  |
| `metadata` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"application_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"new_status":1}` (background=true) |
| `{"action":1}` (background=true) |
| `{"application_id":1,"createdAt":-1}` (background=true) |
| `{"job_id":1,"createdAt":-1}` (background=true) |

## audit_logs

| Item | Value |
|---|---|
| Collection | `audit_logs` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID |  | null |  | companies |
| `actor_user_id` | ObjectID |  | null |  | users |
| `actor_type` | String |  | system | system, admin, company_owner, company_member, employee, university_admin |  |
| `action` | String | yes |  |  |  |
| `entity_type` | String |  | other | job, application, interview, job_invitation, company, company_member, question_library, message_template, support_ticket, subscription, verification, notification, translation, user, admin, other |  |
| `entity_id` | ObjectID |  | null |  |  |
| `job_id` | ObjectID |  | null |  | jobs |
| `application_id` | ObjectID |  | null |  | user_applying_job |
| `old_value` | Mixed |  | null |  |  |
| `new_value` | Mixed |  | null |  |  |
| `note` | String |  |  |  |  |
| `ip` | String |  |  |  |  |
| `user_agent` | String |  |  |  |  |
| `metadata` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"actor_user_id":1}` (background=true) |
| `{"actor_type":1}` (background=true) |
| `{"action":1}` (background=true) |
| `{"entity_type":1}` (background=true) |
| `{"entity_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"application_id":1}` (background=true) |
| `{"company_id":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"entity_type":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"job_id":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"application_id":1,"createdAt":-1}` (background=true) |

## banner

| Item | Value |
|---|---|
| Collection | `banner` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `image` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

No explicit schema indexes.

## campus_event_registrations

| Item | Value |
|---|---|
| Collection | `campus_event_registrations` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `employee_id` | ObjectID |  | null |  | employees |
| `event_id` | String | yes |  |  |  |
| `title` | String | yes |  |  |  |
| `organizer` | String |  |  |  |  |
| `kind` | String |  |  |  |  |
| `date_label` | String |  |  |  |  |
| `start_at` | Date |  | null |  |  |
| `reminder_sent_at` | Date |  | null |  |  |
| `mode` | String |  |  |  |  |
| `status` | String |  | registered | registered, cancelled, attended |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"event_id":1}` (background=true) |
| `{"start_at":1}` (background=true) |
| `{"reminder_sent_at":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"user_id":1,"event_id":1}` (unique=true, background=true) |
| `{"event_id":1,"status":1}` (background=true) |
| `{"status":1,"start_at":1,"reminder_sent_at":1}` (background=true) |

## career_passports

| Item | Value |
|---|---|
| Collection | `career_passports` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `employee_id` | ObjectID | yes |  |  | employees |
| `active_context_id` | ObjectID |  | null |  | account_contexts |
| `visibility` | String |  | private | private, companies_only, public |  |
| `share.enabled` | Boolean |  | false |  |  |
| `share.token` | String |  |  |  |  |
| `share.created_at` | Date |  | null |  |  |
| `share.revoked_at` | Date |  | null |  |  |
| `share.expires_at` | Date |  | null |  |  |
| `score.total` | Number |  | 0 |  |  |
| `score.source` | String |  | rule_based_v1 |  |  |
| `score.generated_by_ai` | Boolean |  | false |  |  |
| `score.explanation` | String |  |  |  |  |
| `score.components` | Array<Function> |  | function |  |  |
| `score.strengths` | Array<String> |  | defaultFn |  |  |
| `score.next_actions` | Array<String> |  | defaultFn |  |  |
| `score.updated_at` | Date |  | null |  |  |
| `snapshot` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (unique=true, background=true) |
| `{"employee_id":1}` (background=true) |
| `{"active_context_id":1}` (background=true) |
| `{"visibility":1}` (background=true) |
| `{"share.enabled":1}` (background=true) |
| `{"share.token":1}` (background=true) |
| `{"score.total":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"share.token":1}` (sparse=true, background=true) |

## cities

| Item | Value |
|---|---|
| Collection | `countries` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `country_code` | String | yes |  |  |  |
| `country_name_ar` | String | yes |  |  |  |
| `country_name_en` | String | yes |  |  |  |
| `city_name_ar` | String | yes |  |  |  |
| `city_name_en` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

| Index |
| --- |
| `{"country_code":1,"city_name_en":1}` (unique=true, background=true) |

## colors

| Item | Value |
|---|---|
| Collection | `colors` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `code` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

No explicit schema indexes.

## companies

| Item | Value |
|---|---|
| Collection | `companies` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_projection.searchable_tokens` | Array<String> |  | defaultFn |  |  |
| `company_projection.searchable_text` | String |  |  |  |  |
| `company_projection.hiring_score` | Number |  | 0 |  |  |
| `company_projection.trust_score` | Number |  | 0 |  |  |
| `company_projection.activity_score` | Number |  | 0 |  |  |
| `company_projection.branding_score` | Number |  | 0 |  |  |
| `company_projection.total_score` | Number |  | 0 |  |  |
| `company_projection.normalized_specialties` | Array<String> |  | defaultFn |  |  |
| `company_projection.normalized_benefits` | Array<String> |  | defaultFn |  |  |
| `company_projection.normalized_industry` | String |  |  |  |  |
| `company_projection.normalized_location` | Array<String> |  | defaultFn |  |  |
| `search_filters` | Embedded |  | default |  |  |
| `image` | String |  | null |  |  |
| `cover_image` | String |  | null |  |  |
| `logo` | String |  | null |  |  |
| `gallery` | Array<Function> |  | function |  |  |
| `files` | Array<String> |  | defaultFn |  |  |
| `company_name` | String | yes |  |  |  |
| `slug` | String |  |  |  |  |
| `company_email` | String | yes |  |  |  |
| `owner_user_id` | ObjectID | yes |  |  | users |
| `role_id` | ObjectID | yes |  |  | roles |
| `permissions` | Array<String> |  | defaultFn |  |  |
| `profile_completion` | Number |  | 0 |  |  |
| `created_year` | Number |  | null |  |  |
| `description` | String |  |  |  |  |
| `company_short_description` | String |  |  |  |  |
| `mission` | String |  |  |  |  |
| `vision` | String |  |  |  |  |
| `culture` | String |  |  |  |  |
| `benefits` | Array<String> |  | defaultFn |  |  |
| `specialties` | Array<String> |  | defaultFn |  |  |
| `industry_id` | ObjectID |  | null |  | industries |
| `industry_name` | String |  |  |  |  |
| `company_size` | Number |  | null |  |  |
| `company_size_type` | String |  | unknown | 1_10, 11_50, 51_200, 201_500, 500_plus, startup, small, medium, large, enterprise, unknown |  |
| `company_type` | String |  |  |  |  |
| `country_id` | ObjectID |  | null |  | countries |
| `city_id` | ObjectID |  | null |  | cities |
| `company_country` | String |  |  |  |  |
| `company_city` | String |  |  |  |  |
| `company_address` | String |  |  |  |  |
| `timezone` | String |  | UTC |  |  |
| `location.latitude` | Number |  | null |  |  |
| `location.longitude` | Number |  | null |  |  |
| `site_type` | String |  | headquarters | headquarters, branch, representative_office, remote, other |  |
| `location_visibility.show_country` | Boolean |  | true |  |  |
| `location_visibility.show_address` | Boolean |  | true |  |  |
| `location_visibility.show_map` | Boolean |  | true |  |  |
| `company_locations` | Array<Function> |  | function |  |  |
| `privacy_settings` | Embedded |  | default |  |  |
| `company_contact` | Array<String> |  | defaultFn |  |  |
| `company_phone` | String |  |  |  |  |
| `company_phone_code` | String |  |  |  |  |
| `company_whatsapp` | String |  |  |  |  |
| `company_website` | String |  |  |  |  |
| `social_links` | Array<Function> |  | function |  |  |
| `hr_name` | String |  |  |  |  |
| `hr_email` | String |  |  |  |  |
| `hr_phone` | String |  |  |  |  |
| `languages` | Array<Function> |  | function |  |  |
| `is_hiring` | Boolean |  | true |  |  |
| `jobs_count` | Number |  | 0 |  |  |
| `active_jobs_count` | Number |  | 0 |  |  |
| `employees_count` | Number |  | 0 |  |  |
| `views_count` | Number |  | 0 |  |  |
| `followers_count` | Number |  | 0 |  |  |
| `status` | Boolean |  | false |  |  |
| `accepted` | Boolean |  | false |  |  |
| `is_verified` | Boolean |  | false |  |  |
| `verified_at` | Date |  | null |  |  |
| `verified_by` | ObjectID |  | null |  | users |
| `reviewed_at` | Date |  | null |  |  |
| `reviewed_by` | ObjectID |  | null |  | users |
| `rejection_reason` | String |  |  |  |  |
| `verification_documents` | Array<Function> |  | function |  |  |
| `can_upload` | Boolean |  | true |  |  |
| `free_post_balance` | Number |  | 0 |  |  |
| `rating_avg` | Number |  | 0 |  |  |
| `rating_count` | Number |  | 0 |  |  |
| `subscription` | Embedded |  | default |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"search_filters.text.all":1}` (background=true) |
| `{"search_filters.identity.company_name":1}` (background=true) |
| `{"search_filters.identity.slug":1}` (background=true) |
| `{"search_filters.identity.industry_id":1}` (background=true) |
| `{"search_filters.identity.industry_name":1}` (background=true) |
| `{"search_filters.identity.company_type":1}` (background=true) |
| `{"search_filters.identity.company_size_type":1}` (background=true) |
| `{"search_filters.identity.specialties":1}` (background=true) |
| `{"search_filters.location.country_id":1}` (background=true) |
| `{"search_filters.location.city_id":1}` (background=true) |
| `{"search_filters.location.country_code":1}` (background=true) |
| `{"search_filters.location.company_country":1}` (background=true) |
| `{"search_filters.location.company_city":1}` (background=true) |
| `{"search_filters.location.timezone":1}` (background=true) |
| `{"search_filters.hiring.is_hiring":1}` (background=true) |
| `{"search_filters.hiring.can_upload":1}` (background=true) |
| `{"search_filters.hiring.free_post_balance":1}` (background=true) |
| `{"search_filters.hiring.jobs_count":1}` (background=true) |
| `{"search_filters.hiring.active_jobs_count":1}` (background=true) |
| `{"search_filters.trust.status":1}` (background=true) |
| `{"search_filters.trust.accepted":1}` (background=true) |
| `{"search_filters.trust.is_verified":1}` (background=true) |
| `{"search_filters.trust.rating_avg":1}` (background=true) |
| `{"search_filters.trust.rating_count":1}` (background=true) |
| `{"search_filters.trust.profile_completion":1}` (background=true) |
| `{"search_filters.stats.employees_count":1}` (background=true) |
| `{"search_filters.stats.views_count":1}` (background=true) |
| `{"search_filters.stats.followers_count":1}` (background=true) |
| `{"company_name":1}` (unique=true, background=true) |
| `{"slug":1}` (unique=true, sparse=true, background=true) |
| `{"company_email":1}` (unique=true, background=true) |
| `{"owner_user_id":1}` (unique=true, background=true) |
| `{"profile_completion":1}` (background=true) |
| `{"specialties":1}` (background=true) |
| `{"industry_id":1}` (background=true) |
| `{"company_size_type":1}` (background=true) |
| `{"company_type":1}` (background=true) |
| `{"country_id":1}` (background=true) |
| `{"city_id":1}` (background=true) |
| `{"languages.language_id":1}` (background=true) |
| `{"is_hiring":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"accepted":1}` (background=true) |
| `{"is_verified":1}` (background=true) |
| `{"verification_documents.status":1}` (background=true) |
| `{"subscription.plan_id":1}` (background=true) |
| `{"subscription.subscription_id":1}` (background=true) |
| `{"subscription.plan_key":1}` (background=true) |
| `{"subscription.status":1}` (background=true) |
| `{"subscription.jobs_require_admin_approval":1}` (background=true) |
| `{"company_name":"text","description":"text","industry_name":"text","specialties":"text"}` (background=true) |
| `{"owner_user_id":1}` (background=true) |
| `{"accepted":1,"status":1,"is_verified":1,"is_hiring":1}` (background=true) |
| `{"country_id":1,"city_id":1}` (background=true) |
| `{"company_size_type":1,"company_type":1}` (background=true) |
| `{"specialties":1}` (background=true) |
| `{"search_filters.text.all":"text"}` (background=true) |
| `{"search_filters.identity.industry_id":1,"search_filters.identity.company_size_type":1,"search_filters.hiring.is_hiring":1}` (background=true) |
| `{"search_filters.location.country_id":1,"search_filters.location.city_id":1}` (background=true) |
| `{"search_filters.trust.accepted":1,"search_filters.trust.status":1,"search_filters.trust.is_verified":1}` (background=true) |
| `{"search_filters.hiring.active_jobs_count":-1,"search_filters.trust.rating_avg":-1}` (background=true) |
| `{"company_projection.searchable_tokens":1}` (background=true) |
| `{"company_projection.total_score":-1}` (background=true) |
| `{"company_projection.hiring_score":-1}` (background=true) |
| `{"company_projection.trust_score":-1}` (background=true) |
| `{"company_projection.normalized_specialties":1}` (background=true) |
| `{"company_projection.normalized_industry":1}` (background=true) |
| `{"company_projection.normalized_location":1}` (background=true) |

## company_invoices

| Item | Value |
|---|---|
| Collection | `company_invoices` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `invoice_no` | String |  |  |  |  |
| `company_id` | ObjectID | yes |  |  | companies |
| `subscription_id` | ObjectID |  | null |  | company_subscriptions |
| `plan_id` | ObjectID |  | null |  | subscription_plans |
| `plan_key` | String |  |  |  |  |
| `status` | String |  | pending | draft, pending, paid, cancelled, refunded, failed, overdue |  |
| `amount` | Number |  | 0 |  |  |
| `tax_amount` | Number |  | 0 |  |  |
| `discount_amount` | Number |  | 0 |  |  |
| `total_amount` | Number |  | 0 |  |  |
| `currency_code` | String |  | USD |  |  |
| `billing_period` | String |  |  |  |  |
| `issued_at` | Date |  | now |  |  |
| `due_at` | Date |  | null |  |  |
| `paid_at` | Date |  | null |  |  |
| `cancelled_at` | Date |  | null |  |  |
| `payment_method` | String |  |  |  |  |
| `transaction_ref` | String |  |  |  |  |
| `items` | Array<Function> |  | function |  |  |
| `notes` | String |  |  |  |  |
| `metadata` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"invoice_no":1}` (unique=true, sparse=true, background=true) |
| `{"company_id":1}` (background=true) |
| `{"subscription_id":1}` (background=true) |
| `{"plan_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"issued_at":1}` (background=true) |
| `{"due_at":1}` (background=true) |
| `{"paid_at":1}` (background=true) |
| `{"company_id":1,"status":1,"issued_at":-1}` (background=true) |
| `{"company_id":1,"due_at":1}` (background=true) |

## company_members

| Item | Value |
|---|---|
| Collection | `company_members` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID | yes |  |  | companies |
| `user_id` | ObjectID | yes |  |  | users |
| `role_id` | ObjectID |  | null |  | roles |
| `member_role` | String |  | recruiter | owner, admin, hr_manager, recruiter, viewer |  |
| `permissions` | Array<String> |  | defaultFn |  |  |
| `status` | String |  | active | active, invited, suspended, removed |  |
| `invited_by` | ObjectID |  | null |  | users |
| `invited_at` | Date |  | null |  |  |
| `joined_at` | Date |  | now |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"member_role":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"company_id":1,"user_id":1}` (unique=true, background=true) |
| `{"company_id":1,"status":1,"member_role":1}` (background=true) |

## company_message_templates

| Item | Value |
|---|---|
| Collection | `company_message_templates` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID | yes |  |  | companies |
| `created_by` | ObjectID |  | null |  | users |
| `key` | String | yes |  |  |  |
| `title` | String | yes |  |  |  |
| `type` | String |  | general | acceptance, rejection, interview, offer, general |  |
| `subject` | String |  |  |  |  |
| `body` | String | yes |  |  |  |
| `language` | String |  | ar | ar, en |  |
| `is_active` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"type":1}` (background=true) |
| `{"language":1}` (background=true) |
| `{"is_active":1}` (background=true) |
| `{"company_id":1,"key":1,"language":1}` (unique=true, background=true) |
| `{"company_id":1,"type":1,"is_active":1}` (background=true) |

## company_question_library

| Item | Value |
|---|---|
| Collection | `company_question_library` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID | yes |  |  | companies |
| `created_by` | ObjectID |  | null |  | users |
| `title` | String | yes |  |  |  |
| `question` | String | yes |  |  |  |
| `type` | String |  | text | text, textarea, yes_no, single_choice, multi_choice, number, file |  |
| `options` | Array<Function> |  | function |  |  |
| `is_required` | Boolean |  | false |  |  |
| `is_knockout` | Boolean |  | false |  |  |
| `weight` | Number |  | 1 |  |  |
| `expected_answer` | Mixed |  | null |  |  |
| `knockout_action` | String |  | mark_not_match | mark_not_match, needs_manual_review, reject |  |
| `category` | String |  | general |  |  |
| `tags` | Array<String> |  | defaultFn |  |  |
| `usage_count` | Number |  | 0 |  |  |
| `is_active` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"created_by":1}` (background=true) |
| `{"type":1}` (background=true) |
| `{"is_knockout":1}` (background=true) |
| `{"category":1}` (background=true) |
| `{"tags":1}` (background=true) |
| `{"is_active":1}` (background=true) |
| `{"company_id":1,"title":1}` (background=true) |
| `{"company_id":1,"is_active":1,"createdAt":-1}` (background=true) |

## company_reviews

| Item | Value |
|---|---|
| Collection | `company_reviews` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `company_id` | ObjectID | yes |  |  | companies |
| `rating` | Number | yes |  |  |  |
| `message` | String |  |  |  |  |
| `status` | String |  | pending | pending, published, hidden, rejected |  |
| `is_anonymous` | Boolean |  | false |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"user_id":1,"company_id":1}` (unique=true, background=true) |
| `{"company_id":1,"status":1,"createdAt":-1}` (background=true) |

## company_subscriptions

| Item | Value |
|---|---|
| Collection | `company_subscriptions` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID | yes |  |  | companies |
| `plan_id` | ObjectID | yes |  |  | subscription_plans |
| `plan_key` | String | yes |  |  |  |
| `status` | String |  | active | active, trialing, expired, cancelled, suspended |  |
| `starts_at` | Date |  | now |  |  |
| `ends_at` | Date |  | null |  |  |
| `cancelled_at` | Date |  | null |  |  |
| `last_usage_reset_at` | Date |  | now |  |  |
| `features` | Embedded |  | default |  |  |
| `limits` | Embedded |  | default |  |  |
| `usage` | Embedded |  | default |  |  |
| `jobs_require_admin_approval` | Boolean |  | true |  |  |
| `assigned_by` | ObjectID |  | null |  | users |
| `admin_note` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"plan_id":1}` (background=true) |
| `{"plan_key":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"starts_at":1}` (background=true) |
| `{"ends_at":1}` (background=true) |
| `{"jobs_require_admin_approval":1}` (background=true) |
| `{"company_id":1,"status":1,"createdAt":-1}` (background=true) |
| `{"plan_id":1,"status":1}` (background=true) |

## company_support_tickets

| Item | Value |
|---|---|
| Collection | `company_support_tickets` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `ticket_no` | String |  |  |  |  |
| `company_id` | ObjectID | yes |  |  | companies |
| `created_by` | ObjectID |  | null |  | users |
| `type` | String |  | support | support, feature_request, bug_report, faq, whatsapp, subscription_request |  |
| `subject` | String | yes |  |  |  |
| `message` | String | yes |  |  |  |
| `status` | String |  | open | open, in_progress, answered, closed, cancelled |  |
| `priority` | String |  | medium | low, medium, high, urgent |  |
| `attachments` | Array<String> |  | defaultFn |  |  |
| `messages` | Array<Function> |  | function |  |  |
| `assigned_to` | ObjectID |  | null |  | users |
| `assigned_at` | Date |  | null |  |  |
| `admin_note` | String |  |  |  |  |
| `last_admin_response_at` | Date |  | null |  |  |
| `closed_by` | ObjectID |  | null |  | users |
| `closed_at` | Date |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"ticket_no":1}` (unique=true, sparse=true, background=true) |
| `{"company_id":1}` (background=true) |
| `{"created_by":1}` (background=true) |
| `{"type":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"priority":1}` (background=true) |
| `{"assigned_to":1}` (background=true) |
| `{"company_id":1,"status":1,"createdAt":-1}` (background=true) |
| `{"status":1,"priority":1,"updatedAt":-1}` (background=true) |

## content_translations

| Item | Value |
|---|---|
| Collection | `content_translations` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `entity_type` | String | yes |  | job, cv, career_passport |  |
| `entity_id` | ObjectID | yes |  |  |  |
| `job_id` | ObjectID |  | null |  | jobs |
| `cv_id` | ObjectID |  | null |  | employee_cvs |
| `employee_id` | ObjectID |  | null |  | employees |
| `company_id` | ObjectID |  | null |  | companies |
| `user_id` | ObjectID |  | null |  | users |
| `source_language` | String | yes |  | ar, en |  |
| `target_language` | String | yes |  | ar, en |  |
| `original_text` | Mixed | yes |  |  |  |
| `translated_text` | Mixed | yes |  |  |  |
| `ai_request_id` | ObjectID |  | null |  | ai_requests |
| `approval_required` | Boolean |  | true |  |  |
| `status` | String |  | pending_approval | draft, pending_approval, approved, rejected |  |
| `approved_by` | ObjectID |  | null |  | users |
| `approved_at` | Date |  | null |  |  |
| `rejected_by` | ObjectID |  | null |  | users |
| `rejected_at` | Date |  | null |  |  |
| `rejection_reason` | String |  |  |  |  |
| `metadata` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"entity_type":1}` (background=true) |
| `{"entity_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"cv_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"source_language":1}` (background=true) |
| `{"target_language":1}` (background=true) |
| `{"ai_request_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"entity_type":1,"entity_id":1,"target_language":1}` (unique=true, background=true) |
| `{"status":1,"target_language":1,"updatedAt":-1}` (background=true) |
| `{"company_id":1,"entity_type":1,"updatedAt":-1}` (background=true) |
| `{"employee_id":1,"entity_type":1,"updatedAt":-1}` (background=true) |

## countries

| Item | Value |
|---|---|
| Collection | `countries` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `country_code` | String | yes |  |  |  |
| `country_name_ar` | String | yes |  |  |  |
| `country_name_en` | String | yes |  |  |  |
| `city_name_ar` | String | yes |  |  |  |
| `city_name_en` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

| Index |
| --- |
| `{"country_code":1,"city_name_en":1}` (unique=true, background=true) |

## currencies

| Item | Value |
|---|---|
| Collection | `currencies` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `code` | String | yes |  |  |  |
| `name_en` | String | yes |  |  |  |
| `name_ar` | String | yes |  |  |  |
| `symbol_en` | String |  |  |  |  |
| `symbol_ar` | String |  |  |  |  |
| `rate_base` | String |  | USD |  |  |
| `rate` | Number | yes | 1 |  |  |
| `is_base` | Boolean |  | false |  |  |
| `is_active` | Boolean |  | true |  |  |
| `is_auto_update` | Boolean |  | false |  |  |
| `rate_updated_at` | Date |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"code":1}` (unique=true, background=true) |
| `{"code":1}` (unique=true, background=true) |
| `{"is_active":1}` (background=true) |
| `{"is_base":1}` (background=true) |

## cv_templates

| Item | Value |
|---|---|
| Collection | `cv_templates` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `description_ar` | String |  |  |  |  |
| `description_en` | String |  |  |  |  |
| `preview_image` | String |  |  |  |  |
| `html` | String | yes |  |  |  |
| `css` | String |  |  |  |  |
| `default_colors.background_color` | String |  | #f0ebe3 |  |  |
| `default_colors.card_color` | String |  | #ffffff |  |  |
| `default_colors.sidebar_color` | String |  | #2b2d42 |  |  |
| `default_colors.accent_color` | String |  | #ef8354 |  |  |
| `default_colors.text_color` | String |  | #555555 |  |  |
| `default_font.family` | String |  | Arial |  |  |
| `default_font.size` | Number |  | 14 |  |  |
| `supported_languages` | Array<String> |  | defaultFn | ar, en |  |
| `is_active` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | true |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"is_active":1}` (background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## education_levels

| Item | Value |
|---|---|
| Collection | `education_levels` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `keywords_ar` | Array<String> |  | defaultFn |  |  |
| `keywords_en` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"key":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## employee_cvs

| Item | Value |
|---|---|
| Collection | `employee_cvs` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `employee_id` | ObjectID | yes |  |  | employees |
| `template_id` | ObjectID | yes |  |  | cv_templates |
| `template_key` | String | yes |  |  |  |
| `title` | String |  | My CV |  |  |
| `lang` | String |  | en | ar, en |  |
| `colors.background_color` | String |  | #f0ebe3 |  |  |
| `colors.card_color` | String |  | #ffffff |  |  |
| `colors.sidebar_color` | String |  | #2b2d42 |  |  |
| `colors.accent_color` | String |  | #ef8354 |  |  |
| `colors.text_color` | String |  | #555555 |  |  |
| `font.family` | String |  | Arial |  |  |
| `font.size` | Number |  | 14 |  |  |
| `sections.profile` | Boolean |  | true |  |  |
| `sections.contact` | Boolean |  | true |  |  |
| `sections.experience` | Boolean |  | true |  |  |
| `sections.education` | Boolean |  | true |  |  |
| `sections.skills` | Boolean |  | true |  |  |
| `sections.languages` | Boolean |  | true |  |  |
| `sections.licenses` | Boolean |  | true |  |  |
| `sections.testimony` | Boolean |  | true |  |  |
| `sections.links` | Boolean |  | true |  |  |
| `sections.job_preferences` | Boolean |  | true |  |  |
| `sections.expected_salary` | Boolean |  | false |  |  |
| `section_order` | Array<String> |  | defaultFn |  |  |
| `pdf_file` | String |  |  |  |  |
| `public_download_token` | String |  |  |  |  |
| `public_download_expires_at` | Date |  | null |  |  |
| `is_default` | Boolean |  | false |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"employee_id":1}` (background=true) |
| `{"template_id":1}` (background=true) |
| `{"template_key":1}` (background=true) |
| `{"public_download_token":1}` (background=true) |
| `{"public_download_expires_at":1}` (background=true) |
| `{"is_default":1}` (background=true) |
| `{"employee_id":1,"is_default":1}` (background=true) |

## employees

| Item | Value |
|---|---|
| Collection | `employees` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `matching_profile.normalized_skills` | Array<String> |  | defaultFn |  |  |
| `matching_profile.normalized_languages` | Array<String> |  | defaultFn |  |  |
| `matching_profile.normalized_titles` | Array<String> |  | defaultFn |  |  |
| `matching_profile.normalized_job_names` | Array<String> |  | defaultFn |  |  |
| `matching_profile.normalized_job_types` | Array<String> |  | defaultFn |  |  |
| `matching_profile.preferred_country_values` | Array<String> |  | defaultFn |  |  |
| `matching_profile.preferred_work_mode_keys` | Array<String> |  | defaultFn |  |  |
| `matching_profile.career_tags` | Array<String> |  | defaultFn |  |  |
| `matching_profile.searchable_tokens` | Array<String> |  | defaultFn |  |  |
| `matching_profile.searchable_text` | String |  |  |  |  |
| `matching_profile.seniority_score` | Number |  | 0 |  |  |
| `matching_profile.salary_min_base` | Number |  | null |  |  |
| `matching_profile.salary_max_base` | Number |  | null |  |  |
| `matching_profile.remote_ready` | Boolean |  | false |  |  |
| `matching_profile.relocation_ready` | Boolean |  | false |  |  |
| `matching_profile.free_for_work` | Boolean |  | true |  |  |
| `user_id` | ObjectID | yes |  |  | users |
| `role_id` | ObjectID | yes |  |  | roles |
| `permissions` | Array<String> |  | defaultFn |  |  |
| `status` | Boolean |  | true |  |  |
| `accepted` | Boolean |  | false |  |  |
| `profile_headline` | String |  |  |  |  |
| `current_job_title` | String |  |  |  |  |
| `about_me` | String |  |  |  |  |
| `profile_completion` | Number |  | 0 |  |  |
| `birthday` | Date |  | null |  |  |
| `current_country_id` | ObjectID |  | null |  | countries |
| `current_city_id` | ObjectID |  | null |  | cities |
| `current_country` | String |  |  |  |  |
| `current_city` | String |  |  |  |  |
| `candidate_stage` | String |  | unknown | student, graduate, fresh_graduate, experienced, career_changer, unknown |  |
| `is_student` | Boolean |  | false |  |  |
| `student_profile` | Embedded |  | default |  |  |
| `graduation_year` | Number |  | null |  |  |
| `experience_years` | Number |  | 0 |  |  |
| `experience_level_id` | ObjectID |  | null |  | experience_levels |
| `cvs` | Array<Function> |  | function |  |  |
| `latest_work_experience` | Embedded |  | null |  |  |
| `experience` | Array<Function> |  | function |  |  |
| `education` | Array<Function> |  | function |  |  |
| `skills` | Array<Function> |  | function |  |  |
| `languages` | Array<Function> |  | function |  |  |
| `licenses` | Array<Function> |  | function |  |  |
| `testimony` | Array<Function> |  | function |  |  |
| `job_names` | Array<ObjectID> |  | defaultFn |  | job_name |
| `job_types` | Array<ObjectID> |  | defaultFn |  | job_type |
| `preferred_work_modes` | Array<ObjectID> |  | defaultFn |  | work_modes |
| `preferred_countries` | Array<ObjectID> |  | defaultFn |  | countries |
| `expected_salary` | Embedded |  | default |  |  |
| `notice_period_id` | ObjectID |  | null |  | work_time |
| `is_can_move` | Boolean |  | true |  |  |
| `is_free_for_work` | Boolean |  | true |  |  |
| `work_location` | String |  | unknown | remote, hybrid, onsite, field, unknown |  |
| `links` | Array<Function> |  | function |  |  |
| `profile_visibility` | String |  | public | public, private, companies_only |  |
| `blocked_companies` | Array<ObjectID> |  | defaultFn |  | companies |
| `job_alerts` | Array<Function> |  | function |  |  |
| `search_filters` | Embedded |  | default |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (unique=true, background=true) |
| `{"status":1}` (background=true) |
| `{"accepted":1}` (background=true) |
| `{"birthday":1}` (background=true) |
| `{"current_country_id":1}` (background=true) |
| `{"current_city_id":1}` (background=true) |
| `{"candidate_stage":1}` (background=true) |
| `{"is_student":1}` (background=true) |
| `{"student_profile.university_id":1}` (background=true) |
| `{"student_profile.expected_graduation_year":1}` (background=true) |
| `{"student_profile.enrollment_status":1}` (background=true) |
| `{"student_profile.student_email_verified":1}` (background=true) |
| `{"student_profile.technical_skills.skill_id":1}` (background=true) |
| `{"student_profile.soft_skills.skill_id":1}` (background=true) |
| `{"graduation_year":1}` (background=true) |
| `{"experience_years":1}` (background=true) |
| `{"experience_level_id":1}` (background=true) |
| `{"cvs.status":1}` (background=true) |
| `{"education.education_level_id":1}` (background=true) |
| `{"skills.skill_id":1}` (background=true) |
| `{"languages.language_id":1}` (background=true) |
| `{"job_names":1}` (background=true) |
| `{"job_types":1}` (background=true) |
| `{"preferred_work_modes":1}` (background=true) |
| `{"preferred_countries":1}` (background=true) |
| `{"expected_salary.currency_id":1}` (background=true) |
| `{"expected_salary.currency_code":1}` (background=true) |
| `{"expected_salary.min_base":1}` (background=true) |
| `{"expected_salary.max_base":1}` (background=true) |
| `{"notice_period_id":1}` (background=true) |
| `{"is_can_move":1}` (background=true) |
| `{"is_free_for_work":1}` (background=true) |
| `{"work_location":1}` (background=true) |
| `{"profile_visibility":1}` (background=true) |
| `{"job_alerts.job_type_id":1}` (background=true) |
| `{"job_alerts.work_mode_id":1}` (background=true) |
| `{"job_alerts.is_active":1}` (background=true) |
| `{"search_filters.text.all":1}` (background=true) |
| `{"search_filters.career.candidate_stage":1}` (background=true) |
| `{"search_filters.career.is_student":1}` (background=true) |
| `{"search_filters.career.graduation_year":1}` (background=true) |
| `{"search_filters.career.experience_years":1}` (background=true) |
| `{"search_filters.career.experience_level_id":1}` (background=true) |
| `{"search_filters.career.notice_period_id":1}` (background=true) |
| `{"search_filters.career.work_location":1}` (background=true) |
| `{"search_filters.career.is_can_move":1}` (background=true) |
| `{"search_filters.career.is_free_for_work":1}` (background=true) |
| `{"search_filters.career.profile_visibility":1}` (background=true) |
| `{"search_filters.career.accepted":1}` (background=true) |
| `{"search_filters.career.status":1}` (background=true) |
| `{"search_filters.job_names.ids":1}` (background=true) |
| `{"search_filters.job_types.ids":1}` (background=true) |
| `{"search_filters.skills.ids":1}` (background=true) |
| `{"search_filters.skills.min_level":1}` (background=true) |
| `{"search_filters.skills.max_level":1}` (background=true) |
| `{"search_filters.skills.max_years":1}` (background=true) |
| `{"search_filters.languages.ids":1}` (background=true) |
| `{"search_filters.languages.min_level":1}` (background=true) |
| `{"search_filters.languages.max_level":1}` (background=true) |
| `{"search_filters.education.level_ids":1}` (background=true) |
| `{"search_filters.preferred_work_modes.ids":1}` (background=true) |
| `{"search_filters.preferred_countries.values":1}` (background=true) |
| `{"search_filters.preferred_countries.country_codes":1}` (background=true) |
| `{"search_filters.salary.min":1}` (background=true) |
| `{"search_filters.salary.max":1}` (background=true) |
| `{"search_filters.salary.min_base":1}` (background=true) |
| `{"search_filters.salary.max_base":1}` (background=true) |
| `{"search_filters.salary.currency_id":1}` (background=true) |
| `{"search_filters.salary.currency_code":1}` (background=true) |
| `{"expected_salary.min_base":1}` (background=true) |
| `{"expected_salary.max_base":1}` (background=true) |
| `{"expected_salary.currency_code":1}` (background=true) |
| `{"accepted":1,"status":1,"is_free_for_work":1}` (background=true) |
| `{"candidate_stage":1,"experience_years":1}` (background=true) |
| `{"skills.skill_id":1}` (background=true) |
| `{"preferred_countries":1}` (background=true) |
| `{"job_names":1}` (background=true) |
| `{"job_types":1}` (background=true) |
| `{"preferred_work_modes":1}` (background=true) |
| `{"search_filters.career.accepted":1,"search_filters.career.status":1}` (background=true) |
| `{"search_filters.career.is_free_for_work":1}` (background=true) |
| `{"search_filters.career.candidate_stage":1}` (background=true) |
| `{"search_filters.career.experience_years":1}` (background=true) |
| `{"search_filters.career.work_location":1}` (background=true) |
| `{"search_filters.job_name.ids":1}` (background=true) |
| `{"search_filters.job_name.keywords":1}` (background=true) |
| `{"search_filters.job_types.ids":1}` (background=true) |
| `{"search_filters.job_types.names":1}` (background=true) |
| `{"search_filters.skills.ids":1}` (background=true) |
| `{"search_filters.skills.categories":1}` (background=true) |
| `{"search_filters.languages.ids":1}` (background=true) |
| `{"search_filters.education.level_ids":1}` (background=true) |
| `{"search_filters.preferred_work_modes.ids":1}` (background=true) |
| `{"search_filters.preferred_countries.values":1}` (background=true) |
| `{"search_filters.preferred_countries.country_codes":1}` (background=true) |
| `{"search_filters.salary.min_base":1}` (background=true) |
| `{"search_filters.salary.max_base":1}` (background=true) |
| `{"matching_profile.normalized_skills":1}` (background=true) |
| `{"matching_profile.normalized_languages":1}` (background=true) |
| `{"matching_profile.normalized_titles":1}` (background=true) |
| `{"matching_profile.preferred_country_values":1}` (background=true) |
| `{"matching_profile.preferred_work_mode_keys":1}` (background=true) |
| `{"matching_profile.seniority_score":-1}` (background=true) |
| `{"matching_profile.salary_min_base":1}` (background=true) |
| `{"matching_profile.salary_max_base":1}` (background=true) |
| `{"matching_profile.searchable_tokens":1}` (background=true) |
| `{"profile_headline":"text","current_job_title":"text","about_me":"text","search_filters.text.all":"text"}` (background=true) |

## experience_levels

| Item | Value |
|---|---|
| Collection | `experience_levels` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `min_years` | Number |  | 0 |  |  |
| `max_years` | Number |  | null |  |  |
| `keywords_ar` | Array<String> |  | defaultFn |  |  |
| `keywords_en` | Array<String> |  | defaultFn |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `is_active` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"key":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## FcmToken

| Item | Value |
|---|---|
| Collection | `fcm_tokens` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user` | ObjectID | yes |  |  | users |
| `token` | String | yes |  |  |  |
| `platform` | String | yes |  | android, ios, web |  |
| `device_id` | String |  |  |  |  |
| `brand` | String |  |  |  |  |
| `model_name` | String | yes |  |  |  |
| `model_id` | String |  | null |  |  |
| `build_id` | String |  |  |  |  |
| `is_default` | Boolean |  | false |  |  |
| `lang` | String |  | en | ar, en |  |
| `revoked` | Boolean |  | false |  |  |
| `last_seen_at` | Date |  | now |  |  |
| `last_error` | String |  | null |  |  |
| `topics` | Array<String> |  | defaultFn |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user":1}` (background=true) |
| `{"token":1}` (unique=true, background=true) |
| `{"device_id":1}` (background=true) |
| `{"user":1,"device_id":1}` (unique=true, sparse=true, background=true) |

## fonts

| Item | Value |
|---|---|
| Collection | `fonts` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `file` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

No explicit schema indexes.

## industries

| Item | Value |
|---|---|
| Collection | `industries` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keywords_ar` | Array<String> |  | defaultFn |  |  |
| `keywords_en` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"key":1}` (unique=true, background=true) |
| `{"title_ar":"text","title_en":"text","keywords_ar":"text","keywords_en":"text"}` (background=true) |

## interviews

| Item | Value |
|---|---|
| Collection | `interviews` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `application_id` | ObjectID | yes |  |  | user_applying_job |
| `job_id` | ObjectID | yes |  |  | jobs |
| `company_id` | ObjectID | yes |  |  | companies |
| `employee_user_id` | ObjectID | yes |  |  | users |
| `scheduled_by` | ObjectID |  | null |  | users |
| `type` | String |  | online | online, in_office, phone, on_app |  |
| `status` | String |  | scheduled | scheduled, rescheduled, completed, cancelled, no_show, accepted, rejected |  |
| `start_at` | Date | yes |  |  |  |
| `end_at` | Date |  | null |  |  |
| `timezone` | String |  | UTC |  |  |
| `meet_link` | String |  |  |  |  |
| `office_address` | String |  |  |  |  |
| `longitude` | Number |  | null |  |  |
| `latitude` | Number |  | null |  |  |
| `company_note` | String |  |  |  |  |
| `candidate_note` | String |  |  |  |  |
| `result_note` | String |  |  |  |  |
| `rating` | Number |  | null |  |  |
| `scorecard.technical` | Number |  | null |  |  |
| `scorecard.communication` | Number |  | null |  |  |
| `scorecard.culture_fit` | Number |  | null |  |  |
| `scorecard.overall` | Number |  | null |  |  |
| `scorecard.recommendation` | String |  |  | , hire, maybe, reject |  |
| `scorecard.notes` | String |  |  |  |  |
| `completed_at` | Date |  | null |  |  |
| `cancelled_reason` | String |  |  |  |  |
| `reschedule_count` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"application_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"employee_user_id":1}` (background=true) |
| `{"type":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"start_at":1}` (background=true) |
| `{"application_id":1,"start_at":-1}` (background=true) |
| `{"company_id":1,"status":1,"start_at":1}` (background=true) |
| `{"employee_user_id":1,"status":1,"start_at":1}` (background=true) |

## job_employee_matches

| Item | Value |
|---|---|
| Collection | `job_employee_matches` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `job_id` | ObjectID | yes |  |  | jobs |
| `employee_id` | ObjectID | yes |  |  | employees |
| `company_id` | ObjectID | yes |  |  | companies |
| `user_id` | ObjectID |  | null |  | users |
| `score` | Number |  | 0 |  |  |
| `breakdown.skills` | Number |  | 0 |  |  |
| `breakdown.experience` | Number |  | 0 |  |  |
| `breakdown.location` | Number |  | 0 |  |  |
| `breakdown.salary` | Number |  | 0 |  |  |
| `breakdown.work_mode` | Number |  | 0 |  |  |
| `breakdown.language` | Number |  | 0 |  |  |
| `matched_skills` | Array<String> |  | defaultFn |  |  |
| `missing_skills` | Array<String> |  | defaultFn |  |  |
| `matched_languages` | Array<String> |  | defaultFn |  |  |
| `missing_languages` | Array<String> |  | defaultFn |  |  |
| `is_recommended_to_employee` | Boolean |  | true |  |  |
| `is_recommended_to_company` | Boolean |  | true |  |  |
| `algorithm_version` | String |  | projection-matching-v1 |  |  |
| `generated_at` | Date |  | now |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"job_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"score":1}` (background=true) |
| `{"is_recommended_to_employee":1}` (background=true) |
| `{"is_recommended_to_company":1}` (background=true) |
| `{"generated_at":1}` (background=true) |
| `{"job_id":1,"employee_id":1}` (unique=true, background=true) |
| `{"employee_id":1,"score":-1,"generated_at":-1}` (background=true) |
| `{"user_id":1,"score":-1,"generated_at":-1}` (background=true) |
| `{"job_id":1,"score":-1,"generated_at":-1}` (background=true) |
| `{"company_id":1,"score":-1,"generated_at":-1}` (background=true) |

## job_invitations

| Item | Value |
|---|---|
| Collection | `job_invitations` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID | yes |  |  | companies |
| `job_id` | ObjectID | yes |  |  | jobs |
| `employee_id` | ObjectID | yes |  |  | employees |
| `user_id` | ObjectID | yes |  |  | users |
| `sent_by` | ObjectID | yes |  |  | users |
| `status` | String |  | sent | sent, seen, accepted, declined, expired, cancelled |  |
| `message` | String |  |  |  |  |
| `salary_offer` | String |  |  |  |  |
| `starts_at` | Date |  | null |  |  |
| `expires_at` | Date |  | null |  |  |
| `responded_at` | Date |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"expires_at":1}` (background=true) |
| `{"job_id":1,"employee_id":1}` (unique=true, background=true) |
| `{"company_id":1,"status":1,"createdAt":-1}` (background=true) |

## job_matches

| Item | Value |
|---|---|
| Collection | `job_matches` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `job_id` | ObjectID | yes |  |  | jobs |
| `employee_id` | ObjectID | yes |  |  | employees |
| `user_id` | ObjectID | yes |  |  | users |
| `score` | Number | yes |  |  |  |
| `matched_skills` | Array<String> |  | defaultFn |  |  |
| `missing_skills` | Array<String> |  | defaultFn |  |  |
| `matched_reasons` | Array<String> |  | defaultFn |  |  |
| `warnings` | Array<String> |  | defaultFn |  |  |
| `algorithm_version` | String |  | v1 |  |  |
| `calculated_at` | Date |  | now |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"job_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"score":1}` (background=true) |
| `{"job_id":1,"employee_id":1}` (unique=true, background=true) |
| `{"employee_id":1,"score":-1}` (background=true) |
| `{"job_id":1,"score":-1}` (background=true) |

## job_name

| Item | Value |
|---|---|
| Collection | `job_name` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `sheet` | ObjectID |  | null |  | Sheet |
| `sector_ar` | String |  |  |  |  |
| `sector_en` | String |  |  |  |  |
| `subSector_ar` | String |  |  |  |  |
| `subSector_en` | String |  |  |  |  |
| `title_ar` | String |  |  |  |  |
| `title_en` | String |  |  |  |  |
| `keywords` | Array<String> |  | defaultFn |  |  |
| `is_auto` | Boolean |  | true |  |  |
| `dedupeKey` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"sheet":1}` (background=true) |
| `{"dedupeKey":1}` (background=true) |
| `{"sheet":1,"dedupeKey":1}` (unique=true, background=true) |

## job_reports

| Item | Value |
|---|---|
| Collection | `job_reports` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID | yes |  |  | jobs |
| `company_id` | ObjectID |  | null |  | companies |
| `reason` | String | yes |  | fake_job, spam, scam, wrong_information, discrimination, abuse, expired, other |  |
| `message` | String |  |  |  |  |
| `status` | String |  | pending | pending, reviewing, resolved, rejected |  |
| `reviewed_by` | ObjectID |  | null |  | users |
| `reviewed_at` | Date |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |
| `{"status":1,"createdAt":-1}` (background=true) |

## job_salary

| Item | Value |
|---|---|
| Collection | `job_salary` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keyword` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## job_service

| Item | Value |
|---|---|
| Collection | `job_service` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keyword` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## job_type

| Item | Value |
|---|---|
| Collection | `job_type` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keyword` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## jobs

| Item | Value |
|---|---|
| Collection | `jobs` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `search_projection.company.id` | ObjectID |  | null |  | companies |
| `search_projection.company.name` | String |  |  |  |  |
| `search_projection.company.logo` | String |  | null |  |  |
| `search_projection.company.industry_name` | String |  |  |  |  |
| `search_projection.company.company_size_type` | String |  | unknown |  |  |
| `search_projection.company.company_type` | String |  |  |  |  |
| `search_projection.company.country` | String |  |  |  |  |
| `search_projection.company.city` | String |  |  |  |  |
| `search_projection.company.verified` | Boolean |  | false |  |  |
| `search_projection.company.rating` | Number |  | 0 |  |  |
| `search_projection.company.active_jobs_count` | Number |  | 0 |  |  |
| `search_projection.requirements.skills` | Array<String> |  | defaultFn |  |  |
| `search_projection.requirements.languages` | Array<String> |  | defaultFn |  |  |
| `search_projection.requirements.countries` | Array<String> |  | defaultFn |  |  |
| `search_projection.requirements.work_mode` | String |  |  |  |  |
| `search_projection.requirements.job_type` | String |  |  |  |  |
| `search_projection.requirements.work_time` | String |  |  |  |  |
| `search_projection.requirements.experience_level` | String |  |  |  |  |
| `search_projection.requirements.education_level` | String |  |  |  |  |
| `search_projection.requirements.min_experience_years` | Number |  | 0 |  |  |
| `search_projection.requirements.max_experience_years` | Number |  | null |  |  |
| `search_projection.requirements.salary_min_usd` | Number |  | null |  |  |
| `search_projection.requirements.salary_max_usd` | Number |  | null |  |  |
| `search_projection.requirements.candidate_target` | Array<String> |  | defaultFn |  |  |
| `search_projection.requirements.is_remote` | Boolean |  | false |  |  |
| `search_projection.ranking.quality_score` | Number |  | 0 |  |  |
| `search_projection.ranking.freshness_score` | Number |  | 0 |  |  |
| `search_projection.ranking.popularity_score` | Number |  | 0 |  |  |
| `search_projection.ranking.company_score` | Number |  | 0 |  |  |
| `search_projection.ranking.total_score` | Number |  | 0 |  |  |
| `search_projection.matching.tokens` | Array<String> |  | defaultFn |  |  |
| `search_projection.matching.text` | String |  |  |  |  |
| `search_projection.matching.normalized_skills` | Array<String> |  | defaultFn |  |  |
| `search_projection.matching.normalized_titles` | Array<String> |  | defaultFn |  |  |
| `search_index.title_norm` | String |  |  |  |  |
| `search_index.description_norm` | String |  |  |  |  |
| `search_index.text_norm` | String |  |  |  |  |
| `search_index.tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.phrases` | Array<String> |  | defaultFn |  |  |
| `search_index.aliases` | Array<String> |  | defaultFn |  |  |
| `search_index.title_tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.skill_tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.company_tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.service_tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.country_tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.sector_tokens` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.countries` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.cities` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.city` | String |  |  |  |  |
| `search_index.filters.job_type` | String |  |  |  |  |
| `search_index.filters.job_type_id` | String |  |  |  |  |
| `search_index.filters.work_time` | String |  |  |  |  |
| `search_index.filters.job_time_id` | String |  |  |  |  |
| `search_index.filters.work_mode` | String |  |  |  |  |
| `search_index.filters.work_mode_id` | String |  |  |  |  |
| `search_index.filters.salary_type` | String |  |  |  |  |
| `search_index.filters.job_salary_id` | String |  |  |  |  |
| `search_index.filters.currency` | String |  |  |  |  |
| `search_index.filters.currency_id` | String |  |  |  |  |
| `search_index.filters.candidate_target` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.experience_level` | String |  |  |  |  |
| `search_index.filters.experience_level_id` | String |  |  |  |  |
| `search_index.filters.education_level` | String |  |  |  |  |
| `search_index.filters.education_level_id` | String |  |  |  |  |
| `search_index.filters.is_remote` | Boolean |  | false |  |  |
| `search_index.filters.is_for_students` | Boolean |  | false |  |  |
| `search_index.filters.is_for_graduates` | Boolean |  | false |  |  |
| `search_index.filters.is_for_fresh_graduates` | Boolean |  | false |  |  |
| `search_index.filters.languages` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.skills` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.services` | Array<String> |  | defaultFn |  |  |
| `search_index.filters.salary_min` | Number |  | null |  |  |
| `search_index.filters.salary_max` | Number |  | null |  |  |
| `search_index.filters.salary_min_usd` | Number |  | null |  |  |
| `search_index.filters.salary_max_usd` | Number |  | null |  |  |
| `search_index.score_signals.rating` | Number |  | 0 |  |  |
| `search_index.score_signals.views` | Number |  | 0 |  |  |
| `search_index.score_signals.saves` | Number |  | 0 |  |  |
| `search_index.score_signals.applies` | Number |  | 0 |  |  |
| `search_index.score_signals.reviews` | Number |  | 0 |  |  |
| `job_name` | String | yes |  |  |  |
| `job_name_id` | ObjectID |  | null |  | job_name |
| `description` | String | yes |  |  |  |
| `ref` | String |  |  |  |  |
| `job_keywords` | Array<String> |  | defaultFn |  |  |
| `keywords_norm` | Array<String> |  | defaultFn |  |  |
| `phrases_norm` | Array<String> |  | defaultFn |  |  |
| `status` | Boolean |  | true |  |  |
| `is_accepted` | Boolean |  | false |  |  |
| `publish_status` | String |  | pending_review | pending_review, published, paused, closed, rejected, archived |  |
| `started_date` | Date |  | null |  |  |
| `end_date` | Date |  | null |  |  |
| `apply_deadline` | Date |  | null |  |  |
| `closing_mode` | String |  | fixed_date | fixed_date, continuous_until_filled, immediate_hiring |  |
| `hide_closing_date` | Boolean |  | false |  |  |
| `is_update` | Boolean |  | false |  |  |
| `vacancies_count` | Number |  | 1 |  |  |
| `priority` | Number |  | 0 |  |  |
| `reviewed_at` | Date |  | null |  |  |
| `reviewed_by` | ObjectID |  | null |  | users |
| `rejection_reason` | String |  |  |  |  |
| `trust` | Embedded |  | default |  |  |
| `job_lifecycle` | Embedded |  | default |  |  |
| `countries` | Array<String> |  | defaultFn |  |  |
| `cities` | Array<String> |  | defaultFn |  |  |
| `city` | String |  |  |  |  |
| `address` | String |  |  |  |  |
| `work_location_scope` | String |  | local | local, international, both |  |
| `work_mode_id` | ObjectID | yes |  |  | work_modes |
| `work_mode_info` | Embedded |  | default |  |  |
| `is_remote` | Boolean |  | false |  |  |
| `job_type_id` | ObjectID | yes |  |  | job_type |
| `job_type_info` | Embedded |  | default |  |  |
| `job_time_id` | ObjectID | yes |  |  | work_time |
| `job_time_info` | Embedded |  | default |  |  |
| `job_salary_id` | ObjectID | yes |  |  | job_salary |
| `job_salary_info` | Embedded |  | default |  |  |
| `experience_level_id` | ObjectID |  | null |  | experience_levels |
| `experience_level_info` | Embedded |  | default |  |  |
| `min_experience_years` | Number |  | 0 |  |  |
| `max_experience_years` | Number |  | null |  |  |
| `education_level_id` | ObjectID |  | null |  | education_levels |
| `education_level_info` | Embedded |  | default |  |  |
| `age_min` | Number |  | null |  |  |
| `age_max` | Number |  | null |  |  |
| `gender_requirement` | String |  | any | any, male, female |  |
| `marital_status` | Array<String> |  | defaultFn |  |  |
| `academic_certificates` | Array<String> |  | defaultFn |  |  |
| `professional_certificates` | Array<String> |  | defaultFn |  |  |
| `driving_license_required` | Boolean |  | false |  |  |
| `candidate_target` | Array<String> |  | defaultFn | students, graduates, fresh_graduates, experienced, career_changers, all |  |
| `is_for_students` | Boolean |  | false |  |  |
| `is_for_graduates` | Boolean |  | false |  |  |
| `is_for_fresh_graduates` | Boolean |  | false |  |  |
| `skills_required` | Array<Function> |  | function |  |  |
| `skills_optional` | Array<Function> |  | function |  |  |
| `languages` | Array<Function> |  | function |  |  |
| `salary.min` | Number |  | null |  |  |
| `salary.max` | Number |  | null |  |  |
| `salary.currency_id` | ObjectID | yes |  |  | currencies |
| `salary.currency_code` | String | yes |  |  |  |
| `salary.currency_rate_snapshot` | Number | yes | 1 |  |  |
| `salary.min_usd` | Number |  | null |  |  |
| `salary.max_usd` | Number |  | null |  |  |
| `salary.mode` | String |  | range | fixed, range, negotiable, depends_on_experience, hidden |  |
| `salary.is_visible` | Boolean |  | true |  |  |
| `salary.is_negotiable` | Boolean |  | false |  |  |
| `job_services` | Array<Function> |  | function |  |  |
| `show_company_information` | Boolean |  | true |  |  |
| `is_send_emails` | Boolean |  | false |  |  |
| `is_cv_required` | Boolean |  | true |  |  |
| `is_contact_on_emails` | Boolean |  | false |  |  |
| `emails` | Array<String> |  |  |  |  |
| `is_out_side` | Boolean |  | false |  |  |
| `out_link` | String |  |  |  |  |
| `user_show` | Number |  | 0 |  |  |
| `user_review` | Number |  | 0 |  |  |
| `user_applying` | Number |  | 0 |  |  |
| `out_side_applying` | Number |  | 0 |  |  |
| `user_saved` | Number |  | 0 |  |  |
| `rating` | Number |  | 0 |  |  |
| `questions` | Array<Function> |  | function |  |  |
| `ats_settings` | Embedded |  | default |  |  |
| `created_by` | ObjectID |  | null |  | users |
| `updated_by` | ObjectID |  | null |  | users |
| `stopped_by` | ObjectID |  | null |  | users |
| `archived_by` | ObjectID |  | null |  | users |
| `deleted_by` | ObjectID |  | null |  | users |
| `deleted_at` | Date |  | null |  |  |
| `last_action` | String |  |  |  |  |
| `company_id` | ObjectID | yes |  |  | companies |
| `user_id` | ObjectID | yes |  |  | users |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"ref":1}` (unique=true, sparse=true, background=true) |
| `{"status":1}` (background=true) |
| `{"is_accepted":1}` (background=true) |
| `{"publish_status":1}` (background=true) |
| `{"apply_deadline":1}` (background=true) |
| `{"closing_mode":1}` (background=true) |
| `{"trust.score":1}` (background=true) |
| `{"trust.risk_level":1}` (background=true) |
| `{"trust.report_count":1}` (background=true) |
| `{"trust.review_status":1}` (background=true) |
| `{"trust.document_request.status":1}` (background=true) |
| `{"trust.document_response.status":1}` (background=true) |
| `{"job_lifecycle.auto_closed_at":1}` (background=true) |
| `{"cities":1}` (background=true) |
| `{"work_location_scope":1}` (background=true) |
| `{"experience_level_id":1}` (background=true) |
| `{"education_level_id":1}` (background=true) |
| `{"candidate_target":1}` (background=true) |
| `{"is_for_students":1}` (background=true) |
| `{"is_for_graduates":1}` (background=true) |
| `{"is_for_fresh_graduates":1}` (background=true) |
| `{"questions.is_knockout":1}` (background=true) |
| `{"created_by":1}` (background=true) |
| `{"updated_by":1}` (background=true) |
| `{"deleted_at":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"ref":1}` (unique=true, sparse=true, background=true) |
| `{"status":1,"is_accepted":1,"publish_status":1,"createdAt":-1}` (background=true) |
| `{"publish_status":1,"status":1,"apply_deadline":1}` (background=true) |
| `{"publish_status":1,"status":1,"end_date":1}` (background=true) |
| `{"job_lifecycle.auto_closed_at":1}` (background=true) |
| `{"company_id":1,"status":1,"is_accepted":1}` (background=true) |
| `{"company_id":1,"deleted_at":1,"createdAt":-1}` (background=true) |
| `{"countries":1,"status":1,"is_accepted":1,"createdAt":-1}` (background=true) |
| `{"cities":1,"status":1,"is_accepted":1,"createdAt":-1}` (background=true) |
| `{"candidate_target":1,"createdAt":-1}` (background=true) |
| `{"job_type_id":1,"createdAt":-1}` (background=true) |
| `{"work_mode_id":1,"createdAt":-1}` (background=true) |
| `{"job_time_id":1,"createdAt":-1}` (background=true) |
| `{"job_salary_id":1,"createdAt":-1}` (background=true) |
| `{"experience_level_id":1,"createdAt":-1}` (background=true) |
| `{"education_level_id":1,"createdAt":-1}` (background=true) |
| `{"skills_required.skill_id":1}` (background=true) |
| `{"salary.currency_code":1}` (background=true) |
| `{"salary.min_usd":1}` (background=true) |
| `{"salary.max_usd":1}` (background=true) |
| `{"keywords_norm":1}` (background=true) |
| `{"phrases_norm":1}` (background=true) |
| `{"search_index.tokens":1}` (background=true) |
| `{"search_index.phrases":1}` (background=true) |
| `{"search_index.aliases":1}` (background=true) |
| `{"search_index.filters.countries":1}` (background=true) |
| `{"search_index.filters.cities":1}` (background=true) |
| `{"search_index.filters.job_type":1}` (background=true) |
| `{"search_index.filters.work_time":1}` (background=true) |
| `{"search_index.filters.work_mode":1}` (background=true) |
| `{"search_index.filters.salary_type":1}` (background=true) |
| `{"search_index.filters.currency":1}` (background=true) |
| `{"search_index.filters.salary_min_usd":1}` (background=true) |
| `{"search_index.filters.salary_max_usd":1}` (background=true) |
| `{"search_index.filters.skills":1}` (background=true) |
| `{"search_index.filters.languages":1}` (background=true) |
| `{"search_index.filters.services":1}` (background=true) |
| `{"search_index.filters.candidate_target":1}` (background=true) |
| `{"search_index.filters.is_remote":1}` (background=true) |
| `{"search_index.title_norm":"text","search_index.text_norm":"text"}` (background=true) |
| `{"job_name":"text","description":"text"}` (background=true) |
| `{"search_projection.company.id":1}` (background=true) |
| `{"search_projection.company.industry_name":1}` (background=true) |
| `{"search_projection.requirements.skills":1}` (background=true) |
| `{"search_projection.requirements.languages":1}` (background=true) |
| `{"search_projection.requirements.countries":1}` (background=true) |
| `{"search_projection.requirements.work_mode":1}` (background=true) |
| `{"search_projection.requirements.job_type":1}` (background=true) |
| `{"search_projection.requirements.experience_level":1}` (background=true) |
| `{"search_projection.requirements.education_level":1}` (background=true) |
| `{"search_projection.requirements.salary_min_usd":1}` (background=true) |
| `{"search_projection.requirements.salary_max_usd":1}` (background=true) |
| `{"search_projection.ranking.total_score":-1}` (background=true) |
| `{"search_projection.matching.tokens":1}` (background=true) |
| `{"search_projection.matching.text":"text"}` (background=true) |
| `{"trust.risk_level":1,"trust.report_count":-1,"updatedAt":-1}` (background=true) |
| `{"trust.review_status":1,"updatedAt":-1}` (background=true) |

## jobzain_talent_requests

| Item | Value |
|---|---|
| Collection | `jobzain_talent_requests` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `company_id` | ObjectID | yes |  |  | companies |
| `requested_by_user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID |  | null |  | jobs |
| `title` | String |  |  |  |  |
| `description` | String |  |  |  |  |
| `required_skills` | Array<String> |  | defaultFn |  |  |
| `preferred_skills` | Array<String> |  | defaultFn |  |  |
| `countries` | Array<String> |  | defaultFn |  |  |
| `cities` | Array<String> |  | defaultFn |  |  |
| `work_mode_id` | ObjectID |  | null |  | work_modes |
| `job_type_id` | ObjectID |  | null |  | job_type |
| `experience_level_id` | ObjectID |  | null |  | experience_levels |
| `education_level_id` | ObjectID |  | null |  | education_levels |
| `min_experience_years` | Number |  | 0 |  |  |
| `max_experience_years` | Number |  | null |  |  |
| `salary_min` | Number |  | null |  |  |
| `salary_max` | Number |  | null |  |  |
| `currency_code` | String |  |  |  |  |
| `priority` | String |  | normal | low, normal, high, urgent |  |
| `status` | String |  | new | new, in_progress, candidates_sent, closed, cancelled |  |
| `requested_count` | Number |  | 5 |  |  |
| `notes` | Array<Function> |  | function |  |  |
| `admin_note` | String |  |  |  |  |
| `closed_at` | Date |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"company_id":1}` (background=true) |
| `{"requested_by_user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"work_mode_id":1}` (background=true) |
| `{"job_type_id":1}` (background=true) |
| `{"experience_level_id":1}` (background=true) |
| `{"education_level_id":1}` (background=true) |
| `{"priority":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"company_id":1,"createdAt":-1}` (background=true) |
| `{"job_id":1,"status":1}` (background=true) |
| `{"status":1,"priority":1,"createdAt":-1}` (background=true) |

## keyword

| Item | Value |
|---|---|
| Collection | `Keywords` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `type` | String |  | app | app, web, employee_dash, company_dash, admin_dash |  |
| `inputs` | Array<Function> |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

| Index |
| --- |
| `{"type":1}` (unique=true, background=true) |
| `{"inputs.name":1}` (unique=true, background=true) |

## languages

| Item | Value |
|---|---|
| Collection | `languages` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |

## Notification

| Item | Value |
|---|---|
| Collection | `notification` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `title` | String | yes |  |  |  |
| `body` | Mixed | yes |  |  |  |
| `screen` | String |  |  |  |  |
| `order_id` | String |  |  |  |  |
| `imageUrl` | String |  | null |  |  |
| `read` | Boolean |  | false |  |  |
| `user_id` | ObjectID | yes |  |  | users |
| `type` | String |  | notification |  |  |
| `audience` | String |  | unknown | employee, company, admin, app, unknown |  |
| `route_key` | String |  |  |  |  |
| `route_path` | String |  |  |  |  |
| `target_url` | String |  |  |  |  |
| `url` | String |  |  |  |  |
| `data` | Mixed |  | function |  |  |
| `dedupeKey` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"read":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"type":1}` (background=true) |
| `{"audience":1}` (background=true) |
| `{"dedupeKey":1}` (background=true) |
| `{"user_id":1,"read":1,"createdAt":-1}` (background=true) |
| `{"user_id":1,"type":1,"createdAt":-1}` (background=true) |
| `{"user_id":1,"dedupeKey":1}` (unique=true, partialFilterExpression={"dedupeKey":{"$exists":true,"$type":"string"}}, background=true) |

## NotificationPreference

| Item | Value |
|---|---|
| Collection | `notification_preferences` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `channels` | Embedded |  | default |  |  |
| `categories` | Embedded |  | default |  |  |
| `quiet_hours` | Embedded |  | default |  |  |
| `lang` | String |  | en | ar, en |  |
| `updated_by` | ObjectID |  | null |  | users |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (unique=true, background=true) |

## pages

| Item | Value |
|---|---|
| Collection | `pages` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `image` | String |  |  |  |  |
| `title_ar` | String |  |  |  |  |
| `title_en` | String |  |  |  |  |
| `description_ar` | String |  |  |  |  |
| `description_en` | String |  |  |  |  |
| `content` | Array<Function> |  | function |  |  |
| `status` | Boolean |  | true |  |  |
| `is_ios` | Boolean |  | false |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"status":1}` (background=true) |
| `{"status":1,"createdAt":-1}` (background=true) |

## permissions

| Item | Value |
|---|---|
| Collection | `permissions` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `group` | String | yes |  |  |  |
| `action` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `description_ar` | String |  | null |  |  |
| `description_en` | String |  | null |  |  |
| `status` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"group":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"key":1}` (unique=true, background=true) |
| `{"group":1,"action":1}` (background=true) |

## RefreshToken

| Item | Value |
|---|---|
| Collection | `refreshtokens` |
| Timestamps | no |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `userRef` | String | yes |  |  | users |
| `loginTime` | Date | yes |  |  |  |
| `device` | Mixed |  |  |  |  |
| `token` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |

### Indexes

| Index |
| --- |
| `{"userRef":1}` (background=true) |
| `{"token":1}` (background=true) |

## resumes

| Item | Value |
|---|---|
| Collection | `resumes` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `image` | String |  |  |  |  |
| `is_generate` | Boolean |  | false |  |  |
| `employee_id` | ObjectID | yes |  |  | employees |
| `color_id` | ObjectID |  |  |  | colors |
| `font_id` | ObjectID |  |  |  | fonts |
| `file` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"employee_id":1}` (background=true) |

## roles

| Item | Value |
|---|---|
| Collection | `roles` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `log_to` | String | yes |  | employee, company, dash |  |
| `name` | String | yes |  |  |  |
| `role_number` | Number | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `permissions` | Array<ObjectID> |  | defaultFn |  | permissions |
| `status` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | false |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"log_to":1}` (background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"role_number":1}` (unique=true, background=true) |
| `{"status":1}` (background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"log_to":1}` (background=true) |

## scheduled_job_locks

| Item | Value |
|---|---|
| Collection | `scheduled_job_locks` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `owner` | String |  |  |  |  |
| `locked_until` | Date |  | null |  |  |
| `last_started_at` | Date |  | null |  |  |
| `last_finished_at` | Date |  | null |  |  |
| `last_success_at` | Date |  | null |  |  |
| `last_error` | String |  |  |  |  |
| `run_count` | Number |  | 0 |  |  |
| `fail_count` | Number |  | 0 |  |  |
| `last_stats` | Mixed |  | function |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"locked_until":1}` (background=true) |
| `{"key":1,"locked_until":1}` (background=true) |

## search_history

| Item | Value |
|---|---|
| Collection | `search_history` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID |  | null |  | users |
| `type` | String |  | job | job, company, employee |  |
| `query` | String |  |  |  |  |
| `query_norm` | String |  |  |  |  |
| `filters` | Mixed |  | function |  |  |
| `result_count` | Number |  | 0 |  |  |
| `ip` | String |  |  |  |  |
| `user_agent` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"type":1}` (background=true) |
| `{"query_norm":1}` (background=true) |
| `{"user_id":1,"type":1,"createdAt":-1}` (background=true) |
| `{"query_norm":1,"createdAt":-1}` (background=true) |

## sheet

| Item | Value |
|---|---|
| Collection | `sheets` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `totalRows` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |

## skills

| Item | Value |
|---|---|
| Collection | `skills` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `category` | String |  | general |  |  |
| `keywords_ar` | Array<String> |  | defaultFn |  |  |
| `keywords_en` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"category":1}` (background=true) |
| `{"is_active":1}` (background=true) |
| `{"key":1}` (unique=true, background=true) |
| `{"title_ar":"text","title_en":"text","keywords_ar":"text","keywords_en":"text"}` (background=true) |

## student_verifications

| Item | Value |
|---|---|
| Collection | `student_verifications` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `employee_id` | ObjectID |  | null |  | employees |
| `university_id` | ObjectID | yes |  |  | universities |
| `method` | String | yes |  | email, document, invite_code, manual |  |
| `status` | String |  | pending | pending, verified, rejected, expired, needs_more_information |  |
| `student_email` | String |  |  |  |  |
| `student_id_number` | String |  |  |  |  |
| `campus` | String |  |  |  |  |
| `faculty_major` | String |  |  |  |  |
| `degree_level` | String |  |  |  |  |
| `graduation_year` | Number |  | null |  |  |
| `invite_code` | String |  |  |  |  |
| `document_url` | String |  |  |  |  |
| `submitted_payload` | Mixed |  | function |  |  |
| `email_code_hash` | String |  |  |  |  |
| `email_code_expires_at` | Date |  | null |  |  |
| `email_confirmed_at` | Date |  | null |  |  |
| `reviewed_by` | ObjectID |  | null |  | users |
| `reviewed_at` | Date |  | null |  |  |
| `rejection_reason` | String |  |  |  |  |
| `requested_information` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"university_id":1}` (background=true) |
| `{"method":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"student_email":1}` (background=true) |
| `{"graduation_year":1}` (background=true) |
| `{"user_id":1,"university_id":1,"status":1}` (background=true) |
| `{"university_id":1,"status":1,"createdAt":-1}` (background=true) |
| `{"student_email":1,"university_id":1}` (background=true) |

## subscription_plans

| Item | Value |
|---|---|
| Collection | `subscription_plans` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `description_ar` | String |  |  |  |  |
| `description_en` | String |  |  |  |  |
| `price` | Number |  | 0 |  |  |
| `currency_code` | String |  | USD |  |  |
| `billing_period` | String |  | free | free, monthly, quarterly, yearly, lifetime, custom |  |
| `features` | Embedded |  | default |  |  |
| `limits` | Embedded |  | default |  |  |
| `jobs_require_admin_approval` | Boolean |  | true |  |  |
| `trial_days` | Number |  | 0 |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `is_default` | Boolean |  | false |  |  |
| `is_system` | Boolean |  | false |  |  |
| `status` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"billing_period":1}` (background=true) |
| `{"jobs_require_admin_approval":1}` (background=true) |
| `{"sort_order":1}` (background=true) |
| `{"is_default":1}` (background=true) |
| `{"is_system":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"status":1,"sort_order":1}` (background=true) |
| `{"title_ar":"text","title_en":"text","description_ar":"text","description_en":"text","key":"text"}` (background=true) |

## universities

| Item | Value |
|---|---|
| Collection | `universities` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `name_en` | String |  |  |  |  |
| `logo` | String |  |  |  |  |
| `city` | String |  |  |  |  |
| `country` | String |  |  |  |  |
| `email_domain` | String | yes |  |  |  |
| `career_center_email` | String | yes |  |  |  |
| `verified` | Boolean |  | false |  |  |
| `students_count` | Number |  | 0 |  |  |
| `campuses` | Array<Function> |  | function |  |  |
| `partners` | Array<Function> |  | function |  |  |
| `status` | String |  | pending | active, suspended, pending |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (background=true) |
| `{"email_domain":1}` (unique=true, background=true) |
| `{"career_center_email":1}` (unique=true, background=true) |
| `{"verified":1}` (background=true) |
| `{"campuses.status":1}` (background=true) |
| `{"partners.company_id":1}` (background=true) |
| `{"partners.status":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"name":"text","name_en":"text","city":"text","country":"text"}` (background=true) |

## university_memberships

| Item | Value |
|---|---|
| Collection | `university_memberships` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `university_id` | ObjectID | yes |  |  | universities |
| `user_id` | ObjectID | yes |  |  | users |
| `role` | String |  | career_center | owner, admin, career_center, advisor, viewer |  |
| `permissions` | Array<String> |  | defaultFn |  |  |
| `status` | String |  | active | active, invited, suspended, removed |  |
| `invited_by` | ObjectID |  | null |  | users |
| `accepted_at` | Date |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"university_id":1}` (background=true) |
| `{"user_id":1}` (background=true) |
| `{"role":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"university_id":1,"user_id":1}` (unique=true, background=true) |
| `{"university_id":1,"status":1,"role":1}` (background=true) |

## university_opportunity_requests

| Item | Value |
|---|---|
| Collection | `university_opportunity_requests` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `university_id` | ObjectID | yes |  |  | universities |
| `requested_by_user_id` | ObjectID | yes |  |  | users |
| `title` | String | yes |  |  |  |
| `description` | String |  |  |  |  |
| `target` | String |  | students | students, fresh_graduates |  |
| `requested_count` | Number |  | 25 |  |  |
| `status` | String |  | new | new, in_progress, published, closed, cancelled |  |
| `note` | String |  |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"university_id":1}` (background=true) |
| `{"requested_by_user_id":1}` (background=true) |
| `{"target":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"university_id":1,"createdAt":-1}` (background=true) |
| `{"status":1,"createdAt":-1}` (background=true) |

## user_applying_job

| Item | Value |
|---|---|
| Collection | `user_applying_job` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `status` | String |  | new | waiting, screening, shortlisted, interview, offer, accepted, hired, rejected, withdrawn, auto_cancel, new, reviewing, initial_match, not_match, contacted, interview_scheduled, interview_completed, archived, offer_declined |  |
| `application_no` | String |  |  |  |  |
| `status_changed_at` | Date |  | null |  |  |
| `user_id` | ObjectID | yes |  |  | users |
| `employee_id` | ObjectID |  | null |  | employees |
| `job_id` | ObjectID | yes |  |  | jobs |
| `company_id` | ObjectID | yes |  |  | companies |
| `first_name` | String | yes |  |  |  |
| `last_name` | String | yes |  |  |  |
| `email` | String | yes |  |  |  |
| `phone_code` | String | yes |  |  |  |
| `phone_national` | String | yes |  |  |  |
| `country_id` | ObjectID | yes |  |  | countries |
| `answers` | Array<Function> |  | function |  |  |
| `cv` | String |  |  |  |  |
| `cover_letter` | String |  |  |  |  |
| `user_job_rating` | Number |  | 0 |  |  |
| `is_collect_rating` | Boolean |  | false |  |  |
| `cv_download` | Boolean |  | false |  |  |
| `is_filter` | Boolean |  | false |  |  |
| `filter_on` | Boolean |  | false |  |  |
| `filter_result.score` | Number |  | null |  |  |
| `filter_result.matched_skills` | Array<String> |  | defaultFn |  |  |
| `filter_result.missing_skills` | Array<String> |  | defaultFn |  |  |
| `filter_result.reason` | String |  |  |  |  |
| `ats_score` | Number |  | null |  |  |
| `ats_summary` | String |  |  |  |  |
| `matching_details` | Mixed |  | function |  |  |
| `knockout_result.has_failed` | Boolean |  | false |  |  |
| `knockout_result.failed_questions` | Array<String> |  | defaultFn |  |  |
| `knockout_result.action` | String |  | none | none, mark_not_match, needs_manual_review, reject |  |
| `company_note` | String |  |  |  |  |
| `company_rating` | Number |  | null |  |  |
| `company_rating_note` | String |  |  |  |  |
| `visible_status` | String |  | received | received, reviewing, interview_scheduled, accepted, not_selected |  |
| `rejection_reason` | String |  |  |  |  |
| `rejection_reason_code` | String |  |  | , requirements_not_met, insufficient_experience, education_not_suitable, failed_knockout, failed_interview, salary_above_budget, another_candidate_selected, other |  |
| `internal_rejection_note` | String |  |  |  |  |
| `candidate_rejection_message` | String |  |  |  |  |
| `rejection_message_visible_to_candidate` | Boolean |  | false |  |  |
| `rejected_at` | Date |  | null |  |  |
| `hired_at` | Date |  | null |  |  |
| `archived_at` | Date |  | null |  |  |
| `archive_reason` | String |  |  |  |  |
| `restored_at` | Date |  | null |  |  |
| `withdrawn_at` | Date |  | null |  |  |
| `stage_order` | Number |  | 0 |  |  |
| `communication_log` | Array<Function> |  | function |  |  |
| `source` | String |  | app | app, web, external, invitation |  |
| `last_activity_at` | Date |  | now |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"status":1}` (background=true) |
| `{"application_no":1}` (unique=true, sparse=true, background=true) |
| `{"user_id":1}` (background=true) |
| `{"employee_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"company_id":1}` (background=true) |
| `{"ats_score":1}` (background=true) |
| `{"knockout_result.has_failed":1}` (background=true) |
| `{"visible_status":1}` (background=true) |
| `{"stage_order":1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |
| `{"job_id":1,"status":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"status":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"ats_score":-1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"knockout_result.has_failed":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"visible_status":1,"createdAt":-1}` (background=true) |
| `{"company_id":1,"archived_at":-1}` (background=true) |

## user_out_side_applying_job

| Item | Value |
|---|---|
| Collection | `user_out_side_applying_job` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID | yes |  |  | jobs |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |
| `{"job_id":1,"createdAt":-1}` (background=true) |

## user_rating_job

| Item | Value |
|---|---|
| Collection | `user_rating_job` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID | yes |  |  | jobs |
| `rating` | Number | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |
| `{"job_id":1,"rating":1}` (background=true) |

## user_resumes

| Item | Value |
|---|---|
| Collection | `user_resumes` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `font_id` | ObjectID | yes |  |  | fonts |
| `color_id` | ObjectID | yes |  |  | colors |
| `resume_id` | ObjectID | yes |  |  | resumes |
| `is_active` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

No explicit schema indexes.

## user_review_job

| Item | Value |
|---|---|
| Collection | `user_review_job` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID | yes |  |  | jobs |
| `message` | String | yes |  |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |
| `{"job_id":1,"createdAt":-1}` (background=true) |

## user_saved_job

| Item | Value |
|---|---|
| Collection | `user_saved_job` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID | yes |  |  | jobs |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"user_id":1,"createdAt":-1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |

## user_show_job

| Item | Value |
|---|---|
| Collection | `user_show_job` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `user_id` | ObjectID | yes |  |  | users |
| `job_id` | ObjectID | yes |  |  | jobs |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"user_id":1}` (background=true) |
| `{"job_id":1}` (background=true) |
| `{"user_id":1,"job_id":1}` (unique=true, background=true) |
| `{"user_id":1,"createdAt":-1}` (background=true) |
| `{"job_id":1,"createdAt":-1}` (background=true) |

## users

| Item | Value |
|---|---|
| Collection | `users` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `first_name` | String | yes |  |  |  |
| `mid_name` | String |  | null |  |  |
| `last_name` | String | yes |  |  |  |
| `image` | String |  | null |  |  |
| `email` | String | yes |  |  |  |
| `lan` | String |  | en | ar, en |  |
| `default_context_id` | ObjectID |  | null |  | account_contexts |
| `last_login_at` | Date |  | null |  |  |
| `gender` | String | yes |  | male, female |  |
| `role_id` | ObjectID | yes |  |  | roles |
| `permissions` | Array<ObjectID> |  | defaultFn |  | permissions |
| `password` | String | yes |  |  |  |
| `status` | Boolean | yes | false |  |  |
| `passcode_active` | Boolean |  | false |  |  |
| `can_update_password` | Boolean |  | false |  |  |
| `phone` | String |  | null |  |  |
| `phone_e164` | String | yes |  |  |  |
| `phone_country` | String | yes |  |  |  |
| `phone_code` | String | yes |  |  |  |
| `phone_national` | String | yes |  |  |  |
| `passcode` | String |  | null |  |  |
| `passcode_expires_at` | Date |  | null |  |  |
| `passcode_attempts` | Number |  | 0 |  |  |
| `otp_last_sent_at` | Date |  | null |  |  |
| `another_device_code` | String |  | null |  |  |
| `another_device_expires_at` | Date |  | null |  |  |
| `pending_device` | Embedded |  | null |  |  |
| `device` | Array<Function> |  | function |  |  |
| `account_deletion_requested_at` | Date |  | null |  |  |
| `account_deletion_status` | String |  | none | none, requested, cancelled, processed |  |
| `account_deletion_reason` | String |  | null |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"email":1}` (unique=true, background=true) |
| `{"default_context_id":1}` (background=true) |
| `{"last_login_at":1}` (background=true) |
| `{"role_id":1}` (background=true) |
| `{"status":1}` (background=true) |
| `{"phone_e164":1}` (unique=true, background=true) |
| `{"phone_national":1}` (unique=true, background=true) |
| `{"account_deletion_status":1}` (background=true) |
| `{"email":1}` (unique=true, background=true) |
| `{"phone_e164":1}` (unique=true, background=true) |
| `{"phone_national":1}` (unique=true, background=true) |
| `{"role_id":1}` (background=true) |
| `{"status":1}` (background=true) |

## work_location

| Item | Value |
|---|---|
| Collection | `work_location` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keyword` | Array<String> |  | defaultFn |  |  |
| `is_active` | Boolean |  | true |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## work_modes

| Item | Value |
|---|---|
| Collection | `work_modes` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `key` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keywords_ar` | Array<String> |  | defaultFn |  |  |
| `keywords_en` | Array<String> |  | defaultFn |  |  |
| `icon` | String |  |  |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `is_active` | Boolean |  | true |  |  |
| `is_system` | Boolean |  | true |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"key":1}` (unique=true, background=true) |
| `{"key":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

## work_time

| Item | Value |
|---|---|
| Collection | `work_time` |
| Timestamps | yes |

### Fields

| Field | Type | Required | Default | Enum | Ref |
| --- | --- | --- | --- | --- | --- |
| `name` | String | yes |  |  |  |
| `title_ar` | String | yes |  |  |  |
| `title_en` | String | yes |  |  |  |
| `keyword` | Array<String> |  | defaultFn |  |  |
| `max_day` | Number |  | null |  |  |
| `is_active` | Boolean |  | true |  |  |
| `sort_order` | Number |  | 0 |  |  |
| `_id` | ObjectID |  | defaultId |  |  |
| `createdAt` | Date |  |  |  |  |
| `updatedAt` | Date |  |  |  |  |

### Indexes

| Index |
| --- |
| `{"name":1}` (unique=true, background=true) |
| `{"name":1}` (unique=true, background=true) |
| `{"is_active":1,"sort_order":1}` (background=true) |

