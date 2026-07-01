# Backend To UI Coverage Audit

Generated: 2026-07-01T11:39:03.581Z
Source inventory: `docs/api/HALAJOB_ROUTE_INVENTORY.json`

This is a machine-generated progress audit, not a claim of full completion.
It answers three questions:

1. Does a backend method/path have matching mobile or web client source evidence?
2. Do the currently visible mobile More/module cards have widget-test navigation proof?
3. Do locked bottom tabs and header actions have widget-test shell proof?

## Endpoint Client Evidence Summary

| Module | Endpoints | Mobile client | Web client | Any client | No client evidence |
| --- | --- | --- | --- | --- | --- |
| AI | 12 | 12 | 12 | 12 | 0 |
| Admin | 3338 | 0 | 141 | 141 | 3197 |
| Analytics | 5 | 3 | 2 | 5 | 0 |
| Campus | 18 | 0 | 0 | 0 | 18 |
| Campus Student | 51 | 42 | 32 | 51 | 0 |
| Company | 181 | 165 | 124 | 181 | 0 |
| Files | 1 | 1 | 0 | 1 | 0 |
| Health | 4 | 0 | 1 | 1 | 3 |
| Jobs | 2 | 2 | 0 | 2 | 0 |
| Legacy User | 205 | 94 | 71 | 111 | 94 |
| Notifications | 20 | 18 | 16 | 20 | 0 |
| Other | 15 | 9 | 12 | 13 | 2 |
| Seeker | 110 | 85 | 41 | 87 | 23 |
| Trust | 4 | 1 | 2 | 3 | 1 |
| University | 40 | 14 | 22 | 30 | 10 |

## Mobile More Card Navigation Evidence

| Key | Visible in tests | Tapped in tests |
| --- | --- | --- |
| quick-action-ai_career_tools | yes | yes |
| quick-action-campus_verification | yes | yes |
| quick-action-career_passport | yes | yes |
| quick-action-companies | yes | yes |
| quick-action-company_request | yes | yes |
| quick-action-interview_prep | yes | yes |
| quick-action-job_alerts | yes | yes |
| quick-action-mobile_status | yes | yes |
| quick-action-salary_insights | yes | yes |
| quick-action-upload_cv | yes | yes |

## Company More Module Navigation Evidence

| Key | Visible in tests | Tapped in tests |
| --- | --- | --- |
| company-module-AI hiring tools | yes | yes |
| company-module-Audit logs | yes | yes |
| company-module-Company files | yes | yes |
| company-module-Questions | yes | yes |
| company-module-Subscription | yes | yes |
| company-module-Support | yes | yes |
| company-module-Team | yes | yes |
| company-module-Templates | yes | yes |

## Locked Shell Navigation Evidence

| Key | Visible in tests | Tapped in tests |
| --- | --- | --- |
| bottom-nav-events | yes | yes |
| bottom-nav-home | yes | yes |
| bottom-nav-jobs | yes | yes |
| bottom-nav-more | yes | yes |
| bottom-nav-my-applications | yes | yes |
| bottom-nav-my-jobs | yes | yes |
| bottom-nav-opportunities | yes | yes |
| company-tab-applicants | yes | yes |
| company-tab-home | yes | yes |
| company-tab-jobs | yes | yes |
| company-tab-more | yes | yes |
| company-tab-talent | yes | yes |

## Locked Header Action Evidence

| Key | Visible in tests |
| --- | --- |
| dashboard-header-notifications | yes |
| dashboard-header-profile | yes |
| dashboard-header-settings | yes |
| company-header-notifications | yes |
| company-header-profile | yes |
| company-header-settings | yes |

## Required Navigation Guard

The audit fails in `--check` mode unless extracted mobile More cards,
company More cards, role bottom tabs, and locked header actions have widget-test
proof:

- `quick-action-ai_career_tools`
- `quick-action-campus_verification`
- `quick-action-career_passport`
- `quick-action-companies`
- `quick-action-company_request`
- `quick-action-interview_prep`
- `quick-action-job_alerts`
- `quick-action-mobile_status`
- `quick-action-salary_insights`
- `quick-action-upload_cv`
- `company-module-AI hiring tools`
- `company-module-Audit logs`
- `company-module-Company files`
- `company-module-Questions`
- `company-module-Subscription`
- `company-module-Support`
- `company-module-Team`
- `company-module-Templates`
- `bottom-nav-events`
- `bottom-nav-home`
- `bottom-nav-jobs`
- `bottom-nav-more`
- `bottom-nav-my-applications`
- `bottom-nav-my-jobs`
- `bottom-nav-opportunities`
- `company-tab-applicants`
- `company-tab-home`
- `company-tab-jobs`
- `company-tab-more`
- `company-tab-talent`
- `dashboard-header-notifications`
- `dashboard-header-profile`
- `dashboard-header-settings`
- `company-header-notifications`
- `company-header-profile`
- `company-header-settings`

Current result: **pass**

## Priority Backend Endpoints Without Client Evidence

These are the first 33 priority endpoints where this static scan did not find a matching mobile/web client route literal. Some may be intentionally backend-only, admin-only through a generated table, aliases, or covered by dynamic route construction. They still need manual classification before the goal can be called complete.

| Method | Path | Module |
| --- | --- | --- |
| POST | /employee/v1/cv/:cvId/set-default | Seeker |
| POST | /employee/v1/cv/generate/download | Seeker |
| POST | /employee/v1/cv/generate/save | Seeker |
| GET | /employee/v1/global/applications/applied | Seeker |
| PATCH | /employee/v1/global/applications/offers/:invitationId/reject | Seeker |
| GET | /employee/v1/global/applications/rejected | Seeker |
| GET | /employee/v1/global/applications/status | Seeker |
| DELETE | /employee/v1/global/profile/:section/:itemId | Seeker |
| PATCH | /employee/v1/global/profile/:section/:itemId | Seeker |
| GET | /employee/v1/global/profile/completion | Seeker |
| PUT | /employee/v1/global/profile/job-names | Seeker |
| PUT | /employee/v1/global/profile/job-types | Seeker |
| PUT | /employee/v1/global/profile/latest-work-experience | Seeker |
| PUT | /employee/v1/global/profile/min-salary | Seeker |
| POST | /employee/v1/global/profile/rebuild-search-filters | Seeker |
| GET | /employee/v1/helper/currencies | Seeker |
| GET | /employee/v1/helper/education-level | Seeker |
| GET | /employee/v1/helper/experience-level | Seeker |
| GET | /employee/v1/helper/industry | Seeker |
| GET | /employee/v1/helper/job-name | Seeker |
| GET | /employee/v1/helper/salaries | Seeker |
| GET | /employee/v1/helper/services | Seeker |
| GET | /employee/v1/helper/skills | Seeker |
| GET | /university/v1/analytics/outcomes | University |
| GET | /university/v1/analytics/readiness | University |
| GET | /university/v1/analytics/resources | University |
| GET | /university/v1/employer-partners | University |
| GET | /university/v1/events | University |
| POST | /university/v1/events | University |
| DELETE | /university/v1/events/:id | University |
| PATCH | /university/v1/events/:id | University |
| GET | /university/v1/overview | University |
| GET | /university/v1/verifications/:id/document | University |
