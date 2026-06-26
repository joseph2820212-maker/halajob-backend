# Security Audit Report

Date: 2026-06-27
Scope: source-code security takeover audit for the handed-over HalaJob backend.

## Executive Result

This pass did not find a hard-coded admin email, master password, `x-secret` bypass header, or production debug login in the scanned backend source. It did find and fix two launch-risk hygiene issues:

| Issue | Risk | Resolution |
|---|---|---|
| Campus verification hashing used a fallback string when `JWT_SECRET` was absent. | A predictable fallback secret can weaken verification-code hashes in misconfigured environments. | Removed the fallback. Server startup already requires `JWT_SECRET`. |
| Admin seeding could create an admin whenever `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` were present. | Accidental admin creation during broad seed runs. | Added explicit `SEED_ADMIN_ALLOW_CREATE=true` requirement. |
| Runtime uploads were tracked in Git. | User/runtime files are not source code and can leak private data or malware-like HTML. | Removed tracked `uploads/` files from the Git index and added an automated check. |

## Backdoor Pattern Scan

Patterns searched included:

```text
admin, superadmin, root, owner, master, bypass, backdoor, debug, devOnly,
testLogin, impersonate, isAdmin, isSuperAdmin, role ===, email ===,
phone ===, password ===, secret, x-admin, x-secret, createAdmin,
seedAdmin, defaultAdmin, hidden, override, skipAuth
```

Notable results:

| Area | Result |
|---|---|
| Admin middleware | Requires bearer access token, JWT validation, active user, dashboard role, and matching refresh-token session. |
| Admin seeder | Environment-driven only, now explicitly opt-in with `SEED_ADMIN_ALLOW_CREATE=true`. |
| Account context service | Super-admin context is derived from dashboard/admin role data, not from a hard-coded email or password. |
| AI usage override | Uses database configuration for AI usage limits; not an auth bypass. |
| Health route | Requires `x-health-secret`; query-string secret use is tested to fail. |

## Remaining Security Work

| Work item | Status |
|---|---|
| Production database privileged-user audit | Requires production `CONNECTION_URL`; run `npm run security:audit-users` and review every listed account. |
| Deployment access audit | Requires owner access to GitHub, Vercel/server, MongoDB, Firebase, email, domain, Play Store/Apple accounts. |
| Full route-by-route permission matrix | Not complete in this pass; must be generated from mounted routes and middleware. |
| Live API smoke test | Requires deployed API credentials/test accounts. |
| Git history secret scan | Not complete in this pass; run a history scanner before public launch if the repo was shared with untrusted parties. |

## Commands Used

```bash
npm run check:secrets
rg -n --hidden -g '!node_modules' -g '!.git' -e 'backdoor|bypass|x-secret|x-admin|MASTER_PASSWORD|testLogin|devOnly|impersonate|skipAuth' .
```
