# Mobile Web Contract Test Results

Date: 2026-06-28
Branch: `codex/gate-a-mobile-ui-lock`
Commit tested: `9b17a3b`

## Passed Coverage

| Area | Evidence |
|---|---|
| Mobile route mounts | `npm run test:mobile-routes` |
| Campus student routes | `npm run test:mobile-routes` |
| University admin routes | `npm run test:mobile-routes` |
| Legacy employee mobile compatibility routes | `npm run test:mobile-routes` |
| Account context switching/security | `npm run test:integration:auth-context` |
| AI route/safety contract | `npm run test:ai-safety` |
| Translation route mounts | `npm run test:translation-routes` |
| Notification route/event contract | `npm run test:notification-routes` |
| Analytics route/event contract | `npm run test:analytics-routes` |
| Web clean install | `npm --prefix web ci --ignore-scripts` |
| Web production build and SEO prerender | `npm --prefix web run build` |
| Web API/auth/i18n/smoke tests | `npm --prefix web test` passed 4 test files / 9 tests, including 401 scoped logout, dynamic path encoding, i18n, and home/jobs/campus/company/seeker/admin smoke navigation |

## Remaining Required Tests

- Real browser E2E against a deployed backend with approved seeker/company/campus/admin test accounts.
- Fresh mobile APK flow test from the final source commit for seeker and campus student.
- Arabic/English UI route and payload check across mobile and web.
- File upload/download tests with production-like storage.
- Push notification tap-routing tests on a real Android device.
