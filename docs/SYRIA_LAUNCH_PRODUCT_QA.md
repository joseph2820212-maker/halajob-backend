# Syria Launch Product QA

This page is the launch-oriented checklist for the Syria-first product completion work.

## Required Aggregate Gates

Run:

```bash
npm run test:launch-gate
npm run test:launch-gate:backend
npm run test:launch-gate:ui-contracts
npm run test:integration:syria-product
```

The full launch gate wraps the backend safety/product checks and the web/mobile
source contracts. The Syria product aggregate covers:

- CV Studio and CV parsing.
- Learning resources.
- Interview preparation.
- Saved searches and job alerts.
- Communication hub.
- Salary insights.
- Campus privacy and career-center flows.
- Interview scheduling.
- Company talent pool CRM.
- Employer branding/public company pages.

## Core Non-Aggregate Gates

Run before release handoff:

```bash
npm run check:syntax
npm run check:imports
npm run check:secrets
npm run check:i18n
npm run smoke:import
npm run smoke:http
npm run smoke:cors
npm run test:security-http
npm run test:route-validation
npm run test:model-integrity
npm run test:mixed-fields
npm run test:global-launch-contract
npm --prefix web run build
npm --prefix web test
npm --prefix web run e2e
```

Mobile:

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

If Flutter is unavailable in the local shell, record that limitation and rely on
CI/mobile contract evidence until a Flutter SDK machine runs the commands.

## Known Owner-Side Checks

- Production secret rotation.
- Live SMTP, push, storage, hosting, and domain smoke tests.
- Production Android signing and device QA.
- Online payments remain blocked until the owner chooses a payment provider.
