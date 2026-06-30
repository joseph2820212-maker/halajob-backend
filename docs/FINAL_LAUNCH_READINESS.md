# Hala Job — Final Launch Readiness

One document. One answer. This consolidates 6 independent audits (backend health, backend completeness, web coverage, mobile coverage, admin coverage, handout reconciliation) into a single launch-readiness call. Where audits disagreed or made a strong claim, it is flagged as uncertain. The bar for "presented/wired" in sections 3 and 4 is **reachability and API wiring — not visual polish**. Design polish is a separate owner + Claude-design pass and is not scored here.

---

## 1. Verdict at a glance

| Area | Status | One-line reason |
|---|---|---|
| Backend | **Close (Ready-minus)** | 20/21 checks pass (the 1 fail is a blocked MongoDB download, not a code bug); only real gaps are CV-parse (stub) and online payments (manual by design). |
| Web (presentation/wiring) | **Close** | Nearly every backend capability has a reachable, wired control; only 2 minor PARTIALs (keyword search not sent to server; no company self-serve "request plan" button). |
| Mobile (presentation/wiring) | **Close** | Broad coverage; a handful of real gaps (accessibility request, privacy cancel-delete, per-company report, general messaging inbox) plus 6 orphan company service methods with no UI. |
| Admin panel | **Needs work** | Core moderation/notify/billing wired, but user-support queue, accessibility requests, roles/permissions UI are missing, and legal-page approval + legal/privacy actions are view-only. |

---

## 2. Backend — is it 9.5-ready on its own?

**Short answer: No, not yet — but it is very close. Honest score ~9.0/10.**

**Check/test battery: 20 of 21 PASS.** The single failure (`test:data-retention`) is an environment limitation — the in-memory MongoDB binary cannot be downloaded in the sandbox (403 from `fastdl.mongodb.org`). The test logic is sound and this is shared by every mongo-memory integration test; it is not a backend defect. Notable passes: 4,001 endpoints with 100% write-validation coverage (2,529/2,529), 106 models with all references resolving, 0 broken web-route wiring (335/335 matched), 336 mobile route checks, 69 email templates rendering in EN + AR, secret scan clean, 0 TODO/FIXME/HACK in source.

**Organization verdict: Strong.** Clean domain-driven layering (controllers/models/services/routes split by domain). The main wart is one god-file controller (`controllers/app/campus/campusController.js`, ~4,759 lines) plus a few 1,200+ line controllers. Cosmetic only — not a launch blocker.

**Mock/placeholder items (all honestly gated):**
- **AI** — defaults to a `"mock"` provider returning hardcoded strings. Production **blocks** mock unless explicitly enabled (returns 503 `ai_mock_provider_disabled_in_production`). A real OpenAI-compatible adapter exists but needs a provider + key. Honest, per the no-fake-AI rule.
- **CV parser** — the most material gap. Even when "configured," it returns `"Configured parser adapter is not available in this build."` There is **no working parsing adapter** end-to-end; the feature is a stub. (Confirmed by the backend-health audit.)
- **Online payments** — none. Subscriptions are manual admin-assign only (request → admin approve). Deliberate, per the no-fake-payment rule.

**Missing core capability:** Only three genuine absences across all backend audits — (1) functional CV parsing, (2) online payment processing (intentional), and — flagged by the completeness audit — (3) no readable two-way messaging (`GET` thread/inbox; messaging is send-only) and no public/unauthenticated job-search endpoint for SEO/landing discovery. *Uncertainty note: the two audits weight messaging differently — health treats it as covered via per-application threads; completeness flags the missing read/inbox primitive. Treat readable messaging as a real but contained gap.*

**Honest score: ~9.0/10.** To reach 9.5: implement a real CV-parse adapter, split the god-controller, and provide an offline MongoDB binary so the retention/integration gate can actually run green. None of these is large.

---

## 3. Every backend function presented in the UI? (web + mobile)

This is the owner's core question. The answer is: **almost everything is reachable and wired — coverage is high on both platforms — with a short, precise list of real gaps.** This is about wiring, not design.

### Web — essentially complete
Every audited backend capability has a reachable, API-wired control **except two PARTIALs**:
1. **Keyword search not sent to backend (PARTIAL)** — public and seeker job search filter **client-side only**; the keyword is never passed to `jobService.list`, so server-side search/relevance is unused.
2. **Company self-serve subscription request (PARTIAL)** — `requestSubscriptionPlan` exists in the API but has no button; billing tab is read-only and admins assign plans. Likely intentional manual-billing design.
- Minor: seeker dashboard grid doesn't duplicate report/rate/review, but those are reachable for everyone via the public Jobs screen, so the capability is present.

**Net (web): no outright MISSING capability** — just the two PARTIALs above.

### Mobile — broad coverage, a few real gaps
Most seeker/campus/company/university capabilities are CONFIRMED. Real items:
- **Accessibility request — MISSING** (settings shows static info only; no submission). *Maps to backlog B6.*
- **Privacy request cancel-delete — MISSING** (no control/service). *Maps to backlog B6.*
- **Per-company contextual report — PARTIAL** (only a generic report screen; no per-company target). *Maps to backlog B7.*
- **General messaging inbox — PARTIAL** (only per-application threads; no standalone inbox — consistent with the backend's send-only messaging gap).
- **Six company "orphan" service methods with no UI caller:** `updateInterviewStatus`, `submitInterviewFeedback`, `markInterviewNoShow`, `sendInterviewReminder`, `saveTalentPoolCandidate`, `saveJobTranslation`. Backend works; the buttons aren't wired.

### Intentionally hidden for Syria-first (NOT gaps)
- **No online-checkout / Stripe UI** anywhere (seeker or company). Payment labels appear only in admin platform settings — consistent with manual/admin billing.
- **Premium tabs are feature-flag gated** (CV studio, salary, talent-pool CRM, video interviews, branding, AI tools, resources, job alerts, interview prep). Hidden-by-flag is config, not missing UI.
- Admin UI is absent from mobile **by design**.

**Bottom line for section 3:** Presentation/wiring coverage is high on both platforms. Web has zero hard-missing items (two PARTIALs). Mobile has 2 MISSING + 2 PARTIAL user-facing items and 6 unwired company methods. None is architectural; all are finite, shippable tasks.

---

## 4. Admin panel — complete and connected?

**Answer: No — connected for the core, but not complete.** The most-used flows are wired (company-request moderation, job approvals, trust queue, send-notification, subscriptions/billing, analytics, salary insights, AI admin, platform settings, communication/audit logs). But several capabilities are missing or view-only:

**MISSING (not surfaced / not wired):**
- **User support tickets** — only the **company** support queue is wired. The separate user `SupportTicketModel` / `/support-queue` route exists but is **never called by any web client**. Given the explicit user-vs-company split this is high priority. *Maps to backlog B8.*
- **Accessibility requests** — backend resource exists; no tab and no `adminService` method.
- **Roles / Permissions management** — factory CRUD exists; no admin tab. Users tab is view-only, so no role assignment from the panel.

**PARTIAL (visible but not actionable):**
- **Legal-page lawyer approval** — `legalReviewStatus` renders as text and the approve route exists, but there is **no action button**; approval cannot be performed from the panel. *Owner+engineering: button must be wired, then a lawyer must actually approve.*
- **Legal reports & Privacy requests** — list + View only; no resolve/fulfil/close action despite backend support.
- **Users** — list/detail only; no edit/suspend/role action.

**Confirmed working (the specific questions):** Send-notification is present and wired. No tab renders truly empty.
*Minor note: a few standalone render branches (jobs/trust/talent/support) aren't in the sidebar nav, but their content is duplicated inside the composite moderation/support tabs, so no capability is lost.*

---

## 5. FINAL TO-DO before launch

### A) Engineering left (can be done by Claude/Codex) — ordered, each item = one shippable task

1. **Admin: surface the USER support queue** alongside the company queue (wire `supporttickets`/`support-queue` into `adminService` + a tab). *(B8 — highest priority; user-vs-company split is currently broken in the UI.)*
2. **Admin: wire legal-page approve/reject action button** so lawyer approval is actionable (backend route already exists).
3. **Admin: add resolve/fulfil/close actions** for legal reports and privacy requests (backend supports it; UI is view-only).
4. **Mobile: build accessibility-request form + privacy cancel-delete control** (`/user/v1/privacy/...`). *(B6.)*
5. **Web + mobile: contextual reports carry real `targetType` + `targetId`** (web currently hardcodes `"job"`; mobile is generic-only). *(B7.)*
6. **Wire the 6 mobile company orphan methods** to real controls: interview status/feedback/no-show/reminder, save-talent-pool-candidate, save-job-translation.
7. **Web: send the search keyword to the backend** (`jobService.list` query param) so server-side search/relevance is used instead of client-side filtering.
8. **Admin: add Roles/Permissions management UI** and user edit/suspend/role actions (Phase 8 admin: pagination, bulk, global search, styled confirm modal, i18n strings).
9. **Implement a real CV-parse adapter** (or, if deferring, make the stub state loudly honest in the UI). This is the main backend feature gap for 9.5.
10. **Provide an offline MongoDB binary / `CONNECTION_URL`** so `test:data-retention` and the integration suite can run green in CI (clears the only failing check).
11. **Add readable two-way messaging** (`GET` thread/inbox endpoint + UI) — *uncertain priority; confirm with owner whether two-way chat is in launch scope.*
12. **(Optional, quality)** Split the ~4.7k-line `campusController.js` and the ~22k-line mobile `dashboard_screen.dart`; add public job-search/SEO endpoint. Not blockers.

### B) Owner-only (cannot be done for you)

1. **Syria payment-provider details** — provider choice + credentials/config for any real purchase flow (Phase 11 is blocked on this). Until then, keep manual/admin billing and the honest "no online payment" stance.
2. **Lawyer approval of legal/content pages** (and the Syria launch legal schedule, per-language ar/en review — B10). Engineering wires the button; only a lawyer can approve.
3. **Complete the 14 pending production-launch-evidence rows** — owner/external sign-off (C3 / Phase 20).
4. **App-store accounts** (Apple/Google) for distribution, plus a fresh APK built from the current tip (current APK proof is from an older commit, not the live source — do not call it fresh).
5. **Real AI provider key** *if* AI is wanted as a real feature (set `HALA_AI_PROVIDER` + key; otherwise it stays honestly mock-gated).
6. **Design / visual polish review** with Claude design — explicitly out of scope here; sections 3–4 measured wiring, not polish.
7. **Repo-split execution** (create the 4 repos + grant access — Step 0) if the split is still desired; otherwise skip.

---

## 6. Bottom line

When list A is done and you handle list B, the app is launch-ready — everything structural is already built. The backend is strong (~9.0/10, 20/21 checks green, the one failure is a sandbox download limit), and both web and mobile already present and wire **almost every** backend capability; the remaining items are a finite, named list of buttons to wire and two honest stubs (CV parsing, online payments). The biggest real gaps are admin (user-support queue, legal-approval action, roles UI) and a few mobile forms — all in list A. To hit a true **9.5**, expect roughly the A1–A10 engineering tasks plus the owner sign-offs in B; realistically the project is a **short, well-defined push** away (not a rewrite). Honest caveat: the 9.5 score also depends on the integration test suite actually running green and the production-evidence rows being signed off, which are gated on environment and owner, not code.
