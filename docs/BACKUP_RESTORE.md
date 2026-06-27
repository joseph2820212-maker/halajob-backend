# Backup And Restore

Date: 2026-06-27
Scope: operational backup/restore checklist.

## MongoDB Backup

Use the hosting provider backup feature where available. For manual backups:

```bash
mongodump --uri "<CONNECTION_URL>" --out backups/YYYY-MM-DD
```

Do not commit backup folders. `backups/` is ignored and checked by repository hygiene.

## MongoDB Restore

Restore only into the intended environment:

```bash
mongorestore --uri "<CONNECTION_URL>" backups/YYYY-MM-DD
```

Before restoring production:

- confirm the target database name
- take a fresh backup
- pause writes where possible
- document the exact dump/restore command
- verify admin access and key user flows after restore

## Runtime Files

If production uses local disk uploads, back up:

- `uploads/`
- `cv/generated/`

If production uses object storage, back up bucket metadata and access policies.

## Secrets

Do not store secrets inside backups committed to Git. Store secret backups only in an owner-controlled password manager or cloud secret manager.

## Restore Smoke Test

After restore:

```bash
npm run test:security-http
npm run test:mobile-routes
npm run test:ai-safety
npm run test:global-launch-contract
```

Then run live login/apply/company/campus/admin smoke tests with approved test accounts.
