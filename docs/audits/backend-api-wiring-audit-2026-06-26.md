# Hala Job Backend and API Wiring Audit

Date: 2026-06-26
Branch audited: `flutter-seeker-campus`
Repository: `joseph2820212-maker/halajobe`

## 1. Executive Verdict

The backend is broadly mounted, the main web API client is wired to existing backend routes, and the current source-level route contract checks pass. The project is no longer in a state where the main problem is "missing route files" for the core product areas.

However, it is not yet safe to say every backend function is fully proven end-to-end. The biggest remaining gap is runtime integration testing: many routes are present and connected, but there is not enough seeded database/API test coverage proving role permissions, cross-account blocking, mutation side effects, upload/download safety, and full user journeys.

## 2. Readiness Scores

| Area | Score / 10 | Meaning |
|---|---:|---|
| Backend route mounting | 8 | Core route groups are mounted and organized across seeker, company, admin, campus, university, AI, trust, analytics, notifications, and jobs. |
| Web API wiring | 8 | No obvious hard 404s found in the centralized web API client against mounted backend route families. |
| Mobile API wiring | 7 | Primary mobile routes are mostly wired, but several old `/employee/v1/...` fallback paths can 404 after newer valid paths fail. |
| Feature API coverage | 7 | Most major product areas have APIs, but several workflows are partial or missing management/completion endpoints. |
| Auth and account-context safety | 6 | Guards exist, but active context is server-mutated and not passed per request; this needs stronger testing and possibly a header-based context model. |
| Admin operational coverage | 6 | Admin covers many areas, but newer operational records are not all surfaced as admin resources or workflows. |
| Automated backend test depth | 4 | Current checks are strong for static route contracts, but thin for real HTTP + database behavior. |
| Launch confidence from backend/API only | 6.5 | Good foundation, but needs integration tests and a few API decisions before treating it as launch-hard. |

## 3. Audit Method

Four parallel read-only audit tracks were used:

| Track | Scope |
|---|---|
| Route and middleware inventory | Express mounts, route protection, public/protected surfaces, unmounted route files. |
| Controller/model feature coverage | Which product features have backend routes and controllers, and which workflows are partial or missing. |
| Web/mobile API wiring | Web and Flutter API paths compared against mounted backend routes. |
| Verification/test coverage | Existing scripts, smoke checks, source-level contract tests, and missing runtime integration coverage. |

Local verification also included route inventory generation, frontend/mobile static API reference comparison, and the existing backend/web checks listed in section 9.

## 4. Mounted Backend API Surface

Main Express mounts are in `app.js` and include:

| Base path | Purpose | Status |
|---|---|---|
| `/dash/v1` | Admin dashboard auth, dashboard data, moderation, CRUD resources, translations, audit logs, subscriptions | Mounted |
| `/employee/v1` | Employee/job seeker dashboard APIs, profile, CV, helper routes | Mounted |
| `/company/v1` | Company auth, dashboard, jobs, ATS, hiring, billing, campus company APIs | Mounted |
| `/jobs/v1` | Job translation route | Mounted |
| `/ai/v1` | Employee/company/admin AI routes with safety wrappers and logging | Mounted |
| `/analytics/v1` | Analytics tracking and admin analytics | Mounted |
| `/trust/v1` | Job trust score/report routes | Mounted |
| `/admin/v1/trust` | Trust moderation/admin queue | Mounted |
| `/notifications/v1` | Notification inbox/device/admin-style notification APIs | Mounted |
| `/campus/v1` | Campus mobile dashboard/events/opportunities/applications | Mounted |
| `/university/v1` | University admin dashboard, students, passports, verification, reports | Mounted |
| `/health` | Health check | Mounted |
| `/user/v1` | App/public user API, auth, jobs, applications, campus, notifications, career passport | Mounted |

Generated inventory summary:

| Namespace | Method count |
|---|---:|
| `/dash/v1` | 2869 |
| `/user/v1` | 191 |
| `/company/v1` | 133 |
| `/employee/v1` | 71 |
| `/university/v1` | 15 |
| `/notifications/v1` | 13 |
| `/campus/v1` | 12 |
| `/ai/v1` | 12 |
| `/admin/v1` | 7 |
| `/analytics/v1` | 5 |
| `/trust/v1` | 2 |
| `/jobs/v1` | 1 |
| `/health` | 1 |
| `/cv/generated` | 1 |

The high `/dash/v1` count is mainly from broad generic dashboard CRUD aliases.

## 5. Feature Coverage Findings

### Implemented and Routed

| Product area | Current status |
|---|---|
| Job seeker profile/dashboard | Routed and controller-backed. |
| Job browse/recommend/save/apply/rate/review | Routed and controller-backed. |
| Applications, interviews, offers, messages | Routed under seeker/employee APIs. |
| Company browse and reviews | Routed under employee/global routes. |
| CV upload, templates, generation, download | Routed and controller-backed. |
| Company dashboard/profile/files/billing/jobs | Routed and controller-backed. |
| Company ATS/interviews/audit/question library/templates/support/members/analytics | Routed in company dashboard and job route groups. |
| Admin dashboard/moderation/trust/AI/audit/translation/notification/subscription/resource CRUD | Mounted. |
| Campus student verification, campus dashboard/events/opportunities/applications | Routed. |
| University admin dashboard/students/passports/verifications/analytics/reports/opportunities | Routed. |
| Career Passport get/update/share/score refresh | Routed and service-backed. |
| AI safe suggestions/logging/usage limits | Routed and service-backed. |
| Trust score/report/admin moderation | Routed and service-backed. |
| Notification inbox/read/device token persistence | Routed and service-backed. |
| Analytics track/list/admin reports | Routed. |

### Partial or Missing Workflow Coverage

| Gap | Why it matters |
|---|---|
| AI output persistence is partial | AI can generate safe suggestions, but generated job drafts, CV rewrites, shortlist results, hiring messages, and translations are not consistently persisted into the final domain records by the AI API itself. |
| Translation lifecycle is incomplete | Translation persistence exists, but approved translations are not clearly consumed by all job/CV read endpoints. |
| Campus event/content management is thin | Mobile reads and registration exist, but admin-style CRUD for campus events/content/resources is limited or static/code-backed. |
| University team/member management is missing | University context exists, but there is no clear university equivalent of company member invite/management APIs. |
| Trust document request workflow is incomplete | Admin can request documents, but a company-facing response/upload route was not found. |
| Support handling is company-facing only | Company support tickets exist, but no clear admin support assignment/status workflow stood out. |
| Newer operational records are not all admin-manageable | Examples include career passports, student verifications, university memberships, support tickets, invoices, AI requests/limits, analytics events, and content translations. |

## 6. Web and Mobile API Wiring

Static API path comparison found:

| Metric | Count |
|---|---:|
| Total frontend/mobile API references checked | 400 |
| References matching mounted backend paths | 385 |
| Potential missing references | 15 |

### Web

No obvious hard 404s were found in the centralized web API wiring. The web client is mainly centralized in `web/src/shared/api.ts`, and its seeker, company, campus, and admin calls map to mounted route families.

### Mobile

The only concrete path mismatch found was a set of legacy fallback paths in `mobile/lib/src/features/dashboard/seeker_dashboard_service.dart`.

These paths are not mounted by the backend:

| Missing fallback family |
|---|
| `/employee/v1/applications` |
| `/employee/v1/applications/:id` |
| `/employee/v1/applications/:id/cancel` |
| `/employee/v1/applications/:id/messages` |
| `/employee/v1/applications/interviews` |
| `/employee/v1/applications/interviews/:id/respond` |
| `/employee/v1/applications/offers` |
| `/employee/v1/applications/offers/:id/respond` |
| `/employee/v1/companies` |
| `/employee/v1/companies/:id` |
| `/employee/v1/companies/:id/review` |
| `/employee/v1/jobs/:id/apply` |
| `/employee/v1/jobs/:id/rate` |
| `/employee/v1/jobs/:id/review` |
| `/employee/v1/jobs/:id/save` |

These are usually not user-visible because valid primary paths are tried first, such as `/user/v1/applying-job/...` and `/employee/v1/global/...`. Still, they should be cleaned up before launch by either:

1. Removing the dead legacy fallbacks from mobile, or
2. Adding explicit backend aliases if backward compatibility is required.

## 7. Auth, Permission, and Security Notes

| Finding | Risk |
|---|---|
| Dashboard authorization is broad | `/dash/v1` is protected by admin middleware, but many generic resource routes do not have fine per-route permission checks. |
| Active context is server-mutated | Web/mobile rely on active context state instead of sending a per-request context header. This can cause confusion across sessions/devices and needs runtime testing. |
| Public generated CV PDF route | `/cv/generated/:fileName` is public with filename validation, but generated names should be unguessable and expiry/access rules should be reviewed. |
| Public uploads route | `/uploads` is intentionally public; file naming, MIME validation, and private document separation should be checked. |
| Health secret can be passed in query string | Secrets in query strings can leak through logs/referrers; prefer header-based secret checks. |
| Cross-account access is not sufficiently tested | Guards exist, but there is not enough automated runtime testing for company/university/student scoping and IDOR protection. |
| Web logout does not call backend logout | Client clears local state, but server refresh/session state may remain active. |

## 8. Backend/Test Coverage Assessment

Current checks are useful, but they mostly verify source structure, imports, route declarations, and contract presence. They do not fully prove live behavior.

### Covered Well

| Area | Coverage type |
|---|---|
| Secrets/imports/syntax | Scripted checks |
| Express smoke import/HTTP/CORS | Smoke scripts |
| AI route contracts/safety outputs | Source and behavior-level scripts |
| Trust/analytics/notifications/translations/admin operations/Career Passport | Route/source contract scripts |
| Mobile/backend route inventory | Static route reference checks |
| Flutter service tests | Client path/header/body behavior |
| Web build | Production build passes |

### Major Test Gaps

| Missing test type | Examples |
|---|---|
| Supertest/API integration suite | Real HTTP tests against seeded users, roles, companies, universities, and students. |
| Negative authorization tests | Wrong role, missing permission, inactive context, cross-company, cross-university, cross-student access. |
| Mutation side-effect tests | Apply/save/report, campus verification, event registration, trust moderation, ATS/interviews/invitations, subscriptions, support, members. |
| Upload/download security tests | MIME, size, path traversal, private file leakage, generated CV access. |
| Web API contract tests | Ensure `web/src/shared/api.ts` paths, headers, auth scopes, and error handling stay aligned with backend. |
| Browser click-through QA | Needed for the web portals, especially admin/company/campus dashboards. |

## 9. Verification Commands Run

The following checks passed locally during this audit:

```bash
npm run check:syntax
npm run check:imports
npm run test:ai-safety
npm run test:global-launch-contract
npm run test:trust-routes
npm run test:notification-routes
npm run test:analytics-routes
npm run test:translation-routes
npm run test:career-passport
npm run test:mobile-routes
npm run test:admin-operations-routes
npm --prefix web run build
```

The following were not run as part of this pass:

| Not run | Reason |
|---|---|
| Full live deployment probes | Requires a live configured deployment and credentials. |
| Full authenticated browser click-through | Previous local browser automation had Windows process/sandbox issues. |
| Flutter full test suite/build | This audit focused on backend/API wiring, not mobile release packaging. |
| Real database mutation integration tests | A dedicated seeded integration harness is still needed. |

## 10. Recommended Next Actions Before Next Feature Implementation

| Priority | Action |
|---|---|
| P0 | Add a seeded backend integration test harness using Supertest or equivalent. |
| P0 | Test auth and account isolation: seeker/company/university/admin roles, active context, cross-company, cross-university, cross-student access. |
| P0 | Decide what to do with the 15 legacy mobile fallback routes: remove them from mobile or add backend aliases. |
| P1 | Add mutation tests for applications, job save/apply/review, campus verification, event registration, trust moderation, company ATS/interviews, support, members, and subscriptions. |
| P1 | Add upload/download security tests for CVs, company files, exports, and generated PDFs. |
| P1 | Add admin APIs or admin UI coverage for newer records: student verifications, university memberships, career passports, support tickets, invoices, AI requests/limits, analytics events, content translations. |
| P1 | Complete AI persistence workflows where product expects generated content to become real saved records. |
| P1 | Complete translation publish/read workflow so approved translations are returned in job/CV APIs. |
| P2 | Replace health-check query secret with header-based auth. |
| P2 | Add backend logout/session invalidation and call it from web/mobile logout. |

## 11. Final Audit Position

The backend/API is substantially wired and usable as a foundation. The main route families are mounted, the web client is aligned, and the current contract/build checks pass.

The project should not yet be treated as fully launch-proven until the runtime integration test layer is added and the known partial workflows are resolved. The safest next engineering step is not more UI work first; it is to lock the backend with seeded API tests so future ChatGPT/Claude/Codex implementation work cannot silently break auth, permissions, account scoping, or important mutations.
