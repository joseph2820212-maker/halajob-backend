# Mobile And Web Integration

Date: 2026-06-27
Scope: shared backend contract notes for mobile app, website, company dashboard, campus mode, and admin panel.

## Base URLs

| Client | Backend base |
|---|---|
| Mobile app | Environment/build-time API base URL, currently expected as `https://jobzain.com` for local APK builds. |
| Website | Same backend API base, configured in hosting env. |
| Company dashboard | Same backend API base. |
| Admin dashboard | Same backend API base, dashboard routes under `/dash/v1`. |

## Auth

- Send access token as `Authorization: Bearer <token>`.
- Logout routes expect refresh-token cleanup behavior where implemented.
- The backend is the source of truth for roles and active account context.
- Clients must not decide permissions locally.

## Language

- Current backend accepts legacy `lan` plus route-specific language conventions.
- Product standard should be `x-lang: en|ar` while preserving legacy compatibility until all clients migrate.
- Clients must not hard-code English-only messages.

## Account Context

The app/website should read available account contexts from backend account/context routes and respect:

- `job_seeker`
- `student`
- `company_admin`
- `company_member`
- `university_admin`
- `super_admin`

Product-facing naming is documented in `docs/security/ROLE_PERMISSION_MATRIX.md`.

## File Uploads

- Use `multipart/form-data` for CVs, images, company files, and campus verification documents.
- Do not assume files are public unless the endpoint documents public access.
- HTML files in `/uploads` are served as attachments with restrictive headers.
- Runtime upload files are not source code and are not tracked by Git.

## Notifications

- Register device tokens through notification/FCM endpoints.
- Remove device tokens on logout.
- Notification payloads should include enough route metadata for mobile/web to open normal in-app screens, not webview popups.

## AI

- Mobile/web must call backend AI endpoints only.
- Provider keys must never be embedded in mobile/web.
- AI output must be reviewable/editable by the user before irreversible actions.
- AI failure states must use backend fallback responses.

## Error Handling

Clients should branch on:

- HTTP status
- `message` / route-specific error code
- documented `data` or `errors` fields

The backend still uses mixed response envelopes in legacy routes. New work should move toward one documented envelope without breaking existing clients.

## Route Inventory

Use these files before wiring client screens:

```text
docs/api/ROUTE_VERIFICATION_REPORT.md
docs/api/HALAJOB_ROUTE_INVENTORY.json
```
