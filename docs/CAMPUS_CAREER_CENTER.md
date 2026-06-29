# Campus Career Center

Campus Career Center extends the existing university, student verification, campus opportunity, and career passport systems.

## Main Backend Surfaces

- Models: `UniversityModel`, `StudentVerificationModel`, `CampusOpportunityModel`, `CampusEventRegistrationModel`, `CareerPassportModel`, `UniversityOpportunityRequestModel`.
- Routes: `routesUser/CampusRote.js`, `routesCompany/campusRoute.js`, `routesUniversity/index.js`.
- Controllers: `controllers/app/campus/campusController.js`, `controllers/university/`.

## Privacy Rules

- Companies cannot browse all students.
- Company student browsing requires an active university partnership.
- Students must opt into partner-company talent visibility.
- Contact and private student fields stay redacted unless the route explicitly permits them.

## UI Surfaces

- Campus student: overview, opportunities, applications, career passport, resources, interview prep, events, talent visibility, notifications, settings.
- University: students, verifications, resources/events, company partners, analytics, settings.
- Company: campus partnerships and campus opportunity posting.

## Verification

Run:

```bash
npm run test:integration:campus-privacy
```

This covers student-only campus access, event lifecycle, opportunity save/apply, verification review, opt-in talent privacy, partner moderation, university requests, reports, counters, audit logs, and analytics.

