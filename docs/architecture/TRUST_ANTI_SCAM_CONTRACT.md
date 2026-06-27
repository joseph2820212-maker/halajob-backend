# Trust And Anti-Scam Contract

Date: 2026-06-27
Scope: job/company trust, scam reporting, and admin review.

## Routes

| Area | Routes |
|---|---|
| Job trust score/report/document response | `/trust/v1/jobs/:jobId/...` |
| Admin trust review | `/admin/v1/trust/...` and dashboard trust aliases under `/dash/v1/trust/...` |

## Rules

- Trust score/report state is backend-owned.
- Users/companies can report or respond where routes allow.
- Admin trust decisions must audit.
- Suspect jobs/companies should not be hidden only on the frontend.
- Admin review should include safe notes and never store secrets in audit logs.

## Verification

```bash
npm run test:trust-routes
npm run test:integration:trust-documents
```

## Gaps

- Full fraud rules and scoring explanation need product owner approval.
- Live admin review queue must be tested with real seeded reports before launch.
