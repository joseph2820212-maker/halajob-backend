# Hala Job — Launch Plan (Goal: 9+/10 in all aspects)

**Trunk branch (single source of truth):** `flutter-seeker-campus` — latest, most complete (backend + web + mobile), and the branch named in ChatGPT's own handout. Legacy `main` / `fix-critical-issues` / `campus-backend-mode` are a disjoint older copy → reference only, to be retired.

**This plan combines two inputs:**
1. The ChatGPT→Codex handouts in the repo (`mobile/docs/halajob-a-to-z-testing-readiness-handout.md`, `docs/mobile-uiux-testing-action-plan.md`, `docs/launch-hardening-status.md`, `docs/audits/*`).
2. The deep-scan audit findings in `REVIEW.md` (overall 6.0/10, ~125 findings).

**Tracking:** `REVIEW.md` is the live checklist. This file is the strategy/sequence. Update both as work lands.

**Hard constraint discovered:** the tester APK is built by hand and only *zipped* by `mobile/scripts/export-latest-apk-zip.ps1` — it is never auto-rebuilt, and Codex's shell had no Flutter. That is why UI fixes "did nothing": the source was correct, the installed binary was stale. **Phase 0 includes a CI job that builds + publishes the APK so this can never recur.**

---

## Scorecard (current → target)

| Aspect | Now | Target |
|---|:--:|:--:|
| Mobile UI/UX | ~7 | 9+ |
| Backend Security & Auth | 7 | 9+ |
| Backend Architecture | 5 | 9+ |
| Backend API & Validation | 5 | 9+ |
| Data Models & Integrity | 6 | 9+ |
| Services & Integrations | 6 | 9+ |
| Web Frontend | 6 | 9+ |
| Testing & CI/CD | 6 | 9+ |
| Docs & Hygiene | 6 | 9+ |

---

## Phase 0 — UX first (owner's explicit priority)

Owner asks: company UI cards are good; **cream a little lighter**; **everything native with back button** (no webview/popup navigation).

- [x] **Lighten cream** — `mobile/lib/src/theme/app_theme.dart` (`halaCream`, `halaCreamDeep`, `halaNavyBg` lightened).
- [x] **Webview → native (verified already done in source)** — all 3 dashboards now use `Navigator.push` into `_CompanyWorkflowPage` / native screens with `HalaNativeHeader` + back button; **0 modal bottom-sheets remain**; `external_link.dart` opens external links in the device browser. *Needs a fresh APK build to be visible.*
- [ ] **CI: build + publish APK on every push** — `.github/workflows` job: `flutter build apk --release` from `mobile/`, upload as artifact. Kills the stale-binary problem permanently. **(highest leverage)**
- [ ] **Simplify the company header** — currently 9 actions; reduce to essentials (handout §1.5).
- [ ] **Language switch visibility fix** — selected button text fades; replace disabled-button pattern with a real segmented control (handout §1.4).
- [ ] **Extract shared card/empty/loading widgets** — dashboard_screen.dart is ~19k lines; pull reusable cream-card components out instead of growing it.
- [ ] Owner verification pass on a freshly built APK (cream tone + native nav across seeker/campus/company/university).

## Phase 1 — Backend security & API correctness (audit High items)

- [ ] Central **input validation layer** — ~97% of controllers have no schema validation; add yup/Joi (or shared validators) on all write endpoints.
- [ ] **Async error wrapper** + consistent error envelope across controllers (no unhandled rejections).
- [ ] Fix **non-standard success codes** (202/203 → 200/201/204) in `helper/ReturnAppData`, `helper/ReturnDashData`.
- [ ] Remove **duplicate route definitions** (POST+PATCH for same op) in `routes/index.js`.
- [ ] OTP/passcode **brute-force protection** (rate-limit + lockout on verify/resend); enforce password-strength validation (currently commented out).
- [ ] Add **HSTS** to Helmet; tighten CORS in non-prod; validate JWT secret length at boot.

## Phase 2 — Data model integrity

- [ ] Fix **`city_id` referencing the wrong collection** (`CompanyModel`, `EmployeeModel`).
- [ ] Replace **`Schema.Types.Mixed`** on core Job fields with typed sub-schemas.
- [ ] Add **cascade/orphan cleanup** on Company/Job/User deletion.
- [ ] Add **schema-level validation** (email/phone/url/salary consistency) on critical models.

## Phase 3 — Testing & CI/CD (the gap both the audit and Codex flag as P0)

- [ ] **Real seeded integration suite** beyond auth/context: students, jobs, applications, AI, trust, notifications, analytics, payments.
- [ ] **Object-level IDOR coverage** (cross-company/university/student access) + upload/download security tests.
- [ ] Adopt a real test runner (Vitest/Jest) alongside the existing contract scripts; add **coverage**.
- [ ] CI runs backend tests + web build + mobile build on every push (not just Flutter analyze).

## Phase 4 — Services, web, i18n, hygiene

- [ ] AI provider: **retry + circuit breaker + timeout**; email service **try/catch** + fallback.
- [ ] Web: **401/403 response interceptor** (auto refresh/logout); `encodeURIComponent` on dynamic URL params; finish web i18n coverage.
- [ ] Finish **Arabic/English** coverage (handout language audit) — every visible string via i18n; send selected language to backend.
- [ ] Hygiene: pick **one lockfile** (drop yarn.lock or package-lock.json), untrack **`uploads/`**, remove empty `nigix.txt`, dedupe **`jobs/` vs `jops/`**, **retire stale Family-A branches**.
- [ ] Backend structure docs: route ownership, controller/service/model boundaries (Codex P1).

---

## Exit gate (do not call launch-ready until all true)

- Fresh APK builds in CI and installs; owner confirms cream + native nav on device.
- All core roles log in, switch context, reach the right dashboard.
- Backend: validation on all writes, seeded integration + IDOR tests green in CI.
- No secrets/keys in repo; one lockfile; uploads untracked; stale branches retired.
- Arabic/English complete on web + mobile.
- Every scorecard aspect ≥ 9.
