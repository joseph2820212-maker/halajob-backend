# Codex Launch Reconciliation (Phase 0)

Purpose: reconcile the five verified reconciliation reports (admin, mobile,
reports-search, cv-parser, infra-messaging) into a single Phase-1 driver. This
document tells implementers exactly what is already built (do not rebuild),
what genuinely remains, the order to do it, and what is blocked on the owner.

Branch note: this reconciliation was produced on branch
`codex/gate-a-mobile-ui-lock` (HEAD `4cec459`). Per `CODEX.md`/`CLAUDE.md`,
Phase-1 implementation MUST branch from `flutter-seeker-campus`. Re-verify the
cited line numbers after branching, since some may have drifted.

Evidence convention: `file:line` references are taken from the verified reports
and spot-checked against current source. Where a report was cautious or two
reports disagreed, that is called out explicitly.

---

## Reconciliation table

| Item | Status | Evidence (file:line) | What's left |
|------|--------|----------------------|-------------|
| 1.1 Admin support queues (USER + COMPANY) | PARTIAL | `web/src/shared/api.ts:3602-3632` (only `/dash/v1/support-tickets`); `controllers/dash/adminSupportController.js:3,33,116,175,226` (CompanySupportTicketModel only); `routes/index.js:868` (USER model only behind generic `/support-queue`, no FE caller); `web/src/admin/screens.tsx:98,389` (`support/legal` real tab; `support` at 389 is dead code) | COMPANY tickets DONE. USER `SupportTicketModel` queue is unreachable from UI; the single "Support tickets" table is company-only and mislabeled. Add a user-support API + a second, clearly-labeled table. |
| 1.2 Legal page approve/reject (`legalReviewStatus`) | MISSING (UI) | `controllers/dash/adminResourceController.js:191,907-965` (contentpages mapped, generic update + audit, no protected fields); `models/ContentPageModel.js:43-47` (enum); `web/src/admin/screens.tsx:404,534,952` (view-only, status shown read-only); `updateResource` called 0 times in screens.tsx (verified) | Backend + audit already work. UI-only: add an action that calls `updateResource("contentpages", id, { legalReviewStatus })`. |
| 1.3 Legal reports + privacy requests actions | MISSING (UI) | `controllers/dash/adminResourceController.js:196-197` (mapped, update/approve/reject + audit); `web/src/admin/screens.tsx:402-403,532-533` (both `actions={["View"]}`); `web/src/shared/api.ts:3633-3648` (read-only GETs) | Backend can transition status + notes. UI-only: add status-transition actions via `updateResource`. Confirm enum values against `LegalReportModel`/`PrivacyRequestModel`. |
| 1.4 Mobile accessibility form + privacy cancel/status | MISSING | `mobile/lib/src/features/legal_help/legal_help_screens.dart:1387-1393` (5 hardcoded types, no `accessibility`); `legal_help_service.dart:472-486` (only `createPrivacyRequest`); no `cancelPrivacyRequest`/`fetchPrivacyRequests` (verified, service has neither) | Add accessibility request path + `cancelPrivacyRequest` + `fetchPrivacyRequests` + a status/cancel UI. MUST verify backend routes (`/user/v1/privacy/...`) exist before wiring. |
| 1.5 Contextual reports (web + mobile) | PARTIAL | web: `web/src/public/legalHelp.tsx:493-562` (target-type selector exists, no `targetId`); per-job `web/src/public/screens.tsx:564` + `api.ts:1179-1190` (real job id in URL); mobile: `seeker_dashboard_service.dart:5485-5493` (real `jobId` in path, but body lacks `targetType`/`targetId`); `legal_help_service.dart:449-466` (`submitLegalReport` has no `targetId` param) | Per-job/path-based reports carry a real target. Generic web + mobile legal reports carry type only, no `targetId`. Thread real ids in; add backend ObjectId coercion/validation. |
| 1.6 Mobile company action wiring | PARTIAL (services done, no UI) | `company_dashboard_service.dart:1911,1995,2029,2056,914,2398` (all 6 methods exist); zero UI callers in `company_dashboard_screen.dart`; tests only at `company_dashboard_service_test.dart:520,2115` | All 6 service methods exist and 2 are unit-tested, but none is wired to the screen. Add UI entry points + callers + tests. (Mobile report contradicts an earlier addendum that said names didn't exist / `saveJobTranslation` was wired — both are wrong.) |
| 1.7 Web keyword search to backend | MISSING | backend accepts it: `controllers/app/JobData/GetJobController.js:163` (`search`/`q`), `141-158` (`buildJobSearchMatch`); web never sends: `web/src/public/screens.tsx:291,312-319` (client-side `filtered` only), `web/src/seeker/screens.tsx:274` (no params) | Backend search is real. Web filters only the already-fetched first page (max 50) client-side. Pass `search` into `jobService.list` (which already forwards arbitrary params) on public + seeker; relax client filter. |
| 1.8 Admin roles/users/permissions UI | MISSING (+ 1 backend gap) | backend: `routes/index.js:708-711` (roles/permissions routers), `adminResourceController.js:116-133,502-520` (users/admins mapped, protected fields), `checkPermission` `routes/index.js:30,43`; no UI (0 refs in screens.tsx, users tab `actions={["View"]}` at `screens.tsx:340`); no self-lockout guard anywhere (verified) | Add a Roles/Users management tab. Plus the ONLY new backend logic needed: a self-lockout guard (block self suspend/role-downgrade; block removing last active super-admin) in `adminResourceController.js`. |
| 1.9 CV parser | PARTIAL (plumbing done, extractor stub) | DONE: models `CvParseJobModel.js:46-90`, routes `routesEmployee/cvRoute.js:34-59`, flow `cvStudioController.js:46,121,142`, no-overwrite `cvParseApply.service.js:19-25,33`, mobile UI wired. STUB: `services/cvParsing/cvParserProvider.js:4,20-39` (defaults `manual`, returns `cv_parser_not_configured`, no text extraction; verified) | Models/routes/flow/UI/no-overwrite are DONE. Only the extraction adapter is missing. Add a real `local` text-extraction adapter; no new model/route/controller. |
| 1.10 Offline Mongo / CI | DONE | `.github/workflows/flutter-mobile-ci.yml:41-55` (mongo:7 service), `:147-155` (`CONNECTION_URL` injected); `scripts/utils/integrationMongo.js:71-83` (uses external handle when `CONNECTION_URL` set, no binary download); `package.json:109-110` (test aggregates) | Nothing. `mongodb-memory-server` remains a correct local-only fallback (`package.json:180`). |
| 1.11 Messaging inbox | DONE (MVP) / PARTIAL (no unified inbox) | read+send both sides: `controllers/employeeDash/employeeWithJobs/employeeWithJobsController.js:773-816` + `routesEmployee/employeeDashRoutes.js:72`; web `web/src/shared/api.ts:1816,2962`, `web/src/company/screens.tsx:1598,1691-1693`; mobile `dashboard_screen.dart:17953`, `company_dashboard_service.dart:1687`; storage `models/UserApplyingJobModel.js:99-104` (per-application `communication_log`, no standalone thread model) | Per-application read+send works on web + mobile for seeker and company = launch MVP DONE. A cross-application unified inbox does not exist; it is an optional post-MVP nice-to-have, not a launch blocker. |
| 1.12 Public job search / SEO | DONE | unauth listing/detail `routesUser/JobRote.js:19,22-26` under `optionalAuthUser`; private/closed hidden `GetJobController.js:127-139,198,921,924-930`; SEO `web/src/public/seo.ts`, `web/src/public/seoRoutes.json`, `web/scripts/prerenderSeo.js:69,75-78` | Nothing required. Optional enhancement only: per-job dynamic sitemap entries (`/jobs/:id`); current sitemap lists static surfaces only. |

---

## Already-done (do NOT rebuild)

- **1.1 COMPANY support tickets** — full list/detail/status/reply with audit:
  `controllers/dash/adminSupportController.js:33,116,175,226`; UI table renders
  it (`web/src/admin/screens.tsx:1024`). Only the USER queue + labeling is left.
- **1.5 Per-job / path-based reports carry a real target** — seeker `reportJob`
  puts the real `jobId` in the URL (`seeker_dashboard_service.dart:5485-5493`,
  called with `item.id` at `dashboard_screen.dart:4924-4928`); web per-job uses
  `jobService.report(job.id, ...)` → real id in URL (`api.ts:1179-1190`). Do not
  rebuild a target-id mechanism for the per-job path.
- **1.7 Backend keyword search** — fully implemented and real:
  `GetJobController.js:163` (accepts `search`/`q`), `141-158`
  (`buildJobSearchMatch` over `search_index.*` + `job_name` regex). Do not add a
  new search backend; only send the param from the web.
- **1.8 Roles/permissions backend** — routers, mapping, protected fields, and
  `checkPermission` all exist (`routes/index.js:708-711,30,43`;
  `adminResourceController.js:116-133,502-520`). Build only the UI + self-lockout
  guard.
- **1.9 CV parse plumbing** — models, routes, parse→preview→confirm flow, mobile
  UI, and the safe no-auto-overwrite contract are all DONE and tested
  (`CvParseJobModel.js`, `cvRoute.js:34-59`, `cvStudioController.js:46,121,142`,
  `cvParseApply.service.js:19-25,33`). Do not create `CvBuilderModel` or new
  routes. Confirm requires `status==="parsed"` already.
- **1.10 Offline Mongo / CI** — solved via mongo:7 service container +
  `CONNECTION_URL` (`flutter-mobile-ci.yml:41-55,147-155`;
  `integrationMongo.js:71-83`). No work.
- **1.11 Per-application messaging (read + send, both sides, web + mobile)** —
  the launch MVP is complete (controllers, routes, web + mobile UIs cited above).
  Do not build a parallel messaging system.
- **1.12 Public job search + SEO** — unauthenticated listing/detail with private
  jobs hidden, plus prerendered SEO/sitemap/robots
  (`JobRote.js`, `GetJobController.js:127-139`, `prerenderSeo.js`). No work.

---

## Ordered Phase-1 work plan

Only genuinely PARTIAL/MISSING items, ordered by launch priority. Each is one
concrete task. Skip everything in "Already-done".

### 1. (1.7) Send web keyword search to the backend  — highest leverage, lowest risk
- Files: `web/src/public/screens.tsx` (JobsScreen list call ~line 291) and
  `web/src/seeker/screens.tsx` (~line 274).
- Reuse: `jobService.list` already forwards arbitrary params
  (`api.ts:1105-1109`); backend already parses `search`/`q`. No service/backend
  change.
- Do: pass `{ search: query.trim() || undefined, ... }`, debounce on `query`
  state, and relax/remove the client-side `filtered` useMemo to avoid
  double-filtering and to surface matches beyond the first 50 rows.
- Tests: web test asserting the keyword reaches the request params; manual check
  that a result on page 2 becomes findable.

### 2. (1.8) Admin roles/users management UI + self-lockout guard  — security-gating
- Files: `web/src/admin/screens.tsx` (new tab + actions),
  `web/src/shared/api.ts` (list roles/permissions, assign role, suspend),
  `controllers/dash/adminResourceController.js` (self-lockout guard).
- Reuse: roles/permissions routers + users mapping + `checkPermission` all exist;
  suspend via the existing reject/approval path
  (`adminResourceController.js:929-932,1056-1104`).
- New backend logic (only place in Phase-1 that needs it): before persisting a
  user/admin update, reject suspend or role-downgrade when
  `target._id === req.admin._id`, and block removing the last active
  super-admin. Permission: gate the new endpoints with `checkPermission`. Audit:
  generic update already writes audit (`adminResourceController.js:959-965`).
- Tests: backend tests for both lockout branches; UI test for list + assign +
  suspend.

### 3. (1.9) Real local CV text-extraction adapter
- Files: new `services/cvParsing/adapters/localTextAdapter.js`; branch into it
  from `services/cvParsing/cvParserProvider.js` when `provider === "local"`.
  Env docs: `docs/CV_PARSING.md`.
- Reuse: `normalizeCvParseResult`, `CvParseJobModel`, `parseUpload`,
  `previewParseJob`, `confirmParseJob` (already gated on `status==="parsed"`),
  and `applyParsedCvToEmployee` (already non-destructive). No model/route/
  controller changes.
- Do: by mimetype extract text (.txt raw; .pdf via pdf-parse; .docx via
  mammoth), heuristically pull email/phone/links/sections, return
  `status:"parsed"` with a real `confidence`, `raw_result`, `normalized_result`.
- Tests: update the 3 tests currently asserting `cv_parser_not_configured`
  (`scripts/verifyCvParsingIntegration.js:259`,
  `scripts/verifyCvStudioIntegration.js:396`,
  `mobile/test/widget_test.dart:7730`) to add a `local` happy-path with a fixture.
- Note: this is the only item that requires picking parser libraries; if owner
  wants an external/paid provider instead, see Owner-blocked.

### 4. (1.1) User support queue in admin UI (+ correct labeling)
- Files: `web/src/shared/api.ts:3602-3632` (add user-support methods),
  `web/src/admin/screens.tsx` (split into two labeled tables).
- Reuse: USER `SupportTicketModel` is already exposed via generic
  `/dash/v1/support-queue` (`routes/index.js:868`); generic `update` writes audit
  (`adminResourceController.js:959-965`). Company side is fully done — leave it.
- Do: add `userSupportQueue()` → `/dash/v1/support-queue/get`, plus
  getOne/update(status) and reply if the user model supports messages. Render
  "User support" and "Company support" as two clearly labeled tables. Remove or
  repurpose the dead `tab === "support"` block (`screens.tsx:389`).
- Validator/permission/audit: confirm allowed status enum on `SupportTicketModel`;
  audit already covered by generic update.

### 5. (1.2 + 1.3) Admin legal actions: content approve/reject, legal reports, privacy requests
- Files: `web/src/admin/screens.tsx` (content panel ~404,534; legalreports/
  privacyrequests panels ~402-403,532-533).
- Reuse: `adminService.updateResource` already exists (`api.ts:3668-3679`) and is
  currently called 0 times; backend update + audit work for all three resources;
  no protected fields block these transitions.
- Do: add action menus calling
  `updateResource("contentpages", id, { legalReviewStatus })`,
  `updateResource("legalreports", id, { status, reviewedBy, note })`,
  `updateResource("privacyrequests", id, { status, note })`.
- Validator/permission/audit: confirm enum values against `ContentPageModel.js:43-47`,
  `LegalReportModel`, `PrivacyRequestModel`; audit already written by generic update.
- Bundled together because they are the same pattern (wire `updateResource` into
  view-only panels).

### 6. (1.6) Wire mobile company hiring actions to UI
- Files: `mobile/lib/src/features/dashboard/company_dashboard_screen.dart`.
- Reuse: all 6 service methods exist
  (`company_dashboard_service.dart:1911,1995,2029,2056,914,2398`).
- Do: add interview status dropdown → `updateInterviewStatus`; feedback dialog →
  `submitInterviewFeedback`; no-show button → `markInterviewNoShow`; reminder
  button → `sendInterviewReminder`; talent-pool save → `saveTalentPoolCandidate`;
  translation editor save → `saveJobTranslation`.
- Tests: widget/golden tests for the new callers; unit tests for the 4
  currently-untested methods (`submitInterviewFeedback`, `markInterviewNoShow`,
  `sendInterviewReminder`, `saveTalentPoolCandidate`).

### 7. (1.5) Thread real target ids into generic/contextual reports + harden backend
- Files: web `web/src/public/legalHelp.tsx:493-562` (add `targetId`), callers
  that open `ReportSurface` from a job/company/article context; mobile
  `legal_help_service.dart:449-466` (add `targetType`/`targetId` params),
  `legal_help_screens.dart:1235,1271-1276` (`ReportScreen`), and add
  `targetType:'job'`+`targetId` to the `reportJob` body
  (`seeker_dashboard_service.dart:5485-5493`); backend
  `controllers/app/Legal/LegalReportController.js:20-21` +
  `validations/userContent.validation.js:73-74`.
- Reuse: `LegalReportModel.js:17-18` already defines `targetType` (enum) and
  `targetId` (ObjectId); web service already accepts optional `targetId`
  (`api.ts:4029-4042`).
- Backend hardening (correctness, do this even if UI threading is deferred):
  coerce `targetId` via `mongoose.isValidObjectId(...) ? ... : null` before
  `create` to avoid a CastError from a non-ObjectId string; tighten validator to
  `.oneOf(enum)` for `targetType` and an ObjectId check for `targetId`.
- Tests: backend test that a bad `targetId` is nulled (no 500); web/mobile test
  that a contextual open passes the entity id.

### 8. (1.4) Mobile accessibility request + privacy cancel/status  — verify backend first
- Files: `mobile/lib/src/features/legal_help/legal_help_service.dart`,
  `legal_help_screens.dart:1387-1406`.
- Pre-req (blocking): confirm the backend routes exist before wiring — whether
  `accessibility` is an accepted `createPrivacyRequest` type or a distinct
  `/user/v1/privacy/accessibility` route, and whether
  `PATCH /user/v1/privacy/requests/:id/cancel` + a GET list exist. Do NOT claim
  wired until the route is verified.
- Do: add `accessibility` to request types (or a dedicated form/service method);
  add `cancelPrivacyRequest({id})` and `fetchPrivacyRequests`; add a status list
  UI with a cancel button (today only a `requestNo` snackbar is shown).
- Tests: widget test for the new form + cancel; service test for the new calls.

---

## Owner-blocked

- **CV parser provider choice (1.9)** — if the owner prefers a paid/external
  parsing provider over the in-house `local` adapter, that decision, API keys,
  and the `external` adapter contract are owner-blocked. The `local` adapter in
  step 3 does not need the owner and is the recommended launch path; the
  `external` branch already exists as a stub
  (`cvParserProvider.js:31-39`) awaiting a real adapter + credentials.
- **Legal status enums / approval semantics (1.2, 1.3)** — the meaning and
  allowed transitions of `legalReviewStatus` (e.g. `lawyer_approved`) and of
  legal-report / privacy-request statuses should be confirmed with the owner /
  lawyer before the admin UI exposes them, to avoid implying lawyer sign-off the
  business has not authorized (per `CLAUDE.md`: do not overstate legal/AI/payment
  capabilities). Engineering can ship the wiring; the enum-to-meaning mapping is
  an owner call.
- **Mobile privacy/accessibility backend routes (1.4)** — if the
  cancel/list/accessibility endpoints do not yet exist server-side, building them
  is in scope for engineering, but the policy for what "cancel" and
  "accessibility request" legally entail (retention, SLAs) is an owner/lawyer
  decision.

No payment-provider work appears in Phase 1; per `CLAUDE.md`, do not represent
manual/admin subscriptions as online payment, and do not represent the mock AI /
stub CV parser as real until a real adapter ships.
