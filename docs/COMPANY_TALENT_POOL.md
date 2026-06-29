# Company Talent Pool

The company talent pool is a candidate CRM layered on top of existing applications, campus partner visibility, and invitation flows.

## Main Backend Surfaces

- Models: `CompanySavedCandidateModel`, `CompanyCandidateNoteModel`, `CompanyCandidateTagModel`, `CompanyCandidateListModel`.
- Controller: `controllers/companyDash/companyTalentPoolController.js`.
- Routes: `routesCompany/talentPoolRoute.js`.

## Privacy Rules

Companies can save a candidate only when one of these is true:

- The candidate applied to one of the company's jobs.
- The company has a valid accepted invitation relationship.
- The candidate is an opted-in campus student from an active university partner.

Saved candidates, notes, tags, and invitations remain scoped to the same company;
another company must never see or reuse that CRM data.

Do-not-contact candidates cannot be invited again.

## UI Surfaces

- Company applicants: `Save to pool`.
- Company `talent pool`: candidate detail, notes, tags, invite-to-job, archive, do-not-contact.

## Verification

Run:

```bash
npm run test:integration:talent-pool-crm
```

This covers save, privacy, notes, tags, invitations, and do-not-contact.
