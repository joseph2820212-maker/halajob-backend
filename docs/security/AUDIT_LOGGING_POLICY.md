# Audit Logging Policy

Date: 2026-06-27
Scope: backend audit-log rules and current coverage baseline.

## Storage

Audit events are stored in `audit_logs` through `services/auditLog.service.js` and `models/AuditLogModel.js`.

## Required Fields

| Field | Purpose |
|---|---|
| `actor_user_id` | User/admin/member who performed the action. |
| `actor_type` | Role/context such as `admin`, `company_owner`, `company_member`, `employee`, `university_admin`. |
| `action` | Stable event key. |
| `entity_type` | Target type such as `job`, `application`, `company`, `verification`, `translation`, `user`, or `admin`. |
| `entity_id` | Target record ID. |
| `company_id` | Company scope where applicable. |
| `job_id` | Job scope where applicable. |
| `application_id` | Application scope where applicable. |
| `old_value` / `new_value` | Safe before/after snapshots where useful. |
| `note` | Safe human note. Do not store secrets. |
| `ip` / `user_agent` | Request context where available. |

## Sensitive Actions That Must Audit

| Area | Required audit actions |
|---|---|
| Admin | login failures, role/permission changes, admin creation/deactivation, moderation decisions, trust decisions, subscription overrides. |
| Company | job create/update/delete/status, application status, interview scheduling, member changes, billing/subscription requests, support tickets. |
| Campus/university | verification submit/resubmit, approve/reject/request-info, university opportunity changes. |
| AI | request allowed/blocked/fallback, admin usage-limit changes, provider/model override. |
| Translation | saved/approved translation changes. |
| Trust | job/company reports, mark safe, suspend, document request. |
| Files/exports | sensitive CV/document download, bulk CV export, application export. |

## Current Coverage Observed

Audit writes were found in dashboard admin login success/failure, dashboard admin creation, company jobs/applications, company members, support, message templates, question library, subscriptions, campus verification/opportunities, trust, AI, translations, Career Passport, and account-context switching.

Runtime evidence:

```bash
npm run test:audit-logging
```

This seeded integration test proves dashboard admin login failures are audited with stable reason keys, successful dashboard admin login is audited, dashboard admin creation is audited, and passwords are not stored in audit metadata.

## Gaps

- Route-by-route audit coverage is not yet proven for every admin generic resource route.
- File download/export logging must be verified for every sensitive CV/document export.
- Additional tests should assert audit-log records for sensitive company/campus/file/export actions, not only HTTP status.

## Rule

Audit logging must never block the primary user action if the action itself succeeded, but audit write failures must be logged server-side and investigated.
