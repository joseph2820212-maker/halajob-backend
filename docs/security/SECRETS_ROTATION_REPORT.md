# Secrets Rotation Report

Date: 2026-06-27
Scope: local repository scan for the handed-over HalaJob backend/mobile/web monorepo.

## Result

The current working tree secret scan passes with only example/documentation references allowed. No live Firebase private key file, `.env`, `.pem`, `.p12`, `.jks`, or keystore file is currently tracked.

## Findings

| Finding | Status | Action |
|---|---|---|
| Real Firebase service account was referenced by prior handout material as `notification/jobzain-firebase-adminsdk-fbsvc-23f2077871.json`. | Historical/external risk | Treat the Firebase key as exposed if it was ever shared in ZIP/chat/repo history. Rotate it in Firebase/Google Cloud. |
| Runtime uploaded files under `uploads/` were tracked by Git. | Fixed in this hardening pass | Removed from Git index and kept ignored. These files must live in runtime storage, not source control. |
| `.env.example` contains placeholder variable names only. | Accepted | Keep placeholders only; never commit real values. |
| `notification/serviceAccount.example.json` contains fake example keys only. | Accepted | Keep as example file; real files remain ignored. |

## Rotation Checklist

Rotate these values before production launch if any previous developer, ZIP, chat, or server log could have exposed them:

| Secret | Owner action |
|---|---|
| `CONNECTION_URL` / MongoDB credentials | Create a new MongoDB user/password, update deployment env vars, remove old DB user, review IP allowlist. |
| `JWT_SECRET` | Replace with a new long random value; force all users/admins to log in again. |
| Firebase service account | Delete old service account key; create a new key only if the backend still needs it. |
| SMTP password | Rotate at the mail provider and update deployment env vars. |
| `HALA_AI_API_KEY` / `OPENAI_API_KEY` | Rotate provider key and confirm mobile/web never receive it. |
| Cloudinary/storage credentials | Rotate if configured outside this repo. |
| Vercel/GitHub tokens | Revoke shared/personal tokens; use owner-controlled accounts with MFA. |

## Verification Commands

```bash
npm run check:secrets
git ls-files uploads
git ls-files "*.env*" "*serviceAccount*" "*.pem" "*.p12" "*.jks" "*.keystore"
```

Expected:

- `npm run check:secrets` passes.
- `git ls-files uploads` returns no files.
- Only example placeholder files are tracked for secret-like names.
