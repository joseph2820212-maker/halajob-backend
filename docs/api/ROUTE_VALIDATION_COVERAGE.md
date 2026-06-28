# Route Validation Coverage

Generated: 2026-06-28T09:04:24.822Z

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | 3831 |
| Public/system endpoints | 5 |
| Read-only endpoints allowed without body validator | 299 |
| Write/update/delete endpoints | 2430 |
| Write/update/delete endpoints with validator | 2421 |
| Write/update/delete endpoints missing validator | 9 |
| Write validation coverage | 99.6% |
| Core auth/account missing validators | 0 |

## Module Summary

| Module | Total | Writes | Writes With Validator | Writes Missing Validator |
| --- | --- | --- | --- | --- |
| account | 6 | 3 | 3 | 0 |
| admin | 3290 | 2174 | 2174 | 0 |
| ai | 12 | 12 | 12 | 0 |
| analytics | 5 | 2 | 2 | 0 |
| auth | 14 | 14 | 14 | 0 |
| campus | 61 | 34 | 34 | 0 |
| company | 134 | 65 | 65 | 0 |
| jobs | 2 | 1 | 1 | 0 |
| legacy-user | 154 | 51 | 42 | 9 |
| notifications | 16 | 12 | 12 | 0 |
| other | 19 | 6 | 6 | 0 |
| seeker | 94 | 45 | 45 | 0 |
| trust | 4 | 4 | 4 | 0 |
| university | 20 | 7 | 7 | 0 |

## Missing Write Validators

| Method | Path | Module | Middlewares |
| --- | --- | --- | --- |
| POST | /user/v1/legal-reports | legacy-user | optionalAuthUser, jsonParser, createReport |
| POST | /user/v1/privacy/accessibility | legacy-user | optionalAuthUser, jsonParser, createAccessibilityRequest |
| POST | /user/v1/privacy/consents/:pageKey/acknowledge | legacy-user | authUser, jsonParser, acknowledgePolicy |
| POST | /user/v1/privacy/consents/:purpose | legacy-user | authUser, jsonParser, setConsent |
| POST | /user/v1/privacy/requests | legacy-user | authUser, jsonParser, createPrivacyRequest |
| POST | /user/v1/support/tickets | legacy-user | authUser, listMyTickets |
| PATCH | /user/v1/support/tickets/:id/close | legacy-user | authUser, closeTicket |
| POST | /user/v1/support/tickets/:id/close | legacy-user | authUser, closeTicket |
| POST | /user/v1/support/tickets/:id/messages | legacy-user | authUser, jsonParser, addMessage |
