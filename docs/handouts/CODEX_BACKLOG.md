# Codex Backlog — single source of truth

Date: 2026-06-30
Branch: **`codex/gate-a-mobile-ui-lock`** (the one shared branch)
Model: **Codex implements all code; Claude reviews behind + maintains docs.**
This index lists every queued work item so nothing falls through. Source specs
are linked; do not duplicate work already verified as done.

## How to work this backlog
- Update `docs/FUNCTION_PLACEMENT_MAP.md` first when a function moves (your rule).
- Commit per item with a clear message; Claude reviews each commit against the spec.
- Keep one file-area edit complete before switching, so the two streams
  (navigation + legal/help) never leave the same file half-done.
- Acceptance commands: see the legal handout §11 + run `flutter analyze`/`test`.

---

## Stream A — Navigation / IA cleanup
Spec: `HALAJOB_MOBILE_HANDOFF.md` + `HALAJOB_UX_NAVIGATION_MASTER_PLAN.md`

- [ ] A1 (Phase 1) — Kill non-deterministic tabs: Jobs vs Saved shared state; build
      "My Jobs" pipeline. **Highest priority (the user's main complaint).**
- [ ] A2 (Phase 2) — One home per function (CV manager, job alerts, interview prep).
- [ ] A3 (Phase 3) — Per-role nav fixes (relabel university, hide dead Talent tab,
      promote campus Events).
- [ ] A4 (Phase 4) — Universal interaction contract (card→detail; quick-action rule).
- [ ] A5 (Phase 5) — Entity unifier company page (About/Jobs/Reviews/Salary).
- [ ] A6 (Phase 6) — RTL/Arabic hardening (true mirroring + bidi).
- [ ] A7 (Phase 7) — Web parity with the mobile IA.
- [ ] A8 (Phase 8) — Wire placement guard + new tests into CI.

## Stream B — Legal / Help / Support → 9.5
Spec: `docs/handouts/HALAJOB_CODEX_HANDOUT_LEGAL_HELP_SUPPORT_9_5_SYRIA.md`
Verified scope: `docs/handouts/LEGAL_HELP_SUPPORT_REVIEW_VERDICT.md`
(Backend + 26 bilingual legal pages + most of web already exist — don't redo.)

- [ ] B1 — Fix the 1 failing web test (`web/src/campus/screens.test.tsx`); make
      `npm --prefix web test` fully green.
- [ ] B2 — Legal review production gate: enforce `legalReviewStatus` +
      `LEGAL_CONTENT_ENFORCEMENT_MODE` env + launch-gate failure list.
- [ ] B3 — Web support inbox: wire existing `myTickets()` + detail/reply/close UI.
- [ ] B4 — Mobile help article detail screen.
- [ ] B5 — Mobile support inbox (list/detail/reply/close).
- [ ] B6 — Mobile privacy cancel-delete + accessibility request form
      (`/user/v1/privacy/accessibility`).
- [ ] B7 — Contextual reports carry real `targetType`+`targetId` (web + mobile).
- [ ] B8 — Admin: surface BOTH user and company support queues.
- [ ] B9 — Currency (LOCKED): SYP/USD/EUR + payments ENABLED, provider config-driven.
      Update `globalLaunchContract.service.js` (+ its test) and the disclaimer page;
      wire purchase flows; honest disabled state when no provider configured.
- [ ] B10 — Syria launch legal schedule page + per-language (ar/en) review TODO.

## Stream C — Net-new from ChatGPT review
Source: `docs/handouts/CHATGPT_CODE_REVIEW_VERDICT.md`

- [ ] C1 — Split the ~21,927-line `mobile/lib/src/features/dashboard/dashboard_screen.dart`
      into modules (Settings, CV, filters, legal/help, per-role). Reduces risk and
      supports Stream A. Do incrementally; keep guards green each step.
- [ ] C2 — Flutter proof from latest commit: `flutter analyze`, `flutter test`,
      build APK; attach output/APK stamp. (Codex environment only — can't be done
      in the planning sandbox.)
- [ ] C3 — Complete the 14 pending production-launch-evidence rows. **Needs
      owner/external sign-off**, not code — flag to owner; don't fake the rows.

---

## Suggested order
1. **A1** (the live complaint) → 2. **B1** (get tests green) → 3. **B2** (legal gate)
→ 4. **B3–B8** (support/privacy/reports) → 5. **A2–A4** (nav de-dupe + per-role)
→ 6. **B9–B10** (currency + Syria schedule) → 7. **A5–A8** (unifier, RTL, web, CI)
→ 8. **C1** (god-file split, incremental throughout) → 9. **C2** (Flutter proof)
→ 10. **C3** (owner evidence).

## Owner action items (not Codex)
- C3 production-evidence sign-offs.
- Provide the Syria electronic-payment provider config for B9.
- Lawyer approval of legal pages before production (B2 gate will block otherwise).
