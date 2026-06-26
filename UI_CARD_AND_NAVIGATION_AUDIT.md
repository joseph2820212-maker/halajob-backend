# UI Card And Navigation Audit

Date: 2026-06-27
Branch: `flutter-seeker-campus`
Latest source commit audited: `acc1236ddd6e13ea8a6e5a9183a5ca8f7d3a873b`
Fresh APK ZIP handed off: `C:\Users\Admin\Downloads\HalaJob-1.0.2+18-UI-Lock-APK.zip`
APK version: `1.0.2+18`
APK SHA-256: `a322c205148b239e339fdb9f111ed0161521b9de6662f851001d2791f5babeda`
Base URL: `https://jobzain.com`
Campus auth mode: `local-device`

## Status

This audit records the current source and fresh APK metadata evidence for the mobile UI lock gates. It does not mark the UI as owner-accepted. Gate 6 visual proof is still pending until screenshots or screen recordings are captured from the same fresh APK or from the owner's real-device test.

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
| Branch | `flutter-seeker-campus` |
| Commit | `acc1236ddd6e13ea8a6e5a9183a5ca8f7d3a873b` |
| Version name | `1.0.2` |
| Version code | `18` |
| Base URL | `https://jobzain.com` |
| Campus auth mode | `local-device` |
| Signing mode | `debug-local` |
| APK SHA-256 | `a322c205148b239e339fdb9f111ed0161521b9de6662f851001d2791f5babeda` |

### Gate 2: Visual System Source Lock

- `mobile/lib/src/theme/app_theme.dart` uses the launch palette: lighter cream background, navy text, orange accents.
- `HalaNativeHeader` uses a light cream/surface header with navy title text and a bottom border.
- `HalaHeaderIconButton` uses surface background, border, navy icon, and orange notification dot.
- Company header source keeps company context, notifications, and one account/menu button rather than a row of icon spots.

Acceptance checks:

```powershell
rg -n "0xFFF3E6D3|0xFFE5D0B1" mobile/lib/src mobile/scripts
```

Result: no matches.

```powershell
rg -n "halaCream = Color\(0xFFF8F0E2\)|halaCreamDeep = Color\(0xFFEBDAC2\)" mobile/lib/src/theme/app_theme.dart mobile/scripts/assert-mobile-screen-inventory.ps1
```

Result:

```text
mobile/lib/src/theme/app_theme.dart:3:const halaCream = Color(0xFFF8F0E2);
mobile/lib/src/theme/app_theme.dart:5:const halaCreamDeep = Color(0xFFEBDAC2);
mobile/scripts/assert-mobile-screen-inventory.ps1:343:    'const halaCream = Color(0xFFF8F0E2);',
mobile/scripts/assert-mobile-screen-inventory.ps1:344:    'const halaCreamDeep = Color(0xFFEBDAC2);',
```

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
| Auth | Sign-in role selection | Hala logo, language switch, job seeker, campus, company cards | Light cream cards, navy text, orange selected accents, readable English/Arabic | Expands inline on the native auth screen | N/A | Clean status/error notice | Pending Gate 6 |
| Auth | Job seeker sign in | Email/phone, password, save password, forgot password, create account | Cream form fields with visible dark text | Native auth/passcode flow | N/A | Validation/status notice | Pending Gate 6 |
| Auth | Campus sign in | Campus login and local-device tester mode | Cream card; QA mode visible in local-campus APK | Native campus auth flow; local-device mode can enter without university email | N/A | Validation/status notice | Pending Gate 6 |
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
| Company | Dashboard header | Company name/logo/status, notification, one account menu | Light header, no white icon spots, no dark chip row | Menu opens account/profile/settings/refresh/sign out actions | N/A | Menu actions route to native screens | Pending Gate 6 |
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

Required proof from the same fresh APK is still pending for:

1. Sign-in screen.
2. Language switch in English.
3. Language switch in Arabic.
4. Job seeker home.
5. Job list.
6. Job detail.
7. Apply flow.
8. Companies view.
9. Company detail.
10. Applications.
11. Career Passport / AI tools.
12. Campus entry.
13. Campus home.
14. Campus resource detail.
15. Company dashboard.
16. Company jobs.
17. Create/edit job.
18. Applicants.
19. Application detail.
20. Company settings/header/menu.
21. University/admin dashboard if available.

Emulator attempt on 2026-06-27:

- `emulator` package installed into the repo-local Android SDK.
- `adb devices` showed no attached Android device.
- `sdkmanager` system image installs for Android 36 and Android 35 both stalled at the `.installer` stage and did not produce a valid AVD system image.
- Partial system image folders were removed after verifying their paths were inside `mobile\.android-sdk`.
- Result: Gate 6 remains pending until a usable emulator is available or the owner provides real-device screenshots/screen recording from the handed-off APK.

## Tests And Guards

Current source checks run against commit `acc1236ddd6e13ea8a6e5a9183a5ca8f7d3a873b`:

- `powershell -ExecutionPolicy Bypass -File .\mobile\scripts\assert-mobile-screen-inventory.ps1`
- `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat analyze`
- `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat test --reporter compact`

Last recorded result before this audit update:

- Mobile screen inventory assertion passed.
- Flutter analyze: no issues found.
- Flutter tests: 412 tests passed.

## Remaining UI Lock Blocker

Gate 6 is not complete until visual proof is captured from the fresh APK or the owner confirms the same APK on a real Android phone. The project must not be described as launch-ready from source checks alone.
