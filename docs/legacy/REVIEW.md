# Hala Job — Correction Tracker (REVIEW.md)

> Living checklist from the deep-scan audit. Source of truth for what needs correcting vs. what's good.
> Trunk branch: `flutter-seeker-campus` (Family B). Legacy `main`/`fix-critical-issues`/`campus-backend-mode` = reference only.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` fixed · `[v]` verified · `[-]` wontfix/accepted

## Ratings

| Area | Rating | Findings (C/H/M/L) |
|---|:---:|---|
| Backend: Security & Auth | 7/10 | 0/3/6/6 |
| Backend: Architecture & Code Quality | 5/10 | 0/4/6/4 |
| Backend: API & Routes | 5/10 | 1/3/8/1 |
| Backend: Data Models & DB | 6/10 | 1/5/8/3 |
| Backend: Services & Integrations | 6/10 | 0/2/7/3 |
| Web Frontend (React/TS) | 6/10 | 0/2/5/6 |
| Flutter Mobile App | 7/10 | 0/2/5/4 |
| Testing, CI/CD & DevOps | 6/10 | 0/4/9/5 |
| Documentation & Repo Hygiene | 6/10 | 0/2/3/7 |
| **Overall** | **6.0/10** | |


## Backend: Security & Auth — 7/10

_The halajobe backend has solid fundamentals with proper authentication/JWT flow, bcrypt password hashing, and input validation via multer. However, several critical security controls are missing: HSTS enforcement, brute-force protection on auth endpoints, CSRF tokens, passcode attempt limiting, and weak random number generation for sensitive OTP codes. The CORS configuration is permissive in development but should be more restrictive._

- [ ] 🟠 **HIGH** — Missing HSTS Header in Helmet Configuration _(⚠ unverified/invalid)_
  - `/home/user/halajobe/app.js:141-149`
  - Helmet is configured but does not enforce HTTP Strict-Transport-Security (HSTS). The configuration explicitly disables CSP and other protections. This allows potential downgrade attacks and man-in-the-middle (MITM) attacks if HTTP traffic is not properly redirected to HTTPS at infrastructure level.
  - **Fix:** Enable HSTS in helmet configuration with a reasonable maxAge (e.g., 31536000 for 1 year) and preload flag. Add: hsts: { maxAge: 31536000, preload: true, includeSubDomains: true }
- [ ] 🟠 **HIGH** — Weak OTP/Passcode Generation Using crypto.randomInt _(verified: medium)_
  - `/home/user/halajobe/controllers/app/Auth/LoginController.js:46, authController.js:53, ForgotPasswordController.js:133, PassCodeController.js, ResendOtpController.js:14`
  - Passcodes and OTP codes are generated using crypto.randomInt(10000, 100000), which produces only 90,000 possible values. For a 10-minute window, an attacker can perform brute-force attacks with roughly 150 attempts/second to achieve a 50% chance of success. No rate limiting or attempt tracking is implemented on passcode verification endpoints.
  - **Fix:** Generate stronger passcodes using at least 32 bits of entropy (e.g., crypto.randomInt(100000000, 1000000000) for 9 digits, or use crypto.randomBytes(4) for 32-bit entropy). Implement rate limiting with progressive delays and account lockout on passcode endpoints (/user/v1/auth/passcode-verify, /user/v1/auth/resend-otp).
- [ ] 🟠 **HIGH** — No Brute-Force Protection on Authentication Endpoints _(⚠ unverified/invalid)_
  - `/home/user/halajobe/app.js:115-124`
  - Auth limiter is configured globally (20 requests/15 min in production) but is only applied to specific routes (/user/v1/auth, /employee/v1/auth, /company/v1/auth, /dash/v1/auth). Passcode verification, OTP resend, and device verification endpoints lack individual rate limiting, allowing unbounded brute-force attempts against these sensitive operations.
  - **Fix:** Apply stricter rate limits specifically to sensitive endpoints: /user/v1/auth/passcode-verify (5 req/15min per user), /user/v1/auth/resend-otp (3 req/hour per email), /user/v1/auth/verifyNewDevice (5 req/15min). Implement exponential backoff and temporary account lockout after 5 failed attempts.
- [ ] 🟡 **MEDIUM** — Missing No-Cache Headers for Authentication Responses
  - `/home/user/halajobe/middlewares/userAuth.js, isAdmin.js`
  - Authentication success responses (access tokens, refresh tokens) are not explicitly set with Cache-Control: no-store, no-cache, must-revalidate headers. This could allow cached tokens to be served to other users on shared devices or proxies.
  - **Fix:** Add middleware to set no-cache headers on all auth responses: res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.set('Pragma', 'no-cache'); res.set('Expires', '0');
- [ ] 🟡 **MEDIUM** — No CSRF Token Protection on State-Changing Operations
  - `/home/user/halajobe/app.js:1-314`
  - No CSRF middleware (e.g., csurf) is implemented. State-changing operations (POST/PUT/DELETE) on sensitive endpoints like /user/v1/auth/logout, /company/v1 operations, and /jobs/v1 job creation are unprotected against cross-site request forgery attacks. This is partially mitigated by Bearer token auth but not fully compliant with defense-in-depth.
  - **Fix:** Implement CSRF tokens for traditional form submissions. For API-first architecture, ensure SameSite=Strict cookie flag is set on auth cookies and validate Origin/Referer headers on sensitive endpoints.
- [ ] 🟡 **MEDIUM** — CORS Allows All Origins in Non-Production Environments
  - `/home/user/halajobe/app.js:63-64`
  - Line 63-64: if (!isProduction) { return callback(null, true); } - This allows any origin to access the API in development/staging, which could leak sensitive data if those environments are accessible. The wildcard pattern in CORS_ORIGIN_PATTERNS could also match unintended subdomains.
  - **Fix:** Enforce strict CORS even in non-production environments. Use explicit whitelists per environment. Validate CORS_ORIGIN_PATTERNS more strictly to prevent partial wildcard matches (e.g., https://*.vercel.app currently matches ANY subdomain).
- [ ] 🟡 **MEDIUM** — RefreshTokenModel Schema Lacks Rotation Tracking
  - `/home/user/halajobe/models/RefreshTokenModel.js:1-27`
  - RefreshTokenModel stores token plaintext in database without tracking token rotation chains, expiration explicitly, or rotation history. While rotation is implemented in tokenService.js (line 158), there's no way to invalidate leaked refresh tokens that haven't been rotated yet. Device fingerprinting via device.brand/model_name is weak and can change after device updates.
  - **Fix:** Add explicit expiration field to RefreshTokenModel, track rotation chain with parent token reference, and add rotation_count. Use stronger device fingerprinting (e.g., device_fingerprint hash). Implement token family tracking to detect token reuse attacks.
- [ ] 🟡 **MEDIUM** — JWT Secret Not Validated for Sufficient Length
  - `/home/user/halajobe/index.js:16-25, /home/user/halajobe/.env.example:4`
  - .env.example shows JWT_SECRET with no minimum length validation. No validation ensures JWT_SECRET is cryptographically strong (recommended: 32+ bytes). Weak secrets expose the application to token forgery attacks.
  - **Fix:** Add validation in loadEnv.js: ensure JWT_SECRET is at least 32 bytes (256 bits) of entropy. Log warning if secret is weak: if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) { logger.warn('JWT_SECRET too short'); }
- [ ] 🟡 **MEDIUM** — Password Validation Not Enforced on Registration
  - `/home/user/halajobe/validations/authValidations.js:4-13`
  - loginSchema and registerSchema have password validation commented out (lines 8-12, 33-37). Regex for password strength is defined in RegisterController.js but validation is not applied at route level. Users can register with weak passwords like '1'.
  - **Fix:** Uncomment and enforce password validation on registration: require 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char. Use the regex from line 12 of RegisterController.js or implement password-strength library validation.
- [ ] ⚪ **LOW** — HTTP Status 202 Exposes Internal Auth Flow States
  - `/home/user/halajobe/controllers/app/Auth/LoginController.js:163-173, authController.js:173-181`
  - Login responses return HTTP 202 (Accepted) with 'ENTER_PASSCODE' step information, which reveals to attackers that the login flow requires email verification. Combined with vague error messages ('The data sent is incorrect.'), this allows user enumeration if timing differences exist.
  - **Fix:** Return consistent HTTP 200 response for all login attempts with minimal feedback. Perform email verification silently in background without revealing flow state to client.
- [ ] ⚪ **LOW** — ContentSecurityPolicy Disabled in Helmet
  - `/home/user/halajobe/app.js:147`
  - contentSecurityPolicy: false disables CSP protection entirely. This reduces protection against XSS attacks when user-generated content is rendered (e.g., CV previews in /cv/generated).
  - **Fix:** Enable CSP with restrictive defaults: contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], fontSrc: ["'self'"] } }
- [ ] ⚪ **LOW** — File Upload Validation Relies on MIME Type Only
  - `/home/user/halajobe/utils/multer.js:30-35, /home/user/halajobe/utils/multerCv.js:25-30`
  - File upload validation checks MIME type and extension but does not validate file contents (magic bytes). Attackers can bypass restrictions by uploading executables with .pdf extension, though disk storage mitigates execution risk.
  - **Fix:** Validate file magic bytes using library like 'file-type'. Example: const fileType = await FileType.fromBuffer(buffer); if (fileType?.ext !== 'pdf') reject();
- [ ] ⚪ **LOW** — Passcode Expiration Set to Only 10 Minutes
  - `/home/user/halajobe/controllers/app/Auth/LoginController.js:148, authController.js:89, ForgotPasswordController.js:133`
  - Passcodes expire after 10 minutes (line 148: Date.now() + 10 * 60 * 1000). While reasonable, combined with weak 5-digit generation and no rate limiting, a 10-minute window provides sufficient time for brute-force attacks.
  - **Fix:** Reduce passcode lifetime to 5 minutes. Implement exponential backoff after 3 failed attempts (30s delay after attempt 3, 2min after attempt 5). Send email notification on failed attempts.
- [ ] ⚪ **LOW** — Health Endpoint Uses Custom Secret Instead of Standard Auth
  - `/home/user/halajobe/middlewares/protectHealth.js:1-9, /home/user/halajobe/routesHealth/index.js:7`
  - Health endpoint (/health) uses custom HEALTH_SECRET header instead of Bearer token auth. This creates an additional secret to manage and exposes all API routes in HTML table format, which aids reconnaissance.
  - **Fix:** Protect health endpoint with standard JWT auth or remove route listing from health response. Return minimal JSON: { status: 'ok', timestamp: Date.now() }
- [ ] ⚪ **LOW** — Device Trust Model Does Not Prevent Concurrent Sessions
  - `/home/user/halajobe/models/UserModel.js:163-166, /home/user/halajobe/services/tokenService.js:64-89`
  - Users can maintain unlimited concurrent device sessions. The device array stores device history without limiting simultaneous logins. Compromised tokens on one device cannot be revoked without logging out all devices.
  - **Fix:** Add max_concurrent_sessions limit per user (e.g., 3 devices). On new login, remove oldest device if limit exceeded. Implement device trust confirmation for new logins.

**Keep (good — do not touch):**
- ✅ Proper JWT implementation with refresh token rotation and loginTime tracking for session invalidation
- ✅ Bcryptjs used consistently for password hashing with salt rounds of 10
- ✅ Input sanitization via express-mongo-sanitize prevents NoSQL injection attacks
- ✅ Mongoose used for database queries, preventing SQL injection
- ✅ File uploads restricted to whitelisted extensions and MIME types with randomized filenames
- ✅ Rate limiting implemented on global and auth-specific endpoints
- ✅ Helmet middleware enforces security headers (X-Content-Type-Options: nosniff, etc.)
- ✅ Sensitive data (passwords, passcodes) excluded from API responses and user selections
- ✅ Path traversal protection in file serving (app.js:245, /cv/generated endpoint validates file paths)
- ✅ Payload sanitization filters dangerous keys like __proto__, prototype, and $ operators in admin resource controller
- ✅ Account context-based authorization with role and permission checking

## Backend: Architecture & Code Quality — 5/10

_The halajobe backend shows foundational Express.js structure with security measures (helmet, CORS, rate-limiting) but suffers from significant architectural inconsistencies, substantial code duplication, mixed error handling patterns, and poor separation of concerns. The codebase lacks centralized utilities for common operations (normalization, response formatting), has inconsistent async error handling, and contains a suspicious duplicate directory ("jops/" alongside "jobs/"). The 109 controller files and fragmented helpers indicate ad-hoc development without cohesive architectural governance._

- [ ] 🟠 **HIGH** — Duplicate Directory: jops/ vs jobs/ _(verified ✓)_
  - `/home/user/halajobe/jops/`
  - The directory /home/user/halajobe/jops/ contains languageJop.js (24 lines), a file with a typo in its name ('Jop' instead of 'Job'). This mirrors functionality that should exist in /home/user/halajobe/jobs/ (which contains campusEvent.jobs.js, jobLifecycle.jobs.js, scheduler.js, jobLock.js). The file appears to be dead code using Bull queue with hardcoded Redis config (127.0.0.1:6379).
  - **Fix:** Delete /home/user/halajobe/jops/ entirely. Consolidate any active queue logic into /home/user/halajobe/jobs/. Fix the typo and ensure single source of truth for background job processing.
- [ ] 🟠 **HIGH** — Widespread Code Duplication: Helper Functions Replicated Across Controllers _(verified ✓)_
  - `multiple (authController.js, LoginController.js, CreateJobController.js, etc.)`
  - 12 controller files contain duplicate implementations of identical utility functions like normEmail, normStr, safeStr, buildPublicUrl, and toBool. Examples: /home/user/halajobe/controllers/app/Auth/authController.js lines 13-28 duplicate identical normalizers found in LoginController.js and other Auth controllers. CreateJobController.js (line 100-113) reimplements normalization logic not found in any shared utility.
  - **Fix:** Create a centralized /home/user/halajobe/utils/stringHelpers.js exporting {normStr, normEmail, safeStr, toBool} and use consistently across all controllers. Reduces duplication from 12 files to 1.
- [ ] 🟠 **HIGH** — Inconsistent Error Handling Patterns Across Controllers _(verified ✓)_
  - `multiple (authController.js, LoginController.js, NotificationController.js)`
  - Controllers use three incompatible error handling patterns: (1) ReturnAppData.createError() [authController.js line 116], (2) next(error) [LoginController.js line 297], and (3) direct res.status().json() [NotificationController.js line 99]. Some controllers log to console.error (authController.js line 241, LoginController.js line 242) while others delegate to next(). CreateJobController.js (line 388-413) has incomplete catch block that checks error.name === 'ValidationError' but only handles that case, letting other errors fall through.
  - **Fix:** Enforce single error handling pattern: all catch blocks should call next(error) to leverage central error.js middleware. Remove console.error calls. Use /home/user/halajobe/middlewares/error.js as single handler. Create error wrapper utility for validation errors.
- [ ] 🟠 **HIGH** — No Async Error Handler Wrapper _(verified ✓)_
  - `/home/user/halajobe/controllers/app (multiple files)`
  - Controllers have 473 try-catch blocks but only 99 next(error) calls in controllers/app (ratio 1:4.7), meaning many controllers catch errors and return responses instead of delegating. This bypasses the centralized error.js middleware and produces inconsistent error responses. No async wrapper middleware exists to auto-catch unhandled promise rejections from route handlers.
  - **Fix:** Create /home/user/halajobe/utils/asyncHandler.js wrapping route handlers to auto-catch errors and call next(). Migrate all catch blocks to use next(error). Establishes consistent error flow through error.js middleware.
- [ ] 🟡 **MEDIUM** — Mixed Response Format Patterns
  - `multiple (NotificationController.js, FcmTokenController.js, various others)`
  - Controllers use inconsistent response formats: some use ReturnAppData helper (authController.js), some use res.json() with custom status field (NotificationController.js line 66-78), others use res.status().json(). This creates multiple conventions for clients to parse success/error responses. NotificationController.js returns {status: true, message, data} while ReturnAppData may return {status: true, message, data, other}.
  - **Fix:** Standardize on ReturnAppData helper across all controllers. Eliminate direct res.json()/res.status() calls in business logic. Consider single response schema: {success: boolean, message: string, data?: T, errors?: Record}.
- [ ] 🟡 **MEDIUM** — Poor Separation of Concerns: Helper vs Service vs Controller Blurring
  - `/home/user/halajobe/helper (18 files), /home/user/halajobe/services (30+ files), /home/user/halajobe/controllers/app (109 files)`
  - No clear boundary between layers. Helper/ contains translation (translate.js), email (sendEmail.js), return data formatting (ReturnAppData/index.js) mixed with domain logic. CreateJobController.js (lines 86-218) contains 130 lines of keyword extraction/normalization logic that should be in services/. Controllers directly access models and perform business logic instead of delegating to service layer.
  - **Fix:** Establish strict layer definitions: Controllers (HTTP only), Services (domain logic), Models (persistence), Helpers (pure utilities). Move tokenizeDeep, extractKeywords, normalization into services/search/ or services/nlp/. Move response formatting into response middleware. Keep helpers for pure functions only.
- [ ] 🟡 **MEDIUM** — Incomplete Error Handling in Validation: CreateJobController
  - `/home/user/halajobe/controllers/app/Jobs/CreateJobController.js:388-413`
  - Catch block handles only ValidationError by name (line 389) and returns early. Any non-ValidationError falls through to line 413 without handling, leaving the function incomplete. If yup validation fails with a non-standard error or other exceptions occur, error is not handled.
  - **Fix:** Restructure catch to handle all error types: catch ValidationError explicitly, then default catch block calls next(error) or returns 500 response. Add else clause or separate catch for Error type.
- [ ] 🟡 **MEDIUM** — i18n Pattern: Duplicated Language Check in Every Controller
  - `multiple (authController.js, LoginController.js, CreateJobController.js, etc.)`
  - Every controller function includes const lan = req.get('lan') || 'en' (authController.js line 110, LoginController.js line 77, CreateJobController.js line 228). 299 occurrences of this pattern across controllers. Also duplicated ternary patterns like (lan === 'ar' ? arabic_msg : english_msg) repeated hundreds of times.
  - **Fix:** Create middleware to extract language once: app.use((req, res, next) => { req.language = (req.get('lan') || 'en').toLowerCase(); next(); }). Create translate helper: t(req, arText, enText). Reduces duplication and centralizes i18n logic.
- [ ] 🟡 **MEDIUM** — Silent Error Suppression: Fire-and-Forget Promise
  - `/home/user/halajobe/controllers/app/Jobs/CreateJobController.js:353`
  - Line 353: Job_created_notification(job).catch?.(console.error) silently catches promise rejections and logs to console without retrying or alerting. recordAnalyticsEvent (lines 354-368) also chains .catch(() => null) silently swallowing errors. Notification and analytics failures are hidden from observability.
  - **Fix:** Use centralized error logger instead of console.error. Implement retry logic for critical notifications. Log to Winston logger (config/logger.js exists but underutilized). Consider queuing critical side-effects instead of fire-and-forget.
- [ ] 🟡 **MEDIUM** — No Input Sanitization Beyond Mongo: User Input Processing
  - `app.js:179-181, controllers/app/Auth/ files`
  - app.js uses mongoSanitize() to protect DB, but controllers manually call .trim() and .toLowerCase() individually (authController.js lines 13-15, 22-28). No centralized input sanitization middleware. Device brand/model names (LoginController.js lines 93-95) validated only for type/existence, not content length or format.
  - **Fix:** Create input sanitization middleware after mongoSanitize that normalizes common fields (email → lowercase, names → trim, etc.). Set max string length limits. Validate device info more strictly.
- [ ] ⚪ **LOW** — Unused/Dead Code: validations/ Directory Underutilized
  - `/home/user/halajobe/validations/ (5 files: authValidations.js, userValidations.js, etc.)`
  - Validation schemas defined in /validations/authValidations.js (lines with commented-out password regex, incomplete schema definitions) but not enforced in routes. Controllers use inline yup validation (CreateJobController.js line 267) instead of importing from validations/. Suggests incomplete migration or abandoned validation framework.
  - **Fix:** Either complete and enforce validation schemas from /validations/, or migrate all validation inline. Remove unused validation files. Document validation strategy.
- [ ] ⚪ **LOW** — Logging Inconsistency: console.error Mixed with Winston Logger
  - `multiple Auth controllers, error.js:30-38`
  - Controllers use console.error (authController.js:241, LoginController.js:242, 10 files total in /controllers/app/Auth/). error.js middleware uses winston logger (line 30-38) for non-ApiError exceptions. Mix of logging approaches prevents centralized log aggregation.
  - **Fix:** Replace all console.error/console.log calls with logger.error/logger.info. Import logger from config/logger.js. Ensure all code paths use same logging facility for observability.
- [ ] ⚪ **LOW** — Routing Fragmentation: 13 Route Files with Inconsistent Naming
  - `/home/user/halajobe/routes/ (DashboardRoute.js, JobRoute.js, authRoute.js, etc.)`
  - Routes directory has inconsistent naming: some PascalCase (DashboardRoute.js), some camelCase (authRoute.js). app.js imports from both /routes/ and /routesJobs/, /routesUser/, etc., creating parallel route structures. 15 separate route directories at root level suggests historical fragmentation.
  - **Fix:** Consolidate routes into single directory with consistent naming. Consider organizing by feature instead of entity (routes/auth/, routes/jobs/, routes/admin/ with unified middleware). Apply naming convention: all files lowercase with hyphen (auth-route.js, job-route.js).
- [ ] ⚪ **LOW** — Configuration Not Centralized: Hardcoded Values Scattered
  - `/home/user/halajobe/jops/languageJop.js:6, CreateCompanyController.js:10, multiple`
  - Redis config hardcoded (127.0.0.1:6379) in jops/languageJop.js line 6. File paths hardcoded in app.js (line 205-206), CreateCompanyController.js (line 7). MAX_FILES limit (CreateCompanyController.js line 10) hardcoded in controller instead of constants file.
  - **Fix:** Create /home/user/halajobe/config/constants.js for all magic numbers/strings. Move hardcoded values to config/. Use environment variables for Redis/file paths. Import from constants file instead of inline values.

**Keep (good — do not touch):**
- ✅ Strong foundational security: helmet, rate-limiting, CORS with wildcard patterns, mongoSanitize, HPP protection applied consistently in app.js
- ✅ Centralized error middleware exists (error.js with converter and handler) providing foundation for standardization
- ✅ Winston logger configured for both dev and production environments with proper log levels
- ✅ JWT authentication with refresh token rotation implemented (tokenService.js) with proper device tracking
- ✅ MongoDB connection pooling configured with reasonable defaults (maxPoolSize: 20) and graceful shutdown handlers (exitHandler in index.js)
- ✅ Comprehensive model coverage (80+ models) with clear domain separation (User, Company, Employee, Jobs, etc.)
- ✅ Rate-limiting properly applied to auth and upload endpoints with production/dev differentiation
- ✅ API versioning strategy in place (/user/v1, /company/v1, /jobs/v1, etc.)

## Backend: API & Routes — 5/10

_The backend API has foundational structure with Express routing, middleware-based authentication, and versioning via URL prefixes (v1). However, the architecture suffers from significant organizational, validation, and consistency issues. Most controllers (106 of 109) lack input validation schemas, endpoints have duplicate method registrations with inconsistent HTTP semantics, and response status codes are non-standard. Route naming uses typos (e.g., "Rote" instead of "Route"), and error handling relies on inconsistent patterns across controllers._

- [ ] 🔴 **CRITICAL** — Missing Input Validation on 97% of Controllers _(verified: high)_
  - `/home/user/halajobe/controllers/`
  - Only 3 of 109 controller files use schema validation (yup/Joi): CreateJobController.js, UpdateJobController.js, and EditProfileController.js. The remaining 106 controllers perform minimal or ad-hoc parameter validation, relying on manual string/type checks. This exposes the API to invalid data, injection attacks, and type confusion vulnerabilities.
  - **Fix:** Implement a unified validation middleware/layer using Joi or yup for all controller endpoints. Validate req.body, req.query, and req.params at the route level or controller entry point before business logic executes. Establish a validation schema library for reusable patterns across endpoints.
- [ ] 🟠 **HIGH** — Non-Standard HTTP Status Codes for Success Responses _(verified ✓)_
  - `/home/user/halajobe/helper/ReturnAppData/index.js (lines 27, 33)`
  - The ReturnAppData helper uses non-standard HTTP status codes: 202 (Accepted) for updates and 203 (Non-Authoritative Information) for deletes. Standard REST conventions use 200 (OK) for successful GET/updates and 204 (No Content) for deletes. This can confuse clients, monitoring tools, and HTTP caching proxies.
  - **Fix:** Align status codes to RFC 7231: use 200 for successful GETs and data-returning UPDATEs, 201 for creates (already correct), 204 for successful deletes with no response body. Reserve 202 for async operations only.
- [ ] 🟠 **HIGH** — Duplicate Route Definitions with Inconsistent HTTP Methods _(verified ✓)_
  - `/home/user/halajobe/routes/index.js (lines 108-131)`
  - Multiple endpoints define both POST and PATCH handlers for the same action on identical paths: '/company-requests/:id/approve', '/company-requests/:id/reject', '/jobs/:id/approve', '/jobs/:id/reject', '/trust/jobs/:jobId/mark-safe', '/trust/jobs/:jobId/suspend', '/trust/jobs/:jobId/request-documents', '/talent-requests/:id/status'. POST should create, PATCH should update—using both for the same side-effect violates REST semantics and creates confusion in API contracts.
  - **Fix:** Choose POST for state-altering operations on resource collections (idempotent admin actions) and use PATCH only for partial resource updates. Document the decision in API contracts. Remove one of the duplicate method registrations per endpoint.
- [ ] 🟠 **HIGH** — Minimal Validation in Most Controllers—Only Manual Checks _(verified ✓)_
  - `/home/user/halajobe/controllers/app/Auth/LoginController.js (lines 76-103)`
  - Controllers validate request data via imperative if-checks without schemas. For example, LoginController manually checks email/password existence (lines 80-91), device properties existence (lines 93-103). This pattern is error-prone: missing edge cases, inconsistent error messages, no type coercion, and duplicate validation logic across endpoints.
  - **Fix:** Adopt Joi or yup for declarative validation. Define schemas once per endpoint and reuse. Example: Define emailSchema, passwordSchema, deviceSchema, then compose them in route-level or middleware validation.
- [ ] 🟡 **MEDIUM** — Inconsistent Route File Naming Convention
  - `/home/user/halajobe/routesUser/ (22 files named *Rote.js)`
  - All route files in routesUser/ use the suffix 'Rote' instead of the correct English spelling 'Route' (AuthRote.js, JobRote.js, MeRote.js, etc.). This is a typo that reduces code readability and professionalism, though functionally harmless. Other route directories (routesCompany, routesEmployee, etc.) use correct naming.
  - **Fix:** Rename all routesUser/*Rote.js files to *Route.js for consistency. Update import statements in /home/user/halajobe/routesUser/index.js accordingly. Use automated tooling (e.g., bulk rename) to avoid manual errors.
- [ ] 🟡 **MEDIUM** — Endpoint Path Duplication in Admin Routes
  - `/home/user/halajobe/routes/index.js (lines 98-104, 128-131)`
  - Some endpoints are registered twice with different path patterns: GET '/audit-logs' and GET '/operations/audit-logs' both call the same controller (line 98-99); GET '/talent-requests' and GET '/operations/talent-requests' (line 128-129). Aliases can cause confusion and maintenance overhead if not intentional.
  - **Fix:** If aliases are intentional, document them in API docs. Otherwise, consolidate to single canonical paths and update clients. Consider using middleware route prefixing instead of duplicate registrations.
- [ ] 🟡 **MEDIUM** — Inconsistent Pagination Implementation Across Endpoints
  - `Multiple: /home/user/halajobe/controllers/app/Jobs/JobDataController.js, /home/user/halajobe/controllers/companyDash/companyJobHiringController.js`
  - Pagination is implemented ad-hoc in individual controllers using parseIntBounded(). Default page values vary: JobDataController defaults page to 0 (line 47), companyJobHiringController defaults to 1 (pagination helper). Limit bounds differ: JobDataController allows up to 50 (line 48), companyJobHiringController up to 100 (hiring helpers). Inconsistent defaults and bounds confuse clients.
  - **Fix:** Create a shared pagination middleware or utility that enforces consistent defaults (page=1, limit=20, max_limit=100). Export from a central module and use across all list endpoints. Document pagination behavior in API contracts.
- [ ] 🟡 **MEDIUM** — Authentication Middleware Does Not Validate Token Type Consistently
  - `/home/user/halajobe/middlewares/userAuth.js (lines 28-30)`
  - The userAuth middleware validates JWT token type (line 28) against tokenTypes.ACCESS enum. However, optionalAuthUser and isAdmin middlewares may not perform the same check, creating inconsistency. If a refresh token is accidentally used on a protected endpoint, it might not be rejected uniformly.
  - **Fix:** Centralize token validation: extract token type checking into a separate utility function used by all auth middlewares (userAuth, isAdmin, requireAppAccount). Ensure refresh tokens are never accepted on protected endpoints.
- [ ] 🟡 **MEDIUM** — ContentSecurityPolicy Disabled in Helmet Configuration
  - `/home/user/halajobe/app.js (lines 141-149)`
  - Helmet's contentSecurityPolicy is explicitly set to false (line 147), disabling XSS and injection attack protection. This was likely disabled for development/testing but is exposed in production if NODE_ENV is not strictly enforced.
  - **Fix:** Enable CSP in production with a strict policy (e.g., default-src 'self'). Use a separate configuration for dev environments. Verify NODE_ENV is set to 'production' in production deployments. See helmet docs for CSP policy examples.
- [ ] 🟡 **MEDIUM** — Rate Limiting Configuration Allows Excessive Requests in Development
  - `/home/user/halajobe/app.js (lines 104-135)`
  - Rate limiter max values for development are 2000 global, 200 auth, 300 upload requests per 15 minutes. If NODE_ENV is not strictly 'production', these permissive limits apply, allowing abuse. Global limit of 2000 req/15min (~2 req/sec) is insufficient for even modest traffic.
  - **Fix:** Tighten development limits (e.g., max=500 global). Consider dynamic rate limiting based on IP/user. Add per-endpoint custom limits for expensive operations (job search, uploads). Document rate limit headers in API responses.
- [ ] 🟡 **MEDIUM** — No Validation of Unknown/Extra Request Parameters
  - `Most controllers except CreateJobController.js and UpdateJobController.js`
  - Yup schema in CreateJobController uses .noUnknown(true) (line 83), but 106 other controllers silently ignore extra parameters. Clients can send unexpected fields, potentially masking typos (e.g., 'paage=1' instead of 'page=1') or bypassing intent.
  - **Fix:** Adopt strict validation: reject requests with unknown fields. Use Joi/yup with .unknown(false) by default. Document which endpoints accept extra parameters for extensibility.
- [ ] 🟡 **MEDIUM** — Typo in Status Codes: 202/203 Are Not REST-Appropriate for Success
  - `/home/user/halajobe/controllers (9 files use status: 202 or 203)`
  - HTTP 202 (Accepted) signals async processing; HTTP 203 (Non-Authoritative) signals proxy/cache transformations. Neither is appropriate for synchronous REST updates/deletes. Using non-standard codes breaks client expectations and monitoring tools.
  - **Fix:** Replace: 202 → 200 for sync updates, 200 for sync GET results; 203 → 204 for deletes with no response body. If operations are async, use 202 only if the server truly queues work and returns a status monitor URI.
- [ ] ⚪ **LOW** — File Upload Size Limit Set to 4MB—Inconsistent with JSON Limit
  - `/home/user/halajobe/utils/multer.js (line 53); /home/user/halajobe/app.js (line 155)`
  - Multer file upload limit is 4MB (line 53), but express.json() limit defaults to '2mb' (line 155). This asymmetry may confuse clients: JSON payloads are rejected before multipart uploads are processed, creating different error handling paths.
  - **Fix:** Align limits: set both to same value (e.g., 5MB) or document the difference clearly. Consider separate limits for CV uploads (multipart) vs. JSON API payloads.

**Keep (good — do not touch):**
- ✅ Strong authentication middleware foundation with JWT token validation, refresh token rotation, and active context resolution
- ✅ Comprehensive route organization across 11 route directories with clear versioning via /v1/ prefixes
- ✅ Well-implemented security middleware: mongoSanitize, HPP (HTTP Parameter Pollution) protection, CORS with origin pattern matching, rate limiting with tiered limits
- ✅ Consistent use of custom ReturnAppData helper for response formatting (status, message, data structure)
- ✅ Pagination implemented with bounded integer parsing to prevent DoS and integer overflow attacks
- ✅ File upload validation with MIME type checking, extension whitelisting, and filename sanitization
- ✅ Error converter middleware handles yup ValidationError transformation to HTTP 400 responses
- ✅ Multer file upload configuration enforces realistic size limits and counts; proper CSV/XLSX/PDF support
- ✅ RESTful endpoint structure mostly follows conventions (POST for create, PATCH for update, DELETE for remove) despite some edge cases
- ✅ Comprehensive helper utilities for common operations (pagination, company queries, role/permission resolution)

## Backend: Data Models & DB — 6/10

_The halajobe monorepo contains 71 Mongoose models with generally sound architectural foundations, but exhibits critical data integrity issues, insufficient schema-level validation, weak cascade delete protection, and problematic denormalization patterns. While indexes are comprehensive in quantity, there are issues with array field indexing, data consistency across denormalized copies, and mixed-type fields that undermine queryability and type safety. The platform lacks comprehensive pre/post-hooks for data integrity and no apparent transaction support across related entities._

- [ ] 🔴 **CRITICAL** — Critical: Schema Reference Error - city_id References Wrong Collection _(verified: high)_
  - `/home/user/halajobe/models/CompanyModel.js:90, EmployeeModel.js:358`
  - Both CompanyModel and EmployeeModel define city_id fields with ref: 'countries' instead of a proper cities collection. The CountryModel merges country and city data into a single collection (country_code + city_name fields), causing incorrect reference semantics. This breaks relational integrity and makes city lookups semantically incorrect.
  - **Fix:** Either create a dedicated Cities collection with proper country_id references and update city_id refs accordingly, or use city_name as a denormalized string field with explicit documentation. At minimum, rename the field to city_name for clarity.
- [ ] 🟠 **HIGH** — High: Inadequate Schema-Level Validation _(verified ✓)_
  - `models/*.js (all models)`
  - Only 3 models have pre-validate hooks (JobModel, UserApplyingJobModel, CompanyInvoiceModel, CompanySupportTicketModel, JobNameModel). Only 12 instances of minlength/maxlength/custom validators across 71 models. Email fields lack regex validation patterns. Phone numbers have no format validation. URLs lack validation. Passwords lack strength requirements. Status enums and critical fields depend entirely on application logic.
  - **Fix:** Implement comprehensive schema-level validators: email regex, URL validation, phone format checks, password strength rules, and custom cross-field validations. Add pre-validate hooks to core models (Company, Employee, User, UserApplyingJob) to enforce business rules at the schema level.
- [ ] 🟠 **HIGH** — High: No Cascade Delete or Orphaned Reference Protection _(verified ✓)_
  - `models/*.js (all models with refs)`
  - 71 models use ObjectId references with no cascade delete hooks, soft delete coordination, or orphan cleanup logic. Deleting a Company leaves orphaned records in CompanyMember, JobInvitation, Interview, AuditLog, and CompanyReview. Deleting a Job leaves orphaned UserApplyingJob, JobInvitation, Interview, and JobMatch records. No transactions or cleanup procedures exist.
  - **Fix:** Implement pre-remove/post-remove hooks on core entities (Company, Job, User, Employee) to cascade-delete or soft-delete related records. Use Mongoose middleware to atomically update reference counts. Consider implementing a soft-delete pattern (deleted_at flag) for auditable deletions instead of hard deletes.
- [ ] 🟠 **HIGH** — High: Excessive Denormalization Without Consistency Guarantees _(verified: medium)_
  - `/home/user/halajobe/models/JobModel.js (search_projection, search_index), EmployeeModel.js (matching_profile, search_filters), CompanyModel.js (company_projection, search_filters)`
  - JobModel denormalizes company info, search filters, ranking scores, and matching metadata into search_projection and search_index objects. EmployeeModel denormalizes matching_profile with normalized_skills, normalized_languages, seniority_score. CompanyModel denormalizes into company_projection. These mirror data from related entities but lack update coordination—when a Company name changes, search_projection remains stale. No triggers or consistent update patterns exist.
  - **Fix:** Implement synchronous update hooks: when a Company is updated, trigger Job.updateMany() to refresh search_projection.company fields. When Employee skills change, update matching_profile. Document all denormalized fields and create a consistency checker service. Consider using MongoDB change streams to maintain denormalization asynchronously.
- [ ] 🟠 **HIGH** — High: Mixed-Type Schema Fields Undermine Type Safety and Queryability _(verified ✓)_
  - `/home/user/halajobe/models/JobModel.js (lines 322, 326, 330, 333, 337, 322), CompanyModel.js (203-204), UserApplyingJobModel.js (56), NotificationModel.js (6, 22)`
  - Job references contain *_info fields (work_mode_info, job_type_info, job_salary_info, experience_level_info, education_level_info) defined as Schema.Types.Mixed with no schema constraints. Notification.body and Notification.data are Mixed types. UserApplyingJob.matching_details is Mixed. Mixed types prevent validation, indexing, and type-safe queries. They require application-level parsing and are prone to inconsistency.
  - **Fix:** Replace Mixed types with explicit schemas: create JobReferenceInfoSchema for *_info fields, NotificationPayloadSchema for body/data. Or use strict validation: validate structure in pre-save hooks and document required fields in comments. Index only the necessary subfields.
- [ ] 🟠 **HIGH** — High: Insufficient Validation on Critical Business Fields _(verified ✓)_
  - `/home/user/halajobe/models/UserModel.js (phone_e164, phone_national), EmployeeModel.js (expected_salary fields), JobModel.js (salary validation), CompanyModel.js (company_email)`
  - Phone fields (phone_e164, phone_national) are marked unique and required but have no format validation. Expected salary fields lack consistency checks (min_base should be <= max_base). Job salary requires manual validation in pre-validate hooks. Company emails lack regex validation. RefreshTokenModel.userRef uses a string ref instead of ObjectId. Interview.start_at lacks end_at > start_at cross-field validation.
  - **Fix:** Add validators: phone format (e.164, national), email regex, min <= max for range fields, date range validation (start < end), enum validation for critical fields. Create reusable validator functions and apply them across models.
- [ ] 🟡 **MEDIUM** — Medium: Array Field Indexing May Not Be Effective
  - `/home/user/halajobe/models/JobModel.js (lines 311, 346), EmployeeModel.js (multiple), CompanyModel.js (128)`
  - Array fields like cities, countries, candidate_target, skills, languages are indexed directly (e.g., { cities: 1, index: true }). MongoDB creates multikey indexes on arrays, but compound queries like { cities: X, status: Y } may not use the index efficiently if cities is an array. Search tokens and filter arrays are heavily indexed but may create index bloat.
  - **Fix:** Verify index effectiveness with explain() queries. For high-cardinality arrays (search tokens, normalized fields), consider extracting to separate collections or using wildcard indexes. Document which array fields are heavily queried vs. which are query-supporting denormalizations.
- [ ] 🟡 **MEDIUM** — Medium: Duplicate Indexes and Missing Composite Indexes
  - `/home/user/halajobe/models/JobModel.js (581-582, 603-605, 620-621), UserApplyingJobModel.js (146-152)`
  - JobModel has separate indexes on { ref: 1 } (line 581) and within schema definition (line 282). UserApplyingJobModel indexes user_id separately and in compound indexes. Several compound indexes could be optimized: { status: 1, createdAt: -1 } would benefit from { company_id: 1, status: 1, createdAt: -1 } queries. No analysis of index cardinality or selectivity.
  - **Fix:** Audit all indexes with db.collection.stats() and identify unused or redundant indexes. For common query patterns (e.g., company_id + status + sort by date), ensure compound indexes exist in the right field order. Remove single-field indexes subsumed by compound indexes.
- [ ] 🟡 **MEDIUM** — Medium: Weak Unique Constraint Patterns
  - `/home/user/halajobe/models/JobModel.js (282, 581-582), CompanyModel.js (270, 279, 288, 289), RefreshTokenModel.js (9-10, 20-21)`
  - Job.ref is marked { unique: true, sparse: true } both in field definition and in explicit index (lines 282, 581), creating redundancy. RefreshTokenModel.userRef is a string ref marked unique, which doesn't prevent duplicates for the same user if tokens differ. CompanyModel.slug is { unique: true, sparse: true } but also has { lowercase: true }, causing case-insensitive duplicates to be allowed in some MongoDB versions.
  - **Fix:** Remove redundant unique indexes. Use compound unique constraints where appropriate: { user_id: 1, device_id: 1 } for FcmToken. Test unique constraint behavior on sparse fields in production MongoDB version. Consider using partialFilterExpression for conditional uniqueness.
- [ ] 🟡 **MEDIUM** — Medium: Incomplete Application Status Workflow
  - `/home/user/halajobe/models/UserApplyingJobModel.js (4-24, 98-144)`
  - UserApplyingJob defines 19 status values but the pre-validate hook maps them to only 5 visible_status values. No state machine enforces valid transitions (e.g., rejected -> offer_declined is illogical). knockout_result and ats_score are calculated in pre-validate but not atomically. status_changed_at is defined but never automatically set in the hook.
  - **Fix:** Implement a proper status transition state machine with allowed transitions: new -> screening -> (shortlisted|rejected|not_match) -> (interview|offer|rejected) -> (hired|rejected). Atomically update status_changed_at in pre-validate. Consider separating ATS result tracking into a dedicated model to avoid cluttering application records.
- [ ] 🟡 **MEDIUM** — Medium: Inconsistent Soft Delete Patterns
  - `/home/user/halajobe/models/JobModel.js (402, 587), CompanyModel.js, EmployeeModel.js, UserApplyingJobModel.js (82, 136-137, 152)`
  - JobModel uses deleted_at with deleted_by, creating a soft-delete pattern. UserApplyingJob uses archived_at, rejected_at, withdrawn_at, hired_at independently. CompanyMember and AccountContext use status enum ['removed', 'active'] instead of timestamps. No consistent convention for filtering deleted records—each service must remember to include { deleted_at: null } in queries.
  - **Fix:** Standardize on either: (1) { deleted_at: null, deleted_by, deletion_reason } for all soft-delete models, or (2) { status: 'archived' } for status-tracking models. Add a global middleware that automatically filters deleted records in find/findOne queries if a deleted_at field exists. Document the pattern.
- [ ] 🟡 **MEDIUM** — Medium: Missing Indexes on Frequently Queried Fields
  - `/home/user/halajobe/models/EmployeeModel.js (expected_salary), UserApplyingJobModel.js (status_changed_at, last_activity_at), InterviewModel.js (start_at range queries)`
  - EmployeeModel.expected_salary.min_base and .max_base are indexed individually (435-436) but salary range queries { min_base: { $gte: X }, max_base: { $lte: Y } } would benefit from a compound index. UserApplyingJob lacks indexes on status_changed_at and last_activity_at for timeline queries. Interview.start_at is indexed but queries like { start_at: { $gte: now, $lt: now+7d }, status: 'scheduled' } lack a compound index.
  - **Fix:** Add compound indexes for common range queries: { 'expected_salary.min_base': 1, 'expected_salary.max_base': 1 }, { status: 1, status_changed_at: -1 }, { status: 1, start_at: 1 }. Measure query performance before and after index creation.
- [ ] 🟡 **MEDIUM** — Medium: Weak TTL Index Implementation for Time-Based Cleanup
  - `/home/user/halajobe/models/FcmTokenModel.js (20), UserModel.js (138-140), JobInvitationModel.js (14), Interview.js (no expiry cleanup)`
  - FcmTokenModel.last_seen_at and UserModel.passcode_expires_at exist but no TTL indexes are defined. JobInvitation.expires_at exists but no TTL cleanup is configured. Interview reschedule limits accumulate without cleanup. No automatic token rotation or stale record purging.
  - **Fix:** Add TTL indexes: { passcode_expires_at: 1 }, { ttl: 1 } with expireAfterSeconds for OTP tokens, { expires_at: 1 } for job invitations. Implement a scheduled job to clean up stale FCM tokens and expired interview records. Monitor TTL index effectiveness.
- [ ] 🟡 **MEDIUM** — Medium: NotificationModel Strict: False Allows Unvalidated Fields
  - `/home/user/halajobe/models/NotificationModel.js (30)`
  - NotificationSchema sets strict: false, allowing arbitrary fields to be stored without schema validation. This prevents type safety and makes migrations difficult. body and data fields are Schema.Types.Mixed without documented structure. Backward-compatibility comments suggest legacy fields coexist with new routing fields.
  - **Fix:** Change strict: true and explicitly define all notification payload schemas. Deprecate backward-compatible fields and provide a migration service. If truly open-ended payloads are needed, validate structure in pre-save hooks or move to a validated payload field.
- [ ] ⚪ **LOW** — Low: Inconsistent Timestamp and Auto-Tracking Patterns
  - `models/*.js (timestamps: true in most, timestamps: false in CountryModel.js)`
  - Most models use { timestamps: true } for automatic createdAt/updatedAt, but some fields like status_changed_at, reviewed_at, verified_at, last_usage_reset_at are manually maintained. CountryModel disables timestamps (timestamps: false). This creates inconsistency in audit trails and makes it hard to track when records were last modified.
  - **Fix:** Standardize timestamps: use createdAt/updatedAt for creation/modification times. For event timestamps (status_changed_at, reviewed_at), either use timestamps in a nested schema or add pre-save hooks to auto-populate them. Enable timestamps consistently across all models.
- [ ] ⚪ **LOW** — Low: Denormalized Count Fields Lack Update Coordination
  - `/home/user/halajobe/models/JobModel.js (388-392), CompanyModel.js (549-577), EmployeeModel.js (no counters), UserModel.js (no counters)`
  - JobModel stores user_show, user_review, user_applying, out_side_applying, user_saved, rating counts. CompanyModel stores jobs_count, active_jobs_count, employees_count, views_count, followers_count. These are denormalized and incremented in application code but no hooks ensure atomicity. A race condition could cause inconsistency.
  - **Fix:** Use MongoDB atomic operators ($inc) exclusively for counter updates. Add pre-save hooks to validate counter ranges (min: 0). Consider moving frequently-updated counters to a separate analytics collection if read/write ratio is very high. Add a periodic reconciliation job.
- [ ] ⚪ **LOW** — Low: AccountContext and Multi-Tenancy Model Lacks Explicit Validation
  - `/home/user/halajobe/models/AccountContextModel.js (9-12, 16-20)`
  - AccountContext.context_type enum includes 6 types and entity_model enum includes 6 models, but there's no schema-level validation that context_type matches entity_model (e.g., job_seeker should map to employees, company_admin to companies). Metadata is a free-form Mixed type. This could allow invalid context configurations.
  - **Fix:** Add a custom validator in pre-save hook to ensure context_type <-> entity_model mapping is valid. Define a schema for metadata based on context_type. Document the valid combinations explicitly.

**Keep (good — do not touch):**
- ✅ Comprehensive indexing strategy with extensive compound and single-field indexes across all major models, demonstrating awareness of query optimization patterns
- ✅ Well-structured denormalization for search functionality (search_index, search_projection, matching_profile) enabling fast filtering and full-text search capabilities
- ✅ Strong relationship modeling with consistent use of ObjectId references across related entities (users, employees, companies, jobs, applications)
- ✅ Good enum usage for critical status and state fields (job publish_status, application status, interview status) that guide workflow logic
- ✅ Thoughtful pre-validate hooks in key models (JobModel, UserApplyingJob) that enforce cross-field validation and state consistency
- ✅ Proper use of sparse and unique indexes for optional unique fields (job.ref, company.slug, fcm_token.device_id)
- ✅ Timestamps enabled on transactional models for audit trails and historical tracking

## Backend: Services & Integrations — 6/10

_Services layer shows mixed quality with critical gaps in error handling and production readiness. The AI safety contract is well-structured with comprehensive validation, but external API integrations lack retry logic and timeout handling. Email and PDF services have missing try-catch blocks. Database operations need improved error recovery. Bull queue integration is basic without proper configuration for production._

- [ ] 🟠 **HIGH** — Email Service Missing Try-Catch Error Handling _(verified ✓)_
  - `/home/user/halajobe/services/email/email.service.js:74-96`
  - sendJobzainEmail() and all wrapper functions (sendPasscodeEmail, sendImportantActionEmail) lack try-catch blocks. SMTP errors from nodemailer.sendMail() will propagate uncaught. The getTransporter() only logs a warning if SMTP_PASS is missing but doesn't throw, leading to silent failures. No retry logic for transient SMTP failures (connection timeouts, server busy).
  - **Fix:** Wrap sendMail() in try-catch with meaningful error messages. Implement exponential backoff retry (3 attempts with 1s, 2s, 4s delays). Validate SMTP credentials at startup. Add circuit breaker pattern for persistent SMTP failures.
- [ ] 🟠 **HIGH** — AI Provider Axios Request Lacks Retry and Circuit Breaker _(verified ✓)_
  - `/home/user/halajobe/services/ai/aiSafety.service.js:316-369`
  - runOpenAiCompatibleProvider() makes single axios.post() call to external AI API with 30s timeout. No retry on transient failures (429 rate limit, 503 service unavailable). No circuit breaker to fail fast when AI service is down. Network errors or timeout will propagate as 502/503 errors without retry strategy. Record already created in 'processing' state; if request fails, it only marks as 'failed' with no retry mechanism.
  - **Fix:** Use axios-retry or implement exponential backoff (base 1s, max 5 retries) for 429/503. Add circuit breaker to track consecutive failures; if >5 failures in 5min, block requests for 60s with 'ai_service_degraded' message. Distinguish retryable vs non-retryable errors.
- [ ] 🟡 **MEDIUM** — Currency Service Fetch Timeout Not Validated, All Providers Fail Silently
  - `/home/user/halajobe/services/currency.service.js:109-146`
  - Three external exchange rate providers (exchangerate.host, open.er-api.com, frankfurter.app) are tried sequentially with 8s timeout each. If all fail, single error message 'rates fetch failed' is thrown without categorizing which providers failed. No differentiation between network errors, timeouts, and bad payloads. Scheduled cron only logs to console.error, not to structured logger.
  - **Fix:** Track individual provider failures with timestamps and error types. Log to structured logger instead of console.error. Return fallback rates (cached from last successful refresh) on all failures. Implement jitter in retry delays to avoid thundering herd.
- [ ] 🟡 **MEDIUM** — PDF Generation Via Puppeteer Has Resource Leak Risk Under Rapid Concurrent Requests
  - `/home/user/halajobe/services/cv/cvPdf.service.js:11-40`
  - generatePdfFromHtml() launches Puppeteer with --no-sandbox and --disable-setuid-sandbox globally. Properly uses try-finally to close browser, but no maximum concurrent browser instances limit. Under load (100+ simultaneous PDF requests), will spawn 100+ Chromium processes exhausting system memory and file descriptors. No timeout on page.setContent() or page.pdf().
  - **Fix:** Implement concurrent request limiting (queue with max 5 concurrent) using p-limit or Bull queue. Add per-operation timeouts (30s max) with abort handling. Use browser pooling (reuse processes across requests). Monitor memory and CPU; gracefully degrade if resource constraints hit.
- [ ] 🟡 **MEDIUM** — Job Lifecycle Scheduled Tasks No Await on Database Errors
  - `/home/user/halajobe/jobs/jobLifecycle.jobs.js:104-220`
  - notifyCompanyDeadline(), notifySavedEmployeesDeadline(), and other functions call notifyUser() but don't check for notification failures in aggregate stats. The runLimited() function catches errors and increments failed counter but doesn't log them with context (job ID, user ID). If 1000 notifications are sent and 500 fail, the task completes successfully without alerting operators.
  - **Fix:** Log failed notifications with context (job_id, user_id, error reason). If failure rate > 10%, return error from handler to alert scheduler. Implement Dead Letter Queue (DLQ) for permanently failed notifications.
- [ ] 🟡 **MEDIUM** — Translation Service No Validation of Original/Translated Text Size or Type
  - `/home/user/halajobe/services/translations/contentTranslation.service.js:63-164`
  - upsertContentTranslation() accepts arbitrary originalText and translatedText without size limits. A user could submit 1MB of text per translation request. Stores raw objects/arrays in MongoDB without schema validation. JSON deep clone (JSON.parse(JSON.stringify(value))) will fail silently on circular references.
  - **Fix:** Add max size limits (e.g., 10KB per field). Validate text is string or array of strings. Pre-validate with Joi schema. Catch JSON serialization errors explicitly.
- [ ] 🟡 **MEDIUM** — Subscription Usage Tracking No Consistency Check
  - `/home/user/halajobe/services/subscriptions/companySubscription.service.js:289-302`
  - recordCompanyUsage() increments usage counters without transaction. If same company makes concurrent requests and hits limit, both might pass checkCompanyFeature() check before first increments counter. Race condition window between check and increment.
  - **Fix:** Use MongoDB transactions (wrapped in session) to atomically check limit and increment in single operation. Or use findOneAndUpdate with $inc and $lt condition to fail if limit exceeded.
- [ ] 🟡 **MEDIUM** — Bull Queue Basic Configuration, No Error Handling or Exponential Backoff
  - `/home/user/halajobe/jops/languageJop.js:1-25`
  - Bull queue has hardcoded Redis connection (127.0.0.1:6379), no process error handling, no retry settings, no exponential backoff. job.process() callback doesn't validate job.data structure. If Redis is unavailable, entire queue silently fails without alerting.
  - **Fix:** Use environment variables for Redis URL. Add defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }. Wrap process callback in try-catch. Add event handlers for 'failed', 'error', 'stalled' events logging to structured logger.
- [ ] 🟡 **MEDIUM** — Async Job Lock No Timeout on Worker Function Execution
  - `/home/user/halajobe/jobs/jobLock.js:44-71`
  - withScheduledJobLock() awaits worker() without timeout. If a job handler hangs (e.g., infinite loop, database deadlock), lock remains held for up to 10 minutes (TTL). Next instance will see lock as active and skip, potentially missing critical maintenance for an hour.
  - **Fix:** Wrap worker() in Promise.race with timeout (default 5 minutes). If timeout, log error, release lock, and throw. Make timeout configurable per job via options.
- [ ] ⚪ **LOW** — Matching Algorithm No Division by Zero Check on Salary Scoring
  - `/home/user/halajobe/services/matching/jobEmployeeMatching.js:51-56`
  - Salary score calculation checks employeeMinSalary > jobMaxSalary but assumes at least one salary field is finite. If both jobMinSalary and jobMaxSalary are null/undefined, salaryScore defaults to 100 (perfect match). Should explicitly handle missing salary data as incomplete match (50 score).
  - **Fix:** Add explicit check: if neither job salary is defined, set salaryScore = 50 with reasoning 'salary_not_disclosed'.
- [ ] ⚪ **LOW** — AI Cost Estimation and Token Counting No Overflow Protection
  - `/home/user/halajobe/services/ai/aiSafety.service.js:199-208`
  - estimateAiProviderCost() divides by 1,000,000 but doesn't check for NaN/Infinity results if input costs are misconfigured. If HALA_AI_INPUT_COST_PER_1M_TOKENS=Infinity, result is NaN. Number.isFinite() check catches this but logs no warning.
  - **Fix:** Validate cost environment variables at startup (must be numbers, 0-1000). Log warning if any cost is Infinity/NaN. Return 0 cost with warning flag in response.
- [ ] ⚪ **LOW** — AI Request Status Transitions Missing Validation
  - `/home/user/halajobe/services/ai/aiSafety.service.js:607-700`
  - Record status progresses: null -> 'processing' -> 'completed'/'failed', but no validation prevents race conditions. If two concurrent requests create two records with same input_hash, caching returns first completed record even if both requests are still processing (concurrent execution of same feature).
  - **Fix:** Add unique constraint on (user_id, feature, input_hash, createdAt) to prevent duplicate processing. Or return cached result only if record.status='completed' was set > 1 second ago.

**Keep (good — do not touch):**
- ✅ AI Safety Contract: Comprehensive contract verification with 11 features, input hashing, output normalization, and usage limits (daily/monthly) with scope-based overrides
- ✅ Request Recording: Full audit trail for AI requests including input_hash, input_summary, token estimates, cost estimates, and status tracking
- ✅ Trust Scoring: Deterministic job trust calculation with pattern matching for scams (payment requests, personal docs, external chat), salary flags, duplicate detection
- ✅ Subscription Management: Flexible subscription system with feature toggles and usage limits, snapshot-based model, company context synchronization
- ✅ HTML Escaping: Proper XSS protection in email template rendering with key-based conditional escaping
- ✅ Job Lifecycle: Comprehensive scheduled jobs for deadline reminders (7d, 3d, 24h), job auto-closure with notification concurrency limits
- ✅ Analytics Validation: Strong event type contract enforcement with group mapping and entity context capture
- ✅ Puppeteer PDF: Proper resource cleanup with try-finally for browser shutdown
- ✅ Rate Limiting: express-rate-limit integrated in app.js for request throttling

## Web Frontend (React/TS) — 6/10

_The web app demonstrates solid foundational React patterns with TypeScript strict mode enabled and good code organization across modules (api.ts, workflows.tsx, dashboard.tsx, screens). However, critical security issues exist around URL parameter encoding and missing token refresh/401 handling. Authentication relies on localStorage without interceptors for expired tokens. No automated tests, limited accessibility, and missing CSRF protection round out the concerns._

- [ ] 🟠 **HIGH** — URL Path Parameter Injection - 59 endpoints lack encodeURIComponent on dynamic IDs _(verified: medium)_
  - `/home/user/halajobe/web/src/shared/api.ts, lines 407-1122`
  - Out of 63 API calls with dynamic URL path parameters, only 4 use encodeURIComponent (career-passport, jobMatch, coverLetter, smartEmployees). The remaining 59+ calls directly interpolate IDs without encoding: /user/v1/job/get-by-id/${id}, /company/v1/global/jobs/${id}, /employee/v1/global/applications/${id}, /company/v1/global/members/${id}, etc. While typical IDs are alphanumeric, unencoded parameters could enable path traversal if IDs contain special chars (/, ?, #, etc.) and violate RFC 3986 standards.
  - **Fix:** Wrap all dynamic URL path parameters with encodeURIComponent: e.g., /user/v1/job/get-by-id/${encodeURIComponent(id)}. Create a helper function to apply this consistently across all API calls.
- [ ] 🟠 **HIGH** — No response error interceptor for expired tokens (401/403 responses) _(verified ✓)_
  - `/home/user/halajobe/web/src/shared/api.ts, lines 26-37`
  - Only request interceptor is implemented (injects token, language headers). No response interceptor handles 401/403 errors or expired tokens. When a token expires, the app does not attempt to refresh using the stored refresh token or clear localStorage and redirect to login. Users may encounter failed API calls without explanation or automatic re-authentication.
  - **Fix:** Add axios response interceptor: intercept 401/403 responses, attempt token refresh using refreshToken endpoint, retry request on success, or clear auth and redirect to login on failure. See api.interceptors.response.use pattern.
- [ ] 🟡 **MEDIUM** — Missing CSRF token in state-changing requests
  - `/home/user/halajobe/web/src/shared/api.ts, lines 150-1137`
  - POST, PATCH, DELETE requests do not include CSRF tokens. If the backend does not validate CSRF tokens (or relies on SameSite cookies), cross-site state-changing requests could succeed. Current reliance on Bearer token in Authorization header provides some protection but is not a substitute for CSRF tokens.
  - **Fix:** Verify with backend that CSRF protection is in place (SameSite=Strict cookies or CSRF token validation). If needed, add CSRF token to request headers: const csrf = document.querySelector('meta[name=csrf]')?.content or retrieve from backend /auth/csrf endpoint.
- [ ] 🟡 **MEDIUM** — No automatic token refresh, tokens stored in plaintext localStorage
  - `/home/user/halajobe/web/src/shared/api.ts, lines 3-195`
  - Access and refresh tokens are stored in localStorage (jz_seeker_access_token, jz_seeker_refresh_token, etc.) without expiration tracking or automatic refresh. Tokens persisted indefinitely until manual logout. If session expires server-side, client is unaware. Plaintext localStorage is vulnerable to XSS attacks (though current CSP/sanitization mitigates). No token rotation on app restart.
  - **Fix:** Implement token refresh flow: check token expiry before API calls, automatically refresh expired tokens using refresh endpoint, track token exp claim, clear tokens on 401 responses. Consider secure httpOnly cookies for token storage if backend supports (requires SameSite settings).
- [ ] 🟡 **MEDIUM** — No Content-Security-Policy header configured
  - `/home/user/halajobe/web/index.html`
  - HTML lacks CSP meta tag or server header. While dangerouslySetInnerHTML is only used on sanitized HTML, missing CSP allows inline scripts and resource loading from any origin. CSP would prevent XSS even if sanitization is bypassed.
  - **Fix:** Add CSP header to HTML or server: <meta http-equiv='Content-Security-Policy' content="default-src 'self'; script-src 'self'; img-src 'self' https:">. Coordinate with backend to set CSP headers on responses.
- [ ] 🟡 **MEDIUM** — No input validation on form fields before submission
  - `/home/user/halajobe/web/src/shared/workflows.tsx, /home/user/halajobe/web/src/company/screens.tsx`
  - Forms rely on HTML5 validation (required, type='email', type='password') only. No client-side regex or business logic validation before API submission (e.g., email format, password strength, field length limits). Server-side validation is implied but not confirmed in client code.
  - **Fix:** Implement client-side validation helpers for email (RFC 5322 subset), password requirements (min length, complexity), URL format validation on safeExternalUrl, job/company IDs. Add clear error messages per field.
- [ ] 🟡 **MEDIUM** — No automated tests or test framework configured
  - `/home/user/halajobe/web/`
  - No .test.tsx, .spec.ts files, no jest.config.js, vitest.config.ts, or test scripts in package.json. Zero test coverage for critical paths: auth flow, token management, API error handling, data normalization, sanitization functions, URL encoding.
  - **Fix:** Add vitest or jest: npm install --save-dev vitest @testing-library/react @testing-library/user-event. Create test files for api.ts (token extraction, normalization), workflows.tsx (auth forms), sanitizePreviewHtml function. Aim for >80% coverage on auth and API layers.
- [ ] ⚪ **LOW** — Accessibility: Limited ARIA labels and semantic HTML
  - `/home/user/halajobe/web/src/shared/chrome.tsx, /home/user/halajobe/web/src/shared/dashboard.tsx, /home/user/halajobe/web/src/shared/workflows.tsx`
  - Only one aria-hidden='true' on decorative brand mark. Navigation buttons lack aria-label, form inputs lack label associations (labels are non-interactive spans). Tables use divs instead of <table>, lists use divs instead of <ul>/<ol>. Screen reader users cannot easily navigate roles (home, jobs, campus, etc.) or understand button purposes.
  - **Fix:** Add aria-label to nav buttons and language toggle. Associate <label> elements with input via htmlFor. Use semantic HTML: <nav>, <main>, <section>, <article>, <table>, <ul>. Test with screen readers (NVDA, JAWS, VoiceOver) or axe DevTools.
- [ ] ⚪ **LOW** — Large unminified CSS (1892 lines) in single stylesheet without organization
  - `/home/user/halajobe/web/src/styles.css`
  - Single monolithic CSS file covers all 6 surfaces (home, jobs, campus, company, seeker, admin). No CSS modules, no BEM/utility classes, no CSS-in-JS. 31KB unminified; unknown if minified. Difficult to maintain, risk of naming conflicts, no tree-shaking of unused styles per role.
  - **Fix:** Migrate to CSS modules or Tailwind CSS. Split styles per component or surface. Run Vite build to confirm minification. Consider PurgeCSS to remove unused styles in production build.
- [ ] ⚪ **LOW** — Password field transmitted over HTTPS only (assumed, not enforced in code)
  - `/home/user/halajobe/web/src/shared/api.ts, line 22`
  - API baseURL is hardcoded as https://jobzain.com in production. VITE_API_URL env var allows dev/prod overrides. No explicit check prevents HTTP requests or requires HTTPS. If misconfigured to HTTP, passwords and tokens sent in plaintext.
  - **Fix:** Add environment-level check: if (!import.meta.env.VITE_API_URL.startsWith('https://')) throw new Error('API must use HTTPS'). Verify Vite build fails on insecure API URLs.
- [ ] ⚪ **LOW** — Career passport token from URL path without rate limiting
  - `/home/user/halajobe/web/src/App.tsx, lines 21-29`
  - careerPassportShareTokenFromPath() extracts token from /career-passport/:token URL without rate limiting or request throttling. If token is guessable or brute-forceable, attacker could enumerate passports. decodeURIComponent has try-catch but passes raw token to publicService.sharedCareerPassport().
  - **Fix:** Add client-side request throttling (debounce token fetch to once per 100ms). Backend should rate-limit /career-passport/share/:token endpoint (e.g., 10 requests per IP per minute). Tokens should be high-entropy and time-limited.
- [ ] ⚪ **LOW** — No error boundary or fallback UI for component crashes
  - `/home/user/halajobe/web/src/App.tsx`
  - App.tsx has no React.ErrorBoundary or try-catch wrapper. If seeker/company/campus screens throw, entire app crashes to blank screen. No fallback error message or reload button shown to users.
  - **Fix:** Wrap route components in ErrorBoundary. Implement useErrorHandler hook or error boundary HOC to catch and log errors, display friendly message, offer retry/home navigation.
- [ ] ⚪ **LOW** — Vite build output not analyzed for bundle size or security
  - `/home/user/halajobe/web/vite.config.ts`
  - Build process runs: tsc -b && vite build && node scripts/prerenderSeo.js. No bundle size reporting, no dead code analysis, no dependency vulnerability scanning (npm audit), no source map generation control for production.
  - **Fix:** Add vite-plugin-compression for gzip/brotli output. Run npm audit before deploy. Disable source maps in production or mark as internal-only. Use vite-plugin-visualizer to analyze bundle: npm install vite-plugin-visualizer && configure in vite.config.ts.

**Keep (good — do not touch):**
- ✅ TypeScript strict mode enabled with sound type safety (no allowJs, noEmit)
- ✅ Clean modular architecture: api.ts, workflows.tsx, dashboard.tsx, screens per role (seeker, company, campus, admin)
- ✅ HTML sanitization implemented for CV preview (sanitizePreviewHtml removes scripts, iframes, onXX handlers)
- ✅ Proper encodeURIComponent usage on career passport token URL (line 393)
- ✅ CORS credentials configured appropriately (withCredentials: true)
- ✅ Password inputs use type='password' and form security patterns
- ✅ File uploads restricted to PDF, DOC, DOCX via accept attribute
- ✅ Comprehensive normalized API service layer with defensive null/undefined handling
- ✅ No console.log or debugger statements in source
- ✅ No hardcoded secrets or credentials
- ✅ Vite configuration is minimal and secure

## Flutter Mobile App — 7/10

_The Flutter mobile app demonstrates solid security practices for authentication, token storage, and network communication. Session data is properly stored in Flutter secure storage (flutter_secure_storage) rather than SharedPreferences, and there's comprehensive input validation across auth flows. However, there are gaps in certificate pinning, missing token refresh mechanisms, weak Android backup/data extraction rules, and incomplete error handling that prevent a higher rating._

- [ ] 🟠 **HIGH** — No Certificate Pinning or Certificate Validation Override _(verified ✓)_
  - `/home/user/halajobe/mobile/lib/src/core/network/app_api_client.dart`
  - HttpClient instances are created without certificate pinning, custom badCertificateCallback, or any TLS/SSL validation configuration. This leaves the app vulnerable to MITM attacks on compromised networks or rogue CAs. The app uses default certificate validation which may not detect pinning violations.
  - **Fix:** Implement certificate pinning using a package like http/dio with custom certificate validation. Add badCertificateCallback to HttpClient with strict validation logic, or migrate to a networking library that supports pinning by default.
- [ ] 🟠 **HIGH** — Missing Token Refresh/Expiration Mechanism _(verified ✓)_
  - `/home/user/halajobe/mobile/lib/src/app.dart, /home/user/halajobe/mobile/lib/src/features/auth/auth_service.dart`
  - The app stores refresh tokens but never uses them to rotate access tokens. If an access token is compromised or expires, the app will fail authentication without automatic token refresh. The logout endpoint accepts a refresh token but there's no token expiration handler that proactively refreshes tokens.
  - **Fix:** Implement automatic token refresh: add a mechanism to detect 401 responses, attempt to refresh using the refresh token endpoint, and retry the failed request. Add token expiration time tracking if provided by the backend.
- [ ] 🟡 **MEDIUM** — Android Backup Restore Vulnerability
  - `/home/user/halajobe/mobile/android/app/src/main/AndroidManifest.xml, /home/user/halajobe/mobile/android/app/build.gradle.kts`
  - Android manifest has android:allowBackup='false' but the backup_rules.xml only excludes 'root' domain which may not cover all secure storage paths. Data extraction rules are similarly restrictive but may not fully protect flutter_secure_storage data depending on how the underlying KeyStore is implemented.
  - **Fix:** Verify that flutter_secure_storage uses Android's encrypted shared preferences or Keystore directly. Explicitly exclude all sensitive paths in backup_rules.xml. Test backup/restore on physical devices to confirm no auth tokens are backed up.
- [ ] 🟡 **MEDIUM** — No HTTP Strict Transport Security (HSTS) Configuration
  - `/home/user/halajobe/mobile/ios/Runner/Info.plist`
  - iOS Info.plist has NSAppTransportSecurity with NSAllowsLocalNetworking but no explicit HSTS configuration. The app allows HTTP in debug mode (halaAllowHttpBaseUrls default is !kReleaseMode) which could be accidentally left enabled in production builds.
  - **Fix:** Ensure release builds have halaAllowHttpBaseUrls=false. Add strict ATS policy to Info.plist. Consider adding HSTS support via response headers from the backend.
- [ ] 🟡 **MEDIUM** — Firebase Configuration Exposed via Environment Variables
  - `/home/user/halajobe/mobile/lib/src/features/notifications/firebase_notification_device_token_provider.dart`
  - Firebase credentials (API key, app ID, etc.) are passed via const String.fromEnvironment() which embeds them at compile time. If build parameters are logged or exposed, these sensitive values could be compromised. Firebase API keys are intentionally restricted but still sensitive.
  - **Fix:** Use Firebase GoogleService-Info.plist (iOS) and google-services.json (Android) files instead of environment variables. These are version-controlled safely and provide better security than compile-time constants.
- [ ] 🟡 **MEDIUM** — No Rate Limiting on Authentication Attempts
  - `/home/user/halajobe/mobile/lib/src/features/auth/auth_service.dart, /home/user/halajobe/mobile/lib/src/features/auth/campus_local_auth_service.dart`
  - The app makes no attempt to rate-limit login, password reset, or passcode verification requests. Campus local auth allows unlimited attempts without backoff.
  - **Fix:** Implement exponential backoff after repeated failed attempts (e.g., 3 failures = 5s cooldown, 10 failures = 60s). This should be coordinated with the backend API which should also enforce rate limits.
- [ ] 🟡 **MEDIUM** — Recovery Code Displayed in Plain Text
  - `/home/user/halajobe/mobile/lib/src/features/auth/campus_local_auth_service.dart, line 199`
  - Campus local forgot password displays the recovery code in the auth response message ('use recovery code $recoveryCode to continue'). This code is sensitive and could be logged or exposed in error reports.
  - **Fix:** Return recovery codes via UI only, never in exception messages or response bodies. Show code only once, with a copy button, and hide it after interaction.
- [ ] ⚪ **LOW** — Weak Error Messages in Authentication
  - `/home/user/halajobe/mobile/lib/src/features/auth/auth_service.dart, /home/user/halajobe/mobile/lib/src/features/auth/campus_local_auth_service.dart`
  - Auth exception messages distinguish between 'email not found' and 'password incorrect' scenarios (lines 33-41 of campus_local_auth_service), which leaks account enumeration information.
  - **Fix:** Use generic error messages like 'Invalid email or password' for both scenarios to prevent user enumeration attacks.
- [ ] ⚪ **LOW** — No Validation of Account Context Changes
  - `/home/user/halajobe/mobile/lib/src/app.dart, line 567`
  - When switching account contexts, the app trusts the server response blindly. If a compromised account context is returned, the app would accept it without verification.
  - **Fix:** Validate that the returned context ID matches the requested context ID before accepting the switch. Check permissions against the user's known role.
- [ ] ⚪ **LOW** — Missing Sensitive Operation Confirmation
  - `/home/user/halajobe/mobile/lib/src/app.dart`
  - Logout and account context switches occur without explicit user confirmation. In shared device scenarios, unintended logout could occur.
  - **Fix:** Add confirmation dialogs for logout and account context switching, especially for company and university admin roles which have higher impact.
- [ ] ⚪ **LOW** — Incomplete Notification Security Validation
  - `/home/user/halajobe/mobile/lib/src/features/notifications/notification_device_service.dart`
  - Notification device tokens are validated but the NotificationNavigationIntent parsing doesn't validate URLs in targetUrl. External URLs are validated (line 426) but only for http/https scheme, not domain whitelist.
  - **Fix:** Add domain whitelist validation for targetUrl in notifications. Prevent redirects to arbitrary domains.

**Keep (good — do not touch):**
- ✅ Tokens stored in secure storage via flutter_secure_storage, not SharedPreferences. Legacy shared-preferences sessions are automatically migrated to secure storage on app startup.
- ✅ Strong password validation enforced (regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,} across registration and reset flows.
- ✅ Comprehensive input validation for emails, phone numbers, passcodes (4-8 digits), graduation years, and user names with appropriate error messages.
- ✅ Session validation on restore: discards malformed sessions, missing emails, invalid base URLs, and deprecated guest sessions.
- ✅ Campus local auth uses PBKDF2-SHA256 with 60,000 iterations and random salt generation for password hashing on device.
- ✅ Proper external link validation restricts to http/https only; no arbitrary URI schemes supported.
- ✅ Android backup and data extraction completely disabled via backup_rules.xml and data_extraction_rules.xml.
- ✅ Comprehensive test coverage (27k+ lines of tests) including session migration, validation, and auth flows.
- ✅ Notification token handling includes registration/unregistration with fallback endpoints.
- ✅ Base URL validation enforces https in release mode via hasSupportedBaseUrlScheme().
- ✅ No credentials logged or printed; no use of debugPrint in source code.
- ✅ Account context switching properly validated and session updated server-side.
- ✅ Firebase messaging configured via environment variables, gracefully degrades if unconfigured.
- ✅ HTTP timeout configuration (12s connection, 15s response) prevents indefinite hangs.

## Testing, CI/CD & DevOps — 6/10

_The halajobe monorepo has a custom contract-based testing architecture in place of traditional unit/integration frameworks. While the Flutter mobile app includes 22 proper test files with 362+ test declarations, the backend relies entirely on 16 bespoke verify scripts that perform route mounts, API contracts, and security checks via in-memory MongoDB. CI/CD is present only for the Flutter mobile (GitHub Actions), but the backend, web frontend, and critical deployments lack automated testing in CI. Most checks are static/structural (syntax, imports, secrets, route declarations) rather than functional tests._

- [ ] 🟠 **HIGH** — No backend unit/integration tests; custom contract verification only _(verified ✓)_
  - `package.json (scripts section)`
  - The backend has no npm test suite using Jest, Mocha, or similar frameworks. Instead, 16 custom verify scripts (3120 LoC total) perform integration-level contract checks: verifySecurityHttpContracts.js (167 LoC, in-memory HTTP + MongoDB), verifyAuthContextIntegration.js (548 LoC, creates test users/roles/contexts), verifyMobileRouteMounts.js (460 LoC), verifyCampusMobileRoutes.js (526 LoC). These are valuable but are not true unit tests—they cannot run in parallel, require MongoDB/in-memory setup, and lack granular assertions or coverage reporting.
  - **Fix:** Adopt a standard test framework (Jest with mongodb-memory-server or Vitest). Keep contract tests but add unit tests for business logic, model methods, service functions, and middleware. Aim for >70% statement coverage on critical paths (auth, payments, AI safety, campus verification).
- [ ] 🟠 **HIGH** — Backend not included in CI/CD pipeline; only Flutter mobile has GitHub Actions _(verified ✓)_
  - `.github/workflows/flutter-mobile-ci.yml`
  - Only one workflow exists: flutter-mobile-ci.yml (279 lines), which tests Flutter on Linux (analyze, test, APK build) and Windows (PowerShell script validation, tester APK/ZIP generation). The backend is tested locally in CI only via npm run check:* (lines 44-51), but no separate backend workflow exists. Web frontend build is entirely manual (no Vercel deployment hooks configured for automated tests). The backend's test scripts run on push to flutter-seeker-campus branch only, not on every PR or merge.
  - **Fix:** Create .github/workflows/backend-tests.yml that runs on every PR to main/master: npm run check:syntax, check:imports, smoke:import, smoke:http, smoke:cors, test:security-http, test:integration:auth-context, and all test:* verify scripts. Create .github/workflows/web-build.yml to run web build and TypeScript compilation. Add branch protection rules requiring these workflows to pass before merge.
- [ ] 🟠 **HIGH** — Web frontend has no automated tests (no Jest, Vitest, or E2E framework) _(verified ✓)_
  - `/home/user/halajobe/web/package.json (lines 6-10)`
  - The web app has only 'dev', 'check:entry', 'build', and 'preview' scripts. No test script exists. There is a check:entry.js script (40 LoC, lines 10-40) that validates vite HTML root element and checks for old bundle markers, but no component tests, integration tests, or Lighthouse/Percy visual regression. The build includes TypeScript compilation (line 9: 'tsc -b') which catches type errors but not runtime or logic bugs.
  - **Fix:** Add Vitest for React component unit tests (especially admin/company/campus/seeker portals). Add Playwright or Cypress for critical user flows (company login → post job → review applicants; seeker login → search jobs → apply). Integrate into CI to run on every PR.
- [ ] 🟠 **HIGH** — Vercel backend deployment is manual; no automated testing gate before deploy _(verified ✓)_
  - `/home/user/halajobe/vercel.json, /home/user/halajobe/README.md (line 60)`
  - The README mentions backend 'production backend environment variables' but there is no Vercel integration for the Node backend (no vercel.json in root with /api serverless functions or a backend deployment target). The backend would need to be deployed manually to Heroku, Railway, or similar, or added as serverless functions to Vercel. No pre-deployment smoke test or integration test gate is documented.
  - **Fix:** Clarify and document backend deployment strategy: (a) deploy to separate VPS/Heroku, (b) convert backend to Vercel serverless functions, or (c) use a dedicated Node platform (Railway, Render). For chosen platform, add pre-deployment hooks: run npm run check:* and npm run test:* scripts, abort if they fail. Document in DEPLOYMENT.md with rollback procedures.
- [ ] 🟡 **MEDIUM** — Contract tests rely on direct source parsing, not functional assertions
  - `/home/user/halajobe/scripts/verifyMobileRouteMounts.js (lines 37-77)`
  - Many verify scripts (verifyMobileRouteMounts.js, verifyNotificationRouteMounts.js, verifyAnalyticsRouteMounts.js) use regex to parse route definitions from source code and check mount statements. Example (line 39): `const routePattern = /router\.(get|post|patch|delete|put)\(\s*["'\`]([^"'\`]+)["'\`]/g`. These confirm routes exist but do NOT test that they actually work, handle errors, or respond correctly. A route can be declared but broken.
  - **Fix:** Keep regex-based contract checks as smoke tests, but add functional tests: create a test user, call each route with valid/invalid payloads, assert status codes and response shapes. Use supertest or similar to test Express routes without a browser.
- [ ] 🟡 **MEDIUM** — Security HTTP contract test covers only auth/token/CV security, not all endpoints
  - `/home/user/halajobe/scripts/verifySecurityHttpContracts.js (lines 12-26)`
  - The security test checks 13 protected route families (e.g., '/dash/v1/dashboard', '/employee/v1/global/jobs', '/company/v1/global') for missing/malformed Authorization headers. However, the list is not exhaustive—it's manually curated. New endpoints (e.g., newly mounted at line 20 in app.js) won't be tested automatically unless added to the hardcoded list.
  - **Fix:** Dynamically generate the protected-routes list from Express app metadata (listEndpoints or express-list-endpoints), filtering by routes that require authUser/authCompany/authDash middleware. Assert all protected routes return 401 without auth.
- [ ] 🟡 **MEDIUM** — Smoke/contract tests are single-file scripts; cannot parallelize or filter by tag
  - `/home/user/halajobe/package.json (lines 18-31)`
  - Each test is invoked as a separate npm script: 'smoke:import', 'smoke:http', 'smoke:cors', 'test:security-http', 'test:ai-safety', 'test:global-launch-contract', etc. Running all requires chaining them manually or writing a wrapper script. There is no test runner config (no jest.config.js, vitest.config.ts, mocha.opts). Developers must remember which tests to run and in which order.
  - **Fix:** Consolidate into a single test runner (e.g., npm test that runs all .test.js scripts in series, or adopt Mocha with a test/ directory). Add --filter flags to run subsets (e.g., npm test -- --grep security). Document the test suite in a TESTING.md file with expected runtime and dependencies (MongoDB, Redis, etc.).
- [ ] 🟡 **MEDIUM** — No code coverage reporting; verify scripts lack coverage metrics
  - `scripts/ directory`
  - None of the 16 verify scripts use Istanbul, NYC, or similar coverage tools. Running 'npm run test:*' and 'npm run check:*' produces only pass/fail output, no metrics on % of code tested. Backend services (e.g., ai/aiSafety.service.js, services/careerPassport.service.js) are called by contract tests but their internal logic paths are not measured.
  - **Fix:** Add Istanbul/NYC for coverage on backend verify scripts. Set a coverage threshold (>60% statements for merge, >80% for production branches). Instrument contract test runners to emit coverage reports in CI. Display coverage badges in README.
- [ ] 🟡 **MEDIUM** — Environment configuration lacks staging/pre-prod testing stage
  - `/home/user/halajobe/.env.example, vercel.json`
  - The .env.example and README.md document production and local dev setups, but there is no staging environment config. The Vercel root/web configs (vercel.json, web/vercel.json) build for production only. There are no named deploy environments or staging URLs for QA testing before production release.
  - **Fix:** Add a staging environment: separate MongoDB cluster, Vercel staging project, staging .env.staging file. Configure Vercel environment variables for staging. Add npm run build:staging and npm run deploy:staging scripts. Test mobile tester APK against staging backend. Document in DEPLOYMENT.md.
- [ ] 🟡 **MEDIUM** — Flutter CI runs tests only on flutter-seeker-campus branch, not main or PR-based workflows
  - `.github/workflows/flutter-mobile-ci.yml (lines 3-10)`
  - Workflow triggers on push/PR to flutter-seeker-campus branch only. If a PR to main or another branch modifies mobile/, the CI will not run. This means breaking changes could land on main without mobile test feedback.
  - **Fix:** Change workflow trigger to run on: push to main/master/staging, pull_request to main/master/staging with paths: [mobile/**, .github/workflows/flutter-mobile-ci.yml]. Ensure every mobile change is tested before merge.
- [ ] 🟡 **MEDIUM** — Auth integration test uses in-memory MongoDB but does not test all role flows
  - `/home/user/halajobe/scripts/verifyAuthContextIntegration.js (548 LoC, lines 50-192)`
  - The script creates test users/roles (seeker, company, university, admin), seeds them into a MongoMemoryServer instance, and tests context switching. However, only lines 1-192 are shown; the full 548-line script likely tests login/token/context switching but may not cover all flows (campus student registration, company member invite, admin role promotion, etc.).
  - **Fix:** Extend the integration test or create separate tests for each role workflow: campus student email verification, company member RBAC, university admin dashboard, super admin operations. Assert that unauthorized roles cannot access restricted contexts.
- [ ] 🟡 **MEDIUM** — No automated security scanning (SAST, dependency audit) in CI
  - `.github/workflows/flutter-mobile-ci.yml`
  - The CI runs npm ci (which checks lock file integrity) and Flutter analyze (Dart linting), but does not run npm audit, Snyk, or SAST tools. The verifyNoSecrets.js script (108 LoC) scans for hardcoded Firebase private keys in repo files, but is not called in CI—it's a standalone npm run check:secrets command.
  - **Fix:** Add to CI: 'npm audit --audit-level=moderate' (fail on moderate or higher vulnerabilities), Snyk scan for dependencies, Semgrep or similar for code-level security checks (SQL injection, unsafe crypto, etc.). Integrate secret scanning into pre-commit or CI.
- [ ] 🟡 **MEDIUM** — No load/performance testing; app untested under concurrent load
  - `package.json (no load test script)`
  - Verify scripts and CI checks are functional/contract-based only. There is no artillery, k6, or JMeter config to test backend under concurrent user load, measure API latency, or identify N+1 queries or memory leaks. The scheduled job scripts (e.g., scheduled:close-expired-jobs) are not tested for performance with large datasets.
  - **Fix:** Add load testing: create k6 or Artillery scenarios for critical paths (job search, application submission, company dashboard). Test with 100/1000/10000 concurrent users. Add baseline latency thresholds. Run nightly or in staging before production deployment.
- [ ] ⚪ **LOW** — Mobile has 22 Dart test files; only 2 are widget tests, rest are unit/service tests
  - `mobile/test/ (22 .dart files)`
  - Flutter tests exist: auth_service_test.dart (validates login email/campus domain rules), app_api_client_test.dart, analytics_service_test.dart, campus_local_auth_service_test.dart, dashboard_state_store_test.dart, etc. These test individual services, not full UI flows. widget_test.dart (60+ LoC) mocks secure storage and method channels, sets up app state, but does not verify all dashboard flows end-to-end. No integration test framework like integration_test/
  - **Fix:** Add integration_test/ with golden tests or e2e scenarios (login → seeker dashboard → apply job; login → company dashboard → post job). Test across all four roles (seeker, student, company member, university admin). Use Patrol or similar for cross-app flows.
- [ ] ⚪ **LOW** — AI safety contract test uses hardcoded feature list; misses new AI features
  - `/home/user/halajobe/scripts/verifyAiSafetyContract.js (lines 15-27)`
  - Test defines AI_FEATURES as 11 hardcoded features (career_copilot, profile_score, cv_rewrite, etc.) and asserts they match Object.keys(AI_FEATURES) in aiSafety.service.js. If a new feature is added to the service, this test will fail until the script is updated manually. There is no dynamic feature discovery.
  - **Fix:** Export the feature list from aiSafety.service.js and import it into the verify script, or read it from a shared JSON config. This ensures the verify test and service stay in sync without manual edits.
- [ ] ⚪ **LOW** — Web portal smoke test (smokeWebPortals.js) is manual/optional, not in npm scripts
  - `/home/user/halajobe/scripts/smokeWebPortals.js (line 4, 156 LoC)`
  - The script uses Puppeteer to navigate all web portals (home, campus, company, seeker, admin) and click actions, logging errors. However, it is NOT in package.json scripts. It must be invoked manually: 'node scripts/smokeWebPortals.js'. It is not part of the standard test suite and developers may skip it.
  - **Fix:** Add 'smoke:web-portals' script to package.json. Require it in CI after the web build step. Document setup (Chrome executable path, VITE_API_URL env var, backend running). Create a Lighthouse audit script as well for performance testing.
- [ ] ⚪ **LOW** — Notification event contract test is incomplete; endpoint contract exists but event flow test is paired script
  - `/home/user/halajobe/scripts/verifyNotificationRouteMounts.js (69 LoC) + verifyNotificationEventContract.js`
  - Package.json line 27 shows 'test:notification-routes': 'verifyNotificationRouteMounts.js && verifyNotificationEventContract.js'. The first checks route mounts; the second (not shown) presumably tests event emission and FCM token handling. Running them serially could mask failures.
  - **Fix:** Show contents of verifyNotificationEventContract.js to verify it tests event emission (e.g., when a notification is created, does the listener fire an FCM send?). Ensure both scripts exit with error codes on failure. Consider merging into a single test if they share setup.
- [ ] ⚪ **LOW** — Mobile docs reference testing-readiness gate but tests are not gated in CI
  - `/home/user/halajobe/mobile/docs/halajob-a-to-z-testing-readiness-handout.md (lines 34-48)`
  - The handout specifies testing-ready criteria (no secrets, syntax/import/smoke checks pass, Flutter tests pass, all roles testable, etc.) but the CI only runs a subset: syntax check (backend), relative imports, mobile route contracts, analyze, and test. It does NOT test seeker/campus/company/university flows end-to-end or verify AI/push/localization work.
  - **Fix:** Expand CI to cover all testing-readiness gates or create a separate 'gated' workflow that runs on release branches. Document which checks are mandatory (sync checks, auth context) vs. nice-to-have (full e2e).

**Keep (good — do not touch):**
- ✅ Flutter mobile app has 22 proper test files with 362+ test declarations using Dart's built-in test/flutter_test framework, covering auth validation, service logic, and state management.
- ✅ Custom contract-based verify scripts (16 scripts, 3120 LoC) provide valuable integration-level testing: security HTTP contracts, auth context with real MongoDB data modeling, route mount validation, and AI safety checks.
- ✅ Backend has multiple smoke checks (syntax, imports, app startup, CORS) that catch configuration and basic import errors early.
- ✅ GitHub Actions CI is configured for Flutter mobile with multi-platform testing (Linux, Windows) and comprehensive APK/release artifact generation with metadata reporting.
- ✅ Secret scanning (verifyNoSecrets.js) prevents accidental commits of Firebase keys and other credentials with allowlisted example files.
- ✅ Web build is type-checked via TypeScript compilation (tsc -b) before Vite bundling, catching type errors.
- ✅ Comprehensive environment variable documentation in .env.example covering auth, email, AI, scheduled jobs, and CORS config.
- ✅ Root README documents deployment procedures for backend (env vars, MongoDB setup) and web frontend (Vercel root/subdirectory config).

## Documentation & Repo Hygiene — 6/10

_The halajobe employment platform has solid foundational documentation for local setup (local-auth-qa.md) and launch readiness (docs/audits/), clear READMEs for all three subsystems (backend, web, mobile), and strong security practices with no committed secrets. However, the repository has several hygiene issues: duplicate lock files (package-lock.json and yarn.lock both committed), uploaded user files committed to git (2.4MB in uploads/), inconsistent naming conventions, missing comprehensive root-level development guide, and incomplete .env.example for the AI/notification features._

- [ ] 🟠 **HIGH** — Duplicate Lock Files Committed _(verified ✓)_
  - `/home/user/halajobe, /home/user/halajobe/web`
  - Both package-lock.json and yarn.lock are committed to the repository (root: 408KB + 244KB, web: 44KB). This violates npm best practices and creates ambiguity about dependency resolution strategy. Lock files should be singular per package manager choice.
  - **Fix:** Choose npm or yarn consistently. Remove one lock file from all locations (either package-lock.json OR yarn.lock, not both). Document the dependency manager choice in README.md. Update .gitignore to exclude the unused lock file.
- [ ] 🟠 **HIGH** — User-Generated Uploads Committed to Git _(verified ✓)_
  - `/home/user/halajobe/uploads/`
  - 2.4MB of user-generated files are committed and tracked by git, including images (1757863178104-images.jpg, captured20260429133831559.jpg), screenshots (1757932073209-screenshot-0725-113440.png, 1.0MB), CSV data (ip2location-country-region.CSV x4), font files (1760000728980-cairo-variablefont_slnt_wght.ttf), HTML files, and PDFs. These should never be version controlled as they bloat the repo and expose user data.
  - **Fix:** Run `git rm --cached uploads/` to untrack all files in uploads/. Confirm uploads/ is in .gitignore (already present). Add a server-side upload handler that stores files outside the git repo. Document upload directory location in deployment guides.
- [ ] 🟡 **MEDIUM** — Incomplete .env.example Files
  - `/home/user/halajobe/.env.example`
  - The root .env.example has placeholders for AI features (HALA_AI_ENABLED, HALA_AI_PROVIDER, HALA_AI_MODEL, HALA_AI_API_KEY, etc.) and Firebase notifications (the service-account JSON ignore rule in .gitignore) but lacks clear documentation on optional vs required variables. Some AI token cost values are set to 0, making it unclear if these are defaults or placeholders. Firebase service account setup is not documented.
  - **Fix:** Expand .env.example with comments marking each variable as REQUIRED, OPTIONAL, or FEATURE-GATED. Document the AI provider choice (OpenAI vs others) and link to setup instructions in docs/. Add a Firebase section explaining how to obtain serviceAccount.json. Create docs/environment-setup.md with full variable reference.
- [ ] 🟡 **MEDIUM** — No Root-Level CLAUDE.md Documentation
  - `Root directory`
  - There is no CLAUDE.md file at the repository root to serve as a codebase orientation guide for new developers or Claude Code sessions. While individual subsystem READMEs exist (root/web/mobile), a unified entry point explaining the monorepo structure, architecture decisions, and development workflows is missing.
  - **Fix:** Create /CLAUDE.md documenting: (1) monorepo structure (backend/web/mobile separation), (2) dependency graph (web depends on backend, mobile uses same backend), (3) key entry points (index.js for backend, web/src/app.tsx for frontend, mobile/lib/src/app.dart for mobile), (4) running all three locally, (5) critical docs to read first (local-auth-qa.md, docs/launch-hardening-status.md).
- [ ] 🟡 **MEDIUM** — No Contributing or Development Workflow Guide
  - `Root directory`
  - There is no CONTRIBUTING.md or development workflow guide explaining how to submit PRs, run tests, or set up a development environment for multiple subsystems. The backend has check scripts (check:syntax, check:imports, test:mobile-routes, etc.) but no guide linking them together.
  - **Fix:** Create /CONTRIBUTING.md documenting: (1) fork/clone/branch workflow, (2) running backend tests (`npm run check:syntax`, `npm run test:security-http`), (3) running frontend tests (link to web/README), (4) running mobile checks (`flutter analyze`, `flutter test`), (5) pre-commit checks to run before opening PRs, (6) how to add new routes/features across the stack.
- [ ] ⚪ **LOW** — Empty File: nigix.txt
  - `/home/user/halajobe/nigix.txt`
  - An empty file exists at the repository root with no apparent purpose. The filename suggests it may have been intended for nginx configuration but is not used.
  - **Fix:** Delete nigix.txt or clarify its purpose. If it was meant for nginx configuration, move it to docs/nginx-config.md or a deployments/ folder with proper documentation.
- [ ] ⚪ **LOW** — Inconsistent Directory Naming: 'jops' Typo
  - `/home/user/halajobe/jops/languageJop.js`
  - A directory named 'jops' exists with a file 'languageJop.js' containing a Bull queue implementation. The plural 'jops' appears to be a typo for 'jobs'. The directory is not referenced in app.js and is separate from /home/user/halajobe/jobs/ which handles the scheduler. This creates confusion about which directory handles background work.
  - **Fix:** Clarify the purpose of /jops. If it's dead code, delete it. If it's active, rename to /queues or /background-jobs and document in app.js. Update related imports if needed. Ensure only one directory handles background job/queue logic.
- [ ] ⚪ **LOW** — Frontend Documentation Could Specify Build & Deployment More Clearly
  - `/home/user/halajobe/web/README.md`
  - Web README mentions Vercel deployment but does not clearly state why Vite is required in web/ and not at root level, and gives multiple examples of Vercel configuration without a clear primary recommendation. The note about 'vite build' failing at root is helpful but comes late in the docs.
  - **Fix:** Reorganize web/README.md: lead with 'Do NOT run `vite build` from root' and explain the web/ subfolder structure upfront. Add a 'Local Development Quick Start' section before environment details.
- [ ] ⚪ **LOW** — Mobile README is Comprehensive but Complex for New Developers
  - `/home/user/halajobe/mobile/README.md`
  - The mobile/README.md is thorough (494 lines) with extensive PowerShell build instructions, but jumps straight into Windows-specific signing, SDK setup, and release workflows. New developers on macOS or Linux may feel overwhelmed. The 'Run locally' section (lines 45-72) is brief and appears after introductory scope details.
  - **Fix:** Reorganize mobile/README.md with a 'Quick Start' section first (3-5 steps for Linux/macOS/Windows), then 'Advanced: Release Builds' and 'Windows PowerShell Release Workflow' sections. Keep PowerShell scripts but present them separately. Add a table of contents.
- [ ] ⚪ **LOW** — Commits Include Generated/Cached Files Not in .gitignore
  - `Various, especially mobile/`
  - While .gitignore is comprehensive, some generated or cache-like files may be tracked. The uploaded files issue (separate finding) is the primary concern, but build artifacts and platform-specific generated files should be reviewed.
  - **Fix:** Run `git status` after a clean `flutter pub get && flutter analyze && npm ci` to identify any generated files being tracked. Update .gitignore as needed for platform-specific caches (Gradle, Cocoapods, build intermediates).
- [ ] ⚪ **LOW** — Audit Documentation in docs/audits/ is Comprehensive but Not Linked
  - `/home/user/halajobe/docs/audits/`
  - Four detailed audit files exist (UI_CARD_AND_NAVIGATION_AUDIT.md, backend-api-wiring-audit-2026-06-26.md, language-i18n-audit-2026-06-26.md, launch-hardening-progress-2026-06-26.md) providing launch readiness assessment and technical status. However, README.md does not reference these, and they are not easy to discover.
  - **Fix:** Update README.md and create docs/INDEX.md linking to all documentation with brief descriptions. Add a 'Launch Status' section to README.md with a table referencing the audits/ folder. Update mobile/README.md to reference mobile-specific launch docs.
- [ ] ⚪ **LOW** — Secret Scanning Script Exists but Not Documented
  - `/home/user/halajobe/scripts/verifyNoSecrets.js`
  - A secret scanning script exists and is well-implemented (checking for PRIVATE KEY, firebase patterns, service accounts) but is not mentioned in README.md or documented as part of the pre-commit/CI workflow.
  - **Fix:** Document the secret scanner in CONTRIBUTING.md and add it to the pre-commit checks list. Run it in CI before allowing pushes. Add a note in .env.example: 'Run `npm run check:secrets` before committing to verify no real credentials are included.'

**Keep (good — do not touch):**
- ✅ Security practices are solid: no real credentials committed, comprehensive .gitignore with exemptions for *.example files, active secret scanning script, Firebase keys properly protected
- ✅ Local development is well-documented with step-by-step instructions (docs/local-auth-qa.md) including test account credentials and clear MongoDB/MongoDB Atlas setup
- ✅ All three subsystems (backend, web, mobile) have dedicated READMEs with appropriate detail for their technology stacks and deployment targets
- ✅ Mobile documentation is thorough with Windows PowerShell release workflows, Android signing, Play Store submission, and GitHub Actions CI/CD fully documented
- ✅ Backend verification suite is mature with syntax checks, import validation, mobile route contract tests, security HTTP tests, and integration auth-context tests
- ✅ Audit documentation (docs/audits/) provides detailed technical assessment of launch readiness across UI/UX, backend APIs, i18n, and security
- ✅ Vercel deployment configuration is clear with root vercel.json and web-specific instructions avoiding common pitfalls
- ✅ GitHub Actions CI is comprehensive, running Flutter analysis, tests, linting, and mobile build validation on every push to flutter-seeker-campus branch
- ✅ Environment variable management uses .env.example pattern consistently across all subsystems with production vs development guidance