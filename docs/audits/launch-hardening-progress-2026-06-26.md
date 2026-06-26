# Launch Hardening Progress - 2026-06-26

Branch: `flutter-seeker-campus`

## Completed In This Pass

| Area | Result | Evidence |
| --- | --- | --- |
| Legacy mobile fallback API paths | Confirmed supported by backend compatibility routes instead of dead 404 fallbacks. | `npm run test:mobile-routes` verifies 297 mobile method/path checks, including `/employee/v1/...` compatibility aliases. |
| Web logout/session invalidation | Web sign-out now stores refresh tokens and calls backend logout before clearing local tokens. | `web/src/shared/api.ts`, `web/src/shared/workflows.tsx` |
| Company backend logout | Added `/company/v1/auth/logout` so company portal sessions can revoke refresh tokens. | `routesCompany/authRoute.js`, `controllers/companyDash/Auth/loginController.js` |
| User logout robustness | `/user/v1/auth/logout` no longer requires a valid access token and accepts `refreshToken`, `refresh_token`, or `x-refresh-token`. | `routesUser/AuthRote.js`, `controllers/app/Auth/LoginController.js` |
| Admin logout robustness | `/dash/v1/auth/logout` now rejects missing refresh tokens instead of returning success while clearing nothing. | `controllers/dash/authController.js` |
| Logout security contract | HTTP contract now proves user, company, and admin logout reject missing refresh tokens. | `npm run test:security-http` |

## Checks Run

```bash
npm run test:security-http
npm run test:mobile-routes
npm run check:syntax
npm --prefix web run build
```

## Remaining From Backend/API Audit

The project still needs the larger runtime integration suite from the backend audit: seeded users, roles, companies, universities, students, cross-account negative cases, mutation side effects, upload/download security, and full web/mobile end-to-end API flow coverage.
