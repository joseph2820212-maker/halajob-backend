# UI Card And Navigation Audit

Date: 2026-06-28
Branch: `codex/gate-a-mobile-ui-lock` directly on `origin/flutter-seeker-campus`
Latest Gate A source commit audited: `8c3c9e96191ad2663140b10489bcc9940e638966`
Fresh APK handed off: `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-mobile-campus-tester-latest.apk`
APK version: `1.0.2+19`
APK SHA-256: `c370b415fa2b3b1fec8cb9da4e1cc2f9917545515d483444bd4f1f83f80d97e6`
Base URL: `https://jobzain.com`
Campus auth mode: `local-device`
Signing mode: `debug-local`

## Status

This audit records the current source, fresh APK metadata, and PC emulator screenshot evidence for the mobile UI lock gates. It does not mark the UI as owner-accepted. The current APK was rebuilt from the light-header fix, freshly installed on `HalaJob_Pixel_API35`, and captured from the same `8c3c9e9` build artifact.

Design source decision:

- `HALAJOB_FINAL_A_TO_Z_9_5_CODEX_HANDOUT.md` is the active ChatGPT handout for this branch and explicitly calls out the old dark `HalaNativeHeader` as a Gate A risk.
- `Hala Job - New Design Handout (for Codex) - standalone (2).html` contains an older visual note saying header plus bottom nav stay navy.
- This branch follows the active A-to-Z handout for the shared native header: light cream/surface header, navy text, subtle tan border, no dark navy rectangle, and one account menu for non-notification header actions. Bottom navigation remains navy.

## Gate Evidence

### Gate 1: Build And APK Truth

- `.github/workflows/flutter-mobile-ci.yml` now pins Flutter `3.44.4`.
- The workflow artifact names distinguish fresh APK and metadata artifacts.
- `mobile/scripts/export-latest-apk-zip.ps1` warns that it packages an existing APK and validates APK metadata against `mobile/pubspec.yaml`.
- `mobile/scripts/prepare-mobile-tester-drop.ps1` requires a rebuild before packaging unless `-PackageExistingApkOnly` is explicitly passed.
- Settings/diagnostics can show build label, build mode, base URL, campus auth mode, and commit when supplied through dart defines.

Acceptance checks:

```powershell
rg -n "flutter-version: 3\.35\.3" .github mobile/scripts
```

Result: no matches.

```powershell
rg -n "flutter-version: 3\.44\.4" .github/workflows/flutter-mobile-ci.yml
```

Result:

```text
66:          flutter-version: 3.44.4
117:          flutter-version: 3.44.4
```

Fresh APK metadata:

| Field | Value |
|---|---|
| Branch | `codex/gate-a-mobile-ui-lock` |
| Build commit | `8c3c9e96191ad2663140b10489bcc9940e638966` |
| Version name | `1.0.2` |
| Version code | `19` |
| Base URL | `https://jobzain.com` |
| Campus auth mode | `local-device` |
| Signing mode | `debug-local` |
| APK SHA-256 | `c370b415fa2b3b1fec8cb9da4e1cc2f9917545515d483444bd4f1f83f80d97e6` |

### Gate 2: Visual System Source Lock

- `mobile/lib/src/theme/app_theme.dart` uses the launch palette: lighter cream background, navy text, orange accents.
- `HalaNativeHeader` now uses the A-to-Z handout shell: light `halaSurface` header, navy title, muted subtitle, subtle tan border, and no dark navy rectangle.
- `HalaHeaderIconButton` uses light surface-tint icon containers with navy icons and an orange selected/dot state.
- `HalaHeaderMenuButton` and `HalaHeaderMenuItem` are shared header menu controls, so seeker/campus, company, and university headers use one visual language.
- Company, seeker/campus, and university header sources keep notifications as the only standalone action and move profile/settings/switch/refresh/sign-out style actions into one account menu where applicable.

Acceptance checks:

```powershell
rg -n "0xFFF3E6D3|0xFFE5D0B1" mobile/lib/src mobile/scripts
```

Result: no matches.

```powershell
rg -n "halaCream = Color\(0xFFFCF7EF\)|halaCreamSoft = Color\(0xFFFFFAF2\)|halaCreamDeep = Color\(0xFFEBDAC2\)" mobile/lib/src/theme/app_theme.dart mobile/scripts/assert-mobile-screen-inventory.ps1
```

Result:

```text
mobile/lib/src/theme/app_theme.dart:3:const halaCream = Color(0xFFFCF7EF);
mobile/lib/src/theme/app_theme.dart:4:const halaCreamSoft = Color(0xFFFFFAF2);
mobile/lib/src/theme/app_theme.dart:5:const halaCreamDeep = Color(0xFFEBDAC2);
mobile/scripts/assert-mobile-screen-inventory.ps1:357:    'const halaCream = Color(0xFFFCF7EF);',
mobile/scripts/assert-mobile-screen-inventory.ps1:358:    'const halaCreamSoft = Color(0xFFFFFAF2);',
mobile/scripts/assert-mobile-screen-inventory.ps1:359:    'const halaCreamDeep = Color(0xFFEBDAC2);',
```

```powershell
rg -n "class HalaNativeHeader|color: halaSurface|class HalaHeaderMenuButton|dashboard-account-menu|company-account-menu|university-account-menu" mobile/lib/src mobile/scripts/assert-mobile-screen-inventory.ps1
```

Result: required strings are present in `mobile/lib/src/widgets/hala_cards.dart`, the seeker/campus dashboard, company dashboard, university dashboard, and the screen-inventory guard.

### Gate 3: Navigation Source Lock

Required rule: internal HalaJob actions use native Flutter screens with back navigation; external websites/documents open outside the app.

Acceptance checks:

```powershell
rg -n "showModalBottomSheet|showBottomSheet|LaunchMode\.inAppBrowserView|inAppBrowserView|WebView" mobile/lib mobile/test mobile/scripts
```

Result: matches only the guard list inside `mobile/scripts/assert-mobile-screen-inventory.ps1`.

```powershell
rg -n "class _.*Sheet" mobile/lib/src
```

Result: no matches.

```powershell
rg -n "Navigator\.push|MaterialPageRoute" mobile/lib/src/features/company mobile/lib/src/features/dashboard mobile/lib/src/features/university
```

Result: major seeker, campus, company, and university workflows show native `MaterialPageRoute` navigation.

### Gate 5: Empty And Error State Source Lock

The exact broad plan command is intentionally noisy because it matches Dart identifiers such as `isEmpty` and approved class names such as `HalaEmptyStateCard`.

```powershell
rg -n "No resources|No records|Something went wrong|Empty" mobile/lib/src
```

Justification for matches:

- `isEmpty`, `isNotEmpty`, `supportedBaseUrlOrEmpty`, and similar matches are code identifiers/control flow, not visible UI copy.
- `HalaEmptyStateCard` is the approved empty-state component.
- Exact visible banned copy checks found no matches for `No resources`, `No records`, `Something went wrong`, or quoted `Empty`.

Exact visible-copy check:

```powershell
Get-ChildItem -Recurse .\mobile\lib\src -Filter *.dart |
  Select-String -SimpleMatch 'No resources','No records','Something went wrong','"Empty"',"'Empty'"
```

Result: no matches.

## Page And Action Checklist

| Role | Page | Card / action | Required visual style | Required tap behaviour | Empty state | Error state | Screenshot proof |
|---|---|---|---|---|---|---|---|
| Auth | Sign-in role selection | Hala logo, language switch, job seeker, campus, company cards | Cream background, navy selected role, navy/orange brand, readable English/Arabic | Expands inline on the native auth screen | N/A | Clean status/error notice | `halajob-emulator-launch-screen.png` |
| Auth | Job seeker sign in | Email/phone, password, save password, forgot password, create account | Cream form fields with visible dark text | Native auth/passcode flow | N/A | Validation/status notice | Pending Gate 6 |
| Auth | Campus sign in | Campus login and local-device tester mode | Cream screen; Campus selector visible and selected in local-campus APK | Native campus auth flow; local-device mode can enter without university email | N/A | Validation/status notice | `halajob-emulator-campus-selected.png` |
| Auth | Register | Name, email, date of birth, password | Short launch form, no heavy profile fields | Native registration/passcode flow | N/A | Field validation/status notice | Pending Gate 6 |
| Seeker | Home | Welcome/profile score, search, quick actions, recommendations | Shared cream card system | Native tabs or `MaterialPageRoute` screens | Approved empty cards/notices where data missing | `HalaStateNotice` style load errors | Pending Gate 6 |
| Seeker | Jobs | Search bar, filters, job cards, chips | Cream cards, navy labels, orange active states | Filters/detail/apply use native screens; external apply URL opens outside app | Clear no-jobs/no-results wording | Clear load/action notice | Pending Gate 6 |
| Seeker | Job detail/apply | Detail, CV selection, cover letter/AI helper, application status | Native detail page with card sections | Internal actions stay native; external company URL outside app | Guidance card when CV/data missing | Failed apply/save/report notice | Pending Gate 6 |
| Seeker | Companies | Search, company cards, details, openings, trust markers | Reference organized cream-card style | Company directory/detail native screens | Directory empty/loading notice | Directory error notice | Pending Gate 6 |
| Seeker | Applications | Application list, status chips, detail, messages, interviews | Cream cards and readable status chips | Application detail native screen | "No applications yet" style guidance | Failed action/load notice | Pending Gate 6 |
| Seeker | Career Passport | Score, completeness, missing skills, share/edit | Cream cards and orange highlights | Passport and editors are native screens | Missing-section cards | AI/backend fallback notice | Pending Gate 6 |
| Seeker | AI tools | CV rewrite, interview, match, cover letter | Native card sections | AI tools open native screens | Provider unavailable fallback card | AI result/error notice | Pending Gate 6 |
| Campus | Entry/home | Local campus QA access, home, readiness cards | Same cream dashboard system | Campus home uses native dashboard/screen routes | Campus tester/demo data guidance | Remote sync/load notice | Pending Gate 6 |
| Campus | Opportunities/events/resources | Opportunity cards, event detail, resource detail | Cream cards with clear metadata chips | Internal details native; external URLs outside app | No campus content/resources guidance | Backend route/load notice | Pending Gate 6 |
| Campus | Verification/profile | Verification, Student Passport, profile checkpoints | Cream cards, readable status | Native screens/editors | Missing profile/verification guidance | Clear save/verification errors | Pending Gate 6 |
| Company | Dashboard header | Company name/logo/status, notification, one account menu | Light shared app header, no white/dark floating icon spots, no dark chip row inside body | Menu opens account/profile/settings/refresh/sign out actions | N/A | Menu actions route to native screens | Pending Gate 6 |
| Company | Dashboard cards | Summary, stats, jobs, applicants, modules | Shared cream cards and consistent spacing | Bottom nav/native module routes | Company snapshot empty guidance | Load notice | Pending Gate 6 |
| Company | Jobs | Jobs list, create/edit job, bulk jobs | Cream cards/forms | Native `_CompanyJobScreen` and `_CompanyJobFormScreen` routes | No jobs guidance | Action notice | Pending Gate 6 |
| Company | Applicants/interviews | Applicant detail, status, CV, messages, interview actions | Native cards and readable chips | Native applicant screen plus allowed confirmations | No applicants/interviews guidance | Action notice | Pending Gate 6 |
| Company | Files/team/templates/questions | Files, team, message templates, TES questions | Native cream module screens | Native screens; file picker/platform open where needed | Clear no-data guidance per module | Upload/save/action notice | Pending Gate 6 |
| Company | AI/talent/support/billing/settings | AI hiring, talent search, support, billing, profile settings | Cream cards, orange CTA accents | Native module screens | Backend/provider/tester-data fallback | Action/error notice | Pending Gate 6 |
| University | Dashboard | Metrics, verification, students, partners, opportunities | Cream admin dashboard cards | Native university dashboard/routes | Section empty cards | Load/action notice | Pending Gate 6 |
| University | Verification/student passport | Approve/reject/request info, student detail | Native cards and readable statuses | Native screens; short dialogs only for reason/confirmation | No pending requests guidance | Action error/notice | Pending Gate 6 |
| University | Reports/settings | Analytics, outcomes, account settings | Cream report cards | Native routes | No report data guidance | Save/export/load notice | Pending Gate 6 |
| Shared | Settings/profile/notifications | Account switcher, language, notifications, security/sign-out | Light cards, readable bilingual controls | Native screens; sign-out confirmation allowed | Clear no notifications/data guidance | Clear action notice | Pending Gate 6 |

## Gate 6 Screenshot Proof Checklist

Required proof from the same fresh APK:

| Screen | Evidence | Status |
|---|---|---|
| Sign-in screen | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-emulator-launch-screen.png` | Captured from current `8c3c9e9` APK after fresh install on `emulator-5554` |
| Campus entry selected | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-emulator-campus-selected.png` | Captured from current `8c3c9e9` APK after tapping the visible `Campus` selector |
| Campus selector UI tree | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-emulator-campus-selected-ui.xml` | Current APK UI tree exposes clickable `Campus` role control with bounds `[384,498][696,566]` |

Still pending for full Gate A acceptance:

1. Language switch in Arabic.
2. Job seeker home.
3. Job list.
4. Job detail.
5. Apply flow.
6. Companies view.
7. Company detail.
8. Applications.
9. Career Passport / AI tools.
10. Campus home.
11. Campus resource detail.
12. Company dashboard.
13. Company jobs.
14. Create/edit job.
15. Applicants.
16. Application detail.
17. Company settings/header/menu.
18. University/admin dashboard if available.

Local PC Android tooling status on 2026-06-28:

- Android Studio is installed at `C:\Program Files\Android\Android Studio`.
- Android SDK command-line tools, platform tools, build tools, platforms, NDK, CMake, system image, and emulator binary are available under `mobile\.android-sdk`.
- `ANDROID_HOME` and `ANDROID_SDK_ROOT` were set to `C:\Users\Admin\Documents\Codex\2026-06-28\ca\work\halajobe\mobile\.android-sdk`.
- AVD `HalaJob_Pixel_API35` is available and connected as `emulator-5554`.
- The latest tester APK was freshly installed on the emulator; package `com.halajob.halajob_mobile` reports `versionName=1.0.2`, `versionCode=19`, and `lastUpdateTime=2026-06-28 10:42:51`.

## Tests And Guards

Current source checks run against the `codex/gate-a-mobile-ui-lock` working tree:

- `powershell -ExecutionPolicy Bypass -File .\mobile\scripts\assert-mobile-screen-inventory.ps1`
- `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat analyze`
- `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat test --reporter compact`
- `powershell -ExecutionPolicy Bypass -File .\mobile\scripts\build-android.ps1 -BuildTarget release-apk-local -BaseUrl https://jobzain.com -LocalCampusAuth`

Last recorded result before this audit update:

- Mobile screen inventory assertion passed.
- `flutter analyze` passed with no issues.
- `flutter test --reporter compact` passed with 413 tests.
- APK build passed; current SHA-256 is `c370b415fa2b3b1fec8cb9da4e1cc2f9917545515d483444bd4f1f83f80d97e6`.
- Flutter analyze: no issues found.
- Flutter tests: 413 tests passed.
- APK build passed; current SHA-256 is recorded in `halajob-mobile-campus-tester-latest.apk.sha256`.
- PC emulator install passed via `adb install -r -d`; launch/campus selector screenshots were captured from the current APK.

## Remaining UI Lock Blocker

Gate 6 is not complete until the remaining page-by-page visual proof is captured and the owner confirms the same APK on a real Android phone. The sign-in and campus selector proof is now current for the PC emulator, but the project must not be described as launch-ready from source checks or emulator screenshots alone.
