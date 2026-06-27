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
| Seeded auth/context integration coverage | Runtime MongoDB integration coverage now includes missing/malformed token, seeker, student/campus, approved company, pending company, university admin, dashboard admin, cross-role denial, cross-company context denial, suspended context denial, invalid context id, and refresh-token revocation. | `scripts/verifyAuthContextIntegration.js` |
| Dashboard admin audit logging | Dashboard admin login failure, login success, and admin creation now write audit logs, with a seeded runtime test proving stable failure reason keys and no password storage in audit metadata. | `npm run test:audit-logging`, `controllers/dash/authController.js`, `scripts/verifyAuditLoggingIntegration.js` |
| Company file/export audit logging | Company dashboard profile file downloads, app company request file downloads, single application CV downloads, bulk CV ZIP exports, and application exports now write audit logs, with a seeded runtime test also proving path traversal and cross-company app file access are rejected safely. | `npm run test:file-export-audit`, `controllers/app/Company/CreateCompanyController.js`, `controllers/companyDash/companyWithJobs/companyJobHiringController.js`, `controllers/companyDash/information/companyInformationController.js` |
| Object-level authorization coverage | Seeded runtime coverage now proves company A cannot read or mutate company B jobs/applications, university admin A cannot list or approve university B verifications, student A cannot read/message/cancel student B campus applications or event registrations, denied attempts do not mutate target records, and allowed owner/student/admin actions still work. | `npm run test:object-authorization`, `scripts/verifyObjectAuthorizationIntegration.js` |
| Private upload static serving | Direct public access to `uploads/files/*` is blocked, non-image public uploads are served as attachments, and company file serializers now point to authenticated download endpoints instead of public file URLs. | `npm run test:security-http`, `app.js`, `docs/architecture/FILES_CONTRACT.md` |
| AI runtime integration coverage | Seeded runtime coverage now proves disabled AI requests are persisted/audited as blocked, enabled mock AI requests complete for employee and company contexts, cached results are reused, daily limits fail closed, analytics are written, and wrong-role company AI attempts do not create AI records. | `npm run test:integration:ai-runtime`, `scripts/verifyAiRuntimeIntegration.js` |
| Notification runtime integration coverage | Seeded runtime coverage now proves notification list/unread/read flows are scoped to the authenticated user and device-token create/update/conflict/revoke paths enforce ownership. | `npm run test:integration:notifications`, `scripts/verifyNotificationRuntimeIntegration.js` |
| Analytics runtime integration coverage | Seeded runtime coverage now proves analytics event tracking, group validation, user-owned event listing, super-admin platform reports, university-scoped admin reports, and borrowed-context denial. | `npm run test:integration:analytics`, `scripts/verifyAnalyticsRuntimeIntegration.js` |
| Subscription/billing runtime integration coverage | Seeded runtime coverage now proves billing permission checks, own-company invoice list/detail, cross-company invoice denial, plan-change ticket audit logging, dashboard-admin subscription reads, free-plan seeding, plan reassignment, and missing-plan failure behavior. | `npm run test:integration:subscriptions`, `scripts/verifySubscriptionBillingIntegration.js` |
| Admin resource redaction coverage | Generic dashboard resource responses now redact user secret/device fields, raw FCM token/device identifiers, and populated user secrets after list/get/create/update paths. | `npm run test:integration:admin-resources`, `scripts/verifyAdminResourceRedactionIntegration.js` |
| Employee saved-CV download coverage | Seeded runtime coverage now proves saved CV downloads require auth, are scoped to the owning employee, reject invalid IDs, reject unsafe stored paths, and return clear missing-file errors. | `npm run test:integration:employee-cv-downloads`, `scripts/verifyEmployeeCvDownloadIntegration.js` |
| Audit-log privacy redaction | Audit writes now centrally redact secret-bearing fields from old/new values and metadata, truncate oversized note/string content, preserve ObjectIds, and avoid raw binary storage. | `npm run test:audit-logging`, `services/auditLog.service.js` |

## Checks Run

```bash
npm run test:security-http
npm run test:audit-logging
npm run test:file-export-audit
npm run test:integration:ai-runtime
npm run test:integration:notifications
npm run test:integration:analytics
npm run test:integration:subscriptions
npm run test:integration:admin-resources
npm run test:integration:employee-cv-downloads
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

The project still needs the larger runtime integration suite from the backend audit: broader mutation side effects, remaining admin-boundary object checks, remaining campus/university/admin audit-log assertions, protected download coverage for every private file route, any future external payment-provider callbacks, and full web/mobile end-to-end API flow coverage. AI, notifications, analytics, subscription/billing, admin resource redaction, employee saved-CV downloads, and audit-log secret redaction now have seeded runtime coverage for their core request/report paths.
