# Syria Launch Product QA

This page is the launch-oriented checklist for the Syria-first product completion work.

## Required Aggregate Gates

Run:

```bash
npm run test:launch-gate
npm run test:launch-gate:backend
npm run test:launch-gate:web
npm run test:launch-gate:ui-contracts
npm run test:launch-gate:mobile
npm run test:integration:syria-product
npm run test:syria-docs
```

The default launch gate wraps backend safety/product checks, CI-critical
authorization and workflow integrations, web build/tests/e2e, and web/mobile
source contracts. The mobile launch gate is a first-class required gate, but it
requires Flutter on PATH; CI installs Flutter and runs the same `flutter pub get`,
`flutter analyze`, and `flutter test` commands.

The backend gate includes the critical-launch-blocker guard, OTP contract,
response-code contract, data-retention contract, object authorization, audit
logging, auth context isolation, company workflow integrations, admin
permission/resource protections, employee CV download security, campus
workflows, the Syria documentation/env handover contract, and the Syria product
aggregate.

The Syria product aggregate covers:

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
npm run test:syria-docs
npm run smoke:import
npm run smoke:http
npm run smoke:cors
npm run test:critical-launch-blockers
npm run test:otp-contract
npm run test:security-http
npm run test:route-validation
npm run test:response-codes
npm run test:model-integrity
npm run test:mixed-fields
npm run test:data-retention
npm run test:global-launch-contract
npm run test:object-authorization
npm run test:audit-logging
npm run check:web-routes
npm run test:launch-gate:web
npm run test:launch-gate:ui-contracts
```

Mobile:

```bash
npm run test:launch-gate:mobile
```

If Flutter is unavailable in the local shell, record that limitation and rely on
CI/mobile contract evidence until a Flutter SDK machine runs the commands.

## Known Owner-Side Checks

- Production secret rotation.
- Live SMTP, push, storage, hosting, and domain smoke tests.
- Production Android signing and device QA.
- Online payments remain blocked until the owner chooses a payment provider.
