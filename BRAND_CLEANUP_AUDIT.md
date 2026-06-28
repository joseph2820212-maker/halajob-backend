# Hala Job — Brand Cleanup Audit

**Branch:** `claude/harden-trunk` · **Date:** 2026-06-28

The public product name is **Hala Job** everywhere a user, company, university,
admin, tester, or investor can see it. Hala Job is operated by **llill ltd**; the
public web domain is **halajob.com**. This document classifies every remaining
`JobZain / jobzain / JOBZAIN / jobzien / Jobzien` occurrence in the repository
(excluding `node_modules`, `.git`, and build output) and records the action taken.

## Method

```bash
rg -n "JobZain|jobzain|JOBZAIN|jobzien|Jobzien|JOBZIEN" . \
  --glob '!node_modules/**' --glob '!.git/**' \
  --glob '!mobile/build/**' --glob '!web/dist/**' --glob '!build/**' --glob '!**/*.lock'
```

Every match was classified into one of five categories:

1. **Public brand text** — changed to `Hala Job` now.
2. **Technical domain / base URL** (`jobzain.com`) — kept temporarily, documented.
3. **Environment variables** (`JOBZAIN_*`) — migrated to `HALAJOB_*` with backward-compatible fallback.
4. **Internal code/model/collection names** (`JobZainTalent*`, `jobzain_talent_requests`) — kept as documented legacy identifiers; DB migration plan below.
5. **Internal identifiers / test fixtures / i18n keys / brand-guard tooling** — kept, not user-visible.

## Counts

| Metric | Before | After |
|---|---|---|
| Total old-brand occurrences | 647 | 611* |
| Public-facing brand text (rendered to users) | ~40 | **0** |
| `jobzain.com` technical domain (exception) | 491 | 497* |
| `JOBZAIN_*` env var refs (now fallback/docs only) | 17 | 15 |
| `JobZainTalent*` internal symbols/collection (exception) | 67 | 68 |
| Internal id / fixtures / i18n keys / tooling (exception) | ~32 | 27 |

\* The total/domain "after" numbers rose slightly only because this audit and the
new explanatory code/doc comments themselves contain the words `jobzain.com` /
`JOBZAIN_*` while documenting the exceptions. **No new user-visible old brand was
introduced.** Public-facing brand text is now **0**.

---

## Category 1 — Public brand text (CHANGED to "Hala Job")

| File | Was | Now |
|---|---|---|
| `services/email/email.service.js` | `app_name: 'JobZain'`, subject `'JobZain'`, `'JobZain verification code'`, `'Open JobZain'` | `Hala Job` (via `config/brand.js`) |
| `sendEmail/templates/base.html` | `<h1>JobZain</h1>`, footer "sent by JobZain", `© JobZain`, red `#9b111e` header | `Hala Job`, navy `#1F3654` header |
| `sendEmail/templates/passcode.html` | same as above + red code color | `Hala Job`, navy |
| `sendEmail/templates/important-action.html` | same as above | `Hala Job`, navy |
| `notification/notificationService.js` | fallback title `'JobZain'` | `'Hala Job'` |
| `web/index.html` | `og:title`/`twitter:title`/`<title>` = "Hala Job \| JobZain hiring platform"; `og:url`/canonical `jobzain.com` | "Hala Job — hiring platform"; URLs → `halajob.com` |
| `web/src/shared/api.ts` | fallbacks "JobZain partner", "…JobZain platform.", "JobZain activity", "JobZain talent help" | "Hala Job …" |
| `web/src/public/seo.ts`, `web/scripts/prerenderSeo.js` | public `siteUrl` default `https://jobzain.com` | `https://halajob.com` |
| `routesHealth/index.js` | "JobZain Backend Health Page" | "Hala Job Backend Health Page" |
| `routesCompany/jobRoute.js` | comment "JobZain Talent Help Requests" | "Hala Job Talent Support Requests" |
| `controllers/companyDash/companyWithJobs/companyJobHiringController.js` | download names `jobzain-cvs-*.zip`, `jobzain-applications-*.xlsx` | `halajob-cvs-*`, `halajob-applications-*` |
| `mobile/test/widget_test.dart` | fixtures `jobzain-cvs-test.zip`, `jobzain-applications-test.xlsx` | `halajob-*` (tests updated, pass) |
| `helper/companyDash/companyJobHiringHelpers.js` | Jitsi room `meet.jit.si/JobZain-…` | `meet.jit.si/HalaJob-…` |
| `README.md` | `# Hala Job / JobZain` | `# Hala Job` + historical note |
| `web/README.md` | `# JobZain Web Frontend` | `# Hala Job Web Frontend` |
| `web/package.json`, `web/package-lock.json` | `"name": "jobzain-web"` | `"name": "halajob-web"` (kept in sync) |
| `scripts/generateApiArtifacts.js` (+ regenerated artifacts) | titles "HalaJob API", "HalaJob Dev/Local" | "Hala Job API", "Hala Job Dev/Local" |
| `docs/ENVIRONMENT.md` | `JOBZAIN_EMAIL_*` table | `HALAJOB_EMAIL_*` + deprecation note |

Central brand constants added (Gate 3): `config/brand.js`, `web/src/shared/brand.ts`,
`mobile/lib/src/core/config/brand_config.dart`.

---

## Category 2 — Technical domain `jobzain.com` (KEPT — documented exception)

`jobzain.com` is the **current live backend API domain**. It is a technical URL,
never presented as the product brand. It remains until the Hala Job API domain is
DNS-configured, SSL-valid, CORS-enabled, wired into mobile build defines + web env,
and smoke-tested (see migration plan). The public **web** domain (SEO canonical /
Open Graph) has already been switched to `halajob.com`.

Representative locations (all technical URLs):

| File | Use |
|---|---|
| `web/src/shared/config.ts` (`apiBaseUrl` default) | Web → backend API base |
| `web/.env.example` (`VITE_API_URL`) | Web API base example |
| `mobile/lib/src/core/config/app_config.dart` (`halaFallbackBaseUrl`) | Mobile API base default |
| `mobile/lib/src/features/auth/auth_screen.dart` (base-URL field hint) | Diagnostics base-URL hint |
| `.env.example` (`PUBLIC_BASE_URL`, `EMPLOYEE/COMPANY_DASHBOARD_URL`) | Backend + dashboard deep links |
| `docs/api/HALAJOB_OPENAPI.yaml`, `HALAJOB_POSTMAN_*` (server/baseUrl) | API spec server URL |
| `docs/HANDOVER.md`, `docs/MOBILE_WEB_INTEGRATION.md`, mobile/docs handoff `.md` | Handoff notes (annotated) |
| `mobile/test/widget_test.dart` and other `mobile/test/*` (`apiBaseUrl`/`baseUrl` fixtures) | Tests asserting the live API base |

**Reason:** Current live backend domain. Not user-facing branding. Replace only
after the Hala Job production API domain is configured, SSL-tested, and smoke-tested.

---

## Category 3 — Environment variables (MIGRATED with fallback)

Preferred names use the `HALAJOB_` prefix. Resolution order in
`services/email/email.service.js` and `seeders/contentSeeder.js`:

```
HALAJOB_EMAIL_INFO || HALA_EMAIL_INFO || JOBZAIN_EMAIL_INFO || `info@${domain}`
```

`HALAJOB_EMAIL_{INFO,FORGOT_PASSWORD,PASSCODE,SUBSCRIPTION,CHECKOUT,CONTACT,APPOINTMENTS}`,
`HALAJOB_MAIL_DOMAIN`, `HALAJOB_MAIL_FROM_NAME`, and the content addresses
`HALAJOB_{SUPPORT,PRIVACY,LEGAL,BILLING,ACCESSIBILITY,PARTNERS,SECURITY}_EMAIL` are
the documented names (`.env.example`, `docs/ENVIRONMENT.md`). The legacy
`JOBZAIN_EMAIL_*` and interim `HALA_EMAIL_*` names still work as fallbacks during the
migration. Remaining `JOBZAIN_*` strings are the fallback chain, the legacy
`JOBZAIN_EMAILS` export alias, and deprecation docs — all intentional.

**Deprecated:** `JOBZAIN_EMAIL_*` → use `HALAJOB_EMAIL_*`.

---

## Category 4 — Internal model / collection / symbols (KEPT — documented legacy)

The company "talent support" feature retains legacy internal identifiers:

- Model symbol `JobZainTalentRequestModel` (`models/JobZainTalentRequestModel.js`, `models/index.js`)
- MongoDB collection **`jobzain_talent_requests`**
- Controller functions `requestJobZainTalentHelp`, `getMyJobZainTalentRequests`, `getJobZainTalentRequestDetails`, `cancelJobZainTalentRequest`
- API status codes `jobzain_talent_request_created` / `_details` / `_cancelled` / `jobzain_talent_requests`
- Usages across `controllers/dash/*`, `controllers/app/campus/campusController.js`, `routesCompany/jobRoute.js`, and generated `docs/api/*` route inventory

**None of these render the literal "JobZain" to a user** — they are code symbols,
a collection name, and snake_case API status codes. Renaming the collection
requires a data migration with a rollback plan and a maintenance window; renaming
the symbols/status codes risks breaking clients that switch on the exact codes.

**Accepted temporary technical exception until the database migration window.**

### Planned DB migration (not executed now)

`scripts/migrations/rename-jobzain-talent-requests.js` (future) must:
1. Verify source `jobzain_talent_requests` exists and target `talent_requests` has no conflicting data.
2. Copy/rename documents, preserving the three existing indexes.
3. Update the model `collection` name + all symbol/status-code references in the same release.
4. Run `check:syntax`, `check:imports`, `smoke:import`, route tests, and regenerate API docs.
5. Provide rollback: keep the source collection until verified, or reverse-copy.
6. Run on staging before production.

---

## Category 5 — Internal identifiers / fixtures / i18n keys / tooling (KEPT — not user-visible)

| File | Occurrence | Why kept |
|---|---|---|
| `web/src/shared/api.ts` | `model_id: "jobzain-web"` ×5 | Internal request source identifier sent to backend; not user-visible; changing risks server-side matching. |
| `seeders/seedJobsAndApplications.js` | `…@jobzain.test` ×8 | Dev/seed user email fixtures (create + cleanup regex, self-contained). Not user-visible. |
| `helper/en.json`, `helper/ar.json` | keys `jobzain`, `welcome_to_jobzain`, `jobzain_notifications`, `notifications_for_jobzain_app` ×8 | i18n **keys** (internal); their **values are already "Hala Job"**, so users see Hala Job. |
| `scripts/verifyContentPackageContract.js` | `BANNED = /jobzain|jobzien|…/i` | Brand-guard tooling — intentionally contains the banned word to detect it. |
| `scripts/verifyEmailTemplatesRender.js` | `if (/jobzain/i.test(html))` | Brand-guard tooling for rendered emails. |
| `seeders/data/content/README.md`, `docs/content/CONTENT_SYSTEM.md`, `docs/content/COMPLETION_REPORT.md` | rules/notes mentioning `jobzain` | Documentation of the cleanup itself. |
| `docs/security/SECRETS_ROTATION_REPORT.md` | historical Firebase key filename | Security audit trail — must remain for traceability. |

---

## Residual proof

```bash
# Public-source brand text (excluding the documented exceptions above): 0
rg -n "JobZain|jobzain|JOBZAIN|jobzien|Jobzien" mobile/lib web/src sendEmail public openapi postman \
  | rg -v "jobzain\.com|model_id|halajob"
# → no user-visible matches
```

All remaining occurrences are accounted for in Categories 2–5.
