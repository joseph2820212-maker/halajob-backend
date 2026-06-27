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
- Newly generated public CV links must include an unguessable token and `public_download_expires_at`; authenticated owners should use `/employee/v1/cv/download/:cvId`.
- Send `X-Content-Type-Options: nosniff` on served files.
- Sensitive CV/document downloads must require auth and correct company/admin context.
- Bulk exports must be audited and permission-checked.
- Company file downloads must be audited for both dashboard (`/company/v1/...`) and app (`/user/v1/company/...`) routes.
- Student verification documents must be stored under private `uploads/files/student-verifications/` storage, blocked from direct public `/uploads/files/*` access, and downloaded only through authenticated student-owner or university-admin routes.
- Dashboard protected file downloads under `/dash/v1/file/:name` must require `files.read`, allow only image/PDF extensions, and serve PDFs as attachments with `Cache-Control: no-store`.

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
npm run test:integration:student-verification-documents
npm run check:secrets
```

`npm run test:security-http` creates temporary upload fixtures and proves direct `/uploads/files/*` access returns 404 with `no-store`/`nosniff`, generated CV downloads are PDF attachments with `no-store`/`nosniff`, and root HTML uploads are served as attachments with restrictive CSP.

`npm run test:integration:student-verification-documents` proves student verification document uploads move to private storage, direct public access is denied, student-owner and university-admin downloads are scoped, attachment/no-store/nosniff headers are sent, and upload/download audit rows are written.

`npm run test:file-export-audit` proves company dashboard file downloads and app company request file downloads are authenticated, audited, and blocked for path traversal or another company user.

`npm run test:integration:employee-cv-downloads` proves saved employee CV downloads require auth, are scoped to the owning employee, reject invalid IDs, reject unsafe stored paths, return a clear 404 for missing files, and enforce generated-CV public token/expiry checks for database-backed CV records.

`npm run test:integration:admin-permissions` proves `/dash/v1/file/:name` blocks dashboard admins without `files.read`, allows `files.read` PDF downloads, sends attachment/no-store/nosniff headers, and rejects non-image/non-PDF extensions.

## Gaps

- MIME/size policies should be documented per endpoint.
- Generated CV public-link TTL can be tuned with `GENERATED_CV_PUBLIC_URL_TTL_MINUTES`; default is 60 minutes.
- Sensitive download audit/ownership coverage must continue to be tested route by route.
- Object storage migration should be planned before high-volume launch.
