# HalaJob Backend Handover

Date: 2026-06-28
Branch: `main` (this repo was split out of the retired `halajobe` monorepo)
Scope: backend API, database, security baseline, deployment, and mobile/web integration reference.

This document is the operational handover for running, verifying, deploying, and maintaining the HalaJob backend. It does not contain secrets. Keep all real credentials in the hosting provider, local `.env`, or a secret manager only.

## Project Overview

The backend is a Node.js/Express API using MongoDB through Mongoose. It supports job seeker, company, campus/student, university/admin, AI, analytics, trust, notification, translation, file, and admin operations modules.

Current branch status: the 2026-06-28 hardening pass has route validation
coverage, response-code contracts, model reference checks, Mixed-field
classification, web build/tests, regenerated API/database artifacts, and the
major seeded backend integration suites wired into CI. Live production provider
checks still require the owner's real deployment accounts and credentials.

Core runtime files:

| Area | Location |
|---|---|
| Server entry | `index.js` |
| App/router composition | `app.js` |
| Route modules | `routes/` |
| Controllers | `controllers/` |
| Models | `models/` |
| Services/helpers | `services/`, `utils/`, `helpers/` |
| Seeders | `seeders/` |
| Verification scripts | `scripts/` |
| Backend docs | `docs/` |
| API docs/artifacts | `docs/api/` |
| Security docs | `docs/security/` |
| Testing results | `docs/testing/` |

## Source Of Truth

Use these generated files as the current backend source of truth:

| Purpose | File |
|---|---|
| Route verification summary | `docs/api/ROUTE_VERIFICATION_REPORT.md` |
| Machine-readable route inventory | `docs/api/HALAJOB_ROUTE_INVENTORY.json` |
| Human API reference | `docs/api/HALAJOB_API_REFERENCE.md` |
| PDF API reference | `docs/api/HALAJOB_API_REFERENCE.pdf` |
| OpenAPI export | `docs/api/HALAJOB_OPENAPI.yaml` |
| Postman collection | `docs/api/HALAJOB_POSTMAN_COLLECTION.json` |
| Local Postman env | `docs/api/HALAJOB_POSTMAN_ENV_LOCAL.json` |
| Dev Postman env | `docs/api/HALAJOB_POSTMAN_ENV_DEV.json` |
| Database model inventory | `docs/DATABASE_MODELS.md` |
| Role and permission matrix | `docs/security/ROLE_PERMISSION_MATRIX.md` |
| Security baseline report | `docs/security/SECURITY_AUDIT_REPORT.md` |
| Deployment access audit | `docs/security/DEPLOYMENT_ACCESS_AUDIT.md` |
| Payments/subscriptions launch decision | `docs/PAYMENTS_AND_SUBSCRIPTIONS.md` |
| Final launch-readiness report | `docs/HALAJOB_9_5_FINAL_COMPLETION_REPORT.md` |

Regenerate source-of-truth artifacts after route, model, auth, or contract changes.

## Local Setup

1. Clone or pull the intended branch.
2. Install Node.js dependencies:

```bash
npm install
```

3. Create a local `.env` file from the variables in `docs/ENVIRONMENT.md`.
4. Set at minimum:

```bash
CONNECTION_URL=<mongodb-connection-string>
JWT_SECRET=<long-random-secret>
PORT=3000
NODE_ENV=development
```

5. Start the backend:

```bash
npm run dev
```

For production-style local start:

```bash
npm start
```

If the server exits with `Missing required environment variables`, check `CONNECTION_URL` and `JWT_SECRET` first.

## Environment Variables

The full environment reference is in `docs/ENVIRONMENT.md`.

Production must set:

| Variable | Requirement |
|---|---|
| `CONNECTION_URL` | Required MongoDB connection string |
| `JWT_SECRET` | Required token signing secret |
| `NODE_ENV` | Set to `production` |
| `CORS_ORIGINS` | Required in production |
| `HEALTH_SECRET` | Strongly recommended for `/health` |

Do not commit `.env`, Firebase JSON credentials, keystores, API keys, SMTP passwords, or database backup files.

## Safe Test Data And First Admin

Admin creation is intentionally opt-in.

Use only when creating the first trusted admin:

```bash
SEED_ADMIN_ALLOW_CREATE=true
SEED_ADMIN_EMAIL=owner@example.com
SEED_ADMIN_PASSWORD=<temporary-strong-password>
npm run seed admin
```

After the admin is created:

1. Remove or set `SEED_ADMIN_ALLOW_CREATE=false`.
2. Rotate the temporary admin password.
3. Run the privileged user audit:

```bash
npm run security:audit-users
```

Never leave admin seeding enabled in production.

## Required Verification Before Deploy

Run this baseline before pushing a release:

```bash
npm run check:secrets
npm run check:syntax
npm run check:imports
npm run check:i18n
npm run smoke:import
npm run smoke:http
npm run smoke:cors
npm run test:security-http
npm run test:response-codes
npm run test:model-integrity
npm run test:mixed-fields
npm run test:route-validation
npm run test:audit-logging
npm run test:file-export-audit
npm run test:object-authorization
npm run test:integration:profile-uploads
npm run test:mobile-routes
npm run test:ai-safety
npm run test:global-launch-contract
npm run test:trust-routes
npm run test:notification-routes
npm run test:analytics-routes
npm run test:translation-routes
npm run test:admin-operations-routes
npm run test:career-passport
npm run test:integration:auth-context
npm run test:integration:trust-documents
npm run test:integration:ai-runtime
npm run test:integration:notifications
npm run test:integration:analytics
npm run test:integration:subscriptions
npm run test:integration:company-permissions
npm run test:integration:company-members
npm run test:integration:university-members
npm run test:integration:admin-permissions
npm run test:integration:admin-support
npm run test:integration:admin-resources
npm run test:integration:translations
npm run test:integration:campus-workflows
npm run test:integration:student-verification-documents
npm run test:integration:employee-cv-downloads
npm run test:integration:job-mutations
npm run test:integration:hiring-workflows
```

The web/admin build, test, and e2e gates run in their own repos
(`halajob-website`, `halajob-admin`) — there is no `web/` folder in this repo,
so the old `npm --prefix web …` / `npm run test:web-smoke` commands no longer
apply here.

Then regenerate docs:

```bash
npm run docs:route-report
npm run docs:api-artifacts
npm run docs:database
npm run docs:api-pdf
```

If `npm run docs:api-pdf` cannot find Python, run the generator directly with any Python 3 environment that has `reportlab` installed:

```bash
python scripts/generateApiReferencePdf.py
```

## API Documentation

Regenerate the API artifacts after any route or auth middleware change:

```bash
npm run docs:route-report
npm run docs:api-artifacts
npm run docs:api-pdf
```

Outputs:

| Output | File |
|---|---|
| Route inventory | `docs/api/HALAJOB_ROUTE_INVENTORY.json` |
| API reference | `docs/api/HALAJOB_API_REFERENCE.md` |
| API PDF | `docs/api/HALAJOB_API_REFERENCE.pdf` |
| OpenAPI | `docs/api/HALAJOB_OPENAPI.yaml` |
| Postman collection | `docs/api/HALAJOB_POSTMAN_COLLECTION.json` |

The route report must show `Unguarded endpoints needing manual classification` as `0` before launch.

## Database And Backup

The generated model inventory is in `docs/DATABASE_MODELS.md`.

Backup and restore policy is in `docs/BACKUP_RESTORE.md`.

Minimum launch rules:

1. Use managed MongoDB backups or scheduled `mongodump`.
2. Test restore into a non-production database before launch.
3. Do not store backup files in Git.
4. Restrict database access by user, role, and IP where possible.

## Deployment

The full deployment guide is in `docs/DEPLOYMENT.md`.

Production deploy checklist:

1. Pull the exact release commit.
2. Install dependencies.
3. Configure environment variables from `docs/ENVIRONMENT.md`.
4. Run required verification.
5. Start with `npm start` or the hosting provider process command.
6. Confirm MongoDB connection in logs.
7. Call `/health` with `x-health-secret`.
8. Run a live smoke test with approved test accounts.

## Rollback

Rollback procedure:

1. Redeploy the last known-good commit.
2. Do not roll back database data unless a migration or destructive deploy requires it.
3. Rotate secrets if the failed release exposed keys, logs, or privileged access.
4. Record failed commit, reason, and recovery action in the launch log.

## Mobile And Web Integration

Mobile/web integration rules are documented in `docs/MOBILE_WEB_INTEGRATION.md`.

Important integration points:

| Client | Backend expectation |
|---|---|
| Job seeker app/web | Auth, jobs, saved jobs, applications, profile, notifications |
| Campus student app/web | Campus auth, student profile, events, opportunities, verification |
| Company web/app | Company auth context, jobs, applicants, analytics, billing/verification |
| Admin panel | All role, content, trust, campus, company, AI, analytics, and moderation controls |

The release APK currently uses `https://jobzain.com` as the API base URL and local-device campus auth mode for testing.

> **Brand note:** The public product name is **Hala Job**. `jobzain.com` is the
> current backend API domain only (a technical URL, not the product brand) and is
> a documented temporary exception — see `BRAND_CLEANUP_AUDIT.md`. Migrate the API
> domain only after DNS, SSL, CORS, mobile build defines, and smoke tests are
> confirmed for the Hala Job API domain.

## Security Operations

Security references:

| Purpose | File |
|---|---|
| Baseline security report | `docs/security/SECURITY_AUDIT_REPORT.md` |
| Secret rotation | `docs/security/SECRETS_ROTATION_REPORT.md` |
| Privileged user audit | `docs/security/ADMIN_USER_AUDIT_REPORT.md` |
| Deployment access audit | `docs/security/DEPLOYMENT_ACCESS_AUDIT.md` |
| Role matrix | `docs/security/ROLE_PERMISSION_MATRIX.md` |
| Audit logging policy | `docs/security/AUDIT_LOGGING_POLICY.md` |

Launch security checklist:

1. Rotate any secret ever shared with a developer, ZIP, chat, screenshot, old APK, old server, or old repository history.
2. Remove previous developer access from GitHub, hosting, database, email, Firebase, Cloudinary, payment, analytics, and domain/DNS accounts.
3. Run `npm run check:secrets`.
4. Run `npm run security:audit-users` against production.
5. Confirm production CORS allows only approved origins.
6. Confirm runtime upload directories and logs are not tracked by Git.

## Common Debugging

| Symptom | First checks |
|---|---|
| `Missing required environment variables` | Set `CONNECTION_URL` and `JWT_SECRET`. |
| CORS errors in browser | Check `NODE_ENV=production`, `CORS_ORIGINS`, and exact web origin. |
| Mobile cannot connect | Confirm API base URL, HTTPS certificate, and server health. |
| Admin seeding does not create admin | Confirm `SEED_ADMIN_ALLOW_CREATE=true` and seed admin variables. |
| Uploads fail | Confirm runtime upload directory exists and is writable. |
| Email/OTP fails | Confirm SMTP variables and provider credentials. |
| Push fails | Confirm Firebase env/path and service account permissions. |
| AI endpoints fail | Confirm AI provider, model, API key, and budget/rate settings. |

## Known External Dependencies

These cannot be fully proven from source code alone and must be verified in the target production accounts:

| Dependency | Required live verification |
|---|---|
| MongoDB | Connection, backup, restore, access rules |
| SMTP/email | OTP, reset, notification delivery |
| Firebase/push | Device token registration and push delivery |
| Cloudinary/storage | Upload, read, delete, permissions |
| AI provider | Model access, quota, cost settings, safety behavior |
| Domain/DNS/HTTPS | `https://jobzain.com` routing and certificate |
| Hosting provider | Env vars, logs, rollback, process restart |
| Payment/subscription provider if online payments are enabled | Provider account, checkout, webhook signature, replay protection, subscription status, failed payment handling |

## Current Limitations To Verify Before Public Launch

1. Live production smoke tests must be run against the real deployment and real provider credentials.
2. Provider integrations must be tested in their real accounts, not only with import/contract checks.
3. Database backup restore must be tested on a non-production target.
4. Admin panel coverage must be rechecked whenever new backend features are added.
5. Mobile and web clients must be tested on real devices/browsers after each API or navigation change.
6. Manual/admin subscriptions are implemented and tested; online checkout is not enabled until the owner selects a payment provider and supplies merchant/webhook setup.

## Handover Rule

Before accepting any future handover or developer ZIP:

1. Require the Git branch and commit hash.
2. Require environment variable names without secret values.
3. Require a list of changed routes, models, and screens.
4. Require test evidence and APK/web build evidence where relevant.
5. Regenerate route, API, database, and security docs from the code itself.
