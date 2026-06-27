# Translation Contract

Date: 2026-06-27
Scope: Arabic/English translation ownership.

## Routes And Storage

| Area | Route/model |
|---|---|
| AI job translation suggestion | `POST /ai/v1/translate/job/:jobId` |
| AI CV translation suggestion | `POST /ai/v1/translate/cv` |
| Save/approve job translation | `PUT /jobs/v1/:jobId/translations/:lang` |
| Save/approve CV translation | `PUT /user/v1/cv/translations/:lang` |
| Translation records | `content_translations` |

## Rules

- Original text must be preserved.
- Translated text must be stored separately with entity type, entity ID, language, status, and translated fields.
- Arabic and English are the launch languages.
- AI translation output must be reviewable before publish/approval.
- Translation writes must audit and emit analytics events.

## Verification

```bash
npm run test:translation-routes
```

## Gaps

- Route-level request/response examples still need to be completed.
- Missing translation-key checks should remain part of UI/mobile QA.
