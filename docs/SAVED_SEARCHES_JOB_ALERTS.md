# Saved Searches And Job Alerts

Saved searches are the canonical launch model for job alerts. Legacy employee `job_alerts` data is migrated into `SavedSearchModel`.

## Main Backend Surfaces

- Models: `SavedSearchModel`, `JobAlertLogModel`.
- Routes: `routesUser/SavedSearchRote.js`, `routesUser/JobAlertRote.js`.
- Services: `services/jobAlerts/`.
- Scheduler: `jobs/sendSavedSearchJobAlerts.js`.
- Migration: `scripts/migrateEmployeeJobAlertsToSavedSearches.js`.

## User Flows

- Job seeker or campus student saves a search.
- User can run the search immediately.
- Scheduled job dispatches alerts and logs results.
- Disabled alerts do not send.

## Verification

Run:

```bash
npm run test:integration:saved-search-alerts
npm run scheduled:saved-search-alerts
```

The integration test covers create/list/get/update/delete, ownership isolation, run-now matching, in-app notifications, duplicate suppression, disabled alerts, scheduler dispatch, log listing, and legacy migration.

