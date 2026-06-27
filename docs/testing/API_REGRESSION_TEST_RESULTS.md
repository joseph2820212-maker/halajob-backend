# API Regression Test Results

Date: 2026-06-27
Branch: `flutter-seeker-campus`
Commit tested: current `flutter-seeker-campus` branch state as of the latest update below.
Environment: local Codex workspace
Latest update: object authorization, private upload static-serving, trust evidence public-URL hardening, student verification document privacy, audit logging with central secret redaction, expanded company file/export audit integration coverage, employee saved-CV download coverage, AI runtime integration coverage, notification runtime/preferences/admin-send coverage, analytics runtime integration coverage, subscription/billing runtime integration coverage, company permission-boundary coverage, company member lifecycle/context-sync coverage, university member lifecycle/context-sync coverage, admin permission-boundary coverage, admin support workflow coverage, translation read/write workflow coverage, admin resource redaction/lifecycle audit coverage, job seeker mutation workflow coverage, ATS/interview/invitation workflow coverage, campus/university workflow coverage, and auth/context negative coverage added on 2026-06-27.

## Passed Commands

| Command | Result |
|---|---|
| `npm run check:secrets` | Passed |
| `npm run check:syntax` | Passed |
| `npm run check:imports` | Passed |
| `npm run check:i18n` | Passed |
| `npm run smoke:import` | Passed |
| `npm run smoke:http` | Passed |
| `npm run smoke:cors` | Passed |
| `npm run test:security-http` | Passed, including private `/uploads/files/*` static denial, generated-CV invalid/traversal rejection, and valid generated-CV attachment/no-store headers |
| `npm run test:integration:student-verification-documents` | Passed, including private student verification document storage, direct public denial, owner-only student download, university-scoped admin download, attachment/no-store/nosniff headers, and upload/download audit logs |
| `npm run test:audit-logging` | Passed, including admin auth audit rows, admin creation audit rows, and central audit redaction of password/passcode/token/secret/cookie/OTP/API-key/private-key/device-code fields |
| `npm run test:file-export-audit` | Passed, including dashboard company file download, app company request file download, traversal rejection, other-company denial, and export audit logs |
| `npm run test:integration:ai-runtime` | Passed, including disabled, completed, cached, daily-limited, employee, company, analytics, audit-log, and wrong-role AI request paths |
| `npm run test:integration:notifications` | Passed, including notification list/read ownership, preference read/update, admin-send permission denial/allow, preference enforcement, admin-send audit logs, and device-token create/update/conflict/revoke ownership |
| `npm run docs:database` | Passed, regenerated live Mongoose model documentation |
| `npm run test:integration:analytics` | Passed, including event tracking, own-event listing, group mismatch rejection, super-admin reports, university-scoped reports, cohorts, and borrowed-context denial |
| `npm run test:integration:subscriptions` | Passed, including billing permission checks, own-company invoice list/detail, cross-company invoice denial, plan-change ticket audit logging, dashboard-admin subscription reads, free-plan seeding, plan reassignment, and missing-plan failure behavior |
| `npm run test:integration:company-permissions` | Passed, including company owner wildcard access, member `ats.view` allow, missing `jobs.manage`/`billing.manage` denial, and suspended member denial |
| `npm run test:integration:company-members` | Passed, including member create/promote/remove, owner self-add denial, context sync after role changes, removed-context denial, member-managed invites, cross-company denial, and audit actor types |
| `npm run test:integration:university-members` | Passed, including university member create/promote/remove, role-based permissions, context sync after role changes, removed-context denial, campus-admin aliases, cross-university denial, last-owner protection, and audit logs |
| `npm run test:integration:admin-permissions` | Passed, including super-admin role-number-1 bypass, audit-only admin allow/deny, users.read read-only behavior, users.manage create behavior, companies.moderate queue access, blocked cross-permission audit access, `files.read` protected dashboard PDF downloads, attachment/no-store/nosniff headers, and blocked unsafe file extensions |
| `npm run test:integration:admin-support` | Passed, including support.view/support.manage boundaries, support queue/detail operations aliases, status validation, assignment, admin replies, close behavior, and audit logs |
| `npm run test:integration:translations` | Passed, including job/CV translation save/read/approval, draft review without published output, approved `published_translation`, unsupported-language rejection, cross-company denial, audit logs, and analytics |
| `npm run test:integration:admin-resources` | Passed, including generic admin-resource auth denial, unknown-resource denial, user secret/device redaction, FCM token/device redaction, populated-user redaction, sanitized create/update responses, generic bulk-update routing, and create/update/delete/bulk/approve/reject mutation audit rows |
| `npm run test:integration:employee-cv-downloads` | Passed, including saved-CV auth, owner-only download, cross-user denial, invalid-ID rejection, unsafe-path rejection, and missing-file handling |
| `npm run test:integration:job-mutations` | Passed, including save/unsave, modern toggle save, rate, review, internal apply, duplicate internal apply denial, external apply, duplicate external apply handling, job report, counters, search score signals, audit logs, analytics events, and trust report recomputation |
| `npm run test:integration:hiring-workflows` | Passed, including company interview schedule/reschedule/complete, cross-company interview denial, candidate interview response ownership, scorecard persistence, invitation resend without usage overcounting, invitation acceptance creating an application, invitation cancellation, audit logs, analytics events, and subscription usage counters |
| `npm run test:integration:campus-workflows` | Passed, including student-only campus access, event register/cancel idempotency, campus opportunity save/apply counters, direct campus apply duplicate denial, external campus apply duplicate denial, verification start/request-info/resubmit/approve, cross-university denial, university opportunity request audit logging, and CSV outcome report headers |
| `npm run test:object-authorization` | Passed |
| `npm run test:mobile-routes` | Passed |
| `npm run test:ai-safety` | Passed |
| `npm run test:global-launch-contract` | Passed |
| `npm run test:trust-routes` | Passed |
| `npm run test:notification-routes` | Passed |
| `npm run test:analytics-routes` | Passed |
| `npm run test:translation-routes` | Passed |
| `npm run test:admin-operations-routes` | Passed |
| `npm run test:career-passport` | Passed |
| `npm run test:integration:auth-context` | Passed, including missing/malformed/expired app tokens, expired admin tokens, inactive app-user denial, role/context denial, borrowed-context denial, suspended-context denial, invalid-context rejection, pending-company denial, and revoked refresh-session denial |
| `npm run test:integration:trust-documents` | Passed, including missing-token, wrong-role, submit-before-request, HTTPS-only evidence, private/internal public-HTTPS evidence rejection, cross-company denial, owning-company submission, admin review queue, audit logs, and analytics |
| `npm run docs:route-report` | Passed |
| `npm run docs:api-artifacts` | Passed |

## Generated Artifacts Checked

| Artifact | Check |
|---|---|
| `docs/api/HALAJOB_ROUTE_INVENTORY.json` | Regenerated from live Express app. |
| `docs/api/ROUTE_VERIFICATION_REPORT.md` | Regenerated; zero unclassified endpoints. |
| `docs/api/HALAJOB_POSTMAN_COLLECTION.json` | JSON parsed successfully. |
| `docs/api/HALAJOB_POSTMAN_ENV_LOCAL.json` | JSON parsed successfully. |
| `docs/api/HALAJOB_POSTMAN_ENV_DEV.json` | JSON parsed successfully. |
| `docs/api/HALAJOB_OPENAPI.yaml` | Operation IDs checked; duplicate count is zero. |
| `docs/DATABASE_MODELS.md` | Regenerated from live Mongoose schemas. |

## Notes

- Integration tests emitted Mongoose `strictQuery` deprecation warnings only; tests still passed.
- These are local contract/regression checks, not a production live-smoke test.
- Production live smoke still requires deployed API credentials and approved test accounts.
