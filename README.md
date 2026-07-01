# Hala Job — backend

Node.js/Express and MongoDB backend for HalaJob. This repo is API-only; the
web, admin, and mobile clients live in separate repos:

- Website: `joseph2820212-maker/halajob-website`
- Admin console: `joseph2820212-maker/halajob-admin`
- Mobile (Flutter): `joseph2820212-maker/halajob-mobile`

The trunk in this repo is `main`. Historical launch-hardening work happened on
`codex/gate-a-mobile-ui-lock` and `flutter-seeker-campus` in the pre-split
monorepo (`joseph2820212-maker/halajobe`); those branches do not exist here.

> Historical note: "JobZain" was an earlier internal/product name. The public product name is now **Hala Job** (operated by llill ltd; public web domain halajob.com). The backend API domain may temporarily remain `jobzain.com` as a technical URL — see `docs/legacy/BRAND_CLEANUP_AUDIT.md`.

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
| Generated API docs | `docs/api/` |
| Security/testing docs | `docs/security/`, `docs/testing/` |
| Legacy cross-app docs | `docs/legacy/` (kept for history from the pre-split monorepo) |

## Start Here

Read these before handoff or new launch work:

- `CODEX.md`
- `CONTRIBUTING.md`
- `docs/REPO_SEPARATION_STATUS.md`
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

## Web / Admin / Mobile clients

These live in their own repos and each has its own README with build, test,
and deploy instructions:

- Website (customer, green theme): `joseph2820212-maker/halajob-website`
- Admin console: `joseph2820212-maker/halajob-admin`
- Mobile (Flutter): `joseph2820212-maker/halajob-mobile`

The root `vercel.json` here deploys the backend API.

## Verification

Use `docs/TESTING_GUIDE.md` as the source of truth. Core backend checks
include:

```bash
npm run check:secrets
npm run check:syntax
npm run check:imports
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
npm run test:syria-docs
npm run test:production-launch-evidence
```

Web-, admin-, and mobile-side checks now run in the sibling repos' own CI —
each repo's workflow builds only itself, which is the main reason for the
split. Cross-repo launch-gate scripts that assumed the old monorepo layout
(`test:launch-gate:web`, `test:launch-gate:mobile`, `check:web-routes`,
`test:web-smoke`) may still exist in this repo's `package.json` from before
the split, but should be treated as historical unless they operate purely on
the backend surface.

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
