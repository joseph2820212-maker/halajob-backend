# Live Smoke Test Results

Date: 2026-06-29
Status: not yet run against production/live deployment.

## Local Smoke Results

| Command | Result |
|---|---|
| `npm run smoke:import` | Passed |
| `npm run smoke:http` | Passed |
| `npm run smoke:cors` | Passed |

Latest local run: `codex/gate-a-mobile-ui-lock` after `8562da4`.

## Live Smoke Blockers

Live smoke testing requires:

- deployed API base URL confirmation
- production/staging `HEALTH_SECRET`
- approved seeker test account
- approved company owner/member test account
- approved campus student test account
- approved university admin test account
- approved platform admin test account
- permission to create/update/delete test records

Do not mark live smoke complete until these are tested on the deployed backend.
