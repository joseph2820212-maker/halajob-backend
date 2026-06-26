# Hala Job Mobile UI Card And Navigation Audit

Date: 2026-06-26
Branch: `flutter-seeker-campus`
Status: UI stabilization pass in progress after real-device APK UI/UX failure. Latest code pass removes account-switch bottom sheets, standardizes the main native headers, and tightens the global card/input/button style. Do not mark complete until real-device screenshots/click-through proof is added.

## Owner Decision

Stop feature work and stabilize the app UI/UX first.

The app must use one native mobile design system across job seeker, campus/student, company, university/admin, settings, errors, and empty states:

- Light cream cards.
- Navy text.
- Orange only for important actions, highlights, dots, and selected states.
- No dark normal content cards.
- No invisible white text on white background.
- No empty white icon circles or unclear icon dots.
- No full-page flows in bottom sheets.
- Internal Hala Job actions open native Flutter screens with back navigation.
- Bottom sheets stay only for filters, sorting, short confirmations, and quick action menus.
- External links open the external browser/app, not an in-app trapped web popup.

## Shared Component Standard

Existing shared widgets must be used or extended rather than inventing one-off styles:

- `HalaCard`
- `HalaModuleCard`
- `HalaEmptyStateCard`
- `HalaSegmentedControl`
- `HalaActionTile`
- `HalaSectionHeader`
- `HalaNativeHeader`
- `HalaErrorStateCard`
- `HalaWorkflowBody`

## Current Static Scan Result

Command: `rg -n "showModalBottomSheet|WebView|webview|InAppWebView|Color\(0xFF10C26A\)|green" mobile/lib/src mobile/test`

Result after the 2026-06-26 native-shell stabilization pass:

- Account switchers are now native screens with back navigation for seeker/campus, company, and university/admin.
- Remaining bottom sheets are limited to:
  - opportunity filters: short filter controls, intentionally allowed for now
- No green token or WebView reference found in `mobile/lib/src` or `mobile/test`.
- `git diff --check -- mobile/lib/src/theme/app_theme.dart mobile/lib/src/widgets/hala_cards.dart mobile/lib/src/features/auth/auth_screen.dart mobile/lib/src/features/dashboard/dashboard_screen.dart mobile/lib/src/features/company/company_dashboard_screen.dart mobile/lib/src/features/university/university_dashboard_screen.dart UI_CARD_AND_NAVIGATION_AUDIT.md` passes.
- Lightweight bracket-balance scan passes for all edited Dart files.
- `rg -n -P "(?<!Hala)\bCard\(" mobile/lib/src/features/auth/auth_screen.dart mobile/lib/src/features/dashboard/dashboard_screen.dart mobile/lib/src/features/company/company_dashboard_screen.dart mobile/lib/src/features/university/university_dashboard_screen.dart` returns no plain Material `Card(` calls in the main role feature files.
- Flutter analyzer/device screenshots are still pending because Flutter is not available on this Codex shell PATH.

## Current Fix Pass

Pages/workflows converted or standardized in this pass:

- Dashboard notifications: native `_DashboardWorkflowPage`
- Dashboard settings: native `_DashboardWorkflowPage`
- Seeker profile editors: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- Campus profile editors: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- Seeker career history, education, links, certificates: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- Apply questions: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- AI CV translation review: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- Career Passport edit: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- Job rating/review/report forms: native `_DashboardWorkflowPage` plus `HalaWorkflowBody`
- Company notifications: native `_CompanyWorkflowPage`
- Company records/profile sections: native `_CompanyWorkflowPage`
- Company bulk jobs: native `_CompanyWorkflowPage` plus `HalaWorkflowBody`
- Company create/edit job: native `_CompanyWorkflowPage` plus `HalaWorkflowBody`
- Company job detail: native `_CompanyWorkflowPage` plus `HalaWorkflowBody`
- Company job translation review: native `_CompanyWorkflowPage` plus `HalaWorkflowBody`
- University account details: native `_UniversityWorkflowPage`

Shared components added or expanded:

- `HalaNativeHeader`
- `HalaHeaderIconButton`
- `HalaSectionHeader`
- `HalaErrorStateCard`
- `HalaWorkflowBody`

Global style corrections in the latest pass:

- `HalaHeaderIconButton` now uses darker navy header surfaces instead of pale/white icon spots.
- Legacy `_HalaTitleHeader` detail screens now render through `HalaNativeHeader`, so AI tools, Career Passport, campus verification, company directory, CV manager, job detail, application detail, resources, and events share the same native header family.
- Auth register, verification, recovery, diagnostics, and status surfaces now use the shared Hala card language instead of separate material card styles.
- Company section wrappers now use `HalaCard`.
- University/admin dashboard now uses the same navy header plus cream page-gradient shell as seeker and company.
- Global text fields and primary/secondary buttons now use the same 8px radius rhythm as the card system.
- High-visibility seeker/campus detail screens now use `HalaCard`: job detail, trust/safety, AI support, feedback/safety, focus areas, skills, application status, application timeline, messages, interview/offer response, resource detail, and event detail.
- The company directory card radius and old detail-header icon treatment were tightened to the shared 8px navy/cream/orange rhythm.

Test coverage added:

- `mobile/test/hala_cards_test.dart` covers `HalaNativeHeader`, `HalaErrorStateCard`, and `HalaWorkflowBody`.

## Audit Table

| Role | Page | Card/Button/Action | Current behaviour | Required behaviour | Native screen / bottom sheet / external browser | Empty state | Error state | File(s) changed | Test proof |
| ---- | ---- | ------------------ | ----------------- | ------------------ | ----------------------------------------------- | ----------- | ----------- | --------------- | ---------- |
| Global | App shell | Page background | Uses cream theme but individual pages still create mixed custom containers and cards. | One light cream page background with consistent spacing on every screen. | Native screen | N/A | N/A | Pending | Pending |
| Global | App shell | Universal header | Headers differed between auth, seeker, campus, company, university, and deeper detail screens. Company header had crowded icon area and pale icon spots. | One native header pattern with title/subtitle, optional back arrow, notification icon, and one profile/settings/menu icon. | Native screen | N/A | N/A | `mobile/lib/src/widgets/hala_cards.dart`, `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/features/university/university_dashboard_screen.dart` | `HalaHeaderIconButton` darkened; legacy `_HalaTitleHeader` now uses `HalaNativeHeader`; bracket-balance and `git diff --check` pass; Flutter analyzer/device screenshot pending because Flutter is not on this Codex shell PATH. |
| Global | App shell | Back navigation | Most real pages use `MaterialPageRoute`; remaining bottom sheets are quick account selectors or filters only in static scan. | Every real app function opens as a normal screen with visible back navigation. | Native screen | N/A | N/A | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/features/university/university_dashboard_screen.dart` | Static scan confirms only allowed sheet categories remain; Flutter analyzer/device screenshot pending because Flutter is not on this Codex shell PATH. |
| Global | App shell | Bottom sheets | Remaining static scan shows opportunity filters only. Account switchers have been converted to native screens. | Keep sheets only for short filters, short sort choices, quick menus, or simple confirmations. Convert full forms/pages to screens. | Native screen except allowed short controls | N/A | N/A | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/features/university/university_dashboard_screen.dart` | `rg showModalBottomSheet` shows 1 remaining allowed call for opportunity filters; bracket-balance and `git diff --check` pass; device click-through pending. |
| Global | App shell | External links | External links exist in job/application details. No WebView package was found. | Internal actions stay native; external URLs launch external browser/app only. | External browser/app for external links | N/A | Clear launch failure card if external app cannot open | Pending | Pending |
| Global | Empty states | Empty content | Several sections already use `HalaEmptyStateCard`, but some use vague short strings such as "No linked students loaded yet" or custom local empty widgets. | Every empty area uses `HalaEmptyStateCard` with icon, title, explanation, and action when useful. | Native screen | Required on every empty list/panel | N/A | Pending | Pending |
| Global | Error states | API failure notice | Many failures use snackbar or small notice text. | Every failed API section shows `HalaErrorStateCard` with what failed, known reason, retry button, and no raw technical message. | Native screen | N/A | Required on every API section | `mobile/lib/src/widgets/hala_cards.dart`, `mobile/test/hala_cards_test.dart` | Shared `HalaErrorStateCard` added; screen-by-screen migration pending. |
| Global | Forms | Text fields | Theme has navy input text; converted workflow forms now use `HalaWorkflowBody` and shared input styling. | All text input must have visible navy text, visible labels, and readable validation on Android. | Native screen | N/A | Inline validation plus error card for failed submission | `mobile/lib/src/widgets/hala_cards.dart`, `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/features/company/company_dashboard_screen.dart` | Static styling scan complete; real Android contrast proof pending. |
| Auth | Sign-in / register | Language switch card | Existing `_AuthLanguageSwitch` custom layout. Needs visible selected state audit. | Light cream card, navy text, orange selected indicator, Arabic/English always visible. | Native screen | N/A | Clear auth error card | Pending | Pending |
| Auth | Sign-in / register | Job seeker sign-in card | Existing `_AuthSignInCard` used a separate rounded-card style. | Light cream role card. Opens job seeker login form on same native auth screen or nested native screen. | Native screen | N/A | Clear auth error card | `mobile/lib/src/features/auth/auth_screen.dart` | Card radius aligned to shared 8px system; device screenshot pending. |
| Auth | Sign-in / register | Campus sign-in card | Existing `_AuthSignInCard` plus tester/local mode used separate rounded-card styling. | Light cream role card. Campus QA must be testable without university email blocking tester builds. | Native screen | Explain live university email requirement only in production path | Clear campus auth error card | `mobile/lib/src/features/auth/auth_screen.dart` | Card radius aligned to shared 8px system; tester card remains available; device screenshot pending. |
| Auth | Sign-in / register | Company sign-in card | Existing company role path in auth used separate rounded-card styling. | Light cream role card. Opens company login/register path clearly. | Native screen | N/A | Clear company auth error card | `mobile/lib/src/features/auth/auth_screen.dart` | Card radius aligned to shared 8px system; device screenshot pending. |
| Auth | Sign-in / register | Register card | Existing register mode uses name, email, date of birth, password. Card surface was separate from shared Hala card style. | Required fields only at registration: name, email, date of birth, password. Other fields move to profile completion. | Native screen | N/A | Field validation and submit error card | `mobile/lib/src/features/auth/auth_screen.dart` | Register card now uses `HalaCard`; bracket-balance and `git diff --check` pass; device screenshot pending. |
| Auth | Sign-in / register | Role/account selector card | Existing role cards included a dark selected register state. | Consistent light cream cards; selected role visible in orange/navy. | Native screen | N/A | Clear role selection error | `mobile/lib/src/features/auth/auth_screen.dart` | Selected register role card changed to light cream/navy/orange; device screenshot pending. |
| Auth | Sign-in / register | Forgot password card/action | Existing recovery flow stayed inline but used a one-off custom rounded panel. | Clean light cream card/action below password. Opens native password recovery screen or compact inline recovery card if intentionally kept on auth. | Native screen / compact inline auth card | N/A | Clear recovery error card | `mobile/lib/src/features/auth/auth_screen.dart` | Recovery panel now uses shared Hala card styling; full native recovery route still pending design decision; bracket-balance and `git diff --check` pass. |
| Auth | Sign-in / register | Save password option | Existing `_SavePasswordOption`. | Visible checkbox/toggle with navy text and orange selected state. | Native screen | N/A | N/A | Pending | Pending |
| Auth | Sign-in / register | Loading state | Existing submit loading. | Button loading state plus no layout jump. | Native screen | N/A | N/A | Pending | Pending |
| Auth | Sign-in / register | Status/error card | Existing `_StatusCard` used a plain material card. | Replace/standardize with `HalaErrorStateCard` or `HalaStateNotice` style, no vague errors. | Native screen | N/A | Required | `mobile/lib/src/features/auth/auth_screen.dart` | `_StatusCard` now uses `HalaCard` and emphasized border for error tone; wording audit still pending; bracket-balance and `git diff --check` pass. |
| Job seeker | Home | Welcome/header card | Existing dashboard header/session card mix. | Universal native header plus light cream welcome card. | Native screen | N/A | Error card if dashboard data fails | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Header simplified to notification plus one account menu; device screenshot pending. |
| Job seeker | Home | Search card | Existing search/feed controls. | Light cream search card; opens job search/listing screen. | Native screen | If no recent search, show helpful hint | Error card if search fails | Pending | Pending |
| Job seeker | Home | Quick action cards | Existing `_QuickActionGrid` and module cards. | Use `HalaActionTile` or `HalaModuleCard` consistently. Every card opens a native screen. | Native screen | Disabled only with clear reason | Error card if action cannot load | Pending | Pending |
| Job seeker | Home | Recommended jobs card | Existing opportunities/job list. | Light cream job cards; tap opens native job detail. | Native screen | "No jobs found yet" with search/profile action | Error card with retry | Pending | Pending |
| Job seeker | Home | Companies card | Company directory exists and is owner-approved reference. | Keep light cream company directory style and reuse its card language elsewhere. | Native screen | "No companies found yet" with retry/search action | Error card with retry | Pending | Pending |
| Job seeker | Home | Applications card | Existing `_ApplicationsPanel`. | Light cream list cards; tap opens native application detail. | Native screen | "No applications yet. Apply to a job to see it here." | Error card with retry | Pending | Pending |
| Job seeker | Home | Saved jobs card | Existing saved item indicators. | Light cream list and clear saved icon. | Native screen | "No saved jobs yet." | Error card with retry | Pending | Pending |
| Job seeker | Home | Career Passport card | Existing native `_CareerPassportScreen`. Some edit flows are bottom sheets. | Card opens native Career Passport screen; edit should be native screen or short editor only if small. | Native screen | Explain profile data needed | Error card with retry | Pending | Pending |
| Job seeker | Home | AI tools card | Existing `_AiCareerToolsScreen`; result review uses bottom sheet. | AI tools open native screen. Full AI review/output must be native and editable. | Native screen | "AI provider is not enabled on the backend yet." | AI fallback/error card | Pending | Pending |
| Job seeker | Home | Notifications card | Existing `_NotificationsSheet` bottom sheet. | Notifications page should be native screen if it contains list/history; quick notification menu may be a sheet. | Native screen | "No notifications yet." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Converted to `_DashboardWorkflowPage` native route; screenshot/tap proof pending. |
| Job seeker | Home | Settings/profile card | Settings and profile editor flows now open as native workflow pages. | Settings/profile open native screens. Destructive actions can use confirmation dialog only. | Native screen | N/A | Error card for failed save | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Settings/profile editors converted to `_DashboardWorkflowPage` plus `HalaWorkflowBody`; device click proof pending. |
| Job seeker | Job search/listing | Search bar | Existing feed controls. | Light cream search card with visible text. | Native screen | N/A | Error card if search endpoint fails | Pending | Pending |
| Job seeker | Job search/listing | Filter chips | Existing `_OpportunityFiltersSheet`. | Filters may remain bottom sheet because short controls are allowed. | Bottom sheet allowed | N/A | N/A | Pending | Pending |
| Job seeker | Job search/listing | Job cards | Existing `_OpportunityListCard`. | Use consistent light cream card, navy title, muted meta, orange highlight. | Native screen | "No jobs found yet." | Error card with retry | Pending | Pending |
| Job seeker | Job search/listing | Saved job icon | Existing save toggle. | Visible icon button, no white-on-white state. | Native screen | N/A | Error card/snackbar replaced by inline card where possible | Pending | Pending |
| Job seeker | Job search/listing | Company logo area | Existing cards need contrast audit. | No blank white circles; show initials/logo placeholder with navy/orange styling. | Native screen | N/A | N/A | Pending | Pending |
| Job seeker | Job search/listing | Salary/currency/work-mode chips | Existing meta chips. | Consistent chip style, no random colors. | Native screen | Hide only if missing, no blank space | N/A | Pending | Pending |
| Job seeker | Job search/listing | Apply button | Existing apply starts from detail/list. | Opens native apply flow screen. | Native screen | N/A | Clear apply error card | Pending | Pending |
| Job seeker | Job detail | Job overview card | Existing `_OpportunityDetailScreen` used mixed plain material cards for role summary/source/AI/feedback/skills. | Light cream card with title, company, trust, location, salary. | Native screen | N/A | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Job detail role summary, source, AI support, feedback/safety, focus areas, skills, and trust/safety now use `HalaCard`; plain Material `Card(` scan is clean for main role feature files; device screenshot pending. |
| Job seeker | Job detail | Company card | Existing company info in detail. | Tap opens native company detail screen. | Native screen | N/A | Error card if company missing | Pending | Pending |
| Job seeker | Job detail | Requirements card | Existing content cards used mixed material card styling. | Light cream section card with clear bullets. | Native screen | "No detailed requirements added yet." | N/A | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Focus areas and skills cards now use `HalaCard`; empty wording still needs content QA; device screenshot pending. |
| Job seeker | Job detail | Salary/work-mode card | Existing meta. | Light cream card/chips with readable labels. | Native screen | Hide only missing fields cleanly | N/A | Pending | Pending |
| Job seeker | Job detail | Apply card | Existing apply uses CV/questions sheets. | Opens native apply screen; no full apply flow sheet. | Native screen | N/A | Clear apply error card | Pending | Pending |
| Job seeker | Apply flow | CV selection/apply questions card | Apply questions now open as native workflow page; CV manager still needs full device QA. | Native apply screen with CV card and visible selected file. | Native screen | "No CV uploaded yet" with upload action | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Apply questions converted to `_DashboardWorkflowPage` plus `HalaWorkflowBody`; device click proof pending. |
| Job seeker | Apply flow | Cover letter/AI card | Existing AI suggestions in detail. | Native editable AI/cover letter section. | Native screen | AI disabled message if provider unavailable | Error card with retry | Pending | Pending |
| Job seeker | Apply flow | Application status/success card | Existing snackbars and status text. | Success screen/card with next actions and applications link. | Native screen | N/A | Submission error card | Pending | Pending |
| Job seeker | Companies view | Company search card | Existing `_SeekerCompanyDirectoryScreen`. | Keep as reference layout, light cream and spacious. | Native screen | N/A | Error card with retry | Pending | Pending |
| Job seeker | Companies view | Company list cards | Existing `_SeekerCompanyCard`. | Use as reference for app-wide card style. | Native screen | "No companies found yet." | Error card with retry | Pending | Pending |
| Job seeker | Companies view | Company detail card | Existing `_CompanyDetailPanel`, likely inline panel. | Company detail should be a native screen with back navigation if full content. | Native screen | N/A | Error card if company fails | Pending | Pending |
| Job seeker | Companies view | Job openings card | Existing open jobs in company detail. | Tap job opens native job detail screen. | Native screen | "No open jobs from this company yet." | Error card with retry | Pending | Pending |
| Job seeker | Companies view | Verification/follow/contact actions | Existing company action/request path. | Native screens for full request/contact forms; quick menu only if short. | Native screen | Clear unavailable reason | Error card with retry | Pending | Pending |
| Job seeker | Applications | Application list cards | Existing `_ApplicationListCard`; application detail still had mixed plain cards. | Light cream cards with status chips and clear next step. | Native screen | "No applications yet. Apply to a job to see it here." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Application status, timeline, messages, and response cards now use `HalaCard`; plain Material `Card(` scan is clean for main role feature files; device screenshot pending. |
| Job seeker | Application detail | Application detail screen | Existing `_ApplicationDetailScreen` was native but mixed plain material cards. | Keep native screen; standardize cards/header. | Native screen | N/A | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Application detail cards and legacy header now use shared native/Hala card components; bracket-balance and `git diff --check` pass; device screenshot pending. |
| Job seeker | Application detail | Interview status card | Existing response panel/dialogs used a plain card wrapper. | Light cream card. Confirmation dialog allowed for accept/decline. | Native screen plus confirmation dialog | "No interviews scheduled yet." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Interview/offer response panel now uses `HalaCard`; confirmation dialog remains intentionally allowed for accept/decline; device screenshot pending. |
| Job seeker | Application detail | Document/CV card | Existing CV/document areas. | Light cream document card; external file opens external app. | Native screen / external app | "No CV attached yet." | Error card with retry | Pending | Pending |
| Job seeker | Application detail | Messages/update card | Existing messages card used a plain material card. | Native card with send area. No snackbar-only failure. | Native screen | "No messages yet." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Messages card now uses `HalaCard`; deeper snackbar-to-error-card migration still pending; device screenshot pending. |
| Job seeker | Career Passport | Score card | Existing `_CareerPassportScreen`. | Light cream score card and no dark normal cards. | Native screen | Explain missing profile data | Error card with retry | Pending | Pending |
| Job seeker | Career Passport | Profile completeness card | Existing score components. | Light cream readiness card with orange progress only. | Native screen | Explain missing fields | Error card with retry | Pending | Pending |
| Job seeker | Career Passport | Edit passport action | Edit passport now opens a native workflow page. | Native edit screen with consistent cream card and visible back navigation. | Native screen | N/A | Error card for failed save | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Converted to `_DashboardWorkflowPage` plus `HalaWorkflowBody`; device click proof pending. |
| Job seeker | AI tools | CV rewrite/interview/job match/cover letter cards | Existing `_AiToolCard`. | Native AI tools screen, each tool opens or expands in native screen, output editable. | Native screen | AI provider disabled message | AI fallback/error card | Pending | Pending |
| Job seeker | AI tools | AI result/review card | CV translation review now opens a native workflow page. | Light cream editable/reviewable result area. | Native screen | No output yet explanation | AI error card | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | CV translation review converted to `_DashboardWorkflowPage` plus `HalaWorkflowBody`; device click proof pending. |
| Campus/student | Campus home | Campus access/tester card | Existing local tester/campus mode paths. | QA tester mode must allow app review without university email. | Native screen | Explain tester/live data source | Error card with retry | Pending | Pending |
| Campus/student | Campus home | Verification card | Existing `_CampusVerificationScreen`. | Native screen, standard cards. | Native screen | "No universities available yet" with clear backend/admin explanation | Error card with retry | Pending | Pending |
| Campus/student | Campus home | Student passport card | Existing passport/Career Passport link. | Native screen. | Native screen | Explain profile data needed | Error card with retry | Pending | Pending |
| Campus/student | Campus home | Opportunities card | Existing campus opportunities. | Native opportunity list/detail screens. | Native screen | "No campus opportunities available yet." | Error card with retry | Pending | Pending |
| Campus/student | Campus home | Events card | Existing `_EventDetailScreen` was native but used plain material cards. | Native list/detail with back navigation. | Native screen | "No campus events available yet." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Event summary and what-to-expect cards now use `HalaCard`; device screenshot pending. |
| Campus/student | Campus home | Resources card | Existing `_ResourceDetailScreen` was native but used plain material cards. | Native resource list/detail screens. | Native screen | "No campus resources available yet." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Resource summary and inside-this-resource cards now use `HalaCard`; device screenshot pending. |
| Campus/student | Campus home | University/partner card | Existing partner/opportunity detail for university side; campus needs matching style. | Light cream card and native detail screen. | Native screen | "No university partners available yet." | Error card with retry | Pending | Pending |
| Company | Dashboard | Header card | Existing `_CompanyHeader` plus multiple icons/menu. Owner reports white spots/icons. | Simplify: company name/logo/status, notification icon, one profile/settings/menu icon. No blank white circles. | Native screen | N/A | Error card if company profile fails | `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Old `IconButton` header controls removed; header now uses `HalaNativeHeader`, `HalaHeaderIconButton`, and one dark navy menu chip. Device screenshot pending. |
| Company | Dashboard | Company summary card | Existing `_CompanyHomePanel`. | Light cream summary card, navy text, orange highlights. | Native screen | Explain missing company data | Error card with retry | Pending | Pending |
| Company | Dashboard | Stats cards | Existing metric tiles. | Uniform light cream stat cards. | Native screen | Show zero state with explanation | Error card with retry | Pending | Pending |
| Company | Dashboard | Jobs card | Existing jobs panel. | Opens company jobs native screen/panel with back when full page. | Native screen | "No jobs posted yet." | Error card with retry | Pending | Pending |
| Company | Jobs | Create/edit job | Create/edit job opens through native company workflow page and uses the shared workflow card shell. | Native create/edit job screen with visible back navigation. | Native screen | N/A | Form validation and error card | `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Converted to `_CompanyWorkflowPage` plus `HalaWorkflowBody`; device click proof pending. |
| Company | Jobs | Bulk jobs | Bulk jobs opens through native company workflow page and uses the shared workflow card shell. | Native bulk jobs screen if long content. | Native screen | "No jobs found. Create a job before using bulk actions." | Error card with retry | `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Converted to `_CompanyWorkflowPage` plus `HalaWorkflowBody`; device click proof pending. |
| Company | Jobs | Job details / AI translation review | Job detail actions open through native company workflow pages; job detail and AI translation review use the shared workflow card. | Native job detail screen and native edit/review forms. | Native screen | N/A | Error card with retry | `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | Company job detail and translation review converted to `_CompanyWorkflowPage` plus `HalaWorkflowBody`; broader company device click proof pending. |
| Company | Applicants | Applicants card/list | Existing applicants panel. | Native applicants screen; list cards consistent. | Native screen | "No applicants yet." | Error card with retry | Pending | Pending |
| Company | Applicants | Applicant details | Existing `_CompanyApplicationSheet`. | Convert to native applicant/application detail screen. | Native screen | N/A | Error card with retry | Pending | Pending |
| Company | Interviews | Interviews card/action | Existing records/actions. | Native interviews screen. Confirmation dialog allowed for destructive changes. | Native screen | "No interviews scheduled yet." | Error card with retry | Pending | Pending |
| Company | AI hiring | AI hiring card | Existing `_CompanyAiToolsSheet`. | Convert full AI tools to native screen; editable/reviewable output. | Native screen | AI provider disabled message | AI error card | Pending | Pending |
| Company | Talent search | Talent search card | Existing `_CompanyTalentSearchSheet`. | Convert to native talent search screen. Filters may use bottom sheet. | Native screen | "No matching talent found yet." | Error card with retry | Pending | Pending |
| Company | Company files | Files card | Existing `_CompanyFilesSheet`. | Convert to native files screen. | Native screen | "No company files uploaded yet." | Error card with retry | Pending | Pending |
| Company | Team | Team card | Existing `_CompanyTeamSheet`. | Convert to native team screen. | Native screen | "No team members invited yet." | Error card with retry | Pending | Pending |
| Company | Templates | Templates card | Existing `_CompanyTemplatesSheet`. | Convert to native templates screen. | Native screen | "No message templates saved yet." | Error card with retry | Pending | Pending |
| Company | Questions | Questions card | Existing `_CompanyQuestionsSheet`. | Convert to native questions screen. | Native screen | "No screening questions added yet." | Error card with retry | Pending | Pending |
| Company | Billing | Billing card | Existing `_CompanySubscriptionBillingSheet`. | Convert to native billing screen. | Native screen | "No billing history available yet." | Error card with retry | Pending | Pending |
| Company | Support | Support card | Existing `_CompanySupportSheet`. | Convert to native support screen. | Native screen | "No support tickets yet." | Error card with retry | Pending | Pending |
| Company | Settings/profile | Profile/settings action | Existing account/profile/settings sheets. | Native company settings screen. One header menu entry opens it. | Native screen | N/A | Error card for failed save | Pending | Pending |
| Company | Notifications | Notification icon/action | Existing `_CompanyNotificationsSheet`. | If full notification history, convert to native screen. If quick preview, sheet allowed. | Native screen or short bottom sheet | "No company notifications yet." | Error card with retry | `mobile/lib/src/features/company/company_dashboard_screen.dart` | Converted to `_CompanyWorkflowPage` native route; screenshot/tap proof pending. |
| University/admin | Dashboard | University dashboard card | Existing `UniversityDashboardScreen` used its own SafeArea/ListView shell and header inside the scroll content. | Standard light cream page/card/header system. | Native screen | "No university dashboard data loaded yet." | Error card with retry | `mobile/lib/src/features/university/university_dashboard_screen.dart`, `mobile/lib/src/widgets/hala_cards.dart` | University/admin now uses the same navy top header and cream page-gradient shell as seeker/company; device screenshot pending. |
| University/admin | Dashboard | Student verification card | Existing verification queue. | Native verification detail screen. | Native screen | "No pending student verification requests." with explanation | Error card with retry | Pending | Pending |
| University/admin | Dashboard | Analytics/outcomes card | Existing outcomes panel and details screen. | Native screen with consistent cards. | Native screen | "No outcomes report data available yet." | Error card with retry | Pending | Pending |
| University/admin | Dashboard | Campus resources card | Existing university resource/opportunity areas. | Native resources screen/detail. | Native screen | "No campus resources available yet." | Error card with retry | Pending | Pending |
| University/admin | Dashboard | Opportunities card | Existing opportunity list/details/request screen. | Native list/detail/request screens. | Native screen | "No campus opportunities available yet." | Error card with retry | Pending | Pending |
| University/admin | Dashboard | Approvals card | Existing student verification/queue. | Native approvals screen. | Native screen | "No approvals waiting right now." | Error card with retry | Pending | Pending |
| University/admin | Dashboard | Settings/account card | Existing account details/switcher sheets. | Convert account/settings details to native screen if full edit form. Account quick switcher may remain short sheet. | Native screen, short sheet allowed for quick switch | N/A | Error card for failed save | `mobile/lib/src/features/university/university_dashboard_screen.dart` | Account details converted to `_UniversityWorkflowPage`; account switcher intentionally remains quick sheet. Screenshot/tap proof pending. |
| Settings | Profile | Profile card | Existing dashboard/company profile sheets. | Native profile screen with shared cards. | Native screen | N/A | Error card for failed save | Pending | Pending |
| Settings | Account switcher | Account switcher card | Existing account switcher bottom sheets for seeker/campus, company, and university/admin. | Native account switch screen with back navigation. Full account management opens native screen. | Native screen | "No other accounts available." | Error card with retry | `mobile/lib/src/features/dashboard/dashboard_screen.dart`, `mobile/lib/src/features/company/company_dashboard_screen.dart`, `mobile/lib/src/features/university/university_dashboard_screen.dart` | Account switchers converted from bottom sheets to native workflow routes; `rg showModalBottomSheet` now shows only the short opportunity filter sheet; device click-through pending. |
| Settings | Language | Language card | Existing auth/settings language controls. | Shared light cream language card with visible selected state. | Native screen | N/A | N/A | Pending | Pending |
| Settings | Notifications | Notifications card | Existing notification settings/history mixed with sheets. | Native notifications/settings screen; quick preview sheet allowed. | Native screen | "No notifications yet." | Error card with retry | Pending | Pending |
| Settings | Security/sign-out | Sign-out/destructive actions | Existing confirmation dialogs. | Confirmation dialog allowed only for sign-out/destructive actions. | Confirmation dialog allowed | N/A | Clear failure card if sign-out fails | Pending | Pending |
| Settings | Support | Support card | Existing support sheet in company; seeker/campus support needs audit. | Native support screen. | Native screen | "No support messages yet." | Error card with retry | Pending | Pending |

## Bottom Sheets Found In Static Scan

These are the current bottom sheet families found by `rg showModalBottomSheet mobile/lib`. Each must be classified as "allowed short control" or converted to a native screen.

| File | Current sheet/function family | Audit decision |
| ---- | ----------------------------- | -------------- |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Account switcher sheets | Converted to native `_DashboardWorkflowPage`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Notifications sheet | Converted to native `_DashboardWorkflowPage`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Dashboard settings sheet | Converted to native `_DashboardWorkflowPage`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | AI translation/review sheet | Converted to native `_DashboardWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Career Passport edit sheet | Converted to native `_DashboardWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Opportunity filters sheet | Keep allowed bottom sheet because filters are short controls. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Profile career history/education/links/certificates sheets | Converted to native `_DashboardWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | CV/apply questions sheet | Converted to native `_DashboardWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Availability/choice/salary/profile editor sheets | Converted to native `_DashboardWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/dashboard/dashboard_screen.dart` | Job rating/text feedback sheets | Converted to native `_DashboardWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/company/company_dashboard_screen.dart` | Company account switcher sheet | Converted to native `_CompanyWorkflowPage`; proof pending. |
| `mobile/lib/src/features/company/company_dashboard_screen.dart` | Company notifications sheet | Converted to native `_CompanyWorkflowPage`; proof pending. |
| `mobile/lib/src/features/company/company_dashboard_screen.dart` | Company account/profile/settings, files, job form, job detail, applicants, support, team, questions, templates, talent, invitations, audit, campus recruiting, billing, AI tools | Static scan now shows no `showModalBottomSheet` calls for these workflows; they route through native company workflow pages. Many internal body widgets still need real-device card/spacing proof. |
| `mobile/lib/src/features/company/company_dashboard_screen.dart` | Company job translation review | Converted to native `_CompanyWorkflowPage` with `HalaWorkflowBody`; proof pending. |
| `mobile/lib/src/features/university/university_dashboard_screen.dart` | University account details sheet | Converted to native `_UniversityWorkflowPage`; proof pending. |
| `mobile/lib/src/features/university/university_dashboard_screen.dart` | University account switcher sheet | Converted to native `_UniversityWorkflowPage`; proof pending. |

## Required Proof Before Next APK

- Updated audit table with `File(s) changed` and `Test proof` for each fixed row.
- List of every page fixed.
- List of every bottom sheet converted to native screen.
- List of bottom sheets intentionally kept and why.
- Screenshots or screen recordings for:
  - sign-in
  - seeker home
  - job detail
  - application detail
  - companies view
  - Career Passport/AI tools
  - campus home
  - campus resource detail
  - company dashboard
  - company jobs
  - company applicants
  - company settings/header
- Test proof that every listed card/action opens correctly.
- Android APK version increased before a new APK is built.
