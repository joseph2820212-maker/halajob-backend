# Hala Job Current Handover

Date: 2026-06-29
Branch: `codex/gate-a-mobile-ui-lock`
Current HEAD: `fb2cc30` (`Polish mobile settings choice controls`)

## Current Position

This branch is the active Codex 9.5 polish branch. It is not a final 9.5/public-launch certification yet, but it is well past the older Claude handover state and the older `dc251c6` audit package.

The strongest current areas are backend route/validation/security proof, web build/test coverage, mobile locked theme/chrome, Settings IA, CV Manager hierarchy, richer job filters, company profile/settings split, and regression guards.

The remaining 9.5 gap is mostly proof and final product polish: clean full-gate replay from a fresh checkout, owner real-device approval, production/provider smoke, production Android signing, and continued UI/IA review for any confusing or duplicated flows.

## Latest Relevant Commits

| Commit | Summary |
|---|---|
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

Latest focused proof after `fb2cc30`:

| Command | Result |
|---|---|
| `powershell -NoProfile -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1` | Passed |
| `flutter analyze` from `mobile/` using `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat` | Passed, no issues |
| `npm run test:launch-gate:ui-contracts --silent` | Passed |
| `npm --prefix web test -- settings` | Passed, 3 tests |
| `git diff --check` | Passed |

The web Settings requirement is already covered by `web/src/shared/settings.test.tsx`: no `<select>` is rendered for fixed choices, booleans serialize as checkboxes, and platform launch modes render as radio/ticked choices.

## APK Status

A debug tester APK was built and installed earlier on 2026-06-29 from commit `c727f65`, with `LocalCampusAuth=true` and `AI tools enabled=true`.

- Output APK: `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-latest-codex-gate-a-mobile-ui-lock-debug.apk`
- SHA-256: `DA788AA7EC3A1C7257F0497286EDC98B25C8140C4AC416DABB5BB80229FE3A9E`
- Emulator proof: installed and launched on `emulator-5554`
- Verified: auth screen, Campus tester entry, login text-field input, and Campus dashboard.

Because `fb2cc30` was committed after that APK build, this APK is now historical proof, not a current-HEAD binary. Rebuild from `fb2cc30` or later before handing out a "latest" APK.

## What Is Done Against The Current 9.5 Handout

- Locked navy/cream/orange mobile theme remains in place and guarded.
- Mobile Settings is a grouped settings center with drill-in panels.
- Mobile Settings fixed choices no longer use dropdown concepts in source.
- Web Settings booleans and small fixed choices use checkbox/radio rows and have tests.
- Mobile and web CV surfaces now emphasize current CV, library, build-from-profile, and honest parser-disabled state.
- Job filters are broader and saved-search persistence has focused coverage.
- Seeker/Campus More is grouped and avoids primary-tab duplication.
- Company mobile separates profile/settings header actions and keeps sign out in account settings.
- Company AI hiring tools are grouped and gated instead of scattered.
- Launch UI contracts, mobile inventory, and focused web tests are green for the latest slice.

## Still Required Before Calling This 9.5

- Rebuild a fresh APK from current HEAD and smoke it after the latest commit.
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
