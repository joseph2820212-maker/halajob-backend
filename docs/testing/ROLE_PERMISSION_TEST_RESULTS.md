# Role Permission Test Results

Date: 2026-06-27
Branch: `flutter-seeker-campus`
Commit tested: `71570c7d3b9912a8b9ed0c3866fb10949a54fed1`
Latest update: object authorization, audit logging, and file/export audit integration coverage added on 2026-06-27.

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
| Campus/mobile route guards mounted | `npm run test:mobile-routes` |
| Company permission route contracts mounted | `npm run test:mobile-routes` |

## Remaining Required Tests

- Live production role tests with real approved seeker, company, campus student, university admin, and platform admin accounts.
- Negative tests for every company member permission key beyond owner-level object isolation.
- Tests proving support users cannot access owner/admin-only actions.
- Tests proving admin generic resource routes audit sensitive writes.
