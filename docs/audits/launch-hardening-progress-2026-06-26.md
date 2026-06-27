# Launch Hardening Progress - 2026-06-26

Branch: `flutter-seeker-campus`

## Completed In This Pass

| Area | Result | Evidence |
| --- | --- | --- |
| Legacy mobile fallback API paths | Confirmed supported by backend compatibility routes instead of dead 404 fallbacks. | `npm run test:mobile-routes` verifies 297 mobile method/path checks, including `/employee/v1/...` compatibility aliases. |
| Web logout/session invalidation | Web sign-out now stores refresh tokens and calls backend logout before clearing local tokens. | `web/src/shared/api.ts`, `web/src/shared/workflows.tsx` |
| Company backend logout | Added `/company/v1/auth/logout` so company portal sessions can revoke refresh tokens. | `routesCompany/authRoute.js`, `controllers/companyDash/Auth/loginController.js` |
| User logout robustness | `/user/v1/auth/logout` no longer requires a valid access token and accepts `refreshToken`, `refresh_token`, or `x-refresh-token`. | `routesUser/AuthRote.js`, `controllers/app/Auth/LoginController.js` |
| Admin logout robustness | `/dash/v1/auth/logout` now rejects missing refresh tokens instead of returning success while clearing nothing. | `controllers/dash/authController.js` |
| Logout security contract | HTTP contract now proves user, company, and admin logout reject missing refresh tokens. | `npm run test:security-http` |
| Explicit account-context safety | `X-Active-Context-Id` now fails closed when malformed, owned by another user, suspended, or removed instead of silently falling back to the default context. | `services/accountContext.service.js`, `npm run test:integration:auth-context` |
| Approved company route guard | Company dashboard/helper/jobs/campus APIs now require both a company context and an approved company account. Pending company accounts are blocked from approved dashboard APIs. | `routesCompany/index.js`, `npm run test:integration:auth-context` |
| Seeded auth/context integration coverage | Runtime MongoDB integration coverage now includes missing/malformed/expired app and admin tokens, inactive app-user denial, seeker, student/campus, approved company, pending company, university admin, dashboard admin, cross-role denial, cross-company context denial, suspended context denial, invalid context id, and refresh-token revocation. | `scripts/verifyAuthContextIntegration.js` |
| Dashboard admin audit logging | Dashboard admin login failure, login success, and admin creation now write audit logs, with a seeded runtime test proving stable failure reason keys and no password storage in audit metadata. | `npm run test:audit-logging`, `controllers/dash/authController.js`, `scripts/verifyAuditLoggingIntegration.js` |
| Company file/export audit logging | Company dashboard profile file downloads, app company request file downloads, single application CV downloads, bulk CV ZIP exports, and application exports now write audit logs, with a seeded runtime test also proving path traversal and cross-company app file access are rejected safely. | `npm run test:file-export-audit`, `controllers/app/Company/CreateCompanyController.js`, `controllers/companyDash/companyWithJobs/companyJobHiringController.js`, `controllers/companyDash/information/companyInformationController.js` |
| Object-level authorization coverage | Seeded runtime coverage now proves company A cannot read or mutate company B jobs/applications, university admin A cannot list or approve university B verifications, student A cannot read/message/cancel student B campus applications or event registrations, denied attempts do not mutate target records, and allowed owner/student/admin actions still work. | `npm run test:object-authorization`, `scripts/verifyObjectAuthorizationIntegration.js` |
| Private upload and generated-CV serving | Direct public access to `uploads/files/*` is blocked, non-image public uploads are served as attachments, generated CV downloads are `no-store` PDF attachments, and company file serializers now point to authenticated download endpoints instead of public file URLs. | `npm run test:security-http`, `app.js`, `docs/architecture/FILES_CONTRACT.md` |
| AI runtime integration coverage | Seeded runtime coverage now proves disabled AI requests are persisted/audited as blocked, enabled mock AI requests complete for employee and company contexts, cached results are reused, daily limits fail closed, analytics are written, and wrong-role company AI attempts do not create AI records. | `npm run test:integration:ai-runtime`, `scripts/verifyAiRuntimeIntegration.js` |
| Notification runtime integration coverage | Seeded runtime coverage now proves notification list/unread/read flows are scoped to the authenticated user, preferences can be read/updated through current and legacy routes, disabled categories/channels are enforced by `notifyUser`, admin send requires `notifications.manage`, admin sends are audited, and device-token create/update/conflict/revoke paths enforce ownership. | `npm run test:integration:notifications`, `scripts/verifyNotificationRuntimeIntegration.js` |
| Analytics runtime integration coverage | Seeded runtime coverage now proves analytics event tracking, group validation, user-owned event listing, super-admin platform reports, university-scoped admin reports, and borrowed-context denial. | `npm run test:integration:analytics`, `scripts/verifyAnalyticsRuntimeIntegration.js` |
| Subscription/billing runtime integration coverage | Seeded runtime coverage now proves billing permission checks, own-company invoice list/detail, cross-company invoice denial, plan-change ticket audit logging, dashboard-admin subscription reads, free-plan seeding, plan reassignment, and missing-plan failure behavior. | `npm run test:integration:subscriptions`, `scripts/verifySubscriptionBillingIntegration.js` |
| Company member permission-boundary coverage | Seeded runtime coverage now proves company owner wildcard access, member `ats.view` allow, missing `jobs.manage`/`billing.manage` denial, and suspended company member denial. | `npm run test:integration:company-permissions`, `scripts/verifyCompanyPermissionIntegration.js` |
| Admin permission-boundary coverage | Fine-grained dashboard permissions now guard generic resource aliases, generic `/resources/:resource` routes, dashboard summaries, search, AI admin, operations logs, moderation, trust, subscriptions, campus university admin endpoints, and protected dashboard file downloads. Seeded runtime coverage proves super-admin bypass, limited-admin allow/deny, static/generic resource behavior, `files.read` PDF downloads, and blocked unsafe extensions. | `npm run test:integration:admin-permissions`, `scripts/verifyAdminPermissionIntegration.js` |
| Admin support workflow coverage | Dashboard support ticket list/detail/status/reply endpoints now exist with `support.view` and `support.manage` boundaries, operations aliases, assignment/closure fields, admin replies, and audit logging. | `npm run test:integration:admin-support`, `scripts/verifyAdminSupportIntegration.js` |
| Translation read workflow coverage | Job and CV translation save/read/approval routes now have seeded runtime coverage for draft review, approved `published_translation` output, unsupported-language rejection, owning-context access, cross-company denial, audit logging, and analytics. | `npm run test:integration:translations`, `scripts/verifyTranslationWorkflowIntegration.js` |
| Admin resource redaction and mutation audit coverage | Generic dashboard resource responses now redact user secret/device fields, raw FCM token/device identifiers, and populated user secrets after list/get/create/update paths. Generic bulk-update is wired for new dashboard screens, and create/update/delete/bulk/approve/reject mutations now write central audit rows. | `npm run test:integration:admin-resources`, `scripts/verifyAdminResourceRedactionIntegration.js` |
| Employee saved-CV download coverage | Seeded runtime coverage now proves saved CV downloads require auth, are scoped to the owning employee, reject invalid IDs, reject unsafe stored paths, and return clear missing-file errors. | `npm run test:integration:employee-cv-downloads`, `scripts/verifyEmployeeCvDownloadIntegration.js` |
| Job seeker mutation workflow coverage | Seeded runtime coverage now proves save/unsave, modern toggle save, rate, review, internal apply, duplicate apply denial, external apply, duplicate external apply handling, job reports, counters, search score signals, audit rows, analytics rows, and trust report recomputation. Duplicate internal application checks now exist in the controllers, not only in database indexes. | `npm run test:integration:job-mutations`, `scripts/verifyJobMutationWorkflowIntegration.js` |
| ATS/interview/invitation workflow coverage | Seeded runtime coverage now proves company interview schedule/reschedule/complete, cross-company denial, candidate interview response ownership, scorecard persistence, invitation resend without usage overcounting, invitation acceptance creating an application, invitation cancellation, audit rows, analytics rows, and subscription usage counters. | `npm run test:integration:hiring-workflows`, `scripts/verifyHiringWorkflowIntegration.js` |
| Campus/university workflow coverage | Seeded runtime coverage now proves student-only campus access, event register/cancel idempotency, campus opportunity save/apply side effects, cross-university verification denial, student verification request-info/resubmit/approval, university dashboard counts, university opportunity request audit logging, and CSV outcome report headers. | `npm run test:integration:campus-workflows`, `scripts/verifyCampusWorkflowIntegration.js` |
| Audit-log privacy redaction | Audit writes now centrally redact secret-bearing fields from old/new values and metadata, truncate oversized note/string content, preserve ObjectIds, and avoid raw binary storage. | `npm run test:audit-logging`, `services/auditLog.service.js` |
| Backend route ownership documentation | Current route ownership, compatibility alias policy, controller/service/model boundaries, and admin resource policy are documented for future cleanup. | `docs/architecture/BACKEND_MODULE_MAP.md` |

## Checks Run

```bash
npm run test:security-http
npm run test:audit-logging
npm run test:file-export-audit
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
npm run test:integration:job-mutations
npm run test:integration:hiring-workflows
npm run test:integration:campus-workflows
npm run test:audit-logging
npm run test:object-authorization
npm run test:integration:auth-context
npm run test:mobile-routes
npm run check:syntax
npm run check:imports
npm run check:i18n
npm --prefix web run build
```

## Remaining From Backend/API Audit

The project still needs the larger runtime integration suite from the backend audit: remaining non-admin mutation side effects, remaining admin audit-log assertions, protected download coverage for every private file route, any future external payment-provider callbacks, route-by-route schemas/validators, and full web/mobile end-to-end API flow coverage. AI, notifications including preferences/admin-send, analytics, subscription/billing, company member permissions, admin permission boundaries, admin support workflows, translation save/read/approval, admin resource redaction/mutation audits, employee saved-CV downloads, job seeker mutation workflows, ATS/interview/invitation workflows, campus/university workflows, and audit-log secret redaction now have seeded runtime coverage for their core request/report paths.
