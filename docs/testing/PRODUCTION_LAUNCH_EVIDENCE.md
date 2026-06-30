# Production Launch Evidence

Date: 2026-06-30
Branch: `codex/gate-a-mobile-ui-lock`
Status: source gates are green; live production/provider/device evidence is not complete.

This file is the owner-facing evidence packet for the final launch blockers that
cannot be proven from source alone. Keep it honest: do not mark a row `PASS`
unless the current-evidence cell names the concrete command, artifact, log,
screenshot, ticket, provider console result, or owner approval that proves it.

Run the structure/honesty guard after every evidence update:

```bash
npm run test:production-launch-evidence
```

Run complete mode only when preparing to claim public-launch readiness:

```bash
npm run test:production-launch-evidence:complete
```

`test:production-launch-evidence:complete` must fail while any row remains
`PENDING_OWNER`. `ACCEPTED_EXCLUSION` is allowed only when the owner explicitly
accepts that item as out of launch scope and the evidence cell cites that
approval.

## Evidence Status

| Key | Status | Evidence required to close | Current evidence | Owner / external action |
|---|---|---|---|---|
| `production_secret_rotation` | PENDING_OWNER | Record that production secrets shared in chats, ZIPs, screenshots, old APKs, old repos, provider consoles, or servers were rotated after the final release commit. Include date, systems rotated, and owner/operator sign-off. | Not claimed. Local secret scan passed inside `npm run test:launch-gate --silent`, but local scanning is not production rotation proof. | Owner/operator must rotate or confirm rotation in hosting, database, email, Firebase, storage, payment/provider, and analytics consoles. |
| `privileged_user_audit` | PENDING_OWNER | Run `npm run security:audit-users` against the real production database and save the reviewed report showing approved platform admins, company owners/admins, and university owners/admins. | Not claimed. Local permission and role tests passed, but they do not inspect production users. | Owner/operator must provide production database access or run the audit and record the reviewed result. |
| `live_backend_smoke` | PENDING_OWNER | Record deployed API base URL, release commit, `/health/live`, DB-aware `/health/ready`, auth, seeker apply, company job/applicant, campus verification, university verification, and admin queue smoke results using approved test accounts. | Not yet run. Local `npm run test:launch-gate --silent` passed, but it is not a deployed-backend smoke. | Owner must provide deployed API URL, `HEALTH_SECRET`, and approved seeker/company/campus/university/admin test accounts. |
| `live_web_smoke` | PENDING_OWNER | Record deployed web URL, release commit, browser, and smoke results for public jobs, seeker, company, campus/university, and admin portals against the deployed API. | Not yet run. Local web E2E passed inside `npm run test:launch-gate --silent` using Vite preview and stubbed API responses. | Owner/operator must deploy web and API together and run browser smoke against the live origin. |
| `live_smtp_email` | PENDING_OWNER | Record provider console/log proof that OTP, password reset, transactional notification, and unsubscribe/marketing-safe email paths send through the production SMTP account. | Not claimed. Email templates render locally and SMTP failures surface stable errors, but no live SMTP delivery proof is recorded. | Owner/operator must supply production SMTP credentials and run delivery tests to approved inboxes. |
| `live_firebase_push` | PENDING_OWNER | Record real Android device token issuance, backend token registration, push delivery, tap-routing into seeker/campus/company destinations, sign-out token revocation, and duplicate-notification check using the production Firebase project. | Not claimed. Mobile Firebase token provider and backend notification routes are wired and tested locally, but no real Firebase project/device delivery proof is recorded. | Owner/operator must provide Firebase build values/service account and a physical Android device for push QA. |
| `live_storage_upload_download` | PENDING_OWNER | Record production-like storage proof for company files, student verification documents, profile/media uploads, generated CVs, saved CV downloads, private file denial, and audit logs. | Not claimed. Local storage/security integration tests passed, but no managed storage or production-like bucket proof is recorded. | Owner/operator must provide storage provider configuration and run upload/download/denial tests against it. |
| `ai_provider_or_disabled` | PENDING_OWNER | Either record AI disabled for launch with owner sign-off, or record provider/model/key/cost settings plus live output QA, rate limits, audit logs, and failure-mode proof. | Not claimed. AI is feature-gated and local backend safety tests pass; no provider output is claimed. | Owner must decide disabled vs provider-enabled launch and approve model/cost/output QA. |
| `cv_parser_or_disabled` | PENDING_OWNER | Either record CV parser disabled/manual for launch with owner sign-off, or record real parser adapter/provider proof including success, low-confidence, unsupported file, timeout, provider failure, and normalization tests. | Not claimed. Parser defaults to manual and UI states this honestly; no real parser adapter is claimed. | Owner must decide manual parser launch vs supplying a real parser provider/adapter. |
| `payments_mode` | PENDING_OWNER | Record owner acceptance of manual/admin subscription launch, or record online payment provider checkout/webhook/refund/failure-mode proof. | Not claimed. Manual/admin subscription flows are implemented and tested; online checkout/webhooks are not claimed. | Owner must accept manual billing for launch or select and fund an online payment provider integration. |
| `domain_https_cors` | PENDING_OWNER | Record final API/web domains, HTTPS certificate status, CORS origins, HSTS/security headers, and deployed browser smoke for the chosen domains. | Not yet run. Local CORS/security contracts pass, but final production domains are not proven. | Owner/operator must decide final domains and run HTTPS/CORS smoke after deployment. |
| `backup_restore` | PENDING_OWNER | Record production backup schedule, object-storage backup policy if used, and a restore rehearsal or documented restore command/result for MongoDB and provider storage. | Not claimed. Backup/restore process is documented, but no production restore rehearsal is recorded. | Owner/operator must run or approve backup/restore proof for the live environment. |
| `production_android_signing` | PENDING_OWNER | Record final package/update strategy, keystore custody, signed release APK/AAB metadata, versionName/versionCode, signing mode `release-keystore`, Play/App distribution path, and release artifact SHA. | Not claimed. Current tester APK is debug/local signed from source `a4ff122`; no production-signed APK/AAB is claimed. | Owner must decide package strategy, create/secure keystore, and build the signed release artifact. |
| `owner_real_device_qa` | PENDING_OWNER | Record owner-approved real-device QA for final APK/AAB on a physical Android phone: login typing, OTP visibility, seeker/company/campus flows, header/nav/theme, push if enabled, uploads, and no blocking UI issues. | Not claimed. Emulator and widget-test proof exists, but owner real-device approval is still external. | Owner must test or delegate physical-device QA and record approval or blocking issues. |

## Closeout Rules

- `PENDING_OWNER`: required external input or live environment proof is missing.
- `PASS`: proof is complete and the evidence cell cites the exact artifact/result.
- `ACCEPTED_EXCLUSION`: owner explicitly accepts the item as out of launch
  scope, and the evidence cell cites that decision.
- Do not convert local test success into live provider proof.
- Do not claim a production Android release from a debug/local tester APK.
- Do not claim owner real-device approval from emulator screenshots or widget tests.
