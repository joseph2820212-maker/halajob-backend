# UI Action and Backend Wiring Audit - 2026-06-28

Branch audited: `codex/gate-a-mobile-ui-lock`

This audit was split across five focused reviewers:

- Mobile action wiring and duplicate entry points.
- Web portal action wiring and public flow correctness.
- Backend endpoint coverage versus UI usage.
- Duplicate workflow/entry-point review.
- Regression guard strategy.

## What Was Verified

- The web client currently has no production UI API call pointing at a missing backend route. The method-aware guard checks 212 web API calls against 3,836 backend endpoints.
- OTP generation and mobile entry are aligned to the 5-digit contract.
- Mobile dashboard Settings duplication has been reduced to one canonical gear entry per dashboard.
- Company account profile remains in the account menu; company profile settings remain behind the Settings gear.
- Campus web calls now use canonical campus endpoints and campus-scoped auth.

## Implemented In This Pass

- Fixed campus web API drift:
  - `GET /user/v1/campus/opportunities` now sends the campus auth scope.
  - Applications now use `GET /user/v1/campus/applications` instead of the generic seeker applying-job route.
  - `GET /user/v1/campus/resources` now sends the campus auth scope.
- Fixed public search flow:
  - Home search now carries the typed query into the public jobs screen.
- Fixed misleading public company navigation:
  - Public job detail no longer routes visitors to the employer dashboard when pressing Company profile.
- Fixed visitor-safe content calls:
  - Public legal report and accessibility submissions no longer attach stale seeker auth tokens.
  - No-token 401 responses no longer trigger a false session-expired redirect.
- Surfaced the GDPR account controls added by the backend:
  - Account data export downloads JSON from `/user/v1/account/export`.
  - Account deletion request posts to `/user/v1/account/delete-request`.
  - Account deletion cancellation posts to `/user/v1/account/delete-request/cancel`.
  - Deletion requires a browser confirmation.
- Added confirmation gates for company web destructive actions:
  - Submit for review, archive/restore job, cancel invitation, cancel talent request, block applicant, cancel interview, remove member.
- Removed repeated mobile Settings/Profile entry points:
  - Seeker and campus dashboard account menus no longer duplicate Settings.
  - Company account menu no longer duplicates Company profile settings.
  - Company More no longer repeats Account profile/Profile settings.
  - University account menu no longer duplicates Settings.
- Added a first-class public company profile path:
  - Backend exposes approved company detail through `GET /user/v1/company/public/:companyId`.
  - Public job detail now loads a real company profile panel with approved fields, open-job counts, public description, and open jobs.
- Added admin support operations UI:
  - Support tab loads dedicated ticket details from `/dash/v1/support-tickets/:ticketId`.
  - Admins can update status/priority and send replies from the web dashboard.
- Connected company AI results to recruiter workflows:
  - AI output can be copied, saved as a message template, or sent into the create-job workflow as a draft attempt.
- Added direct authenticated CV access:
  - Seeker CV manager opens saved CVs through `/employee/v1/cv/download/:cvId` using the authenticated API client.
- Consolidated web notification calls around `/notifications/v1`:
  - Web notification list/count/read/unread/read-all/delete now use the canonical notification API.
  - Backend `/notifications/v1` now has unread and delete parity with legacy notification routes.

## Regression Guards Added

- `scripts/verifyWebApiWiring.js` now checks HTTP method plus path instead of path only.
- `scripts/verifyOtpContract.js` fails if backend/mobile OTP drift returns to 6 digits.
- `mobile/scripts/assert-mobile-screen-inventory.ps1` now bans duplicate Settings/Profile menu entries from the audited dashboard headers.
- `docs/testing/ui-action-contract.json` plus `scripts/verifyUiActionContracts.js` enforce critical button/tab/backend wiring.
- `scripts/verifyCriticalLaunchBlockers.js` fails if the confirmed external audit blockers regress:
  - multiple Mongo text indexes on `jobs`.
  - `RefreshToken.userRef` stored as a string instead of a `users` ObjectId reference.
  - generic admin user updates accepting protected authority fields.
  - validated request payloads not being written back to `req`.
  - web auth returning to persistent `localStorage` token storage.
  - refresh sessions losing ObjectId/TTL/cookie migration coverage.
  - web HTML previews returning to regex-only sanitization or losing the React error boundary.
  - the audited async job-role controller losing its error forwarding.
  - browser smoke tests logging fatal errors without failing.
- CI now runs:
  - `npm run test:otp-contract`
  - `npm run test:ui-actions`
  - `npm run test:critical-launch-blockers`
  - `npm run check:web-routes`
  - critical DB-backed integration suites for object authorization, audit logging, job mutations, hiring workflows, subscriptions, company permissions, and admin resources.

## External Audit Response

Reviewed `C:/Users/Admin/Downloads/AUDIT_codex_gatea.md` against the current branch. Several UI/action items were already stale after this pass, but the top backend blockers were still real and have now been fixed:

- Collapsed three competing `JobsSchema` text indexes into one weighted `jobs_text_search` index.
- Changed `RefreshToken.userRef` from `String` to `mongoose.Schema.Types.ObjectId`.
- Added `scripts/migrateRefreshTokenUserRefObjectId.js` to convert existing string refresh-session rows before/with deployment.
- Hardened generic dashboard resource updates so `users`/`admins` cannot mass-assign protected authority fields such as `role_id`, `permissions`, `status`, or `password`.
- Updated `middlewares/validate.js` to write validated request values back to `req.body`, `req.params`, and `req.query`.
- Wrapped the concrete unhandled async job-role controller in `try/catch` and forwards failures through `next(err)`.
- Added a React error boundary at the SPA root.
- Replaced the hand-rolled CV preview sanitizer with DOMPurify.
- Moved web auth away from persistent token storage:
  - access tokens are held in memory.
  - refresh tokens are stored in scoped httpOnly cookies (`seeker`, `campus`, `company`, `admin`).
  - legacy `localStorage` token keys are deleted instead of reused.
  - added `POST /company/v1/auth/refresh` so the company portal has refresh parity.
- Added refresh-token `expiresAt` plus a Mongo TTL index, and expanded the migration script to backfill both ObjectId user refs and expiration dates.
- Hardened generic admin bulk user/admin updates with the same protected-field stripping as single updates.
- Made the web portal smoke test fail on page errors, console errors, request failures, and 5xx responses while tolerating benign browser `net::ERR_ABORTED` route-change cancellations.
- Added the existing critical DB-backed integration suites to CI.

## Still Open From External Audit

- Data-retention/TTL policy beyond refresh tokens: OTP fields are embedded on `users` and cannot use TTL without deleting the user; audit/analytics/email/search retention needs product/legal windows before automatic deletion.
- Tablet/iPad landscape policy. The app currently locks portrait; either unlock tablet landscape and test it, or formally descope landscape tablet support.
- Larger mobile god-file splitting and localization consolidation.

## Closed Follow-Up Items

- First-class public company profile from job detail: implemented.
- Admin support detail/status/reply lifecycle: implemented.
- UI action contract inventory and enforced test artifact: implemented.
- Company AI result handoff into templates/job draft/copy workflow: implemented.
- Web CV builder/manager authenticated direct download: implemented.
- Canonical web notification route usage and backend parity: implemented.
- Public/company/account/CV/notification API regression tests: implemented.

## Still Environment/Product Bound

- Live production smoke with real credentials.
- Device-level Android input verification on the installed APK.
- Online payments, because provider/product requirements are not in the repo.
- Broad `Mixed`-field/data-integrity migration, because it needs a real database snapshot and migration approval.
- Mobile company AI result-to-action tests beyond current AI display/save controls, because mobile product behavior still needs confirmation for which generated output should mutate which workflow.

## Verification Run

- `npm run test:otp-contract`
- `npm run test:ui-actions`
- `node scripts/verifyWebApiWiring.js`
- `npm run check:web-routes`
- `npm run test:route-validation`
- `npm run test:critical-launch-blockers`
- `npm run test:model-integrity`
- `npm run test:integration:auth-context`
- `npm run test:object-authorization`
- `npm run test:audit-logging`
- `npm run test:integration:job-mutations`
- `npm run test:integration:hiring-workflows`
- `npm run test:integration:subscriptions`
- `npm run test:integration:company-permissions`
- `npm run test:integration:admin-resources`
- `npm run smoke:import`
- `npm run test:global-launch-contract`
- `npm run test:security-http`
- `npm run test:response-codes`
- `npm run test:notification-routes`
- `npm run test:mobile-routes`
- `npm --prefix web test`
- `npm --prefix web run build`
- `npm --prefix web run e2e`
- `npm run check:syntax`
- `npm run check:i18n`
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1`
- `flutter analyze`
- Focused Flutter widget tests:
  - `company header exposes universal account actions`
  - `company profile settings screen updates profile and search`
  - `company account profile screen updates owner settings`
  - `header profile and settings actions are available`
