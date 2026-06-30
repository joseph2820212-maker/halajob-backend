# Hala Job

HalaJob is a Node.js/Express and MongoDB backend with a Vite web frontend and a
Flutter mobile app. The current launch-hardening branch is:

```text
codex/gate-a-mobile-ui-lock
```

> Historical note: "JobZain" was an earlier internal/product name. The public product name is now **Hala Job** (operated by llill ltd; public web domain halajob.com). The backend API domain may temporarily remain `jobzain.com` as a technical URL — see `BRAND_CLEANUP_AUDIT.md`.

The launch source branch remains `flutter-seeker-campus`; new hardening branches
should be based directly on it.

## Repository Map

| Area | Path |
|---|---|
| Backend app | `app.js`, `index.js` |
| Backend routes | `routes/`, `routesUser/`, `routesCompany/`, `routesEmployee/`, `routesCampus/`, `routesUniversity/`, `routesAi/`, `routesAnalytics/`, `routesNotifications/`, `routesTrust/` |
| Backend controllers | `controllers/` |
| Models | `models/` |
| Services/helpers | `services/`, `helper/`, `utils/` |
| Validation | `validations/`, `middlewares/validate.js` |
| Verification scripts | `scripts/` |
| Web frontend | `web/` |
| Flutter mobile app | `mobile/` |
| Generated API docs | `docs/api/` |
| Security/testing docs | `docs/security/`, `docs/testing/` |

## Start Here

Read these before handoff or new launch work:

- `CODEX.md`
- `CONTRIBUTING.md`
- `docs/HANDOVER.md`
- `docs/TESTING_GUIDE.md`
- `docs/DEPLOYMENT.md`
- `docs/ENVIRONMENT.md`
- `docs/PAYMENTS_AND_SUBSCRIPTIONS.md`
- `docs/HALAJOB_9_5_FINAL_COMPLETION_REPORT.md`
- `docs/HALAJOB_9_5_HANDOUT_TRACEABILITY.md`
- `docs/one-phase-launch-scope.md`
- `docs/launch-hardening-status.md`
- `docs/SYRIA_LAUNCH_PRODUCT_QA.md`
- `docs/OPERATOR_GUIDE.md`
- `docs/testing/PRODUCTION_LAUNCH_EVIDENCE.md`

## Syria-First Product Modules

The current completion plan is Syria-first and extends existing systems rather
than creating duplicates. Module references:

- `docs/CV_STUDIO.md`
- `docs/CV_PARSING.md`
- `docs/RESOURCE_LIBRARY.md`
- `docs/INTERVIEW_PREP.md`
- `docs/SAVED_SEARCHES_JOB_ALERTS.md`
- `docs/COMMUNICATION_HUB_SYRIA.md`
- `docs/SALARY_INSIGHTS.md`
- `docs/CAMPUS_CAREER_CENTER.md`
- `docs/INTERVIEW_SCHEDULING.md`
- `docs/COMPANY_TALENT_POOL.md`
- `docs/EMPLOYER_BRANDING.md`
- `docs/PLATFORM_SETTINGS.md`

## Backend Setup

```bash
npm ci
npm run dev
```

Minimum local `.env`:

```text
CONNECTION_URL=<mongodb-connection-string>
JWT_SECRET=<long-random-secret>
PORT=3000
NODE_ENV=development
```

See `docs/ENVIRONMENT.md` for the full environment reference.

## Web Frontend

```bash
npm --prefix web ci
npm --prefix web run build
npm --prefix web test
```

Frontend environment:

```text
VITE_API_URL=https://jobzain.com
VITE_ENABLE_UNIVERSITY_PREVIEW=false
```

The root `vercel.json` builds the `web/` app for Vercel deployments.

## Mobile App

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

The tester APK is local/debug signed unless a production signing strategy is
configured. Do not call an APK fresh unless it was rebuilt from the current
source. Campus tester builds can enable local-device campus auth for UI/device
QA; production campus auth should use the backend.

## Verification

Use `docs/TESTING_GUIDE.md` as the source of truth. Core branch checks include:

```bash
npm run test:launch-gate
npm run test:launch-gate:backend
npm run test:launch-gate:web
npm run test:launch-gate:ui-contracts
npm run test:launch-gate:mobile
npm run check:secrets
npm run check:syntax
npm run check:imports
npm run test:syria-docs
npm run test:production-launch-evidence
npm run smoke:import
npm run smoke:http
npm run smoke:cors
npm run test:critical-launch-blockers
npm run test:otp-contract
npm run test:route-validation
npm run test:response-codes
npm run test:model-integrity
npm run test:mixed-fields
npm run test:data-retention
npm run test:object-authorization
npm run test:audit-logging
npm run test:integration:syria-product
npm run check:web-routes
npm run test:launch-gate:web
npm run test:web-smoke
```

CI also runs the web build, unit tests, `npm --prefix web run e2e`, and Flutter
`pub get`/`analyze`/`test` on the Linux verification job. Run
`npm run test:launch-gate:mobile` on a machine with Flutter on PATH before
calling a mobile release ready.

Regenerate source-of-truth docs after route/model/auth/contract changes:

```bash
npm run docs:route-report
npm run docs:api-artifacts
npm run docs:database
npm run docs:api-pdf
```

## Current Payment Position

Manual/admin subscriptions are implemented and tested. Online checkout,
provider webhooks, automatic payment status sync, failed-payment handling, and
refund logic are not enabled until the owner selects and provides a payment
provider setup. See `docs/PAYMENTS_AND_SUBSCRIPTIONS.md`.

## External Launch Blockers

The source can be hardened locally, but public launch still needs owner-side
proof for:

- production secret rotation
- production admin-user audit
- live production smoke tests
- SMTP/email, Firebase/push, Cloudinary/storage, AI provider, domain/HTTPS,
  hosting, and backup/restore checks against real accounts
- manual subscription launch acceptance or online payment provider setup
- production Android signing/package/update strategy
- owner real-device mobile UI approval

Track final live/provider/device proof in
`docs/testing/PRODUCTION_LAUNCH_EVIDENCE.md`. Run
`npm run test:production-launch-evidence` after edits, and run
`npm run test:production-launch-evidence:complete` only when preparing to claim
public-launch readiness.
