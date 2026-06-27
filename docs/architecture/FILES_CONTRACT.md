# Files Contract

Date: 2026-06-27
Scope: uploads, generated CVs, company files, and sensitive downloads.

## Current Storage

- Runtime uploads use `uploads/` by default.
- Generated CV downloads use `cv/generated/`.
- `FILES_DIRECTORY` can override dashboard file base directory.
- Runtime files are ignored and must not be tracked by Git.

## Security Rules

- Validate file names and block path traversal.
- Serve HTML uploads as attachments with restrictive headers.
- Send `X-Content-Type-Options: nosniff` on served files.
- Sensitive CV/document downloads must require auth and correct company/admin context.
- Bulk exports must be audited and permission-checked.

## File Types

| Type | Expected owner |
|---|---|
| CV upload/generated CV | seeker/user |
| Profile image | user/company |
| Company logo/cover/files | company owner/member with permission |
| Company verification documents | company/company admin |
| Campus verification document | campus student/university admin workflow |
| Exports | company/admin only |

## Verification

```bash
npm run test:security-http
npm run check:secrets
```

## Gaps

- MIME/size policies should be documented per endpoint.
- Sensitive download audit coverage must be tested route by route.
- Object storage migration should be planned before high-volume launch.
