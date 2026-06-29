# HalaJob 9.5 Readiness Report

## Source

- Branch: `codex/gate-a-mobile-ui-lock`
- Current reviewed code commit: `c0d3232` (docs-only readiness updates may follow)
- Date: 2026-06-29
- Backend version/tag: `server@1.0.0`, Node engine `>=20`
- Status: locally improved and proof-green for the focused gates below, but not a final 9.5/public-launch certification.

## Current Verdict

The project is materially stronger than the earlier Gate A package, but this file must not be read as a final 9.5 completion certificate. The branch now has cleaner settings controls, honest CV parsing defaults, broader job-filter coverage, stronger Campus More placement, admin web fixed-choice controls, company AI gating tests, and web code splitting that removes the Vite large-chunk warning.

Current rating: 8.6/10 source readiness.

The remaining gap to 9.5 is proof and owner-controlled launch readiness: fresh APK from the current commit, full release gate replay, production smoke, production secrets/provider checks, production signing, and owner real-device approval.

## Recent Codex 9.5 Polish Commits

| Commit | Summary |
|---|---|
| `c0d3232` | Guards company web AI hiring tools behind the launch feature flag. |
| `f4eac53` | Replaces admin fixed-choice dropdowns with ticked/radio rows, adds web smoke coverage, and lazy-loads heavy web role surfaces to remove the build chunk warning. |
| `713f878` | Restores Campus More shortcuts for Campus feed, Events, Resources, Applications, Job alerts, Passport, Verification, and Account status while keeping profile/settings/notifications out of More. |
| `5e062db` | Adds regression coverage proving expanded mobile job-alert filters persist company/category/work-mode/student/fresh-grad/verified-employer filters. |
| `2476e3e` | Defaults CV parsing off until a real parser adapter is configured and shows honest parser-disabled UI on mobile and web. |
| `4030114` | Replaces small web settings/support dropdowns with ticked choices and tests serialization. |
| `de52131` | Makes DB-backed integration suites reusable through external MongoDB via `CONNECTION_URL`; CI uses a MongoDB 7 service container. |

## Proof Run After Current Changes

| Command | Result | Notes |
|---|---|---|
| `flutter test test/widget_test.dart --plain-name "campus more"` | Passed | Campus More cards and destinations now match the inventory contract. |
| `flutter test test/widget_test.dart --plain-name "company header exposes universal account actions"` | Passed | Company mobile header keeps notifications plus account menu, not duplicate profile/settings buttons. |
| `flutter analyze` | Passed | Run with the local Flutter 3.44.4 SDK. |
| `powershell.exe -ExecutionPolicy Bypass -File mobile/scripts/assert-mobile-screen-inventory.ps1` | Passed | Mobile screen inventory now protects the current Campus More and company header contracts. |
| `npm --prefix web test` | Passed | 30 Vitest tests passed. |
| `npm --prefix web run build` | Passed | Web role surfaces are code-split; no large-chunk warning after lazy-loading admin/campus/company/seeker screens. |
| `npm run check:syntax` | Passed | JavaScript syntax check passed. |
| `npm run check:web-routes` | Passed | 313/313 web API calls matched backend routes. |
| `npm run test:launch-gate:ui-contracts` | Passed | Web routes, UI actions, mobile routes, mobile UI contract, and bilingual payload contracts passed. |
| `git diff --check` | Passed | No whitespace errors. |

## APK Status

No fresh APK has been built after reviewed code commit `c0d3232`.

Previous APK proof for `1.0.6+27` is historical only. It was useful to prove text input, local campus tester entry, and emulator install at that earlier source point, but the mobile source changed after that proof. Do not distribute or describe that APK as current without rebuilding from the current commit and recording the new SHA, version metadata, install proof, and screenshots.

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
- Campus More now matches the current screen inventory and avoids profile/settings/notification duplicates.
- A fresh APK from the current commit is still required before owner visual review.

## Integration Test Reproducibility

Seeded integration scripts prefer `CONNECTION_URL` when provided and rewrite it to a unique disposable database name. CI uses a MongoDB 7 service container, avoiding the `mongodb-memory-server` runtime download path. Local fresh-checkout instructions are documented in `docs/TESTING_GUIDE.md`.

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
5. A fresh APK/AAB is built from the current commit and installed/smoked.
6. Owner-controlled production/provider/security blockers are either proven or explicitly accepted as launch exclusions.
7. This report is updated with the final commit, command outputs, APK metadata, and remaining blockers.
