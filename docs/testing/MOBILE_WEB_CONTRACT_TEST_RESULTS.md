# Mobile Web Contract Test Results

Date: 2026-06-27
Branch: `flutter-seeker-campus`
Commit tested: `71570c7d3b9912a8b9ed0c3866fb10949a54fed1`

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

## Remaining Required Tests

- Real website flow test for job seeker, company, campus, and admin dashboards.
- Real mobile APK flow test for seeker and campus student.
- Arabic/English UI route and payload check across mobile and web.
- File upload/download tests with production-like storage.
- Push notification tap-routing tests on a real Android device.
