# HalaJob 9.5 Readiness Report

## Source

- Branch: `codex/gate-a-mobile-ui-lock`
- Current reviewed app code commit: `f0bdb99`
- Current proof baseline before this refresh: `1fd0b40`
- Date: 2026-06-29
- Backend version/tag: `server@1.0.0`, Node engine `>=20`
- Status: locally improved and proof-green for the focused gates below, but not a final 9.5/public-launch certification.

## Current Verdict

The project is materially stronger than the earlier Gate A package, but this file must not be read as a final 9.5 completion certificate. The branch now has cleaner settings controls, honest CV parsing defaults, broader job-filter coverage, stronger seeker/campus More placement, company mobile profile/settings chrome split, admin web fixed-choice controls, company AI gating tests, and web code splitting that removes the Vite large-chunk warning.

Current rating: 8.4/10 source readiness.

The remaining gap to 9.5 is still UI/IA polish plus owner-controlled launch readiness: full release gate replay from a clean checkout, production smoke, production secrets/provider checks, production signing, and owner real-device approval. The external audit handout dated 2026-06-29 is directionally correct that this branch should not be called final 9.5 until Settings, CV Manager, filters, company IA, and final reproducible proof are tighter.

## Recent Codex 9.5 Polish Commits

| Commit | Summary |
|---|---|
| `f0bdb99` | Splits company mobile header into visible notifications/profile/settings actions, keeps sign out in account settings, and groups company More into AI tools, company files, support, account, and team/templates. |
| `1fd0b40` | Refreshes proof reporting and mobile UI contract guards for the company header/More IA split. |
| `cbe4c51` | Groups seeker/campus More actions and removes duplicate primary campus tab shortcuts from More. |
| `af7f923` | Polishes web CV visibility choices with radio/ticked rows and adds CV Studio regression coverage. |
| `be4d8ca` | Polishes mobile CV visibility selection and related CV manager hierarchy. |
| `0126e83` | Refreshes 9.5 readiness status without claiming final launch certification. |
| `c0d3232` | Guards company web AI hiring tools behind the launch feature flag. |
| `f4eac53` | Replaces admin fixed-choice dropdowns with ticked/radio rows, adds web smoke coverage, and lazy-loads heavy web role surfaces to remove the build chunk warning. |
| `713f878` | Aligns Campus More inventory with the then-current IA guard; later commits tightened More further to avoid primary-tab duplication. |
| `5e062db` | Adds regression coverage proving expanded mobile job-alert filters persist company/category/work-mode/student/fresh-grad/verified-employer filters. |
| `2476e3e` | Defaults CV parsing off until a real parser adapter is configured and shows honest parser-disabled UI on mobile and web. |
| `4030114` | Replaces small web settings/support dropdowns with ticked choices and tests serialization. |
| `de52131` | Makes DB-backed integration suites reusable through external MongoDB via `CONNECTION_URL`; CI uses a MongoDB 7 service container. |

## Proof Run After Current Changes

| Command | Result | Notes |
|---|---|---|
| `flutter test test/widget_test.dart --plain-name "campus more tab exposes student function cards"` | Passed | Campus More no longer duplicates primary Campus tab feed/events/resources/application cards. |
| `flutter test test/widget_test.dart --plain-name "campus more actions open their launch destinations"` | Passed | Remaining Campus More actions open native destinations. |
| `flutter test test/widget_test.dart --plain-name "signs into a company account and opens company dashboard"` | Passed | Company dashboard smoke path covers More without duplicated applicant workflow cards. |
| `flutter test test/widget_test.dart --plain-name "company header exposes universal account actions"` | Passed | Company mobile header exposes separate notifications, profile, and settings actions. Profile opens company profile settings; settings opens account settings with sign out. |
| `flutter test test/widget_test.dart --plain-name "company AI hiring tools are grouped under More when enabled"` | Passed | AI hiring tools appear once under More only when enabled and open the AI tools screen. |
| `flutter test test/widget_test.dart --plain-name "company IA places workflows in owning tabs"` | Passed | Applicants/interviews/reviews stay in Applicants, talent/campus recruiting stay in Talent, and More keeps secondary tools. |
| `flutter test test/widget_test.dart --plain-name "company account profile screen updates owner settings"` | Passed | Company settings path updates account owner details and keeps sign out visible. |
| `flutter test` | Passed | Full mobile widget suite passed: 438 tests. The stale company-support and campus-applications tests were updated to match the current IA instead of the removed duplicate More shortcuts. |
| `flutter analyze` | Passed | Run with the local Flutter 3.44.4 SDK. |
| `powershell.exe -ExecutionPolicy Bypass -File mobile/scripts/assert-mobile-screen-inventory.ps1` | Passed | Mobile screen inventory now protects current More placement, company profile/settings header split, and AI single-entry rules. |
| `flutter build apk --debug` | Passed | Built debug APK from commit `f0bdb99`; Gradle emitted only the existing file_picker Kotlin plugin migration warning. |
| `adb -s emulator-5554 install -r build/app/outputs/flutter-apk/app-debug.apk` | Passed | Fresh APK installed on Android emulator `emulator-5554`. |
| `npm --prefix web test` | Passed | 30 Vitest tests passed. |
| `npm --prefix web run build` | Passed | Web role surfaces are code-split; no large-chunk warning after lazy-loading admin/campus/company/seeker screens. |
| `npm run check:syntax` | Passed | JavaScript syntax check passed. |
| `npm run check:web-routes` | Passed | 315/315 web API calls matched backend routes. |
| `npm run test:launch-gate:ui-contracts` | Passed | Web routes, UI actions, mobile routes, mobile UI contract, and bilingual payload contracts passed. |
| `npm run test:integration:subscriptions` | Passed | Passed standalone after the first aggregate backend gate exited while starting this script. |
| `npm run test:integration:launch-critical` | Passed | Critical launch integrations passed end-to-end with disposable MongoDB database naming. |
| `npm run test:integration:syria-product` | Passed | CV Studio, CV parsing, learning resources, interview prep, saved search alerts, communication hub, salary insights, campus privacy, interview scheduling, talent-pool CRM, and company branding integrations passed. |
| `git diff --check` | Passed | No whitespace errors. |

## APK Status

Fresh debug APK proof now exists for reviewed code commit `f0bdb99`.

- Built artifact: `mobile/build/app/outputs/flutter-apk/app-debug.apk`
- Copied review artifact: `outputs/halajob-f0bdb99-debug.apk`
- Size: 187,248,350 bytes
- Emulator install: passed on `emulator-5554`
- Current auth screenshot: `outputs/halajob-f0bdb99-auth.png`

This is a debug/test APK, not a production-signed Android release. Production APK/AAB signing, versioning, package ID decisions, and store/distribution proof remain owner-controlled launch work.

## Web Status

- Admin/platform settings and shared settings no longer render fixed boolean/small choices as dropdowns.
- Admin support status/priority, university status, subscription status, AI scope, and AI enabled controls now use ticked/radio rows.
- Company web hides AI hiring tools by default and exposes the `ai tools` tab only when `ai_tools_enabled` is true.
- Web build now emits split chunks instead of one oversized main bundle.
- Remaining web e2e proof still depends on a machine where Chromium can access local preview.

## Mobile Status

- Locked navy/cream/orange theme remains protected by the mobile UI contract.
- Settings has been refactored into grouped drill-in panels.
- CV parser UI is honest while parsing is disabled by default.
- Job filters and saved-search persistence have focused regression coverage.
- Seeker/Campus More is grouped and avoids profile/settings/notification duplicates; Campus primary tab shortcuts are no longer duplicated as full More cards.
- Company header now uses separate profile and settings actions. Profile opens company profile settings; settings opens account settings where sign out is visible.
- Company More groups AI tools, company files, support, account, and team/templates; AI hiring tools remain hidden unless enabled.
- A fresh debug APK from the current commit has been built and installed on the emulator for owner visual review.

## Integration Test Reproducibility

Seeded integration scripts prefer `CONNECTION_URL` when provided and rewrite it to a unique disposable database name. CI uses a MongoDB 7 service container, avoiding the `mongodb-memory-server` runtime download path. Local fresh-checkout instructions are documented in `docs/TESTING_GUIDE.md`.

On 2026-06-29, the standalone DB-backed gates above passed locally. The full `npm run test:launch-gate:backend` aggregate is not claimed as green in this report because one run exited while entering the subscriptions integration script; that same subscriptions script and the launch-critical/Syria-product aggregate suites then passed standalone.

## External Blockers

| Blocker | Owner action needed | Current code stance |
|---|---|---|
| Production live smoke | Provide deployed API URL, health secret, and approved test accounts. | Local/static gates are available; production smoke is not claimed. |
| Secret rotation | Rotate any real secret shared in chats, ZIPs, screenshots, old APKs, old repos, or servers. | Secret scanning passes locally, but rotation is owner-controlled. |
| AI provider | Select provider/model/key and approve cost/usage limits, or keep AI disabled. | AI is feature-gated and backend-only; no real provider output is claimed. |
| CV parser provider | Provide and test a real parser adapter if auto-fill is desired. | Parser defaults disabled and UI states this honestly. |
| SMTP/Firebase/storage | Provide production credentials and live delivery/device/upload proof. | Local error handling and route contracts exist; live providers are not claimed. |
| Payments | Accept manual/admin subscription launch or select an online payment provider. | Online checkout/webhooks are not claimed. |
| Production Android release | Decide package ID, signing key, versioning, and distribution path. | Tester APK flow exists; no production-signed APK/AAB is claimed. |
| Owner UI approval | Review a fresh current APK on a real Android device. | Not done in code. |

## Definition Of Done For 9.5

This branch can be called 9.5 only after:

1. Full backend, web, and mobile gates pass from a clean checkout.
2. DB-backed integration gates pass with external MongoDB or a documented binary path.
3. Web build/tests/e2e pass without the chunk warning returning.
4. Flutter analyze/test pass.
5. A fresh APK/AAB is built from the final review commit and installed/smoked.
6. Owner-controlled production/provider/security blockers are either proven or explicitly accepted as launch exclusions.
7. This report is updated with the final commit, command outputs, APK metadata, and remaining blockers.
