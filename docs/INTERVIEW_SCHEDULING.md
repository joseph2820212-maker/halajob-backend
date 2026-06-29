# Interview Scheduling

Live interview scheduling extends `InterviewModel`; do not create `VideoInterviewModel` or another parallel interview system.

## Main Backend Surfaces

- Model: `InterviewModel`.
- Company routes: `/company/v1/interviews`.
- Candidate routes: `/employee/v1/global/applications/interviews`.
- Hiring workflow routes also create and update interviews from application records.

## User Flows

- Company schedules an interview for an owned application.
- Candidate can view, accept, decline, or request reschedule.
- Company can update, send reminders, add feedback, and mark no-show.

## Verification

Run:

```bash
npm run test:integration:interview-scheduling
```

This covers route contract, ownership, candidate response, reminders, feedback, and no-show.

