# Interview Preparation Center

Interview prep is a rules/content-backed product module, not an AI dependency.

## Main Backend Surfaces

- Model: `InterviewPrepQuestionModel`.
- Admin controller: `controllers/dash/InterviewPrepAdminController.js`.
- User controller: `controllers/app/interviewPrep/`.
- Services: `services/interviewPrep/`.

## UI Surfaces

- Web seeker: `interview prep`.
- Web campus student: `interview prep`.
- Admin: interview-prep question management.
- Job cards can jump into interview prep with the selected job context.

## Verification

Run:

```bash
npm run test:integration:interview-prep
```

This covers admin validation/create/list/update/archive, seeker overview, question bank, note saving, job-specific prep, and checklist progress.

