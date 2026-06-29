# Admin User Audit Report

Date: 2026-06-29
Scope: database privileged-user audit procedure.

## Current Status

The source-code audit can prove how admins are checked, but it cannot prove which users exist in production without database access. A repeatable database audit script has been added:

```bash
npm run security:audit-users
```

The command requires `CONNECTION_URL` for the database being audited.

Local source/security proof as of the current `codex/gate-a-mobile-ui-lock` branch after `8562da4`: `npm run test:route-validation`, `npm run docs:route-report`, `npm run test:critical-launch-blockers`, `npm run test:integration:company-branding`, `npm run test:audit-logging`, `npm run test:integration:admin-permissions`, `npm run test:integration:admin-support`, and `npm run test:integration:admin-resources` passed in this branch proof set. Production privileged-user inventory is still not run because production/staging database access is owner-controlled.

## What The Script Lists

| Category | What it checks |
|---|---|
| Platform admins | Users with dashboard/admin roles, role number `1`, known admin role names, or wildcard-like permissions. |
| Company owners | Companies and their owner user records. |
| Elevated company members | Active/invited company members with `owner`, `admin`, or `hr_manager` role. |
| University admins | Active/invited university memberships with `owner`, `admin`, `career_center`, or `advisor` role. |
| Wildcard permissions | Permission documents using `*`, `all`, or `admin.*`. |
| Inactive privileged sessions | Refresh-token sessions for inactive privileged users. |
| Seeded-looking accounts | Accounts matching the old default seed phone or obvious admin/test/seed email patterns. |

## Required Owner Review

Every returned privileged account must be reviewed and marked:

| Decision | Meaning |
|---|---|
| Keep | Owner recognizes the account and approves access. |
| Disable | Account should remain for history but cannot log in. |
| Delete | Account is unneeded and safe to remove. |
| Investigate | Owner does not recognize the account. Rotate secrets and inspect logs before launch. |

## Production Checklist

- [ ] Run `npm run security:audit-users` against production.
- [ ] Export the JSON result to a secure owner-only location.
- [ ] Confirm every platform admin.
- [ ] Confirm every company owner and elevated company member.
- [ ] Confirm every university admin.
- [ ] Remove inactive privileged sessions.
- [ ] Reset passwords for every kept privileged account after secret rotation.
- [ ] Keep the final approved account list outside public source control.
