# Hala Job Backend and API Wiring Audit

Date: 2026-06-26
Last updated: 2026-06-27
Branch audited: `flutter-seeker-campus`
Repository: `joseph2820212-maker/halajobe`

## 1. Executive Verdict

The backend is broadly mounted, the main web API client is wired to existing backend routes, and the current source-level route contract checks pass. The project is no longer in a state where the main problem is "missing route files" for the core product areas.

However, it is not yet safe to say every backend function is fully proven end-to-end. The biggest remaining gap is now narrower than the original audit: route mounting, guard classification, mobile fallback aliases, core auth/context, object authorization, file-export success and invalid-selection behavior, AI, notification preferences/admin send, analytics, subscription/billing, company member permissions, company member lifecycle/context sync, university member lifecycle/context sync, dashboard admin permission boundaries, protected dashboard file downloads, admin support workflow, translation save/read/approval, admin-resource lifecycle, job seeker mutation side effects, ATS/interview/invitation workflows, campus/university workflows, audit redaction, and employee-CV download paths have seeded or contract coverage. The remaining risk is deeper per-feature behavior: exact request/response schemas, per-route validators, live deployed smoke testing, remaining private download/upload edge cases, production support-role staffing, and full web/mobile user journeys.

## 1.1 Current 2026-06-27 Endpoint Inventory Update

The live Express route inventory was regenerated after the admin support ticket workflow, translation read workflow, notification preferences, and admin notification send workflow were wired.

| Metric | Current evidence |
|---|---:|
| Raw Express endpoint entries | 2141 |
| Unique method/path endpoints | 3384 |
| Endpoints with detected auth/role guard | 3295 |
| Known public/system endpoints | 89 |
| Unguarded endpoints needing manual classification | 0 |

Current generated artifacts:

| Artifact | Status |
|---|---|
| `docs/api/HALAJOB_ROUTE_INVENTORY.json` | Regenerated from the live Express app. |
| `docs/api/ROUTE_VERIFICATION_REPORT.md` | Regenerated; zero unclassified unguarded endpoints. |
| `docs/api/HALAJOB_API_REFERENCE.md` | Route/auth skeleton regenerated. |
| `docs/api/HALAJOB_OPENAPI.yaml` | Generated skeleton exists; exact schemas still need expansion. |
| `docs/api/HALAJOB_POSTMAN_COLLECTION.json` | Generated collection exists; endpoint-specific request bodies still need expansion. |
| `docs/architecture/BACKEND_MODULE_MAP.md` | Route ownership, compatibility alias policy, controller/service/model boundaries, and admin resource policy documented. |

## 2. Readiness Scores

| Area | Score / 10 | Meaning |
|---|---:|---|
| Backend route mounting | 9 | Core route groups are mounted across seeker, company, admin, campus, university, AI, trust, analytics, notifications, jobs, and health; current route report has zero unclassified unguarded endpoints. |
| Web API wiring | 8 | No obvious hard 404s found in the centralized web API client against mounted backend route families; browser click-through remains separate. |
| Mobile API wiring | 8.5 | Legacy mobile fallback aliases are now covered by `npm run test:mobile-routes`, including older `/employee/v1/...` compatibility paths. |
| Feature API coverage | 8.78 | Most major product areas have APIs, and the core hardening harness now covers auth/context, object authorization, trust, AI, notification preferences/admin send, analytics, subscriptions, company/admin permissions, company member lifecycle/context sync, university member lifecycle/context sync, student verification document privacy, translation save/read/approval, job seeker mutations, ATS/interview/invitation workflows, campus/university workflows, admin resources, file exports including invalid explicit selections/formats, and employee CV downloads. Some workflows remain partial. |
| Auth and account-context safety | 8.72 | Seeded auth/context integration now covers missing/malformed/expired app and admin tokens, inactive app-user denial, role/context denial, cross-role borrowing, suspended and removed explicit contexts, removed active-context selection denial, invalid context, and refresh-token revocation. |
| Admin operational coverage | 8.42 | Admin resources are broad, redacted, lifecycle-audited, and now guarded by fine-grained permissions on generic resources plus high-risk operation/file/support/notification-send routes. Support-ticket policy now proves read-only support agents can read but not mutate, while support managers can read queue/detail plus update/reply/close. Remaining risk is newer workflow-specific admin handling and production support-role staffing. |
| Automated backend test depth | 8.51 | Static checks plus multiple seeded runtime integration harnesses exist, including high-risk auth/context negative cases, company/university member lifecycle/context sync, student verification document privacy, company export rejection behavior, seeker job mutations, ATS/interview/invitation workflows, and campus/university workflows; still short of route-by-route validator/schema and full journey coverage. |
| Launch confidence from backend/API only | 8.68 | Stronger than the original audit, but not yet a 9+ launch certificate until remaining edge-case and live-smoke gaps are closed. |

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
| `/jobs/v1` | Job translation read/write routes | Mounted |
| `/ai/v1` | Employee/company/admin AI routes with safety wrappers and logging | Mounted |
| `/analytics/v1` | Analytics tracking and admin analytics | Mounted |
| `/trust/v1` | Job trust score/report routes | Mounted |
| `/admin/v1/trust` | Trust moderation/admin queue | Mounted |
| `/notifications/v1` | Notification inbox/preferences/device APIs | Mounted |
| `/campus/v1` | Campus mobile dashboard/events/opportunities/applications | Mounted |
| `/university/v1` | University admin dashboard, students, passports, verification, reports | Mounted |
| `/health` | Health check | Mounted |
| `/user/v1` | App/public user API, auth, jobs, applications, campus, notifications, career passport, CV translation read/write routes | Mounted |

Generated inventory summary:

| Namespace | Method count |
|---|---:|
| `/dash/v1` | 2882 |
| `/user/v1` | 198 |
| `/company/v1` | 134 |
| `/employee/v1` | 94 |
| `/university/v1` | 15 |
| `/notifications/v1` | 16 |
| `/campus/v1` | 12 |
| `/ai/v1` | 12 |
| `/admin/v1` | 7 |
| `/analytics/v1` | 5 |
| `/trust/v1` | 4 |
| `/jobs/v1` | 2 |
| `/health` | 1 |
| `/cv/generated` | 1 |

The high `/dash/v1` count is mainly from broad generic dashboard CRUD aliases. The current module-level route report counts `2889` Admin endpoints because it also includes admin-mounted trust routes.

## 5. Feature Coverage Findings

### Implemented and Routed

| Product area | Current status |
|---|---|
| Job seeker profile/dashboard | Routed and controller-backed. |
| Job browse/recommend/save/apply/rate/review | Routed, controller-backed, and seeded-tested for key seeker mutation side effects. |
| Applications, interviews, offers, messages | Routed under seeker/employee APIs. |
| Company browse and reviews | Routed under employee/global routes. |
| CV upload, templates, generation, download | Routed and controller-backed. |
| Company dashboard/profile/files/billing/jobs | Routed and controller-backed. |
| Company ATS/interviews/audit/question library/templates/support/members/analytics | Routed in company dashboard and job route groups, with seeded workflow coverage for interview scheduling/reschedule/completion, candidate responses, invitation resend/accept/cancel, usage counters, audit logs, and analytics. |
| Admin dashboard/moderation/trust/AI/audit/translation/notification/subscription/resource CRUD | Mounted. |
| Campus student verification, campus dashboard/events/opportunities/applications | Routed, with seeded workflow coverage for student access, event lifecycle, opportunity save/apply, verification submission/review, and private verification document upload/download. |
| University admin dashboard/students/passports/verifications/analytics/reports/opportunities | Routed, with seeded workflow coverage for verification review, dashboard counts, opportunity requests, and CSV outcome export. |
| Career Passport get/update/share/score refresh | Routed and service-backed. |
| AI safe suggestions/logging/usage limits | Routed and service-backed. |
| Trust score/report/admin moderation | Routed and service-backed. |
| Notification inbox/read/preferences/admin-send/device token persistence | Routed and service-backed. |
| Analytics track/list/admin reports | Routed. |

### Partial or Missing Workflow Coverage

| Gap | Why it matters |
|---|---|
| AI output persistence is partial | AI can generate safe suggestions, but generated job drafts, CV rewrites, shortlist results, hiring messages, and translations are not consistently persisted into the final domain records by the AI API itself. |
| Translation consumption still needs UI/product QA | Job/CV translation save, owner-scoped read, draft review, approval, audit logging, and analytics now have seeded runtime coverage, but all consuming job/CV screens still need QA to confirm approved translations display exactly where intended. |
| Campus event/content management is thin | Mobile reads, registration, cancellation, and lifecycle side effects now have seeded coverage, but admin-style CRUD for campus events/content/resources is limited or static/code-backed. |
| University team/member management now has an app API baseline | `/university/v1/members` and `/campus/v1/admin/members` now support scoped list/create/update/remove with role-based university permissions, account-context sync, cross-university denial, last-owner protection, and audit logs. Remaining work is web/mobile UI consumption and richer staffing policy. |
| Trust document request workflow was originally incomplete | This has since been improved with company-facing trust document response routes and seeded integration coverage. Public HTTPS evidence links now reject private/internal hosts, link-local metadata addresses, and embedded credentials. Remaining work is full UI flow QA and direct file-upload policy if trust evidence uploads are later added. |
| Support handling now has an admin baseline | Company support tickets now have dashboard queue/detail/status/reply endpoints with `support.view` and `support.manage`, assignment/closure fields, and audit logs. `support.manage` now includes support queue/detail reads for supervisors, while `support.view` remains read-only. Remaining work is admin UI click-through and production support-role staffing. |
| Newer operational records are not all admin-manageable | Examples include career passports, invoices, AI requests/limits, analytics events, and content translations. Support tickets, university memberships, and admin notification sending now have explicit workflow routes. |

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

These paths were not mounted by the backend during the original audit:

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

Current status: explicit backend compatibility aliases have since been added and are covered by `npm run test:mobile-routes`, which verifies the mobile/campus route contract. Long-term cleanup can still remove compatibility aliases once the mobile app no longer needs them.

## 7. Auth, Permission, and Security Notes

| Finding | Risk |
|---|---|
| Dashboard authorization is now permission-scoped for high-risk surfaces | `/dash/v1` still starts with dashboard-session auth, but generic resource aliases, generic `/resources/:resource` routes, AI/admin operations, moderation, trust, subscriptions, support tickets, notification sending, campus university admin endpoints, dashboard summaries, search, and protected dashboard file downloads now enforce fine-grained permission keys. Remaining work is route-by-route policy documentation, production support-role staffing, and any future admin feature routes. |
| Active context requires careful handling | Explicit context safety now fails closed for malformed, wrong-user, suspended, or removed contexts, and seeded tests cover context denial cases. Per-request context UX and multi-device behavior should still be validated through app/web journeys. |
| Public generated CV PDF route | `/cv/generated/:fileName` keeps filename validation, traversal rejection, attachment disposition, `nosniff`, and `no-store`; newly generated DB-backed CV records now require a valid temporary public token and expiry, while authenticated owners can use `/employee/v1/cv/download/:cvId`. |
| Public uploads route | `/uploads/files/*` is now blocked from public static serving, non-image root uploads are forced to attachment, student verification documents are moved into private storage with scoped download routes, trust evidence accepts only public HTTPS links rather than public upload paths, and dashboard protected file downloads require `files.read`, allow image/PDF extensions only, and serve PDFs as attachment/no-store/nosniff. Company request files, student verification documents, and CV uploads now have seeded MIME-mismatch and oversize rejection coverage. Remaining work is route-by-route MIME/size/private download coverage for the remaining file families. |
| Health secret query string | Fixed: health secrets must use the `x-health-secret` header. |
| Cross-account access | Seeded object-authorization coverage now exists for company, university, and campus student object-scope cases. Expired app/admin token denial, inactive app-user denial, company member permission denial, dashboard admin permission denial, and support view/manage role boundaries are covered. Remaining work is broader workflow side-effect coverage and production support-role staffing. |
| Logout/session invalidation | Improved: user, company, and admin logout behavior now has backend handling and security-contract checks; web logout calls backend before clearing local state. |

## 8. Backend/Test Coverage Assessment

Current checks are useful and now include multiple seeded runtime integration harnesses. They still do not fully prove every live business journey or every request/response schema.

### Covered Well

| Area | Coverage type |
|---|---|
| Secrets/imports/syntax | Scripted checks |
| Express smoke import/HTTP/CORS | Smoke scripts |
| AI route contracts/safety outputs | Source and behavior-level scripts |
| Trust/analytics/notifications/translations/admin operations/Career Passport | Route/source contract scripts plus selected runtime coverage for trust, analytics, notification preferences/admin send, and translation save/read/approval |
| Mobile/backend route inventory | Static route reference checks plus compatibility aliases for older mobile fallbacks |
| Auth/context/object authorization | Seeded runtime MongoDB integration |
| File export/private employee CV downloads | Seeded runtime MongoDB integration |
| Admin resource redaction/lifecycle audit | Seeded runtime MongoDB integration |
| Subscription/billing lifecycle | Seeded runtime MongoDB integration |
| Flutter service tests | Client path/header/body behavior |
| Web build | Production build passes |

### Major Test Gaps

| Missing test type | Examples |
|---|---|
| Full journey API integration suite | Real HTTP tests now exist for several core areas, but not for every product journey from login to completion. |
| Negative authorization tests | Baseline exists for wrong role, context borrowing, suspended/removed explicit contexts, removed active-context selection denial, expired access tokens, inactive app users, support-ticket view/manage boundaries, company member missing-permission cases, dashboard admin missing-permission cases, company/university/student IDOR, and revoked refresh sessions; remaining gaps include uncommon inactive-context permutations, production support-role staffing, and workflow-specific side effects. |
| Mutation side-effect tests | Coverage exists for several object-scope, support, translation approval, company member create/promote/remove, job seeker save/apply/rate/review/report, ATS/interview/invitation, campus event/opportunity/verification, and admin-resource mutations; still needed for richer campus admin content and all UI consumption of approved translations. |
| Upload/download security tests | Company files, dashboard protected files, saved employee CV downloads, generated-CV safety headers/token-expiry policy, high-risk upload MIME/size rejection, and trust evidence public-URL validation are covered; still needed for export files, remaining upload endpoints, all remaining private file routes, and direct trust evidence file uploads if that product path is introduced. |
| Web API contract tests | Ensure `web/src/shared/api.ts` paths, headers, auth scopes, and error handling stay aligned with backend. |
| Browser click-through QA | Needed for the web portals, especially admin/company/campus dashboards. |

## 9. Verification Commands Run

The following checks passed locally during this audit:

```bash
npm run check:syntax
npm run check:imports
npm run smoke:http
npm run test:security-http
npm run test:integration:student-verification-documents
npm run test:audit-logging
npm run test:file-export-audit
npm run test:integration:auth-context
npm run test:integration:trust-documents
npm run test:integration:ai-runtime
npm run test:integration:notifications
npm run test:integration:analytics
npm run test:integration:subscriptions
npm run test:integration:company-permissions
npm run test:integration:company-members
npm run test:integration:university-members
npm run test:integration:admin-permissions
npm run test:integration:admin-support
npm run test:integration:translations
npm run test:integration:admin-resources
npm run test:integration:employee-cv-downloads
npm run test:integration:job-mutations
npm run test:integration:hiring-workflows
npm run test:integration:campus-workflows
npm run test:object-authorization
npm run test:ai-safety
npm run test:global-launch-contract
npm run test:trust-routes
npm run test:notification-routes
npm run test:analytics-routes
npm run test:translation-routes
npm run test:career-passport
npm run test:mobile-routes
npm run test:admin-operations-routes
npm run check:secrets
npm run docs:route-report
npm run docs:api-artifacts
npm --prefix web run build
```

The following were not run as part of this pass:

| Not run | Reason |
|---|---|
| Full live deployment probes | Requires a live configured deployment and credentials. |
| Full authenticated browser click-through | Previous local browser automation had Windows process/sandbox issues. |
| Flutter full test suite/build | This audit focused on backend/API wiring, not mobile release packaging. |
| Full route-by-route schema/validator tests | Route inventory exists, but exact request/response schema validation is not complete. |

## 10. Recommended Next Actions Before Next Feature Implementation

| Priority | Action |
|---|---|
| P0 | Expand seeded backend integration from current core harnesses into remaining business journeys, workflow side effects, and production support-role staffing checks. |
| P0 | Add remaining inactive-context edge-case tests and keep new admin feature routes tied to explicit permission keys. |
| P0 | Keep mobile fallback aliases until the mobile app no longer uses them, then remove the aliases and update `npm run test:mobile-routes`. |
| P1 | Add mutation tests for richer campus admin content management, translation publishing/consumption, and any application status journeys beyond the now-covered ATS interview/invitation loop. |
| P1 | Add upload/download security tests for remaining upload endpoints, remaining private file routes, and direct trust evidence file uploads if that product path is introduced. Student verification documents now have scoped private-storage coverage and upload validation coverage, generated CV public links now enforce token/expiry for DB-backed records, covered upload families reject MIME/size failures cleanly, company export endpoints reject invalid explicit application IDs and unsupported formats without success audit rows, and trust evidence links now reject private/internal public-HTTPS bypasses. |
| P1 | Add admin APIs or admin UI coverage for newer records: career passports, invoices, AI requests/limits, analytics events, content translations. Student verification and university membership workflows now have app/API baselines. |
| P1 | Complete AI persistence workflows where product expects generated content to become real saved records. |
| P1 | Complete translation publish/read workflow so approved translations are returned in job/CV APIs. |
| P2 | Expand generated OpenAPI/Postman artifacts with exact request bodies, response examples, validators, audit events, and role matrices route by route. |

## 11. Final Audit Position

The backend/API is substantially wired and usable as a foundation. The main route families are mounted, the web client is aligned, route inventory reports zero unclassified unguarded endpoints, and the current contract/runtime/build checks pass.

The project should not yet be treated as fully launch-proven until the remaining seeded integration tests, live smoke checks, route-by-route schema documentation, production support-role staffing, and known partial workflows are resolved. The safest next engineering step is to keep tightening backend tests and endpoint documentation while UI work continues, so future ChatGPT/Claude/Codex implementation work cannot silently break auth, permissions, account scoping, or important mutations.
