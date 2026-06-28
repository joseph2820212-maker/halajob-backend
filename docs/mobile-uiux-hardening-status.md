# Mobile UI/UX Hardening Status

Branch: `codex/gate-a-mobile-ui-lock` directly on `flutter-seeker-campus`

Last verified:

- `flutter analyze`: no issues found on 2026-06-28
- `flutter test --reporter compact`: 414 tests passed on 2026-06-28
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\assert-mobile-screen-inventory.ps1`: passed on 2026-06-28
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\build-android.ps1 -BuildTarget release-apk-local -BaseUrl https://jobzain.com -LocalCampusAuth`: built `1.0.2+22` from commit `ff1c2db`
- `adb install -r C:\Users\Admin\Documents\Codex\2026-06-28\ca\outputs\halajob-mobile-campus-tester-latest.apk`: installed the current tester APK on `emulator-5554`; sign-in, Arabic language switch, register, forgot password, campus tester entry, compact campus dashboard, campus feed/resources/events/details, campus More, campus verification/passport limitation states, and seeker/company text input screenshots captured on 2026-06-28

## Completed for testing readiness

- Sign-in uses the navy/orange/cream mobile theme with readable language switching.
- Job seeker, campus student, company, and university/admin entry paths have tested dashboard coverage.
- Local campus tester access is available for APK testing without a university email.
- Current PC emulator proof shows the Campus role selector visible, selected, and able to open the compact native campus dashboard through `Use campus tester account` without typing credentials.
- Current PC emulator proof shows the authenticated campus shell now uses the navy handout header and bottom navigation, with `Welcome back`, `Your campus`, and `Events & resources` above the fold.
- Current PC emulator proof now covers the Arabic auth state, register panel, password recovery panel, campus Resources list/detail, campus Events list/detail, campus More menu, campus verification, and campus Career Passport limitation states from the same `1.0.2+22` APK.
- Current PC emulator proof shows seeker and company login text fields accept Android input; if typing fails in Android Studio, check the emulator keyboard/input setting rather than the Flutter field implementation.
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
- Shared native headers now use the rendered handout authenticated shell: navy surface, cream title/subtitle, subtle cream border, orange accent state, and one account menu for non-notification actions across seeker/campus, company, and university screens.
- Campus dashboard home now shows the meaningful dashboard cards above the fold instead of the old progress-ring hero or old focus stack.

## Remaining after owner visual review

These items do not block code/test readiness, but should be reviewed on a real phone before launch:

- Do a physical-device click-through of every role using a fresh APK.
- Confirm final colors, spacing, and card density against the owner-approved visual handout.
- Confirm compact native editors and short dialogs still feel comfortable after phone review.
- Expand Arabic localization beyond top-level labels and important controls.
- Run live backend QA with real seeker, campus, company, and university/admin accounts.
- Run live AI-provider QA after production AI credentials and limits are configured.
- Run production Firebase push-notification QA with a real Android device.
- Build the release APK/AAB with the production keystore when launch signing is ready.

## Dialogs/menus intentionally allowed for now

`mobile/lib` no longer uses Flutter bottom sheets for app workflows. Small
native platform controls still exist for tasks such as:

- notifications
- filters and sorting
- short profile editors
- ratings, report messages, and confirmation-style forms
- translation review/edit forms
- account menu and short confirmation dialogs

These remain acceptable only where they are short native screens, dialogs, or
menus with a clear back/cancel path.
