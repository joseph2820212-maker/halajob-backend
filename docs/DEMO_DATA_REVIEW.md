# Demo data for UI/UX review

A clearly-labelled, removable demo dataset so every authenticated screen fills
with **real API data** during review — on both the web app and the Android APK.
Because the data flows through the real backend, "if it renders, it genuinely
works end-to-end." This is a review aid, **not** production data.

## What it creates
- A demo **seeker** and a demo **company** (loginable).
- A few published demo **jobs** owned by the demo company.
- Two **applications** from the seeker, one scheduled **interview**, one **saved
  job**, and one **support ticket** — so My Jobs, Interviews, Saved, and the
  admin user-support queue all show content.

Everything is keyed by the `@demo.halajob.local` email convention so it can be
wiped cleanly.

## Run it (owner / anyone with the DB URL)
```bash
# 1) Make sure the catalog lookups exist (roles, currencies, job types, etc.)
CONNECTION_URL="<mongo-uri>" npm run seed

# 2) Add the demo data
CONNECTION_URL="<mongo-uri>" npm run seed:demo

# 3) Remove it when done
CONNECTION_URL="<mongo-uri>" npm run seed:demo:teardown
```
`CONNECTION_URL` must point at the same database the review build talks to (the
web app defaults to `https://jobzain.com`; the APK uses its configured API base
URL).

## Log in (web + APK)
| Account | Email | Password |
|---|---|---|
| Seeker | `seeker@demo.halajob.local` | `Demo@1234` |
| Company | `company@demo.halajob.local` | `Demo@1234` |

The app's login emails a verification code. The seed also **pre-sets a known
code so you don't need the email** — at the passcode step, enter:

```
123456
```

The code is single-use. If you need to log in again, re-run `npm run seed:demo`
(it is idempotent) to refresh it.

## Notes
- Idempotent: safe to run multiple times; it upserts rather than duplicating.
- No production credentials are embedded; you supply `CONNECTION_URL`.
- Remove all demo data before launch with `npm run seed:demo:teardown`.
