# Role Permission Matrix

Date: 2026-06-27
Scope: current backend role and account-context baseline.

## Naming Map

The backend currently contains legacy role/account names. These are the product-facing names that should be used by mobile, web, admin docs, and future API docs.

| Product role | Current backend/account-context names | Primary guard/source |
|---|---|---|
| `seeker` | `employee`, `job_seeker` | `authUser`, `requireAppAccount("employee")` |
| `campus_student` | `student` account context under employee app account | `authUser`, `requireAppAccount("employee")`, `requireCampusStudent` |
| `company_owner` | `company_admin` context with owner access | `authUser`, `requireCompanyContext`, `requireAppAccount("company")`, `requireCompanyPermission(...)` |
| `company_member` | `company_member`, `company_admin` for admin members | `authUser`, `requireCompanyContext`, `requireAppAccount("company")`, `requireCompanyPermission(...)` |
| `university_admin` | `university_admin` account context | `authUser`, `requireUniversityAdminContext` |
| `platform_admin` | dashboard role with `log_to: "dash"` | `isAdmin` |
| `super_admin` | `super_admin` account context derived from admin role | `isAdmin`, `requireUniversityAdminContext` where allowed |
| `support` | not fully separated yet | Dashboard role/permissions need expansion |

## Current Access Baseline

| Role | Allowed areas | Denied areas | Backend source of truth | Audit/logging expectation |
|---|---|---|---|---|
| `seeker` | Job search, profile, CV, saved jobs, applications, Career Passport, seeker AI, notifications. | Company owner/member routes, university admin routes, dashboard admin routes. | User + employee profile + active account context. | Applications, profile/CV changes, AI requests, notifications should be logged where implemented. |
| `campus_student` | Campus dashboard/profile, opportunities, campus applications, events/resources, student verification. | University admin verification queue, company routes, dashboard admin routes. | Employee/student profile, campus verification record, active `student` context. | Verification submit/resubmit, event registration, opportunity applications. |
| `company_owner` | Company profile, jobs, ATS, interviews, members, billing, analytics, support, audit logs, campus company features. | Other companies, university admin routes, platform admin routes. | Company `owner_user_id`, active `company_admin` context, company access helper. | Job/application/interview/member/billing/audit-sensitive actions. |
| `company_member` | Company routes according to member permission list. | Owner-only or missing-permission actions, suspended member records, other companies, university/platform admin routes. | `company_members` record with `status: active` and permission list. | Same company audit rules as owner, with member ID. |
| `university_admin` | University dashboard, student verification queue, analytics, outcomes, partners, opportunities. | Other universities, company dashboard, platform admin routes. | `university_memberships` record or university career-center email match, active `university_admin` context. | Student verification decisions, reports, opportunity/partner actions. |
| `platform_admin` | Dashboard APIs, trust/admin review routes, admin resource management. | Mobile app role switching unless a context grants it. | Dashboard role where `role.log_to === "dash"` and active refresh-token session. | Admin login, role/permission changes, trust decisions, sensitive exports. |
| `super_admin` | Platform-wide context where explicitly allowed. | Must still be blocked from routes that require a concrete company/university record unless the code explicitly allows override. | Admin role-derived `super_admin` account context. | Same as platform admin plus any cross-tenant override. |
| `support` | To be defined. | To be defined. | Permission-scoped dashboard role should be created. | Support actions and account access must be audited. |

## Company Permission Keys Seen In Routes

| Permission | Current use |
|---|---|
| `company.profile.manage` | Company profile update/media/files/sections/search rebuild. |
| `billing.manage` | Subscription/current plan/invoices/plan change request. |
| `jobs.manage` | Job create/update/delete/status/publish/pause/archive/restore/clone and company campus opportunities. |
| `ats.view` | Applicant/application/interview/talent/campus student reads and exports. |
| `ats.status.change` | Application status update/restore. |
| `ats.notes.add` | Application notes and applicant rating. |
| `ats.interviews.schedule` | Interview create/update/cancel/status changes. |
| `ats.messages.send` | Candidate messages and invitations. |
| `ats.reject` | Blocking/rejecting applicant flows. |
| `audit.view` | Company audit log reads. |
| `question_library.manage` | Question library CRUD. |
| `message_templates.manage` | Message template CRUD. |
| `support.manage` | Company support tickets. |
| `company.members.manage` | Company team/member management. |
| `analytics.view` | Company analytics. |

Runtime verifier: `npm run test:integration:company-permissions` proves owner wildcard access, member `ats.view` allow, missing `jobs.manage`/`billing.manage` denial, and suspended member denial.

## Dashboard Admin Permission Keys

| Permission | Current use |
|---|---|
| `dashboard.view` | Dashboard/statistics/project-status summaries and tracking/activity aliases. |
| `dashboard.search` | Dashboard global search. |
| `ai.view` | Admin AI feature, limit, request, and usage summary reads. |
| `ai.manage` | Admin AI limit create/update/deactivate actions. |
| `audit.view` | Admin audit-log reads. |
| `translations.view` | Content translation/translation-log reads. |
| `notifications.view` | Notification log reads. |
| `files.read` | Protected dashboard file downloads under `/dash/v1/file/:name`. |
| `companies.moderate` | Company request queues and approve/reject actions. |
| `jobs.moderate` | Job moderation queues and approve/reject actions. |
| `trust.view` | Trust review queue reads. |
| `trust.manage` | Trust mark-safe, suspend, and request-document actions. |
| `talentrequests.manage` | Talent request queues and admin status updates. |
| `subscriptions.manage` | Admin subscription plan seeding, company subscription reads, and plan assignment. |
| `universities.read` | Admin campus university list. |
| `universities.manage` | Admin campus university create/status actions. |
| `<resource>.read/create/update/delete/approve/reject/manage` | Legacy dashboard resource aliases and generic `/dash/v1/resources/:resource` routes. `<resource>.manage`, `<resource>.*`, `resources.*`, and `resources.manage` can be used for grouped access. |
| `*` / `admin.*` | Full dashboard permission wildcard. |

Runtime verifier: `npm run test:integration:admin-permissions` proves role-number-1 super-admin bypass, audit-only allow/deny, read-only resource denial for writes, resource-manager create access, company moderation access, blocked cross-permission audit access, `files.read` protected dashboard file downloads, attachment/no-store/nosniff headers, and non-image/non-PDF file denial.

## Launch Gaps

| Gap | Required next step |
|---|---|
| Product role names are not fully canonical in code. | Keep compatibility aliases, then gradually migrate docs/API responses to `seeker`, `campus_student`, `company_owner`, `company_member`, `university_admin`, `platform_admin`, `super_admin`, `support`. |
| Support role is not separately modelled. | Add explicit support role/permissions and assign only the dashboard permission keys it needs. |
| Route-by-route role table is not complete. | Expand this matrix using `docs/api/HALAJOB_ROUTE_INVENTORY.json`. |
| Audit logging is not proven for every sensitive route. | Add route/action coverage tests for admin, company, campus verification, trust, exports, AI usage, and files. |
