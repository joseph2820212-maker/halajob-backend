# Repository Separation Status

This repository is the source of truth for the Hala Job backend API.

## Owns

- Express app bootstrap and API routing.
- MongoDB models, migrations, seeders, and scheduled jobs.
- Backend validation, auth/session logic, rate limiting, metrics, and audit logging.
- Generated API artifacts under `docs/api/`.
- Backend CI and backend-only launch checks.

## Does not own

- Flutter mobile UI or APK builds.
- Customer website UI.
- Admin console UI.

Those clients now live in:

- `joseph2820212-maker/halajob-mobile`
- `joseph2820212-maker/halajob-website`
- `joseph2820212-maker/halajob-admin`

## Fresh Server Rebuild Note

The previous live server was deleted during the split. Rebuild from this repo,
then configure fresh production/staging environment variables before asking the
client repos to use the server.

Minimum rebuild order:

1. Set production secrets and `CONNECTION_URL`.
2. Deploy this backend.
3. Run route/docs verification.
4. Seed demo data only when explicitly building a demo environment.
5. Point mobile, website, and admin `VITE_API_URL` / `HALA_DEFAULT_BASE_URL` at the new host.

## Dev Auth Bypass Position

Client-side skip-auth bypasses may exist in the mobile, website, and admin
repos to support UI review while the fresh server is unavailable. They are not
backend auth and are not launch-safe. Production readiness requires real login,
refresh sessions, authorization checks, and live smoke proof against this backend.
