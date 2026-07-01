# Hala Job — UX & Navigation Master Plan

Date: 2026-06-30
Owner of this plan: Claude (UI organisation & flow)
Audited against: Codex tip `c108d92` (mobile + web), Codex's
`FUNCTION_PLACEMENT_MAP.md` + `MOBILE_INFORMATION_ARCHITECTURE_PLAN.md`, and a
market UX audit of **LinkedIn, Indeed, Handshake, Bayt (MENA/Arabic), Glassdoor**.

Goal: an organised, tidy, predictable app — same navigation logic everywhere,
no function in two places, every tap does the same thing every time — mobile
first, mirrored on web, Arabic-first (RTL).

---

## 0. Why the app feels disorganised (root causes, found in code)

These are not opinions — they're in the current code on Codex's tip.

1. **Non-deterministic tabs (the "different thing every time" bug).** On
   seeker/campus, the **Jobs tab and Saved tab render the same `_ExplorePanel`
   and share one segment-state field** (`dashboard_screen.dart:461-596`,
   `_seekerSegment` @249). Tapping "Saved" does **not** reset to saved — it shows
   whatever segment you last viewed. Campus "Campus" tab defaults to
   Opportunities while a separate "Saved" tab exists (@250). This is the #1 cause
   of the confusion.
2. **Same function in many places, different affordances.** CV Manager appears in
   **3** places (More quick action @2859, Home profile-checkpoint → @4953,
   notification routing @2326). Job Alerts in **2** (More @2836 + a Jobs-tab
   segment @3041). Interview Prep in **2** (More + Jobs-tab segment). Users can't
   build muscle memory.
3. **Dead taps.** Company "Talent" tab renders a "disabled by platform settings"
   panel when the flag is off (`company_dashboard_screen.dart:783`) instead of
   hiding the tab.
4. **Inconsistent action routing.** Some quick actions switch tabs
   (`_changeTab`), others push a new screen — no rule (@2935, @3288, @3396).
5. **University tabs mislabeled.** University bottom nav is Home/Campus/
   Applicants/Jobs/More (`university_dashboard_screen.dart:942-968`) — generic
   labels that don't match a career-center's real jobs (Students, Verifications,
   Partners) from the placement map.

Good news: **cards already push to detail screens consistently** (opportunities,
applications, events, resources all use `InkWell → MaterialPageRoute`). And every
role already has exactly **5 bottom tabs** — the right number. The problem is
*what's in them and how state is shared*, not the tab count.

---

## 1. Design principles (the best of the 5 apps + Codex's rules)

Distilled from the market audit, kept compatible with Codex's placement map:

| Principle | Source | Rule for Hala Job |
|---|---|---|
| **≤5 stable bottom tabs, by ID not label** | All 5 apps | Already true. Lock tab IDs; never reorder per state. |
| **Universal push-to-detail** | LinkedIn, Indeed, Handshake | *Every* list card → full detail screen + back. One detail template per entity. No card opens a different affordance than its siblings. |
| **Lifecycle pipeline tab** | Indeed "My Jobs" | Collapse Saved + Applied + Interviews + Offers into one **"My Jobs"** tab with sub-states. Removes the shared-state bug and frees a tab. |
| **Entity page as unifier** | Glassdoor | A **Company page** carries tabbed lenses: About · Jobs · Reviews · Salary. Don't give reviews/salary their own bottom tabs. |
| **Events first-class + Follow** | Handshake | Campus: Events is a real tab (browse → register → join/QR). "Follow employer/university" drives re-engagement. |
| **True RTL, not faked** | Bayt | Mirror the whole shell (nav order, back-chevron, icons); keep numerals/dates/Latin names LTR via bidi. |
| **Profile = entity, Settings = account, one level deeper** | All 5 + Codex | Header profile → entity profile; header settings → account (sign out always visible). Activity (saved/applied/alerts) lives with the role, not Settings. |
| **One AI entry per role** | LinkedIn (anti-clutter) + Codex | `AI career tools` (seeker/campus) / `AI hiring tools` (company) appears exactly once, flag-gated. |
| **No function in two places** | Codex no-duplication rule | More may hold *shortcuts*, never a second copy of a primary flow with a different UX. |

---

## 2. Target information architecture (the recommendation)

Mobile bottom nav per role (≤5), with everything else in a disciplined **More**.
Web mirrors the *ownership*, not the layout (web = wide tabs + right-panel detail).

### Job Seeker
- **Home** — overview, recommendations, readiness (Home only).
- **Jobs** — discovery + search + filters ONLY. Never shows saved. (kills bug #1)
- **My Jobs** — lifecycle pipeline: Saved · Applied · Interviews · Offers (Indeed pattern; replaces the separate Saved + Applied tabs).
- **More** — single home for: CV Manager (the one canonical entry), AI career tools, Interview Prep, Resources, Job Alerts, Salary, Career Passport, Companies.
- *(Optional 5th later: Inbox/Messages if messaging grows.)*
- Header: profile (seeker profile) · bell · settings (account + sign out).

### Campus Student
- **Home** — overview.
- **Opportunities** — campus discovery + search ONLY (own state, not shared).
- **Events** — first-class: browse → detail → register → join/QR (Handshake).
- **My Applications** — applied + saved campus items as sub-states.
- **More** — Career Passport, Student Verification, Resources, Interview Prep, AI career tools, Job Alerts.
- Header: profile (academic) · bell · settings.

### Company
- **Home** — dashboard metrics only.
- **Jobs** — post/edit/pause/resume; job detail owns job actions.
- **Applicants** — applicant detail owns status/notes/messages/rating/interviews.
- **Talent** — talent pool, invitations, campus recruiting. **Hide the tab when flag off** (no dead panel — fix #3).
- **More** — AI hiring tools (once), company files, support, audit, subscription, team, questions, templates.
- Header: profile (company entity) · bell · settings (sign out always visible).

### University Career-Center  (relabel — fix #5)
- **Home** — overview metrics.
- **Students** — list → student detail (read-only career passport).
- **Verifications** — document queue: approve/reject/request-info.
- **Partners** — employer partners: approve/reject/suspend.
- **More** — Opportunities/Post internship, Reports, Analytics, Events/Resources, account + sign out.
- (Drop the misleading "Campus/Applicants/Jobs" labels.)

### Admin
- **Web only** (no mobile admin — by design). Mirror the placement map's 19 grouped modules; keep `/dash/v1` grouped, never a giant tab strip.

---

## 3. Web mirroring rule

Same backend routes, same **ownership**, platform-appropriate layout:
- Web keeps **wide horizontal tabs per role** + **right-side panel** for detail (already consistent — `JobDetailPanel`/`QueueDetailPanel`).
- The mobile "My Jobs" pipeline = web's seeker Saved/Applications/Interviews/Offers tabs (already present) — just align labels/grouping.
- Company unifier page (About/Jobs/Reviews/Salary) added on both.
- Web detail must stay panel-based (no URL change today); acceptable, but ensure deep-link parity later.

---

## 4. The phased plan

Each phase is independently shippable and guarded. Effort: S<½d, M≈1d, L>1d.
"Who": **Codex** = needs Flutter toolchain (mobile); **Claude** = web/docs/CI.

### Phase 0 — Lock the IA (decisions only) — S — Claude
- Confirm the target nav above (esp. the two open decisions in §6).
- Update `FUNCTION_PLACEMENT_MAP.md` + `MOBILE_INFORMATION_ARCHITECTURE_PLAN.md`
  to match (placement map is updated **first**, per Codex's own rule).
- Output: agreed spec both Claude and Codex build to.

### Phase 1 — Kill the non-determinism (the actual complaint) — M — Codex
- Seeker: **Jobs tab = discovery only**; remove the saved default (@249). Give the
  Saved view its **own state**, not the shared `_seekerSegment`.
- Collapse Saved + Applied into the **"My Jobs"** pipeline tab with explicit
  sub-states that reset on tab entry.
- Campus: same fix; Opportunities own state, separate from saved.
- Guardrail: widget test asserting "tap Saved always shows saved, regardless of
  prior Jobs segment."
- **This is the highest-value phase — do it first.**

### Phase 2 — One home per function (de-dupe) — M — Codex
- CV Manager: **one** canonical entry (More → "CV Manager"); Home checkpoint and
  notifications *navigate to it*, not reimplement it.
- Job Alerts, Interview Prep: remove the Jobs-tab segment copies; keep the single
  More entry (or vice-versa — pick one, per Phase 0).
- Guardrail: extend `function-placement-contract.json` occurrence-count checks.

### Phase 3 — Fix per-role bottom navs — M — Codex
- University: relabel to Home/Students/Verifications/Partners/More.
- Company: hide "Talent" tab when flag off (no dead panel).
- Campus: promote **Events** to a first-class tab.
- Guardrail: per-role bottom-nav inventory test (tab IDs fixed).

### Phase 4 — Universal interaction contract — M — Codex + Claude
- Every card → detail push (audit any stragglers). One detail template per entity.
- Quick actions: a single rule — actions that open a primary flow **push a
  screen**; actions that jump to a tab use `_changeTab` and are visually marked
  as shortcuts. No silent fall-through (fix #4, @2923/@2938).
- Guardrail: extend `ui-action-contract.json` to cover quick-action routing.

### Phase 5 — Entity unifier pages — L — Codex + Claude
- Company page with tabbed lenses (About · Jobs · Reviews · Salary) on mobile +
  web — folds salary guidance + company reviews in without new bottom tabs
  (Glassdoor pattern).
- Campus: cross-link job ↔ employer ↔ event with inline **Follow** (Handshake).

### Phase 6 — RTL / Arabic hardening — M — Codex + Claude
- Verify the whole shell mirrors (nav order, back-chevron, directional icons),
  not just text alignment.
- Bidi: numerals, dates, Latin company names stay LTR inside Arabic.
- Language toggle reachable pre-login and in Settings (Bayt pattern).
- Guardrail: RTL golden tests for each role's home + one detail screen.

### Phase 7 — Web parity pass — M — Claude
- Align web tab labels/grouping to the same ownership (My Jobs pipeline, company
  unifier). Keep right-panel detail. Confirm no web-only/mobile-only drift beyond
  the intended admin-web-only + university-members gap.

### Phase 8 — Make it stay fixed (enforcement) — S — Claude
- **Wire the placement guard into CI** (currently it is NOT — see note below).
- Add the new widget/golden tests from Phases 1–6 to `flutter-mobile-ci.yml`.
- Result: a regression that re-introduces a duplicate or a shared-state tab fails
  the build.

> **CI gap to fix in Phase 8:** `test:function-placement-map` and the whole
> `test:launch-gate:ui-contracts` aggregate are **not run by any GitHub Actions
> workflow** today — they only run locally. The guard is documentation until CI
> calls it. One step in `flutter-mobile-ci.yml` closes this.

---

## 5. Suggested sequencing / "how many nexts"

| Order | Phase | Why first |
|---|---|---|
| 1 | Phase 0 (decisions) | unblocks everything |
| 2 | **Phase 1** | fixes the actual complaint |
| 3 | Phase 2 | removes the duplication confusion |
| 4 | Phase 3 | correct per-role navs |
| 5 | Phase 8 (CI) | lock the gains before adding more |
| 6 | Phase 4 | interaction polish |
| 7 | Phase 6 (RTL) | launch-critical for Arabic |
| 8 | Phase 5, 7 | richer unifier pages + web parity |

Phases 1–4 + 8 get you to "tidy and predictable." 5–7 get you to "best-in-class."

---

## 6. Open decisions (need your call — Phase 0)

1. **Seeker tabs:** adopt the **"My Jobs" pipeline** (Saved+Applied+Interviews+
   Offers in one tab) as recommended, or keep separate Saved and Applied tabs but
   just fix the shared-state bug? (Recommendation: My Jobs — frees a slot, matches
   Indeed.)
2. **Saved tab divergence:** Codex's handout said *keep* a Saved bottom tab; this
   plan folds it into My Jobs. Pick one so Codex and I don't fight. (Recommendation:
   fold.)
3. **Single home for Job Alerts / Interview Prep:** put them in **More** (clean) or
   keep them reachable from the Jobs tab too as marked shortcuts?
4. **5th seeker tab:** leave seeker at 4 tabs (Home/Jobs/My Jobs/More) or add an
   **Inbox** tab now?

---

## 7. Division of labour (single writer on code)
- **Codex implements ALL phases** (mobile + web + CI + tests) on branch
  `codex/gate-a-mobile-ui-lock`, updating the placement map first.
- **Claude does not commit code** — Claude reviews each phase behind Codex and
  maintains the planning docs only. One writer on code = no branch conflicts.
- Execution spec for Codex: `HALAJOB_MOBILE_HANDOFF.md` (same branch).
- Everything builds through the locked navy design contract.
