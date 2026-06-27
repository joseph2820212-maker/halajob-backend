# Hala Job Backend and API Wiring Audit

Date: 2026-06-26
Last updated: 2026-06-27
Branch audited: `flutter-seeker-campus`
Repository: `joseph2820212-maker/halajobe`

## 1. Executive Verdict

The backend is broadly mounted, the main web API client is wired to existing backend routes, and the current source-level route contract checks pass. The project is no longer in a state where the main problem is "missing route files" for the core product areas.

However, it is not yet safe to say every backend function is fully proven end-to-end. The biggest remaining gap is now narrower than the original audit: route mounting, guard classification, mobile fallback aliases, core auth/context, object authorization, file-export, AI, notification, analytics, subscription/billing, company member permissions, dashboard admin permission boundaries, protected dashboard file downloads, admin support workflow, translation save/read/approval, admin-resource lifecycle, audit redaction, and employee-CV download paths have seeded or contract coverage. The remaining risk is deeper per-feature behavior: exact request/response schemas, per-route validators, live deployed smoke testing, remaining private download/upload edge cases, support-role policy, and full web/mobile user journeys.

## 1.1 Current 2026-06-27 Endpoint Inventory Update

The live Express route inventory was regenerated after the admin support ticket workflow and translation read workflow were wired.

| Metric | Current evidence |
|---|---:|
| Raw Express endpoint entries | 2135 |
| Unique method/path endpoints | 3372 |
| Endpoints with detected auth/role guard | 3283 |
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
| Feature API coverage | 8.2 | Most major product areas have APIs, and the core hardening harness now covers auth/context, object authorization, trust, AI, notifications, analytics, subscriptions, company/admin permissions, translation save/read/approval, admin resources, file exports, and employee CV downloads. Some workflows remain partial. |
| Auth and account-context safety | 8.7 | Seeded auth/context integration now covers missing/malformed/expired app and admin tokens, inactive app-user denial, role/context denial, cross-role borrowing, suspended context, invalid context, and refresh-token revocation. |
| Admin operational coverage | 8.35 | Admin resources are broad, redacted, lifecycle-audited, and now guarded by fine-grained permissions on generic resources plus high-risk operation/file/support routes; remaining risk is newer workflow-specific admin handling and support-role policy. |
| Automated backend test depth | 7.75 | Static checks plus multiple seeded runtime integration harnesses exist; still short of route-by-route validator/schema and full journey coverage. |
| Launch confidence from backend/API only | 8.2 | Stronger than the original audit, but not yet a 9+ launch certificate until remaining edge-case and live-smoke gaps are closed. |

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
| `/notifications/v1` | Notification inbox/device/admin-style notification APIs | Mounted |
| `/campus/v1` | Campus mobile dashboard/events/opportunities/applications | Mounted |
| `/university/v1` | University admin dashboard, students, passports, verification, reports | Mounted |
| `/health` | Health check | Mounted |
| `/user/v1` | App/public user API, auth, jobs, applications, campus, notifications, career passport, CV translation read/write routes | Mounted |

Generated inventory summary:

| Namespace | Method count |
|---|---:|
| `/dash/v1` | 2879 |
| `/user/v1` | 192 |
| `/company/v1` | 134 |
| `/employee/v1` | 94 |
| `/university/v1` | 15 |
| `/notifications/v1` | 13 |
| `/campus/v1` | 12 |
| `/ai/v1` | 12 |
| `/admin/v1` | 7 |
| `/analytics/v1` | 5 |
| `/trust/v1` | 4 |
| `/jobs/v1` | 2 |
| `/health` | 1 |
| `/cv/generated` | 1 |

The high `/dash/v1` count is mainly from broad generic dashboard CRUD aliases. The current module-level route report counts `2886` Admin endpoints because it also includes admin-mounted trust routes.

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
| Translation consumption still needs UI/product QA | Job/CV translation save, owner-scoped read, draft review, approval, audit logging, and analytics now have seeded runtime coverage, but all consuming job/CV screens still need QA to confirm approved translations display exactly where intended. |
| Campus event/content management is thin | Mobile reads and registration exist, but admin-style CRUD for campus events/content/resources is limited or static/code-backed. |
| University team/member management is missing | University context exists, but there is no clear university equivalent of company member invite/management APIs. |
| Trust document request workflow was originally incomplete | This has since been improved with company-facing trust document response routes and seeded integration coverage. Remaining work is edge-case file/evidence coverage and full UI flow QA. |
| Support handling now has an admin baseline | Company support tickets now have dashboard queue/detail/status/reply endpoints with `support.view` and `support.manage`, assignment/closure fields, and audit logs. Remaining work is admin UI click-through and support-role staffing policy. |
| Newer operational records are not all admin-manageable | Examples include career passports, student verifications, university memberships, invoices, AI requests/limits, analytics events, and content translations. Support tickets now have explicit admin workflow routes. |

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
| Dashboard authorization is now permission-scoped for high-risk surfaces | `/dash/v1` still starts with dashboard-session auth, but generic resource aliases, generic `/resources/:resource` routes, AI/admin operations, moderation, trust, subscriptions, support tickets, campus university admin endpoints, dashboard summaries, search, and protected dashboard file downloads now enforce fine-grained permission keys. Remaining work is route-by-route policy documentation, support-role modelling, and any future admin feature routes. |
| Active context requires careful handling | Explicit context safety now fails closed for malformed, wrong-user, suspended, or removed contexts, and seeded tests cover context denial cases. Per-request context UX and multi-device behavior should still be validated through app/web journeys. |
| Public generated CV PDF route | `/cv/generated/:fileName` is public with filename validation, traversal rejection, attachment disposition, `nosniff`, and `no-store`; generated names should remain unguessable and expiry/access rules still need product review. |
| Public uploads route | `/uploads/files/*` is now blocked from public static serving, non-image root uploads are forced to attachment, and dashboard protected file downloads require `files.read`, allow image/PDF extensions only, and serve PDFs as attachment/no-store/nosniff. Remaining work is route-by-route MIME/size/private download coverage. |
| Health secret query string | Fixed: health secrets must use the `x-health-secret` header. |
| Cross-account access | Seeded object-authorization coverage now exists for company, university, and campus student object-scope cases. Expired app/admin token denial, inactive app-user denial, company member permission denial, and dashboard admin permission denial are covered. Remaining work is broader workflow side-effect coverage and support-role boundaries. |
| Logout/session invalidation | Improved: user, company, and admin logout behavior now has backend handling and security-contract checks; web logout calls backend before clearing local state. |

## 8. Backend/Test Coverage Assessment

Current checks are useful and now include multiple seeded runtime integration harnesses. They still do not fully prove every live business journey or every request/response schema.

### Covered Well

| Area | Coverage type |
|---|---|
| Secrets/imports/syntax | Scripted checks |
| Express smoke import/HTTP/CORS | Smoke scripts |
| AI route contracts/safety outputs | Source and behavior-level scripts |
| Trust/analytics/notifications/translations/admin operations/Career Passport | Route/source contract scripts plus selected runtime coverage for trust, analytics, notifications, and translation save/read/approval |
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
| Negative authorization tests | Baseline exists for wrong role, context borrowing, expired access tokens, inactive app users, company member missing-permission cases, dashboard admin missing-permission cases, company/university/student IDOR, and revoked refresh sessions; remaining gaps include some inactive-context permutations, support-role policy, and workflow-specific side effects. |
| Mutation side-effect tests | Coverage exists for several object-scope, support, translation approval, and admin-resource mutations; still needed for apply/save/report, event registration edge cases, ATS/interviews/invitations, members, and all UI consumption of approved translations. |
| Upload/download security tests | Company files, dashboard protected files, saved employee CV downloads, and generated-CV safety headers are covered; still needed for trust evidence files, generated CV public-link expiry/ownership policy, export files, MIME rejection, size rejection, and all remaining private file routes. |
| Web API contract tests | Ensure `web/src/shared/api.ts` paths, headers, auth scopes, and error handling stay aligned with backend. |
| Browser click-through QA | Needed for the web portals, especially admin/company/campus dashboards. |

## 9. Verification Commands Run

The following checks passed locally during this audit:

```bash
npm run check:syntax
npm run check:imports
npm run smoke:http
npm run test:security-http
npm run test:audit-logging
npm run test:file-export-audit
npm run test:integration:auth-context
npm run test:integration:trust-documents
npm run test:integration:ai-runtime
npm run test:integration:notifications
npm run test:integration:analytics
npm run test:integration:subscriptions
npm run test:integration:company-permissions
npm run test:integration:admin-permissions
npm run test:integration:admin-support
npm run test:integration:translations
npm run test:integration:admin-resources
npm run test:integration:employee-cv-downloads
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
| P0 | Expand seeded backend integration from current core harnesses into remaining business journeys, workflow side effects, and support-role boundaries. |
| P0 | Add remaining inactive-context edge-case tests and keep new admin feature routes tied to explicit permission keys. |
| P0 | Keep mobile fallback aliases until the mobile app no longer uses them, then remove the aliases and update `npm run test:mobile-routes`. |
| P1 | Add mutation tests for applications, job save/apply/review/report, campus verification edge cases, event registration edge cases, ATS/interviews/invitations, members, and translation publishing. |
| P1 | Add upload/download security tests for trust evidence files, exports, generated CV expiry/ownership policy, MIME rejection, size rejection, and remaining private file routes. |
| P1 | Add admin APIs or admin UI coverage for newer records: student verifications, university memberships, career passports, invoices, AI requests/limits, analytics events, content translations. |
| P1 | Complete AI persistence workflows where product expects generated content to become real saved records. |
| P1 | Complete translation publish/read workflow so approved translations are returned in job/CV APIs. |
| P2 | Expand generated OpenAPI/Postman artifacts with exact request bodies, response examples, validators, audit events, and role matrices route by route. |

## 11. Final Audit Position

The backend/API is substantially wired and usable as a foundation. The main route families are mounted, the web client is aligned, route inventory reports zero unclassified unguarded endpoints, and the current contract/runtime/build checks pass.

The project should not yet be treated as fully launch-proven until the remaining seeded integration tests, live smoke checks, route-by-route schema documentation, support-role policy, and known partial workflows are resolved. The safest next engineering step is to keep tightening backend tests and endpoint documentation while UI work continues, so future ChatGPT/Claude/Codex implementation work cannot silently break auth, permissions, account scoping, or important mutations.
