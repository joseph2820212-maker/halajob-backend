# HalaJob Full App UI/UX Testing Action Plan

**Target branch/source reviewed:** `halajobe-flutter-seeker-campus (2).zip`  
**Main goal:** make the whole mobile app ready for real phone testing, starting from sign-in and continuing through job seeker, campus, company, and university/admin areas.

This is **not a new product-feature roadmap**. This is a **UI/UX correction and testing-readiness goal**. Do not add onboarding or new product ideas. Use the existing product modules and make them feel like a polished mobile app.

---

## 0. Correct interpretation of the owner feedback

The owner is not asking to copy a web admin layout.

The owner is saying that the **seeker Companies view** is currently one of the tidiest areas because it has organized cream cards and feels like a real app. Use that card style as the reference pattern across the rest of the app.

Reference code/patterns already present:

- `mobile/lib/src/features/dashboard/dashboard_screen.dart`
  - `_openSeekerCompanyDirectory`
  - `_SeekerCompanyDirectorySheet`
  - `_SeekerCompanyCard`
  - `_CompanyDetailPanel`
  - `_CompanyDirectoryLoadingCard`
  - `_CompanyDirectoryNotice`
- `mobile/lib/src/theme/app_theme.dart`
  - `halaCream`, `halaCreamSoft`, `halaNavy`, `halaOrange`, `halaSurface`, `halaCard`
  - `buildHalaSurfaceDecoration`

The current issue is that the app starts to feel organized in card views, then becomes confusing when actions open webview-style surfaces, too many modal sheets, unclear empty states, or crowded headers.

---

## 1. Current code findings that must guide the work

### 1.1 Files carrying most of the UI

Current large UI files:

```text
mobile/lib/src/features/auth/auth_screen.dart                    ~2,009 lines
mobile/lib/src/features/dashboard/dashboard_screen.dart          ~19,299 lines
mobile/lib/src/features/company/company_dashboard_screen.dart    ~11,597 lines
mobile/lib/src/features/university/university_dashboard_screen.dart ~2,637 lines
```

This means most UI/UX fixes should start in these files, but reusable UI components should be extracted into shared widgets instead of making these files larger.

### 1.2 Popup / bottom-sheet overuse

Current bottom-sheet count:

```text
Dashboard / seeker / campus:   28 showModalBottomSheet calls
Company dashboard:             24 showModalBottomSheet calls
University dashboard:           5 showModalBottomSheet calls
```

Bottom sheets are useful only for small actions. They should **not** be the main navigation system.

### 1.3 Webview behavior is causing confusion

Current file:

```text
mobile/lib/src/core/network/external_link.dart
```

Current behavior tries this first:

```dart
LaunchMode.inAppBrowserView
```

This creates the webview-style popup problem. For testing readiness:

- Internal app functions must open native app screens.
- External links should open outside the app by default.
- Do not use an in-app browser for normal app navigation.

### 1.4 Language switch visibility bug is likely real

Current file:

```text
mobile/lib/src/features/auth/auth_screen.dart
```

Current `_LanguageButton` disables the selected button:

```dart
onPressed: selected ? null : onPressed
```

Disabled button styles can override text color, which can make the selected English/Arabic text disappear or become too faint. Replace this with a custom segmented control where selected buttons remain enabled visually and text color is controlled directly.

### 1.5 Company header is overloaded

Current company header includes:

- brand mark
- company name
- email
- account switcher
- notifications
- account profile
- company settings
- refresh
- sign out

This is too much for a mobile header and causes visual noise. The company header should be simplified.

### 1.6 Localization is only partial

Current localization files:

```text
mobile/lib/l10n/app_en.arb
mobile/lib/l10n/app_ar.arb
mobile/lib/src/l10n/hala_job_localizations.dart
```

They contain a small set of keys. Many visible screen strings are still hardcoded in English. For testing readiness, do not translate the entire world, but fix all top-level visible navigation, headers, buttons, empty states, and sign-in/campus/company labels.

### 1.7 Campus access blocker is solvable now

The code already supports local campus auth:

```text
mobile/lib/src/features/auth/campus_local_auth_service.dart
mobile/lib/src/core/config/app_config.dart
mobile/scripts/prepare-mobile-tester-drop.ps1 -LocalCampusAuth
```

For a tester APK, campus access can be enabled without a real student email by building with local campus auth.

---

# Implementation rule

Work through this plan in order. Do not stop after cosmetic changes. The app is ready only when a real tester can move through all main sections without getting lost.

For every screen/action, implement:

- native mobile navigation
- visible back path
- consistent cream card layout
- loading state
- empty state
- error state
- retry where useful
- Arabic/English visible text fix for top-level labels
- widget test or manual QA checklist item

---

# A. Shared mobile design system first

## A1. Create reusable UI widgets

Create shared components under:

```text
mobile/lib/src/widgets/
```

Suggested files:

```text
mobile/lib/src/widgets/hala_app_scaffold.dart
mobile/lib/src/widgets/hala_app_header.dart
mobile/lib/src/widgets/hala_cards.dart
mobile/lib/src/widgets/hala_empty_state.dart
mobile/lib/src/widgets/hala_segmented_control.dart
mobile/lib/src/widgets/hala_action_tiles.dart
mobile/lib/src/widgets/hala_state_notice.dart
```

## A2. Required shared widgets

Implement these reusable widgets:

### `HalaAppScaffold`

Purpose:

- consistent cream gradient background
- safe area handling
- max content width
- consistent bottom padding above nav
- optional bottom navigation

### `HalaAppHeader`

Purpose:

- clean header for seeker, campus, company, and university
- max 3 visible actions
- overflow/account menu for extra actions
- notification badge that is small and controlled
- no big white visual clutter

Header rule:

```text
Left: logo or screen title
Middle: optional subtitle/context
Right: notifications + account/avatar/menu
```

Move refresh, settings, sign out, account switcher, and diagnostics into the account/menu area unless there is a strong reason to show them.

### `HalaCard`

Purpose:

- reusable cream organized card
- default radius 16 or 18
- subtle border
- subtle shadow
- navy/orange icon container

Use this as the base for job cards, company cards, campus cards, application cards, AI cards, and settings cards.

### `HalaModuleCard`

Purpose:

- icon
- title
- subtitle
- status pill/count
- chevron
- disabled/coming-soon/backend-missing state if needed

Use this especially for More sections.

### `HalaSegmentedControl`

Purpose:

- replace current language buttons and filter chips where text visibility is a problem
- selected state must not use disabled button styling
- selected English/Arabic text must always be visible

### `HalaEmptyState`

Purpose:

Replace vague messages like `No resources` / `No records` with explicit states:

1. `No data yet`
2. `Backend not available`
3. `Tester data missing`
4. `Action needed`
5. `Feature not available in this account`

Each state should have:

- title
- short explanation
- optional action button
- optional retry

### `HalaNotice`

Purpose:

- replace large preset/status messages that block navigation
- make notices dismissible when possible
- keep notices short
- do not place long preset messages at the top where they hide the user journey

---

# B. Sign-in and launch page UX

Files:

```text
mobile/lib/src/features/auth/auth_screen.dart
mobile/lib/src/widgets/hala_brand.dart
mobile/lib/src/l10n/hala_job_localizations.dart
mobile/lib/l10n/app_en.arb
mobile/lib/l10n/app_ar.arb
```

## B1. Redesign sign-in as a clean app entry page

The sign-in page should feel like a mobile app, not a technical tester screen.

Required layout:

```text
Top:
- HalaJob logo / brand
- short welcome line
- language segmented control

Middle:
- account type cards:
  - Job seeker
  - Campus student
  - Company

Selected card expands with:
- email/phone input
- password input
- save password
- forgot password where allowed
- primary sign-in button

Bottom:
- create account only for seeker/campus
- small tester/build note only if diagnostics enabled
```

## B2. Fix English/Arabic switch visibility

Replace `_LanguageButton` with `HalaSegmentedControl`.

Acceptance:

- English text is visible when English is selected.
- Arabic text is visible when Arabic is selected.
- Selected tab has navy/orange styling but remains readable.
- Do not set selected segment `onPressed` to `null` just to indicate selection.

## B3. Reduce preset/status clutter

The owner complained that preset messages block navigation. Replace large status cards with smaller inline notices.

Rules:

- Show success/error only after user action.
- Make non-critical notices dismissible.
- Do not show long permanent explanation cards above the login form.
- Hide technical diagnostics in normal tester builds.

## B4. Keep account selection simple

For sign in:

- Job seeker: normal email/phone + password
- Campus: normal student login OR tester mode if local campus auth is enabled
- Company: approved company email/phone + password

For register:

- Do not show company registration.
- Keep seeker/campus register simple.
- Campus remote mode may require academic email.
- Campus local tester mode must allow easy tester access.

---

# C. Campus tester access must be easy

Files:

```text
mobile/lib/src/features/auth/auth_screen.dart
mobile/lib/src/features/auth/campus_local_auth_service.dart
mobile/lib/src/core/config/app_config.dart
mobile/scripts/prepare-mobile-tester-drop.ps1
mobile/docs/mobile-release-checklist.md
```

## C1. Keep production behavior safe

Production/normal backend mode:

- Campus login should still use backend student account rules.
- Academic email verification can remain for real student accounts.

## C2. Add easy QA access for campus mode

When the app is built with local campus auth:

```powershell
powershell -ExecutionPolicy Bypass -File .\mobile\scripts\prepare-mobile-tester-drop.ps1 -BaseUrl https://jobzain.com -LocalCampusAuth
```

The Campus sign-in card should show a clear QA-only option:

```text
Use campus tester account
```

Recommended tester account:

```text
Email: campus.tester@halajob.test
Password: Password1!
```

Implementation options, choose the simpler reliable one:

### Option 1: One-tap create/sign-in

Button behavior:

1. Creates local campus account if it does not exist.
2. Signs in immediately.
3. Opens campus dashboard.
4. Shows a small banner: `Campus tester mode: local device account`.

### Option 2: Prefill account

Button behavior:

1. Fills email and password.
2. User taps Sign in or Create campus account.
3. If account does not exist, show `Create tester campus account`.

Prefer Option 1 for fastest owner testing.

## C3. Local campus tester data

Local campus tester login should still let the owner view:

- campus dashboard
- campus opportunities
- events
- resources
- campus profile
- campus verification UI
- Career Passport foundation
- applications empty state

If real backend AI is unavailable for local token, show:

```text
AI tools need a live backend account. Campus browsing is available in tester mode.
```

Do not block the whole campus mode.

## C4. Acceptance checks

- Owner can open Campus mode without a university email in local tester APK.
- Campus tester login is clearly labelled QA/local and cannot be confused with production verification.
- Campus dashboard opens in under 2 taps from auth page in local tester build.
- Production campus mode still does not silently create fake student accounts.

---

# D. Navigation architecture across the whole app

Files:

```text
mobile/lib/src/features/dashboard/dashboard_screen.dart
mobile/lib/src/features/company/company_dashboard_screen.dart
mobile/lib/src/features/university/university_dashboard_screen.dart
mobile/lib/src/core/network/external_link.dart
```

## D1. Main rule

Major functions must open **native screens**, not webviews and not giant bottom sheets.

Bottom sheets are allowed only for:

- filters
- short selectors
- confirmation dialogs
- tiny forms that do not need deep navigation

Use native screens for:

- job detail
- apply flow
- company detail
- CV manager
- Career Passport
- AI career tools
- campus verification
- campus event detail
- application detail
- company job detail
- company create/edit job
- applicant detail
- company profile settings
- company files
- company AI tools
- university student verification detail
- university opportunity request detail

## D2. Create screen wrappers

Add screen widgets instead of keeping everything as nested bottom-sheet classes.

Suggested paths:

```text
mobile/lib/src/features/dashboard/screens/job_detail_screen.dart
mobile/lib/src/features/dashboard/screens/company_directory_screen.dart
mobile/lib/src/features/dashboard/screens/company_detail_screen.dart
mobile/lib/src/features/dashboard/screens/cv_manager_screen.dart
mobile/lib/src/features/dashboard/screens/career_passport_screen.dart
mobile/lib/src/features/dashboard/screens/ai_career_tools_screen.dart
mobile/lib/src/features/dashboard/screens/campus_verification_screen.dart
mobile/lib/src/features/dashboard/screens/application_detail_screen.dart

mobile/lib/src/features/company/screens/company_job_detail_screen.dart
mobile/lib/src/features/company/screens/company_job_form_screen.dart
mobile/lib/src/features/company/screens/company_applicant_detail_screen.dart
mobile/lib/src/features/company/screens/company_profile_settings_screen.dart
mobile/lib/src/features/company/screens/company_files_screen.dart
mobile/lib/src/features/company/screens/company_ai_tools_screen.dart
mobile/lib/src/features/company/screens/company_team_screen.dart
mobile/lib/src/features/company/screens/company_support_screen.dart

mobile/lib/src/features/university/screens/university_verification_detail_screen.dart
mobile/lib/src/features/university/screens/university_opportunity_request_screen.dart
```

Do not create duplicate business logic. Move UI shell to screens and reuse existing service methods.

## D3. Back navigation

Every pushed screen must have:

- native back button
- Android back button support
- no trapped webview
- no full-screen bottom sheet requiring swipe-down to escape

## D4. Acceptance checks

- Tapping a major card opens a screen with a visible back button.
- Android back returns to the previous screen.
- No internal app function opens a webview.
- Modal sheets are limited to small actions only.

---

# E. External links / webview fix

Files:

```text
mobile/lib/src/core/network/external_link.dart
mobile/test/external_link_test.dart
```

## E1. Change default external link behavior

Current behavior tries `LaunchMode.inAppBrowserView` first. Change it.

New required order:

1. Try `LaunchMode.externalApplication` first.
2. If unavailable, use `LaunchMode.platformDefault` or safe fallback.
3. Do not use `inAppBrowserView` by default.

## E2. Internal actions must not use external links

If the user taps a HalaJob function, open a HalaJob screen.

Only use external links for:

- truly external employer apply link
- external company website
- external resource article/video
- external document URL

## E3. Acceptance checks

- Job detail opens natively.
- Company detail opens natively.
- AI tools open natively.
- Campus resources that are external open outside the app.
- User is never trapped in an in-app browser with no clear back path.
- Update `external_link_test.dart` expectations.

---

# F. Job seeker UX action plan

Main file now:

```text
mobile/lib/src/features/dashboard/dashboard_screen.dart
```

Suggested extracted screen files listed in section D.

## F1. Job seeker home

Make the job seeker home read as:

```text
Header
Welcome / profile score card
Recommended jobs
Application tracker summary
Career Passport / AI card
Quick actions
```

Use organized cream cards matching the seeker Companies card pattern.

## F2. Explore / jobs

Cards should show:

- job title
- company
- location/work mode
- salary/currency when available
- remote/hybrid/onsite pill
- apply status pill
- save icon
- trust/external indicator when relevant

Tapping a job opens a native `JobDetailScreen`.

## F3. Job detail screen

Job detail must include:

- title/company/location/work mode
- description
- requirements
- salary/currency
- trust warning if needed
- AI match explanation if available
- save button
- apply button
- report/review/rate actions if available

If external apply is required, show a confirmation screen/card first:

```text
This employer uses an external application link. We will record your interest, then open the employer site outside the app.
```

Then open outside browser/app, not in-app webview.

## F4. Companies directory

Current Companies view is the reference pattern. Convert it from bottom sheet into a native screen.

Required:

- `CompanyDirectoryScreen`
- company cards with same cream organized style
- filter chips
- company detail screen
- company reviews screen/section
- open jobs list in company detail

## F5. CV manager

Make CV manager a native screen.

Required:

- upload CV
- active CV status
- translation draft/review if available
- AI rewrite entry point
- clear empty state if no CV exists

## F6. Career Passport

Make Career Passport a native screen.

Required cards:

- employability score
- profile completeness
- CV quality
- skills
- languages
- education/campus verification
- work preferences
- missing actions
- share/export controls if available

If AI is not enabled on backend, show:

```text
AI explanation is not enabled yet. Showing rule-based readiness for testing.
```

Do not make it look broken.

## F7. AI career tools

Current AI career tools are bottom-sheet-based. Move to native screen.

Required tools:

- Career Copilot
- Profile Score
- CV Rewrite
- Interview Practice
- Translate CV/Profile
- Job match explanation from job detail
- Cover letter from job detail

Every AI screen must show:

- Generated by AI label
- editable/confirmable output where content can be saved/sent
- loading state
- fallback state
- retry
- safe explanation if backend provider is not enabled

## F8. Application tracker

Make application tracker clear:

Statuses:

```text
Applied
Viewed
Shortlisted
Interview
Rejected
Offer
Withdrawn
External apply recorded
```

If there is no backend data:

```text
No applications yet. Apply to a job to start tracking here.
```

Do not show only `No resources` or `No records`.

---

# G. Campus UX action plan

Main file now:

```text
mobile/lib/src/features/dashboard/dashboard_screen.dart
```

Campus uses `AppRole.campusStudent` inside the same dashboard file. It needs to feel like its own student mode.

## G1. Campus home

Required campus home layout:

```text
Header: Campus / Student mode
Verified student badge or verification needed card
Career Passport / readiness card
Campus opportunities preview
Campus events preview
Campus resources preview
Applications summary
```

## G2. Campus opportunities

Use the same job card style as seeker but with student/campus labels:

- internship
- graduate role
- part-time
- event opportunity
- campus partner
- remote/hybrid/onsite

Tapping opens native `CampusOpportunityDetailScreen` or shared `JobDetailScreen` with campus mode.

## G3. Campus verification

Make it easy to understand:

States:

```text
Not started
Submitted
Under review
Approved
Rejected - action needed
Tester local mode
```

For local tester build, allow opening the verification screen without backend approval. Show a QA badge:

```text
Tester mode: verification UI preview only
```

## G4. Campus events

Events should be cards:

- title
- date/time
- location/online
- host
- register button
- registered status

No raw resource error messages.

## G5. Campus resources

If backend resources are empty but packaged fallback content exists, show fallback resources and label them clearly:

```text
Showing packaged campus resources for testing.
```

If both backend and fallback are empty, show action-needed empty state.

## G6. Campus profile

Profile should be a native screen with cards/checkpoints:

- headline
- university
- specialty
- graduation year
- skills
- projects
- CV status
- phone
- preferred work mode/location

## G7. Campus acceptance checks

- Owner can access campus mode through local tester flow.
- Campus dashboard opens without real student email in local tester APK.
- Verification screen is visible and understandable.
- Opportunities, events, resources, profile, and applications are reachable.
- No campus screen displays vague `No resources` without explanation.

---

# H. Company / employer UX action plan

Main file now:

```text
mobile/lib/src/features/company/company_dashboard_screen.dart
```

Important: the company module already has many functions. The problem is mobile polish and navigation.

## H1. Redesign company header

Current company header has too many actions. Replace with:

```text
Left: company name/status
Subtitle: email or active workspace
Right: notifications + account/menu
```

Move these into menu/More:

- switch account
- account profile
- company settings
- refresh
- sign out

Notification badge should be small. Remove visual clutter that looks like big white dots.

## H2. Keep the organized cream card style

Use the same organized card language from the seeker Companies section.

For every company module card:

- icon container
- title
- subtitle
- status/count pill
- chevron
- clear empty/backend message

Do not use `No records` as the primary badge for modules. Better examples:

```text
Ready
0 items
Needs setup
Backend empty
Open
```

## H3. Convert company bottom sheets into screens

Current company file has ~24 bottom sheets. Convert major modules to native screens.

Screens required:

- Company job detail
- Create/edit job
- Bulk job actions if needed
- Applicant detail
- Interview schedule/update
- Talent search
- AI hiring tools
- Company profile settings
- Account profile
- Company files
- Support
- Team
- Questions
- Templates
- Campus recruiting
- Subscription/billing
- Audit logs

Keep sheets only for:

- delete confirmation
- status selector
- short filter selector

## H4. Company home

Company home should show:

- profile completion/trust summary
- job metrics
- applicant metrics
- top actions
- recent jobs
- recent applicants
- interviews

Use cards, not dense admin rows.

## H5. Jobs tab

Jobs tab should show:

- Create job button
- job cards
- status pills
- applicants count
- quick actions

Tapping a job opens native detail screen.

## H6. Applicants tab

Applicants tab should show:

- applicant cards
- candidate name
- job title
- status
- TES/score if available
- CV status

Tapping opens native applicant detail screen.

## H7. AI hiring tools

Company AI should be a native screen:

- Generate job draft
- Generate hiring message
- Shortlist explanation

If AI provider is not enabled:

```text
AI provider is not enabled on the backend yet. You can still review the tool layout and safe fallback.
```

## H8. Empty state clarity

For each company module:

- If empty because company has no data, say that.
- If empty because route returned 404/500, say backend route is unavailable.
- If empty because tester account has no seeded records, say tester data is missing.

Do not make all empty states look like the feature is unprogrammed.

---

# I. University/admin UX action plan

Main file now:

```text
mobile/lib/src/features/university/university_dashboard_screen.dart
```

## I1. Access and role clarity

University dashboard should only appear for university-admin context. If accessed through account switcher, show:

```text
University admin mode
```

## I2. Dashboard card layout

Use same app card style:

- students
- pending verifications
- employability analytics
- missing skills
- employer partners
- campus opportunities
- outcomes reports

## I3. Convert detail flows to screens

Use screens for:

- student verification detail
- student profile detail
- opportunity request detail
- employer partner detail
- outcomes report detail

Small approval/rejection reason input may remain a bottom sheet.

## I4. Empty states

Examples:

```text
No pending student verification requests.
```

is better than vague. Add action or retry where possible.

---

# J. Arabic/English polish

Files:

```text
mobile/lib/l10n/app_en.arb
mobile/lib/l10n/app_ar.arb
mobile/lib/src/l10n/hala_job_localizations.dart
mobile/lib/src/features/auth/auth_screen.dart
mobile/lib/src/features/dashboard/dashboard_screen.dart
mobile/lib/src/features/company/company_dashboard_screen.dart
mobile/lib/src/features/university/university_dashboard_screen.dart
```

## J1. Minimum required localized areas

Translate at least:

- sign-in page
- account role labels
- bottom navigation labels
- header/account menu labels
- main More actions
- company module titles
- campus module titles
- primary buttons
- empty states
- error/retry labels
- language switch

## J2. Text visibility

Acceptance:

- no selected English/Arabic text disappears
- no white text on cream background
- no navy text on navy background unless intentional and readable
- Arabic uses RTL where app locale is Arabic

## J3. Do not mix Arabic and English in one card unless unavoidable

If locale is English, top-level UI should be English. If Arabic, top-level UI should be Arabic. Backend content may remain as received.

---

# K. Loading, empty, error, and backend-data explanation

Create one shared state component.

## K1. State categories

Use explicit categories:

### No data yet

Example:

```text
No applications yet. Apply to a job to start tracking here.
```

### Tester data missing

Example:

```text
This tester account has no company records yet. Add a job or ask backend to seed test data.
```

### Backend route unavailable

Example:

```text
This backend route is not available yet. The screen is ready, but live data cannot load.
```

### Account/action needed

Example:

```text
Complete your campus profile before submitting verification.
```

### AI provider unavailable

Example:

```text
AI provider is not enabled yet. Showing safe fallback for testing.
```

## K2. Acceptance

- No user-facing section should only say `No resources`, `No records`, or `Failed` without explanation.
- Every important empty state should tell the tester what to do next.

---

# L. Account switcher and role clarity

Files:

```text
mobile/lib/src/session/account_context.dart
mobile/lib/src/session/account_context_service.dart
mobile/lib/src/features/dashboard/dashboard_screen.dart
mobile/lib/src/features/company/company_dashboard_screen.dart
mobile/lib/src/features/university/university_dashboard_screen.dart
```

## L1. Account menu

Add one consistent account menu across seeker, campus, company, university:

- current role/context
- switch account if multiple contexts
- profile/account details
- language
- refresh/sync
- sign out

## L2. Do not show too many header icons

Maximum visible actions in header:

```text
Notifications + account/menu
```

Optional third action only if it is very important.

## L3. Acceptance

- User always knows current mode: Job seeker, Campus, Company, or University admin.
- Switch account is discoverable but not visually noisy.
- Sign out is available but not in the header as a noisy icon.

---

# M. Testing requirements before saying done

## M1. Automated tests to add/update

Add widget tests for:

```text
Sign-in language segmented control keeps text visible
Sign-in role switching remains usable on narrow phone
Campus local tester account button appears only when local campus auth is enabled
Campus local tester button opens campus dashboard
Job seeker Companies opens as native screen, not modal sheet
Job detail opens as native screen with back navigation
AI career tools open as native screen
Company More module cards are visible and tappable
Company header has reduced visible icon count
Company major modules open screens, not bottom sheets
External links prefer externalApplication, not inAppBrowserView
Empty states show meaningful category text
Arabic top-level navigation labels appear in RTL
```

Update existing tests:

```text
mobile/test/widget_test.dart
mobile/test/external_link_test.dart
```

Add new tests if needed:

```text
mobile/test/ui_navigation_test.dart
mobile/test/campus_tester_access_test.dart
mobile/test/company_ui_test.dart
```

## M2. Manual phone QA path

Claude/Codex must produce this checklist after implementation:

### Auth

- Open app
- Switch English/Arabic
- Sign in as seeker
- Sign in as company
- Open campus tester mode in local build
- Check no important text disappears

### Job seeker

- Home
- Jobs/explore
- Job detail
- Apply/external apply
- Companies directory
- Company detail
- CV manager
- Career Passport
- AI tools
- Applications
- Notifications
- Settings/account menu

### Campus

- Campus tester login
- Campus home
- Opportunities
- Event detail/register
- Resources
- Campus verification
- Profile
- Career Passport
- Applications

### Company

- Company home
- Jobs
- Create/edit job
- Job detail
- Applicants
- Applicant detail
- More modules
- AI hiring tools
- Files
- Team
- Support
- Settings/account menu

### University/admin if account exists

- Dashboard
- Student verification
- Student detail
- Opportunities
- Reports

### Navigation

- Android back button works on every native screen
- No trapped webview
- Bottom nav returns to correct sections
- Account menu works
- Sign out returns to clean auth screen

## M3. Build/test commands

Run from `mobile/`:

```bash
flutter pub get
flutter analyze
flutter test
```

Build tester APK as needed:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-mobile-tester-drop.ps1 -BaseUrl https://jobzain.com -LocalCampusAuth
```

If local campus auth is not desired:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-mobile-tester-drop.ps1 -BaseUrl https://jobzain.com
```

---

# N. What not to do

Do not:

- add onboarding now
- add new product features beyond the existing scope
- hide broken navigation behind more bottom sheets
- use webview for internal app actions
- mark features done because foundations exist
- leave `No records` everywhere without explanation
- leave selected language text invisible
- make campus inaccessible to the owner during testing
- add fake production accounts
- put demo/tester buttons in production without a build flag

---

# O. Final required report from Claude/Codex

Before saying the app is ready for testing, report:

```text
1. Files changed
2. Shared UI widgets created
3. Sign-in improvements completed
4. Campus tester access method completed
5. Job seeker screens changed
6. Campus screens changed
7. Company screens changed
8. University/admin screens changed
9. Bottom sheets converted to screens
10. Webview/external link behavior changed
11. Empty states fixed
12. Arabic/English visibility fixes
13. Tests added/updated
14. flutter analyze result
15. flutter test result
16. Tester APK build result
17. Remaining blockers, if any
```

Only acceptable remaining blockers:

- missing real backend account credentials
- missing live AI provider key
- missing Firebase production config
- missing production keystore
- missing Play Store access

UI/UX polish, campus tester access, navigation, and empty states are **not acceptable blockers**. They must be fixed before real testing.

---

# Starter message to send with this file

```text
Read HALAJOB_FULL_APP_UIUX_TESTING_ACTION_PLAN.md fully before editing code.

This is a full-app UI/UX testing-readiness goal. Start at the sign-in page and continue through job seeker, campus, company, and university/admin areas. Do not focus only on the company section.

The seeker Companies view has the clean organized cream-card style the owner likes. Use that style as the reference across the app.

Do not add onboarding or new product ideas. Do not stop at foundations. Make the existing app usable on a real phone.

Top priorities:
1. Fix the sign-in/language/account selection UX.
2. Add easy QA access to campus mode through local campus tester auth.
3. Convert major flows from webview/bottom sheets into native screens with back navigation.
4. Apply the organized cream-card style across job seeker, campus, company, and university sections.
5. Simplify crowded headers, especially company header.
6. Replace vague No resources / No records messages with clear empty/backend/test-data states.
7. Update external links so internal actions never open webview and external links open outside the app.
8. Add/update tests and provide proof.

Before coding, produce a short implementation map with the files you will inspect, modify, and create. Then proceed section by section until the app is ready for real phone testing.
```
