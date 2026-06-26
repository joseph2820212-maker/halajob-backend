# Source Of Truth Rules

Date: 2026-06-27
Scope: backend ownership rules for HalaJob product state.

| Feature | Source of truth | Notes |
|---|---|---|
| User identity | `users` collection | Passwords/tokens never belong in clients. |
| Role/account switcher | `account_contexts`, user role, company memberships, university memberships | Clients display what backend returns. |
| Seeker profile | employee/seeker profile models | Mobile/web should not invent profile completion. |
| Campus student status | student verification records and student context | University email/document approval must be backend-owned. |
| Company ownership | `companies.owner_user_id` | Company members require `company_members`. |
| Company member permissions | `company_members.permissions` and member role | Route guards must enforce this. |
| University admin access | `university_memberships` or approved university career-center mapping | Must not be mobile-only. |
| Job status | job record status/publish/approval fields | Company/admin changes should audit. |
| Application status | application record and status history | Company status changes must notify and audit. |
| Interview status | interview record | Timezone and status changes must be backend-owned. |
| Career Passport | Career Passport model/snapshots | AI explanations should be saved or reproducible from backend. |
| AI output | `ai_requests` and feature-specific saved output | Provider key remains backend-only. |
| Translation | translation records with original text/version/hash where implemented | Preserve original text. |
| Trust score/report | trust score/report records and admin review state | Admin decisions should audit. |
| Notifications | notification/device-token records | Clients render and route; backend creates state. |
| Files | file asset/upload records and storage provider | Runtime files are not Git source. |
| Analytics | append-only analytics events | Clients emit events; backend stores and summarizes. |
| Audit logs | audit log records | Sensitive admin/company/campus actions should write audit logs. |

## Snapshot Rules

Historical records should not silently change when live data changes. Use snapshots for:

- job details at application time
- salary/currency at application time
- candidate CV/application answers at submission
- interview schedule at creation/update
- company verification decisions
- campus/student verification decisions
- Career Passport score snapshots
- AI generated output
- trust review decisions

## Client Rule

Mobile, website, company dashboard, campus mode, and admin panel must not create their own role, status, score, permission, or verification truth. They should request backend state and render it.
