# Role Permission Test Results

Date: 2026-06-29
Branch: `codex/gate-a-mobile-ui-lock`
Commit tested: current branch after `8562da4`
Latest update: 2026-06-29 proof pass reran route validation, response-code, model-integrity, mobile UI contract, global launch contract, company public branding safe-field coverage, and route-report generation with zero unclassified unguarded endpoints.

## Passed Coverage

| Area | Evidence |
|---|---|
| Missing/malformed tokens rejected | `npm run test:security-http` |
| Seeker/employee context accepted for seeker routes | `npm run test:integration:auth-context` |
| Wrong active context rejected on seeker/company routes | `npm run test:integration:auth-context` |
| Approved company context required for company dashboard routes | `npm run test:integration:auth-context` |
| University admin context required for university routes | `npm run test:integration:auth-context` |
| Dashboard admin routes require admin token/session | `npm run test:integration:auth-context` and `npm run test:security-http` |
| Dashboard admin login failures/success and admin creation are audited | `npm run test:audit-logging` |
| Company file/download/export actions require company context and write audit logs | `npm run test:file-export-audit` |
| Company job/application records, university verification records, and campus student application/event records are object-scoped | `npm run test:object-authorization` |
| Company member role/context changes and removed-context denial are covered | `npm run test:integration:company-members` |
| University member role/context changes, aliases, cross-university denial, and last-owner protection are covered | `npm run test:integration:university-members` |
| Admin limited-permission allow/deny behavior and protected dashboard file downloads are covered | `npm run test:integration:admin-permissions` |
| Admin support view/manage boundaries and audit logs are covered | `npm run test:integration:admin-support` |
| Generic admin resource redaction and mutation audit rows are covered | `npm run test:integration:admin-resources` |
| Campus/mobile route guards mounted | `npm run test:mobile-routes` |
| Company permission route contracts mounted | `npm run test:mobile-routes` |

## Remaining Required Tests

- Live production role tests with real approved seeker, company, campus student, university admin, and platform admin accounts.
- Negative tests for every company member permission key beyond owner-level object isolation.
- Broader live support/moderator/finance admin role tests if those roles are enabled in production.
