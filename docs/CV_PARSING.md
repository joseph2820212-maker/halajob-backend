# CV Parsing

CV parsing is part of CV Studio, not a separate product system. The canonical parse tracking model is `CvParseJobModel`.

## Launch Mode

Launch mode is honest-disabled by default:

- `cv_parsing_enabled` defaults to `false`.
- Manual CV Studio, CV templates, CV score, cover-letter generation, PDF export, and linked CV activation remain active.
- UI should not promise auto-fill parsing unless the platform flag and parser provider are intentionally enabled.
- The safe copy is: "CV auto-fill is coming soon. You can still build and export your CV manually."

## Provider Behavior

- `manual` mode creates safe parse jobs but does not claim successful auto-fill parsing; when no provider is configured, parsing fails honestly.
- `local` extraction code exists for limited text extraction, but the active upload surface and launch defaults should not advertise it as a complete PDF/DOCX parser until the provider route, allowed upload types, fixtures, and UI copy are proven together.
- `external` mode is a stub until a real provider contract and credentials are supplied.

## Main Backend Surfaces

- Model: `models/CvParseJobModel.js`.
- Services: `services/cvParsing/`.
- Routes: `routesEmployee/cvRoute.js`.
- Integration proof: `scripts/verifyCvParsingIntegration.js`.

## Verification

Run:

```bash
npm run test:integration:cv-parsing
```

This verifies upload honesty, ownership, preview redaction, confirmation, rejection, and linked CV activation.
