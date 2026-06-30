# Mobile Information Architecture Plan

This plan is the product map for the Flutter mobile app. It exists to stop
feature drift where the same function appears in several places with different
labels, or where a backend function is present but hidden from the expected
role workflow.

Parent source of truth: `docs/FUNCTION_PLACEMENT_MAP.md`. If a function moves
between roles, tabs, More, profile, or settings, update that cross-platform map
first, then update this mobile-specific plan and the regression guards.

## Shared Chrome Rules

- Job seeker and campus keep three visible header actions: notifications,
  profile, and settings. Account switching appears only when more than one
  available account context exists.
- Company keeps the same visible Section 3 chrome as seeker/campus:
  notifications, profile, and settings. Profile opens company profile settings;
  settings opens account settings where sign out is visible. Account switching
  appears only when more than one available account context exists.
- University admin keeps its existing account-oriented header actions until the
  university dashboard is refactored into the shared account menu component.
- The bottom navigation active orange line belongs under the icon/label item,
  never at the top of the nav bar.
- Bottom navigation widget keys must use stable tab IDs, not translated labels.
- Header and bottom navigation colors must remain the handout cream, navy, and
  orange system.

## Job Seeker

| Function | Canonical Location | Notes |
| --- | --- | --- |
| Job discovery/search | Bottom Jobs tab | Discovery-only. It must never render saved jobs or share state with the My Jobs pipeline. |
| Saved jobs, applications, interviews, offers | Bottom My Jobs tab | My Jobs owns its own Saved / Applied / Interviews / Offers sub-state and resets to Saved when opened. More may link to it only as a shortcut. |
| CV manager | More and profile checkpoints | The CV manager must remain a real upload/activate/generate/delete workflow. |
| AI career tools | More | Job detail may show contextual AI for that job, but the full toolset lives under one AI career tools entry. |
| Live seeker sync | Bottom of the current tab content | It must not sit above the main page content. |
| Notifications | Header bell and notifications screen | Backend unread count controls the badge. |
| Profile | Header profile and profile checkpoints | Profile editing is for seeker/campus domain data, not account credentials. |
| Settings | Header settings and settings screen | Account credentials, language, privacy, notification preferences, export/delete, and sign out live here. |

## Campus Student

| Function | Canonical Location | Notes |
| --- | --- | --- |
| Opportunities/search | Bottom Opportunities tab | Discovery-only. It must not render saved-only campus state. |
| Events | Bottom Events tab plus detail screens | Cards open real native detail screens. |
| Saved campus opportunities and applications | Bottom My Applications tab | My Applications owns Saved / Applied / Interviews / Offers sub-state and resets to Saved when opened. |
| Resources | More plus detail screens | Cards open real native detail screens. |
| Career Passport | More/profile readiness | Student readiness and public share controls live here. |
| Campus profile | Header profile and profile checkpoints | Student academic/profile data lives here. |
| Settings | Header settings and settings screen | Account credentials, language, privacy, notification preferences, and sign out live here. |

## Company

| Function | Canonical Location | Notes |
| --- | --- | --- |
| Hiring dashboard | Home | Metrics, trust, recent jobs, recent applicants, and upcoming interviews only. |
| Jobs and job creation | Jobs tab | Job detail owns contextual job actions and job translation. |
| Applicants | Applicants tab | Applicant detail owns status, notes, messaging, rating, and interview actions. |
| Interviews, hiring pipeline, reviews | Applicants tab | These are applicant workflow operations and must not be repeated in More. |
| Talent pool, invitations, talent help, campus recruiting | Talent tab | These must not be repeated in More. |
| AI hiring tools | More, single AI tools section | The general AI tools entry appears exactly once and is hidden unless the feature flag is enabled. |
| Company files, support, audit logs, subscription | More, company workspace section | These are secondary workspace tools. |
| Team, questions, templates | More, team/templates section | These are admin/configuration tools. |
| Company profile settings | Header profile icon | This edits the company entity profile and language. |
| Account profile and sign out | Header settings icon and account profile screen | Logout must always be visible in the account profile screen. |

## University Admin

| Function | Canonical Location | Notes |
| --- | --- | --- |
| Verification queue, students, partners, opportunities | Main dashboard tabs/panels | Each row should open a native detail screen. |
| Outcomes report | Reports surface | More should not become a second dashboard. |
| Account details and sign out | Account details screen | Current screen is functional; next refactor should align it with shared account chrome. |
| Notifications | Either wire backend data or remove the bell | Placeholder-only notification screens are not acceptable for launch. |

## Regression Guards

- `npm run test:function-placement-map` verifies the cross-platform function
  placement map still contains the core role/module ownership rules.
- `npm run test:ui-actions` verifies the source-level UI action contract in
  `docs/testing/ui-action-contract.json`.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/assert-mobile-screen-inventory.ps1`
  verifies the mobile screen inventory and duplicate placement rules.
- Flutter widget tests must cover the company header profile/settings split, visible logout, AI
  hidden-by-default behavior, live seeker sync position, and campus saved-only
  mode.
- Full `flutter analyze` and `flutter test` must pass before an APK is handed
  back for review.
