# HalaJob Function Placement Map

Date: 2026-06-30
Branch: `codex/gate-a-mobile-ui-lock`
Status: authoritative planning map for product placement. This document does not
claim that every row is already perfectly implemented. It defines where each
function belongs so UI work stops moving features between unrelated places.

## Purpose

This map is the first source of truth for where backend capabilities should
appear in the web and mobile products. It is broader than
`docs/MOBILE_INFORMATION_ARCHITECTURE_PLAN.md`, which remains the detailed
Flutter mobile IA companion.

If a feature is added or moved, update this map first, then update the UI and
tests. Do not create a second location for the same function unless this map
explicitly allows a shortcut.

## Backend Route Families

Source inventory: `docs/api/HALAJOB_ROUTE_INVENTORY.json`
Generated at: `2026-06-30T08:44:26.058Z`

| Route family | Count | Product ownership |
| --- | ---: | --- |
| `/user/v1` | 255 | Seeker, campus student, account, privacy, communication, career passport |
| `/employee/v1` | 110 | Modern seeker jobs, applications, CV, interviews, offers, company reviews |
| `/campus/v1` | 18 | Canonical campus/student verification aliases |
| `/university/v1` | 40 | University career-center portal |
| `/company/v1` | 181 | Company hiring workspace |
| `/ai/v1` | 12 | Seeker/campus/company AI modules |
| `/notifications/v1` | 20 | Cross-role notification inbox, preferences, delivery |
| `/analytics/v1` | 5 | Admin/company/university analytics surfaces |
| `/public/v1` | 15 | Public company profile, legal/help, client settings |
| `/trust/v1`, `/admin/v1`, `/jobs/v1`, `/health` | 18 | Admin, public jobs, ops health |
| `/dash/v1` | 3327 | Admin/ops dashboard routes, including generated resource routes |

The `/dash/v1` count is intentionally broad. It should not become a giant user
navigation surface. Product UI should group those routes into the admin modules
below.

## Global Placement Rules

- Header profile opens entity profile: seeker profile, campus profile, company profile, or university account profile.
- Header settings opens account settings, security, language, privacy, data rights, support/legal, and sign out.
- Sign out must be visible from the account/settings surface for every authenticated role.
- Notifications are owned by the header bell plus a notifications screen. Do not create separate notification dashboards in More.
- Primary bottom-tab flows may appear in More only as small shortcuts, never as duplicated dashboard cards.
- AI appears once per role: `AI career tools` for seeker/campus, `AI hiring tools` for company, and `AI operations` for admin.
- CV belongs to seeker/campus `CV Studio` on web and mobile `CV Manager`. It is not a generic document/settings feature.
- Manual WhatsApp belongs to communications/preferences plus contextual share actions. It is not a primary navigation tab.
- Video interviews belong to interview/application/applicant workflows. They are not general More cards.
- Campus mode must not duplicate profile and notifications in both header and More as full cards.
- Company More must not repeat Home dashboard cards, Jobs, Applicants, Interviews, or Talent as large cards.
- The bottom nav active orange line belongs under the active icon/label item, never above the nav bar.
- Feature-gated modules must show either the approved module or an honest disabled/empty state. Silent disappearance is allowed only for production-hidden features explicitly listed below.

## Feature Gates

| Feature | Gate | Default stance | Review-build rule |
| --- | --- | --- | --- |
| AI tools | `ai_tools_enabled`, `FEATURE_AI_TOOLS_ENABLED`, `VITE_FEATURE_AI_TOOLS_ENABLED` | Hidden unless enabled | Owner review APK/web builds should enable this when AI placement is being inspected. |
| CV parsing | `cv_parsing_enabled` | Hidden or honest unavailable state until parser adapter is configured | Do not call parsing ready without provider proof. |
| CV Studio | `cv_studio_enabled` | Visible by default | Must remain visible for seeker unless deliberately disabled. |
| Interview prep | `interview_prep_enabled` | Visible by default | Should appear in seeker/campus learning/prep surfaces. |
| Saved searches/job alerts | `saved_searches_enabled` | Visible by default | Should appear as Job Alerts, not hidden in Settings only. |
| Manual WhatsApp | `manual_whatsapp_share_enabled` | Visible by default | Must be contextual and preference-backed. |
| Official WhatsApp provider | `official_whatsapp_provider_enabled` | Hidden until provider configured | Do not imply official delivery without provider proof. |
| Video interviews | `video_interviews_enabled` | Visible by default | Should expose interview tabs/empty states even when no interviews exist. |
| Talent pool CRM | `talent_pool_crm_enabled` | Visible by default | Company Talent tab owns this. |
| Employer branding | `employer_branding_enabled` | Visible by default | Company profile/settings owns this. |

## Job Seeker Placement

| Function family | Backend routes | Web canonical location | Mobile canonical location | Notes |
| --- | --- | --- | --- | --- |
| Auth, OTP, password reset, logout-all | `/user/v1/auth/*`, `/employee/v1/auth/*` | Auth screen, Settings account/security | Auth screen, Settings account/security | Login text fields must be editable and visible. OTP remains the configured code length used by backend/mobile together. |
| Profile and work preferences | `/employee/v1/global/profile`, `/user/v1/employee/profile-*` | Seeker profile/settings and profile checkpoints | Header Profile, profile checkpoints | Do not mix with account credentials; account email/password lives in Settings. |
| Job discovery and detail | `/employee/v1/global/jobs`, `/user/v1/job*` | `Jobs` tab | Bottom Jobs/Explore tab | Filters belong here, not Settings. |
| Saved jobs | `/employee/v1/global/jobs/saved`, save/toggle routes | `My Jobs` grouped pipeline, `Saved` sub-state | Bottom `My Jobs` pipeline, `Saved` sub-state | Jobs discovery must never render saved-only state. More may have shortcut only. |
| Applications | `/employee/v1/applications`, `/employee/v1/global/applications` | `My Jobs` grouped pipeline, `Applied` sub-state | Bottom `My Jobs` pipeline, `Applied` sub-state and detail screens | Detail owns messages, withdraw/cancel, offer/interview links. |
| Application messages | application message routes | Application detail | Application detail | Show only when application data supports it. |
| Interviews and video joins | interview routes under employee/applications | `My Jobs` pipeline, `Interviews` sub-state | Bottom `My Jobs` pipeline, `Interviews` sub-state plus application/interview detail | Visible when `video_interviews_enabled`; empty state should say no interviews yet. |
| Offers | employee offers routes | `My Jobs` pipeline, `Offers` sub-state | Bottom `My Jobs` pipeline, `Offers` sub-state plus application detail | Do not create a separate More card. |
| CV upload/library/default/visibility/delete | `/employee/v1/cv/*` | `CV Studio` | `CV Manager` from More/profile readiness | Must show active/current CV first, then library/actions. |
| CV builder/generate/download | `/employee/v1/cv/builder/*`, generated CV routes | `CV Studio` | `CV Manager` templates/build/download | This is the "new CV builder" the owner expects. |
| CV parsing | CV parse routes | `CV Studio` parser section | `CV Manager` parser section | Hidden/honest if parser provider is not configured. |
| Cover letters | cover-letter routes | `CV Studio` | `CV Manager` or contextual job/CV action | Not a separate More card. |
| Career Passport | `/user/v1/career-passport`, share routes | `Career Passport` tab | More/profile readiness | Share/public controls live here. |
| AI career tools | `/ai/v1/profile/score`, `/cv/rewrite`, `/interview/practice`, `/career/copilot`, `/jobs/:id/match`, `/jobs/:id/cover-letter` | `AI tools` tab when enabled | One `AI career tools` entry in More when enabled | Job detail may have contextual AI, but full toolset appears once. |
| Interview prep | `/user/v1/interview-prep/*` | `Interview Prep` tab | More `Interview prep` entry | Non-AI prep stays separate from AI and no longer lives inside the Jobs discovery segment. |
| Resources/learning | `/user/v1/resources/*` | `Resources` tab | More/resources screen | Saved/progress/complete belongs here. |
| Job alerts/saved searches | `/user/v1/saved-searches*` | `Job Alerts` tab | More `Job alerts` entry | Search filters should persist into alerts; no Jobs-tab duplicate. |
| Notifications/preferences | `/notifications/v1`, `/user/v1/notification*` | Header bell, `Notifications`, Settings prefs | Header bell, notifications screen, Settings prefs | No duplicate full cards in More. |
| Manual WhatsApp | `/user/v1/communication/*` | Settings communication plus contextual share | Settings communication plus contextual share button | Not a top-level tab. |
| Salary insights | salary routes | `Salary Insights` tab | More or dashboard module, not Settings | Should be visible if enabled. |
| Company directory/profile/reviews/salary | `/employee/v1/global/companies*`, `/employee/v1/companies*`, company review routes, salary routes | Company profile page with `About`/`Jobs`/`Reviews`/`Salary` lenses | More `Companies` -> Company detail lenses `About`/`Jobs`/`Reviews`/`Salary` | Company detail lenses fold reviews and salary guidance into one entity page; no extra bottom tab. |
| Privacy, export, delete request | `/account/export`, `/account/delete-request`, privacy routes | Settings account/privacy | Settings account/privacy | Destructive actions need confirmation. |
| Support/legal | `/user/v1/support/*`, support/legal routes | `/support` ticket inbox/create/detail/reply/close plus Settings/support/legal links | Settings/support/legal | Web support inbox is wired; mobile inbox is tracked separately in Stream B5. Legal/help pages use locked native chrome on mobile. |

## Campus Student Placement

| Function family | Backend routes | Web canonical location | Mobile canonical location | Notes |
| --- | --- | --- | --- | --- |
| Campus auth/register/login | `/user/v1/auth/campus/*` | Campus auth mode | Campus auth mode | Review APK may use local campus tester mode only when intentionally built that way. |
| Campus dashboard | `/user/v1/campus/dashboard`, overview routes | Campus student `Overview` | Bottom Home/Campus content | Dashboard is summary only. |
| Opportunities/search/detail | `/user/v1/campus/opportunities*` | `Opportunities` tab | Bottom `Opportunities` tab | Discovery/search only; saved-only campus mode must not reuse generic opportunities state. |
| Save/apply/external apply | opportunity save/apply routes | Opportunity detail/actions | Opportunity detail/actions | Detail owns readiness/apply. |
| Employer/event cross-links | Campus opportunity/event routes | Opportunity, employer, and event detail | Opportunity/event detail inline Follow cards | Inline Follow is local until a backend follow endpoint exists; do not create a new bottom tab. |
| Saved campus opportunities | opportunity save routes | `My Applications` pipeline, `Saved` sub-state | Bottom `My Applications` pipeline, `Saved` sub-state | Must own separate state from Opportunities discovery. |
| Campus applications/messages/cancel | `/user/v1/campus/applications*` | `My Applications` grouped pipeline, `Applied`/`Interviews`/`Offers` sub-states | Bottom `My Applications` pipeline and detail | Same application rules as seeker. |
| Student verification | `/user/v1/campus/student-verifications*`, verification routes | Profile/readiness and university verification review | More/profile readiness and verification screen | Upload/resubmit belongs to student; approve/reject belongs to university admin. |
| Events | `/user/v1/campus/events*` | `Events` tab | Bottom `Events` tab plus native event detail | Do not duplicate as dashboard cards in multiple places. |
| Resources | `/user/v1/campus/resources*` | `Resources` tab | More/resources detail | Resource library owns progress/saves. |
| Career Passport | career passport routes | `Career Passport` tab | More/profile readiness | Same owner as seeker. |
| CV upload/builder/library | `/employee/v1/cv/*`, CV builder/generate routes | `CV Studio` / student readiness | More `CV Builder` and profile CV status opening CV Manager plus Career Passport/readiness | Campus students use the same CV Manager surface as seekers; local tester mode may show the screen without backend generation. |
| Talent visibility | `/user/v1/campus/talent-visibility` | `Talent Visibility` tab | More/profile/settings sub-surface | Make the current visibility state obvious. |
| Interview prep | interview prep routes | `Interview Prep` tab | More `Interview prep` entry | Enabled by `interview_prep_enabled`; no Opportunities-tab duplicate. |
| Job alerts | campus saved-search routes | `Job Alerts` tab | More `Job alerts` entry | Saved filters persist here. |
| AI career tools | `/ai/v1/*` seeker-safe routes | `AI tools` tab when enabled | One `AI career tools` More entry when enabled | Campus-safe copy and guardrails required. |
| Notifications | notification routes | Header bell, `Notifications` | Header bell, notifications screen | Do not repeat profile/notification cards in More. |
| Campus profile | profile routes | Header profile | Header profile, profile checkpoints | Academic/profile data only. |
| Settings/account/sign out | account/settings routes | Header settings | Header settings/account | Sign out always visible. |

## University Career-Center Placement

| Function family | Backend routes | Web canonical location | Mobile canonical location | Notes |
| --- | --- | --- | --- | --- |
| University dashboard | `/university/v1/dashboard`, overview/settings | University portal `Overview` | University dashboard overview | Summary only. |
| Students | `/university/v1/students*` | `Students` tab | Students screen | Row opens student detail. |
| Student career passport | `/university/v1/students/:id/career-passport` | Student detail/passport | Student detail/passport | Read-only university review. |
| Verification queue/documents | `/university/v1/verifications*`, `/campus/v1/admin/*` | `Verifications` tab | Verifications screen | Approve/reject/request info live here. |
| Partners/employer partners | `/university/v1/partners*` | `Partners` tab | Partners screen | Approve/reject/suspend here. |
| Opportunities/post internships | `/university/v1/opportunities*` | `Opportunities` and `Post Internship` | More opportunities/create surface | Do not expose as a bottom tab; keep posting reachable from More. |
| Members/team | `/university/v1/members*`, `/campus/v1/admin/members*` | `Members` tab | Gap: needs mobile placement | Web is wired; mobile still needs a native members/team screen. |
| Analytics/readiness/outcomes | `/university/v1/analytics*` | `Analytics` tab | Home summary plus More analytics/outcomes | Keep full reports out of the Students/Partners tabs. |
| Reports/export | `/university/v1/reports/outcomes` | `Reports` tab | More outcomes/report/export action | No separate bottom tab. |
| Events/resources/assignments | `/university/v1/events*`, `/resources*` | `Events/resources` tab | More events/resources screens | Assignment/analytics should stay with resources. |
| Notifications | notification routes | Header bell or real notifications tab | Wire backend data or remove placeholder | Placeholder-only notification screens are not launch acceptable. |
| Account/settings/sign out | settings/account routes | Settings/account | Account details/settings | Next mobile refactor should align with shared header/settings rules. |

## Company Placement

| Function family | Backend routes | Web canonical location | Mobile canonical location | Notes |
| --- | --- | --- | --- | --- |
| Company auth/account | `/company/v1/auth/*` | Company auth/settings | Company auth/settings | Company registration may remain managed by HalaJob if launch policy says so. |
| Hiring dashboard | dashboard routes | `Home` | Bottom Home | Metrics, trust, recent jobs/applicants/interviews only. |
| Jobs/post/edit/pause/resume | `/company/v1/global/jobs*`, job mutation routes | `Jobs` tab | Bottom Jobs tab | Job detail owns edit, pause/resume, publish review status. |
| Job translation | `/ai/v1/translate/job/:jobId` and translation routes | Job detail/contextual action | Job detail/contextual action | Not a separate AI card. |
| Applicants and statuses | company applicants/application routes | `Applicants` tab | Bottom Applicants tab | Detail owns notes, status, messages, rating. |
| Interviews/video scheduling | company interview routes | `Interviews` tab and Applicant detail | Applicant/interview workflow | Enabled by `video_interviews_enabled`; not repeated in More. |
| Talent pool/invitations | talent pool routes | `Talent Pool` tab | Bottom Talent tab only when `talent_pool_crm_enabled`; otherwise hidden | Invitations and talent help live here when enabled; no disabled dead panel. |
| Campus recruiting | company campus routes | `Campus` tab | Talent tab or campus recruiting module | Do not duplicate in More. |
| AI hiring tools | `/ai/v1/company/jobs/generate`, `/shortlist`, `/messages/generate` | `AI tools` tab when enabled | One `AI hiring tools` More entry when enabled | Must be grouped like seeker AI, not spread through More. |
| Manual WhatsApp/contact | communication/company routes | Communication/settings plus contextual action | Manual WhatsApp contextual surface | Preference-backed, not a primary tab. |
| Company profile/branding | company profile/branding routes | Header profile, branding/settings | Header profile | Profile icon edits company entity profile. |
| Account settings/sign out | settings/auth routes | Header settings | Header settings/account | Settings icon must not open company profile. |
| Members/team/questions/templates | company members/question/template routes | Team/settings area | More team/templates section | Admin/configuration only. |
| Files/documents | files routes | More/company files | More/company files | Secondary workspace tool. |
| Support/legal | support routes | Support/settings | More/support/settings | Secondary workspace tool. |
| Subscriptions/billing/invoices | subscription routes | Subscriptions tab | More/subscription area | Manual/admin subscription path until payment provider chosen. |
| Analytics | analytics routes | Analytics tab | Analytics cards/screens | Keep separate from Home metrics. |
| Notifications | notification routes | Header bell/notifications | Header bell/notifications | Badge from unread count. |

## Admin And Operations Placement

| Function family | Backend routes | Web canonical location | Mobile location | Notes |
| --- | --- | --- | --- | --- |
| Overview metrics | `/dash/v1/dashboard*`, analytics | Admin `Overview` | None | Admin is web-first. |
| Moderation/trust | `/admin/v1/trust*`, `/trust/v1*`, `/dash/v1/trust*` | `Moderation`, `Trust` aliases where exposed | None | Use one queue/detail pattern. |
| Users, roles, permissions | `/dash/v1/users`, roles, permissions | `Users` / platform security operations | None | Guarded by permission catalog. |
| Companies/public profiles | company approval/public profile routes | `Companies`, `Public profiles` | None | Approve/reject needs confirmation. |
| Job approvals | job approval routes | Admin job approval surface | None | Hidden only if launch scope intentionally excludes it. |
| Universities | university admin routes | `Universities` | None | Creates/manages university entities. |
| Career passports | `/dash/v1/career-passports*` | `Passport` | None | Requires `career_passports.view`. |
| Resource library | resource admin routes | `Resource library` | None | Do not duplicate as generic `resources` tab unless alias guarded. |
| Interview prep admin | interview prep admin routes | `Interview prep` | None | Content/admin ownership. |
| Salary insights | salary/admin routes | `Salary insights` | None | Rebuild/admin rows here. |
| Subscriptions/invoices | subscription/invoice routes | `Subscriptions` | None | Payment provider remains owner decision. |
| Support/legal/privacy/content | support/legal/privacy/content routes | `Support/legal`, `Legal reports`, `Privacy`, `Content` | None | Queue/detail actions here. |
| AI operations | admin AI routes and `/ai/v1` controls | `AI` / `AI operations` | None | Provider honesty and limits live here. |
| Translations | translation routes | `Translations` | None | Includes CV/job/career passport translations. |
| Communication logs | notification/communication admin routes | `Communication logs` | None | Includes email, SMS, in-app, manual WhatsApp. |
| Audit and analytics | audit/analytics routes | `Audit`, `Analytics` | None | Do not mix with user dashboards. |
| Platform settings | settings routes | `Platform settings` | None | Feature flags and public client settings live here. |

## Public And Cross-Cutting Placement

| Function family | Backend routes | UI location | Notes |
| --- | --- | --- | --- |
| Public company profile/search | `/public/v1/companies*` | Public web search/profile | Public screen only; authenticated shortcuts may link out. |
| Legal/help pages | `/public/v1/legal*`, content routes | Public web and mobile legal/help screens | Mobile uses locked native navy chrome; help article rows open full article detail from `/public/v1/help/articles/:key`. |
| Support tickets | `/user/v1/support/tickets*` | Public web `/support` for authenticated ticket create/list/detail/reply/close | Mobile Help Center exposes authenticated My Support Tickets with list/detail/reply/close; do not duplicate under unrelated More cards. |
| Client feature settings | `/public/v1/client-settings` | Internal boot/config | Not visible as user feature except in admin Platform Settings. |
| Health/readiness | `/health/live`, `/health/ready` | Ops/CI only | Never show as user navigation. |
| Notifications delivery | `/notifications/v1` plus role notification routes | Role notification screens and admin communication logs | Keep user inbox separate from admin logs. |

## Known Gaps To Fix After Mapping

| Gap | Impact | Required decision |
| --- | --- | --- |
| University members are wired on web but not clearly on mobile | University admin cannot manage team from mobile | Add a mobile university Members/Team screen or declare web-only. |
| AI visibility in review APKs can be confusing | Owner may not see AI even when backend/UI exists | Standardize review builds so AI is enabled when placement is under review. |
| CV Builder is not always visually prominent | Owner expects a clear "new CV builder" surface | Keep CV Studio/Manager visible and labeled clearly in seeker More/profile readiness. |
| WhatsApp is mostly preference/contextual | Owner may expect a visible workflow | Decide where contextual WhatsApp share appears for seeker/company without making it a tab. |
| Company More can drift back into dashboard duplication | Confusing company UX | Keep only secondary workspace/tools/team entries in More. |
| Profile/settings/notifications duplicated across roles | Confusing headers and More | Header owns these; More only links to secondary functions. |
| Admin `/dash/v1` route count is huge | Temptation to expose too many tabs | Group generated routes into the admin modules above. |

## Implementation Rule

For future UI work:

1. Update this map when changing placement.
2. Update the role UI.
3. Add or update route/UI and widget tests for the placement.
4. Commit and push the branch before handoff.
