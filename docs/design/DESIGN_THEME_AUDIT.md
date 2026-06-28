# Hala Job — Design Theme Audit

**Date:** 2026-06-28 · **Scope:** web app, mobile app, transactional emails

## Implementation status (2026-06-28)
- ✅ **P0 — Web palette aligned to Hala.** Both `:root` token blocks + all hardcoded
  literals in `styles.css` flipped JF → Hala (navy `#1F3654`, accent `#E38B3C`,
  cream `#FCF7EF`, border `#EBDAC2`, etc.). The whole web app now matches mobile + emails.
- ✅ **P0 — Content screens de-hardcoded.** `web/src/public/legalHelp.tsx` inline
  hexes replaced with `var(--jf-*)` tokens (added `--jf-accent-deep/-tint`, `--jf-ink-soft`,
  `--jf-info-soft`, `--jf-danger-soft`).
- ✅ **Typography ("thick & ugly").** Global `font-weight: 800` → `700`; body set to
  weight 400 / line-height 1.6 with `-webkit-font-smoothing: antialiased` +
  `text-rendering: optimizeLegibility`; unified font stack (dropped stray Roboto from body).
- ✅ **Login reorganized.** Cleaner `auth-fold` card: hover state, open-state divider,
  rotating chevron, stacked labelled fields, and a 2-up actions row (Sign in / Sign out).
- ✅ **Favicon** navy `#13213a` → `#1F3654`.
- ✅ **Shadows** softened to navy-tinted (replaced a harsh pure-black card shadow).
- ◻️ **P2 — Semantic tokens** (success/warning/danger) partially added (`--jf-info-soft`,
  `--jf-danger-soft`); full success/warning reconciliation with mobile is still open.
- ◻️ **P3 — Dark mode** not implemented (tokens are now structured to allow it later).

Verified: `cd web && npm run build` (tsc + vite + SEO prerender) passes.

---

**Original audit follows.**

## TL;DR
The product ships **three slightly different brand palettes** depending on surface.
The **mobile app** has the canonical, fully-built "Hala" design system; the **web
app** still runs an older "JF" palette that is close but visibly off (different
navy and orange); the **emails** were already moved to the Hala palette. The web
content screens I added use the Hala colors but **hardcoded inline**, so the web
now renders two navies and two oranges side by side. Recommendation: make the
**Hala palette the single source of truth** and align the web to it by flipping a
small set of CSS variables, then removing hardcoded hexes.

---

## 1. The three palettes today

| Token | Mobile (Hala — canonical) | Web app (JF — legacy) | Emails |
|---|---|---|---|
| Primary navy | `#1F3654` | `#102742` | `#1F3654` ✅ |
| Navy hover/dark | `#1F3654` / `#4E6075` | `#18385d` / `#071827` | — |
| Accent orange | `#E38B3C` | `#e4672f` | `#E38B3C` ✅ |
| Orange deep | `#C26F22` | (n/a) | `#C26F22` ✅ |
| Page background | `#FCF7EF` | `#fbf4e8` | `#FCF7EF` ✅ |
| Card | `#FFFAF2` | `#fffaf1` | `#FFFAF2` ✅ |
| Border | `#EBDAC2` | `#eadcc8` | `#EBDAC2` ✅ |
| Muted text | `#5C6B7E` | `#536173` | — |
| Favicon navy | — | `#13213a` (a *third* navy) | — |

**Net effect:** three distinct "brand navies" (`#102742`, `#1F3654`, `#13213a`)
and two "brand oranges" (`#e4672f` vs `#E38B3C`) exist across the product. They're
close enough to look "almost right" but far enough to look unpolished when a user
moves between the website, the app, and an email.

---

## 2. Findings

### F1 — Web app uses the legacy JF palette (`--jf-*`), not the brand palette
`web/src/styles.css` defines the live theme via `:root { --jf-primary:#102742; --jf-accent:#e4672f; --jf-page:#fbf4e8; … }`.
Most components correctly reference these variables, which is good — it means the
whole web app can be re-skinned by **changing ~13 values in one place**.

### F2 — My web content screens hardcode Hala colors inline (worst offender)
`web/src/public/legalHelp.tsx` (Legal/Help/FAQ/Support/Report/Privacy + cookie
banner) uses inline styles with literal `#1F3654`, `#E38B3C`, `#FFFAF2`,
`#EBDAC2`, `#C26F22`, `#4E6075`, `#5C6B7E`. These:
- don't go through the token system (can't be themed or dark-moded),
- match mobile but **clash with the rest of the web app** (which is JF),
- duplicate values that should live in one place.

### F3 — 58 hardcoded hex literals in `styles.css` bypass the tokens
Even within the JF system, ~58 raw hexes (gradients, status colors, a few
component colors) won't follow a token change — e.g. hero gradients
`#fbf4e8/#fffaf1/#f7ead7`, buttons `#e4672f`, panels `#102742`. A token flip
alone won't fully convert these.

### F4 — Favicon is a third navy (`#13213a`)
`web/index.html` inline SVG favicon (an "H" mark) uses `#13213a`, matching neither
the JF nor the Hala navy.

### F5 — Mixed typography on web
`styles.css` mixes `Tajawal`, `Roboto`, `Sora`, and `var(--font-arabic)` /
`var(--font-latin)` — and the `--font-arabic` / `--font-latin` variables don't
appear to be defined in `:root`. Body is Tajawal, buttons are Roboto, some
headings are Sora. There's no single typographic scale.

### F6 — Semantic colors are ad-hoc
Status colors on web are raw values (`#f59e0b` warning, `#ef4444`/`#b91c1c`
danger, `#f59e0b` badge) with no brand-aligned success/warning/danger tokens.
Mobile maps success to `halaOrangeDeep` — the two aren't reconciled.

### F7 — No dark mode anywhere
No `prefers-color-scheme` / dark theme on web; mobile defines only a light
`ThemeData` (no `darkTheme`/`ThemeMode`). Fine for now, but worth a token
structure that *allows* it later.

### ✅ What's already good
- Mobile `app_theme.dart` is an excellent, complete token set + `ThemeData`
  (gradients, chips, inputs, buttons, cards, shadows, RTL-aware). Treat it as the
  source of truth.
- Emails already use the Hala palette and the navy header.
- The web app is **mostly** variable-driven, so alignment is cheap.
- Both web and mobile handle RTL/Arabic (`dir="rtl"`, logical properties like
  `borderInlineStart`).

---

## 3. Recommendation — one palette, the web follows mobile

Adopt the **Hala palette (mobile `app_theme.dart`) as the single source of truth**
and bring web + favicon in line. This is the cheapest path to a coherent brand
because the web is already token-driven.

### Proposed token mapping (web `:root`)

| Web variable | From (JF) | To (Hala) |
|---|---|---|
| `--jf-primary` | `#102742` | `#1F3654` |
| `--jf-primary-dark` | `#071827` | `#15263C` |
| `--jf-primary-hover` | `#18385d` | `#2A4364` |
| `--jf-primary-press` | `#071827` | `#15263C` |
| `--jf-accent` / `--jf-orange` | `#e4672f` | `#E38B3C` |
| `--jf-ink` | `#102742` | `#1F3654` |
| `--jf-muted` | `#536173` | `#5C6B7E` |
| `--jf-border` | `#eadcc8` | `#EBDAC2` |
| `--jf-page` | `#fbf4e8` | `#FCF7EF` |
| `--jf-card` | `#fffaf1` | `#FFFAF2` |
| `--jf-soft` | `#fff7ea` | `#FDF3E6` |
| `--jf-blue` | `#18385d` | `#4E6075` |
| `--jf-purple` | `#7d6147` | `#9A7B4F` |

(Optionally rename `--jf-*` → `--hala-*` with aliases, but value-only changes are
the zero-risk first step.)

### Work plan (in priority order)
- **P0 — Flip the web tokens.** Change the ~13 `:root` values above. Instantly
  aligns the bulk of the web app to the brand. (1 small edit, low risk.)
- **P0 — De-hardcode `legalHelp.tsx`.** Replace inline hexes with the tokens
  (introduce a tiny `web/src/shared/theme.ts` exporting the same values for
  inline-style components, or convert these screens to CSS classes).
- **P1 — Convert the 58 raw hexes in `styles.css`** to `var(--jf-*)` (especially
  gradients, buttons, status surfaces) so nothing is left off-token.
- **P1 — Fix the favicon** navy `#13213a` → `#1F3654`.
- **P2 — Typography pass.** Define `--font-arabic` / `--font-latin` in `:root`,
  pick one display face (Sora or Tajawal) + one text face, and apply a single
  scale; remove stray `Roboto`.
- **P2 — Semantic tokens.** Add `--success/--warning/--danger` (brand-aligned)
  and use them on both web and mobile instead of raw values.
- **P3 — Dark mode (optional).** Once everything is tokenized, add a dark set
  behind `prefers-color-scheme` / a toggle.

### Verification after any change
- `cd web && npm run build` (tsc + vite + SEO prerender)
- Visual diff of: home, job list/detail, login, company dashboard, admin, and the
  legal/help/FAQ/support screens, in **both** LTR (en) and RTL (ar).
- `flutter analyze` if mobile tokens are touched.
- Re-run `npm run check:web-routes` (unaffected, but cheap regression guard).

---

## 4. Open decision for the owner
**Which surface is the reference?** This audit assumes the **mobile Hala palette**
is canonical (most complete, on-brand, already used by emails). The alternative —
keeping the web's darker `#102742`/`#e4672f` and pushing *that* to mobile/emails —
is more work and moves away from the established brand tokens. Recommended:
**align everything to Hala.** Confirm and I'll execute P0–P1 as a single themed PR.
