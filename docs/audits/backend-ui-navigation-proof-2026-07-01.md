# Backend To UI Navigation Proof - 2026-07-01

Branch: `codex/gate-a-mobile-ui-lock`

This audit tracks the owner's requirement that backend functions must have a
matching, reachable UI path from entry point to workflow destination. It is not
yet a full line-by-line proof for every backend route. It records the current
verified slices and the remaining work needed to make that claim safely.

## Evidence Standard

A feature is considered proven only when all of these are true:

1. The backend route or service path is mounted or referenced by the relevant
   client service.
2. The role UI has one canonical card, tab, or contextual action for the
   feature.
3. Tapping the card/action reaches the intended screen, not a dead placeholder
   or unrelated profile/settings screen.
4. A test or machine-readable contract protects the route-to-UI placement.
5. Demo data is either seeded into the same backend database the APK/web build
   points at, or the UI shows an honest empty/disabled state.

## Newly Proven In This Slice

| Role | Feature | Backend evidence | UI path | Proof |
| --- | --- | --- | --- | --- |
| Campus student | AI career tools | `/ai/v1/career/copilot`, `/ai/v1/cv/rewrite`, `/ai/v1/interview/practice` in `SeekerDashboardService` | `More` -> `AI career tools` -> `ai-career-tools-screen` | `flutter test test/widget_test.dart --plain-name "campus AI career tools are grouped under More when enabled"` |
| Campus local tester | AI career tools inspection | Local tester is blocked from provider execution with `backend_account_required` | `More` -> `AI career tools` opens the actual tools screen instead of resources | `flutter test test/widget_test.dart --plain-name "local campus tester AI card opens tools with backend-required status"` |
| Campus student | CV Manager / builder entry | `/employee/v1/cv/generate/download-url`, `fetchCvTemplates`, `fetchUploadedCvs` in `SeekerDashboardService` | `More` -> `CV manager` -> `seeker-cv-manager-screen` | `flutter test test/widget_test.dart --plain-name "opens signed-in campus CV manager with backend CVs"` |
| Campus local tester | CV Manager / builder inspection | Backend-only file actions return a clear backend-account-required error instead of expiring the local session | `More` -> `CV builder` -> `seeker-cv-manager-screen` with review CV/template content | `flutter test test/widget_test.dart --plain-name "local campus CV builder does not expire the tester session"` |
| Seeker/Campus | CV Manager lifecycle | `/employee/v1/cv/uploaded`, `/generate/templates`, `/generate/download-url`, `/upload`, `/upload/:cvId`, `/uploaded/:cvId`, `/quality-score`, `/duplicate`, `/visibility`, and cover-letter templates/preview/download in `SeekerDashboardService` | `CV Manager` controls: upload, generate PDF, activate, score, duplicate, visibility, delete, cover-letter preview/download, parser upload/preview/confirm/reject | `docs/testing/ui-action-contract.json` now checks these mobile route/UI pairs and the CV lifecycle widget tests under `npm run test:ui-actions --silent` |
| Placement contract | Campus AI + CV route/UI guards | `docs/testing/ui-action-contract.json` route/UI pairs | Machine-readable contract | `npm run test:ui-actions --silent` |
| Mobile route-owner journeys | 369 mobile backend route literals grouped into 13 owners | `docs/testing/mobile-backend-route-owners.json` + `docs/testing/mobile-backend-route-ui-journeys.json` | Every owner now has auth, background, or UI entry/destination proof | `npm run test:mobile-backend-route-owners --silent` and `npm run test:mobile-backend-route-ui-journeys --silent` |
| Company | AI hiring tools | `/ai/v1/company/jobs/generate`, `/ai/v1/company/jobs/:jobId/shortlist`, `/ai/v1/company/messages/generate`, `/ai/v1/translate/job/:jobId` in `CompanyDashboardService` | `More` -> `AI hiring tools` -> `company-ai-hiring-tools-screen` -> Job Draft / Candidate Shortlist / Hiring Message / Job Translation buttons | `flutter test test/widget_test.dart --plain-name "company AI hiring tools are grouped under More when enabled"` now taps all four tool buttons and verifies the backend feature + context payload, plus `npm run test:ui-actions --silent` |
| Tester APK AI visibility | Review-build AI tools | `AppConfig(buildMode: "debug-apk")` now enables the grouped AI review surface even when the compile-time AI define is omitted | Company sign-in through `HalaJobApp` -> `More` -> `AI hiring tools` -> `company-ai-hiring-tools-screen` | `flutter test test/widget_test.dart --plain-name "tester APK app path exposes grouped company AI tools without compile flag"` |
| Campus content | Claude/demo content DB seed | `CampusContentModel`, `seed:demo-campus`, `seed:demo` campus-content hook, `/user/v1/campus/content` DB-first meta | APK reads the backend campus content route; local packaged content is fallback only | `node scripts/verifyCampusWorkflowIntegration.js` verifies `meta.source === "database"` and `Nexa Retail`, `CV Office Hours`, `CV lab for students` |
| Mobile shell | Locked header and bottom navigation | N/A | Role homes require navy header + notifications/profile/settings + exact role tabs; follow-up screens require navy back/title header + exact role tabs | Focused `flutter test` filter covering role roots, company AI, company More workflows, campus profile/settings, campus card details, campus AI, campus CV builder, seeker AI, plus `flutter test test/mobile_chrome_contract_test.dart` statically guarding seeker/campus/company/university workflow bottom-nav plumbing |
| Header profile/settings | Account, profile, settings, and notification shell routes | Company/seeker profile and account services are exercised by widget tests | Seeker Profile -> profile checkpoints, Seeker Settings -> settings/account detail, Company Notifications, Company Profile -> Company profile settings/Profile sections, Company Settings -> Account & settings/sign out all keep the locked follow-up header and exact role bottom nav | `flutter test test/widget_test.dart --name "company header exposes universal account actions|header profile and settings actions are available|company profile settings screen updates profile and search|company profile sections screen manages social links"` plus `flutter test test/widget_test.dart --plain-name "company account profile screen updates owner settings"` |
| Mobile More maps | Seeker and campus secondary function cards | Relevant client services are exercised by destination tests where backend is required: CV manager, Career Passport, job alerts, salary insights, company request, campus verification | Seeker More exact cards: Career Passport, CV manager, Job alerts, Salary insights, Companies, Company request, Account status, Interview prep. Campus More exact cards: Career Passport, CV builder, Job alerts, Interview prep, Campus verification, Account status, Campus resources | `flutter test test/widget_test.dart --name "seeker more tab exposes secondary function cards|campus more tab exposes student function cards|seeker more actions open their launch destinations|campus more actions open their launch destinations"` verifies exact card keys, destination-only markers, and locked follow-up chrome |
| Mobile navigation proof contract | Seeker/campus/company card inventories and destination tests | `docs/testing/ui-action-contract.json` now has `navigationProofs` entries for More cards, AI hiring tools, role card details, filters, and company workflow cards | `npm run test:ui-actions --silent` fails if these proof tests or expected card keys disappear | Four machine-readable navigation proof blocks cover seeker More, campus More, company More/AI tools, and role card/detail/filter tests |
| Mobile action-key coverage | Locked mobile headers, bottom nav, dashboard cards, company AI, job/applicant/talent actions, and CV controls | `docs/testing/mobile-action-key-coverage.json` scans dashboard/company Flutter source for concrete action keys and separately proves dynamic families like bottom nav tabs, quick actions, job/application cards, and AI tool buttons | `npm run test:mobile-action-key-coverage --silent` fails when a new protected mobile key is added without widget-test or contract proof | Protects 100+ static/dynamic key proofs before the broader UI launch gate can pass |
| Seeker rich functions | Company directory/reviews, company request, salary insights, CV Manager | Seeker service methods for companies/reviews/company request and salary/CV service methods are tied to UI keys in `docs/testing/ui-action-contract.json` | `More` -> Companies -> company detail lenses/review, `More` -> Company request -> save/upload/submit, `More` -> Salary insights, and seeker/campus CV Manager keep locked role follow-up chrome | `flutter test test/widget_test.dart --name "opens seeker company directory and submits a review|opens company request screen and submits a verification file|opens seeker salary insights from More|opens signed-in seeker CV manager with backend CVs|opens signed-in campus CV manager with backend CVs"` plus `npm run test:ui-actions --silent` |
| Company More map | Secondary workspace modules | AI/client services are covered by module workflow tests for AI tools, files, support, audit logs, subscription, team, questions, templates | Company More exact cards with AI: AI hiring tools, Company files, Support, Audit logs, Subscription, Team, Questions, Templates. Without AI: same list minus AI hiring tools. Talent pool/help/campus recruiting stay in Talent, not More | `flutter test test/widget_test.dart --name "company AI hiring tools are hidden by default for Syria launch|company AI hiring tools are grouped under More when enabled|company More module cards open their workflow screens"` verifies exact `company-module-*` keys and follow-up chrome |
| Company secondary modules | Company files, support, subscription, audit logs, team, TES questions, templates | Company service methods for profile files, support tickets, members, question library, templates, subscription, and audit logs are tied to UI keys in `docs/testing/ui-action-contract.json` | `More` -> Company files/support/subscription/audit/team/questions/templates opens the owning workflow and deeper actions keep locked company follow-up chrome | `flutter test test/widget_test.dart --name "company files screen manages upload download and delete|company subscription screen manages billing and plan requests|company audit logs screen loads and filters audit history|company questions screen manages TES question library|company templates screen manages message templates|company team screen manages members and permissions"` plus `npm run test:ui-actions --silent` |
| Seeker card flows | Core seeker cards and follow-up routes | Local/default seeker content plus application pipeline route state | `Jobs` -> opportunity detail, `Jobs` -> filters, `My Jobs` -> applied application detail, `More` -> interview prep -> resource detail all keep the locked seeker follow-up header and exact four-tab bottom nav | `flutter test test/widget_test.dart --plain-name "seeker card detail and filter routes keep the locked follow-up chrome"` |
| Campus card flows | Core campus cards and follow-up routes | Local/default campus content plus application pipeline route state | Home event -> event detail, Home resource -> resource detail, Opportunities -> opportunity detail, Opportunities -> filters, My Applications -> applied application detail all keep the locked campus follow-up header and exact five-tab bottom nav | `flutter test test/widget_test.dart --plain-name "campus card detail and filter routes keep the locked follow-up chrome"` |
| Company card flows | Core company cards and follow-up routes | Company applicant, job, invitation, and talent fake services exercise the client service callbacks | Applicants -> applicant detail, Jobs -> job detail, Job detail -> applicant detail, Talent -> invitations, Talent -> Talent pool, Talent -> Talent help all keep the locked company follow-up header and exact five-tab bottom nav | `flutter test test/widget_test.dart --name "company invitations screen manages invite workflows|company applicant screen updates status, notes, and rating|company job screen manages live job actions|company talent screens search and manage help requests"` |
| Interview/video workflows | Seeker/campus interview responses and company interview scheduling/update/follow-up | `SeekerDashboardService.respondToInterview`, `requestInterviewReschedule`, and company interview service methods map to interview routes | Seeker/Campus `My Jobs`/`My Applications` -> Interviews -> application detail -> Accept/Decline/Reschedule; Company Applicants -> applicant detail -> schedule/update/cancel/reminder/no-show/feedback all keep locked role chrome | `flutter test test/widget_test.dart --name "company applicant screen schedules and updates interviews|accepts a live seeker interview from the detail screen|accepts a live campus interview from the detail screen"` plus `npm run test:ui-actions --silent` |

## Demo Data Reality

Claude's demo data is a backend database seed, not an APK asset. The packaged
mobile campus fallback is intentionally placeholder-only, and
`npm run test:demo-data-contract` guards that named review records such as
`Nexa Retail`, `CV Office Hours`, and `CV lab for students` remain out of
shipped mobile assets/source. The APK will only show demo jobs, applications,
interviews, saved jobs, support tickets, campus content, and demo accounts if
`CONNECTION_URL` points to the same database used by the APK/web build and
these commands have been run:

```bash
CONNECTION_URL="<mongo-uri>" npm run seed
CONNECTION_URL="<mongo-uri>" npm run seed:demo
CONNECTION_URL="<mongo-uri>" npm run seed:demo-campus
```

`seed:demo` now also seeds the default published campus content document. The
separate `seed:demo-campus` command exists for refreshing only the campus
content payload.

Current demo credentials documented in `docs/DEMO_DATA_REVIEW.md`:

| Role | Email | Password | Passcode |
| --- | --- | --- | --- |
| Seeker | `seeker@demo.halajob.local` | `Demo@1234` | `123456` |
| Company | `company@demo.halajob.local` | `Demo@1234` | `123456` |

The seeded passcode is single-use and must be refreshed by rerunning
`npm run seed:demo`.

## Remaining Work

| Area | Status | Next proof needed |
| --- | --- | --- |
| Full backend route inventory | Not complete | Walk `docs/api/HALAJOB_ROUTE_INVENTORY.json` family by family and link each product route to one UI owner, service method, and widget/web test. |
| Seeker mobile start-to-end cards | Partial | Exhaustive tap test for every bottom tab, More card, dashboard card, job card, application/interview/offer action, settings action, and notification target. |
| Campus mobile start-to-end cards | Partial | Same exhaustive tap test, now including Campus CV Manager and Campus AI. |
| Company mobile start-to-end cards | Partial | Verify `More` contains only secondary tools, `AI hiring tools` opens the tool screen, and job/applicant/interview/talent actions reach the correct workflows. |
| Web seeker/campus/company parity | Partial | Compare web tabs/actions against this map and add route/UI contract pairs for missing or ambiguous surfaces. |
| Demo data in review environment | Needs DB URL/operator | Seed the actual review DB, then log into seeker/company demo accounts and capture screenshots/automation proof. |
| APK vs emulator vs phone provenance | Partial | Keep embedding build commit/mode, record APK SHA, and compare phone-installed APK hash where a phone is connected. |

## Commands Run For This Slice

```bash
flutter test test/widget_test.dart --plain-name "campus AI career tools are grouped under More when enabled"
flutter test test/widget_test.dart --plain-name "local campus tester AI card opens tools with backend-required status"
flutter test test/widget_test.dart --plain-name "opens signed-in campus CV manager with backend CVs"
flutter test test/widget_test.dart --plain-name "company AI hiring tools are grouped under More when enabled"
flutter test test/widget_test.dart --name "company AI hiring tools are grouped under More when enabled|company More module cards open their workflow screens|campus profile and settings keep the bottom navigation|campus card detail and filter routes keep the bottom navigation|campus AI career tools are grouped under More when enabled|local campus tester AI card opens tools with backend-required status|local campus CV builder does not expire the tester session|seeker AI career tools screen keeps dedicated IA label|authenticated role roots keep the locked navy header chrome"
flutter test test/widget_test.dart --name "opens seeker company directory and submits a review|opens company request screen and submits a verification file|opens seeker salary insights from More|opens signed-in seeker CV manager with backend CVs|opens signed-in campus CV manager with backend CVs"
flutter test test/widget_test.dart --name "company header exposes universal account actions|header profile and settings actions are available|company profile settings screen updates profile and search|company profile sections screen manages social links"
flutter test test/widget_test.dart --plain-name "company account profile screen updates owner settings"
flutter test test/widget_test.dart --name "seeker more tab exposes secondary function cards|campus more tab exposes student function cards|seeker more actions open their launch destinations|campus more actions open their launch destinations"
flutter test test/widget_test.dart --name "company AI hiring tools are hidden by default for Syria launch|company AI hiring tools are grouped under More when enabled|company More module cards open their workflow screens"
flutter test test/widget_test.dart --name "company files screen manages upload download and delete|company subscription screen manages billing and plan requests|company audit logs screen loads and filters audit history|company questions screen manages TES question library|company templates screen manages message templates|company team screen manages members and permissions"
flutter test test/widget_test.dart --name "opens signed-in seeker CV manager with backend CVs|opens signed-in campus CV manager with backend CVs|campus CV profile checkpoint opens the same CV manager|generates a seeker CV download from a backend template|previews a seeker CV cover letter from backend templates|downloads a seeker CV cover letter from backend templates|seeker CV visibility uses ticked drill-in choices|seeker CV delete requires confirmation before mutation|seeker CV manager previews and confirms parsed upload"
flutter test test/widget_test.dart --plain-name "seeker card detail and filter routes keep the locked follow-up chrome"
flutter test test/widget_test.dart --plain-name "campus card detail and filter routes keep the locked follow-up chrome"
flutter test test/widget_test.dart --name "company invitations screen manages invite workflows|company applicant screen updates status, notes, and rating|company job screen manages live job actions|company talent screens search and manage help requests"
flutter test test/widget_test.dart --name "company applicant screen schedules and updates interviews|accepts a live seeker interview from the detail screen|accepts a live campus interview from the detail screen"
flutter test test/mobile_chrome_contract_test.dart
node scripts/verifyCampusWorkflowIntegration.js
npm run test:mobile-ui-contract --silent
npm run test:ui-actions --silent
npm run test:mobile-action-key-coverage --silent
```
