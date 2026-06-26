# Hala Job Mobile UI Card And Navigation Audit

Date: 2026-06-26  
Branch: `flutter-seeker-campus`  
Scope: Flutter mobile app under `mobile/lib`

## Verdict

The mobile app is feature-bearing but not yet release-polished. The repo contains real seeker, campus/student, company, and university/admin mobile surfaces, not only auth. However, the UI architecture is inconsistent enough that the APK recheck failure is valid.

The biggest issue is not one missing screen. It is mixed interaction patterns:

| Area | Current State | Release Risk |
| --- | --- | --- |
| Native page navigation | Many flows use `Navigator.push` + `MaterialPageRoute` + `HalaNativeHeader`. | Good foundation, but not applied uniformly. |
| Bottom-sheet/modal behavior | Direct `showModalBottomSheet` usage has been removed from `mobile/lib/src`. Many classes still use `Sheet` names even when pushed as native pages. | Legacy naming still confuses QA and future development. |
| Cards/background/header system | Shared navy/cream/orange components exist: `HalaCard`, `HalaModuleCard`, `HalaNativeHeader`, theme tokens. | Needs page-by-page consistency proof, especially company and edit flows. |
| Language | Phone-language detection and saved language are wired at app shell level. | Many screen strings are still hard-coded English, so full Arabic/English parity is not proven. |
| External browser/WebView | `url_launcher` is present and `launchExternalWebLink` tries external application first. | APK still contains `WebViewActivity` from plugin dependency; every link action must be checked to prove it opens externally or has native fallback. |
| Build proof | Latest APK tested is hash `9e7ce917...` and predates the current backend hardening commit. | No new APK should be called fixed until Flutter build/test is run and the APK hash changes. |

## Evidence Inventory

| Role/Area | File | Main Classes / Functions | Current Behavior | Audit Status |
| --- | --- | --- | --- | --- |
| App shell/session routing | `mobile/lib/src/app.dart` | `HalaJobApp`, `_AppShell`, `_LaunchScreen` | Routes saved sessions to `DashboardScreen`, `CompanyDashboardScreen`, or `UniversityDashboardScreen`; sets locale from phone/saved preference. | Needs widget tests for role switching and locale persistence. |
| Auth/login/register | `mobile/lib/src/features/auth/auth_screen.dart` | `AuthScreen`, `_AuthSignInCards`, `_AuthRoleCards`, register/passcode forms | Native `Scaffold` with logo, role cards, language switch, sign-in/register forms. | Needs real-device review for text contrast, field labels, password saving UX, Arabic strings. |
| Job seeker + campus student shell | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `DashboardScreen`, `_DashboardWorkflowPage`, `_HalaBottomNav` | Native dashboard with bottom nav, direct Notifications/Profile/Settings header actions, and workflow pages. | Good base, but many edit components still use `Sheet` naming. |
| Seeker detail pages | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `_OpportunityDetailScreen`, `_ApplicationDetailScreen`, `_ResourceDetailScreen`, `_EventDetailScreen`, `_SeekerCompanyDirectoryScreen`, `_SeekerCvManagerScreen`, `_CompanyRequestScreen` | Native pushed pages with `Scaffold`. | Needs button-by-button QA and Arabic review. |
| Seeker/campus edit flows | `mobile/lib/src/features/dashboard/dashboard_screen.dart` | `_OpportunityFiltersPage`, `_SeekerCareerHistorySheet`, `_SeekerEducationSheet`, `_SeekerProfileLinksSheet`, `_SeekerCertificatesSheet`, `_SeekerApplyQuestionsSheet`, `_SeekerAvailabilityEditorSheet`, `_SeekerChoiceEditorSheet`, `_SeekerSalaryExpectationSheet`, `_SeekerProfileEditorSheet`, `_CampusProfileEditorSheet`, `_JobRatingSheet`, `_JobTextFeedbackSheet`, `_DashboardSettingsSheet`, `_NotificationsSheet` | Opportunity filters are now a native workflow page. Other compact editor classes still use `Sheet` naming even when opened through page routes. | Rename legacy `Sheet` classes after behavior is stable; verify compact editors on device. |
| Company shell | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `CompanyDashboardScreen`, `_CompanyWorkflowPage`, `_CompanyHeader`, `_CompanyHeaderMenuButton` | Native `Scaffold`, navy header, bottom `NavigationBar`, workflow wrapper with back arrow. Company header rows now avoid hidden ListTile ink states in bulk-action forms. | Good base. Needs visual consistency pass and real-device screenshot QA. |
| Company workflows | `mobile/lib/src/features/company/company_dashboard_screen.dart` | `_CompanyJobSheet`, `_CompanyJobFormSheet`, `_CompanyApplicationSheet`, `_CompanyFilesSheet`, `_CompanyProfileSettingsSheet`, `_CompanyProfileSectionsSheet`, `_CompanySupportSheet`, `_CompanyTeamSheet`, `_CompanyQuestionsSheet`, `_CompanyTemplatesSheet`, `_CompanyTalentSearchSheet`, `_CompanyTalentHelpSheet`, `_CompanyInvitationsSheet`, `_CompanyAuditLogsSheet`, `_CompanyCampusRecruitingSheet`, `_CompanySubscriptionBillingSheet`, `_CompanyAiToolsSheet`, `_CompanyTranslationReviewSheet`, `_CompanyRecordsSheet`, `_CompanyNotificationsSheet`, `_CompanyAccountProfileSheet`, `_CompanyAccountSwitcherSheet` | Despite `Sheet` names, main open functions push these through `_CompanyWorkflowPage` via `MaterialPageRoute`. | Rename to `Page`/`Panel` only after QA; first verify every action, empty state, and save flow. |
| University/admin shell | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `UniversityDashboardScreen`, `_UniversityWorkflowPage`, `_UniversityHeader` | Native dashboard/workflow pages with direct Switch account, Account details, and Sign out header buttons. | Good base; needs page-by-page action audit. |
| University/admin details | `mobile/lib/src/features/university/university_dashboard_screen.dart` | `_StudentPassportScreen`, `_PartnerDetailsScreen`, `_OpportunityDetailsScreen`, `_OutcomesDetailsScreen`, `_OpportunityRequestScreen`, `_UniversityAccountDetailsSheet`, `_UniversityAccountSwitcherSheet` | Pushed native pages; account details/switcher use sheet naming inside workflow wrapper. | Needs Arabic review and action-result validation. |
| Shared theme/cards | `mobile/lib/src/theme/app_theme.dart`, `mobile/lib/src/widgets/hala_cards.dart`, `mobile/lib/src/widgets/hala_empty_state.dart`, `mobile/lib/src/widgets/hala_state_notice.dart`, `mobile/lib/src/widgets/hala_segmented_control.dart`, `mobile/lib/src/widgets/hala_brand.dart` | Navy/cream/orange theme tokens, cards, native header, empty/error/notice widgets. | Theme tokens are aligned; page adoption is incomplete until checked screen by screen. |
| Brand/design docs | `mobile/docs/brand/README.md`, `mobile/docs/brand/component-handout-header-cards-nav.md`, `mobile/mockups/mobile-theme-preview.html`, `mobile/mockups/seeker-campus-dashboard-cream-mockup.html` | Repo contains design references and mockups. | Docs conflict on exact color values and card/header radii; reconcile before broad visual refactor. |
| External links | `mobile/lib/src/core/network/external_link.dart` | `resolveExternalLinkUri`, `openExternalLink`, `launchExternalWebLink` | Validates http/https and prefers `LaunchMode.externalApplication`. | Good safer default; each calling screen still needs QA. |

## Confirmed Navigation Problems

| Priority | Problem | Evidence | Required Fix |
| --- | --- | --- | --- |
| P0 | Latest APK is not a fresh build of current code. | APK hash `9e7ce917...` equals Desktop APK and repo build output. | Do not accept another APK unless hash/version changes after Flutter build/test. |
| P0 | Page-by-page UI QA has not been completed. | Recheck report gives real-device UI/UX score `4/10`; repo has many workflows. | Produce screen checklist with action result for every role before next release APK. |
| P1 | Opportunity filters used a modal bottom sheet. | Fixed in this pass: `_openFilters` now pushes `_DashboardWorkflowPage` with `_OpportunityFiltersPage`; `rg showModalBottomSheet mobile/lib/src` returns no matches. | Keep covered in mobile widget/route QA. |
| P1 | `Sheet` class names remain across company/seeker/university workflows. | Large class inventory under `company_dashboard_screen.dart`, `dashboard_screen.dart`, `university_dashboard_screen.dart`. | Rename only after behavior is stable, or document that they are native workflow children. |
| P1 | Arabic/English parity is not proven. | App shell locale is wired, but many screen strings are hard-coded English. | Move visible screen strings into localization resources or create a tracked exception list. |
| P1 | Company UI needs visual pass on real device. | APK recheck notes company header white spots/icons and inconsistent cream cards. | Review header, bottom nav, cards, and settings/profile/company modules on device. |
| P1 | University detail pages do not consistently use `HalaNativeHeader`. | Fixed in this pass: student passport, partner details, opportunity details, outcomes report, and opportunity request now use `_UniversityDetailPage`/`_UniversityWorkflowPage`. | Verify on device and extend same pattern if new university detail routes are added. |
| P1 | Brand docs conflict with implemented theme. | Fixed in this pass for main color tokens and APK metadata: `mobile/docs/brand/README.md` and `mobile/pubspec.yaml` now use `#1F3654`, `#E38B3C`, `#FCF7EF`; card radius still needs final design decision. | Decide whether card radius remains 8px or moves to the handout's larger radius. |
| P1 | Header actions were hidden inside account popup menus. | Fixed in this pass for seeker/campus-student and university/admin headers: profile/settings/account details are direct native icon buttons again. | Verify on physical device that icon spacing remains comfortable on small widths. |
| P1 | Some ListTile/CheckboxListTile rows sat inside decorated containers without their own Material. | Fixed in this pass for company bulk actions and seeker profile manager rows to preserve native tap feedback. | Extend the pattern if new decorated list rows are introduced. |
| P1 | RTL/native navigation audit is incomplete. | Locale support exists, but custom arrows and layout use many left/right-oriented widgets. | Verify Arabic directionality on device and replace directional-sensitive layout where needed. |
| P2 | WebView activity appears in APK due URL launcher plugin. | APK manifest finding includes `io.flutter.plugins.urllauncher.WebViewActivity`. | Confirm app code opens external browser for all URLs; avoid in-app web mode. |

## Required Page-By-Page QA Checklist

Each row must be filled before the next release candidate APK:

| Role | Page | Entry Point | Back Arrow | Header | Cards | Empty State | Error State | Loading State | Buttons Checked | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | Launch/sign in | `AuthScreen` | N/A | Logo/language | Role cards | N/A | Login/register errors | Login busy state | Sign in, register, forgot password, language | Pending real-device QA |
| Seeker | Dashboard tabs | `DashboardScreen` | N/A | `HalaNativeHeader`/dashboard header | `HalaCard` | Needed per tab | Needed per tab | Remote sync/loading | Bottom nav, notifications, settings, profile | Pending real-device QA |
| Seeker | Job/opportunity detail | `_OpportunityDetailScreen` | Yes | AppBar/native style | Mixed cards | Needed | Needed | Needed | Save, apply, rate, report, feedback | Pending real-device QA |
| Seeker | Applications/detail | `_ApplicationDetailScreen` | Yes | AppBar/native style | Mixed cards | Needed | Needed | Needed | Cancel, respond, messages | Pending real-device QA |
| Seeker | CV manager | `_SeekerCvManagerScreen` | Yes | AppBar/native style | Mixed cards | Needed | Needed | Needed | Upload, activate, delete, open | Pending real-device QA |
| Campus student | Campus dashboard | `DashboardScreen` with `AppRole.campusStudent` | N/A | Native header | `HalaCard` | Needed | Needed | Needed | Opportunities, events, resources, verification | Pending real-device QA |
| Campus student | Verification | `_CampusVerificationScreen` | Yes | AppBar/native style | Mixed cards | Needed | Needed | Needed | Start, email confirm, upload document | Pending real-device QA |
| Company | Dashboard tabs | `CompanyDashboardScreen` | N/A | `HalaNativeHeader` | `HalaCard`/modules | Needed | Needed | Loading overlay/state | Bottom nav, notifications, menu, refresh | Pending real-device QA |
| Company | Jobs | `_CompanyJobSheet`, `_CompanyJobFormSheet`, `_CompanyBulkJobsSheet` | Yes via `_CompanyWorkflowPage` | `HalaNativeHeader` | Mixed cards | Needed | Needed | Needed | Create, edit, publish, pause, archive, bulk | Pending real-device QA |
| Company | Applicants/ATS | `_CompanyApplicationSheet` | Yes | `HalaNativeHeader` | Mixed cards | Needed | Needed | Needed | Status, note, rate, interview, CV open | Pending real-device QA |
| Company | Profile/files/team/support/billing | Company workflow children | Yes | `HalaNativeHeader` | Mixed cards | Needed | Needed | Needed | Save, upload, delete, invite, ticket, invoice | Pending real-device QA |
| University | Dashboard/students | `UniversityDashboardScreen` | N/A | `HalaNativeHeader` | Mixed cards | Needed | Needed | Needed | Student passport, verifications, reports | Pending real-device QA |
| University | Detail/request pages | `_StudentPassportScreen`, `_OpportunityRequestScreen`, details screens | Yes | AppBar/native style | Mixed cards | Needed | Needed | Needed | Approve/reject/request info/export/create | Pending real-device QA |

## Acceptance Gate For Next APK

1. Flutter tests pass locally.
2. APK version or build number changes. Next intended build is `1.0.2+15`; reject any APK still reporting `1.0.2+14`.
3. APK SHA-256 differs from `9e7ce917b6d7025bec53581c5bd43236d0ef96d7c86c8e70881f887ff5d3fc40`.
4. `UI_CARD_AND_NAVIGATION_AUDIT.md` is updated with actual QA results, not only pending rows.
5. No direct `showModalBottomSheet` remains in `mobile/lib/src`.
6. Every primary role has native header/back behavior verified on real device.
7. Arabic/English behavior is checked from phone language start and settings language change.

## Local Verification

- `flutter analyze` passed on 2026-06-26.
- `flutter test --reporter compact` passed on 2026-06-26: 410 tests.
- `git diff --check` passed on 2026-06-26.
- `rg "showModalBottomSheet|_OpportunityFiltersSheet|sheet-filter|sheet-sort|sheet-clear-filters|sheet-show-results" mobile/lib mobile/test -S` returned no matches on 2026-06-26.
- `rg "AppBar\(" mobile/lib/src/features/university/university_dashboard_screen.dart` returned no matches on 2026-06-26.
