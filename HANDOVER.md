# Hala Job — Handover (for the next AI / developer)

Date: 2026-06-26. All work is on branch **`claude/launch-plan-ux`** (cut from the latest `flutter-seeker-campus`). Nothing was pushed to `flutter-seeker-campus` directly.

---

## 1. The single most important finding: why "nothing ever changes"

Your UI fixes were real in source but never reached the installed app. Three compounding causes:

1. **The tester APK was hand-built and only *zipped***. `mobile/scripts/export-latest-apk-zip.ps1` does NOT run `flutter build` — it zips an already-existing local `.apk`. So testers installed an old binary.
2. **The previous AI (Codex) could not build.** Its own note (`docs/launch-hardening-status.md`): *"flutter is not on this process PATH."* It edited Dart, committed, but never produced a new binary.
3. **Your CI could not build the app either.** The workflow pinned **Flutter 3.35.3**, but `mobile/pubspec.yaml` requires Dart **^3.12.2** (Flutter **3.44.4**). So `flutter pub get` failed and the APK build never ran. A "palette guard" step also false-failed on the English word "green" in docs.

**Net effect:** correct source + stale/again-uncompilable binary = the illusion that fixes do nothing. This is now fixed (see §4).

## 2. Repository reality (was very confusing)

- There are **TWO disjoint git histories** (two `git init`s of the same code):
  - **Family A** (root `ee49d96`, messy "update"/"Yjgfj" commits): `main`, `fix-critical-issues` (Codex's backend hardening), `campus-backend-mode` — a **dead parallel copy**. Codex hardened this; it can never merge into the real app.
  - **Family B** (root `cb27656`, clean commits): `flutter-seeker-campus`, `flutter-mobile-only`, `website-implementation` — the **real product**.
- **Trunk = `flutter-seeker-campus`**: latest (2026-06-26), only branch with all 3 layers (backend 242 files + web + mobile), a superset of every other backend, and the branch named in ChatGPT's own handout.
- **Recommendation:** retire `main` / `fix-critical-issues` / `campus-backend-mode` (legacy). Check `flutter-mobile-only` / `website-implementation` for any unique work, then retire.

## 3. Deep-scan audit result (full detail in `REVIEW.md`)

Overall **6.0/10**, 125 findings, serious ones adversarially verified. Ratings:

| Area | Rating |
|---|:--:|
| Backend Security & Auth | 7 |
| Backend Architecture | 5 |
| Backend API & Validation | 5 |
| Data Models & Integrity | 6 |
| Backend Services | 6 |
| Web Frontend | 6 |
| Flutter Mobile | 7 |
| Testing & CI/CD | 6 |
| Docs & Hygiene | 6 |

Top verified issues: ~97% of controllers lack input validation; `city_id` references the wrong collection; `Schema.Types.Mixed` on core Job fields; no cascade-delete; non-standard HTTP codes (202/203); no real backend/web test suite; web has no 401/403 refresh interceptor; mobile has no cert pinning / token refresh; duplicate lockfiles; `uploads/` committed; `jobs/` vs `jops/` duplicate dirs.

## 4. What I changed (all committed on `claude/launch-plan-ux`, all verified)

Environment note: I installed Flutter **3.44.4** at `/opt/flutter` so every edit is compile-checked. `flutter analyze` is clean and **all 410 mobile tests pass**.

| Commit theme | What | Verified |
|---|---|---|
| `REVIEW.md` | Full 125-finding audit tracker | — |
| `LAUNCH_PLAN.md` | Combined goal (handouts + audit) → 9+/10, phased | — |
| Cream palette | `mobile/lib/src/theme/app_theme.dart`: `halaCream` F3E6D3→F8F0E2, `halaCreamDeep` E5D0B1→EBDAC2, `halaNavyBg` to match (owner: "cream a little lighter") | analyze + tests |
| Login hero | `auth_screen.dart`: new `_AuthHero` (logo + localized welcome title + mode-aware subtitle + RTL-aware compact language switch); bilingual strings added to `hala_job_localizations.dart` | analyze + tests |
| CI fix #1 | `flutter-mobile-ci.yml`: build + upload **fresh release APK** (`halajob-mobile-fresh-apk`) on push; trigger on `claude/**` | YAML valid |
| CI fix #2 | Narrowed "palette guard" to green *color values* (was matching the word "green" in docs) | passes in CI |
| CI fix #3 | **Bumped Flutter pin 3.35.3 → 3.44.4** so `pub get`/build actually run | CI run #419 |
| Screenshot tool | `mobile/test/screenshot_capture_test.dart` renders screens to PNG locally (skips in CI) | passes |

**Already-true in source (you were seeing the stale APK):** company/seeker/university actions already open as **native screens with a back button** (`_CompanyWorkflowPage` + `HalaNativeHeader`, 0 modal sheets, 47 `Navigator.push`); external links already open in the device browser; the auth language-switch visibility bug is already fixed (segmented control).

## 5. How the next AI should continue (do this first)

1. **Get a real build to look at:** download the **`halajob-mobile-fresh-apk`** artifact from the latest green GitHub Actions run on `claude/launch-plan-ux` (CI run #419+). Install THAT — it reflects current source. Do not use the old zipped APK.
2. **Toolchain for verifying mobile edits:** install Flutter 3.44.4, then in `mobile/`: `flutter pub get && flutter analyze && flutter test`. Keep both green. `flutter analyze` fails on info-level lints, so keep it spotless.
3. **Watch the brittle guard:** `mobile/scripts/assert-mobile-screen-inventory.ps1` does exact-string matching (e.g. requires `HalaBrandMark(size: 74, label: 'Hala Job')`). Update it whenever you change those literals or it fails CI.
4. **Branch/push:** all work is on `claude/launch-plan-ux`. Pushing to `flutter-seeker-campus` was blocked by guardrails in my environment — open a PR from `claude/launch-plan-ux` into `flutter-seeker-campus` to merge.
5. **Follow `LAUNCH_PLAN.md`** phases to reach 9+/10: Phase 0 UX polish → Phase 1 backend (validation layer, async error wrapper, status codes) → Phase 2 data-model integrity → Phase 3 real tests + CI → Phase 4 services/web/i18n/hygiene. Track status in `REVIEW.md`.

## 6. Honest status

I delivered: the diagnosis, the audit, the plan, a verified login/cream polish, and a CI that can finally produce a fresh installable. I did **not** complete the full launch-readiness work, and I lost time waiting on CI/idle between turns. The foundation and the map are in place; the bulk of Phases 1–4 remain.
