# Student Resource Library

The resource library provides launch-safe learning resources for job seekers, campus students, universities, and admins.

## Main Backend Surfaces

- Models: `LearningResourceModel`, `LearningResourceCategoryModel`, `LearningResourceCollectionModel`, `UserResourceProgressModel`, `UniversityResourceAssignmentModel`.
- Admin controllers: `controllers/dash/LearningResourceAdminController.js`.
- User controllers: `controllers/app/resources/`.
- University controllers: `controllers/university/resources/`.
- Admin routes use `/dash/v1/learning-resources` and related
  `/dash/v1/learning-resource-categories` paths. Do not mount learning content
  under `/dash/v1/resources`, which remains the generic admin resource CRUD
  surface.

## UI Surfaces

- Web seeker: `resources`.
- Web campus student: `resources`.
- Web university: `events/resources`.
- Web admin: `resources` / `resource library`.
- Mobile: resource cards under seeker/campus home surfaces.

## Verification

Run:

```bash
npm run test:integration:learning-resources
```

This covers admin categories/publishing, seeker list/detail/save/progress/recommendations, campus compatibility, university-private visibility, assignment, and analytics.
