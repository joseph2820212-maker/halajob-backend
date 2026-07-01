# Deployment Guide

Date: 2026-06-28
Scope: backend, web, mobile release, and production verification rules for
HalaJob.

## Required Pre-Deploy Checks

Run the focused checks for the files changed. For a broad launch deploy, run:

```bash
npm ci --ignore-scripts
npm run check:secrets
npm run check:syntax
npm run check:imports
npm run smoke:import
npm run smoke:http
npm run smoke:cors
npm run test:route-validation
npm run test:response-codes
npm run test:model-integrity
npm run test:mixed-fields
npm run test:security-http
npm run test:mobile-routes
npm run test:ai-safety
npm run test:global-launch-contract
npm run test:object-authorization
npm run test:audit-logging
npm run test:file-export-audit
npm run test:integration:subscriptions
npm --prefix web ci --ignore-scripts
npm --prefix web run build
npm --prefix web test
```

Run the remaining seeded integration suites listed in `docs/TESTING_GUIDE.md`
when deploying a broad launch candidate or when touching the related feature
area.

## Production Environment Rules

- Set `NODE_ENV=production`.
- Set `CONNECTION_URL`, `JWT_SECRET`, and production `CORS_ORIGINS`.
- Store secrets only in the hosting provider environment manager or a secret manager.
- Do not upload `.env`, Firebase JSON keys, keystores, backups, or service-account files to Git.
- Keep runtime uploads outside the Git working tree or on managed object storage.
- Ensure `/health` is called with `x-health-secret`, not a query string.
- Use `docs/ENVIRONMENT.md` as the environment variable source of truth.

## Backend Deploy Steps

1. Pull the exact release branch and commit.
2. Install dependencies with `npm ci --omit=dev` or the hosting provider's approved install command.
3. Configure environment variables from `docs/ENVIRONMENT.md`.
4. Run the pre-deploy verification set in a staging or release environment.
5. Start with `npm start` or the hosting provider process command.
6. Check logs for `Connected to MongoDB` and `Listening on port`.
7. Call `/health/live` and `/health/ready` with `x-health-secret` where required.
8. Run live smoke tests with approved test accounts.
9. Record the release commit, commands, and live proof in `docs/testing/LIVE_SMOKE_TEST_RESULTS.md`.

## Web Deploy Steps

The website and admin frontends live in their own repos
(`halajob-website`, `halajob-admin`), each with its own `vercel.json`
and README deploy section. Deploy each repo as its own Vercel project
with the repo root as the project root:

```text
VITE_API_URL=https://jobzain.com
VITE_ENABLE_UNIVERSITY_PREVIEW=false
```

Production CORS must include the exact deployed web origin.

## Mobile Release Rules

- Tester APKs are local/debug signed unless production signing is configured.
- Do not distribute a stale APK as a fresh build.
- Production release requires an owner-approved package ID, signing key,
  versionCode/versionName strategy, and store/update plan.
- Campus tester mode can use local-device auth for UI QA only.
- Production campus auth must use the backend.

For mobile commands and tester packaging, use the `halajob-mobile` repo
(its CI builds tester APKs via workflow dispatch) and the checks in
`docs/TESTING_GUIDE.md`.

## Payment Launch Rule

Manual/admin-managed subscriptions are the current implemented model. Online
checkout is not enabled until the owner selects a payment provider and supplies
merchant credentials, webhook signing secret, checkout settings, and failed
payment/refund policy. See `docs/PAYMENTS_AND_SUBSCRIPTIONS.md`.

## Rollback

1. Redeploy the previous known-good commit.
2. Do not roll back database data unless a migration or destructive deploy explicitly requires it.
3. Rotate secrets if the failed deploy exposed logs, keys, or admin access.
4. Record the failed commit, reason, and recovery action in the launch log.

## Runtime File Policy

The repository must not track:

- `uploads/`
- `cv/generated/`
- `logs/`
- `backups/`
- generated credentials
- `.env*` except `.env.example`
- Android signing files or passwords

`npm run check:secrets` enforces this baseline.

## First Admin Procedure

Admin seeding is explicitly opt-in:

```bash
SEED_ADMIN_ALLOW_CREATE=true
SEED_ADMIN_EMAIL=owner@example.com
SEED_ADMIN_PASSWORD=<temporary-strong-password>
npm run seed admin
```

After creating the first admin:

- Set `SEED_ADMIN_ALLOW_CREATE=false` or remove all seed admin variables.
- Log in and change/reset the password.
- Run `npm run security:audit-users` against production.
