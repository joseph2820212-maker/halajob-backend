# Environment Variables

Date: 2026-06-27
Scope: backend runtime and handover reference. Values in this file are descriptions only; never commit real secrets.

## Required For Server Start

| Variable | Required | Purpose | Notes |
|---|---:|---|---|
| `CONNECTION_URL` | Yes | MongoDB connection string. | Rotate if shared with any previous developer. |
| `JWT_SECRET` | Yes | Access/refresh token signing secret. | Use a long random value; rotating signs out users. |
| `PORT` | No | HTTP port. | Defaults to `3000`. |
| `NODE_ENV` | No | Runtime mode. | Set `production` in production. |
| `CORS_ORIGINS` | Production yes | Comma-separated allowed browser origins. | Required when `NODE_ENV=production`. |
| `CORS_ORIGIN_PATTERNS` | No | Comma-separated wildcard origin patterns. | Example: `https://*.vercel.app`. |

## URLs And Files

| Variable | Required | Purpose |
|---|---:|---|
| `PUBLIC_BASE_URL` | Recommended | Public base URL for generated asset links. |
| `FILE_BASE_URL` | Optional | File-serving base URL override where used. |
| `FILES_DIRECTORY` | Optional | Runtime upload directory; defaults to `./uploads`. |
| `EMPLOYEE_DASHBOARD_URL` | Optional | Notification/deep-link target for seeker dashboard. |
| `COMPANY_DASHBOARD_URL` | Optional | Notification/deep-link target for company dashboard. |
| `VITE_SITE_URL` | Optional | Website URL for local/full-stack docs or tooling. |

## Auth And Token Lifetime

| Variable | Required | Purpose |
|---|---:|---|
| `ACCESS_TOKEN_EXPIRATION_MINUTES` | Optional | Access token lifetime. |
| `REFRESH_TOKEN_EXPIRATION_DAYS` | Optional | Refresh token lifetime. |
| `HEALTH_SECRET` | Recommended | Required `x-health-secret` header for `/health`. |

## Email

| Variable | Required | Purpose |
|---|---:|---|
| `SMTP_HOST` | If email enabled | SMTP host. |
| `SMTP_PORT` | If email enabled | SMTP port. |
| `SMTP_SECURE` | If email enabled | `true` for TLS SMTP. |
| `SMTP_USER` | If email enabled | SMTP username. |
| `SMTP_PASS` | If email enabled | SMTP password. |
| `HALAJOB_MAIL_DOMAIN` | Optional | Default mail domain (defaults to `halajob.com`). |
| `HALAJOB_MAIL_FROM_NAME` | Optional | Sender display name (defaults to `Hala Job`). |
| `HALAJOB_EMAIL_INFO` | Optional | From/reply mailbox. |
| `HALAJOB_EMAIL_FORGOT_PASSWORD` | Optional | Password reset mailbox. |
| `HALAJOB_EMAIL_PASSCODE` | Optional | Passcode/OTP mailbox. |
| `HALAJOB_EMAIL_SUBSCRIPTION` | Optional | Subscription mailbox. |
| `HALAJOB_EMAIL_CHECKOUT` | Optional | Checkout mailbox. |
| `HALAJOB_EMAIL_CONTACT` | Optional | Contact mailbox. |
| `HALAJOB_EMAIL_APPOINTMENTS` | Optional | Appointment mailbox. |

> **Brand migration:** The mailbox variables were previously named `JOBZAIN_EMAIL_*`.
> Use the `HALAJOB_EMAIL_*` names. The older `HALA_EMAIL_*` and legacy
> `JOBZAIN_EMAIL_*` names are still read as backward-compatible fallbacks during the
> transition. **Deprecated:** `JOBZAIN_EMAIL_INFO` / `JOBZAIN_EMAIL_*` — use
> `HALAJOB_EMAIL_*` instead. See `BRAND_CLEANUP_AUDIT.md`.

## Firebase / Push

| Variable | Required | Purpose |
|---|---:|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | If push enabled | Service account JSON supplied through env only. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | If push enabled | Path to runtime-only service account file. Do not commit. |
| `GOOGLE_APPLICATION_CREDENTIALS` | If push enabled | Google credentials path for runtime. Do not commit. |

## AI

| Variable | Required | Purpose |
|---|---:|---|
| `FEATURE_AI_TOOLS_ENABLED` | Optional | Backend/mobile launch flag for optional AI UI. Default `false`; pass mobile `-EnableAiTools` for tester APK review builds. |
| `VITE_FEATURE_AI_TOOLS_ENABLED` | Optional | Web launch flag for optional AI UI. Default `false`. |
| `FEATURE_CV_PARSING_ENABLED` | Optional | Public/client feature flag for CV parsing. Default `false` until a real parser adapter is configured and tested. |
| `FEATURE_CV_STUDIO_ENABLED` | Optional | Public/client feature flag for CV Studio. Default `true`. |
| `FEATURE_RESOURCE_LIBRARY_ENABLED` | Optional | Public/client feature flag for the student resource library. Default `true`. |
| `FEATURE_INTERVIEW_PREP_ENABLED` | Optional | Public/client feature flag for non-AI interview prep. Default `true`. |
| `FEATURE_SAVED_SEARCHES_ENABLED` | Optional | Public/client feature flag for saved searches and job alerts. Default `true`. |
| `FEATURE_SMS_ENABLED` | Optional | Public/client feature flag for SMS channel UI. Default `false` until a provider is configured. |
| `FEATURE_SALARY_INSIGHTS_ENABLED` | Optional | Public/client feature flag for salary insights. Default `true`. |
| `FEATURE_CAMPUS_CAREER_CENTER_ENABLED` | Optional | Public/client feature flag for campus career-center surfaces. Default `true`. |
| `FEATURE_VIDEO_INTERVIEWS_ENABLED` | Optional | Public/client feature flag for live interview scheduling surfaces. Default `true`. |
| `FEATURE_TALENT_POOL_CRM_ENABLED` | Optional | Public/client feature flag for company talent-pool CRM. Default `true`. |
| `FEATURE_EMPLOYER_BRANDING_ENABLED` | Optional | Public/client feature flag for employer public profiles and branding. Default `true`. |
| `FEATURE_MANUAL_WHATSAPP_SHARE_ENABLED` | Optional | Allows manual WhatsApp copy/deep-link helpers. Default `true`. |
| `FEATURE_OFFICIAL_WHATSAPP_PROVIDER_ENABLED` | Optional | Future provider flag. Keep `false` unless operations explicitly enables official WhatsApp. |
| `FEATURE_PAYMENTS_MODE` | Optional | Launch billing mode fallback. Default `manual`; online checkout is not required for Syria launch. |
| `FEATURE_COMPANY_SELF_REGISTER_ENABLED` | Optional | Allows company self-registration when enabled. Default `true`. |
| `HALA_AI_PROVIDER` | If AI enabled | Provider key such as mock/real adapter. |
| `HALA_AI_MODEL` | If AI enabled | Model name. |
| `HALA_AI_API_KEY` | If AI enabled | Backend-only provider key. |
| `OPENAI_API_KEY` | Optional fallback | Provider key fallback used by AI services. |
| `HALA_AI_BASE_URL` | Optional | Provider base URL. |
| `HALA_AI_TEMPERATURE` | Optional | Generation temperature. |
| `HALA_AI_INPUT_COST_PER_1M_TOKENS` | Optional | Cost tracking. |
| `HALA_AI_OUTPUT_COST_PER_1M_TOKENS` | Optional | Cost tracking. |

## CV Parsing

| Variable | Required | Purpose |
|---|---:|---|
| `CV_PARSER_PROVIDER` | Optional | CV parser provider selector. Use `manual` for the Syria MVP unless a real parser provider is configured. |
| `CV_PARSER_API_KEY` | If external parser enabled | Provider key for a future parser integration. Do not commit real values. |
| `CV_PARSER_API_URL` | If external parser enabled | Provider API base URL for a future parser integration. |
| `CV_PARSE_JOB_TTL_DAYS` | Optional | Retention window for parser job data. Default `30`. |

## Syria-Safe Communication

| Variable | Required | Purpose |
|---|---:|---|
| `SMS_PROVIDER` | Optional | SMS provider selector. Default `disabled`. |
| `SMS_API_KEY` | If SMS enabled | Provider API key. Do not commit real values. |
| `SMS_API_URL` | If SMS enabled | Provider API base URL. |
| `SMS_SENDER_ID` | Optional | SMS sender label used if SMS is enabled. |
| `COMMUNICATION_LOG_RETENTION_DAYS` | Optional | Delivery-log retention period. Default `180`. |
| `WHATSAPP_BUSINESS_ENABLED` | Optional | Enables official WhatsApp provider flow only when explicitly `true`. |
| `OFFICIAL_WHATSAPP_ENABLED` | Optional | Backward-compatible official WhatsApp flag. Keep `false` for Syria MVP unless operations approves it. |

## Salary Insights / Public Links

| Variable | Required | Purpose |
|---|---:|---|
| `SALARY_INSIGHTS_MIN_SAMPLE_SIZE` | Optional | Minimum sample size before showing stronger confidence. Default `3`. |
| `SALARY_INSIGHTS_CACHE_TTL_SECONDS` | Optional | Cache window for salary aggregates. Default `3600`. |
| `SALARY_INSIGHTS_DEFAULT_CURRENCY` | Optional | Display default for Syria launch. Default `SYP`; USD-normalized fields are still stored for comparison. |
| `PUBLIC_COMPANY_PROFILE_BASE_URL` | Optional | Public company profile deep-link base once production public domains are final. |
| `PUBLIC_CV_SHARE_BASE_URL` | Optional | Public CV share deep-link base once production public domains are final. |

## Payments

The current launch branch uses manual/admin-managed subscriptions. There are no
payment-provider variables required unless the owner chooses online checkout
before launch.

When a provider is selected, add provider-specific public/private API keys,
webhook signing secret, checkout URLs, and environment/sandbox selectors here
before implementation. Do not store real payment secrets in Git.

## Legal Content

| Variable | Required | Purpose |
|---|---:|---|
| `LEGAL_CONTENT_ENFORCEMENT_MODE` | Production yes | Use `staging` while legal pages are review drafts. Use `production` only after required legal/policy pages are marked `legalReviewStatus: lawyer_approved`; the launch gate fails with the unapproved key list otherwise. |

## Scheduled Jobs

| Variable | Required | Purpose |
|---|---:|---|
| `SCHEDULED_JOBS_ENABLED` | Optional | Enables scheduler. |
| `SCHEDULED_JOBS_TIMEZONE` | Optional | Scheduler timezone. |
| `SCHEDULED_JOB_BATCH_SIZE` | Optional | Batch size. |
| `SCHEDULED_JOB_NOTIFICATION_CONCURRENCY` | Optional | Notification concurrency. |
| `JOB_REMINDER_MAX_SAVED_USERS_PER_JOB` | Optional | Reminder safety cap. |
| `JOB_CLOSE_MAX_APPLICANTS_PER_JOB` | Optional | Job-close notification cap. |
| `SAVED_SEARCH_ALERTS_LIMIT` | Optional | Saved-search alert batch limit. |
| `CAMPUS_EVENT_REMINDER_BATCH_SIZE` | Optional | Campus reminder batch size. |
| `CAMPUS_EVENT_REMINDER_WINDOW_HOURS` | Optional | Campus reminder window. |

## Search / Cache / Storage

| Variable | Required | Purpose |
|---|---:|---|
| `REDIS_URL` | Optional | Queue/cache connection. |
| `MEILI_HOST` | Optional | Search host. |
| `MEILI_KEY` | Optional | Search API key. |
| `CLOUD_NAME` | Optional | Cloudinary cloud name. |
| `API_KEY` | Optional | Cloudinary/API integration key. |
| `API_SECRET` | Optional | Cloudinary/API integration secret. |

## Local Seeding

| Variable | Required | Purpose |
|---|---:|---|
| `SEED_ADMIN_ALLOW_CREATE` | Required for admin seeding | Must be `true` before admin seeder creates an admin. |
| `SEED_ADMIN_EMAIL` | If admin seeding | First admin email. |
| `SEED_ADMIN_PASSWORD` | If admin seeding | First admin password. |
| `SEED_ADMIN_FIRST_NAME` | Optional | Admin first name. |
| `SEED_ADMIN_LAST_NAME` | Optional | Admin last name. |
| `SEED_ADMIN_PHONE_E164` | Optional | Admin phone. |
| `SEED_EMPLOYEE_PASSWORD` | Optional | Demo seeker seed password. |
| `SEED_COMPANY_PASSWORD` | Optional | Demo company seed password. |

## Rotation Rule

If any real value was shared in a ZIP, chat, screenshot, repository history, old server, old developer account, or APK reverse-engineering context, rotate it before launch.
