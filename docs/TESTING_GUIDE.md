# Testing Guide

Date: 2026-06-27
Scope: backend verification commands currently available in the repo.

## Core Local Checks

```bash
npm run check:secrets
npm run check:syntax
npm run check:imports
```

## Security And Route Contracts

```bash
npm run test:security-http
npm run test:audit-logging
npm run test:file-export-audit
npm run test:mobile-routes
npm run test:ai-safety
npm run test:global-launch-contract
npm run test:trust-routes
npm run test:notification-routes
npm run test:analytics-routes
npm run test:translation-routes
npm run test:admin-operations-routes
npm run test:career-passport
```

## Integration Checks

```bash
npm run test:integration:auth-context
npm run test:integration:trust-documents
```

Some integration checks use `mongodb-memory-server` and may download/start a local MongoDB binary.

## Smoke Checks

```bash
npm run smoke:import
npm run smoke:http
npm run smoke:cors
```

## Route Documentation

```bash
npm run docs:route-report
```

This refreshes:

```text
docs/api/ROUTE_VERIFICATION_REPORT.md
docs/api/HALAJOB_ROUTE_INVENTORY.json
```

## Database Privileged-User Audit

```bash
npm run security:audit-users
```

Requires `CONNECTION_URL`. Do not run it against production unless you are authorized to view privileged user data.

## Launch Test Gaps

The project still needs:

- full role permission negative tests
- live smoke tests with approved seeker/company/campus/admin accounts
- route-by-route request/response contract tests
- OpenAPI/Postman validation
- audit-log coverage tests for remaining sensitive campus/university/admin generic actions
