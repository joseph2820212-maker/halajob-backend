# Mobile Web Contract Test Results

Date: 2026-06-29
Branch: `codex/gate-a-mobile-ui-lock`
Commit tested: source contracts through `a809a37`; APK build from `4d87d14`

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
| Web job-alert filter contract | `npm --prefix web test -- jobAlerts` passed 1 file / 2 tests after the shared saved-search filter type update |
| Web CV Studio hierarchy | `npm --prefix web test -- seeker` passed 1 file / 2 tests, proving current-CV-first hierarchy, parser-disabled honesty, no dropdowns, and radio visibility payloads |
| Web admin company queue | `npm --prefix web test -- admin` passed 1 file / 2 tests, proving analytics fixed choices plus company queue detail loading and confirmation-gated approve actions |
| Web company employer tasks | `npm --prefix web test -- company` passed 1 file / 5 tests, proving applicant actions, member/library choices, support ticket create/reply, and company job posting fixed-choice payloads |
| Full web test suite | `npm --prefix web test` passed 12 files / 45 tests |
| Backend saved-search filter contract | `npm run test:integration:saved-search-alerts` passed after adding API round-trip/run-now proof for skills, education level, salary minimum, and currency filters |
| Mobile expanded job filters | `flutter test test\widget_test.dart --plain-name "seeker jobs feed exposes filters and sort controls"` and `flutter test test\widget_test.dart --plain-name "creates job alerts with expanded opportunity filters"` passed, proving skills, education level, salary minimum, alert frequency, and saved-search persistence |
| UI action wiring | `npm run test:ui-actions` passed 11 source files and 15 route/UI pairs |
| Arabic/English UI payload contract | `npm run test:bilingual-ui-payload` verifies English/Arabic-only launch scope, web `x-language`/`lan` headers, web RTL/persistence tests, mobile localization key parity for critical chrome/auth/company labels, mobile persisted locale controls, and mobile request language headers |
| Launch UI contract gate | `npm run test:launch-gate:ui-contracts --silent` passed web routes, UI actions, mobile routes, mobile UI contract, canonical More placement, company AI grouping, and bilingual payload contracts |
| Mobile source inventory | `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` passed and now guards mobile Settings fixed-choice rows, expanded opportunity filter groups, seeker/campus More placement, and company More primary-flow duplication against regression |
| Integration Mongo helper | `npm run test:integration-mongo-helper --silent` passed, proving external Mongo URI scoping and clear fallback guidance for memory-server binary/download failures |
| Representative DB integration | `npm run test:integration:saved-search-alerts --silent` passed through the shared Mongo helper |
| Flutter analyzer | `flutter analyze` passed from `mobile/` with no issues |
| Current APK emulator smoke | A debug APK from `4d87d14` installed on `emulator-5554` after fresh uninstall/reinstall and proved app launch, visible Campus role entry, and current navy/cream/orange auth chrome. SHA-256 `B065B19DD28EF8FA081B130A3BA6C9CBB2FB438C317DF755047D19BB1FDA1F08`. Later commit `a809a37` changes only web company code/tests, so no APK rebuild was needed for mobile app behavior. |

## Remaining Required Tests

- Real browser E2E against a deployed backend with approved seeker/company/campus/admin test accounts.
- Fresh current-HEAD APK build and real-phone flow test from the final source commit for seeker, company, and campus student.
- File upload/download tests with production-like storage.
- Push notification tap-routing tests on a real Android device.
