# CV Studio

CV Studio extends the existing `CvTemplateModel` and `EmployeeCvModel` systems. Do not create a second resume/CV model for new launch work; `ResumeModel` and `UserResumeModel` remain legacy compatibility surfaces only.

## Main Backend Surfaces

- Models: `models/CvTemplateModel.js`, `models/EmployeeCvModel.js`, `models/CvParseJobModel.js`.
- Routes: `routesEmployee/cvRoute.js`.
- Controllers: `controllers/employeeDash/cv/generateCvController.js`, `controllers/employeeDash/cv/uploadCvController.js`, `controllers/employeeDash/cv/cvStudioController.js`.
- Services: `services/cvStudio/`, `services/cvParsing/`.

## User Flows

- Job seeker creates or uploads CV material.
- User can score, duplicate, set default, preview/download cover letters, and attach the selected CV snapshot to applications.
- Web CV Studio and mobile CV Manager preview and download cover letters through the backend template, preview, and authenticated download routes.
- Parser upload is provider-safe: when no parser provider is configured, the parse job fails honestly instead of pretending success.

## Verification

Run:

```bash
npm run test:integration:cv-studio
npm run test:launch-gate:mobile --silent
```

This covers quality scoring, visibility, duplication, defaulting, parser ownership, parse confirmation/rejection, cover letters, selected CV application snapshots, and web/mobile CV Manager preview/download regression coverage.
