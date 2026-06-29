# Employer Branding And Public Company Pages

Employer branding extends `CompanyModel` with public profile fields. Do not create a second company profile system.

## Main Backend Surfaces

- Model: `CompanyModel.public_profile`.
- Service: `services/companyPublicProfile.service.js`.
- Company routes: `/company/v1/profile/public`.
- Admin routes: `/dash/v1/company-public-profiles`.
- Public routes: `/public/v1/companies`.

## Product Rules

- Draft and rejected profiles are not public.
- Pending profiles require admin review.
- Published public payloads must omit owner IDs, HR contacts, verification files, subscription data, and private contact fields.
- Updating a published profile returns it to draft/pending workflow as appropriate.

## UI Surfaces

- Company: `public profile`.
- Admin: public profile review queue.
- Public web: `/companies/:slugOrId`.

## Verification

Run:

```bash
npm run test:integration:company-branding
```

This covers draft visibility, admin approval/rejection, public safe fields, public jobs, and company rejection reason.

