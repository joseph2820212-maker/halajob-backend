# Deployment Guide

Date: 2026-06-27
Scope: backend deployment rules for HalaJob.

## Required Pre-Deploy Checks

Run these before deploying:

```bash
npm install
npm run check:secrets
npm run check:syntax
npm run check:imports
npm run test:security-http
npm run test:audit-logging
npm run test:mobile-routes
npm run test:ai-safety
npm run test:global-launch-contract
npm run docs:route-report
```

## Production Environment Rules

- Set `NODE_ENV=production`.
- Set `CONNECTION_URL`, `JWT_SECRET`, and production `CORS_ORIGINS`.
- Store secrets only in the hosting provider environment manager.
- Do not upload `.env`, Firebase JSON keys, keystores, or service-account files to Git.
- Keep runtime uploads outside the Git working tree or on managed object storage.
- Ensure `/health` is called with `x-health-secret`, not a query string.

## Backend Deploy Steps

1. Pull the intended branch and commit.
2. Install dependencies with `npm install`.
3. Configure environment variables from `docs/ENVIRONMENT.md`.
4. Run the pre-deploy checks above.
5. Start with `npm start` or the hosting provider process command.
6. Check logs for `Connected to MongoDB` and `Listening on port`.
7. Hit `/health` with `x-health-secret`.
8. Run a live smoke test with approved test accounts.

## Rollback

1. Re-deploy the previous known-good commit.
2. Keep database migrations/seeding out of rollback unless they were explicitly part of the failed deploy.
3. Rotate secrets if the failed deploy exposed logs, keys, or admin access.
4. Record the failed commit and reason in the launch log.

## Runtime File Policy

The repository must not track:

- `uploads/`
- `cv/generated/`
- `logs/`
- `backups/`
- generated credentials
- `.env*` except `.env.example`

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
