# API Regression Test Results

Date: 2026-06-27
Branch: `flutter-seeker-campus`
Commit tested: current `flutter-seeker-campus` branch state as of the latest update below.
Environment: local Codex workspace
Latest update: object authorization, private upload static-serving, audit logging, and file/export audit integration coverage added on 2026-06-27.

## Passed Commands

| Command | Result |
|---|---|
| `npm run check:secrets` | Passed |
| `npm run check:syntax` | Passed |
| `npm run check:imports` | Passed |
| `npm run check:i18n` | Passed |
| `npm run smoke:import` | Passed |
| `npm run smoke:http` | Passed |
| `npm run smoke:cors` | Passed |
| `npm run test:security-http` | Passed, including private `/uploads/files/*` static denial |
| `npm run test:audit-logging` | Passed |
| `npm run test:file-export-audit` | Passed |
| `npm run test:object-authorization` | Passed |
| `npm run test:mobile-routes` | Passed |
| `npm run test:ai-safety` | Passed |
| `npm run test:global-launch-contract` | Passed |
| `npm run test:trust-routes` | Passed |
| `npm run test:notification-routes` | Passed |
| `npm run test:analytics-routes` | Passed |
| `npm run test:translation-routes` | Passed |
| `npm run test:admin-operations-routes` | Passed |
| `npm run test:career-passport` | Passed |
| `npm run test:integration:auth-context` | Passed |
| `npm run test:integration:trust-documents` | Passed |
| `npm run docs:route-report` | Passed |
| `npm run docs:api-artifacts` | Passed |

## Generated Artifacts Checked

| Artifact | Check |
|---|---|
| `docs/api/HALAJOB_ROUTE_INVENTORY.json` | Regenerated from live Express app. |
| `docs/api/ROUTE_VERIFICATION_REPORT.md` | Regenerated; zero unclassified endpoints. |
| `docs/api/HALAJOB_POSTMAN_COLLECTION.json` | JSON parsed successfully. |
| `docs/api/HALAJOB_POSTMAN_ENV_LOCAL.json` | JSON parsed successfully. |
| `docs/api/HALAJOB_POSTMAN_ENV_DEV.json` | JSON parsed successfully. |
| `docs/api/HALAJOB_OPENAPI.yaml` | Operation IDs checked; duplicate count is zero. |

## Notes

- Integration tests emitted Mongoose `strictQuery` deprecation warnings only; tests still passed.
- These are local contract/regression checks, not a production live-smoke test.
- Production live smoke still requires deployed API credentials and approved test accounts.
