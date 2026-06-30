# Hala Job — 4-Repo Split Runbook

The exact, tested steps to split the monorepo into four repos. Hand this to
whoever runs the cutover (you, me, or Codex). Nothing here is destructive until
the very last optional step.

- **Source monorepo:** `joseph2820212-maker/halajobe`
- **Target repos (create these first, empty):**
  `halajob-backend`, `halajob-web`, `halajob-admin`, `halajob-mobile`

Replace `OWNER` with `joseph2820212-maker` and use HTTPS or SSH URLs as you
prefer. Examples below use HTTPS.

---

## Step 0 — Owner-only prerequisites (cannot be automated by an agent)

1. **Create 4 empty private repos** on GitHub named exactly as above.
   - Visibility: **Private**.
   - **Do NOT initialize** — no README, no .gitignore, no license. They must be
     truly empty so the first push lands cleanly.
   - Do not add branch protection yet (add it after code is in).

2. **Grant tool access** to all **5** repos (the 4 new + the monorepo):
   - **Claude Code (web):** GitHub App installation → *Configure* → Repository
     access → add the 4 new repos (or "All repositories").
   - **Codex:** its own GitHub integration settings → grant the same 4 repos.
   - The monorepo must stay accessible — it is the source we read from.

3. Tell the agent the repos exist + access is granted. Then run Steps 1–5.

---

## Step 1 — Safety net (do this once, before anything)

```bash
git clone https://github.com/OWNER/halajobe.git
cd halajobe
git fetch origin

# Backup tags so there is always a rollback point.
git tag pre-split-$(git rev-parse --short HEAD) origin/HEAD 2>/dev/null || true
git tag -f pre-split-monorepo origin/main 2>/dev/null || true
git push origin --tags
```

The three frontend/backend split branches already exist on origin
(`origin/halajob-backend`, `origin/halajob-web`, `origin/halajob-mobile`).
The admin app is the `admin/` folder on
`origin/claude/flutter-seeker-campus-knph8c` and is split in Step 4.

---

## Step 2 — Push backend / web / mobile (the prepared 3)

These are already `git subtree split` branches with full history. Just push each
to its new repo's `main`.

```bash
# BACKEND
git checkout -B export-backend origin/halajob-backend
git remote add halajob-backend https://github.com/OWNER/halajob-backend.git
git push halajob-backend export-backend:main

# WEB
git checkout -B export-web origin/halajob-web
git remote add halajob-web https://github.com/OWNER/halajob-web.git
git push halajob-web export-web:main

# MOBILE
git checkout -B export-mobile origin/halajob-mobile
git remote add halajob-mobile https://github.com/OWNER/halajob-mobile.git
git push halajob-mobile export-mobile:main
```

---

## Step 3 — (skip) — admin is handled in Step 4

---

## Step 4 — Split & push admin (the 4th repo)

Admin is the standalone app in `admin/`. Subtree-split it (puts the app at the
repo root) and push. **This command is tested — the app lands at root with
`package.json`, `src/`, etc. at top level.**

```bash
git fetch origin claude/flutter-seeker-campus-knph8c
git subtree split --prefix=admin -b export-admin origin/claude/flutter-seeker-campus-knph8c
git remote add halajob-admin https://github.com/OWNER/halajob-admin.git
git push halajob-admin export-admin:main
```

---

## Step 5 — Verify each repo builds standalone (do NOT skip)

Clone each new repo fresh (a clean checkout, not your working copy) and build it.

```bash
# WEB
git clone https://github.com/OWNER/halajob-web.git && cd halajob-web
npm install && npm run build && cd ..

# ADMIN
git clone https://github.com/OWNER/halajob-admin.git && cd halajob-admin
npm install && npm run build && cd ..      # tsc -b + vite build, already verified locally

# BACKEND
git clone https://github.com/OWNER/halajob-backend.git && cd halajob-backend
npm install && npm test && cd ..

# MOBILE  (needs the Flutter toolchain)
git clone https://github.com/OWNER/halajob-mobile.git && cd halajob-mobile
flutter pub get && flutter analyze && flutter test && cd ..
```

If any build fails, it is almost always a **missing file** (something the part
depended on that lived elsewhere in the monorepo) or a **missing secret/env
var**. Fix in the new repo; the monorepo is still intact as reference.

---

## Step 6 — Per-repo setup after the push

For **each** new repo:

1. **CI:** add the matching workflow (each repo only builds itself — this fixes
   the Actions-minutes problem the monorepo had).
2. **Secrets / env vars:** re-add them in the new repo's Settings → Secrets.
   They do NOT travel with the code. A red CI right after split is usually a
   missing secret, not a code bug.
3. **Branch protection:** add it now (protect `main`).
4. **Deploy target:**
   - `halajob-web` → Vercel (has `vercel.json`).
   - `halajob-admin` → Vercel (has `vercel.json`, `noindex` set).
   - `halajob-backend` → your Node host.
   - `halajob-mobile` → App Store / Play Store pipeline.

---

## Step 7 — Wire them together (shared contract)

- The **backend API** is the contract between backend, web, admin, and mobile.
  Freeze it as an OpenAPI spec so all three frontends agree on it.
- **Shared code** (`src/shared/*` in web and admin, the mobile API client) now
  lives in more than one repo. Until you publish a shared package, a change in
  one must be mirrored. The admin repo's README documents this for admin.

---

## Step 8 — Cutover (OPTIONAL, the only destructive step)

Do this **only after** all 4 repos build, deploy, and run green for real.

1. Archive or freeze the monorepo (GitHub → Settings → Archive), or
2. Strip the moved folders from the monorepo if you keep it as backend-only.

Reversible via the `pre-split-*` tags from Step 1. **Until you are satisfied,
the monorepo stays the source of truth — do not delete anything.**

---

## Quick status of preparation (already done)

| Repo | Prepared as | Status |
|---|---|---|
| `halajob-backend` | `origin/halajob-backend` (subtree split, history kept) | ready to push |
| `halajob-web` | `origin/halajob-web` (subtree split, history kept) | ready to push |
| `halajob-mobile` | `origin/halajob-mobile` (subtree split, history kept) | ready to push |
| `halajob-admin` | `admin/` folder on `claude/flutter-seeker-campus-knph8c` | extracted, builds clean (`tsc -b` + `vite build`), Step 4 splits & pushes it |

Blocked only on **Step 0** (owner creates repos + grants access).
