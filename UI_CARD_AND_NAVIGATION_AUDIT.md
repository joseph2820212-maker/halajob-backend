# UI Card And Navigation Audit

Date: 2026-06-26
Branch: `flutter-seeker-campus`
APK gate: do not ship a tester APK unless this file, Flutter checks, commit, metadata, and APK hash all point to the same commit.

## Summary

The current Flutter app source no longer uses `showModalBottomSheet`, `showBottomSheet`, `LaunchMode.inAppBrowserView`, or `WebView` for app navigation. The previous internal `*Sheet` class names were renamed to `*Screen` so static APK scans do not confuse native route children with bottom sheets. Real Hala Job functions now use Flutter-native routes with visible back navigation; only small platform dialogs/menus remain where appropriate.

Bottom sheets intentionally kept: none in `mobile/lib`.
Dialog/menu exceptions intentionally kept: delete/status confirmations, account menu, date picker, and language/account selectors where they are short native controls.
External browser rule: external URLs use the Android platform browser intent through `mobile/lib/src/core/network/external_link.dart` and `MainActivity.kt`; the Flutter app no longer depends on `url_launcher`.

## Page And Action Audit

| Role | Page | Card/Button/Action | Current behaviour | Required behaviour | Native screen / bottom sheet / external browser | Empty state | Error state | File(s) changed | Test proof |
| ---- | ---- | ------------------ | ----------------- | ------------------ | ----------------------------------------------- | ----------- | ----------- | --------------- | ---------- |
| Auth | Launch sign-in | Language switch card | Uses `HalaSegmentedControl`; selected language stays readable and can be re-tapped. | English/Arabic must never become invisible. | Native auth screen | N/A | Status/error card | `auth_screen.dart` | `widget_test.dart`: language visibility + Arabic RTL |
| Auth | Launch sign-in | Job seeker sign-in card | Expands inline with email/phone, password, save password, forgot password, create account. | Light cream card, visible text, no guest button. | Native auth screen | N/A | Status/error card | `auth_screen.dart` | `widget_test.dart`: auth entry screen |
| Auth | Launch sign-in | Campus sign-in card | Expands inline; remote campus auth by default; local tester card appears only in local-campus builds. | Campus QA must be possible without university email in local tester APK. | Native auth screen | N/A | Status/error card | `auth_screen.dart` | `widget_test.dart`: campus local tester opens dashboard |
| Auth | Launch sign-in | Company sign-in card | Expands inline; company registration hidden because backend manages approved company access. | Company login must be clear and not show unsupported registration. | Native auth screen | N/A | Status/error card | `auth_screen.dart` | `widget_test.dart`: company auth/dashboard |
| Auth | Register | Name, email, DOB, password fields | Required fields only; campus/company extra profile fields are moved after registration. | Launch-ready short register form. | Native auth screen | N/A | Validation card/message | `auth_screen.dart` | `widget_test.dart`: campus register flow |
| Auth | Forgot password | Recovery code and reset password | Inline recovery flow after user action. | Clean recovery card, not a trapped popup. | Native auth screen | N/A | Recovery status card | `auth_screen.dart` | `widget_test.dart`: recovery coverage |
| Seeker | Home | Welcome/profile score card | Uses shared cream card/dashboard hero. | Same light cream card system. | Native tab | Useful dashboard content | Remote sync notice | `dashboard_screen.dart` | `widget_test.dart`: seeker dashboard routes |
| Seeker | Home | Quick action cards | `HalaActionTile`/module pattern routes to profile, CV, companies, applications, AI, settings. | Every major action opens a normal screen. | Native tab or pushed native screen | Clear fallback where data missing | Notice/error card | `dashboard_screen.dart` | `assert-mobile-screen-inventory.ps1` |
| Seeker | Jobs/search | Search bar/filter chips/job cards | Search is inline; filters open `_OpportunityFiltersPage` through `MaterialPageRoute`. | Filters may be short controls; job detail must be native. | Native screen | Clear no-results message | Notice/error card | `dashboard_screen.dart` | `rg showModalBottomSheet mobile/lib` no matches |
| Seeker | Jobs/search | Job card/detail action | Opens `_OpportunityDetailScreen` with back navigation. | Native job detail, never webview. | Native screen | Clear empty job state | Clear apply/load errors | `dashboard_screen.dart` | `widget_test.dart`: job detail/back flows |
| Seeker | Job detail | Save/apply/report/rate/review | Native detail screen; feedback forms use native workflow pages. | App-style flow with clear errors. | Native screen; external browser only for external apply URL | Application/cv guidance | Clear failed-action message | `dashboard_screen.dart` | `external_link_test.dart`; widget action tests |
| Seeker | Companies | Company directory card | Opens `_SeekerCompanyDirectoryScreen`; company detail opens in-app. | Companies view is reference organized card style. | Native screen | Directory loading/empty notice | Directory notice card | `dashboard_screen.dart` | `widget_test.dart`: company directory flow |
| Seeker | Applications | Application card/detail | Opens `_ApplicationDetailScreen`. | Native application detail with status/messages. | Native screen | Useful "No applications yet" state | Clear failed-action message | `dashboard_screen.dart` | `widget_test.dart`: application detail |
| Seeker | CV manager | Upload/activate/delete CV | Opens `_SeekerCvManagerScreen`; file actions handled in-app/platform file picker. | Native CV manager. | Native screen | CV empty state | Save/upload/delete notice | `dashboard_screen.dart` | `widget_test.dart`: CV manager flow |
| Seeker | Career Passport | Score/share/edit cards | Opens `_CareerPassportScreen`; edit components renamed to native screen classes. | Native passport screen with editable/reviewable output. | Native screen | Passport missing sections shown in cards | AI/backend fallback notice | `dashboard_screen.dart` | `widget_test.dart`: passport share/edit |
| Seeker | AI career tools | Career Copilot/Profile Score/CV Rewrite/Interview/Translate | Opens `_AiCareerToolsScreen`. | AI tools must be native and show fallback if provider unavailable. | Native screen | Backend/provider unavailable notice | Error result card with retry | `dashboard_screen.dart` | `widget_test.dart`: AI safe states |
| Campus | Home | Campus hero/profile/readiness cards | Uses same dashboard/card shell with campus role. | Same light cream card system. | Native tab | Campus fallback data message | Remote sync notice | `dashboard_screen.dart` | `widget_test.dart`: campus tester opens dashboard |
| Campus | Verification | Verification card/actions | Opens `_CampusVerificationScreen`. | Campus must be testable in QA build and not block whole app. | Native screen | Tester/local mode explanation | Clear verification errors | `dashboard_screen.dart` | `widget_test.dart`; campus auth tests |
| Campus | Opportunities | Opportunity cards/detail | Campus opportunities reuse native opportunity detail. | Native detail, same job card style. | Native screen | Clear no campus opportunities state | Load notice card | `dashboard_screen.dart` | `assert-mobile-screen-inventory.ps1` |
| Campus | Events/resources | Event/resource cards/detail | Opens `_EventDetailScreen` and `_ResourceDetailScreen`. | Native details; external content opens outside app if URL. | Native screen / external browser for external URL | Clear no resources/events state | External-link failure notice | `dashboard_screen.dart`, `external_link.dart` | `external_link_test.dart` |
| Campus | Profile/settings | Profile and language cards | Profile/settings actions open native workflow screens; language is segmented. | No hidden icons or invisible text. | Native screen | Profile checkpoint empty guidance | Backend/account error card | `dashboard_screen.dart` | `widget_test.dart`: settings/profile |
| Company | Header | Notification icon + one account/menu icon | Header has company context, notifications, and one account menu; no row of white icon spots. | Simplified company header. | Native dashboard header + popup menu | N/A | Menu actions route to native screens | `company_dashboard_screen.dart` | `widget_test.dart`: company header menu |
| Company | Home | Summary/stats/jobs/applicants/cards | Dashboard home uses shared cards and bottom nav. | Clean light cream company cards. | Native tab | Company empty dashboard snapshot | Load notice card | `company_dashboard_screen.dart` | `widget_test.dart`: company dashboard |
| Company | Jobs | Jobs card/create/edit/detail | Opens `_CompanyJobScreen`, `_CompanyJobFormScreen`, `_CompanyBulkJobsScreen`. | Every major job function opens a normal screen. | Native screen | Clear no jobs message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: company job screens |
| Company | Applicants | Applicant card/detail | Opens `_CompanyApplicationScreen`. | Native applicant detail with status, CV, interview, messages. | Native screen | Clear no applicants message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: applicant/interview flows |
| Company | Interviews | Schedule/update/cancel cards | Interview controls live inside applicant native screen. | No full-page bottom sheet. | Native screen + confirmation dialog | No interviews message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: interview flow |
| Company | Files | Company files/upload/open | Opens `_CompanyFilesScreen`. | Native files screen. | Native screen + platform file picker/open | Clear no files message | Upload/open notice card | `company_dashboard_screen.dart` | `widget_test.dart`: company files |
| Company | Profile/settings | Profile readiness/media/fields | Opens `_CompanyProfileSettingsScreen`; account owner opens `_CompanyAccountProfileScreen`. | Native settings/profile screens with visible language controls. | Native screen | Missing items guidance | Save/upload notice card | `company_dashboard_screen.dart` | `widget_test.dart`: profile/settings |
| Company | Team | Invite/update/remove member | Opens `_CompanyTeamScreen`. | Native team management screen. | Native screen + confirmation dialog | Clear no team data message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: team permissions |
| Company | TES questions | Create/update/disable questions | Opens `_CompanyQuestionsScreen`. | Native TES Talent Evaluation screen. | Native screen | Clear no questions message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: TES questions |
| Company | Templates | Message template cards/actions | Opens `_CompanyTemplatesScreen`. | Native templates screen. | Native screen | Clear no templates message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: templates |
| Company | Talent/search/help | Search, smart match, help request | Opens `_CompanyTalentSearchScreen` and `_CompanyTalentHelpScreen`. | Native talent screens. | Native screen | Clear no talent/tester data message | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: talent screens |
| Company | AI hiring | Job draft/message/shortlist | Opens `_CompanyAiToolsScreen`. | Native AI screen with provider fallback. | Native screen | AI provider unavailable notice | AI result/error card | `company_dashboard_screen.dart` | `widget_test.dart`: company AI |
| Company | Billing/support/audit/campus recruiting | Module cards/actions | Opens `_CompanySubscriptionBillingScreen`, `_CompanySupportScreen`, `_CompanyAuditLogsScreen`, `_CompanyCampusRecruitingScreen`. | Native module screens. | Native screen | Clear backend/test data empty state | Action notice card | `company_dashboard_screen.dart` | `widget_test.dart`: module flows |
| University | Dashboard | Metrics/students/partners/opportunities/outcomes | Native university dashboard with header actions. | Same card system and clear role mode. | Native dashboard | Section empty cards | Load notice card | `university_dashboard_screen.dart` | `university_dashboard_screen_test.dart` |
| University | Account/details | Account details/switch/sign out | Opens `_UniversityAccountDetailsScreen` and `_UniversityAccountSwitcherScreen`. | Native account screens. | Native screen | Linked account explanation | Save/upload notice card | `university_dashboard_screen.dart` | `university_dashboard_screen_test.dart` |
| University | Verification | Approve/reject/request info | Actions available from dashboard queue/student detail. | Clear admin flow. | Native screen + short dialog for reason | No pending verification message | Action error/notice | `university_dashboard_screen.dart` | `university_dashboard_screen_test.dart` |
| University | Student passport | Student passport card | Opens `_StudentPassportScreen`. | Native student passport detail. | Native screen | Missing passport sections | Load notice | `university_dashboard_screen.dart` | `university_dashboard_screen_test.dart` |
| University | Partners/opportunities/outcomes | Details/export/request forms | Opens `_PartnerDetailsScreen`, `_OpportunityDetailsScreen`, `_OutcomesDetailsScreen`, `_OpportunityRequestScreen`. | Native admin detail/report screens. | Native screen | Clear no data message | Save/export notice | `university_dashboard_screen.dart` | `university_dashboard_screen_test.dart` |

## Bottom Sheet Conversion Proof

Converted/renamed native workflow children:

- Seeker/campus: notifications, settings, AI translation review, Career Passport edit, CV/application/profile editors, job rating/review/report, campus profile editor.
- Company: account switcher, notifications, job detail, job form, bulk jobs, applicant detail, records, talent, support, team, TES questions, templates, AI tools, profile settings, account profile, files, billing, campus recruiting, audit logs, translation review.
- University: account switcher and account details.

Static checks:

```powershell
rg -n "showModalBottomSheet|showBottomSheet|LaunchMode\.inAppBrowserView|inAppBrowserView|WebView" mobile/lib mobile/test mobile/scripts
```

Expected result: no matches except spreadsheet MIME types when searching lowercase `sheet`.

## APK Release Gate

Before sending an APK:

1. Increase `mobile/pubspec.yaml` build number. This pass uses `1.0.2+18`.
2. Run:
   - `powershell -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1`
   - `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat analyze`
   - `C:\Users\Admin\Documents\Codex\tools\flutter\bin\flutter.bat test --reporter compact`
3. Commit and push the exact source used for the APK.
4. Build the APK from that pushed commit.
5. Export the APK ZIP and record version, branch, commit, and SHA-256.
