# Mobile UI/UX Hardening Status

Branch: `flutter-seeker-campus`

Last verified:

- `flutter analyze`: no issues found
- `flutter test --concurrency=1`: 407 tests passed

## Completed for testing readiness

- Sign-in uses the navy/orange/cream mobile theme with readable language switching.
- Job seeker, campus student, company, and university/admin entry paths have tested dashboard coverage.
- Local campus tester access is available for APK testing without a university email.
- External web links prefer the device/browser outside the app instead of an in-app webview.
- Major job seeker and campus flows open as native screens with back navigation:
  - job/opportunity detail
  - application detail
  - campus event detail
  - CV manager
  - Career Passport
  - AI career tools
  - company directory
  - company request
  - campus verification
- Major company flows open as native pages where they need deeper navigation:
  - job detail/create/edit
  - applicant detail
  - bulk jobs
  - talent search/help
  - AI tools
  - support/team/profile/account modules
- University/admin detail flows now open as screens:
  - opportunity request
  - student Career Passport
  - employer partner detail
  - campus opportunity detail
  - outcomes report detail
- Shared UI widgets are in use for cards, empty states, action tiles, notices, and language segmented controls.

## Remaining after owner visual review

These items do not block code/test readiness, but should be reviewed on a real phone before launch:

- Do a physical-device click-through of every role using a fresh APK.
- Confirm final colors, spacing, and card density against the owner-approved visual handout.
- Decide whether small editor/filter sheets should remain sheets or become full screens after phone review.
- Expand Arabic localization beyond top-level labels and important controls.
- Run live backend QA with real seeker, campus, company, and university/admin accounts.
- Run live AI-provider QA after production AI credentials and limits are configured.
- Run production Firebase push-notification QA with a real Android device.
- Build the release APK/AAB with the production keystore when launch signing is ready.

## Remaining sheets intentionally allowed for now

Bottom sheets still exist for small mobile tasks such as:

- account switcher/account details
- notifications
- filters and sorting
- short profile editors
- ratings, report messages, and confirmation-style forms
- translation review/edit forms

These are acceptable mobile overlays unless phone testing shows they feel crowded.
