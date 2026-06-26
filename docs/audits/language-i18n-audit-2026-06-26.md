# Language/i18n Audit - 2026-06-26

## Current Requirement

Arabic and English must be separated cleanly across the website and mobile app. On first launch the app should follow the phone/browser language, and the user must be able to change the language from settings. The selected language should also be sent to backend APIs so server messages and translated content match the UI.

## Fixed In This Pass

| Area | Status |
| --- | --- |
| Mobile first launch | Fixed. A fresh install now chooses Arabic or English from the device locale before any saved setting exists. |
| Mobile saved setting | Preserved. A saved setting still overrides the device locale. |
| Mobile language changes | Fixed. The shared app language state now updates when the user changes language in settings. |
| Mobile API headers | Fixed. `x-language` and `lan` now use the active app language instead of hardcoded English. |
| Mobile notification device language | Fixed. Notification registration now uses the active app language instead of only the device locale. |
| Website first load | Fixed. The website now uses saved language first, otherwise browser language. |
| Website initial `html lang/dir` | Fixed. A small pre-render script sets `lang` and `dir` before React renders. |
| Website Arabic translation encoding | Fixed. `web/src/shared/i18n.ts` now contains real Arabic text instead of mojibake. |
| Regression check | Added. `npm run check:i18n` fails on corrupted Arabic resources or hardcoded English mobile language headers. |

## Remaining Risk

The language infrastructure is now healthier, but full project-wide coverage is not finished yet.

| Area | Finding | Required Follow-Up |
| --- | --- | --- |
| Mobile visible strings | The mobile feature files still contain many hardcoded English text candidates. A quick scan found about 568 candidates in `mobile/lib/src/features`. | Extract every visible label, title, helper, validation, empty state, snackbar, and button into localization resources. |
| Mobile generated ARB flow | ARB files exist, but the active app mostly uses the custom `HalaJobLocalizations` map. | Consolidate on one localization source or keep both synchronized with a check. |
| Website visible strings | The website uses `translateUi(lang, value)` in many places, but direct English literals may still exist in screens. | Audit each web surface: public, seeker, company, campus, admin. Every visible string should pass through the i18n layer. |
| Backend response language | Web and mobile send language headers, but backend endpoint coverage needs route-level verification. | Add/API-test representative auth, job, campus, company, notification, translation, and admin endpoints with `x-language: ar` and `x-language: en`. |
| RTL layout QA | Direction is wired, but every screen has not been visually verified in Arabic/RTL after the recent UI changes. | Run real-device or browser QA for Arabic and English on auth, seeker, campus, company, university/admin, details, forms, modals, and errors. |

## Product Rule Going Forward

No new user-visible text should be added directly inside widgets/components. Add it to the app language resources first, provide Arabic and English values, and run:

```bash
npm run check:i18n
```

Before release, add a full i18n extraction pass and visual QA pass. The current fixes prevent the most obvious failures, but they do not yet prove every screen is fully translated.
