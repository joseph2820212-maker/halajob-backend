# Contributing

Date: 2026-06-28

This repo is in launch-hardening mode. Keep changes small, testable, and tied
to a handout gate or a documented bug.

## Branches

- Base launch work on `flutter-seeker-campus`.
- Use a focused branch name such as `codex/<gate-or-fix>` or `claude/<gate-or-fix>`.
- The GitHub workflow runs for `flutter-seeker-campus`, `codex/**`, `claude/**`,
  pull requests into `flutter-seeker-campus`, and manual dispatch.

## Secrets And Runtime Files

Never commit:

- `.env` files with real values
- Firebase service-account JSON
- Android keystores or signing passwords
- database backups
- uploads, generated CV files, logs, or local runtime artifacts
- provider API keys for AI, email, storage, analytics, or payments

Run before every handoff:

```bash
npm run check:secrets
```

## Setup

Backend:

```bash
npm ci
npm run dev
```

Web:

```bash
npm --prefix web ci
npm --prefix web run build
```

Mobile:

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

## Tests

Use `docs/TESTING_GUIDE.md` as the full source of truth. At minimum, changed
backend code should pass:

```bash
npm run check:syntax
npm run check:imports
npm run smoke:import
npm run test:route-validation
```

Route, model, auth, permission, billing, AI, notification, translation, campus,
or admin changes require the matching verifier scripts from `package.json` and
the testing guide.

## Documentation

Update generated artifacts after route, model, auth, or contract changes:

```bash
npm run docs:route-report
npm run docs:api-artifacts
npm run docs:database
npm run docs:api-pdf
```

Update handover/status docs when a launch gate changes:

- `docs/HANDOVER.md`
- `docs/launch-hardening-status.md`
- `docs/one-phase-launch-scope.md`
- `docs/testing/*.md`

## Pull Request Evidence

Every PR or handoff should state:

- branch and commit hash
- files changed
- commands run and results
- APK or web build evidence when relevant
- screenshots or device proof for UI/mobile changes
- remaining blockers with owner action required

Do not hide external blockers. Production credentials, provider setup, real
device approval, production admin audit, secret rotation, and live smoke tests
must be called out clearly when they are not available.

