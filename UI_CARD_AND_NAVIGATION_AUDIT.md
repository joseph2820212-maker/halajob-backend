# UI Card And Navigation Audit

Date: 2026-06-28
Branch: `codex/gate-a-mobile-ui-lock` directly on `origin/flutter-seeker-campus`
Latest Gate A source commit audited: `ff1c2db4029957c6b3f32d0662e6a49d92ef2b49`
Fresh APK handed off: `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-mobile-campus-tester-latest.apk`
APK version: `1.0.2+22`
APK SHA-256: `e6be45e70b8d514aec1173c9020f9134ea41826bb27cf4fe2cbea83867d11403`
Base URL: `https://jobzain.com`
Campus auth mode: `local-device`
Signing mode: `debug-local`

## Status

This audit records the current source, fresh APK metadata, and PC emulator screenshot evidence for the mobile UI lock gates. It does not mark the UI as owner-accepted. The current APK was rebuilt from the authenticated navy-shell, local campus tester-entry, and handout campus-home fixes, freshly installed on `emulator-5554`, and captured from the same `ff1c2db` build artifact.

Design source decision:

- `HALAJOB_FINAL_A_TO_Z_9_5_CODEX_HANDOUT.md` remains the broader 9.5 implementation handout.
- `Hala Job - New Design Handout (for Codex) - standalone (2).html` is the mobile visual-lock reference for this pass. The rendered handout shows auth as cream/minimal and authenticated top header plus bottom navigation as navy.
- The owner explicitly confirmed the authorization screen is the new good one, so this pass left auth visually intact and corrected the post-login shell/home layout that still felt old.

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
| Build commit | `ff1c2db4029957c6b3f32d0662e6a49d92ef2b49` |
| Version name | `1.0.2` |
| Version code | `22` |
| Base URL | `https://jobzain.com` |
| Campus auth mode | `local-device` |
| Signing mode | `debug-local` |
| APK SHA-256 | `e6be45e70b8d514aec1173c9020f9134ea41826bb27cf4fe2cbea83867d11403` |

### Gate 2: Visual System Source Lock

- `mobile/lib/src/theme/app_theme.dart` uses the launch palette: lighter cream background, navy text, orange accents.
- `HalaNativeHeader` now uses the rendered design handout authenticated shell: navy header, cream title/subtitle, subtle cream border, and orange accent state.
- `HalaHeaderIconButton` uses dark-on-navy icon containers with cream icons and an orange selected/dot state.
- `HalaHeaderMenuButton` and `HalaHeaderMenuItem` are shared header menu controls, so seeker/campus, company, and university headers use one visual language.
- Company, seeker/campus, and university header sources keep notifications as the only standalone action and move profile/settings/switch/refresh/sign-out style actions into one account menu where applicable.
- Local campus tester APKs now expose a visible `Use campus tester account` button only when Campus is selected and remote campus auth is disabled.

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

| Role | Page | Card/Button/Action | Current behavior | Required behavior | Native screen / bottom sheet / external browser | Empty state | Error state | File(s) changed | Test proof | Screenshot/recording |
|---|---|---|---|---|---|---|---|---|---|---|
| Auth | Sign in | Email/phone, password, save password, forgot password, sign-in CTA | Cream native auth screen; owner confirmed this is the new good screen | Keep minimal login, no navy banner, readable fields | Native auth/passcode flow | N/A | Validation/status notice | `mobile/lib/src/features/auth/auth_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-auth.png` |
| Auth | Register | Name, email, date of birth, password | Short launch form, no heavy profile fields | Keep registration compact and route to passcode when required | Native registration/passcode flow | N/A | Field validation/status notice | `mobile/lib/src/features/auth/auth_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-register.png` |
| Auth | Role/account selection | Job seeker, Campus, Company selector | Visible segmented role selector on auth screen | Role selector remains visible and readable in EN/AR | Inline native auth state | N/A | Clean status/error notice | `mobile/lib/src/features/auth/auth_screen.dart` | `assert-mobile-screen-inventory.ps1` | `halajob-1.0.2+22-auth.png`, `halajob-1.0.2+22-campus-auth.png` |
| Auth | Language switch | English/Arabic segmented control | Visible on auth screen with readable selected/unselected states | Maintain readable language switch and RTL Arabic | Inline native auth state | N/A | N/A | `mobile/lib/src/features/auth/auth_screen.dart`, `mobile/lib/l10n/**` | `flutter test --reporter compact`, `npm run check:i18n` | `halajob-1.0.2+22-auth.png`, `halajob-1.0.2+22-language-arabic.png` |
| Auth | Forgot password | Forgot password link and recovery panel | Opens native recovery controls from auth | Keep recovery native; no long bottom sheet | Native auth recovery panel | N/A | Recovery validation/status notice | `mobile/lib/src/features/auth/auth_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-forgot-password.png` |
| Auth | Passcode/OTP | OTP/passcode verification | Native passcode panel with code boxes | Keep verification as native screen/panel with clear error copy | Native auth/passcode flow | N/A | Incorrect/expired code notice | `mobile/lib/src/features/auth/auth_screen.dart` | `flutter test --reporter compact` | Pending full visual capture |
| Auth | Local campus tester login | `Use campus tester account` button | Visible only when Campus + local-device auth are active | QA can enter campus mode without university email | Native auth state, then native campus dashboard | N/A | Local auth failure notice | `mobile/lib/src/features/auth/auth_screen.dart`, `mobile/lib/src/features/auth/campus_local_auth_service.dart` | `flutter test --plain-name "local campus tester shortcut"` | `halajob-1.0.2+22-campus-auth.png`, `halajob-1.0.2+22-campus-home.png` |
| Job seeker | Seeker home | Welcome/profile score, activity, recommendations | Uses shared dashboard shell and compact home after Gate A changes | Shared cream cards, dashboard content above the fold | Native bottom tab | Approved empty cards/notices where data missing | `HalaStateNotice` style load errors | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Job seeker | Job search/list | Search, filters, job cards, chips | Native explore panel with filters and sort controls | Cream cards, navy labels, orange active states | Native tab; filters/sort may use short controls | Clear no-jobs/no-results wording | Clear load/action notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "seeker jobs feed"` | Pending Gate 6 capture |
| Job seeker | Job detail | Job detail cards, trust, skills, highlights | Native detail route | Detail remains native, no bottom sheet | Native `MaterialPageRoute`; external links outside app | Guidance card when data missing | Failed save/report/load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Job seeker | Apply flow | CV selection, answers, apply CTA | Native application flow | Internal apply stays native; external apply opens browser/app | Native screen; external browser for company URLs | Guidance when CV/data missing | Failed apply notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "submits seeker application"` | Pending Gate 6 capture |
| Job seeker | Saved jobs | Saved list and unsave action | Native saved tab/list | Shared cream cards and empty guidance | Native tab | Clear no saved jobs guidance | Failed unsave/save notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Job seeker | Applications | Application list/status | Native applied tab/list | Cream cards and readable status chips | Native tab | No applications guidance | Failed load/action notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Job seeker | Application detail | Timeline, messages, withdraw/interview actions | Native detail route | Detail remains native with short confirmations only | Native `MaterialPageRoute`; short confirmation dialog allowed | Empty messages/timeline guidance | Failed action notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Job seeker | Companies directory | Company cards/details/openings | Native company directory | Organized cream-card style | Native route | Directory empty/loading notice | Directory error notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "opens seeker company directory"` | Pending Gate 6 capture |
| Job seeker | Company detail | Company trust/openings/profile | Native detail route | Detail remains native, external company links outside app | Native screen / external browser | No openings guidance | Directory/detail error notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Job seeker | Career Passport | Score, completeness, share/edit | Native passport route | Cream cards and orange highlights | Native screen | Missing-section cards | Save/share error notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "career passport"` | Pending Gate 6 capture |
| Job seeker | AI career tools | CV rewrite, interview, match, cover letter | Native AI tools route | AI output is labelled suggestion/fallback where provider disabled | Native screen | Provider unavailable fallback card | AI result/error notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "seeker AI career tools"` | Pending Gate 6 capture |
| Job seeker | Notifications | Notification list and routing | Native notification screen | Clear empty notifications and route targets | Native screen | No notifications guidance | Failed read/delete notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "notifications"` | Pending Gate 6 capture |
| Job seeker | Profile/settings | Profile editors and settings | Native profile/settings screens | Cream cards, concise editors, account menu access | Native screens/dialogs for short edits | Missing-profile guidance | Save/upload/session notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Campus | Campus entry | Campus selector and tester mode | `+22` local APK shows tester card and button | Campus QA entry available without university email | Native auth state | N/A | Local auth failure notice | `mobile/lib/src/features/auth/auth_screen.dart` | `flutter test --plain-name "local campus"` | `halajob-1.0.2+22-campus-auth.png` |
| Campus | Tester/local campus mode | One-tap local tester account | Opens native dashboard as `campus.tester@halajob.test` | Button enters dashboard without typing credentials | Native auth to native dashboard | Local tester/demo data guidance | Local storage/auth notice | `mobile/lib/src/features/auth/campus_local_auth_service.dart` | `flutter test --plain-name "local campus tester shortcut"` | `halajob-1.0.2+22-campus-home.png` |
| Campus | Campus home | Welcome, `Your campus`, `Events & resources` | Compact home matches the rendered handout order and no longer shows the old progress-ring hero or old focus section | Navy authenticated shell, cream cards, dashboard content above the fold | Native bottom tab | Campus tester/demo data guidance | Remote sync/load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter analyze`; `flutter test --reporter compact` | `halajob-1.0.2+22-campus-home.png` |
| Campus | Campus verification | Verification status/actions | Native campus verification route | Cream cards, readable status, clear next action | Native screen | Missing verification guidance | Save/submit error notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-campus-verification.png` |
| Campus | Student Passport | Campus profile/readiness | Native profile/passport route | Shared cards and readable status | Native screen | Missing profile guidance | Save/load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-campus-career-passport.png` |
| Campus | Opportunities | Opportunity cards/search/filters | Native Campus tab segmented feed | Cream cards with clear metadata chips | Native tab and detail route | No campus opportunities guidance | Backend/load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-campus-feed.png` |
| Campus | Events | Event list/detail/register | Native event detail route | Cream cards, clear register state | Native screen | No campus events guidance | Register/load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --plain-name "campus event"` | `halajob-1.0.2+22-campus-events.png`, `halajob-1.0.2+22-campus-event-detail.png` |
| Campus | Resources | Resource list | Native resource list/detail | Cream cards with readable categories | Native screen | No campus resources guidance | Load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-campus-resources.png` |
| Campus | Resource detail | Resource bullets/actions | Native detail route | Detail remains native, external URLs outside app | Native screen / external browser | N/A | Load/open notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | `halajob-1.0.2+22-campus-resource-detail.png` |
| Campus | Partner/university detail | Partner/university info | Native detail route where available | Shared cards and clear status | Native screen | No partner detail guidance | Load notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Campus | Campus profile/settings | Profile checkpoints/settings | Native profile/settings screens | Cream cards and concise editors | Native screens/dialogs for short edits | Missing-profile guidance | Save/session notice | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Company | Dashboard header | Company name/logo/status, notification, account menu | Source uses shared navy authenticated header with notifications plus one menu | Navy authenticated shell, no scattered profile/settings/switch buttons | Native dashboard header/menu | N/A | Menu actions route to native screens | `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | `assert-mobile-screen-inventory.ps1` | Pending Gate 6 capture |
| Company | Company stats/cards | Summary, stats, recent jobs/applicants | Shared company dashboard card system | Light cream cards and consistent spacing | Native bottom tab | Company snapshot empty guidance | Load notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company dashboard"` | Pending Gate 6 capture |
| Company | Jobs | Job list and actions | Native jobs tab | Cream cards/forms | Native `_CompanyJobScreen` routes | No jobs guidance | Action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company job screen"` | Pending Gate 6 capture |
| Company | Create/edit job | Job form | Native form route | No long bottom sheet; cream form sections | Native `_CompanyJobFormScreen` | Draft guidance | Save/validation notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "creates a job"` | Pending Gate 6 capture |
| Company | Applicants | Applicant list | Native applicants tab | Cream cards, readable chips | Native tab/detail route | No applicants guidance | Load/action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company applicants"` | Pending Gate 6 capture |
| Company | Application detail | Candidate detail/status/messages | Native applicant screen | Native detail with short confirmations only | Native screen | Missing candidate data guidance | Action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company applicant screen"` | Pending Gate 6 capture |
| Company | Interviews | Schedule/reschedule/cancel/complete | Native applicant/interview flows | Cream cards and clear status | Native screen/dialog for short confirmations | No interviews guidance | Action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "interview"` | Pending Gate 6 capture |
| Company | CV export/download | CV download/export actions | Native applicants/export controls | Clear file/export feedback | Native screen/platform file open | No CV guidance | Export/download notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "exports CV ZIP"` | Pending Gate 6 capture |
| Company | AI hiring tools | Job/candidate/message helpers | Native company AI route | AI output labelled as suggestion/fallback | Native screen | Provider unavailable fallback | AI error/result notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company AI"` | Pending Gate 6 capture |
| Company | Talent search | Talent/help requests | Native talent screens | Cream cards and clear filters | Native screen | No talent guidance | Search/action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company talent"` | Pending Gate 6 capture |
| Company | Company files | Upload/download/delete | Native files module | Cream cards, platform picker only for files | Native screen/platform picker | No files uploaded guidance | Upload/delete/download notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| Company | Team/members | Invite/promote/remove | Native team screen | Cream member cards and clear permission chips | Native screen/short confirmation | No members guidance | Permission/action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "company team"` | Pending Gate 6 capture |
| Company | Templates/preset messages | Message templates | Native templates screen | Cream template cards | Native screen | No templates guidance | Save/delete notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "templates"` | Pending Gate 6 capture |
| Company | Questions/TES | Question library | Native questions screen | Cream question cards | Native screen | No questions guidance | Save/delete notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "questions"` | Pending Gate 6 capture |
| Company | Billing/subscription | Plan request/manual subscription | Native subscription screen | Do not claim online checkout unless provider exists | Native screen | No plan guidance | Billing/action notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "subscription"` | Pending Gate 6 capture |
| Company | Support | Tickets/replies | Native support screen | Cream ticket cards | Native screen | No tickets guidance | Reply/create notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --plain-name "support"` | Pending Gate 6 capture |
| Company | Company profile/settings | Profile, account, language/settings | Native settings/account routes | Light cards, one header account menu | Native screen | Missing profile guidance | Save/upload notice | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | University dashboard | Metrics, verification, students, partners | Native university dashboard | Cream admin dashboard cards | Native dashboard/tabs | Section empty cards | Load/action notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Student verification queue | Queue, approve/reject/request info | Native verification queue | Native cards and readable statuses | Native screen; short reason dialog allowed | No pending requests guidance | Action error/notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Student detail | Student profile/passport/detail | Native detail route | Cream detail cards | Native screen | Missing student data guidance | Load/action notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Opportunities | Opportunity requests/details | Native routes | Cream cards and clear statuses | Native screen | No opportunities guidance | Load/action notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Resources | Resources/actions | Native routes | Cream cards | Native screen | No resources guidance with approved copy | Load/action notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Analytics | Outcomes/report cards | Native report screen | Cream report cards and CSV/export feedback | Native screen | No report data guidance | Save/export/load notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Settings | Account/language/settings | Native settings route | Light cards, one account menu | Native screen | N/A | Save/upload/session notice | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `flutter test --reporter compact` | Pending Gate 6 capture |
| University/Admin | Admin operations available in app/web | App-side university/admin operations and web admin | Mobile university screens plus web admin surfaces | Keep app native; web admin remains browser UI | Native app screens / external web as appropriate | Clear empty states | Clear action notices | `mobile/lib/src/features/university/**`, `web/src/**` | `flutter test --reporter compact`, web tests from branch proof batch | Pending Gate 6 capture |

## Gate 6 Screenshot Proof Checklist

Required proof from the same fresh APK:

| Screen | Evidence | Status |
|---|---|---|
| Sign-in screen | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-auth.png` | Captured from `ff1c2db` APK after clean install/data clear on `emulator-5554`; owner confirmed this authorization screen is the new good one |
| Language switch Arabic | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-language-arabic.png` | Arabic/RTL auth screen captured from the same `+22` APK; selected/unselected segmented controls remain readable |
| Register screen | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-register.png` | Native create-account panel captured from the same `+22` APK; compact launch form visible |
| Forgot password panel | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-forgot-password.png` | Native recovery panel captured from the same `+22` APK; no bottom sheet or webview |
| Campus tester entry | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-auth.png` | Captured from `ff1c2db` APK after tapping `Campus`; visible `Use campus tester account` button |
| Campus dashboard after one-tap | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-home.png` | Button opened native campus dashboard for `campus.tester@halajob.test`; screenshot shows navy authenticated shell, compact `Welcome back`, `Your campus`, and `Events & resources` above the fold |
| Campus feed | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-feed.png` | Campus tab shows Opportunities, Events, and Resources in the native segmented feed |
| Campus resources | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-resources.png` | Dedicated Resources segment captured from the same `+22` APK with three cream-card resources |
| Campus resource detail | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-resource-detail.png` | Native resource detail route captured with summary and bullet guidance |
| Campus events | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-events.png` | Dedicated Events segment captured from the same `+22` APK |
| Campus event detail | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-event-detail.png` | Native event detail route captured with register CTA visible; CTA was not pressed |
| Campus More menu | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-more.png` | Campus More tab captured with Profile, Career Passport, verification, notifications, feed, and events tiles |
| Campus verification | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-verification.png` | Native verification route captured; local tester limitation is explained clearly instead of showing a broken state |
| Campus Career Passport | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-career-passport.png` | Native Career Passport route captured; local tester limitation and privacy guidance are clear |
| Campus More Arabic | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-campus-more-arabic.png` | Extra Arabic campus More capture from the same APK; not required for Gate 6 but useful for RTL visual review |
| Job seeker text input | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-seeker-input-proof.png` | Android input path entered `5551234567` plus masked password into seeker login fields on the `+22` APK |
| Company text input | `C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-1.0.2+22-company-input-proof.png` | Android input path entered `5557778888` plus masked password into company login fields on the `+22` APK |

Still pending for full Gate A acceptance:

1. Job seeker home.
2. Job list.
3. Job detail.
4. Apply flow.
5. Companies view.
6. Company detail.
7. Applications.
8. Career Passport / AI tools with a real seeker or backend campus account.
9. Company dashboard.
10. Company jobs.
11. Create/edit job.
12. Applicants.
13. Application detail.
14. Company settings/header/menu.
15. University/admin dashboard if available.

Local PC Android tooling status on 2026-06-28:

- Android Studio is installed at `C:\Program Files\Android\Android Studio`.
- Android SDK command-line tools, platform tools, build tools, platforms, NDK, CMake, system image, and emulator binary are available under `mobile\.android-sdk`.
- `ANDROID_HOME` and `ANDROID_SDK_ROOT` were set to `C:\Users\Admin\Documents\Codex\2026-06-28\ca\work\halajobe\mobile\.android-sdk`.
- AVD `HalaJob_Pixel_API35` is available and connected as `emulator-5554`.
- The latest tester APK was freshly installed on the emulator; package `com.halajob.halajob_mobile` reports `versionName=1.0.2`, `versionCode=22`, and `lastUpdateTime=2026-06-28 13:39:43`.

## Tests And Guards

Current source checks run against the `codex/gate-a-mobile-ui-lock` working tree:

- `powershell -ExecutionPolicy Bypass -File .\mobile\scripts\assert-mobile-screen-inventory.ps1`
- `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat analyze`
- `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat test --reporter compact`
- `powershell -ExecutionPolicy Bypass -File .\mobile\scripts\build-android.ps1 -BuildTarget release-apk-local -BaseUrl https://jobzain.com -LocalCampusAuth`

Last recorded result before this audit update:

- Mobile screen inventory assertion passed.
- `flutter analyze` passed with no issues.
- `flutter test --reporter compact` passed with 414 tests.
- APK build passed; current SHA-256 is `e6be45e70b8d514aec1173c9020f9134ea41826bb27cf4fe2cbea83867d11403`.
- Flutter analyze: no issues found.
- Flutter tests: 414 tests passed.
- APK build passed; current SHA-256 is recorded in `halajob-mobile-campus-tester-latest.apk.sha256`.
- PC emulator install passed via `adb install -r`; launch, Arabic language switch, register, forgot password, campus tester entry, compact one-tap campus dashboard, campus feed, campus resources/detail, campus events/detail, campus More, campus verification, campus Career Passport, seeker input, and company input screenshots were captured from the current APK.

## Remaining UI Lock Blocker

Gate 6 is not complete until the remaining authenticated seeker/company/university page-by-page visual proof is captured and the owner confirms the same APK on a real Android phone. Auth, campus tester entry, compact campus dashboard, campus resources/events/details, campus More, campus verification/passport limitation states, and seeker/company text input proof are now current for the PC emulator, but the project must not be described as launch-ready from source checks or emulator screenshots alone.
