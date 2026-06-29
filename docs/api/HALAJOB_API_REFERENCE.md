# Hala Job API Reference

Generated: 2026-06-29T03:50:48.529Z
Source: `docs/api/HALAJOB_ROUTE_INVENTORY.json`.

This is a route-level API reference skeleton. It documents the live Express route surface, authentication classification, and guard evidence. Detailed request bodies, response examples, validation schemas, audit events, and business rules still need to be filled route-by-route before the backend can be called fully documented.

## Global Conventions

| Item | Current rule |
|---|---|
| Authentication | `Authorization: Bearer <token>` for protected routes. |
| Language | Preserve legacy `lan`; migrate clients toward `x-lang: en|ar`. |
| Content type | JSON by default; multipart for uploads. |
| IDs | MongoDB ObjectId strings unless otherwise documented. |
| Response envelope | Mixed legacy envelopes exist. New routes should standardize message/error keys without breaking old clients. |
| Full inventory | `docs/api/HALAJOB_ROUTE_INVENTORY.json` |
| OpenAPI skeleton | `docs/api/HALAJOB_OPENAPI.yaml` |
| Postman collection | `docs/api/HALAJOB_POSTMAN_COLLECTION.json` |

## Counts

| Module | Endpoints |
| --- | --- |
| AI | 12 |
| Admin | 3328 |
| Analytics | 5 |
| Campus | 18 |
| Campus Student | 51 |
| Company | 181 |
| Files | 1 |
| Health | 3 |
| Jobs | 2 |
| Legacy User | 204 |
| Notifications | 20 |
| Other | 15 |
| Seeker | 110 |
| Trust | 4 |
| University | 36 |

## AI

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| POST | `/ai/v1/career-passport/score` | Bearer token | explicit | authUser, anonymous, validateRequest, refreshScore |
| POST | `/ai/v1/career/copilot` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/company/jobs/:jobId/shortlist` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/company/jobs/generate` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/company/messages/generate` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/cv/rewrite` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/interview/practice` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/jobs/:jobId/cover-letter` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/jobs/:jobId/match` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/profile/score` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/translate/cv` | Bearer token | explicit | authUser, anonymous, validateRequest |
| POST | `/ai/v1/translate/job/:jobId` | Bearer token | explicit | authUser, anonymous, validateRequest |

## Admin

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| PATCH | `/admin/v1/trust/jobs/:jobId/mark-safe` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, markJobSafe |
| POST | `/admin/v1/trust/jobs/:jobId/mark-safe` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, markJobSafe |
| PATCH | `/admin/v1/trust/jobs/:jobId/request-documents` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, requestDocuments |
| POST | `/admin/v1/trust/jobs/:jobId/request-documents` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, requestDocuments |
| PATCH | `/admin/v1/trust/jobs/:jobId/suspend` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, suspendJob |
| POST | `/admin/v1/trust/jobs/:jobId/suspend` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, suspendJob |
| GET | `/admin/v1/trust/review-queue` | Bearer token | inferred-parent-mount | inferred:isAdmin, reviewQueue |
| GET | `/dash/v1/accessibility-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/accessibility-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/accessibility-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/accessibility-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/accessibility-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/accessibility-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/accessibility-requests/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/accessibility-requests/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/accessibility-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/accessibility-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/accessibility-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, tracking |
| GET | `/dash/v1/Admin` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Admin/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admin/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Admin/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admin/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admin/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Admin/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admin/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admin/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admin/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admin/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Admin/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admins/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admins/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/admins/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Admins/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Admins/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admins/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/admins/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Admins/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Admins/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Admins/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ai/features` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listFeatures |
| GET | `/dash/v1/ai/limits` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listLimits |
| POST | `/dash/v1/ai/limits` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listLimits |
| DELETE | `/dash/v1/ai/limits/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateLimit |
| PATCH | `/dash/v1/ai/limits/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateLimit |
| GET | `/dash/v1/ai/requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listRequests |
| GET | `/dash/v1/ai/requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getRequest |
| GET | `/dash/v1/ai/summary` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, summary |
| GET | `/dash/v1/ai/usage/summary` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, summary |
| GET | `/dash/v1/Application` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/application-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/application-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/application-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/application-history/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/application-history/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/application-history/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/application-history/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/application-history/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/application-history/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/application-history/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/application-history/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Application/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Application/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Application/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Application/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Application/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Application/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Application/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Application/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Application/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Application/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Application/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ApplicationHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ApplicationHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ApplicationHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ApplicationHistory/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ApplicationHistory/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ApplicationHistory/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ApplicationHistory/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ApplicationHistory/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ApplicationHistory/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ApplicationHistory/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ApplicationHistory/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/applications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Applications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/applications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Applications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/applications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Applications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/applications/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Applications/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/applications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Applications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/audit-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listAuditLogs |
| POST | `/dash/v1/auth/admins` | Bearer token | explicit | inferred:isAdmin, isAdmin, multerMiddleware, validateRequest, createDashboardUser |
| POST | `/dash/v1/auth/create-admin` | Bearer token | explicit | inferred:isAdmin, isAdmin, multerMiddleware, validateRequest, createDashboardUser |
| POST | `/dash/v1/auth/login` | Public/system | none | multerMiddleware, auditMissingDashboardLoginCredentials, validateRequest, login |
| POST | `/dash/v1/auth/logout` | Public/system | none | multerMiddleware, validateRequest, logout |
| GET | `/dash/v1/auth/me` | Bearer token | explicit | inferred:isAdmin, isAdmin, me |
| POST | `/dash/v1/auth/refresh` | Public/system | none | multerMiddleware, validateRequest, refresh |
| GET | `/dash/v1/Banner` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Banner/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banner/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Banner/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banner/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banner/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Banner/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banner/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banner/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banner/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banner/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Banner/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Banners/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/banners/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banners/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/banners/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banners/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/banners/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Banners/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/banners/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Banners/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/banners/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banners/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/banners/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/banners/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/banners/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Banners/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Banners/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Banners/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/campus/partners` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminCampusPartners |
| GET | `/dash/v1/campus/privacy-audit` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminCampusPrivacyAudit |
| GET | `/dash/v1/campus/universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listUniversities |
| POST | `/dash/v1/campus/universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listUniversities |
| PATCH | `/dash/v1/campus/universities/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateUniversityStatus |
| GET | `/dash/v1/Color` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Color/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Color/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Color/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Color/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Color/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Color/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Color/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Color/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Color/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Color/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Color/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/colors/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/colors/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/colors/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/colors/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/colors/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/colors/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/colors/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/colors/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/colors/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/colors/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/colors/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/communication/logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listDeliveryLogs |
| GET | `/dash/v1/communication/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTemplates |
| POST | `/dash/v1/communication/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTemplates |
| PATCH | `/dash/v1/communication/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTemplate |
| POST | `/dash/v1/communication/test-send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, testSend |
| GET | `/dash/v1/companies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Companies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Companies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/companies/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Companies/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Companies/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Companies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/companies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Companies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Companies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Companies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-public-profiles/:companyId/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approve |
| POST | `/dash/v1/company-public-profiles/:companyId/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, reject |
| GET | `/dash/v1/company-public-profiles/pending` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listPending |
| GET | `/dash/v1/company-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listCompanyRequests |
| PATCH | `/dash/v1/company-requests/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveCompanyRequest |
| POST | `/dash/v1/company-requests/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveCompanyRequest |
| PATCH | `/dash/v1/company-requests/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectCompanyRequest |
| POST | `/dash/v1/company-requests/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectCompanyRequest |
| GET | `/dash/v1/company-reviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/company-reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/company-reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-reviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-reviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/company-reviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-reviews/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-reviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-reviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-reviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/company-reviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/company-subscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-subscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/company-subscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-subscriptions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-subscriptions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/company-subscriptions/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/company-subscriptions/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-subscriptions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/company-subscriptions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-subscriptions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/company-subscriptions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Company/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Company/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Company/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Company/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Company/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Company/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Company/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Company/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Company/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Company/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Company/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/CompanyReview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanyReview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/CompanyReview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanyReview/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanyReview/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/CompanyReview/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanyReview/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanyReview/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanyReview/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanyReview/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/CompanyReview/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/CompanySubscription/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscription/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/CompanySubscription/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscription/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscription/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/CompanySubscription/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscription/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscription/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscription/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscription/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/CompanySubscription/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/CompanySubscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/CompanySubscriptions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscriptions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscriptions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/CompanySubscriptions/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/CompanySubscriptions/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscriptions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/CompanySubscriptions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/CompanySubscriptions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/CompanySubscriptions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/content-pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content-pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/content-pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content-pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content-pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/content-pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content-pages/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content-pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content-pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content-pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/content-pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/content/pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/content/pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/countries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/countries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/countries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/countries/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/countries/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/countries/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/countries/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/countries/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/countries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/countries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/countries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Country/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Country/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Country/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Country/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Country/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Country/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Country/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Country/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Country/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Country/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Country/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/currencies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/currencies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/currencies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/currencies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/currencies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/currencies/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/currencies/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/currencies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/currencies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/currencies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/currencies/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Currency/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Currency/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Currency/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Currency/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Currency/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Currency/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Currency/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Currency/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Currency/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Currency/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Currency/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/cv-template/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-template/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/cv-template/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-template/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-template/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/cv-template/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-template/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-template/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-template/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-template/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/cv-template/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-templates/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-templates/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/cv-templates/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv-templates/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-templates/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/cv-templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/cv-templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/cv-templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/cv/admin/cv-templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, createCvTemplate |
| POST | `/dash/v1/cv/admin/cv-templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, createCvTemplate |
| DELETE | `/dash/v1/cv/admin/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| GET | `/dash/v1/cv/admin/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| PATCH | `/dash/v1/cv/admin/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| PUT | `/dash/v1/cv/admin/cv-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| GET | `/dash/v1/cv/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, createCvTemplate |
| POST | `/dash/v1/cv/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, createCvTemplate |
| DELETE | `/dash/v1/cv/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| GET | `/dash/v1/cv/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| PATCH | `/dash/v1/cv/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| PUT | `/dash/v1/cv/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, validateRequest, updateCvTemplate |
| GET | `/dash/v1/dashboard` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/dashboard/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/dashboard/dash` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/dashboard/overview` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/dashboard/tracking` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/education-levels` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/education-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/education-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/education-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/education-levels/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/education-levels/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/education-levels/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/education-levels/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/education-levels/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/education-levels/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/education-levels/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/education-levels/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/EducationLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EducationLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/EducationLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EducationLevel/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EducationLevel/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/EducationLevel/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EducationLevel/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EducationLevel/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EducationLevel/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EducationLevel/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/EducationLevel/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email-logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email-logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-logs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-logs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email-logs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-logs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-logs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-logs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-logs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email-logs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email-templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-templates/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-templates/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email-templates/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email-templates/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-templates/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email-templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email-templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email-templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email/logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email/logs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/logs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/logs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email/logs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/logs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/logs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/logs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/logs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email/logs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/templates/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/templates/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/email/templates/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/email/templates/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/templates/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/email/templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/email/templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/email/templates/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/employee-cvs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employee-cvs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/employee-cvs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employee-cvs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employee-cvs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/employee-cvs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employee-cvs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employee-cvs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employee-cvs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employee-cvs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/employee-cvs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Employee/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employee/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Employee/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employee/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employee/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Employee/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employee/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employee/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employee/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employee/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Employee/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/EmployeeCv/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EmployeeCv/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/EmployeeCv/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EmployeeCv/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EmployeeCv/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/EmployeeCv/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/EmployeeCv/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EmployeeCv/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/EmployeeCv/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/EmployeeCv/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/EmployeeCv/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employees/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employees/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/employees/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Employees/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Employees/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employees/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/employees/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Employees/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Employees/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Employees/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/excel/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, create |
| POST | `/dash/v1/excel/csv` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, csv |
| POST | `/dash/v1/excel/exsel` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, uploadExcel |
| GET | `/dash/v1/excel/insert` | Bearer token | inferred-parent-mount | inferred:isAdmin, insert |
| GET | `/dash/v1/experience-levels` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/experience-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/experience-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/experience-levels/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/experience-levels/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/experience-levels/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/experience-levels/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/experience-levels/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/experience-levels/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/experience-levels/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/experience-levels/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/experience-levels/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ExperienceLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ExperienceLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ExperienceLevel/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ExperienceLevel/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ExperienceLevel/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ExperienceLevel/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ExperienceLevel/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ExperienceLevel/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ExperienceLevel/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ExperienceLevel/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ExperienceLevel/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/exsel/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, create |
| POST | `/dash/v1/exsel/csv` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, csv |
| POST | `/dash/v1/exsel/exsel` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, uploadExcel |
| GET | `/dash/v1/exsel/insert` | Bearer token | inferred-parent-mount | inferred:isAdmin, insert |
| GET | `/dash/v1/faq` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/faq-items/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq-items/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/faq-items/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq-items/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq-items/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/faq-items/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq-items/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq-items/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq-items/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq-items/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/faq-items/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/faq/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/faq/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/faq/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/faq/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/faq/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/faq/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/faq/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/fcm-tokens/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fcm-tokens/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/fcm-tokens/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fcm-tokens/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fcm-tokens/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/fcm-tokens/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fcm-tokens/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fcm-tokens/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fcm-tokens/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fcm-tokens/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/fcm-tokens/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/FcmToken/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/FcmToken/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/FcmToken/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/FcmToken/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/FcmToken/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/FcmToken/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/FcmToken/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/FcmToken/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/FcmToken/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/FcmToken/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/FcmToken/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/file/:name` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, anonymous |
| GET | `/dash/v1/Font` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Font/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Font/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Font/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Font/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Font/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Font/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Font/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Font/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Font/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Font/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Font/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/fonts/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fonts/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/fonts/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fonts/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fonts/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/fonts/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/fonts/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fonts/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/fonts/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/fonts/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/fonts/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/global-search` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, globalSearch |
| GET | `/dash/v1/help-articles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help-articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help-articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-articles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-articles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help-articles/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-articles/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-articles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-articles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-articles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help-articles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help-categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help-categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-categories/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-categories/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help-categories/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help-categories/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-categories/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help-categories/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help-categories/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help-categories/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help/articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help/articles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/articles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/articles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help/articles/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/articles/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/articles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/articles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/articles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help/articles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help/categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help/categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/categories/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/categories/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/help/categories/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/help/categories/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/categories/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/help/categories/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/help/categories/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/help/categories/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/image/:name` | Public/system | none | anonymous |
| GET | `/dash/v1/image/uploads/:name` | Public/system | none | anonymous |
| POST | `/dash/v1/import/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, create |
| POST | `/dash/v1/import/csv` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, csv |
| POST | `/dash/v1/import/exsel` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, uploadExcel |
| GET | `/dash/v1/import/insert` | Bearer token | inferred-parent-mount | inferred:isAdmin, insert |
| GET | `/dash/v1/industries` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/industries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/industries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/industries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/industries/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/industries/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/industries/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/industries/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/industries/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/industries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/industries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/industries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Industry/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Industry/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Industry/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Industry/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Industry/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Industry/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Industry/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Industry/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Industry/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Industry/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Industry/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interview-prep/questions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listQuestions |
| POST | `/dash/v1/interview-prep/questions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listQuestions |
| DELETE | `/dash/v1/interview-prep/questions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateQuestion |
| PATCH | `/dash/v1/interview-prep/questions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateQuestion |
| DELETE | `/dash/v1/Interview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Interview/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interview/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interview/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Interview/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interview/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interview/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interview/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interview/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Interview/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Interviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/interviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/interviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/interviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Interviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/interviews/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Interviews/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/interviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/interviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/interviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/interviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Interviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Interviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Interviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Invitation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Invitation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitation/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitation/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Invitation/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitation/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitation/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitation/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitation/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Invitation/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Invitations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/invitations/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitations/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/invitations/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitations/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/invitations/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Invitations/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/invitations/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Invitations/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/invitations/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitations/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/invitations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/invitations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/invitations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Invitations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Invitations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Invitations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-approvals` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listJobReviewQueue |
| GET | `/dash/v1/job-employee-matches` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-employee-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-employee-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-employee-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-employee-matches/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-employee-matches/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-employee-matches/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-employee-matches/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-employee-matches/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-employee-matches/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-employee-matches/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-employee-matches/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-matches/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-matches/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-matches/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-matches/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-matches/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-matches/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-matches/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-matches/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-matches/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-names/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-names/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-names/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-names/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-names/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-names/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-names/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-names/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-names/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-names/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-names/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-salaries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-salaries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-salaries/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-salaries/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-salaries/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-salaries/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-salaries/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-salaries/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-salaries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-salaries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-salaries/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-services/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-services/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-services/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-services/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-services/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-services/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-services/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-services/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-services/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-services/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-services/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-types/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-types/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-types/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-types/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-types/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/job-types/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/job-types/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-types/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/job-types/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/job-types/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/job-types/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Job/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Job/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Job/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Job/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Job/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Job/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Job/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Job/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Job/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Job/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Job/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobEmployeeMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobEmployeeMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobEmployeeMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobEmployeeMatch/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobEmployeeMatch/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobEmployeeMatch/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobEmployeeMatch/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobEmployeeMatch/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobEmployeeMatch/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobEmployeeMatch/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobEmployeeMatch/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobMatch/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobMatch/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobMatch/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobMatch/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobMatch/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobMatch/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobMatch/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobMatch/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobMatch/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobName/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobName/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobName/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobName/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobName/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobName/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobName/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobName/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobName/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobName/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobName/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobReport/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobReport/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobReport/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobReport/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobReport/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobReport/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobReport/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobReport/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobReport/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobReport/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobReport/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveJob |
| POST | `/dash/v1/jobs/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveJob |
| PATCH | `/dash/v1/jobs/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectJob |
| POST | `/dash/v1/jobs/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectJob |
| PATCH | `/dash/v1/jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Jobs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobSalary/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobSalary/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobSalary/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobSalary/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobSalary/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobSalary/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobSalary/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobSalary/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobSalary/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobSalary/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobSalary/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobService/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobService/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobService/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobService/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobService/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobService/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobService/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobService/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobService/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobService/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobService/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobType/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobType/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobType/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobType/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobType/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/JobType/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/JobType/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobType/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/JobType/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/JobType/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/JobType/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/keyword/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, get |
| GET | `/dash/v1/Keyword/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, get |
| GET | `/dash/v1/keyword/log` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, logKeyword |
| GET | `/dash/v1/Keyword/log` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, logKeyword |
| POST | `/dash/v1/keyword/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, updateKeyWord |
| POST | `/dash/v1/Keyword/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, updateKeyWord |
| GET | `/dash/v1/Language` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Language/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Language/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Language/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Language/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Language/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Language/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Language/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Language/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Language/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Language/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Language/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/languages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/languages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/languages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/languages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/languages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/languages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/languages/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/languages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/languages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/languages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/languages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/learning-resource-categories` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listCategories |
| POST | `/dash/v1/learning-resource-categories` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listCategories |
| PATCH | `/dash/v1/learning-resource-categories/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateCategory |
| GET | `/dash/v1/learning-resources` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listResources |
| POST | `/dash/v1/learning-resources` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listResources |
| DELETE | `/dash/v1/learning-resources/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getResource |
| GET | `/dash/v1/learning-resources/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getResource |
| PATCH | `/dash/v1/learning-resources/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getResource |
| POST | `/dash/v1/learning-resources/:id/archive` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, archiveResource |
| POST | `/dash/v1/learning-resources/:id/publish` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, publishResource |
| GET | `/dash/v1/legal-reports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/legal-reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/legal-reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/legal-reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/legal-reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/legal-reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/legal-reports/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/legal-reports/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/legal-reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/legal-reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/legal-reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/moderation/company-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listCompanyRequests |
| GET | `/dash/v1/moderation/jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listJobReviewQueue |
| GET | `/dash/v1/Notification` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notification-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listNotificationLogs |
| DELETE | `/dash/v1/Notification/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Notification/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Notification/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Notification/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Notification/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Notification/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Notification/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Notification/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notification/send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, sendNotification |
| PATCH | `/dash/v1/Notification/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Notification/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Notification/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/notifications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/notifications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/notifications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/notifications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/notifications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/notifications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/notifications/logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listNotificationLogs |
| PATCH | `/dash/v1/notifications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, sendNotification |
| PATCH | `/dash/v1/notifications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/notifications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/notifications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/operations/audit-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listAuditLogs |
| POST | `/dash/v1/operations/notifications/send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, sendNotification |
| GET | `/dash/v1/operations/support-tickets` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTickets |
| GET | `/dash/v1/operations/support-tickets/:ticketId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getTicketDetails |
| POST | `/dash/v1/operations/support-tickets/:ticketId/messages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, addAdminMessage |
| PATCH | `/dash/v1/operations/support-tickets/:ticketId/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTicketStatus |
| GET | `/dash/v1/operations/talent-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTalentRequests |
| GET | `/dash/v1/outside-applications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/outside-applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/outside-applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/outside-applications/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/outside-applications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/outside-applications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/outside-applications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/outside-applications/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/outside-applications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/outside-applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/outside-applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/outside-applications/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/OutsideApplication/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/OutsideApplication/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/OutsideApplication/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/OutsideApplication/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/OutsideApplication/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/OutsideApplication/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/OutsideApplication/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/OutsideApplication/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/OutsideApplication/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/OutsideApplication/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/OutsideApplication/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Page/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Page/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Page/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Page/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Page/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Page/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Page/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Page/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Page/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Page/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Page/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/pages/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Pages/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Pages/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Permission/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Permission/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Permission/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Permission/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Permission/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Permission/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Permission/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Permission/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Permission/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Permission/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Permission/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/permissions/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/permissions/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/platform/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettings |
| PATCH | `/dash/v1/platform/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettings |
| PUT | `/dash/v1/platform/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettings |
| GET | `/dash/v1/platform/settings/schema` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettingsSchema |
| GET | `/dash/v1/policy-acknowledgements` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/policy-acknowledgements/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/policy-acknowledgements/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/policy-acknowledgements/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/policy-acknowledgements/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/policy-acknowledgements/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/policy-acknowledgements/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/policy-acknowledgements/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/policy-acknowledgements/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/policy-acknowledgements/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/policy-acknowledgements/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/policy-acknowledgements/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/privacy-requests/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/privacy-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/project_status/global` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/project_status/global/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/project_status/global/dash` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/project_status/global/overview` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/project_status/global/tracking` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/Rating` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Rating/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Rating/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Rating/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Rating/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Rating/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Rating/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Rating/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Rating/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Rating/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Rating/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Rating/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ratings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ratings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ratings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ratings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ratings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ratings/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ratings/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ratings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ratings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ratings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ratings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Report/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Report/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Report/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Report/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Report/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Report/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Report/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Report/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Report/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Report/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Report/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Reports/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/reports/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Reports/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reports/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Reports/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Reports/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resources/:resource` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resources/:resource/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Resume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Resume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Resume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Resume/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Resume/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Resume/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Resume/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Resume/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Resume/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Resume/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Resume/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resumes/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resumes/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/resumes/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resumes/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resumes/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resumes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resumes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/resumes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Review/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Review/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Review/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Review/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Review/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Review/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Review/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Review/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Review/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Review/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Review/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/reviews/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/reviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/reviews/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/reviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/reviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/reviews/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Role/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Role/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Role/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Role/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Role/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Role/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Role/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Role/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Role/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Role/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Role/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/roles/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/roles/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/salary-insights` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminList |
| GET | `/dash/v1/salary-insights/health` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminHealth |
| POST | `/dash/v1/salary-insights/rebuild` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, adminRebuild |
| GET | `/dash/v1/saved-jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/saved-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/saved-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/saved-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/saved-jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/saved-jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/saved-jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/saved-jobs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/saved-jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/saved-jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/saved-jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/saved-jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SavedJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SavedJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SavedJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SavedJob/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SavedJob/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SavedJob/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SavedJob/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SavedJob/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SavedJob/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SavedJob/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SavedJob/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/search-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/search-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/search-history/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/search-history/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/search-history/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/search-history/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search-history/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/search-history/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/search-history/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/search-history/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/search-history/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/search/global` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, globalSearch |
| GET | `/dash/v1/SearchHistory` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SearchHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SearchHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SearchHistory/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SearchHistory/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SearchHistory/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SearchHistory/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SearchHistory/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SearchHistory/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SearchHistory/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SearchHistory/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SearchHistory/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Settings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Settings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/settings/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Settings/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Settings/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Settings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/settings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Settings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Settings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Settings/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/shown-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/shown-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/shown-jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/shown-jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/shown-jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/shown-jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/shown-jobs/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/shown-jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/shown-jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/shown-jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/shown-jobs/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ShownJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ShownJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ShownJob/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ShownJob/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ShownJob/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/ShownJob/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ShownJob/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ShownJob/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/ShownJob/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/ShownJob/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/ShownJob/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Skill/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Skill/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Skill/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Skill/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Skill/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Skill/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Skill/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Skill/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Skill/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Skill/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Skill/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/skills/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/skills/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/skills/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/skills/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/skills/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/skills/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/skills/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/skills/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/skills/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/skills/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/skills/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/statistics` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/statistics/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/statistics/dash` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/statistics/overview` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/statistics/tracking` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/subscription-plans` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/subscription-plans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/subscription-plans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/subscription-plans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/subscription-plans/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/subscription-plans/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/subscription-plans/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscription-plans/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/subscription-plans/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/subscription-plans/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/subscription-plans/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/subscription-plans/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SubscriptionPlan/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlan/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SubscriptionPlan/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlan/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlan/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SubscriptionPlan/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlan/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlan/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlan/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlan/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SubscriptionPlan/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SubscriptionPlans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SubscriptionPlans/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlans/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlans/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/SubscriptionPlans/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/SubscriptionPlans/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlans/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/SubscriptionPlans/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/SubscriptionPlans/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/SubscriptionPlans/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/subscriptions/companies/:companyId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getCompanySubscription |
| POST | `/dash/v1/subscriptions/companies/:companyId/assign-plan` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, assignSubscriptionPlan |
| POST | `/dash/v1/subscriptions/seed-free` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, seedFreePlan |
| GET | `/dash/v1/support-queue` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/support-queue/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/support-queue/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-tickets` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTickets |
| GET | `/dash/v1/support-tickets/:ticketId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getTicketDetails |
| POST | `/dash/v1/support-tickets/:ticketId/messages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, addAdminMessage |
| PATCH | `/dash/v1/support-tickets/:ticketId/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTicketStatus |
| GET | `/dash/v1/talent-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTalentRequests |
| POST | `/dash/v1/talent-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTalentRequests |
| DELETE | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTalentRequestStatus |
| POST | `/dash/v1/talent-requests/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTalentRequestStatus |
| PATCH | `/dash/v1/talent-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/talent-requests/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/talent-requests/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/TalentRequest/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/TalentRequest/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/TalentRequest/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/TalentRequest/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/TalentRequest/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/TalentRequest/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/TalentRequest/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/TalentRequest/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/TalentRequest/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/TalentRequest/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/TalentRequest/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/tracking` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, tracking |
| GET | `/dash/v1/translation-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTranslations |
| GET | `/dash/v1/translations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTranslations |
| PATCH | `/dash/v1/trust/jobs/:jobId/mark-safe` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, markJobSafe |
| POST | `/dash/v1/trust/jobs/:jobId/mark-safe` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, markJobSafe |
| PATCH | `/dash/v1/trust/jobs/:jobId/request-documents` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, requestDocuments |
| POST | `/dash/v1/trust/jobs/:jobId/request-documents` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, requestDocuments |
| PATCH | `/dash/v1/trust/jobs/:jobId/suspend` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, suspendJob |
| POST | `/dash/v1/trust/jobs/:jobId/suspend` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, suspendJob |
| GET | `/dash/v1/trust/review-queue` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, reviewQueue |
| GET | `/dash/v1/universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Universities/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Universities/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/universities/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Universities/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Universities/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Universities/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/universities/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Universities/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Universities/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Universities/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/University/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/University/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/University/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/University/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/University/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/University/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/University/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/University/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/University/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/University/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/University/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/user-resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/user-resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/user-resumes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/user-resumes/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/user-resumes/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/user-resumes/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/user-resumes/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/user-resumes/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/user-resumes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/user-resumes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/user-resumes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/User/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/User/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/User/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/User/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/User/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/User/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/User/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/User/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/User/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/User/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/User/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/UserResume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/UserResume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/UserResume/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/UserResume/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/UserResume/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/UserResume/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/UserResume/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/UserResume/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/UserResume/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/UserResume/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/UserResume/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Users/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Users/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/users/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/Users/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/Users/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Users/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/users/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/Users/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/Users/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/Users/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/work-locations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-locations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/work-locations/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-locations/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-locations/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/work-locations/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-locations/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-locations/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-locations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-locations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/work-locations/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/work-modes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-modes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/work-modes/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-modes/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-modes/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/work-modes/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-modes/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-modes/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-modes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-modes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/work-modes/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/work-times/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-times/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/work-times/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-times/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-times/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/work-times/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/work-times/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-times/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/work-times/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/work-times/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/work-times/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/WorkLocation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkLocation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/WorkLocation/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkLocation/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkLocation/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/WorkLocation/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkLocation/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkLocation/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkLocation/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkLocation/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/WorkLocation/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/WorkMode/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkMode/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/WorkMode/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkMode/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkMode/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/WorkMode/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkMode/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkMode/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkMode/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkMode/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/WorkMode/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/WorkTime/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkTime/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/WorkTime/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkTime/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkTime/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/WorkTime/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime/delete/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/details/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/get-one/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/getOne` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/getOne/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/WorkTime/list` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkTime/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/WorkTime/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/WorkTime/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/WorkTime/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |

## Analytics

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/analytics/v1/admin/cohorts` | Bearer token | inferred-parent-mount | inferred:authUser, adminCohorts |
| GET | `/analytics/v1/admin/summary` | Bearer token | inferred-parent-mount | inferred:authUser, adminSummary |
| GET | `/analytics/v1/events` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, track |
| POST | `/analytics/v1/events` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, track |
| POST | `/analytics/v1/track` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, track |

## Campus

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/campus/v1/admin/members` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityMembers |
| POST | `/campus/v1/admin/members` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityMembers |
| DELETE | `/campus/v1/admin/members/:memberId` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityMember |
| PATCH | `/campus/v1/admin/members/:memberId` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityMember |
| GET | `/campus/v1/admin/verifications` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, adminListVerifications |
| POST | `/campus/v1/admin/verifications/:id/approve` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, adminApproveVerification |
| GET | `/campus/v1/admin/verifications/:id/document` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, adminDownloadStudentVerificationDocument |
| POST | `/campus/v1/admin/verifications/:id/reject` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, adminRejectVerification |
| POST | `/campus/v1/admin/verifications/:id/request-info` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, adminRequestVerificationInfo |
| POST | `/campus/v1/student-verifications` | Bearer token | explicit | inferred:authUser, authUser, multerMiddleware, validateRequest, startStudentVerification |
| GET | `/campus/v1/student-verifications/:id/document` | Bearer token | explicit | inferred:authUser, authUser, downloadStudentVerificationDocument |
| POST | `/campus/v1/student-verifications/:id/resubmit` | Bearer token | explicit | inferred:authUser, authUser, multerMiddleware, validateRequest, resubmitStudentVerification |
| GET | `/campus/v1/student-verifications/me` | Bearer token | explicit | inferred:authUser, authUser, studentVerificationStatus |
| GET | `/campus/v1/universities` | Public/system | none | listUniversities |
| GET | `/campus/v1/universities/:id/campuses` | Public/system | none | listUniversityCampuses |
| POST | `/campus/v1/verification/confirm-email` | Bearer token | explicit | inferred:authUser, authUser, multerMiddleware, validateRequest, confirmStudentVerificationEmail |
| POST | `/campus/v1/verification/start` | Bearer token | explicit | inferred:authUser, authUser, multerMiddleware, validateRequest, startStudentVerification |
| POST | `/campus/v1/verification/upload-document` | Bearer token | explicit | inferred:authUser, authUser, multerMiddleware, validateRequest, uploadStudentVerificationDocument |

## Campus Student

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/user/v1/campus/admin/verifications` | Bearer token | explicit | authUser, activeContextGuard, adminListVerifications |
| POST | `/user/v1/campus/admin/verifications/:id/approve` | Bearer token | explicit | authUser, activeContextGuard, multerMiddleware, validateRequest, adminApproveVerification |
| POST | `/user/v1/campus/admin/verifications/:id/reject` | Bearer token | explicit | authUser, activeContextGuard, multerMiddleware, validateRequest, adminRejectVerification |
| POST | `/user/v1/campus/admin/verifications/:id/request-info` | Bearer token | explicit | authUser, activeContextGuard, multerMiddleware, validateRequest, adminRequestVerificationInfo |
| GET | `/user/v1/campus/applications` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, applications |
| GET | `/user/v1/campus/applications/:id` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, applicationDetails |
| PATCH | `/user/v1/campus/applications/:id/cancel` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, cancelApplication |
| POST | `/user/v1/campus/applications/:id/cancel` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, cancelApplication |
| POST | `/user/v1/campus/applications/:id/messages` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, sendApplicationMessage |
| GET | `/user/v1/campus/content` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, content |
| GET | `/user/v1/campus/dashboard` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, dashboard |
| GET | `/user/v1/campus/dashboard/overview` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, dashboard |
| GET | `/user/v1/campus/events` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, events |
| PATCH | `/user/v1/campus/events/:eventId/cancel` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, cancelEventRegistration |
| POST | `/user/v1/campus/events/:eventId/cancel` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, cancelEventRegistration |
| POST | `/user/v1/campus/events/:eventId/register` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, registerEvent |
| GET | `/user/v1/campus/opportunities` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, opportunities |
| GET | `/user/v1/campus/opportunities/:id` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, opportunityDetails |
| POST | `/user/v1/campus/opportunities/:id/apply` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, requireCampusOpportunity, multerMiddleware, validateRequest, applyJob |
| POST | `/user/v1/campus/opportunities/:id/apply-external` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, requireCampusOpportunity, multerMiddleware, validateRequest, applyExternalOpportunity |
| GET | `/user/v1/campus/opportunities/:id/readiness` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, requireCampusOpportunity, getApplyReadiness |
| DELETE | `/user/v1/campus/opportunities/:id/save` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, saveOpportunity |
| POST | `/user/v1/campus/opportunities/:id/save` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, saveOpportunity |
| POST | `/user/v1/campus/opportunities/:id/toggle-save` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, multerMiddleware, validateRequest, toggleSaveOpportunity |
| GET | `/user/v1/campus/overview` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, overview |
| GET | `/user/v1/campus/profile` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, validateRequest, profile |
| PATCH | `/user/v1/campus/profile` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, validateRequest, profile |
| POST | `/user/v1/campus/profile` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, validateRequest, profile |
| PUT | `/user/v1/campus/profile` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, validateRequest, profile |
| GET | `/user/v1/campus/resources` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, resources |
| GET | `/user/v1/campus/saved-searches` | Bearer token | explicit | authUser, anonymous, validateRequest, listSavedSearches |
| POST | `/user/v1/campus/saved-searches` | Bearer token | explicit | authUser, anonymous, validateRequest, listSavedSearches |
| DELETE | `/user/v1/campus/saved-searches/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, getSavedSearch |
| GET | `/user/v1/campus/saved-searches/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, getSavedSearch |
| PATCH | `/user/v1/campus/saved-searches/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, getSavedSearch |
| POST | `/user/v1/campus/saved-searches/:id/run-now` | Bearer token | explicit | authUser, anonymous, validateRequest, runSavedSearchNow |
| POST | `/user/v1/campus/student-verifications` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, startStudentVerification |
| POST | `/user/v1/campus/student-verifications/:id/resubmit` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, resubmitStudentVerification |
| GET | `/user/v1/campus/student-verifications/me` | Bearer token | explicit | authUser, studentVerificationStatus |
| GET | `/user/v1/campus/talent-visibility` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, validateRequest, getTalentVisibility |
| PATCH | `/user/v1/campus/talent-visibility` | Bearer token | explicit | authUser, anonymous, requireCampusStudent, validateRequest, getTalentVisibility |
| GET | `/user/v1/campus/universities` | Public/system | none | listUniversities |
| GET | `/user/v1/campus/universities/:id/campuses` | Public/system | none | listUniversityCampuses |
| GET | `/user/v1/campus/university/opportunities` | Bearer token | explicit | authUser, activeContextGuard, validateRequest, userUniversityOpportunities |
| POST | `/user/v1/campus/university/opportunities` | Bearer token | explicit | authUser, activeContextGuard, validateRequest, userUniversityOpportunities |
| GET | `/user/v1/campus/university/overview` | Bearer token | explicit | authUser, activeContextGuard, userUniversityOverview |
| GET | `/user/v1/campus/university/partners` | Bearer token | explicit | authUser, activeContextGuard, userUniversityPartners |
| GET | `/user/v1/campus/university/students` | Bearer token | explicit | authUser, activeContextGuard, userUniversityStudents |
| POST | `/user/v1/campus/verification/confirm-email` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, confirmStudentVerificationEmail |
| POST | `/user/v1/campus/verification/start` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, startStudentVerification |
| POST | `/user/v1/campus/verification/upload-document` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, uploadStudentVerificationDocument |

## Company

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| POST | `/company/v1/auth/forgot-password` | Public/system | none | forceCompanyWebAuthScope, multerMiddleware, validateRequest, forgotPassword |
| POST | `/company/v1/auth/login` | Public/system | none | multerMiddleware, validateRequest, login |
| POST | `/company/v1/auth/logout` | Public/system | none | multerMiddleware, validateRequest, logout |
| POST | `/company/v1/auth/logout-all` | Bearer token | explicit | authUser, activeContextGuard, anonymous, multerMiddleware, validateRequest, logoutAll |
| POST | `/company/v1/auth/passcode-forgot-password` | Public/system | none | forceCompanyWebAuthScope, multerMiddleware, validateRequest, passcodeVerify |
| POST | `/company/v1/auth/refresh` | Review | none | multerMiddleware, validateRequest, refresh |
| POST | `/company/v1/auth/refresh-token` | Review | none | multerMiddleware, validateRequest, refresh |
| POST | `/company/v1/auth/reset-password` | Review | none | forceCompanyWebAuthScope, multerMiddleware, validateRequest, resetPassword |
| POST | `/company/v1/auth/resetPassword` | Public/system | none | forceCompanyWebAuthScope, multerMiddleware, validateRequest, resetPassword |
| GET | `/company/v1/auth/sessions` | Bearer token | explicit | authUser, activeContextGuard, anonymous, listSessions |
| DELETE | `/company/v1/auth/sessions/:sessionId` | Bearer token | explicit | authUser, activeContextGuard, anonymous, validateRequest, revokeSession |
| GET | `/company/v1/campus/opportunities` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, companyOpportunities |
| POST | `/company/v1/campus/opportunities` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, companyOpportunities |
| GET | `/company/v1/campus/overview` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, universityOverview |
| GET | `/company/v1/campus/partners` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, partners |
| POST | `/company/v1/campus/partners` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, partners |
| GET | `/company/v1/campus/partners/:universityId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, companyPartnerDetail |
| PATCH | `/company/v1/campus/partners/:universityId/cancel-request` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, cancelCompanyPartnerRequest |
| GET | `/company/v1/campus/students` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, students |
| GET | `/company/v1/campus/students/:employeeId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, companyStudentDetail |
| GET | `/company/v1/global` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, getCompanyDashboard |
| GET | `/company/v1/global/analytics` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getCompanyAnalytics |
| GET | `/company/v1/global/analytics/applications` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getApplicationsAnalytics |
| GET | `/company/v1/global/analytics/jobs` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getJobsAnalytics |
| GET | `/company/v1/global/analytics/profile` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getProfileAnalytics |
| GET | `/company/v1/global/applications` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getAllApplications |
| GET | `/company/v1/global/applications/:applicationId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getApplicationDetails |
| GET | `/company/v1/global/applications/:applicationId/audit-logs` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getApplicationAuditLogs |
| POST | `/company/v1/global/applications/:applicationId/note` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, addApplicationNote |
| POST | `/company/v1/global/applications/:applicationId/rate` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, rateApplicant |
| PATCH | `/company/v1/global/applications/:applicationId/status` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, changeApplicationStatus |
| GET | `/company/v1/global/audit-logs` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getAuditLogs |
| GET | `/company/v1/global/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getCompanyInterviews |
| POST | `/company/v1/global/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getCompanyInterviews |
| DELETE | `/company/v1/global/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateInterview |
| PATCH | `/company/v1/global/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateInterview |
| GET | `/company/v1/global/jobs` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobs |
| POST | `/company/v1/global/jobs` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobs |
| DELETE | `/company/v1/global/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobDetails |
| GET | `/company/v1/global/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobDetails |
| PATCH | `/company/v1/global/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobDetails |
| POST | `/company/v1/global/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobDetails |
| PUT | `/company/v1/global/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getMyJobDetails |
| GET | `/company/v1/global/jobs/:jobId/applicants` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getJobApplicants |
| PATCH | `/company/v1/global/jobs/:jobId/archive` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest |
| GET | `/company/v1/global/jobs/:jobId/audit-logs` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getJobAuditLogs |
| POST | `/company/v1/global/jobs/:jobId/clone` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, cloneJob |
| PATCH | `/company/v1/global/jobs/:jobId/pause` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest |
| PATCH | `/company/v1/global/jobs/:jobId/publish` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest |
| GET | `/company/v1/global/jobs/:jobId/recommended-employees` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getRecommendedEmployeesForJob |
| PATCH | `/company/v1/global/jobs/:jobId/restore` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest |
| PATCH | `/company/v1/global/jobs/:jobId/status` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, changeJobStatus |
| PATCH | `/company/v1/global/jobs/bulk` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, bulkUpdateJobs |
| GET | `/company/v1/global/jobs/statistics` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getJobsStatistics |
| GET | `/company/v1/global/me/basic-profile` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMyBasicCompanyProfile |
| PUT | `/company/v1/global/me/basic-profile` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMyBasicCompanyProfile |
| PUT | `/company/v1/global/me/image` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, validateRequest, updateMyCompanyUserProfile |
| GET | `/company/v1/global/members` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listMembers |
| POST | `/company/v1/global/members` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listMembers |
| DELETE | `/company/v1/global/members/:memberId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateMember |
| PATCH | `/company/v1/global/members/:memberId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateMember |
| GET | `/company/v1/global/message-templates` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listTemplates |
| POST | `/company/v1/global/message-templates` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listTemplates |
| DELETE | `/company/v1/global/message-templates/:templateId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateTemplate |
| PATCH | `/company/v1/global/message-templates/:templateId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateTemplate |
| GET | `/company/v1/global/profile` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMyCompanyProfile |
| PUT | `/company/v1/global/profile` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMyCompanyProfile |
| GET | `/company/v1/global/profile/:section` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMySection |
| POST | `/company/v1/global/profile/:section` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMySection |
| PUT | `/company/v1/global/profile/:section` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getMySection |
| DELETE | `/company/v1/global/profile/:section/:itemId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateSectionItem |
| PATCH | `/company/v1/global/profile/:section/:itemId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateSectionItem |
| PUT | `/company/v1/global/profile/about` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateCompanyAbout |
| GET | `/company/v1/global/profile/completion` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, getMyCompanyCompletion |
| PUT | `/company/v1/global/profile/contact` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateCompanyContact |
| GET | `/company/v1/global/profile/files` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, listCompanyFiles |
| POST | `/company/v1/global/profile/files` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, listCompanyFiles |
| DELETE | `/company/v1/global/profile/files/:filename` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, deleteCompanyFile |
| GET | `/company/v1/global/profile/files/:filename/download` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, downloadCompanyFile |
| PUT | `/company/v1/global/profile/location` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateCompanyLocation |
| PUT | `/company/v1/global/profile/media` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateCompanyMedia |
| POST | `/company/v1/global/profile/rebuild-search-filters` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, rebuildMyCompanySearchFilters |
| GET | `/company/v1/global/question-library` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listQuestions |
| POST | `/company/v1/global/question-library` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listQuestions |
| DELETE | `/company/v1/global/question-library/:questionId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateQuestion |
| PATCH | `/company/v1/global/question-library/:questionId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateQuestion |
| GET | `/company/v1/global/subscription` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getMySubscription |
| GET | `/company/v1/global/subscription/billing-summary` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getBillingSummary |
| GET | `/company/v1/global/subscription/current` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getMySubscription |
| GET | `/company/v1/global/subscription/invoices` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getMyInvoices |
| GET | `/company/v1/global/subscription/invoices/:invoiceId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getMyInvoiceDetails |
| POST | `/company/v1/global/subscription/request` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, requestPlanChange |
| GET | `/company/v1/global/support-tickets` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listTickets |
| POST | `/company/v1/global/support-tickets` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, listTickets |
| GET | `/company/v1/global/support-tickets/:ticketId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, getTicketDetails |
| POST | `/company/v1/global/support-tickets/:ticketId/messages` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, addTicketMessage |
| GET | `/company/v1/helper/cities` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, cities |
| GET | `/company/v1/helper/currencies` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, getCurrencies |
| GET | `/company/v1/helper/education-level` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, educationLevel |
| GET | `/company/v1/helper/experience-level` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, experienceLevel |
| GET | `/company/v1/helper/industry` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, industry |
| GET | `/company/v1/helper/job-name` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, anonymous |
| GET | `/company/v1/helper/job-types` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, getJobType |
| GET | `/company/v1/helper/languages` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, getLanguages |
| GET | `/company/v1/helper/salaries` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, salaryType |
| GET | `/company/v1/helper/services` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, services |
| GET | `/company/v1/helper/skills` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, skills |
| GET | `/company/v1/helper/work-mode` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, workMode |
| GET | `/company/v1/helper/work-time` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, multerMiddleware, workTime |
| GET | `/company/v1/interviews` | Review | none | anonymous, multerMiddleware, validateRequest, getInterviews |
| POST | `/company/v1/interviews` | Review | none | anonymous, multerMiddleware, validateRequest, getInterviews |
| GET | `/company/v1/interviews/:interviewId` | Review | none | anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| PATCH | `/company/v1/interviews/:interviewId` | Review | none | anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| POST | `/company/v1/interviews/:interviewId/cancel` | Review | none | anonymous, multerMiddleware, validateRequest, cancelInterview |
| POST | `/company/v1/interviews/:interviewId/feedback` | Review | none | anonymous, multerMiddleware, validateRequest, submitInterviewFeedback |
| POST | `/company/v1/interviews/:interviewId/mark-no-show` | Review | none | anonymous, multerMiddleware, validateRequest, markInterviewNoShow |
| POST | `/company/v1/interviews/:interviewId/send-reminder` | Review | none | anonymous, multerMiddleware, validateRequest, sendInterviewReminder |
| PATCH | `/company/v1/interviews/:interviewId/status` | Review | none | anonymous, multerMiddleware, validateRequest, changeInterviewStatus |
| GET | `/company/v1/jobs/hiring/:jobId/applicants` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getApplicants |
| GET | `/company/v1/jobs/hiring/:jobId/applications` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getJobApplications |
| POST | `/company/v1/jobs/hiring/:jobId/invitations` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, sendJobInvitation |
| GET | `/company/v1/jobs/hiring/applicants` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getApplicants |
| GET | `/company/v1/jobs/hiring/applications` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getJobApplications |
| GET | `/company/v1/jobs/hiring/applications/:applicationId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getApplicationDetails |
| PATCH | `/company/v1/jobs/hiring/applications/:applicationId/block-applicant` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, blockApplicationApplicant |
| GET | `/company/v1/jobs/hiring/applications/:applicationId/cv` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getApplicationCv |
| POST | `/company/v1/jobs/hiring/applications/:applicationId/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, createInterview |
| POST | `/company/v1/jobs/hiring/applications/:applicationId/messages` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, sendApplicationMessage |
| PATCH | `/company/v1/jobs/hiring/applications/:applicationId/restore` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, restoreApplication |
| PATCH | `/company/v1/jobs/hiring/applications/:applicationId/status` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, updateApplicationStatus |
| POST | `/company/v1/jobs/hiring/applications/bulk-cv` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, bulkApplicationCvs |
| POST | `/company/v1/jobs/hiring/applications/bulk-export` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, bulkExportApplications |
| GET | `/company/v1/jobs/hiring/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, createInterview |
| POST | `/company/v1/jobs/hiring/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, createInterview |
| GET | `/company/v1/jobs/hiring/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| PATCH | `/company/v1/jobs/hiring/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| POST | `/company/v1/jobs/hiring/interviews/:interviewId/cancel` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, cancelInterview |
| POST | `/company/v1/jobs/hiring/interviews/:interviewId/feedback` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, submitInterviewFeedback |
| POST | `/company/v1/jobs/hiring/interviews/:interviewId/mark-no-show` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, markInterviewNoShow |
| POST | `/company/v1/jobs/hiring/interviews/:interviewId/send-reminder` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, sendInterviewReminder |
| PATCH | `/company/v1/jobs/hiring/interviews/:interviewId/status` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, changeInterviewStatus |
| GET | `/company/v1/jobs/hiring/invitations` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, sendJobInvitation |
| POST | `/company/v1/jobs/hiring/invitations` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, sendJobInvitation |
| GET | `/company/v1/jobs/hiring/invitations/:invitationId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getJobInvitationDetails |
| PATCH | `/company/v1/jobs/hiring/invitations/:invitationId/cancel` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, cancelJobInvitation |
| GET | `/company/v1/jobs/hiring/pipeline` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getAtsPipeline |
| GET | `/company/v1/jobs/hiring/reviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getCompanyJobReviews |
| GET | `/company/v1/jobs/hiring/summary` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getHiringSummary |
| GET | `/company/v1/jobs/hiring/talent-pool` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getTalentPool |
| GET | `/company/v1/jobs/talent/:jobId/employees/:employeeId/match` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, matchEmployeeWithJob |
| GET | `/company/v1/jobs/talent/:jobId/help-requests` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, requestJobZainTalentHelp |
| POST | `/company/v1/jobs/talent/:jobId/help-requests` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, requestJobZainTalentHelp |
| GET | `/company/v1/jobs/talent/:jobId/smart-employees` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getSmartEmployeesForJob |
| POST | `/company/v1/jobs/talent/:jobId/smart-employees/generate` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, generateSmartEmployeesForJob |
| GET | `/company/v1/jobs/talent/employees` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, searchEmployees |
| GET | `/company/v1/jobs/talent/employees/:employeeId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getEmployeeDetails |
| GET | `/company/v1/jobs/talent/help-requests` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, requestJobZainTalentHelp |
| POST | `/company/v1/jobs/talent/help-requests` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, requestJobZainTalentHelp |
| GET | `/company/v1/jobs/talent/help-requests/:requestId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, getJobZainTalentRequestDetails |
| PATCH | `/company/v1/jobs/talent/help-requests/:requestId/cancel` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, cancelJobZainTalentRequest |
| GET | `/company/v1/profile/public` | Review | none | anonymous, validateRequest, getPublicProfile |
| PATCH | `/company/v1/profile/public` | Review | none | anonymous, validateRequest, getPublicProfile |
| POST | `/company/v1/profile/public/preview` | Review | none | anonymous, multerMiddleware, validateRequest, previewPublicProfile |
| POST | `/company/v1/profile/public/submit-review` | Review | none | anonymous, multerMiddleware, validateRequest, submitPublicProfileReview |
| POST | `/company/v1/salary-insights/check` | Review | none | jsonParser, validateRequest, companyCheck |
| GET | `/company/v1/salary-insights/suggest` | Review | none | validateRequest, companySuggest |
| GET | `/company/v1/settings` | Review | none | validateRequest, getCompanySettings |
| PATCH | `/company/v1/settings` | Review | none | validateRequest, getCompanySettings |
| PUT | `/company/v1/settings` | Review | none | validateRequest, getCompanySettings |
| GET | `/company/v1/talent-pool` | Review | none | anonymous, multerMiddleware, validateRequest, listTalentPool |
| POST | `/company/v1/talent-pool/candidates` | Review | none | anonymous, multerMiddleware, validateRequest, saveCandidate |
| DELETE | `/company/v1/talent-pool/candidates/:id` | Review | none | anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| GET | `/company/v1/talent-pool/candidates/:id` | Review | none | anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| PATCH | `/company/v1/talent-pool/candidates/:id` | Review | none | anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| POST | `/company/v1/talent-pool/candidates/:id/do-not-contact` | Review | none | anonymous, multerMiddleware, validateRequest, markDoNotContact |
| POST | `/company/v1/talent-pool/candidates/:id/invite-to-job` | Review | none | anonymous, multerMiddleware, validateRequest, inviteCandidateToJob |
| GET | `/company/v1/talent-pool/candidates/:id/notes` | Review | none | anonymous, multerMiddleware, validateRequest, addCandidateNote |
| POST | `/company/v1/talent-pool/candidates/:id/notes` | Review | none | anonymous, multerMiddleware, validateRequest, addCandidateNote |
| POST | `/company/v1/talent-pool/candidates/:id/tags` | Review | none | anonymous, multerMiddleware, validateRequest, addCandidateTags |
| DELETE | `/company/v1/talent-pool/candidates/:id/tags/:tag` | Review | none | anonymous, multerMiddleware, validateRequest, removeCandidateTag |
| GET | `/company/v1/talent-pool/search` | Review | none | anonymous, multerMiddleware, validateRequest, listTalentPool |

## Files

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/cv/generated/:fileName` | Public/system | none | anonymous |

## Health

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/health` | Public/system | none | protectHealth, anonymous |
| GET | `/health/live` | Public/system | none | anonymous |
| GET | `/health/ready` | Public/system | none | anonymous |

## Jobs

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/jobs/v1/:jobId/translations/:lang` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, saveJobTranslation |
| PUT | `/jobs/v1/:jobId/translations/:lang` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, saveJobTranslation |

## Legacy User

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| POST | `/user/v1/account/delete-request` | Bearer token | explicit | authUser, jsonParser, validateRequest, requestAccountDeletion |
| POST | `/user/v1/account/delete-request/cancel` | Bearer token | explicit | authUser, validateRequest, cancelAccountDeletion |
| GET | `/user/v1/account/export` | Bearer token | explicit | authUser, exportMyData |
| GET | `/user/v1/app/dashboard` | Bearer token | explicit | authUser, getMyAppDashboardOverview |
| GET | `/user/v1/app/dashboard/overview` | Bearer token | explicit | authUser, getMyAppDashboardOverview |
| GET | `/user/v1/applying-job/get` | Bearer token | explicit | authUser, anonymous, getAppliedJobs |
| POST | `/user/v1/applying-job/insert/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, applyJob |
| GET | `/user/v1/applying-job/readiness/:id` | Bearer token | explicit | authUser, anonymous, getApplyReadiness |
| POST | `/user/v1/auth/campus/register` | Public/system | none | multerMiddleware, validateRequest, campusRegister |
| POST | `/user/v1/auth/campus/university-login` | Public/system | none | multerMiddleware, validateRequest, universityLogin |
| POST | `/user/v1/auth/forgot-password` | Public/system | none | validateRequest, forgotPassword |
| POST | `/user/v1/auth/login` | Public/system | none | multerMiddleware, validateRequest, login |
| POST | `/user/v1/auth/logout` | Public/system | none | multerMiddleware, validateRequest, logout |
| POST | `/user/v1/auth/logout-all` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, logoutAll |
| POST | `/user/v1/auth/passcode-forgot-password` | Public/system | none | validateRequest, passcodeVerify |
| POST | `/user/v1/auth/passcode-verify` | Public/system | none | validateRequest, passcodeVerify |
| POST | `/user/v1/auth/refresh-token` | Public/system | none | multerMiddleware, validateRequest, refreshToken |
| POST | `/user/v1/auth/register` | Public/system | none | multerMiddleware, validateRequest, register |
| POST | `/user/v1/auth/resend-otp` | Public/system | none | validateRequest, resendOtp |
| POST | `/user/v1/auth/resetPassword` | Public/system | none | validateRequest, resetPassword |
| POST | `/user/v1/auth/update-image` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, updateImage |
| POST | `/user/v1/auth/update-profile` | Bearer token | explicit | authUser, validateRequest, updateProfile |
| GET | `/user/v1/banner/get` | Public/system | none | get |
| GET | `/user/v1/career-passport` | Bearer token | explicit | authUser, anonymous, validateRequest, get |
| PUT | `/user/v1/career-passport` | Bearer token | explicit | authUser, anonymous, validateRequest, get |
| POST | `/user/v1/career-passport/share` | Bearer token | explicit | authUser, anonymous, jsonParser, validateRequest, share |
| GET | `/user/v1/career-passport/share/:token` | Public/system | none | shared |
| POST | `/user/v1/communication/manual-whatsapp-link` | Review | none | jsonParser, validateRequest, createManualWhatsappLink |
| GET | `/user/v1/communication/preferences` | Review | none | validateRequest, getPreferences |
| PATCH | `/user/v1/communication/preferences` | Review | none | validateRequest, getPreferences |
| PUT | `/user/v1/communication/preferences` | Review | none | validateRequest, getPreferences |
| GET | `/user/v1/company-jobs-profile/job-details/:id` | Bearer token | explicit | authUser, anonymous, getJobDetails |
| GET | `/user/v1/company-jobs-profile/profile-jobs` | Bearer token | explicit | authUser, anonymous, companyData |
| POST | `/user/v1/company/delete-file` | Bearer token | explicit | authUser, validateRequest, deleteFile |
| GET | `/user/v1/company/download-file` | Bearer token | explicit | authUser, downloadFile |
| GET | `/user/v1/company/get-files` | Bearer token | explicit | authUser, getFileLinks |
| POST | `/user/v1/company/join-request` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, joinRequest |
| GET | `/user/v1/company/my-company` | Bearer token | explicit | authUser, get |
| GET | `/user/v1/company/public/:companyId` | Review | none | companyDetails |
| POST | `/user/v1/company/update-my-company` | Bearer token | explicit | authUser, validateRequest, update |
| POST | `/user/v1/company/update-my-company-image` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, updateImage |
| POST | `/user/v1/company/upload-file` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, uploadFile |
| GET | `/user/v1/cv/translations/:lang` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, saveCvTranslation |
| PUT | `/user/v1/cv/translations/:lang` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, saveCvTranslation |
| GET | `/user/v1/employee/profile-get` | Bearer token | explicit | authUser, anonymous, multerMiddleware, profile |
| POST | `/user/v1/employee/profile-update` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, update |
| POST | `/user/v1/fcm/delete-tokens/:id` | Bearer token | explicit | authUser, validateRequest, deleteToken |
| GET | `/user/v1/fcm/tokens` | Bearer token | explicit | authUser, validateRequest, listTokens |
| POST | `/user/v1/fcm/tokens` | Bearer token | explicit | authUser, validateRequest, listTokens |
| POST | `/user/v1/fcm/update-tokens/:id` | Bearer token | explicit | authUser, jsonParser, validateRequest, updateToken |
| GET | `/user/v1/global/cities` | Public/system | none | countries |
| GET | `/user/v1/global/countries` | Public/system | none | countries |
| GET | `/user/v1/global/currencies` | Public/system | none | currencies |
| GET | `/user/v1/global/currency` | Public/system | none | currencies |
| GET | `/user/v1/global/work-mode` | Public/system | none | workModes |
| GET | `/user/v1/global/work-modes` | Public/system | none | workModes |
| POST | `/user/v1/handle-applied-job/change-job-status/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, changeStatus |
| POST | `/user/v1/handle-applied-job/send-interview/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, SendInterView |
| GET | `/user/v1/helper/cities` | Public/system | none | anonymous |
| GET | `/user/v1/helper/city-search` | Public/system | none | anonymous |
| GET | `/user/v1/helper/countries` | Public/system | none | anonymous |
| GET | `/user/v1/helper/country` | Public/system | none | anonymous |
| GET | `/user/v1/helper/country-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/country-search` | Public/system | none | anonymous |
| GET | `/user/v1/helper/currencies` | Public/system | none | anonymous |
| GET | `/user/v1/helper/currency` | Public/system | none | anonymous |
| GET | `/user/v1/helper/currency-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/currency-search` | Public/system | none | anonymous |
| GET | `/user/v1/helper/education-level` | Public/system | none | anonymous |
| GET | `/user/v1/helper/education-levels` | Public/system | none | anonymous |
| GET | `/user/v1/helper/experience-level` | Public/system | none | anonymous |
| GET | `/user/v1/helper/experience-levels` | Public/system | none | anonymous |
| GET | `/user/v1/helper/industries` | Public/system | none | anonymous |
| GET | `/user/v1/helper/industry` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-location` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-location-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-name` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-names` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-salaries` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-salary` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-salary-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-search` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-service` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-service-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-services` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-time` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-time-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-type` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-type-get` | Public/system | none | anonymous |
| GET | `/user/v1/helper/job-types` | Public/system | none | anonymous |
| GET | `/user/v1/helper/language` | Public/system | none | anonymous |
| GET | `/user/v1/helper/language-search` | Public/system | none | anonymous |
| GET | `/user/v1/helper/languages` | Public/system | none | anonymous |
| GET | `/user/v1/helper/salaries` | Public/system | none | anonymous |
| GET | `/user/v1/helper/services` | Public/system | none | anonymous |
| GET | `/user/v1/helper/skill` | Public/system | none | anonymous |
| GET | `/user/v1/helper/skill-search` | Public/system | none | anonymous |
| GET | `/user/v1/helper/skills` | Public/system | none | anonymous |
| GET | `/user/v1/helper/work-location` | Public/system | none | anonymous |
| GET | `/user/v1/helper/work-locations` | Public/system | none | anonymous |
| GET | `/user/v1/helper/work-mode` | Public/system | none | anonymous |
| GET | `/user/v1/helper/work-modes` | Public/system | none | anonymous |
| GET | `/user/v1/helper/work-time` | Public/system | none | anonymous |
| GET | `/user/v1/helper/work-times` | Public/system | none | anonymous |
| GET | `/user/v1/interview-prep` | Bearer token | explicit | authUser, anonymous, validateRequest, overview |
| PATCH | `/user/v1/interview-prep/checklists/:id/progress` | Bearer token | explicit | authUser, anonymous, validateRequest, updateChecklistProgress |
| GET | `/user/v1/interview-prep/jobs/:jobId` | Bearer token | explicit | authUser, anonymous, validateRequest, jobPrep |
| GET | `/user/v1/interview-prep/questions` | Bearer token | explicit | authUser, anonymous, validateRequest, questions |
| POST | `/user/v1/interview-prep/questions/:id/save-note` | Bearer token | explicit | authUser, anonymous, validateRequest, saveQuestionNote |
| GET | `/user/v1/job-alerts/logs` | Bearer token | explicit | authUser, anonymous, validateRequest, listAlertLogs |
| POST | `/user/v1/job-information/apply-outside/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, applyOutsideJob |
| GET | `/user/v1/job-information/list-job-reviews/:id` | Public/system | none | listJobReviews |
| GET | `/user/v1/job-information/list-job-savers/:id` | Bearer token | explicit | authUser, anonymous, listJobSavers |
| POST | `/user/v1/job-information/rate-job/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, rateJob |
| GET | `/user/v1/job-information/recompute-job-rating-breakdown/:id` | Bearer token | explicit | authUser, anonymous, recomputeJobRatingBreakdown |
| POST | `/user/v1/job-information/report-job/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, reportJob |
| POST | `/user/v1/job-information/review-job/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, reviewJob |
| POST | `/user/v1/job-information/toggle-save-job/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, toggleSaveJob |
| GET | `/user/v1/job-profile/get-applied-jobs` | Bearer token | explicit | authUser, anonymous, getAppliedJobs |
| GET | `/user/v1/job-profile/get-interviewed-jobs` | Bearer token | explicit | authUser, anonymous, getInterviewedJobs |
| GET | `/user/v1/job-profile/get-saved-job` | Bearer token | explicit | authUser, anonymous, getSavedJob |
| GET | `/user/v1/job-profile/get-user-job-counts` | Bearer token | explicit | authUser, anonymous, getUserJobCounts |
| GET | `/user/v1/job-result/get-by-id/:id` | Bearer token | explicit | authUser, anonymous, getJobById |
| GET | `/user/v1/job-result/get-created-job` | Bearer token | explicit | authUser, anonymous, getCreatedJobs |
| GET | `/user/v1/job-result/get-job-applicant/:id` | Bearer token | explicit | authUser, anonymous, getJobApplicants |
| GET | `/user/v1/job-result/get-job-rating/:id` | Bearer token | explicit | authUser, anonymous, getJobRatingStats |
| GET | `/user/v1/job-result/get-job-review/:id` | Bearer token | explicit | authUser, anonymous, getJobReviews |
| GET | `/user/v1/job-result/get-job-savers/:id` | Bearer token | explicit | authUser, anonymous, getJobSavers |
| POST | `/user/v1/job/create` | Bearer token | explicit | authUser, anonymous, validateRequest, create |
| GET | `/user/v1/job/get` | Public/system | none | optionalAuthUser, get |
| GET | `/user/v1/job/get-by-id/:id` | Public/system | none | optionalAuthUser, getById |
| GET | `/user/v1/job/get-filters` | Public/system | none | optionalAuthUser, getFilters |
| GET | `/user/v1/job/get-popular` | Public/system | none | optionalAuthUser, get |
| GET | `/user/v1/job/get-single-job/:id` | Public/system | none | optionalAuthUser, getById |
| GET | `/user/v1/job/job-role` | Bearer token | explicit | authUser, anonymous, whatIsMyRole |
| POST | `/user/v1/job/update/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, update |
| GET | `/user/v1/keyword/get` | Public/system | none | get |
| GET | `/user/v1/legal-reports` | Public/system | none | optionalAuthUser, jsonParser, validateRequest, createReport |
| POST | `/user/v1/legal-reports` | Public/system | none | optionalAuthUser, jsonParser, validateRequest, createReport |
| GET | `/user/v1/legal-reports/:id` | Bearer token | explicit | authUser, getReport |
| POST | `/user/v1/me/active-context` | Bearer token | explicit | authUser, jsonParser, validateRequest, setActiveContext |
| GET | `/user/v1/me/contexts` | Bearer token | explicit | authUser, listContexts |
| GET | `/user/v1/me/permissions` | Bearer token | explicit | authUser, permissions |
| GET | `/user/v1/notification` | Bearer token | explicit | authUser, list |
| DELETE | `/user/v1/notification/:id` | Bearer token | explicit | authUser, validateRequest, remove |
| POST | `/user/v1/notification/:id/delete` | Bearer token | explicit | authUser, validateRequest, remove |
| PATCH | `/user/v1/notification/:id/read` | Bearer token | explicit | authUser, validateRequest, markRead |
| POST | `/user/v1/notification/:id/read` | Bearer token | explicit | authUser, validateRequest, markRead |
| PATCH | `/user/v1/notification/:id/unread` | Bearer token | explicit | authUser, validateRequest, markUnread |
| POST | `/user/v1/notification/:id/unread` | Bearer token | explicit | authUser, validateRequest, markUnread |
| GET | `/user/v1/notification/get` | Bearer token | explicit | authUser, list |
| GET | `/user/v1/notification/preferences` | Bearer token | explicit | authUser, validateRequest, getPreferences |
| PATCH | `/user/v1/notification/preferences` | Bearer token | explicit | authUser, validateRequest, getPreferences |
| PUT | `/user/v1/notification/preferences` | Bearer token | explicit | authUser, validateRequest, getPreferences |
| PATCH | `/user/v1/notification/read-all` | Bearer token | explicit | authUser, validateRequest, markAllRead |
| POST | `/user/v1/notification/read-all` | Bearer token | explicit | authUser, validateRequest, markAllRead |
| GET | `/user/v1/notification/unread-count` | Bearer token | explicit | authUser, unreadCount |
| GET | `/user/v1/notifications` | Bearer token | explicit | authUser, list |
| DELETE | `/user/v1/notifications/:id` | Bearer token | explicit | authUser, validateRequest, remove |
| POST | `/user/v1/notifications/:id/delete` | Bearer token | explicit | authUser, validateRequest, remove |
| PATCH | `/user/v1/notifications/:id/read` | Bearer token | explicit | authUser, validateRequest, markRead |
| POST | `/user/v1/notifications/:id/read` | Bearer token | explicit | authUser, validateRequest, markRead |
| PATCH | `/user/v1/notifications/:id/unread` | Bearer token | explicit | authUser, validateRequest, markUnread |
| POST | `/user/v1/notifications/:id/unread` | Bearer token | explicit | authUser, validateRequest, markUnread |
| GET | `/user/v1/notifications/get` | Bearer token | explicit | authUser, list |
| GET | `/user/v1/notifications/preferences` | Bearer token | explicit | authUser, validateRequest, getPreferences |
| PATCH | `/user/v1/notifications/preferences` | Bearer token | explicit | authUser, validateRequest, getPreferences |
| PUT | `/user/v1/notifications/preferences` | Bearer token | explicit | authUser, validateRequest, getPreferences |
| PATCH | `/user/v1/notifications/read-all` | Bearer token | explicit | authUser, validateRequest, markAllRead |
| POST | `/user/v1/notifications/read-all` | Bearer token | explicit | authUser, validateRequest, markAllRead |
| GET | `/user/v1/notifications/unread-count` | Bearer token | explicit | authUser, unreadCount |
| GET | `/user/v1/page/details/:key` | Public/system | none | details |
| GET | `/user/v1/page/get` | Public/system | none | get |
| POST | `/user/v1/privacy/accessibility` | Public/system | none | optionalAuthUser, jsonParser, validateRequest, createAccessibilityRequest |
| GET | `/user/v1/privacy/consents` | Bearer token | explicit | authUser, listConsents |
| POST | `/user/v1/privacy/consents/:pageKey/acknowledge` | Bearer token | explicit | authUser, jsonParser, validateRequest, acknowledgePolicy |
| POST | `/user/v1/privacy/consents/:purpose` | Bearer token | explicit | authUser, jsonParser, validateRequest, setConsent |
| GET | `/user/v1/privacy/requests` | Bearer token | explicit | authUser, jsonParser, validateRequest, createPrivacyRequest |
| POST | `/user/v1/privacy/requests` | Bearer token | explicit | authUser, jsonParser, validateRequest, createPrivacyRequest |
| GET | `/user/v1/resources` | Bearer token | explicit | authUser, anonymous, validateRequest, listResources |
| POST | `/user/v1/resources/:id/complete` | Bearer token | explicit | authUser, anonymous, validateRequest, completeResource |
| PATCH | `/user/v1/resources/:id/progress` | Bearer token | explicit | authUser, anonymous, validateRequest, updateProgress |
| DELETE | `/user/v1/resources/:id/save` | Bearer token | explicit | authUser, anonymous, validateRequest, saveResource |
| POST | `/user/v1/resources/:id/save` | Bearer token | explicit | authUser, anonymous, validateRequest, saveResource |
| GET | `/user/v1/resources/:idOrSlug` | Bearer token | explicit | authUser, anonymous, validateRequest, getResource |
| GET | `/user/v1/resources/me/progress` | Bearer token | explicit | authUser, anonymous, validateRequest, myProgress |
| GET | `/user/v1/resources/recommended` | Bearer token | explicit | authUser, anonymous, validateRequest, recommendedResources |
| GET | `/user/v1/salary-insights` | Review | none | validateRequest, userInsight |
| GET | `/user/v1/salary-insights/jobs/:jobId` | Review | none | validateRequest, userJobInsight |
| GET | `/user/v1/saved-searches` | Bearer token | explicit | authUser, anonymous, validateRequest, listSavedSearches |
| POST | `/user/v1/saved-searches` | Bearer token | explicit | authUser, anonymous, validateRequest, listSavedSearches |
| DELETE | `/user/v1/saved-searches/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, getSavedSearch |
| GET | `/user/v1/saved-searches/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, getSavedSearch |
| PATCH | `/user/v1/saved-searches/:id` | Bearer token | explicit | authUser, anonymous, validateRequest, getSavedSearch |
| POST | `/user/v1/saved-searches/:id/run-now` | Bearer token | explicit | authUser, anonymous, validateRequest, runSavedSearchNow |
| GET | `/user/v1/settings` | Bearer token | explicit | authUser, validateRequest, getUserSettings |
| PATCH | `/user/v1/settings` | Bearer token | explicit | authUser, validateRequest, getUserSettings |
| PUT | `/user/v1/settings` | Bearer token | explicit | authUser, validateRequest, getUserSettings |
| GET | `/user/v1/support/tickets` | Bearer token | explicit | authUser, jsonParser, validateRequest, createTicket |
| POST | `/user/v1/support/tickets` | Bearer token | explicit | authUser, jsonParser, validateRequest, createTicket |
| GET | `/user/v1/support/tickets/:id` | Bearer token | explicit | authUser, getTicket |
| PATCH | `/user/v1/support/tickets/:id/close` | Bearer token | explicit | authUser, validateRequest, closeTicket |
| POST | `/user/v1/support/tickets/:id/close` | Bearer token | explicit | authUser, validateRequest, closeTicket |
| POST | `/user/v1/support/tickets/:id/messages` | Bearer token | explicit | authUser, jsonParser, validateRequest, addMessage |

## Notifications

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/notifications/v1` | Bearer token | inferred-parent-mount | inferred:authUser, list |
| DELETE | `/notifications/v1/:id` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, remove |
| POST | `/notifications/v1/:id/delete` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, remove |
| PATCH | `/notifications/v1/:id/read` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markRead |
| POST | `/notifications/v1/:id/read` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markRead |
| PATCH | `/notifications/v1/:id/unread` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markUnread |
| POST | `/notifications/v1/:id/unread` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markUnread |
| DELETE | `/notifications/v1/device-token` | Bearer token | inferred-parent-mount | inferred:authUser, jsonParser, validateRequest, registerToken |
| POST | `/notifications/v1/device-token` | Bearer token | inferred-parent-mount | inferred:authUser, jsonParser, validateRequest, registerToken |
| DELETE | `/notifications/v1/device-token/:id` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, deleteDeviceToken |
| POST | `/notifications/v1/device-token/delete` | Bearer token | inferred-parent-mount | inferred:authUser, jsonParser, validateRequest, deleteDeviceToken |
| GET | `/notifications/v1/list` | Bearer token | inferred-parent-mount | inferred:authUser, list |
| GET | `/notifications/v1/preferences` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, getPreferences |
| PATCH | `/notifications/v1/preferences` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, getPreferences |
| PUT | `/notifications/v1/preferences` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, getPreferences |
| PATCH | `/notifications/v1/read` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markRead |
| POST | `/notifications/v1/read` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markRead |
| PATCH | `/notifications/v1/read-all` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markRead |
| POST | `/notifications/v1/read-all` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, markRead |
| GET | `/notifications/v1/unread-count` | Bearer token | inferred-parent-mount | inferred:authUser, unreadCount |

## Other

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/public/v1/client-settings` | Public/system | none | getClientSettings |
| GET | `/public/v1/companies` | Public/system | none | listCompanies |
| GET | `/public/v1/companies/:slugOrId` | Public/system | none | getCompany |
| GET | `/public/v1/companies/:slugOrId/jobs` | Public/system | none | getCompanyJobs |
| GET | `/public/v1/companies/:slugOrId/reviews` | Public/system | none | getCompanyReviews |
| GET | `/public/v1/content/pages` | Public/system | none | listPages |
| GET | `/public/v1/content/pages/:key` | Public/system | none | getPage |
| GET | `/public/v1/faq` | Public/system | none | listFaq |
| GET | `/public/v1/help/articles` | Public/system | none | listHelpArticles |
| GET | `/public/v1/help/articles/:key` | Public/system | none | getHelpArticle |
| GET | `/public/v1/help/categories` | Public/system | none | listHelpCategories |
| GET | `/public/v1/legal/:key` | Public/system | none | getPage |
| GET | `/public/v1/salary-insights` | Public/system | none | publicInsight |
| GET | `/public/v1/salary-insights/:titleSlug` | Public/system | none | publicInsightByTitle |
| GET | `/public/v1/settings/client` | Public/system | none | getClientSettings |

## Seeker

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/employee/v1/applications` | Bearer token | explicit | authUser, anonymous, myApplications |
| GET | `/employee/v1/applications/:applicationId` | Bearer token | explicit | authUser, anonymous, getMyApplicationDetails |
| PATCH | `/employee/v1/applications/:applicationId/cancel` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, cancelMyApplication |
| POST | `/employee/v1/applications/:applicationId/cancel` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, cancelMyApplication |
| POST | `/employee/v1/applications/:applicationId/messages` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, addApplicationMessage |
| GET | `/employee/v1/applications/interviews` | Bearer token | explicit | authUser, anonymous, myInterviews |
| GET | `/employee/v1/applications/interviews/:interviewId` | Bearer token | explicit | authUser, anonymous, validateRequest, getMyInterviewDetails |
| POST | `/employee/v1/applications/interviews/:interviewId/reschedule-request` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, requestInterviewReschedule |
| PATCH | `/employee/v1/applications/interviews/:interviewId/respond` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, respondToInterview |
| POST | `/employee/v1/applications/interviews/:interviewId/respond` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, respondToInterview |
| GET | `/employee/v1/applications/offers` | Bearer token | explicit | authUser, anonymous, myJobInvitations |
| PATCH | `/employee/v1/applications/offers/:invitationId/respond` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, respondToJobInvitation |
| POST | `/employee/v1/applications/offers/:invitationId/respond` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, respondToJobInvitation |
| POST | `/employee/v1/auth/login` | Public/system | none | multerMiddleware, validateRequest, login |
| GET | `/employee/v1/companies` | Bearer token | explicit | authUser, anonymous, browseCompanies |
| GET | `/employee/v1/companies/:companyId` | Bearer token | explicit | authUser, anonymous, companyDetails |
| POST | `/employee/v1/companies/:companyId/review` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, reviewCompany |
| GET | `/employee/v1/companies/activity` | Bearer token | explicit | authUser, anonymous, companiesFromMyActivity |
| GET | `/employee/v1/companies/applied` | Bearer token | explicit | authUser, anonymous, companiesIAppliedTo |
| GET | `/employee/v1/companies/saved-jobs` | Bearer token | explicit | authUser, anonymous, companiesFromSavedJobs |
| GET | `/employee/v1/companies/viewed` | Bearer token | explicit | authUser, anonymous, companiesViewedByMe |
| POST | `/employee/v1/cv/:cvId/cover-letter/download` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, downloadCoverLetter |
| POST | `/employee/v1/cv/:cvId/cover-letter/preview` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, previewCoverLetter |
| GET | `/employee/v1/cv/:cvId/cover-letter/templates` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getCoverLetterTemplates |
| POST | `/employee/v1/cv/:cvId/duplicate` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, duplicateCv |
| POST | `/employee/v1/cv/:cvId/quality-score` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, scoreCvQuality |
| POST | `/employee/v1/cv/:cvId/set-default` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, setDefaultCv |
| PATCH | `/employee/v1/cv/:cvId/visibility` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, updateVisibility |
| GET | `/employee/v1/cv/download/:cvId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, downloadSavedCv |
| POST | `/employee/v1/cv/generate/download` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, downloadMyCv |
| POST | `/employee/v1/cv/generate/download-url` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, createMyCvDownloadUrl |
| POST | `/employee/v1/cv/generate/preview` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, previewMyCv |
| POST | `/employee/v1/cv/generate/save` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, saveMyCvSettings |
| GET | `/employee/v1/cv/generate/templates` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getCvTemplatesPublic |
| GET | `/employee/v1/cv/parse/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getParseJob |
| POST | `/employee/v1/cv/parse/jobs/:jobId/confirm` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, confirmParseJob |
| GET | `/employee/v1/cv/parse/jobs/:jobId/preview` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, previewParseJob |
| POST | `/employee/v1/cv/parse/jobs/:jobId/reject` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, rejectParseJob |
| POST | `/employee/v1/cv/parse/upload` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, parseUpload |
| POST | `/employee/v1/cv/upload` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, uploadMyCv |
| PUT | `/employee/v1/cv/upload/:cvId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, setActiveCv |
| GET | `/employee/v1/cv/uploaded` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getMyUploadedCvs |
| DELETE | `/employee/v1/cv/uploaded/:cvId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, deleteMyUploadedCv |
| GET | `/employee/v1/global` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getEmployeeDashboard |
| GET | `/employee/v1/global/applications` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, myApplications |
| GET | `/employee/v1/global/applications/:applicationId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getMyApplicationDetails |
| PATCH | `/employee/v1/global/applications/:applicationId/cancel` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, cancelMyApplication |
| POST | `/employee/v1/global/applications/:applicationId/messages` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, addApplicationMessage |
| GET | `/employee/v1/global/applications/applied` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, myApplications |
| GET | `/employee/v1/global/applications/interviews` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, myInterviews |
| GET | `/employee/v1/global/applications/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMyInterviewDetails |
| POST | `/employee/v1/global/applications/interviews/:interviewId/reschedule-request` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, requestInterviewReschedule |
| PATCH | `/employee/v1/global/applications/interviews/:interviewId/respond` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, respondToInterview |
| GET | `/employee/v1/global/applications/offers` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, myJobInvitations |
| GET | `/employee/v1/global/applications/offers/:invitationId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getMyJobInvitationDetails |
| PATCH | `/employee/v1/global/applications/offers/:invitationId/reject` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, anonymous |
| PATCH | `/employee/v1/global/applications/offers/:invitationId/respond` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, respondToJobInvitation |
| GET | `/employee/v1/global/applications/rejected` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, myRejectedApplications |
| GET | `/employee/v1/global/applications/status` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, myApplications |
| GET | `/employee/v1/global/companies` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, browseCompanies |
| GET | `/employee/v1/global/companies/:companyId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, companyDetails |
| POST | `/employee/v1/global/companies/:companyId/review` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, reviewCompany |
| GET | `/employee/v1/global/companies/activity` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, companiesFromMyActivity |
| GET | `/employee/v1/global/companies/applied` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, companiesIAppliedTo |
| GET | `/employee/v1/global/companies/saved-jobs` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, companiesFromSavedJobs |
| GET | `/employee/v1/global/companies/viewed` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, companiesViewedByMe |
| GET | `/employee/v1/global/jobs` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, browseJobs |
| GET | `/employee/v1/global/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getJobDetails |
| POST | `/employee/v1/global/jobs/:jobId/apply` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, applyToJob |
| POST | `/employee/v1/global/jobs/:jobId/rate` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, rateJob |
| POST | `/employee/v1/global/jobs/:jobId/review` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, reviewJob |
| DELETE | `/employee/v1/global/jobs/:jobId/save` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, saveJob |
| POST | `/employee/v1/global/jobs/:jobId/save` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, saveJob |
| GET | `/employee/v1/global/jobs/recommended` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, recommendedJobs |
| GET | `/employee/v1/global/jobs/saved` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, savedJobs |
| GET | `/employee/v1/global/me/basic-profile` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMyBasicProfile |
| PUT | `/employee/v1/global/me/basic-profile` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMyBasicProfile |
| GET | `/employee/v1/global/profile` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMyEmployeeProfile |
| PUT | `/employee/v1/global/profile` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMyEmployeeProfile |
| GET | `/employee/v1/global/profile/:section` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMySection |
| POST | `/employee/v1/global/profile/:section` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMySection |
| PUT | `/employee/v1/global/profile/:section` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, validateRequest, getMySection |
| DELETE | `/employee/v1/global/profile/:section/:itemId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, updateSectionItem |
| PATCH | `/employee/v1/global/profile/:section/:itemId` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, updateSectionItem |
| PUT | `/employee/v1/global/profile/about-me` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, updateAboutMe |
| GET | `/employee/v1/global/profile/completion` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, getMyEmployeeCompletion |
| PUT | `/employee/v1/global/profile/job-names` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, replaceJobNames |
| PUT | `/employee/v1/global/profile/job-types` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, replaceJobTypes |
| PUT | `/employee/v1/global/profile/latest-work-experience` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, updateLatestWorkExperience |
| PUT | `/employee/v1/global/profile/min-salary` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, replaceMinSalary |
| POST | `/employee/v1/global/profile/rebuild-search-filters` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, rebuildMySearchFilters |
| PUT | `/employee/v1/global/profile/work-preferences` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, validateRequest, updateWorkPreferences |
| GET | `/employee/v1/helper/cities` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, cities |
| GET | `/employee/v1/helper/currencies` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, getCurrencies |
| GET | `/employee/v1/helper/education-level` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, educationLevel |
| GET | `/employee/v1/helper/experience-level` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, experienceLevel |
| GET | `/employee/v1/helper/industry` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, industry |
| GET | `/employee/v1/helper/job-name` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, anonymous |
| GET | `/employee/v1/helper/job-types` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, getJobType |
| GET | `/employee/v1/helper/languages` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, getLanguages |
| GET | `/employee/v1/helper/salaries` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, salaryType |
| GET | `/employee/v1/helper/services` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, services |
| GET | `/employee/v1/helper/skills` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, skills |
| GET | `/employee/v1/helper/work-mode` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, workMode |
| GET | `/employee/v1/helper/work-time` | Bearer token | inferred-parent-mount | inferred:employeeAccountGuard, multerMiddleware, workTime |
| POST | `/employee/v1/jobs/:jobId/apply` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, applyToJob |
| POST | `/employee/v1/jobs/:jobId/rate` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, rateJob |
| POST | `/employee/v1/jobs/:jobId/review` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, reviewJob |
| DELETE | `/employee/v1/jobs/:jobId/save` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, saveJob |
| POST | `/employee/v1/jobs/:jobId/save` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, saveJob |

## Trust

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| PATCH | `/trust/v1/jobs/:jobId/documents` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, submitJobDocuments |
| POST | `/trust/v1/jobs/:jobId/documents` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, submitJobDocuments |
| POST | `/trust/v1/jobs/:jobId/report` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, reportJob |
| POST | `/trust/v1/jobs/:jobId/score` | Bearer token | explicit | authUser, anonymous, multerMiddleware, validateRequest, scoreJob |

## University

| Method | Path | Auth | Guard source | Middleware/guards |
| --- | --- | --- | --- | --- |
| GET | `/university/v1/analytics/employability` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityEmployabilityAnalytics |
| GET | `/university/v1/analytics/outcomes` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityOutcomeReport |
| GET | `/university/v1/analytics/readiness` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityEmployabilityAnalytics |
| GET | `/university/v1/analytics/resources` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, universityResourceAnalytics |
| GET | `/university/v1/dashboard` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityOverview |
| GET | `/university/v1/dashboard/overview` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityOverview |
| GET | `/university/v1/employer-partners` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityPartners |
| GET | `/university/v1/members` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityMembers |
| POST | `/university/v1/members` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityMembers |
| DELETE | `/university/v1/members/:memberId` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityMember |
| PATCH | `/university/v1/members/:memberId` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityMember |
| GET | `/university/v1/opportunities` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, userUniversityOpportunities |
| POST | `/university/v1/opportunities` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, userUniversityOpportunities |
| GET | `/university/v1/overview` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityOverview |
| GET | `/university/v1/partners` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityPartners |
| PATCH | `/university/v1/partners/:partnerId/approve` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, anonymous |
| PATCH | `/university/v1/partners/:partnerId/reject` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, anonymous |
| PATCH | `/university/v1/partners/:partnerId/suspend` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, anonymous |
| GET | `/university/v1/reports/outcomes` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityOutcomeReport |
| GET | `/university/v1/resources` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityResources |
| POST | `/university/v1/resources` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityResources |
| DELETE | `/university/v1/resources/:id` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityResource |
| PATCH | `/university/v1/resources/:id` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityResource |
| POST | `/university/v1/resources/:id/assign` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, assignUniversityResource |
| GET | `/university/v1/resources/analytics` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, universityResourceAnalytics |
| GET | `/university/v1/settings` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, getUniversitySettings |
| PATCH | `/university/v1/settings` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, getUniversitySettings |
| PUT | `/university/v1/settings` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, getUniversitySettings |
| GET | `/university/v1/students` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, userUniversityStudents |
| GET | `/university/v1/students/:studentId` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, userUniversityStudentDetail |
| GET | `/university/v1/students/:studentId/career-passport` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, validateRequest, userUniversityStudentCareerPassport |
| GET | `/university/v1/verifications` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, adminListVerifications |
| POST | `/university/v1/verifications/:id/approve` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, adminApproveVerification |
| GET | `/university/v1/verifications/:id/document` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, adminDownloadStudentVerificationDocument |
| POST | `/university/v1/verifications/:id/reject` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, adminRejectVerification |
| POST | `/university/v1/verifications/:id/request-info` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, multerMiddleware, validateRequest, adminRequestVerificationInfo |

