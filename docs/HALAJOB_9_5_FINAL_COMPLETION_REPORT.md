# HalaJob 9.5 Readiness Report

## Source

- Branch: `codex/gate-a-mobile-ui-lock`
- Current reviewed source commit: `fb2cc30`
- Date: 2026-06-29
- Backend version/tag: `server@1.0.0`, Node engine `>=20`
- Status: improved and focused-gate green for the proof below, but not a final 9.5/public-launch certification.

## Current Verdict

The branch is much stronger than the older `dc251c6` audit package. Settings, CV Manager, filters, company IA, fixed-choice controls, and proof gates have all moved forward. It should still not be called final 9.5 until the full release gate list is replayed from a clean checkout and a fresh current-HEAD APK is rebuilt/smoked.

Current working rating: 8.5/10 source readiness.

The remaining gap to 9.5 is mostly final proof and owner-controlled launch readiness: full backend/web/mobile gate replay, production smoke, production secrets/provider checks, production signing, current-commit APK proof, and owner real-device approval.

## Recent Codex 9.5 Polish Commits

| Commit | Summary |
|---|---|
| `fb2cc30` | Mobile Settings fixed choices now use explicit ticked rows instead of dropdown concepts, with an inventory guard to prevent regression. |
| `c727f65` | Web interview-prep choices use fixed choice controls with regression tests. |
| `dc568dd` | Web resource type/visibility/status choices use fixed choice controls with regression tests. |
| `117a79e` | Admin analytics group filter uses the shared fixed choice control. |
| `66c0b95` | Company member and library fixed choices use ticked/radio controls with tests. |
| `5e4b682` | Company applicant/interview/action choices use ticked controls with tests. |
| `6b2942d` | Web job alerts use canonical backend filter fields and tests. |
| `89dbc89` | Web CV Studio hierarchy is centered on current CV, library, and parser honesty. |
| `be07bc2` | Mobile CV Manager hierarchy is centered on current CV, library, and parser honesty. |
| `c8d2d53` | Mobile/product proof gates were refreshed. |
| `1fd0b40` | 9.5 proof and company UI guards were refreshed. |
| `f0bdb99` | Company mobile chrome and More IA were aligned. |

## Latest Proof Run

| Command | Result | Notes |
|---|---|---|
| `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` | Passed | Protects mobile screen inventory, locked chrome, More placement, company header actions, AI single-entry rules, and Settings fixed-choice source. |
| `flutter analyze` | Passed | Run from `mobile/` with `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat`; no issues found. |
| `npm run test:launch-gate:ui-contracts --silent` | Passed | Web routes, UI actions, mobile routes, mobile UI contract, and bilingual payload contracts passed. |
| `npm --prefix web test -- settings` | Passed | 1 file / 3 tests; proves web Settings has no `<select>` for fixed choices and serializes checkbox/radio values correctly. |
| `git diff --check` | Passed | No whitespace errors. |

## APK Status

A fresh debug APK was built and installed earlier on 2026-06-29 from commit `c727f65`, before the latest `fb2cc30` settings-source commit.

- Built artifact copied to: `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-latest-codex-gate-a-mobile-ui-lock-debug.apk`
- SHA-256: `DA788AA7EC3A1C7257F0497286EDC98B25C8140C4AC416DABB5BB80229FE3A9E`
- Build flags: `LocalCampusAuth=true`, `AI tools enabled=true`, base URL `https://jobzain.com`
- Emulator proof: installed and launched on `emulator-5554`
- Verified screens: auth screen, Campus tester entry, text-field input, and Campus dashboard.

This is now historical APK proof, not current-HEAD APK proof. Rebuild from `fb2cc30` or later before distribution, owner visual approval, or any "latest APK" claim.

## Current Handout Status

| Handout area | Current status |
|---|---|
| Locked mobile theme | Done and guarded by mobile UI/source contracts. |
| Mobile Settings IA | Done: grouped settings index plus drill-in detail panels. |
| Settings fixed choices | Done for mobile and web; mobile source guard and web tests prevent dropdown regression. |
| CV Manager / CV Studio | Improved: current CV hero, library, build-from-profile, parser-disabled honesty, and visibility choice flow are in place. |
| CV parser honesty | Done for launch: parser defaults disabled unless configured; UI does not call it ready. |
| Job filters / saved search | Improved: richer canonical filters and saved-search persistence coverage exist. |
| Seeker/Campus More cleanup | Improved: grouped More sections and no full duplicate primary Campus cards. |
| Company mobile IA | Improved: profile/settings split, sign out in account settings, grouped AI tools, and guarded header actions. |
| Web/admin/company fixed choices | Improved with focused tests across settings, resources, admin analytics, company choices, and interview prep. |
| Proof reproducibility | Partially done: focused gates pass; full clean-checkout release replay remains required. |
| Docs freshness | Improved by this report; must be refreshed again after the final commit and final APK build. |

## External Blockers

| Blocker | Owner action needed | Current code stance |
|---|---|---|
| Production live smoke | Provide deployed API URL, health secret, and approved test accounts. | Not claimed. |
| Secret rotation | Rotate any real secret shared in chats, ZIPs, screenshots, old APKs, old repos, or servers. | Secret scanning exists, but rotation is owner-controlled. |
| AI provider | Select provider/model/key and approve cost/usage limits, or keep AI disabled. | AI is feature-gated; no provider output is claimed. |
| CV parser provider | Provide and test a real parser adapter if auto-fill is desired. | Parser defaults disabled and UI states this honestly. |
| SMTP/Firebase/storage | Provide production credentials and live delivery/device/upload proof. | Local contracts exist; live providers are not claimed. |
| Payments | Accept manual/admin subscription launch or select an online payment provider. | Online checkout/webhooks are not claimed. |
| Production Android release | Decide package ID, signing key, versioning, and distribution path. | Tester APK flow exists; no production-signed APK/AAB is claimed. |
| Owner UI approval | Review a fresh current APK on a real Android device. | Not done in code. |

## Definition Of Done For 9.5

This branch can be called 9.5 only after:

1. Full backend, web, and mobile gates pass from a clean checkout.
2. DB-backed integration gates pass with external MongoDB or a documented binary path.
3. Web build/tests/e2e pass on a machine where Chromium can access local preview.
4. Flutter analyze/test pass after the final mobile UI change.
5. A fresh APK/AAB is built from the final review commit and installed/smoked.
6. Owner-controlled production/provider/security blockers are either proven or explicitly accepted as launch exclusions.
7. This report is updated again with the final commit, command outputs, APK metadata, and remaining blockers.
