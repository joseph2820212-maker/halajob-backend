# CV Parsing

CV parsing is part of CV Studio, not a separate product system. The canonical parse tracking model is `CvParseJobModel`.

## Provider Behavior

- Local/Syria MVP can run without a parsing provider.
- Uploading a CV creates a parse job.
- If no provider is configured, the job returns `cv_parser_not_configured`.
- Parsed jobs can be confirmed into the existing employee profile/CV data, or rejected by the owner.

## Main Backend Surfaces

- Model: `models/CvParseJobModel.js`.
- Services: `services/cvParsing/`.
- Routes: `routesEmployee/cvRoute.js`.

## Verification

Run:

```bash
npm run test:integration:cv-parsing
```

This is an alias of the CV Studio integration script because parsing ownership, preview, confirm, reject, and no-provider behavior are verified in that end-to-end flow.

