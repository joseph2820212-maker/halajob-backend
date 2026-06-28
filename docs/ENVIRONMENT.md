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
| `JOBZAIN_EMAIL_INFO` | Optional | From/reply mailbox. |
| `JOBZAIN_EMAIL_FORGOT_PASSWORD` | Optional | Password reset mailbox. |
| `JOBZAIN_EMAIL_PASSCODE` | Optional | Passcode/OTP mailbox. |
| `JOBZAIN_EMAIL_SUBSCRIPTION` | Optional | Subscription mailbox. |
| `JOBZAIN_EMAIL_CHECKOUT` | Optional | Checkout mailbox. |
| `JOBZAIN_EMAIL_CONTACT` | Optional | Contact mailbox. |
| `JOBZAIN_EMAIL_APPOINTMENTS` | Optional | Appointment mailbox. |

## Firebase / Push

| Variable | Required | Purpose |
|---|---:|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | If push enabled | Service account JSON supplied through env only. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | If push enabled | Path to runtime-only service account file. Do not commit. |
| `GOOGLE_APPLICATION_CREDENTIALS` | If push enabled | Google credentials path for runtime. Do not commit. |

## AI

| Variable | Required | Purpose |
|---|---:|---|
| `HALA_AI_PROVIDER` | If AI enabled | Provider key such as mock/real adapter. |
| `HALA_AI_MODEL` | If AI enabled | Model name. |
| `HALA_AI_API_KEY` | If AI enabled | Backend-only provider key. |
| `OPENAI_API_KEY` | Optional fallback | Provider key fallback used by AI services. |
| `HALA_AI_BASE_URL` | Optional | Provider base URL. |
| `HALA_AI_TEMPERATURE` | Optional | Generation temperature. |
| `HALA_AI_INPUT_COST_PER_1M_TOKENS` | Optional | Cost tracking. |
| `HALA_AI_OUTPUT_COST_PER_1M_TOKENS` | Optional | Cost tracking. |

## Payments

The current launch branch uses manual/admin-managed subscriptions. There are no
payment-provider variables required unless the owner chooses online checkout
before launch.

When a provider is selected, add provider-specific public/private API keys,
webhook signing secret, checkout URLs, and environment/sandbox selectors here
before implementation. Do not store real payment secrets in Git.

## Scheduled Jobs

| Variable | Required | Purpose |
|---|---:|---|
| `SCHEDULED_JOBS_ENABLED` | Optional | Enables scheduler. |
| `SCHEDULED_JOBS_TIMEZONE` | Optional | Scheduler timezone. |
| `SCHEDULED_JOB_BATCH_SIZE` | Optional | Batch size. |
| `SCHEDULED_JOB_NOTIFICATION_CONCURRENCY` | Optional | Notification concurrency. |
| `JOB_REMINDER_MAX_SAVED_USERS_PER_JOB` | Optional | Reminder safety cap. |
| `JOB_CLOSE_MAX_APPLICANTS_PER_JOB` | Optional | Job-close notification cap. |
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
