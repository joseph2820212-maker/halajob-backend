# Testing Guide

Date: 2026-06-29
Scope: backend, web, mobile, generated docs, and launch proof commands currently
available in the repo.

## Core Local Checks

```bash
npm run check:secrets
npm run check:syntax
npm run check:imports
npm run smoke:import
npm run smoke:http
npm run smoke:cors
```

## Backend Contract Checks

```bash
npm run test:route-validation
npm run test:response-codes
npm run test:model-integrity
npm run test:mixed-fields
npm run test:security-http
npm run test:mobile-routes
npm run test:ai-safety
npm run test:global-launch-contract
npm run test:trust-routes
npm run test:notification-routes
npm run test:analytics-routes
npm run test:translation-routes
npm run test:admin-operations-routes
npm run test:career-passport
npm run test:critical-launch-blockers
npm run test:ui-actions
npm run test:mobile-ui-contract
```

## Seeded Integration Checks

The seeded integration checks prefer an externally supplied MongoDB when
`CONNECTION_URL` is set. Each script rewrites that URI to a unique disposable
database name before connecting, so the same MongoDB server can be reused across
the launch suites without sharing test data. When `CONNECTION_URL` is unset,
the scripts fall back to `mongodb-memory-server`.

For fresh-checkout local runs, start MongoDB 7 locally or in Docker and export a
base URL before the aggregate gates:

```bash
docker run --rm -p 27017:27017 mongo:7
CONNECTION_URL=mongodb://127.0.0.1:27017/halajob_local_test npm run test:integration:launch-critical
CONNECTION_URL=mongodb://127.0.0.1:27017/halajob_local_test npm run test:integration:syria-product
```

On Windows PowerShell:

```powershell
$env:CONNECTION_URL = "mongodb://127.0.0.1:27017/halajob_local_test"
npm run test:integration:launch-critical
npm run test:integration:syria-product
```

If you cannot run Docker or a local MongoDB service, set
`MONGOMS_SYSTEM_BINARY` to a preinstalled `mongod` binary so
`mongodb-memory-server` does not need to download one during the test run. The
shared helper checks that the configured path exists before running the
DB-backed suites, so typos fail with a clear setup message.
Without either `CONNECTION_URL`, `MONGOMS_SYSTEM_BINARY`, or network access to
the MongoDB binary cache/download host, the shared integration helper now fails
with a preflight-style message that names those choices directly.

CI uses the same path with a MongoDB 7 service container.

```bash
npm run test:integration-mongo-helper
```

```bash
npm run test:integration:auth-context
npm run test:integration:trust-documents
npm run test:object-authorization
npm run test:audit-logging
npm run test:file-export-audit
npm run test:integration:profile-uploads
npm run test:integration:student-verification-documents
npm run test:integration:employee-cv-downloads
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
npm run test:integration:job-mutations
npm run test:integration:hiring-workflows
npm run test:integration:campus-workflows
npm run test:integration:cv-studio
npm run test:integration:cv-parsing
npm run test:integration:learning-resources
npm run test:integration:interview-prep
npm run test:integration:saved-search-alerts
npm run test:integration:communication-hub
npm run test:integration:salary-insights
npm run test:integration:campus-privacy
npm run test:integration:interview-scheduling
npm run test:integration:talent-pool-crm
npm run test:integration:company-branding
npm run test:integration:syria-product
npm run test:integration:launch-critical
```

The aggregate `npm run test:integration:syria-product` is the launch-product
gate for CV Studio/parsing, learning resources, interview prep, saved searches,
communication hub, salary insights, campus privacy, interview scheduling,
talent pool CRM, and employer branding.

The aggregate `npm run test:integration:launch-critical` is the regression
guard for auth context isolation, trust documents, object authorization, audit
logging, file exports, upload/download security, student verification
documents, employee CV downloads, AI disabled/enabled safety behavior,
notifications, analytics, subscriptions, company/university membership,
admin permissions/support/resources, translations, job mutations, hiring
workflows, and campus workflows.

## Web Checks

```bash
npm --prefix web ci --ignore-scripts
npm --prefix web run build
npm --prefix web test
npm --prefix web run e2e
npm run test:web-smoke
```

Current web tests cover API auth/path behavior, scoped 401 logout, URL helpers,
i18n helpers, and route smoke rendering for home, jobs, campus, company, seeker,
and admin views. `npm --prefix web run e2e` and the root shortcut
`npm run test:web-smoke` both start a local Vite preview, run the Puppeteer
portal smoke across the main web portals, and then stop the preview server.

## Mobile Checks

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

For a tester APK, use the mobile PowerShell scripts documented under
`mobile/scripts/`. A campus tester build can use local-device campus auth for UI
QA; production campus mode must use the backend.

## Generated Docs

Run after route, auth, model, or contract changes:

```bash
npm run docs:route-report
npm run docs:api-artifacts
npm run docs:database
npm run docs:api-pdf
```

Outputs include:

```text
docs/api/ROUTE_VERIFICATION_REPORT.md
docs/api/HALAJOB_ROUTE_INVENTORY.json
docs/api/HALAJOB_API_REFERENCE.md
docs/api/HALAJOB_API_REFERENCE.pdf
docs/api/HALAJOB_OPENAPI.yaml
docs/api/HALAJOB_POSTMAN_COLLECTION.json
docs/DATABASE_MODELS.md
```

If `npm run docs:api-pdf` cannot find Python, use any Python 3 environment with
`reportlab`. On this Codex workstation, the bundled Python runtime is:

```text
C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
```

## CI

GitHub Actions workflow:

```text
.github/workflows/flutter-mobile-ci.yml
```

It runs for pushes to `flutter-seeker-campus`, `codex/**`, `claude/**`, pull
requests into `flutter-seeker-campus`, and manual dispatch.

Current CI includes backend syntax/import/secret/i18n checks, route validation,
response-code contract, model integrity, Mixed-field register, global launch
contract, mobile route contract, web build/tests/e2e, launch-critical
integration coverage, Syria product integration coverage, security HTTP
contract, Flutter analyze/tests, and mobile palette protection. Android release
smoke builds and campus tester APK artifacts run on manual dispatch or the
release branch to control Actions minutes.

## Production-Only Proof

These cannot be completed from source alone:

- `npm run security:audit-users` against the real production database
- live smoke tests against approved production seeker/company/campus/admin accounts
- SMTP delivery, Firebase push, Cloudinary/storage, AI provider, domain/HTTPS,
  hosting, and backup/restore checks against real accounts
- online payment provider checkout/webhook tests if online payments are chosen
- owner real-device mobile UI approval

Record production proof in `docs/testing/*.md` and update
`docs/launch-hardening-status.md`.
