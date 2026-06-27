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

## Route Ownership Rules

| Route family | Owning module | Change rule |
|---|---|---|
| `/dash/v1/auth`, `/dash/v1/dashboard`, `/dash/v1/resources/*` | Admin/dashboard | Keep dashboard-only behavior behind `isAdmin`; generic resources must redact secrets and write audit rows for mutations. |
| `/dash/v1/trust/*`, `/admin/v1/trust/*` | Trust/admin | Trust admin moderation belongs in `controllers/trust/` and `services/trust/`, even when exposed through dashboard aliases. |
| `/user/v1/auth`, `/user/v1/global`, `/user/v1/applying-job`, `/user/v1/company` | Legacy app/user | Treat as backward-compatible mobile app API. New work should prefer clearer module routes unless old clients already use the path. |
| `/employee/v1/*` | Seeker/mobile | Seeker dashboard and mobile compatibility routes must require app auth plus an active employee/job-seeker context. |
| `/company/v1/*` | Company | Company routes must require app auth, active company context, approved company access where needed, and company ownership/permission checks. |
| `/campus/v1/*` | Campus student/admin | Student routes must require student context; admin subroutes must require university admin context. |
| `/university/v1/*` | University admin | University routes must require active university admin context and university-scoped object access. |
| `/ai/v1/*` | AI | AI routes must go through safety/usage-limit services and write audit/analytics rows for accepted or blocked requests. |
| `/analytics/v1/*` | Analytics | Event writes must be user/context scoped; admin reads must stay role/university scoped. |
| `/notifications/v1/*` | Notifications | Device tokens and inbox actions must stay user-owned. |
| `/trust/v1/*` | Trust user/company | Trust reports and document responses must validate role, ownership, HTTPS evidence, audit rows, and analytics rows. |
| `/uploads/*`, `/cv/generated/*`, download/export routes | Files/downloads | Public file serving must be attachment/nosniff guarded where needed; sensitive downloads must be authenticated, owner-scoped, and audited when business-sensitive. |

## Compatibility Policy

Compatibility aliases are allowed only when a web, mobile, admin, or external client already depends on an old path or spelling.

When adding a compatibility alias:

1. Add the modern canonical route first when one does not already exist.
2. Keep the alias thin; it should call the same controller/service as the canonical route.
3. Add or update a contract test proving the alias is mounted and guarded.
4. Regenerate `docs/api/HALAJOB_ROUTE_INVENTORY.json` with `npm run docs:route-report` when the route surface changes.
5. Record the alias in `docs/api/LEGACY_COMPATIBILITY_NOTES.md` if it is intended to be temporary.

When removing a compatibility alias:

1. Confirm no current web, mobile, admin, or company portal client calls it.
2. Update the relevant route-mount test.
3. Regenerate API artifacts.
4. Document the replacement route and migration reason.

## Controller, Service, Model Boundaries

| Layer | Responsibility |
|---|---|
| Route files | Mount paths, parse upload middleware, attach auth/context/permission middleware, and delegate to controllers. |
| Controllers | Validate request shape where no validator exists, enforce request-specific ownership, call services/models, and return consistent response envelopes. |
| Services | Hold reusable business logic, scoring, matching, audit writes, analytics writes, billing logic, and cross-model workflows. |
| Models | Store schema, indexes, enum constraints, and small document hooks only. Avoid putting request/user-context logic in models. |
| Middleware | Authenticate, resolve active context, enforce broad role gates, and attach safe request state. |
| Verification scripts | Prove route mounts, auth boundaries, object ownership, redaction, audit logs, and runtime side effects with seeded data. |

## Admin Resource Policy

The generic dashboard resource controller is a compatibility and admin-operations surface, not the preferred place for bespoke business workflows.

- Generic resource responses must use safe selects/populates for user and device-token data.
- Generic mutation paths must audit create, update, delete/disable, bulk-update, approve, and reject actions.
- Any resource with domain side effects should prefer a specific controller/service workflow first, then expose generic CRUD only when safe.
- New sensitive resources should add redaction rules before being exposed through `/dash/v1/resources/:resource`.
- Fine-grained admin permissions are still a future hardening item; until then, keep sensitive admin actions explicit and audited.

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
