# AI Backend Contract

Date: 2026-06-27
Scope: backend-owned AI routes and safety expectations.

## Current Routes

AI routes are mounted under `/ai/v1`.

| Feature | Route |
|---|---|
| Career Passport score | `POST /ai/v1/career-passport/score` |
| Career copilot | `POST /ai/v1/career/copilot` |
| Profile score | `POST /ai/v1/profile/score` |
| CV rewrite | `POST /ai/v1/cv/rewrite` |
| Job match | `POST /ai/v1/jobs/:jobId/match` |
| Cover letter | `POST /ai/v1/jobs/:jobId/cover-letter` |
| Interview practice | `POST /ai/v1/interview/practice` |
| Company job generator | `POST /ai/v1/company/jobs/generate` |
| Company shortlist explanation | `POST /ai/v1/company/jobs/:jobId/shortlist` |
| Company message generator | `POST /ai/v1/company/messages/generate` |
| Job translation suggestion | `POST /ai/v1/translate/job/:jobId` |
| CV translation suggestion | `POST /ai/v1/translate/cv` |

## Rules

- AI provider keys live only in backend environment variables.
- AI output is suggestion-only.
- AI must not auto-apply, auto-reject, auto-hire, auto-message, or silently edit profile/job/application records.
- Usage must be logged through `ai_requests` and audit logs.
- Provider failures must return safe fallback responses.
- Admin usage limits are managed by backend/admin routes.

## Verification

```bash
npm run test:ai-safety
```

## Gaps

- Full request/response examples are still needed in the API reference.
- Cost dashboards and provider-specific failure reporting need live environment verification.
