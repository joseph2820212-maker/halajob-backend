# Backend Module Map

Date: 2026-06-27
Scope: current root-level backend structure.

## Current Shape

The backend is a modular monolith, but it is not yet organized under a single `src/modules` layout. Current modules are split by legacy folders:

| Area | Current folders/files |
|---|---|
| App bootstrap | `app.js`, `index.js`, `config/` |
| Admin/dashboard | `routes/`, `controllers/dash/`, `middlewares/isAdmin.js` |
| Seeker/mobile user | `routesUser/`, `routesEmployee/`, `controllers/app/`, `controllers/employeeDash/` |
| Company | `routesCompany/`, `controllers/companyDash/`, `helper/companyDash/` |
| Campus/student/university | `routesCampus/`, `routesUniversity/`, `controllers/app/campus/`, university/campus models |
| AI | `routesAi/`, `controllers/ai/`, `services/ai/` |
| Analytics | `routesAnalytics/`, `services/analytics/` |
| Trust/anti-scam | `routesTrust/`, `controllers/trust/`, `services/trust/` |
| Notifications | `routesNotifications/`, `notification/`, notification models/services |
| Jobs/applications/interviews | `routesJobs/`, job/application/interview controllers and models |
| Shared models | `models/` |
| Shared middleware | `middlewares/` |
| Verification scripts | `scripts/` |
| Docs | `docs/` |

## Route Mounts

| Prefix | Module |
|---|---|
| `/dash/v1` | Admin/dashboard |
| `/user/v1` | Legacy mobile/user routes |
| `/employee/v1` | Seeker/mobile routes |
| `/company/v1` | Company dashboard/API |
| `/campus/v1` | Campus public/student/admin routes |
| `/university/v1` | University admin routes |
| `/ai/v1` | AI tools |
| `/analytics/v1` | Analytics |
| `/trust/v1` | Trust user/company routes |
| `/admin/v1/trust` | Admin trust review |
| `/notifications/v1` | Notifications/device tokens |
| `/jobs/v1` | Jobs API |
| `/health` | Health/system route |

## Recommended Direction

Keep the modular monolith, but gradually move toward:

```text
src/modules/<module>/<module>.routes.js
src/modules/<module>/<module>.controller.js
src/modules/<module>/<module>.service.js
src/modules/<module>/<module>.validators.js
src/modules/<module>/<module>.permissions.js
```

Do this gradually. Do not rename large route surfaces until web/mobile/admin clients are covered by contract tests.
