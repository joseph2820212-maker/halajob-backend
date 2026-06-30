# Review Verdict — Legal/Help/Support 9.5 Handout

Date: 2026-06-30
Reviewer: Claude (planning + review)
Subject: `docs/handouts/HALAJOB_CODEX_HANDOUT_LEGAL_HELP_SUPPORT_9_5_SYRIA.md`
Method: 4 read-only audit agents verified every factual claim against tip `c108d92`,
including a live `npm --prefix web test` run.

## Verdict: the handout is SOUND — approved to implement, with corrections below.

It respects the locked navy design, adds no unrelated modules, keeps
`legalReviewStatus`, and its asks are valid. But it **underestimates what already
exists**, so do NOT redo finished work. Corrections:

---

## Claim-by-claim verification

| # | Handout assumption | Reality (verified) | Action |
|---|---|---|---|
| Backend endpoints | "needs work" | **All exist** — support tickets (create/list/detail/reply/close), privacy export/delete/cancel, accessibility, legal reports w/ targetType+targetId, full admin workflows (`models/SupportTicketModel.js`, `routesUser/AccountRote.js`, `PrivacyRote.js:15`, `LegalReportModel.js`, `routes/index.js:370-417,862-873`) | **Skip backend build** — wire UI to existing routes |
| Legal content pages | "add missing pages" | **All 26 exist & bilingual (en/ar)** (`seeders/data/content/pages/*`) incl. every "required" page | **Don't rewrite content** — only add the Syria schedule + gate |
| `legalReviewStatus` enforcement | "add production gate" | Field exists; **NOT enforced** — `contentController.js:42` filters only `status:"published"` | **VALID — build the gate** |
| `LEGAL_CONTENT_ENFORCEMENT_MODE` | "add env" | **Missing** | **VALID — add it** |
| Web help article detail | "may be missing" | **Done** (`legalHelp.tsx:150-172`, `/help/articles/:key`) | Skip |
| Web privacy export/delete/cancel | "wire direct" | **Done** (direct endpoints, `legalHelp.tsx:250-314`) | Skip |
| Web accessibility | "wire" | **Done** (`legalHelp.tsx:228-248`) | Skip |
| Web report fixed choices | "fix" | **Done** (10 radio options + test) | Skip |
| Web support **inbox** | "build" | **PARTIAL** — create form only; `myTickets()` exists in `api.ts:3992` but **not wired to UI** | **VALID — wire the inbox** |
| Web contextual report targetId | "pass real id" | **PARTIAL** — `targetType` hardcoded `"job"`, `targetId` never set (`legalHelp.tsx:339,344`) | **VALID — make it real** |
| Mobile help article detail | "build" | **PARTIAL** — inline expansion only, no detail screen | **VALID** |
| Mobile support inbox | "build" | **PARTIAL** — create only; no list/detail/reply/close | **VALID** |
| Mobile privacy cancel-delete | "build" | **Missing** (export/delete exist) | **VALID** |
| Mobile accessibility form | "build" | **Missing entirely** | **VALID** |
| Mobile contextual reports | "pass target" | **Generic only** — service supports targetType/targetId, UI never passes them | **VALID** |
| Mobile chrome | "lock native" | **Done** — `HalaNativeHeader` everywhere | Skip |
| Admin user vs company support split | "split queues" | Two models exist; admin generic queue reads `SupportTicketModel` (users); company tickets in separate model | **VALID — surface both in admin UI** |
| SYP currency | "decide" | **Real contradiction** — `globalLaunchContract.service.js:1` allows only USD/EUR/GBP and **rejects SYP**, but `web/src/shared/settings.tsx:435` defaults `default_currency:"SYP"` | **NEEDS OWNER DECISION (below)** |
| "Some web tests failing" | true | **TRUE — exactly 1**: `web/src/campus/screens.test.tsx` "university verification actions" (missing event mock); unrelated to legal/help | Fix in Commit 1 |
| Route wiring 331/331 | true | **TRUE** | — |

---

## Revised scope (smaller than the handout's 11 commits)

Because backend + content + most of web are already done, the **real** work is:

1. **Fix the 1 failing campus test** (`screens.test.tsx`). [Codex]
2. **Legal review gate**: enforce `legalReviewStatus` for production +
   `LEGAL_CONTENT_ENFORCEMENT_MODE` env + launch-gate failure list. [Codex — backend/scripts]
3. **Web support inbox**: wire the existing `myTickets()` + detail/reply/close UI. [Codex — web]
4. **Mobile**: help article detail screen; support inbox; cancel-delete; accessibility
   form (`/user/v1/privacy/accessibility`); contextual reports passing real
   targetType+targetId. [Codex — mobile]
5. **Web contextual reports**: set real targetType+targetId from context. [Codex — web]
6. **Admin**: surface BOTH user and company support queues. [Codex — admin/web]
7. **Syria legal schedule page** + SYP decision wiring + per-language review TODO. [Codex]

Everything is **frontend + a small backend gate** — no new backend endpoints needed.

---

## LOCKED DECISION (owner): SYP currency + payments

Owner decision (2026-06-30): **Support SYP, USD, and EUR. Enable payments** —
Syria has a few electronic-payment options, so paid flows are ON (not disabled).

Implementation for Codex:
- **Allowed currencies = `["SYP", "USD", "EUR"]`** for BOTH salary display and
  payments. Update `services/globalLaunchContract.service.js:1`
  (`SUPPORTED_LAUNCH_CURRENCIES`) — add SYP, drop GBP — and the matching test
  `scripts/verifyGlobalLaunchContract.js` (it currently asserts SYP is rejected;
  flip that).
- Update the salary/currency disclaimer content page
  (`seeders/data/content/pages/03_billing_disclaimers.json`) which currently says
  "USD, EUR, and GBP" → "SYP, USD, and EUR".
- Keep the web default `default_currency:"SYP"` (`web/src/shared/settings.tsx:435`)
  — it's now valid.
- **Payments ENABLED but provider-agnostic / config-driven.** Wire purchase flows
  to a configurable payment provider; do NOT hard-code a single processor.
  Integrate the Syria-available electronic-payment option(s) the owner provides
  via config/env, with a clean disabled state if a provider isn't configured for
  an environment.
- ⚠️ Compliance caveat (record, don't block): the actual processor must be
  confirmed by ops/legal for sanctions exposure before production money moves.
  Engineering stays config-driven so the provider can be set per environment.
- Add tests: SYP/USD/EUR salary display; payment purchase enabled when a provider
  is configured; honest disabled state when it isn't.

---

## Who implements & sequencing (single-writer model)

This is mobile + web + admin code that **overlaps the nav cleanup's files**
(mobile `legal_help` + More menu, admin `screens.tsx`, web `public/*`). Per the
locked model, **Codex implements; Claude reviews behind.** Codex should run this
as a slice **after / interleaved carefully with** the nav handout so he never has
two half-done edits in the same file. Suggested: finish nav Phases 1–3 (the
"different thing every time" fix) first, then this legal slice, then nav 4–8.

Claude will review each commit against this verdict (no skipped work, no
regressions, correct target metadata, gate actually fails on unapproved pages).
