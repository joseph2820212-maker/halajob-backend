# Codex Handover Rules

Date: 2026-06-28
Current working branch: `codex/gate-a-mobile-ui-lock`

This repo is being hardened toward the HalaJob 9.5 launch handout. Do not mark
the product launch-ready unless every required gate has passing proof or the
only remaining item is an owner-controlled external blocker documented in the
repo.

## Start Here

Read these files before changing code:

- `docs/HANDOVER.md`
- `docs/launch-hardening-status.md`
- `docs/one-phase-launch-scope.md`
- `docs/PAYMENTS_AND_SUBSCRIPTIONS.md`
- `docs/TESTING_GUIDE.md`
- `docs/MOBILE_WEB_INTEGRATION.md`
- `docs/security/ROLE_PERMISSION_MATRIX.md`

The original owner handout is outside the repo on this workstation:

```text
C:\Users\Admin\Downloads\HALAJOB_FINAL_A_TO_Z_9_5_CODEX_HANDOUT (1).md
```

## Non-Negotiable Rules

- Work from `flutter-seeker-campus` or a branch directly based on it.
- Preserve existing user/developer changes; do not reset or revert unrelated work.
- Do not commit secrets, keystores, Firebase JSON, `.env`, uploads, logs, or backups.
- Do not call mock AI "real AI".
- Do not call manual/admin subscriptions "online payment".
- Do not send or reference stale APKs as fresh builds.
- Do not claim production smoke, provider integrations, admin audit, secret rotation, or real-device mobile approval without proof.

## Required Proof Before Handoff

Run the checks that match the files changed. For broad launch/hardening changes,
use the current full set from `docs/TESTING_GUIDE.md`.

Minimum backend/doc handoff:

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

Web changes:

```bash
npm --prefix web run build
npm --prefix web test
```

Mobile changes:

```bash
cd mobile
flutter analyze
flutter test
```

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

