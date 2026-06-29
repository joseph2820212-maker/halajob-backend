# Hala Job Current Handover

Date: 2026-06-29
Branch: `codex/gate-a-mobile-ui-lock`
Current reviewed source commit: `4a135c7` (`Guard campus fixed choice forms`)

## Current Position

This branch is the active Codex 9.5 polish branch. It is not a final 9.5/public-launch certification yet, but it is well past the older Claude handover state and the older `dc251c6` audit package.

The strongest current areas are backend route/validation/security proof, web build/test coverage, mobile locked theme/chrome, Settings IA, CV Manager hierarchy, richer job filters, company profile/settings split, and regression guards.

The remaining 9.5 gap is mostly proof and final product polish: clean full-gate replay from a fresh checkout, owner real-device approval, production/provider smoke, production Android signing, and continued UI/IA review for any confusing or duplicated flows.

## Latest Relevant Commits

| Commit | Summary |
|---|---|
| `4a135c7` | Campus web signup and campus opportunity target forms now use fixed choice rows instead of dropdowns, with tests proving registration and university/company opportunity payloads plus async refresh callbacks. |
| `a809a37` | Company web job posting now uses fixed choice rows for work mode, job type, work time, salary type, and candidate target, with create-payload regression proof. |
| `4d87d14` | Company web support tickets now have tested create/reply flows, fixed choice rows, queue view actions, and a form-reset/refresh fix. |
| `fab3b09` | Admin web tests now prove company queue detail loading and confirmation-gated approve actions, including the cancelled-confirmation path. |
| `c18d9a9` | Web CV Studio now has focused tests for current-CV-first hierarchy, parser-disabled honesty, and radio visibility choices that preserve backend payloads. |
| `11f3988` | Integration tests now have a fast Mongo helper contract and clearer fallback/preflight guidance for `CONNECTION_URL`, `MONGOMS_SYSTEM_BINARY`, or cached `mongodb-memory-server` binaries. |
| `1dd5c20` | Mobile inventory and launch UI-contract guards now explicitly prevent seeker/campus More from duplicating primary flows and company More from reintroducing Jobs/Applicants/Talent dashboard cards. |
| `c39b191` | Backend saved-search filters now preserve and match skills, education level, SYP salary minimum, and currency; integration proof covers create/update/run-now and mobile summary rendering handles list skills cleanly. |
| `dce2c03` | Mobile job filters now include skills, education level, SYP minimum salary, canonical date/job/experience/deadline choices, and saved-alert frequency, with widget and source-inventory coverage. |
| `fb2cc30` | Mobile Settings small fixed choices now use explicit ticked choice rows, and the mobile inventory guard blocks settings dropdown regression. |
| `c727f65` | Web interview-prep choices use fixed choice controls with tests. |
| `dc568dd` | Web resource type/visibility/status choices use fixed choice controls with tests. |
| `117a79e` | Admin analytics grouping uses fixed choice controls. |
| `66c0b95` | Company member/library choices use fixed choice controls with tests. |
| `5e4b682` | Company applicant/interview/action choices use fixed choice controls with tests. |
| `6b2942d` | Web job alerts use canonical backend filters and tests. |
| `89dbc89` | Web CV Studio hierarchy is polished around current CV, library, and parser honesty. |
| `be07bc2` | Mobile CV Manager hierarchy is polished around current CV, library, and parser honesty. |
| `c8d2d53` | Mobile/product gates were refreshed. |
| `f0bdb99` | Company mobile chrome and More IA were aligned. |

## Proof From The Latest Work

Latest focused proof after `4a135c7`:

| Command | Result |
|---|---|
| `npm --prefix web test -- campus` | Passed; 3 campus tests cover signup gender choice rows, university opportunity target payloads, company campus target payloads, and async refresh callbacks. |
| `npm --prefix web test -- company` | Passed; 5 company tests cover applicant actions, member/library metadata, support ticket create/reply, and company job posting fixed choices/payloads. |
| `npm --prefix web test` | Passed; 13 files / 48 tests. |
| `npm --prefix web run build` | Passed; Vite build and SEO prerender completed. |
| `npm run test:launch-gate:ui-contracts --silent` | Passed; web API wiring 317/317, UI actions, mobile routes/UI contract, and bilingual payload contracts all passed. |
| `npm --prefix web test -- admin` | Passed; 2 tests cover analytics fixed choices plus company queue detail and confirmation-gated approve action. |
| `npm --prefix web test -- seeker` | Passed; 2 CV Studio tests cover current CV hierarchy, parser-disabled copy, no dropdowns, and visibility payloads. |
| `npm run test:integration-mongo-helper --silent` | Passed; proves external Mongo URI scoping and the clear memory-server fallback error path without requiring a binary download. |
| `npm run check:syntax --silent` | Passed |
| `npm run check:imports --silent` | Passed |
| `npm run test:integration:saved-search-alerts --silent` | Passed with the shared Mongo helper memory-server fallback. |
| `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` | Passed; now guards canonical More placement and company More primary-flow duplication. |
| `flutter analyze` from `mobile/` using `C:\Users\Admin\Documents\Codex\2026-06-28\ca\work\tools\flutter\bin\flutter.bat` | Passed, no issues |
| `flutter test test\widget_test.dart --plain-name "seeker jobs feed exposes filters and sort controls"` | Passed |
| `flutter test test\widget_test.dart --plain-name "creates job alerts with expanded opportunity filters"` | Passed |
| `flutter test test\seeker_dashboard_service_test.dart --plain-name "creates, runs, updates, and deletes saved searches through app routes"` | Passed |
| `npm --prefix web test -- jobAlerts` | Passed, 2 tests |
| `npm --prefix web run build` | Passed |
| `npm --prefix web test -- settings` | Passed, 3 tests |
| `git diff --check` | Passed |

The web Settings requirement is already covered by `web/src/shared/settings.test.tsx`: no `<select>` is rendered for fixed choices, booleans serialize as checkboxes, and platform launch modes render as radio/ticked choices.

## APK Status

A fresh debug tester APK was built and installed on 2026-06-29 from commit `4d87d14`. Later commits through `4a135c7` change only web code/tests and docs, so the APK remains current for mobile app behavior.

- Output APK: `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-mobile-codex-gate-a-mobile-ui-lock-4d87d14-debug.apk`
- SHA-256: `B065B19DD28EF8FA081B130A3BA6C9CBB2FB438C317DF755047D19BB1FDA1F08`
- Version/build: `1.0.6+27`
- Build flags: `HALA_DEFAULT_BASE_URL=https://jobzain.com`, Campus auth `local-device`, AI tools enabled, debug signing
- Emulator proof: installed and launched on `emulator-5554`
- Verified: fresh uninstall/reinstall, auth screen launch, visible Campus role entry, and current navy/cream/orange auth chrome on `emulator-5554`.

Rebuild again after the next app-code commit before making a new "latest APK" claim.

## What Is Done Against The Current 9.5 Handout

- Locked navy/cream/orange mobile theme remains in place and guarded.
- Mobile Settings is a grouped settings center with drill-in panels.
- Mobile Settings fixed choices no longer use dropdown concepts in source.
- Web Settings booleans and small fixed choices use checkbox/radio rows and have tests.
- Campus web signup and campus opportunity target choices use radio rows with payload tests.
- Admin web company queues have tests for detail panels and confirmation-gated approve actions.
- Company web support tickets and job posting now have focused tests for fixed choices, create/reply/posting payloads, and refresh behavior.
- Mobile and web CV surfaces now emphasize current CV, library, build-from-profile, and honest parser-disabled state.
- Web CV Studio has focused regression tests for the current CV hero, disabled parser state, and radio visibility choices.
- Job filters now include keyword/company/location, skills, education level, date posted, job type, experience, salary/minimum salary, work mode, category, deadline, student/fresh-grad, verified employer, easy apply, and saved-alert frequency with mobile persistence plus backend API round-trip/run-now coverage.
- Seeker/Campus More is grouped and guarded against primary-tab duplication.
- Company mobile separates profile/settings header actions, keeps sign out in account settings, and is guarded against More reintroducing Jobs/Applicants/Talent dashboard cards.
- Company AI hiring tools are grouped and gated instead of scattered.
- Integration Mongo setup now has a fast helper proof and clearer local instructions for Docker/external Mongo, `MONGOMS_SYSTEM_BINARY`, or cached memory-server binaries.
- Launch UI contracts, mobile inventory, and focused web tests are green for the latest slice.

## Still Required Before Calling This 9.5

- Rebuild a fresh APK after the next mobile app-code commit and smoke it before distribution.
- Run the full backend/web/mobile release gate list from a clean checkout.
- Re-run full Flutter tests after any more mobile UI edits.
- Complete real Android device review for seeker, campus, and company.
- Complete production smoke with owner-approved backend URL and test accounts.
- Confirm production secrets, SMTP, Firebase, storage, signing, backups, and provider settings.
- Decide production Android package/signing/distribution path.
- Keep docs updated after the final commit so APK/build proof is not stale.

## Recommended Next Work

1. Continue the 9.5 handout by auditing any remaining mobile/company duplicated flows in runtime or widget tests.
2. Re-run full mobile widget tests after the next mobile UI slice.
3. Rebuild a current APK only when the owner needs another UI review binary.
4. Do not call manual payments online payments, mock/provider-disabled AI real AI, or the CV parser ready without a real configured adapter and tests.
