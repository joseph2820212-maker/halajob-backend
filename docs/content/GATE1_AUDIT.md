# Gate 1 — Legal / Privacy / Help / Support / Email Content Audit

**Branch:** `claude/harden-trunk` · **Date:** 2026-06-28 · **Scope:** inventory only (no code changes)

This is the locked-gate audit required before any implementation. It lists what exists today and every gap versus the V2 handout.

---

## A. Backend — what EXISTS

### Static/legal pages
- `models/PageModel.js` — **basic** schema: `key`, `image`, `title_ar/en`, `description_ar/en`, `content[{ value_ar, value_en, type: 'title'|'description' }]`, `status`, `is_ios`. `strict:false`.
- `controllers/app/pages/pagesController.js` — `get`, `details`.
- `routesUser/pageRote.js` — `GET /user/v1/page/get`, `GET /user/v1/page/details/:key`.
- `seeders/staticPagesSeeder.js` + `seeders/data/static_pages/pages_manifest.json` + DOCX files.
- **13 seeded page keys:** `about_us`, `contact_information`, `terms_and_conditions`, `employer_terms`, `privacy_policy`, `cookies_policy`, `acceptable_use_content_policy`, `anti_discrimination_policy`, `recommendations_automated_systems_policy`, `account_data_deletion_policy`, `cv_uploaded_files_policy`, `payment_refund_policy`, `legal_reports`.
- `models/ContentTranslationModel.js` — translation infra exists.

### Support
- `models/CompanySupportTicketModel.js` (company-only).
- `controllers/companyDash/support/companySupportController.js` + `controllers/dash/adminSupportController.js`.
- Company routes: `GET/POST /company/v1/global/support-tickets`, `/:id`, `/:id/messages`.
- Admin routes: `/dash …/support-tickets` (list/detail/status/messages), permissioned by `support.view|manage`.

### Legal report / trust
- `models/JobReportModel.js` — **jobs only** (`reason` enum, `status`, unique per user+job).
- `TrustAdminController` admin queue: `/trust/review-queue`, `mark-safe`, `suspend`, `request-documents`.
- `createDashResourceRouter('jobreports')` admin CRUD.

### Privacy
- `controllers/app/Me/AccountPrivacyController.js` (added this session) — `POST /user/v1/account/delete-request`, `/cancel`, `GET /user/v1/account/export`. `UserModel` deletion fields.

### Email
- `services/email/email.service.js` + `services/sendEmail/templates/` → **only** `base.html`, `passcode.html`, `important-action.html`.
- Auth controllers send recovery/verification/passcode via these.

---

## B. Frontend — what EXISTS

### Mobile (`mobile/lib`)
- Register passes `accept_terms`/`terms_accepted` (boolean) and a campus terms guard — but **no visible Terms/Privacy consent text or links** on the register/login screens.
- Company dashboard has a support open/list flow (`_openSupport`).
- A few AI-ish "Review and edit…" notices on 2–3 AI screens (not a standardized AI label).
- **No** Help Center, Legal page, Privacy Center, FAQ, Support-ticket-create, Report-job/company, Accessibility, or Communication-preferences screens.

### Web (`web/src`)
- `SiteFooter` (chrome.tsx) — brand + **job-seeker/company links only**. No legal/help/privacy/terms/cookie/accessibility/contact links.
- `web/src/public/screens.tsx` + SEO. **No** legal page renderer, help center, FAQ, cookie banner, support forms, or report forms.
- Company support is wired in `api.ts` (company tickets only).

---

## C. GAP LIST (required → missing)

### C1. Legal/policy pages — 13 of 26 exist, **13 missing**
Missing keys: `job_seeker_guidelines`, `university_partner_terms`, `campus_student_terms`, `community_guidelines`, `trust_safety_policy`, `copyright_ip_policy`, `privacy_choices`, `student_data_document_visibility_policy`, `communications_notification_policy`, `accessibility_statement`, `subscription_terms`, `external_apply_third_party_links_policy`, `salary_currency_job_info_disclaimer`.

### C2. Content model too basic
`PageModel.content.type` only supports `title`/`description`. Missing: rich content blocks (heading/paragraph/list/notice/warning/faq/table/contact/cta/legal_disclaimer + severity/anchor), `audience`, `category`, versioning, `effectiveAt`/`publishedAt`/`lastReviewedAt`, `status` (draft/review/published/archived), `requiresAcknowledgement`, `legalReviewStatus`, SEO.

### C3. Help Center — **entirely missing**
No `HelpCategoryModel`, `HelpArticleModel`, help APIs, seeders, or web/mobile screens.

### C4. FAQ — **entirely missing**
No `FaqItemModel`, FAQ APIs, seeders, or screens (5 sections required: public/seeker/company/campus/university).

### C5. Support — only company + admin
Missing general `SupportTicketModel` + **seeker / campus / university** support routes + create-ticket UI (mobile & web). 17 categories + states/priority rules not modeled.

### C6. Legal reports — jobs-only
`JobReportModel` covers jobs. Missing general `LegalReportModel` (company/user/message/IP/impersonation/harassment) + report-company flow + IP/copyright complaint flow + public report API.

### C7. Privacy requests — partial
Only account-deletion-request + export exist. Missing `PrivacyRequestModel` + full types (access/correction/restriction/objection/consent-withdrawal/marketing-opt-out), admin privacy queue, deadlines.

### C8. Consent / acknowledgement — missing
No `UserPolicyAcknowledgementModel` / `UserConsentModel` (current `accept_terms` is an untracked boolean, no version/IP/timestamp).

### C9. Email system — minimal
No `EmailTemplateModel`/`EmailLogModel`; only 3 HTML templates. ~60 required templates missing (account/security, seeker, company, campus/university, privacy/legal/trust, billing); no bilingual subjects/preheaders, unsubscribe, or delivery logging.

### C10. Accessibility + comms prefs — missing
No `AccessibilityRequestModel`, no `CommunicationPreferenceModel`.

### C11. User-facing notices — mostly missing
Register consent text, login security note, CV-upload privacy notice, apply sharing notice, external-apply warning, job-detail salary/trust notices, standardized AI notice, Career Passport note, campus/company verification notices, account-deletion warning, web cookie banner — **none present as the handout specifies**.

### C12. Web routes/footer — missing
No `/about /contact /help /help/:cat /help/articles/:slug /faq /legal /legal/:key /privacy /privacy/choices /cookies /accessibility /report /support …`; footer lacks all legal/help links; no cookie banner.

### C13. Mobile screens — missing
HelpCenter/HelpCategory/HelpArticle/Faq/LegalPage/PrivacyCenter/SupportHome/CreateSupportTicket/SupportTicketDetail/ReportJob/ReportCompany/LegalReport/AccessibilityRequest/CommunicationPreferences screens; Settings rows (Help & Support, Privacy Center, Legal, Communication Preferences, Accessibility, About, Delete Account).

### C14. Admin tooling — missing
Content-page CMS (publish/version/ack), help/FAQ management, general support queue (seeker/campus/uni), general legal-report queue, privacy-request queue, email templates/logs, consent logs, content audit.

### C15. Public content API — missing
`/public/v1/content/pages…`, `/public/v1/help…`, `/public/v1/faq`, `/public/v1/legal/:key` (current `/user/v1/page/*` must stay for back-compat).

### C16. Tests / seeders / docs — missing
9 verify scripts (§18), help/faq/email seeders (§20), and the inventory docs (§19) do not exist.

---

## D. Decisions to confirm before Gate 2
1. **Content model:** upgrade by adding a new richer `ContentPageModel` and **mapping** the 13 existing `PageModel` keys into it while keeping `/user/v1/page/*` working (recommended), vs. extending `PageModel` in place.
2. **Support model:** generalize into one `SupportTicketModel` with `audience` while keeping `CompanySupportTicketModel` working (recommended: add general model, leave company tickets intact).
3. **Lawyer review:** all legal wording will be drafted as professional placeholders marked `legalReviewStatus: needs_lawyer_review` — not final legal advice.
4. **Emails/domains:** support/privacy/legal addresses + final domain are env-driven; no fake hardcoded addresses in production.

**Gate 1 status: COMPLETE.** No code changed. Proceed to Gate 2 (content source of truth) on approval.
