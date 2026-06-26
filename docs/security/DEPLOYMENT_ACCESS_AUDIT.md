# Deployment Access Audit

Date: 2026-06-27
Scope: external access checklist for production takeover.

## Status

This cannot be completed from source code alone. The owner must check each external system directly because hidden access can exist outside Git.

## Required Checks

| System | What to verify | Launch requirement |
|---|---|---|
| GitHub | Repository collaborators, deploy keys, GitHub Apps, Actions secrets, branch protection, MFA. | Remove untrusted users/keys/apps and enable MFA. |
| Vercel/server hosting | Team members, project env vars, deploy hooks, domains, logs, preview deployments. | Only owner-approved users; rotate env vars. |
| MongoDB Atlas/server DB | Database users, IP allowlist, backups, audit/log access. | New DB user/password and restricted IP access. |
| Firebase/Google Cloud | Service accounts, keys, IAM users, FCM credentials. | Delete old keys and issue least-privilege replacement. |
| Email/SMTP provider | Mailbox users, app passwords, forwarding rules. | Rotate SMTP password and remove unknown forwarding. |
| Storage/CDN/Cloudinary | API keys, upload presets, bucket permissions. | Rotate keys and make private files private. |
| Domain/DNS | Registrar users, DNS records, email DNS, transfer lock. | Owner-controlled access with MFA. |
| Play Store / Apple Developer | Users, release signing, app transfer state. | Owner-controlled app/release access before mobile launch. |
| Server SSH/PM2/cron | SSH users, authorized keys, PM2 processes, cron jobs. | Remove unknown keys/jobs and restart from owner deploy. |

## Evidence To Collect

- Screenshot/export of approved access lists.
- Date/time of each key rotation.
- Final list of production environment variables with values stored only in the deployment secret manager.
- Confirmation that old developer accounts were removed or downgraded.

## Immediate Owner Actions

1. Turn on MFA for GitHub, hosting, MongoDB, Firebase/Google Cloud, email, domain registrar, and app stores.
2. Remove any developer account that should no longer have access.
3. Rotate all secrets listed in `docs/security/SECRETS_ROTATION_REPORT.md`.
4. Run `npm run security:audit-users` against production after rotation.
