# Files Contract

Date: 2026-06-27
Scope: uploads, generated CVs, company files, and sensitive downloads.

## Current Storage

- Runtime uploads use `uploads/` by default.
- Generated CV downloads use `cv/generated/`.
- `uploads/files/` is treated as private document storage and is not served through public static uploads.
- `FILES_DIRECTORY` can override dashboard file base directory.
- Runtime files are ignored and must not be tracked by Git.

## Security Rules

- Validate file names and block path traversal.
- Serve HTML uploads as attachments with restrictive headers.
- Serve non-image public uploads as attachments; block direct public access to private document uploads under `/uploads/files/*`.
- Serve generated CV PDFs as attachments with `Cache-Control: no-store`.
- Send `X-Content-Type-Options: nosniff` on served files.
- Sensitive CV/document downloads must require auth and correct company/admin context.
- Bulk exports must be audited and permission-checked.
- Company file downloads must be audited for both dashboard (`/company/v1/...`) and app (`/user/v1/company/...`) routes.

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

`npm run test:security-http` creates temporary upload fixtures and proves direct `/uploads/files/*` access returns 404 with `no-store`/`nosniff`, generated CV downloads are PDF attachments with `no-store`/`nosniff`, and root HTML uploads are served as attachments with restrictive CSP.

`npm run test:file-export-audit` proves company dashboard file downloads and app company request file downloads are authenticated, audited, and blocked for path traversal or another company user.

`npm run test:integration:employee-cv-downloads` proves saved employee CV downloads require auth, are scoped to the owning employee, reject invalid IDs, reject unsafe stored paths, and return a clear 404 for missing files.

## Gaps

- MIME/size policies should be documented per endpoint.
- Generated CV public-link expiry/ownership policy still needs a product decision.
- Sensitive download audit/ownership coverage must continue to be tested route by route.
- Object storage migration should be planned before high-volume launch.
