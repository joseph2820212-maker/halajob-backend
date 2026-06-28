# Route Validation Coverage

Generated: 2026-06-28T06:51:09.538Z

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | 3401 |
| Public/system endpoints | 5 |
| Read-only endpoints allowed without body validator | 1247 |
| Write/update/delete endpoints | 2149 |
| Write/update/delete endpoints with validator | 17 |
| Write/update/delete endpoints missing validator | 2132 |
| Write validation coverage | 0.8% |
| Core auth/account missing validators | 0 |

## Module Summary

| Module | Total | Writes | Writes With Validator | Writes Missing Validator |
| --- | --- | --- | --- | --- |
| account | 6 | 3 | 3 | 0 |
| admin | 2882 | 1902 | 0 | 1902 |
| ai | 12 | 12 | 0 | 12 |
| analytics | 5 | 2 | 0 | 2 |
| auth | 14 | 14 | 14 | 0 |
| campus | 61 | 34 | 0 | 34 |
| company | 134 | 65 | 0 | 65 |
| jobs | 2 | 1 | 0 | 1 |
| legacy-user | 139 | 42 | 0 | 42 |
| notifications | 16 | 12 | 0 | 12 |
| other | 12 | 6 | 0 | 6 |
| seeker | 94 | 45 | 0 | 45 |
| trust | 4 | 4 | 0 | 4 |
| university | 20 | 7 | 0 | 7 |

## Missing Write Validators

| Method | Path | Module | Middlewares |
| --- | --- | --- | --- |
| POST | /dash/v1/Admin | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/Admin/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Admin/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/Admin/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Admin/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admin/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admin/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admin/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admin/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/Admin/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admin/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admin/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admin/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admin/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admin/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/Admin/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins | admin | checkPermissionMiddleware, anonymous |
| POST | /dash/v1/Admins | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/admins/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/admins/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/admins/:id | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/Admins/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Admins/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/Admins/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/admins/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admins/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admins/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/admins/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admins/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admins/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admins/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/admins/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/Admins/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admins/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/admins/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admins/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admins/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/admins/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/admins/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/admins/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Admins/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Admins/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/Admins/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ai/limits | admin | checkPermissionMiddleware, listLimits |
| DELETE | /dash/v1/ai/limits/:id | admin | checkPermissionMiddleware, multerMiddleware, updateLimit |
| PATCH | /dash/v1/ai/limits/:id | admin | checkPermissionMiddleware, multerMiddleware, updateLimit |
| POST | /dash/v1/Application | admin | checkPermissionMiddleware, anonymous |
| POST | /dash/v1/application-history | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/application-history/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/application-history/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/application-history/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/application-history/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/application-history/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/application-history/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/application-history/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/application-history/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/application-history/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/application-history/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/application-history/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/application-history/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/application-history/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/application-history/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/application-history/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/Application/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Application/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/Application/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Application/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Application/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Application/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Application/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Application/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/Application/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Application/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Application/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Application/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Application/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Application/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/Application/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/ApplicationHistory/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/ApplicationHistory/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/ApplicationHistory/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/ApplicationHistory/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/ApplicationHistory/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/ApplicationHistory/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/ApplicationHistory/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/ApplicationHistory/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/ApplicationHistory/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/ApplicationHistory/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications | admin | checkPermissionMiddleware, anonymous |
| POST | /dash/v1/Applications | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/applications/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/applications/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/applications/:id | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/Applications/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Applications/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/Applications/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/applications/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Applications/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Applications/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/applications/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Applications/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Applications/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Applications/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/applications/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/Applications/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Applications/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/applications/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Applications/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Applications/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/applications/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/applications/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/applications/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Applications/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Applications/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PUT | /dash/v1/Applications/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/auth/admins | admin | isAdmin, multerMiddleware, createDashboardUser |
| POST | /dash/v1/auth/create-admin | admin | isAdmin, multerMiddleware, createDashboardUser |
| POST | /dash/v1/auth/login | admin | multerMiddleware, login |
| POST | /dash/v1/auth/logout | admin | multerMiddleware, logout |
| POST | /dash/v1/auth/refresh | admin | multerMiddleware, refresh |
| POST | /dash/v1/Banner | admin | checkPermissionMiddleware, anonymous |
| DELETE | /dash/v1/Banner/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Banner/:id | admin | checkPermissionMiddleware, anonymous |
| PUT | /dash/v1/Banner/:id | admin | checkPermissionMiddleware, anonymous |
| PATCH | /dash/v1/Banner/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Banner/approve/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Banner/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Banner/bulk-update | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Banner/create | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| DELETE | /dash/v1/Banner/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Banner/delete/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Banner/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| POST | /dash/v1/Banner/reject/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
| PATCH | /dash/v1/Banner/update/:id | admin | checkPermissionMiddleware, multerMiddleware, anonymous |
