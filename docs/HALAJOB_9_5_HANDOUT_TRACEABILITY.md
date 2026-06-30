# HalaJob 9.5 Handout Traceability

Date: 2026-06-30
Branch: `codex/gate-a-mobile-ui-lock`
Handout source: `HALAJOB_CURRENT_AUDIT_AND_CODEX_9_5_HANDOUT.md`

This document maps the ChatGPT handout requirements to the current branch state.
It exists so future Codex or Claude passes do not keep re-opening old `dc251c6`
findings that are now fixed and guarded.

## Current Source Proof

| Item | Current evidence |
|---|---|
| Current code/proof branch | `codex/gate-a-mobile-ui-lock` |
| Clean source proof commit | `ff5b8ba` |
| Latest app-code proof baseline | `4898355` |
| Clean checkout gate | `npm run test:launch-gate` passed from detached clean worktree `C:\Users\Admin\Documents\Codex\2026-06-28\ca\work\halajobe-clean-ff5b8ba` |
| Current backend launch gate proof | `npm run test:launch-gate:backend --silent` passed on branch commit `7113eb8` before this docs refresh |
| Current route/UI contract proof | `npm run test:launch-gate:ui-contracts --silent` passed on branch commit `f63140b` before this docs refresh |
| Current tester APK source | `4898355` |
| Current tester APK SHA-256 | `ceb77ccc54fd0e660e25c7fdaaefa3d284a6333e4bef8303b7570847c50f2e8e` |
| APK proof guard | `npm run test:mobile-apk-proof --silent` passed against the latest debug APK metadata |

## Wave Status

| Handout wave | Status | Evidence | Still not code-owned |
|---|---|---|---|
| Wave 1 - Settings UX refactor | Done for launch scope | Mobile Settings uses grouped drill-in panels and focused detail screens; `flutter test test\widget_test.dart --plain-name "settings"` covers grouped rows, account save/upload/relogin, notification switches, data-rights placement, delete confirmation, logout-all confirmation, and ticked choices. Web Settings tests cover checkbox/radio serialization and no boolean fixed-choice `<select>` regressions. | Real-user approval of Settings UX on device. |
| Wave 2 - CV Studio / CV Manager polish and honesty | Done for launch scope | Mobile and web expose a current CV first hierarchy, CV Library actions, cover-letter preview/download, confirmation-gated delete, and CV visibility choices. Parser UI is honest when no provider is configured. `npm run test:integration:cv-studio`, `npm run test:integration:cv-parsing`, focused web CV tests, mobile CV manager widget/service tests, and the mobile source inventory guard cover the flow. | A real parser provider remains optional owner/provider work. |
| Wave 3 - Job filters and saved search polish | Done for launch scope | Mobile filters now cover keyword/location/company/skills/date/job type/experience/salary/work mode/education/category/deadline/student/fresh-grad/verified/easy apply/alert frequency. Saved-search persistence is covered by mobile widget tests and `npm run test:integration:saved-search-alerts`. | Live production search quality tuning against real job data. |
| Wave 4 - Navigation and More cleanup | Done for launch scope | Mobile source inventory and UI contract guards protect seeker/campus/company canonical More placement, prevent company More from duplicating primary tabs, keep AI as one feature-gated entry, and keep seeker live sync below tab content. | Owner visual approval on final Android device. |
| Wave 5 - Web/admin/company polish | Improved and guarded | Web build, 16-file/65-test Vitest suite, tab reachability, route wiring, UI action contracts, bundle-size guard, and E2E smoke prove admin/company/seeker/campus tabs are reachable, key employer/campus actions are wired, and the role-dashboard bundle stays below the launch threshold. Tests cover confirmations, fixed choices, CV Studio, employer pause/resume, interview join/reschedule, campus events, university verification actions, saved-search delete, notification delete, application withdrawal, interview rejection, and offer decline. | Product-owner judgment on whether web density is acceptable for launch. |
| Wave 6 - Test/proof reproducibility | Done for code-owned scope | `npm run test:launch-gate` passed from a detached clean checkout at `ff5b8ba`; web did clean install/build/tests/E2E; mobile ran `pub get`, `analyze`, and 450 tests; backend launch-critical and Syria product aggregates passed. After the `8705162` mobile maintainability extraction, `npm run test:launch-gate:mobile` passed again and the screen inventory guard covers the new `seeker_discovery_widgets.dart` and `seeker_cv_manager_widgets.dart` part files. After the navy authenticated-header fix at `4898355`, `npm run test:launch-gate:mobile --silent` passed again with 450 mobile tests. The route/UI contract gate then passed on branch commit `f63140b`, proving 327/327 web API matches, 332 mobile method/path checks, tab reachability, canonical More placement, bilingual payloads, and locked navy header chrome. The backend launch gate passed again on branch commit `7113eb8`, including the full launch-critical and Syria product DB aggregates. MongoDB integration setup has external URI scoping, `MONGOMS_SYSTEM_BINARY` preflight validation, memory-server fallback guidance, and a helper contract. | None for local code-owned reproducibility; CI/provider availability remains environment-controlled. |
| Wave 7 - Release readiness without manual device check | Done for code-owned scope, not public-launch complete | The current branch has clean launch-gate proof, current APK metadata proof from `4898355`, emulator auth/campus smoke screenshots, and docs refreshed after the APK proof. Manual real-device approval is explicitly excluded from code completion and not claimed. | Production smoke, provider credentials, signing, and owner device approval. |

## Definition Of 9.5 Done Mapping

| Handout definition item | Current state |
|---|---|
| Backend/API gates pass from a clean checkout | Passed inside `npm run test:launch-gate` from clean worktree `ff5b8ba`; current-branch backend launch gate passed again at `7113eb8`. |
| Web build/tests/E2E pass | Passed inside the clean launch gate. |
| Flutter analyze/test pass | Passed inside the clean launch gate with 450 mobile tests. |
| Mobile design contract remains green | Passed by focused `npm run test:mobile-ui-contract --silent`, `mobile\scripts\assert-mobile-screen-inventory.ps1`, and header widget tests after the navy-header fix; mobile UI contract protects the locked navy authenticated header, cream surfaces, orange accents, light status icons, and shared bottom nav. |
| Settings is grouped with detail screens | Passed by mobile Settings widget tests and source inventory guards. |
| CV Manager has active CV hero and honest parser state | Passed by mobile/web CV tests and parser integration docs; real parser provider is not claimed. |
| Job filters match employment-app expectations and saved alerts persist filters | Passed by mobile expanded-filter tests and saved-search integration tests. |
| More/navigation has no confusing duplicate primary surfaces | Passed by mobile source inventory and UI contract guards. |
| Admin/company web screens are reachable and not hidden behind dead tabs | Passed by web tab reachability, web bundle-size guard, and web E2E smoke. |
| Boolean/small-choice controls avoid dropdowns | Passed for launch-critical surfaces by mobile and web fixed-choice tests/contracts. |
| Arabic/English labels exist for new surfaces | Passed by `npm run test:bilingual-ui-payload`; Arabic launch payload is English/Arabic scoped. |
| Provider limits are honest | Kept in `docs/SYRIA_LAUNCH_PRODUCT_QA.md`, `docs/HALAJOB_9_5_FINAL_COMPLETION_REPORT.md`, and this traceability file. |
| Docs are refreshed after final source proof and APK proof is current | Current proof docs now distinguish the clean `ff5b8ba` full launch-gate replay, the focused `8705162` maintainability mobile launch gate, the current `4898355` mobile launch gate/APK rebuild with the restored navy header, the current-branch `f63140b` route/UI contract proof, and the current-branch `7113eb8` backend launch gate. |

## Maintainability Follow-Up

After the clean full launch-gate replay, source commit `4c91980` extracted the seeker-discovery/opportunity-filter widgets from the large mobile dashboard into `mobile/lib/src/features/dashboard/seeker_discovery_widgets.dart`, reducing `dashboard_screen.dart` by about 790 lines. Source commit `8705162` then extracted the CV Manager widgets into `mobile/lib/src/features/dashboard/seeker_cv_manager_widgets.dart`, reducing `dashboard_screen.dart` by another 1,500+ lines. The mobile source inventory guard now requires both part files and protects the expanded opportunity filter controls plus current-CV, CV Library, parser-honesty, visibility, cover-letter, and delete controls, and `npm run test:launch-gate:mobile` passed after the extraction. The same mobile launch gate passed again at `4898355` after the navy authenticated-header regression lock was corrected.

## Owner-Controlled Blockers

The handout excludes manual device review from code completion, but these items
must still be proven or explicitly accepted before public launch:

- Production secret rotation.
- Approved production smoke accounts and deployed API URL.
- Live SMTP/email proof.
- Live Firebase/push proof.
- Live storage/upload/download proof.
- AI provider key, model, pricing, and output QA, or AI disabled.
- CV parser adapter and live parser proof if auto-fill is desired, or parser disabled.
- Online payments only after the owner selects a provider; manual/admin subscription launch is the current honest path.
- Production Android signing, package ID, versioning, and distribution path.
- Owner real-device UI approval from a final APK/AAB.

## Do Not Regress

- Do not reintroduce the old long all-in-one Settings surface.
- Do not use dropdowns for boolean or small fixed-choice launch controls.
- Do not call CV parsing ready while `CV_PARSER_PROVIDER=manual` or no adapter is configured.
- Do not spread company AI cards across More or Jobs; keep one `AI hiring tools` module when enabled.
- Do not duplicate primary bottom-tab flows as large More cards.
- Do not claim a fresh APK unless it was built from the named source commit and `npm run test:mobile-apk-proof --silent` passes.
- Do not claim production smoke, provider integrations, production signing, or owner real-device approval without external evidence.
