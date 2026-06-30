# Mobile Web Contract Test Results

Date: 2026-06-30
Branch: `codex/gate-a-mobile-ui-lock`
Source contracts tested through: `a81f332`
Latest APK source build commit: `0b8d933`

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
| Web production build and SEO prerender | `npm --prefix web run build` passed after `a81f332`; SEO prerendered 14 routes |
| Web Settings fixed-choice controls | `npm --prefix web test -- settings` passed 1 file / 3 tests, proving no `<select>` for fixed choices and checkbox/radio serialization compatibility |
| Web job-alert filter/delete contract | `npm --prefix web test -- src/shared/jobAlerts.test.tsx` passed 1 file / 3 tests, proving canonical filters, radio frequency edits, and confirmation-gated saved-search delete |
| Web seeker CV/company/application contracts | `npm --prefix web test -- src/seeker/screens.test.tsx` passed 1 file / 5 tests, proving current-CV-first hierarchy, parser-disabled honesty, no dropdowns, radio visibility payloads, confirmation-gated CV delete, company review rating payloads, and confirmation-gated application withdrawal |
| Web public fixed choices | `npm --prefix web test -- public` passed 1 file / 2 tests, proving public job filters render as segmented buttons and public job ratings preserve the backend payload |
| Web campus fixed-choice forms | `npm --prefix web test -- campus` passed 1 file / 3 tests, proving no dropdowns for campus signup gender or campus opportunity target choices, plus registration and university/company opportunity payloads |
| Web admin workspaces | `npm --prefix web test -- admin` passed 1 file / 3 tests, proving analytics fixed choices, company queue detail loading, confirmation-gated approve actions, and audit/interview-prep sidebar reachability |
| Web company employer tasks | `npm --prefix web test -- company` passed 1 file / 5 tests, proving applicant actions, member/library choices, support ticket create/reply, and company job posting fixed-choice payloads |
| Web notifications destructive action contract | `npm --prefix web test -- src/shared/workflows.test.tsx` passed 1 file / 1 test, proving notification delete requires confirmation before the backend mutation |
| Full web test suite | `npm --prefix web test` passed 16 files / 57 tests after `a81f332` |
| Backend saved-search filter contract | `npm run test:integration:saved-search-alerts` passed after adding API round-trip/run-now proof for skills, education level, salary minimum, and currency filters |
| Mobile expanded job filters | `flutter test test\widget_test.dart --plain-name "seeker jobs feed exposes filters and sort controls"` and `flutter test test\widget_test.dart --plain-name "creates job alerts with expanded opportunity filters"` passed, proving skills, education level, salary minimum, alert frequency, and saved-search persistence |
| UI action wiring | `npm run test:ui-actions` passed 12 source files and 15 route/UI pairs after `a81f332` |
| Arabic/English UI payload contract | `npm run test:bilingual-ui-payload` verifies English/Arabic-only launch scope, web `x-language`/`lan` headers, web RTL/persistence tests, mobile localization key parity for critical chrome/auth/company labels, mobile persisted locale controls, and mobile request language headers |
| Launch UI contract gate | `npm run test:launch-gate:ui-contracts --silent` passed web routes, UI actions, mobile routes, mobile UI contract, canonical More placement, company AI grouping, and bilingual payload contracts |
| Mobile source inventory | `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` passed and now guards mobile Settings fixed-choice rows, expanded opportunity filter groups, seeker/campus More placement, and company More primary-flow duplication against regression |
| Integration Mongo helper | `npm run test:integration-mongo-helper --silent` passed, proving external Mongo URI scoping and clear fallback guidance for memory-server binary/download failures |
| Representative DB integration | `npm run test:integration:saved-search-alerts --silent` passed through the shared Mongo helper |
| Flutter analyzer | `flutter analyze` passed from `mobile/` with no issues |
| Current APK emulator smoke | A debug APK from source commit `0b8d933` installed on `emulator-5554` and proved app launch, visible Campus role entry, visible `Use campus tester account` button, successful Campus tester dashboard entry, diagnostics showing `1.0.6 (27) | debug-apk | 0b8d933 | local-device`, and current cream/navy/orange auth chrome. Built with diagnostics on, local-device campus auth, and AI tools enabled for tester visibility. SHA-256 `630cb2dd94abdfd7c97ce7577bc29774ad085daf195600df2222e6eb2cb43a5b`. Documentation commits after `0b8d933` do not imply a newer APK unless this row and the APK metadata are refreshed together. |

## Remaining Required Tests

- Real browser E2E against a deployed backend with approved seeker/company/campus/admin test accounts.
- Real-phone flow test from the final source commit for seeker, company, and campus student.
- File upload/download tests with production-like storage.
- Push notification tap-routing tests on a real Android device.
