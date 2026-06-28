# Hala Job

This repository contains the Express/MongoDB backend and the Vite web frontend in `web/`.

> Historical note: "JobZain" was an earlier internal/product name. The public product name is now **Hala Job** (operated by llill ltd; public web domain halajob.com). The backend API domain may temporarily remain `jobzain.com` as a technical URL — see `BRAND_CLEANUP_AUDIT.md`.

## Backend

Install and run locally:

```bash
npm ci
npm run dev
```

For a seeded local setup with working admin, company, and job seeker logins, see [docs/local-auth-qa.md](docs/local-auth-qa.md).

Production backend environment variables:

```text
NODE_ENV=production
PORT=3000
CONNECTION_URL=your_mongodb_connection_string
JWT_SECRET=your_long_private_secret
PUBLIC_BASE_URL=https://jobzain.com
HEALTH_SECRET=your_private_health_page_secret
CORS_ORIGINS=https://your-vercel-site.vercel.app,https://your-custom-domain.com
CORS_ORIGIN_PATTERNS=https://*.vercel.app
```

Use exact frontend URLs in `CORS_ORIGINS`. Keep `CORS_ORIGIN_PATTERNS=https://*.vercel.app` if you want Vercel preview deployments to work during testing.

## Web Frontend

The deployable frontend lives in `web/`.

```bash
cd web
npm ci
npm run build
```

For Vercel, import the GitHub repo, select branch `website-implementation`, and use:

```text
Framework Preset: Vite
Root Directory: web
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

If Vercel does not show the branch/root controls and builds from the repository root, the root `vercel.json` is configured to use:

```text
Install Command: cd web && npm ci
Build Command: cd web && npm run build
Output Directory: web/dist
```

Do not use `vite build` as the build command in the root project. It will fail because Vite is installed in `web/`, not in the backend root.

Frontend environment variables:

```text
VITE_API_URL=https://jobzain.com
VITE_ENABLE_UNIVERSITY_PREVIEW=false
```

## Checks

```bash
npm run check:syntax
npm run check:imports
npm run smoke:import
npm run smoke:http
npm run smoke:cors
cd web && npm run build
```
