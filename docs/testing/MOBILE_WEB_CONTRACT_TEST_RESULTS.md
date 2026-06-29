# Mobile Web Contract Test Results

Date: 2026-06-29
Branch: `codex/gate-a-mobile-ui-lock`
Commit tested: current branch after `fb2cc30`

## Passed Coverage

| Area | Evidence |
|---|---|
| Mobile route mounts | `npm run test:mobile-routes` |
| Mobile UI contract | `npm run test:mobile-ui-contract` |
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
| Web Settings fixed-choice controls | `npm --prefix web test -- settings` passed 1 file / 3 tests, proving no `<select>` for fixed choices and checkbox/radio serialization compatibility |
| UI action wiring | `npm run test:ui-actions` passed 11 source files and 15 route/UI pairs |
| Arabic/English UI payload contract | `npm run test:bilingual-ui-payload` verifies English/Arabic-only launch scope, web `x-language`/`lan` headers, web RTL/persistence tests, mobile localization key parity for critical chrome/auth/company labels, mobile persisted locale controls, and mobile request language headers |
| Launch UI contract gate | `npm run test:launch-gate:ui-contracts --silent` passed web routes, UI actions, mobile routes, mobile UI contract, and bilingual payload contracts |
| Mobile source inventory | `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` passed and now guards mobile Settings fixed-choice rows against dropdown regression |
| Flutter analyzer | `flutter analyze` passed from `mobile/` with no issues |
| Historical APK emulator smoke | A debug APK from `c727f65` installed on `emulator-5554` and proved auth, username/password text entry, Campus tester entry, and Campus Tester home. This is not current-HEAD binary proof after `fb2cc30`; rebuild before distribution or owner approval. |

## Remaining Required Tests

- Real browser E2E against a deployed backend with approved seeker/company/campus/admin test accounts.
- Fresh current-HEAD APK build and real-phone flow test from the final source commit for seeker, company, and campus student.
- File upload/download tests with production-like storage.
- Push notification tap-routing tests on a real Android device.
