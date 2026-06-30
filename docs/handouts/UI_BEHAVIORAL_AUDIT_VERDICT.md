# UI Behavioral Audit — Verified Verdict

Date: 2026-06-30
Reviewer: Claude. Method: 5 agents (4 static behavioral + 1 live browser run via
Playwright/Chromium) on tip `7c822e8`, **then every headline claim re-verified by
hand** before inclusion here. Tip: do not trust the raw agent output — it had a
high false-positive rate; this file is the verified subset.

## Headline: the app is MORE wired than "nothing shows" implies.

The objective browser run is the key evidence: the web app **builds, renders
every route, throws zero JS errors, and SPA navigation works** (help→support
click and the report form both worked). **Every empty screen in the test was
because the backend (jobzain.com) is unreachable from the sandbox (403), not a
frontend bug.** That single fact reframes the whole picture.

## What was FALSE (agent claims that did NOT survive verification)

| Claim | Reality |
|---|---|
| Mobile Resources/JobAlerts/InterviewPrep segments render blank (`const []`) | **False.** Those `const []` are guard clauses in `_filteredOpportunitiesForMode`; the segments render real content via `_filteredResourcesForMode`/`_filteredInterviewPrepQuestionsForMode` (return `_content.resources` etc.). `dashboard_screen.dart:818-880` |
| Web `CompanySalaryGuidanceStandalone` undefined / crashes | **False.** Defined `company/screens.tsx:2545`, rendered :956 |
| Web `CampusTalentVisibilityPanel` undefined | **False.** Defined `campus/screens.tsx:1644`, calls `updateTalentVisibility` :1675 |
| `updateTalentVisibility` never called | **False.** Called :1675 |
| Seeker offers actions silently fail | **False.** `offerAction` calls `respondToOffer` :438 then reloads :440 |
| `pauseJob`/`resumeJob` never called | **False.** Wired in company screen; tests assert `toHaveBeenCalledWith("job-1")` |
| "~75% of backend routes have no UI" | **Overstated.** Counted legacy/duplicate namespaces (`/user/v1/job-result`, `/handle-applied-job`) that are superseded by `/employee/v1` by design; under-counted real wiring (e.g. university web) |

## What is REAL (verified gaps — small and specific, not pervasive)

1. **Web campus event registration not wired** — `campusService.registerEvent`
   (`api.ts:2170`) is defined but no component calls it; the events tab is
   read-only. (minor)
2. **Mobile interview reschedule not wired** — `requestInterviewReschedule`
   (`seeker_dashboard_service.dart:5106`) defined, never called. (real gap)
3. **Weak error surfacing** — detail screens (opportunity/event/resource) render
   the object passed from the list and don't re-fetch; and there is a silent
   `catch (_)` on the mobile dashboard load (`dashboard_screen.dart:1594`). When a
   fetch fails, the user sees a blank area with **no error and no retry** — which
   *looks* like a dead button. (real UX risk — this is the one that most plausibly
   produces "I pressed it and nothing showed")
4. **Web likely hardcodes some reference dropdowns** instead of calling
   `/user/v1/helper/*` (plausible, lower priority).

## Most likely cause of "press something and nothing shows"

Given the wiring is largely real, the symptom most likely comes from **runtime/
data, not dead handlers**:
- **Backend connectivity / data**: if the tested build points at a backend that's
  down, slow, or returning empty (the Playwright run is a live demo: unreachable
  backend → every data screen empty), everything looks dead.
- **Local/diagnostic tester build**: the mobile CI can build a `local_campus_auth`
  tester APK with no backend auth; in that mode backend features are inert by
  design (e.g. "Career Passport needs a signed-in backend account", "Live sync
  disabled"). Testing such a build looks like "nothing works."
- **Swallowed errors / no empty states**: when data fails, screens go blank
  silently (gap #3), so a backend hiccup is indistinguishable from a broken UI.

## Recommended next steps (for Codex, single-writer)

1. **Loud states everywhere**: replace silent catches + blank areas with explicit
   loading / empty ("no items yet") / error+retry states. This alone removes most
   "nothing shows" confusion. (highest value)
2. Wire the 2 real gaps: web event registration, mobile interview reschedule.
3. Make detail screens re-fetch (or guarantee lists carry full objects).
4. Confirm the tested APK/web base URL points at a live backend and is NOT a
   local-auth diagnostic build.

## Honest rating

- **Code wiring: ~8.3** is defensible — handlers do call APIs and render; the
  scary "dead everywhere" picture did not survive verification.
- **Runtime UX completeness: unproven** — cannot be claimed without a click-through
  against a live backend, and is undercut by weak error surfacing. That gap, not
  dead wiring, is the real work.
