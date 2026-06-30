# Mobile Web Contract Test Results

Date: 2026-06-30
Branch: `codex/gate-a-mobile-ui-lock`
Source contracts tested through: `32bcad0`
Latest APK source build commit: `6227584`

## Passed Coverage

| Area | Evidence |
|---|---|
| Mobile Settings drill-in panels | `flutter test test\widget_test.dart --plain-name "settings"` passed 9 Settings-related widget tests after `e2611c3`, proving grouped Settings index rows, hidden detail controls until drill-in, switch-based notification payloads, Data rights export/delete placement, delete confirmation, account save/upload/relogin, and logout-all confirmation |
| Full launch gate | `npm run test:launch-gate` passed from `80a235a`, covering backend aggregate gates, web clean install/build/tests/E2E, mobile `pub get`/`analyze`/443 tests, and UI contract route/action/mobile/bilingual guards |
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
| Web production build and SEO prerender | `npm --prefix web run build` passed after `b6f5bb2`; SEO prerendered 14 routes |
| Web Settings fixed-choice controls | `npm --prefix web test -- settings` passed 1 file / 3 tests, proving no `<select>` for fixed choices and checkbox/radio serialization compatibility |
| Web job-alert filter/delete contract | `npm --prefix web test -- src/shared/jobAlerts.test.tsx` passed 1 file / 3 tests, proving canonical filters, radio frequency edits, and confirmation-gated saved-search delete |
| Web seeker CV/company/application/interview/offer contracts | `npm --prefix web test -- src/seeker/screens.test.tsx` passed 1 file / 8 tests, proving current-CV-first hierarchy, parser-disabled honesty, no dropdowns, radio visibility payloads, cover-letter preview/download route wiring from the CV Library row, confirmation-gated CV delete, company review rating payloads, confirmation-gated application withdrawal, confirmation-gated interview rejection, and confirmation-gated offer decline |
| Web public fixed choices | `npm --prefix web test -- public` passed 1 file / 2 tests, proving public job filters render as segmented buttons and public job ratings preserve the backend payload |
| Web campus fixed-choice forms | `npm --prefix web test -- campus` passed 1 file / 3 tests, proving no dropdowns for campus signup gender or campus opportunity target choices, plus registration and university/company opportunity payloads |
| Web admin workspaces | `npm --prefix web test -- admin` passed 1 file / 4 tests, proving analytics fixed choices, AI usage-limit feature choices, company queue detail loading, confirmation-gated approve actions, and audit/interview-prep sidebar reachability |
| Web tab reachability guard | `npm run test:web-tab-reachability --silent` passed after `32bcad0`, proving admin, company, seeker, and campus rendered tab panels are declared or explicitly launch-scope allow-listed; the guard caught and fixed the hidden admin `passport` panel by adding it to the visible admin tabs |
| Web company employer tasks | `npm --prefix web test -- company` passed 1 file / 5 tests, proving applicant actions, member/library choices, support ticket create/reply, and company job posting fixed-choice payloads |
| Web shared workflow contracts | `npm --prefix web test -- src/shared/workflows.test.tsx` passed 1 file / 3 tests, proving notification delete requires confirmation before the backend mutation and application question options render as radio rows while preserving answer payloads |
| Full web test suite | `npm --prefix web test` passed 16 files / 63 tests after `f6e6a1f` |
| Web browser E2E smoke | `npm --prefix web run e2e` passed against local Vite preview/Chrome, clicking through campus, university, company, seeker, and admin portal navigation with stubbed API responses |
| DB launch-critical aggregate | `npm run test:integration:launch-critical --silent` passed on rerun with the shared Mongo helper; the individual remaining scripts after an earlier transient stop also passed |
| DB Syria product aggregate | `npm run test:integration:syria-product --silent` passed, covering CV Studio/parsing honesty, learning resources, interview prep, saved searches/job alerts, communication hub, salary insights, campus privacy/workflows, interview scheduling, talent-pool CRM, and company branding |
| Backend saved-search filter contract | `npm run test:integration:saved-search-alerts` passed after adding API round-trip/run-now proof for skills, education level, salary minimum, and currency filters |
| Mobile expanded job filters | `flutter test test\widget_test.dart --plain-name "seeker jobs feed exposes filters and sort controls"` and `flutter test test\widget_test.dart --plain-name "creates job alerts with expanded opportunity filters"` passed, proving skills, education level, salary minimum, alert frequency, and saved-search persistence |
| Mobile CV cover-letter preview/download | `flutter test test\seeker_dashboard_service_test.dart --plain-name "previews seeker cover letters through CV Studio routes"`, `flutter test test\widget_test.dart --plain-name "previews a seeker CV cover letter from backend templates"`, `flutter test test\seeker_dashboard_service_test.dart --plain-name "downloads seeker cover letters through CV Studio routes"`, and `flutter test test\widget_test.dart --plain-name "downloads a seeker CV cover letter from backend templates"` passed after `714fefe`, proving the CV Manager uses backend template/preview/download routes, renders previews, and saves the returned cover-letter text file |
| Mobile university admin notifications | `flutter test test/university_dashboard_service_test.dart test/university_dashboard_screen_test.dart` passed 17 focused tests after `aef1c87`, proving university notifications load from `/notifications/v1`, unread badge data is real, mark-read/mark-all/delete actions call backend routes, and notification taps route to the right university dashboard surfaces |
| Mobile company AI IA guard | `flutter test test\widget_test.dart --plain-name "company AI hiring tools are grouped under More when enabled"` and `flutter test test\widget_test.dart --plain-name "company job details keep AI tools in the dedicated More module"` passed after `92c84c9`, proving company More exposes one AI hiring tools entry when enabled, the dedicated screen keeps the `AI hiring tools` heading instead of `AI support`, individual AI cards or Talent-tab workflows are not spread into More, and Jobs detail no longer exposes duplicated contextual AI actions |
| Mobile seeker AI IA guard | `flutter test test\widget_test.dart --plain-name "seeker AI career tools screen keeps dedicated IA label"` and `flutter test test\widget_test.dart --plain-name "seeker AI career tools are hidden by default for Syria launch"` passed after `289eb64`, proving seeker AI remains hidden unless enabled and the enabled screen keeps the `AI career tools` heading instead of `AI support` |
| UI action wiring | `npm run test:ui-actions` passed 12 source files and 15 route/UI pairs after `b6f5bb2` |
| Arabic/English UI payload contract | `npm run test:bilingual-ui-payload` verifies English/Arabic-only launch scope, web `x-language`/`lan` headers, web RTL/persistence tests, mobile localization key parity for critical chrome/auth/company labels, mobile persisted locale controls, and mobile request language headers |
| Launch UI contract gate | `npm run test:launch-gate:ui-contracts --silent` passed web routes, UI actions, web tab reachability, mobile routes, mobile UI contract, canonical More placement, company AI grouping, and bilingual payload contracts |
| Mobile source inventory | `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` passed and now guards mobile Settings fixed-choice rows, expanded opportunity filter groups, seeker/campus More placement, and company More primary-flow duplication against regression |
| Integration Mongo helper | `npm run test:integration-mongo-helper --silent` passed after `0b9a32a`, proving external Mongo URI scoping, clear fallback guidance for memory-server binary/download failures, and preflight validation for missing/present `MONGOMS_SYSTEM_BINARY` paths |
| Representative DB integration | `npm run test:integration:saved-search-alerts --silent` passed through the shared Mongo helper |
| Mobile launch gate | `npm run test:launch-gate:mobile --silent` passed after `714fefe`; Flutter `pub get`, `analyze`, and full `flutter test` completed with 448 tests passed |
| Current APK emulator smoke | A debug APK from source commit `6227584` installed on `emulator-5554` and proved app launch, visible Campus role entry, visible `Use campus tester account` button, successful Campus tester dashboard entry, diagnostics showing `1.0.6 (27) | debug-apk | 6227584 | local-device`, and current cream/navy/orange auth/campus chrome. Built with diagnostics on, local-device campus auth, and AI tools enabled for tester visibility. SHA-256 `d5f1c9f2de76d53d60fcbff2046ce849da0244e731762e8fbe8d6f49951396d8`. Documentation commits after `6227584` do not imply a newer APK unless this row and the APK metadata are refreshed together. |

## Remaining Required Tests

- Real browser E2E against a deployed backend with approved seeker/company/campus/admin test accounts.
- Real-phone flow test from the final source commit for seeker, company, and campus student.
- File upload/download tests with production-like storage.
- Push notification tap-routing tests on a real Android device.
