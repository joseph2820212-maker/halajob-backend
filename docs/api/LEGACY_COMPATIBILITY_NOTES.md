# Legacy Compatibility Notes

Date: 2026-06-27
Scope: legacy routes/files kept for client compatibility and low-risk cleanup already performed.

## Package Manager

The backend is standardized on npm:

```bash
npm install
npm run <script>
```

`package-lock.json` is the active lockfile. The duplicate `yarn.lock` was removed to avoid dependency drift.

## Removed Low-Risk Artifacts

| Removed | Reason |
|---|---|
| `nigix.txt` | Empty tracked file with no references. |
| `jops/languageJop.js` | Unreferenced typo-folder Bull queue stub with hard-coded localhost Redis and no production wiring. |
| `yarn.lock` | Duplicate lockfile; npm/package-lock is the documented workflow. |

## Legacy Routes Kept

The backend still keeps many legacy route aliases, especially under:

- `/dash/v1`
- `/user/v1`
- `/employee/v1`
- `/company/v1`

Do not delete legacy aliases unless all are true:

- the route is absent from mobile, web, company dashboard, and admin panel usage
- `npm run docs:route-report` has been regenerated
- route contract tests have been updated
- the removal is listed in this file with a replacement route

## Compatibility Policy

When replacing a legacy route:

1. Add the modern route first.
2. Keep the old route as compatibility-only.
3. Add a test proving both routes work or the old route intentionally fails.
4. Announce the removal version/date.
5. Remove only after mobile/web/admin clients are updated.
