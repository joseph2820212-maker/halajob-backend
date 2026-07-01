# Codex Handover Rules — halajob-backend

This repo is the Express/MongoDB API only. The web, admin, and mobile clients
now live in their own repos:

- Website (customer, green): `joseph2820212-maker/halajob-website`
- Admin console: `joseph2820212-maker/halajob-admin`
- Mobile (Flutter): `joseph2820212-maker/halajob-mobile`

The historical monorepo `joseph2820212-maker/halajobe` remains as the source of
truth for pre-split history and any cross-app work that has not been migrated
yet — do not push new features there without checking with the owner.

Do not mark the product launch-ready unless every required gate has passing
proof or the only remaining item is an owner-controlled external blocker
documented in the repo.

## Start Here

Read these files before changing code:

- `docs/HANDOVER.md`
- `docs/launch-hardening-status.md`
- `docs/one-phase-launch-scope.md`
- `docs/PAYMENTS_AND_SUBSCRIPTIONS.md`
- `docs/TESTING_GUIDE.md`
- `docs/MOBILE_WEB_INTEGRATION.md`
- `docs/security/ROLE_PERMISSION_MATRIX.md`

## Non-Negotiable Rules

- Work from `main` or a branch directly based on it.
- Preserve existing user/developer changes; do not reset or revert unrelated work.
- Do not commit secrets, keystores, Firebase JSON, `.env`, uploads, logs, or backups.
- Do not call mock AI "real AI".
- Do not call manual/admin subscriptions "online payment".
- Do not send or reference stale APKs as fresh builds.
- Do not claim production smoke, provider integrations, admin audit, secret rotation, or real-device mobile approval without proof.
- Backend-only changes belong here. Web / admin / mobile changes belong in
  their own repos — do not re-introduce those trees into this repo.

## Required Proof Before Handoff

Run the checks that match the files changed. For broad launch/hardening changes,
use the current full set from `docs/TESTING_GUIDE.md`.

Minimum backend handoff:

```bash
npm run check:secrets
npm run check:syntax
npm run check:imports
npm run smoke:import
npm run test:route-validation
npm run test:response-codes
npm run test:model-integrity
npm run test:mixed-fields
```

Web / admin / mobile changes are verified in their own repos (see each repo's
CI workflow and README).

Regenerate source-of-truth docs after route/model/auth/contract changes:

```bash
npm run docs:route-report
npm run docs:api-artifacts
npm run docs:database
npm run docs:api-pdf
```

## Current External Blockers

These are not code excuses; complete every adapter, fallback, test, and document
possible before handing back:

- production secrets must be rotated by the owner
- production admin users must be audited against the live database
- live production smoke must run against the real deployment
- SMTP, Firebase/push, Cloudinary/storage, AI provider, domain/HTTPS, hosting, and backup/restore require real owner accounts
- manual/admin subscription launch must be accepted, or an online payment provider must be selected and supplied
- production signing/package/update strategy must be decided before public APK distribution
