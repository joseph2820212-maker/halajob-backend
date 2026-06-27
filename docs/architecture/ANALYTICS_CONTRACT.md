# Analytics Contract

Date: 2026-06-27
Scope: event tracking and analytics summaries.

## Routes

Analytics routes are mounted under `/analytics/v1` and require authentication.

| Action | Route |
|---|---|
| Track event | `POST /analytics/v1/events`, `POST /analytics/v1/track` |
| List my events | `GET /analytics/v1/events` |
| Admin summary/cohorts | `GET /analytics/v1/admin/summary`, `GET /analytics/v1/admin/cohorts` |

## Rules

- Analytics events should be append-only.
- Events should include actor/context, entity, timestamp, and safe metadata.
- Do not store secrets, passwords, tokens, raw CVs, or private documents in analytics metadata.
- Admin analytics must be permission-protected.

## Required Product Events

- login/register
- role/context selected
- profile completed
- CV uploaded
- job viewed/saved/applied
- application status changed
- interview scheduled/responded
- AI result generated
- translation requested/saved
- campus verification submitted/approved/rejected
- notification opened

## Verification

```bash
npm run test:analytics-routes
```

## Gaps

- Event taxonomy still needs a final owner-approved list.
- Live analytics dashboards need seeded and production smoke tests.
