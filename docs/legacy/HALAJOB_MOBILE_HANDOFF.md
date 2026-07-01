# Hala Job — Mobile Navigation Handoff (for Codex)

Date: 2026-06-30
From: Claude (planning + review)
Branch: **`codex/gate-a-mobile-ui-lock`** — this is THE branch. Codex commits all
code here; Claude only reviews and edits docs. See "Working model" at the bottom.
Full rationale + market audit: `HALAJOB_UX_NAVIGATION_MASTER_PLAN.md` (same branch).

This is the **full job spec** — mobile, web, and CI. Codex implements all of it;
Claude reviews behind each phase. Line numbers are against tip `c108d92`. Do the
phases in order; each is independently shippable and reviewable.

---

## Locked decisions (Phase 0) — these are final, build to them

1. **Fold the seeker "Saved" bottom tab into a "My Jobs" pipeline tab.**
   New seeker bottom nav = **Home · Jobs · My Jobs · More** (4 tabs).
   "My Jobs" has sub-states: **Saved · Applied · Interviews · Offers**.
   > ⚠️ **This SUPERSEDES the earlier handout instruction to keep a separate
   > Saved tab.** The owner has approved folding it. Don't keep both.
2. **Jobs tab = discovery only.** It must never display saved items and must not
   share state with any saved view.
3. **One home per function.** Job Alerts and Interview Prep live in **More only**.
   Remove their duplicate copies from the Jobs-tab segment control.
4. **CV Manager has exactly one canonical screen.** Other entry points navigate
   to it; they do not reimplement it.
5. **Update `docs/FUNCTION_PLACEMENT_MAP.md` + `MOBILE_INFORMATION_ARCHITECTURE_PLAN.md`
   FIRST** (your own rule), then the code, then the guards.

---

## Phase 1 — Kill the non-deterministic tabs (highest priority)

**Problem (confirmed in code):** seeker/campus `Jobs` and `Saved` tabs render the
same `_ExplorePanel` and share one segment field, so "Saved" shows whatever was
last viewed.

Files: `mobile/lib/src/features/dashboard/dashboard_screen.dart`
- `_seekerSegment` default `@249`, `_campusSegment` default `@250`.
- `_ExplorePanel` shared by tabs 1 & 2 `@461-596` (see tab dispatch `@461`, `@531`).
- Seeker bottom nav `@20902-20928`; campus bottom nav `@20874-20898`.

Changes:
1. Make the **Jobs/Campus tab discovery-only**: remove the `saved` default at
   `@249`/`@250`; Jobs opens to recommended/search, never saved.
2. Build a **`_MyJobsPanel`** with an internal sub-tab control
   (Saved · Applied · Interviews · Offers) that **owns its own state** and
   **resets to "Saved" on tab entry** — it must NOT read `_seekerSegment`.
3. Replace seeker bottom nav: `Home · Jobs · My Jobs · More` (drop the standalone
   `Saved` and `Applied` tabs; both now live inside My Jobs).
4. Campus: same fix — `Opportunities` tab owns its own state; saved + applied move
   into a campus "My Applications" pipeline. Campus nav becomes
   `Home · Opportunities · Events · My Applications · More` (Events promoted in
   Phase 3 — for Phase 1 just stop the shared-state bug and separate saved).

Guardrail: widget test — "tapping My Jobs always lands on Saved sub-state
regardless of prior Jobs-tab state."

---

## Phase 2 — One home per function (de-dupe)

Files: `dashboard_screen.dart`
- CV Manager appears 3×: More quick action `@2859` (`upload_cv`), Home profile
  checkpoint → `_openSeekerCvManager` `@4953`, notification routing `@2326`.
- Job Alerts 2×: More `@2836` + Jobs-tab segment `@3041`.
- Interview Prep 2×: More `case 'interview_prep'` `@3335` + Jobs-tab segment
  `@7177-7187`.

Changes:
1. CV Manager: keep the single `_openSeekerCvManager` screen. Home checkpoint and
   notifications **call it**; remove any duplicated inline CV UI.
2. Remove the Job Alerts and Interview Prep **segment entries** from the Jobs tab
   (`@3041`, `@7177`). Keep the single More entries (`@2836`, `@3335`).

Guardrail: extend `docs/testing/function-placement-contract.json` occurrence
counts so CV manager / job alerts / interview prep each resolve to one entry.

---

## Phase 3 — Per-role bottom-nav fixes

1. **University** (`university_dashboard_screen.dart:942-968`): relabel nav to
   **Home · Students · Verifications · Partners · More**. Move
   Opportunities/Post-internship, Reports, Analytics, Events/Resources into More.
   (Current Home/Campus/Applicants/Jobs labels are wrong for a career centre.)
2. **Company** (`company_dashboard_screen.dart:1318-1354`, disabled panel `@783`):
   when `talentPoolCrmEnabled` is false, **hide the Talent tab** (render 4 tabs),
   don't show the "disabled by platform settings" dead panel.
3. **Campus**: promote **Events** to a first-class bottom tab (browse → detail →
   register → join/QR). Backend already serves campus events.

Guardrail: per-role bottom-nav inventory test asserting the exact tab ID list per
role (extend `mobile/scripts/assert-mobile-screen-inventory.ps1` or a Dart test).

---

## Phase 4 — Universal interaction contract

- Cards already push to detail consistently (opportunities `@11350`, applications
  `@11259`, events `@11915`, resources `@10930`) — keep that; audit any stragglers.
- **Quick-action routing rule** (fixes the silent fall-through `@2923`/`@2938`):
  - Actions that open a primary flow → **push a screen**.
  - Actions that jump to a bottom tab → `_changeTab`, and are visually marked as
    shortcuts.
  - No `default:` fall-through that silently opens the wrong place — unknown
    actions must no-op with a logged warning, not guess.

Guardrail: extend `docs/testing/ui-action-contract.json` for quick-action routing.

---

## Phase 5 — Entity unifier (company page)  &  Phase 6 — RTL

- **Phase 5:** a Company detail page with tabbed lenses **About · Jobs · Reviews ·
  Salary** (folds salary guidance + reviews in without new bottom tabs). Campus:
  cross-link job ↔ employer ↔ event with inline **Follow**.
- **Phase 6 (launch-critical):** verify the whole shell **mirrors** in Arabic
  (nav order, back-chevron direction, directional icons) — not just text
  alignment. Keep numerals/dates/Latin company names **LTR via bidi** inside
  Arabic text. Language toggle reachable pre-login + in Settings. Add RTL golden
  tests for each role home + one detail screen.

## Phase 7 — Web parity (mirror the mobile IA)

Keep web and mobile at the same **ownership**, platform-appropriate layout
(web = wide tabs + right-side detail panel, already consistent).

Files: `web/src/seeker/screens.tsx`, `web/src/company/screens.tsx`,
`web/src/campus/screens.tsx`, `web/src/shared/*`.
1. Seeker: group Saved/Applications/Interviews/Offers under a **"My Jobs"** label
   to match the mobile pipeline (the tabs already exist — align labels/grouping).
2. Add the **Company unifier page** (About · Jobs · Reviews · Salary) on web too.
3. Confirm no new web-only/mobile-only drift beyond the intended exceptions
   (admin is web-only by design; university Members is a known mobile gap).

Guardrail: `web/scripts/verifyTabReachability.js` stays green.

---

## Phase 8 — Make it stay fixed (CI enforcement)

**The placement-map guard is NOT run by CI today** — `test:function-placement-map`
and the whole `test:launch-gate:ui-contracts` aggregate only run locally. Wire it
in so a regression fails the build.

File: `.github/workflows/flutter-mobile-ci.yml`
1. Add a step after "UI action wiring contract":
   ```yaml
   - name: Function placement map guard
     run: npm run test:function-placement-map
   ```
2. Add steps running the new Phase 1–6 widget/golden tests (`flutter test`).
3. Optionally run the full `test:launch-gate:ui-contracts` aggregate.

Result: reintroducing a duplicate or a shared-state tab fails CI.

---

## Working model (single writer on code → zero conflicts)

- **Codex implements EVERYTHING** on this branch: `mobile/`, `web/`, `.github/`
  (CI), tests, and updates `docs/FUNCTION_PLACEMENT_MAP.md` +
  `MOBILE_INFORMATION_ARCHITECTURE_PLAN.md` first per your own rule.
- **Claude does not commit code.** Claude reviews each phase behind you and edits
  only planning docs (this file, the master plan). One writer on code = no
  conflicts on this branch.
- Commit per phase with a clear message (e.g. `Phase 1: separate Jobs/Saved
  state`) so review is phase-by-phase.
- After each phase: `flutter analyze` + `flutter test` + the navy/palette guards
  must pass before the APK is handed back. Claude reviews the diff and reports
  findings; fix-ups stay with Codex.
- Branch name to use everywhere: **`codex/gate-a-mobile-ui-lock`**.
