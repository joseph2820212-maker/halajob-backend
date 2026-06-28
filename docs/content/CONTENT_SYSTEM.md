# Hala Job Content / Legal / Support System

How the legal, privacy, help, FAQ, support, and email content package fits together.

## Source of truth
Structured bilingual JSON under `seeders/data/content/`:
- `pages/*.json` → `ContentPageModel` (26 legal/policy pages)
- `help/categories.json`, `help/articles.json` → `HelpCategoryModel`, `HelpArticleModel`
- `faq/faq.json` → `FaqItemModel`
- `email_templates/emails.json` → `EmailTemplateModel`

Seed with `npm run seed:content` (or `npm run seed content`). Email addresses are
env-driven tokens (`HALA_SUPPORT_EMAIL`, `HALA_PRIVACY_EMAIL`, …) — no hardcoded fakes.

## Models (Gate 3)
`ContentPageModel`, `HelpCategoryModel`, `HelpArticleModel`, `FaqItemModel`,
`SupportTicketModel`, `LegalReportModel`, `PrivacyRequestModel`,
`AccessibilityRequestModel`, `UserPolicyAcknowledgementModel`, `UserConsentModel`,
`CommunicationPreferenceModel`, `EmailTemplateModel`, `EmailLogModel`.

## APIs
- **Public (no auth):** `GET /public/v1/content/pages`, `/content/pages/:key`,
  `/legal/:key`, `/help/categories`, `/help/articles`, `/help/articles/:key`, `/faq`.
  Legacy `GET /user/v1/page/*` retained (back-compat; `/legal/:key` falls back to it).
- **User (auth, audit-logged):** `/user/v1/support/tickets*`, `/user/v1/legal-reports*`,
  `/user/v1/privacy/requests`, `/privacy/consents*`, `/privacy/accessibility`,
  `/user/v1/account/delete-request|cancel|export`.
- **Admin:** `/dash/v1/content/pages`, `/help/*`, `/faq`, `/support-queue`,
  `/legal-reports`, `/privacy-requests`, `/accessibility-requests`,
  `/email/templates`, `/email/logs`, `/policy-acknowledgements`.

## Frontends
- **Web:** surfaces `/legal[/:key]`, `/help[...]`, `/faq`, `/contact`, `/accessibility`,
  `/privacy`, `/support`, `/report` + footer links + cookie banner (`web/src/public/legalHelp.tsx`).
- **Mobile:** `mobile/lib/src/features/legal_help/` (LegalHub, LegalPage, HelpCenter,
  FAQ, Support, Report, PrivacyCenter); register consent text; settings "Help, legal & support" row.

## Verification
- `npm run check:content` — models load, 26 legal pages bilingual, 69 email templates,
  public/user routes mount, placeholder/old-brand scan.
- `npm run check:i18n`, `npm run check:syntax`, `npm run smoke:import`.
- Web: `npm run build` (web). Mobile: `flutter analyze`.

## Known technical exceptions (not user-visible)
- Backend domain `jobzain.com` is the configured default base URL (env-overridable).
- Internal identifiers `JobZainTalentRequest*` (model/class names) and the web package
  name `jobzain-web` retain the legacy token; renaming is a separate refactor and does
  not affect user-visible text, which uses **Hala Job** throughout.
