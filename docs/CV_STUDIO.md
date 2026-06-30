# CV Studio

CV Studio extends the existing `CvTemplateModel` and `EmployeeCvModel` systems. Do not create a second resume/CV model for new launch work; `ResumeModel` and `UserResumeModel` remain legacy compatibility surfaces only.

## Main Backend Surfaces

- Models: `models/CvTemplateModel.js`, `models/EmployeeCvModel.js`, `models/CvParseJobModel.js`.
- Routes: `routesEmployee/cvRoute.js`.
- Controllers: `controllers/employeeDash/cv/generateCvController.js`, `controllers/employeeDash/cv/uploadCvController.js`, `controllers/employeeDash/cv/cvStudioController.js`.
- Services: `services/cvStudio/`, `services/cvParsing/`.

## User Flows

- Job seeker creates or uploads CV material.
- User can score, duplicate, set default, preview cover letters, and attach the selected CV snapshot to applications.
- Mobile CV Manager previews cover letters through the backend template and preview routes; download/export remains a web/backend attachment flow until a fresh mobile download implementation is added and tested.
- Parser upload is provider-safe: when no parser provider is configured, the parse job fails honestly instead of pretending success.

## Verification

Run:

```bash
npm run test:integration:cv-studio
npm run test:launch-gate:mobile --silent
```

This covers quality scoring, visibility, duplication, defaulting, parser ownership, parse confirmation/rejection, cover letters, selected CV application snapshots, and mobile CV Manager preview regression coverage.
