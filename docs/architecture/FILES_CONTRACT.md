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
- Reject unsupported file extensions/MIME types with `unsupported_file_type` and oversize uploads with `file_too_large`.
- Serve HTML uploads as attachments with restrictive headers.
- Serve non-image public uploads as attachments; block direct public access to private document uploads under `/uploads/files/*`.
- Serve generated CV PDFs as attachments with `Cache-Control: no-store`.
- Newly generated public CV links must include an unguessable token and `public_download_expires_at`; authenticated owners should use `/employee/v1/cv/download/:cvId`.
- Send `X-Content-Type-Options: nosniff` on served files.
- Sensitive CV/document downloads must require auth and correct company/admin context.
- Bulk exports must be permission-checked, audited on success, and reject invalid explicit application IDs or unsupported formats before writing successful export audit rows.
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
npm run test:integration:profile-uploads
npm run check:secrets
```

`npm run test:security-http` creates temporary upload fixtures and proves direct `/uploads/files/*` access returns 404 with `no-store`/`nosniff`, generated CV downloads are PDF attachments with `no-store`/`nosniff`, and root HTML uploads are served as attachments with restrictive CSP.

`npm run test:integration:student-verification-documents` proves student verification document uploads reject MIME mismatches and oversize files with clean 4xx responses, move valid documents to private storage, deny direct public access, scope student-owner and university-admin downloads, send attachment/no-store/nosniff headers, and write upload/download audit rows.

`npm run test:integration:profile-uploads` proves seeker/company user profile image uploads plus company logo/cover media uploads reject MIME mismatches and oversize files with clean 4xx responses and do not mutate user/company image fields when uploads are rejected.

`npm run test:file-export-audit` proves company request file uploads reject MIME mismatches and oversize files with clean 4xx responses, company dashboard file downloads and app company request file downloads are authenticated, audited, and blocked for path traversal or another company user, and company bulk export endpoints reject invalid explicit application IDs or unsupported formats without writing successful export audit rows.

`npm run test:integration:employee-cv-downloads` proves CV uploads reject unsupported file types and oversize files with clean 4xx responses, saved employee CV downloads require auth, are scoped to the owning employee, reject invalid IDs, reject unsafe stored paths, return a clear 404 for missing files, and enforce generated-CV public token/expiry checks for database-backed CV records.

`npm run test:integration:admin-permissions` proves `/dash/v1/file/:name` blocks dashboard admins without `files.read`, allows `files.read` PDF downloads, sends attachment/no-store/nosniff headers, and rejects non-image/non-PDF extensions.

## Gaps

- MIME/size policies should be documented for remaining upload endpoints not covered by the company request, student verification, CV, profile image, and company media upload integration tests.
- Generated CV public-link TTL can be tuned with `GENERATED_CV_PUBLIC_URL_TTL_MINUTES`; default is 60 minutes.
- Sensitive download audit/ownership coverage must continue to be tested route by route.
- Object storage migration should be planned before high-volume launch.
