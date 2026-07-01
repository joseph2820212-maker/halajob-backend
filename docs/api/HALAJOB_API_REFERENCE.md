# Hala Job API Reference

Generated: 2026-07-01T11:33:36.671Z
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
| Admin | 290 |
| Analytics | 5 |
| Campus | 18 |
| Campus Student | 51 |
| Company | 181 |
| Files | 1 |
| Health | 3 |
| Jobs | 2 |
| Legacy User | 205 |
| Notifications | 20 |
| Other | 15 |
| Seeker | 110 |
| Trust | 4 |
| University | 40 |

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
| PATCH | `/dash/v1/accessibility-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/accessibility-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/accessibility-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, tracking |
| GET | `/dash/v1/admins` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/admins/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/admins/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/ai/features` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listFeatures |
| GET | `/dash/v1/ai/limits` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listLimits |
| POST | `/dash/v1/ai/limits` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listLimits |
| DELETE | `/dash/v1/ai/limits/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateLimit |
| PATCH | `/dash/v1/ai/limits/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateLimit |
| GET | `/dash/v1/ai/requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listRequests |
| GET | `/dash/v1/ai/requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getRequest |
| GET | `/dash/v1/ai/summary` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, summary |
| GET | `/dash/v1/ai/usage/summary` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, summary |
| GET | `/dash/v1/audit-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listAuditLogs |
| POST | `/dash/v1/auth/admins` | Bearer token | explicit | inferred:isAdmin, isAdmin, multerMiddleware, validateRequest, createDashboardUser |
| POST | `/dash/v1/auth/create-admin` | Bearer token | explicit | inferred:isAdmin, isAdmin, multerMiddleware, validateRequest, createDashboardUser |
| POST | `/dash/v1/auth/login` | Public/system | none | multerMiddleware, auditMissingDashboardLoginCredentials, validateRequest, login |
| POST | `/dash/v1/auth/logout` | Public/system | none | multerMiddleware, validateRequest, logout |
| GET | `/dash/v1/auth/me` | Bearer token | explicit | inferred:isAdmin, isAdmin, me |
| POST | `/dash/v1/auth/refresh` | Public/system | none | multerMiddleware, validateRequest, refresh |
| GET | `/dash/v1/billing/invoices` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listInvoices |
| GET | `/dash/v1/billing/invoices/:invoiceId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getInvoice |
| GET | `/dash/v1/campus/partners` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminCampusPartners |
| GET | `/dash/v1/campus/privacy-audit` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminCampusPrivacyAudit |
| GET | `/dash/v1/campus/universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listUniversities |
| POST | `/dash/v1/campus/universities` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listUniversities |
| PATCH | `/dash/v1/campus/universities/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateUniversityStatus |
| GET | `/dash/v1/career-passports` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listCareerPassports |
| GET | `/dash/v1/career-passports/:passportId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getCareerPassport |
| GET | `/dash/v1/communication/logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listDeliveryLogs |
| GET | `/dash/v1/communication/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTemplates |
| POST | `/dash/v1/communication/templates` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTemplates |
| PATCH | `/dash/v1/communication/templates/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTemplate |
| POST | `/dash/v1/communication/test-send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, testSend |
| GET | `/dash/v1/companies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/companies/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/companies/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/company-public-profiles/:companyId/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approve |
| POST | `/dash/v1/company-public-profiles/:companyId/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, reject |
| GET | `/dash/v1/company-public-profiles/pending` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listPending |
| GET | `/dash/v1/company-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listCompanyRequests |
| PATCH | `/dash/v1/company-requests/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveCompanyRequest |
| POST | `/dash/v1/company-requests/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveCompanyRequest |
| PATCH | `/dash/v1/company-requests/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectCompanyRequest |
| POST | `/dash/v1/company-requests/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectCompanyRequest |
| GET | `/dash/v1/content/pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/content/pages/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/content/pages/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
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
| GET | `/dash/v1/employees` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/employees/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/employees/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/excel/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, create |
| POST | `/dash/v1/excel/csv` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, csv |
| POST | `/dash/v1/excel/exsel` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, uploadExcel |
| GET | `/dash/v1/excel/insert` | Bearer token | inferred-parent-mount | inferred:isAdmin, insert |
| POST | `/dash/v1/exsel/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, create |
| POST | `/dash/v1/exsel/csv` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, csv |
| POST | `/dash/v1/exsel/exsel` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, uploadExcel |
| GET | `/dash/v1/exsel/insert` | Bearer token | inferred-parent-mount | inferred:isAdmin, insert |
| GET | `/dash/v1/file/:name` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, anonymous |
| GET | `/dash/v1/global-search` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, globalSearch |
| GET | `/dash/v1/image/:name` | Public/system | none | anonymous |
| GET | `/dash/v1/image/uploads/:name` | Public/system | none | anonymous |
| POST | `/dash/v1/import/create` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, create |
| POST | `/dash/v1/import/csv` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, csv |
| POST | `/dash/v1/import/exsel` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, uploadExcel |
| GET | `/dash/v1/import/insert` | Bearer token | inferred-parent-mount | inferred:isAdmin, insert |
| GET | `/dash/v1/interview-prep/questions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listQuestions |
| POST | `/dash/v1/interview-prep/questions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listQuestions |
| DELETE | `/dash/v1/interview-prep/questions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateQuestion |
| PATCH | `/dash/v1/interview-prep/questions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateQuestion |
| GET | `/dash/v1/invoices` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listInvoices |
| GET | `/dash/v1/invoices/:invoiceId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getInvoice |
| GET | `/dash/v1/job-approvals` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listJobReviewQueue |
| GET | `/dash/v1/jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveJob |
| POST | `/dash/v1/jobs/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, approveJob |
| PATCH | `/dash/v1/jobs/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectJob |
| POST | `/dash/v1/jobs/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, rejectJob |
| PATCH | `/dash/v1/jobs/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/jobs/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/jobs/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/keyword/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, get |
| GET | `/dash/v1/Keyword/get` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, get |
| GET | `/dash/v1/keyword/log` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, logKeyword |
| GET | `/dash/v1/Keyword/log` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, logKeyword |
| POST | `/dash/v1/keyword/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, updateKeyWord |
| POST | `/dash/v1/Keyword/update/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, multerMiddleware, validateRequest, updateKeyWord |
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
| PATCH | `/dash/v1/legal-reports/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/legal-reports/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/legal-reports/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/moderation/company-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listCompanyRequests |
| GET | `/dash/v1/moderation/jobs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listJobReviewQueue |
| GET | `/dash/v1/notification-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listNotificationLogs |
| POST | `/dash/v1/notification/send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, sendNotification |
| GET | `/dash/v1/notifications/logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listNotificationLogs |
| POST | `/dash/v1/notifications/send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, sendNotification |
| GET | `/dash/v1/operations/audit-logs` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listAuditLogs |
| POST | `/dash/v1/operations/notifications/send` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, sendNotification |
| GET | `/dash/v1/operations/support-tickets` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTickets |
| GET | `/dash/v1/operations/support-tickets/:ticketId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getTicketDetails |
| POST | `/dash/v1/operations/support-tickets/:ticketId/messages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, addAdminMessage |
| PATCH | `/dash/v1/operations/support-tickets/:ticketId/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTicketStatus |
| GET | `/dash/v1/operations/talent-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTalentRequests |
| GET | `/dash/v1/permissions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/permissions/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/permissions/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/platform/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettings |
| PATCH | `/dash/v1/platform/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettings |
| PUT | `/dash/v1/platform/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettings |
| GET | `/dash/v1/platform/settings/schema` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, getPlatformSettingsSchema |
| GET | `/dash/v1/privacy-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/privacy-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/privacy-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/project_status/global` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/project_status/global/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/project_status/global/dash` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/project_status/global/overview` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/project_status/global/tracking` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/resources/:resource` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| PUT | `/dash/v1/resources/:resource/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/:id/approve` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/:id/legal-review` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/:id/reject` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resources/:resource/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/:resource/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkResourcePermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/resources/users/:id/role` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/resources/users/:id/role` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/roles/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/roles/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/salary-insights` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminList |
| GET | `/dash/v1/salary-insights/health` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, adminHealth |
| POST | `/dash/v1/salary-insights/rebuild` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, adminRebuild |
| GET | `/dash/v1/search/global` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, globalSearch |
| GET | `/dash/v1/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/settings/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/settings/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/statistics` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/statistics/activity` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/statistics/dash` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/statistics/overview` | Bearer token | inferred-parent-mount | inferred:isAdmin, overview |
| GET | `/dash/v1/statistics/tracking` | Bearer token | inferred-parent-mount | inferred:isAdmin, tracking |
| GET | `/dash/v1/subscriptions/companies/:companyId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getCompanySubscription |
| POST | `/dash/v1/subscriptions/companies/:companyId/assign-plan` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, assignSubscriptionPlan |
| POST | `/dash/v1/subscriptions/seed-free` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, seedFreePlan |
| GET | `/dash/v1/support-queue` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/support-queue/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/support-queue/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/support-tickets` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, listTickets |
| GET | `/dash/v1/support-tickets/:ticketId` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, getTicketDetails |
| POST | `/dash/v1/support-tickets/:ticketId/messages` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, addAdminMessage |
| PATCH | `/dash/v1/support-tickets/:ticketId/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTicketStatus |
| GET | `/dash/v1/talent-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTalentRequests |
| POST | `/dash/v1/talent-requests` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, listTalentRequests |
| DELETE | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTalentRequestStatus |
| POST | `/dash/v1/talent-requests/:id/status` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, updateTalentRequestStatus |
| PATCH | `/dash/v1/talent-requests/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/talent-requests/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/talent-requests/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
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
| DELETE | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/universities/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/universities/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| DELETE | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| GET | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/approve/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| POST | `/dash/v1/users/bulk-update` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |
| PATCH | `/dash/v1/users/reject/:id` | Bearer token | inferred-parent-mount | inferred:isAdmin, checkPermissionMiddleware, multerMiddleware, validateRequest, anonymous |

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
| POST | `/company/v1/auth/refresh` | Public/system | none | multerMiddleware, validateRequest, refresh |
| POST | `/company/v1/auth/refresh-token` | Public/system | none | multerMiddleware, validateRequest, refresh |
| POST | `/company/v1/auth/reset-password` | Public/system | none | forceCompanyWebAuthScope, multerMiddleware, validateRequest, resetPassword |
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
| GET | `/company/v1/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getInterviews |
| POST | `/company/v1/interviews` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getInterviews |
| GET | `/company/v1/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| PATCH | `/company/v1/interviews/:interviewId` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| POST | `/company/v1/interviews/:interviewId/cancel` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, cancelInterview |
| POST | `/company/v1/interviews/:interviewId/feedback` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, submitInterviewFeedback |
| POST | `/company/v1/interviews/:interviewId/mark-no-show` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, markInterviewNoShow |
| POST | `/company/v1/interviews/:interviewId/send-reminder` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, sendInterviewReminder |
| PATCH | `/company/v1/interviews/:interviewId/status` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, changeInterviewStatus |
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
| GET | `/company/v1/profile/public` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getPublicProfile |
| PATCH | `/company/v1/profile/public` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, validateRequest, getPublicProfile |
| POST | `/company/v1/profile/public/preview` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, previewPublicProfile |
| POST | `/company/v1/profile/public/submit-review` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, submitPublicProfileReview |
| POST | `/company/v1/salary-insights/check` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, jsonParser, validateRequest, companyCheck |
| GET | `/company/v1/salary-insights/suggest` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, companySuggest |
| GET | `/company/v1/settings` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getCompanySettings |
| PATCH | `/company/v1/settings` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getCompanySettings |
| PUT | `/company/v1/settings` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, validateRequest, getCompanySettings |
| GET | `/company/v1/talent-pool` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, listTalentPool |
| POST | `/company/v1/talent-pool/candidates` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, saveCandidate |
| DELETE | `/company/v1/talent-pool/candidates/:id` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| GET | `/company/v1/talent-pool/candidates/:id` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| PATCH | `/company/v1/talent-pool/candidates/:id` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| POST | `/company/v1/talent-pool/candidates/:id/do-not-contact` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, markDoNotContact |
| POST | `/company/v1/talent-pool/candidates/:id/invite-to-job` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, inviteCandidateToJob |
| GET | `/company/v1/talent-pool/candidates/:id/notes` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, addCandidateNote |
| POST | `/company/v1/talent-pool/candidates/:id/notes` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, addCandidateNote |
| POST | `/company/v1/talent-pool/candidates/:id/tags` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, addCandidateTags |
| DELETE | `/company/v1/talent-pool/candidates/:id/tags/:tag` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, removeCandidateTag |
| GET | `/company/v1/talent-pool/search` | Bearer token | inferred-parent-mount | inferred:approvedCompanyGuard, anonymous, multerMiddleware, validateRequest, listTalentPool |

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
| POST | `/user/v1/communication/manual-whatsapp-link` | Bearer token | inferred-parent-mount | inferred:authUser, jsonParser, validateRequest, createManualWhatsappLink |
| GET | `/user/v1/communication/preferences` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, getPreferences |
| PATCH | `/user/v1/communication/preferences` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, getPreferences |
| PUT | `/user/v1/communication/preferences` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, getPreferences |
| GET | `/user/v1/company-jobs-profile/job-details/:id` | Bearer token | explicit | authUser, anonymous, getJobDetails |
| GET | `/user/v1/company-jobs-profile/profile-jobs` | Bearer token | explicit | authUser, anonymous, companyData |
| POST | `/user/v1/company/delete-file` | Bearer token | explicit | authUser, validateRequest, deleteFile |
| GET | `/user/v1/company/download-file` | Bearer token | explicit | authUser, downloadFile |
| GET | `/user/v1/company/get-files` | Bearer token | explicit | authUser, getFileLinks |
| POST | `/user/v1/company/join-request` | Bearer token | explicit | authUser, multerMiddleware, validateRequest, joinRequest |
| GET | `/user/v1/company/my-company` | Bearer token | explicit | authUser, get |
| GET | `/user/v1/company/public/:companyId` | Public/system | none | companyDetails |
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
| POST | `/user/v1/privacy/requests/:id/cancel` | Bearer token | explicit | authUser, validateRequest, cancelPrivacyRequest |
| GET | `/user/v1/resources` | Bearer token | explicit | authUser, anonymous, validateRequest, listResources |
| POST | `/user/v1/resources/:id/complete` | Bearer token | explicit | authUser, anonymous, validateRequest, completeResource |
| PATCH | `/user/v1/resources/:id/progress` | Bearer token | explicit | authUser, anonymous, validateRequest, updateProgress |
| DELETE | `/user/v1/resources/:id/save` | Bearer token | explicit | authUser, anonymous, validateRequest, saveResource |
| POST | `/user/v1/resources/:id/save` | Bearer token | explicit | authUser, anonymous, validateRequest, saveResource |
| GET | `/user/v1/resources/:idOrSlug` | Bearer token | explicit | authUser, anonymous, validateRequest, getResource |
| GET | `/user/v1/resources/me/progress` | Bearer token | explicit | authUser, anonymous, validateRequest, myProgress |
| GET | `/user/v1/resources/recommended` | Bearer token | explicit | authUser, anonymous, validateRequest, recommendedResources |
| GET | `/user/v1/salary-insights` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, userInsight |
| GET | `/user/v1/salary-insights/jobs/:jobId` | Bearer token | inferred-parent-mount | inferred:authUser, validateRequest, userJobInsight |
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
| GET | `/university/v1/events` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityEvents |
| POST | `/university/v1/events` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, validateRequest, listUniversityEvents |
| DELETE | `/university/v1/events/:id` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityEvent |
| PATCH | `/university/v1/events/:id` | Bearer token | explicit | inferred:universityAdminGuard, authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, validateRequest, updateUniversityEvent |
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

