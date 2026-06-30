# Codex Launch Reconciliation

Updated on 2026-07-01 from branch `codex/gate-a-mobile-ui-lock`.

This document reconciles the finish-off handout against the current source. It replaces the older Phase-0 snapshot, whose admin/search findings are now stale.

## Completed In This Finish-Off Pass

| Item | Current status | Evidence |
|---|---|---|
| Public job search params | Done for public web jobs | `web/src/public/screens.tsx`, `web/src/public/screens.test.tsx` |
| Admin user support visibility | Done | `user support` tab uses `adminService.userSupportQueue()` |
| Admin accessibility requests | Done | `accessibility` tab and support/legal table use `/dash/v1/accessibility-requests/get` |
| Admin legal/privacy/content actions | Done | status/legal-review actions call `setResourceStatus` / `setContentLegalReview` |
| Admin roles and access UI | Done | `roles & access` tab lists roles, permissions, users, and assigns roles |
| Dedicated safe role assignment | Done | `PATCH|POST /dash/v1/resources/users/:id/role` |
| Self/last-super-admin guard | Done | `controllers/dash/adminResourceController.js`; covered by integration test |
| Standalone admin sync | Done | `admin/src/admin/screens.tsx`, `admin/src/shared/api.ts`, `admin/src/shared/dashboard.tsx` |

## Still Left

| Item | Status | Notes |
|---|---|---|
| CV parsing launch decision | Deferred / honest-disabled | Keep auto-fill disabled unless a provider route, upload types, fixtures, and UI copy are proven together. |
| Mobile accessibility/privacy status/cancel UX | Still left | Backend/user routes need final mobile UI wiring and tests. |
| Mobile contextual report target IDs | Still left | Generic mobile/web report surfaces should carry real `targetId` where available. |
| Mobile company action buttons | Still left | Several service methods exist but need visible controls and widget tests. |
| Production smoke | Owner/environment blocked | Requires real deployment, real DB, legal/store/provider sign-offs. |
| Online payment | Owner/provider blocked | Manual billing stays honest until provider details exist. |

## Commands Proven

- `npm run check:syntax`
- `npm run test:integration:admin-permissions`
- `npm run test:integration:admin-support`
- `npm run test:integration:cv-parsing`
- `npm run test:route-validation`
- `npm --prefix web test -- public/screens.test.tsx admin/screens.test.tsx shared/api.test.ts`
- `npm --prefix web run build`
- `npm --prefix admin run build`

## Notes For Future Work

- Do not rebuild the backend search endpoint; public web now sends the supported params.
- Do not introduce fake CV parsing, payment, or AI claims. Keep disabled/manual states honest unless a real provider is configured and verified.
- Keep admin UI changes synced between embedded `web/src/admin` and standalone `admin/src/admin`.
