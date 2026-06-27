# Translation Contract

Date: 2026-06-27
Scope: Arabic/English translation ownership.

## Routes And Storage

| Area | Route/model |
|---|---|
| AI job translation suggestion | `POST /ai/v1/translate/job/:jobId` |
| AI CV translation suggestion | `POST /ai/v1/translate/cv` |
| Save/approve job translation | `PUT /jobs/v1/:jobId/translations/:lang` |
| Read job translation | `GET /jobs/v1/:jobId/translations/:lang` |
| Save/approve CV translation | `PUT /user/v1/cv/translations/:lang` |
| Read CV translation | `GET /user/v1/cv/translations/:lang` |
| Translation records | `content_translations` |

## Rules

- Original text must be preserved.
- Translated text must be stored separately with entity type, entity ID, language, status, and translated fields.
- Arabic and English are the launch languages.
- AI translation output must be reviewable before publish/approval.
- Translation writes must audit and emit analytics events.
- Draft translations can be read back for review, but do not return `published_translation`.
- Approved translations return `published_translation` and `can_publish: true`.
- Job translation reads are scoped to the owning company account context.
- CV translation reads are scoped to the owning employee/job-seeker account context.

## Verification

```bash
npm run test:translation-routes
npm run test:integration:translations
```

## Gaps

- Route-level request/response examples still need to be completed.
- Missing translation-key checks should remain part of UI/mobile QA.
- All job/CV consuming screens still need product QA to confirm they display approved translations in the intended places.
