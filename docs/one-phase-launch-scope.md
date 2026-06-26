# HalaJob One-Phase Launch Scope

Source handouts:

- `C:\Users\Admin\Downloads\hala_job_codex_one_phase_ai_campus_global_handout.docx`
- `C:\Users\Admin\Downloads\HALAJOB_CODEX_IMPLEMENTATION.md`
- Deferred onboarding handout, do not implement until requested:
  `C:\Users\Admin\Downloads\Hala Job Onboarding Handout (download).html`

This file tracks the launch architecture requested in the handout so the scope
is visible in the repo and can be implemented/tested in order.

## Implementation Order

1. Account switcher, active context, role guards, and permission contract.
2. Career Passport and Employability Score foundation.
3. AI modules through backend-only AI endpoints with safety, caching, limits,
   audit logging, and editable human-approved outputs.
4. Campus verification and university dashboard.
5. Global country/currency/translation/work-mode support.
6. Trust and anti-scam review layer.
7. Application status history, push notifications, analytics, and release
   signing/package strategy.

## Deferred Design Handouts

The onboarding handout is intentionally logged for later and is not part of the
current implementation pass. When onboarding is explicitly requested, use
`C:\Users\Admin\Downloads\Hala Job Onboarding Handout (download).html` as the
visual/content reference, then implement it against the existing Flutter app
architecture with real navigation, loading/error states, and localization.
Until then, do not copy this handout into the app, do not create onboarding
screens from it, and do not let it change the current release behavior.

## Current Evidence From The Handout

| Area | Current status | Required next move |
| --- | --- | --- |
| Account switcher | Backend account-context model/API and mobile switcher are now implemented. | Finish production data QA, ensure every protected backend surface respects active context, and add database migration/seed notes before launch. |
| AI career copilot / scoring | Backend-only `/ai/v1` safety foundation is now mounted for the approved endpoint contract. Requests are authenticated, account-guarded, hashed, logged to `ai_requests`, checked against `ai_usage_limits`, and blocked with clear fallback responses until provider AI is explicitly enabled and implemented. | Add real provider adapter, prompt/output schemas, admin enable controls, and Flutter suggestion-review UI only after live safety QA. |
| Career Passport | Backend passport API, rule-based score snapshot foundation, and mobile seeker/campus Passport sheet are now implemented. | Add edit flows, employer/university views, AI-backed scoring, and share-link QA. |
| Campus verification | Backend model/API foundation and Flutter campus verification sheet now support university list, status, email code verification, document upload, resubmit, and university admin approve/reject/request-info. | Complete live email/device QA against production credentials and approve/reject flows. |
| University dashboard | University admin backend routes now honor active context for overview, students, verification queue/actions, partners, opportunity requests, employability analytics, and outcomes reports under `/university/v1`; Flutter now opens a university admin dashboard from the active `university_admin` context with metrics, verification actions, readiness, students, partners, and account switching. | Add deeper sub-screens, richer report exports, live university admin device QA, and release analytics. |
| Global country/currency | Country/city helpers plus `/user/v1/global/*` mobile routes are now mounted. Launch salary currencies are constrained to USD/EUR/GBP in company jobs, seeker profile salary, job search filters, mobile job posting, and the backend launch-contract verifier. Work modes are constrained to onsite/remote/hybrid with city required for onsite/hybrid job posts. | Finish production data migration/QA, confirm all old records map to the launch contract, and add richer global admin controls. |
| Translation | Backend translation approval storage is now implemented with `/jobs/v1/:jobId/translations/:lang` and `/user/v1/cv/translations/:lang`, preserving original text, translated text, language direction, AI request id, status, approver, and approval time. AI generation endpoints remain safety-gated until a provider is enabled. | Add live provider adapter, admin review UI, mobile edit/approve screens, and production QA for Arabic/English outputs. |
| Trust/anti-scam | Backend trust score, seeker report/score routes, admin review queue/actions, job trust fields, and route verifier are now implemented. | Add live moderation QA, surface trust warnings in more mobile screens, and finish company-level trust review. |
| Push notifications | Versioned `/notifications/v1` list/read/device-token routes now wrap the existing notification and FCM-token foundation. Launch notification event catalog now covers application status, interviews, employer applicant receipt, company profile views, matching jobs, campus verification, campus events, CV export, and async AI results. Campus verification approve/reject/request-info, campus event registration, and scheduled campus event reminders now create student notifications. Real Android push delivery still needs release credentials/device QA. | Finish FCM permission prompts, production Firebase credential QA, and live end-to-end notification delivery checks. |
| Analytics | Backend `/analytics/v1/events` foundation now records the approved activation, AI, jobs, company, campus, and global events against the signed-in user/context. | Wire more product actions to emit events automatically and add admin/cohort reporting screens. |
| Release signing | Tester APK is local/debug signed. | Decide package strategy, production signing, and versionCode path before public distribution. |

## Account Context Contract

Required context types:

- `job_seeker`
- `student`
- `company_member`
- `company_admin`
- `university_admin`
- `super_admin`

Required backend fields:

- `users.default_context_id`
- `account_contexts.user_id`
- `account_contexts.context_type`
- `account_contexts.entity_id`
- `account_contexts.display_name`
- `account_contexts.avatar_url`
- `account_contexts.status`
- `account_contexts.permissions`
- `account_contexts.is_default`
- `account_contexts.last_used_at`

Required endpoints:

- `GET /user/v1/me/contexts`
- `POST /user/v1/me/active-context`
- `GET /user/v1/me/permissions`

Acceptance checks:

- A user can own more than one context without logging out.
- Selecting a context rejects contexts not owned by the signed-in user.
- The response includes active context and permissions.
- Wrong-role deep links can be blocked by guards using active context.
- Context switch is auditable.

Related invite/accept APIs from the handout:

- `POST /company/v1/members/invite`
- `POST /company/v1/members/accept`
- `POST /campus/v1/admins/invite`
- `POST /campus/v1/admins/accept`

The active-context contract is the foundation for all remaining work. Every
protected screen/API must either use the active context directly or reject the
request with a clear permission error.

## AI Safety Rules

- Flutter must never call the AI provider directly.
- AI never submits an application automatically.
- AI never rejects or hides a candidate automatically.
- AI-generated CVs, cover letters, jobs, messages, translations, and rankings
  must be editable and human-approved before save/send/publish.
- AI output must be visibly labelled as an AI suggestion.
- Backend must enforce usage limits, caching, feature toggles, and audit logs.

Required backend foundation:

| Component | Required behavior |
| --- | --- |
| `ai_requests` | Store feature, input hash, output JSON, provider/model, token/cost estimate, status, error, user, active context, and timestamp. |
| `ai_usage_limits` | Enforce daily/monthly limits by user/context and reset window. |
| AI cache | Hash profile/CV/job input and reuse unchanged results unless regeneration is requested. |
| Safety controls | AI output is suggestion-only and must be approved before save/send/publish/status change. |
| Admin controls | Super admin can enable/disable AI modules, inspect usage/errors, and set limits. |

Required AI modules and endpoint contract:

| Module | API | Output contract |
| --- | --- | --- |
| Career Copilot | `POST /ai/v1/career/copilot` | `next_best_actions`, readiness summary, suggested jobs/learning, warnings. |
| CV/Profile Score | `POST /ai/v1/profile/score` | Score 0-100, strengths, missing fields, weak sections, recommended edits. |
| CV Builder/Rewriter | `POST /ai/v1/cv/rewrite` | CV sections, ATS warnings, language/tone, before/after changes. |
| Job Match Explanation | `POST /ai/v1/jobs/{jobId}/match` | Match percent, matched/missing skills, apply-now/improve-first decision, reason. |
| Cover Letter | `POST /ai/v1/jobs/{jobId}/cover-letter` | Editable cover letter, editable sections, risk flags. |
| Interview Coach | `POST /ai/v1/interview/practice` | Questions, answer feedback, score, improvement tips. |
| Employer Job Assistant | `POST /ai/v1/company/jobs/generate` | Draft title, summary, responsibilities, requirements, salary guidance, trust warnings. |
| Candidate Shortlist | `POST /ai/v1/company/jobs/{jobId}/shortlist` | Rankings, explanation, missing data, bias warnings. |
| Hiring Messages | `POST /ai/v1/company/messages/generate` | Editable message text, tone, placeholders, human-review flag. |

AI launch acceptance checks:

- AI never submits an application automatically.
- AI never rejects or hides a candidate automatically.
- Generated CV, cover letter, job description, translation, and message outputs
  are editable before saving/publishing/sending.
- AI labels are visible in Flutter.
- Usage limits and friendly fallback states are enforced by backend.
- Candidate ranking explanations avoid protected or irrelevant attributes.

Current implementation note:

- `/ai/v1/career/copilot`, `/ai/v1/profile/score`, `/ai/v1/cv/rewrite`,
  `/ai/v1/jobs/:jobId/match`, `/ai/v1/jobs/:jobId/cover-letter`,
  `/ai/v1/interview/practice`, `/ai/v1/company/jobs/generate`,
  `/ai/v1/company/jobs/:jobId/shortlist`,
  `/ai/v1/company/messages/generate`, `/ai/v1/translate/job/:jobId`, and
  `/ai/v1/translate/cv` are mounted behind auth and account-context guards.
- `ai_requests` stores feature, input hash, output JSON placeholder,
  provider/model, status, error, user/context, usage estimates, and safety
  flags.
- `ai_usage_limits` can enable/disable a feature and set daily/monthly limits
  globally or by user/context/company/university scope.
- Provider generation remains intentionally disabled/not implemented; endpoints
  return a clear blocked fallback instead of fake AI output.

## Career Passport And Employability Score

Career Passport must be private by default and available to job seekers,
students, companies with permission, and universities for verified students.

Required sections:

| Section | Fields/features |
| --- | --- |
| Identity | Name, headline, country/location, preferred work mode, languages, photo, verified badges. |
| Education | University, major, graduation year, verification status, certificates. |
| Experience/projects | Work history, internships, campus projects, portfolio links, achievements. |
| Skills | Hard skills, soft skills, language levels, AI-inferred missing skills, verified skills later. |
| CV assets | Uploaded CV, generated CV versions, Arabic/English versions, ATS score. |
| Readiness | Employability score, job readiness, interview readiness, profile completeness. |
| Privacy/share | Private by default, optional public/employer share link, optional QR code. |

Score formula requested in the handout:

| Score component | Weight |
| --- | --- |
| Profile completeness | 15% |
| CV quality | 20% |
| Skills match | 20% |
| Job readiness | 15% |
| Interview readiness | 10% |
| Education verification | 10% |
| Application activity | 5% |
| Trust/activity | 5% |

Required APIs/screens:

- `GET /user/v1/career-passport`
- `PUT /user/v1/career-passport`
- `POST /ai/v1/career-passport/score`
- `POST /user/v1/career-passport/share`
- `CareerPassportScreen`
- `PassportImproveScreen`
- `EmployerPassportView`
- `UniversityStudentPassportView`

Current implementation note:

- `GET /user/v1/career-passport`, `PUT /user/v1/career-passport`,
  `POST /user/v1/career-passport/share`, and
  `POST /ai/v1/career-passport/score` are mounted.
- Score refresh is backend-owned but currently `rule_based_v1`, not provider AI.
  This avoids fake AI while preserving the endpoint contract for the later AI
  provider layer.
- The passport is derived from real employee/user profile data and stores
  privacy/share/score snapshots in `career_passports`.
- Mobile now exposes Career Passport from the seeker/campus dashboard More
  actions, loads the backend passport, refreshes the score through the backend
  AI route contract, and toggles share/revoke from the app.
- Dedicated edit flows, employer-safe view, university-safe view, and AI
  usage/cost controls remain open work.

Acceptance checks:

- Career Passport is private by default.
- Student verification badge appears only after approved verification.
- Score explains why it changed and cannot be manually edited by the user.
- Employers see only permitted candidate data.
- Universities see aggregate readiness plus student records only for their
  verified students.

## Campus Verification And University Dashboard

Verification methods:

| Method | Required behavior |
| --- | --- |
| University email domain | Admin sets allowed domains; student confirms email code; valid code can auto-approve. |
| Student ID upload | Student uploads document; university admin or super admin approves/rejects. |
| Invite code / QR | University creates campaign code/QR; student enters/scans it; optional review. |
| Manual admin approval | University admin reviews pending evidence and approves/rejects with reason. |

Required verification APIs:

- `GET /campus/v1/universities`
- `GET /campus/v1/universities/:id/campuses`
- `POST /campus/v1/verification/start`
- `POST /campus/v1/verification/confirm-email`
- `POST /campus/v1/verification/upload-document`
- `GET /campus/v1/student-verifications/me`
- `POST /campus/v1/student-verifications`
- `POST /campus/v1/student-verifications/{id}/resubmit`
- `GET /campus/v1/admin/verifications?status=pending`
- `POST /campus/v1/admin/verifications/{id}/approve`
- `POST /campus/v1/admin/verifications/{id}/reject`
- `POST /campus/v1/admin/verifications/{id}/request-info`

Current implementation note:

- `student_verifications` now stores verification method, status, university,
  student evidence, email-code hash/expiry, document URL, review state, and
  rejection/request-info reasons.
- `GET /campus/v1/universities` and `GET /campus/v1/universities/:id/campuses`
  are mounted for campus selection.
- `POST /campus/v1/verification/start`, `POST /campus/v1/verification/confirm-email`,
  `POST /campus/v1/verification/upload-document`, `GET /campus/v1/student-verifications/me`,
  `POST /campus/v1/student-verifications`, and
  `POST /campus/v1/student-verifications/{id}/resubmit` are mounted.
- University admin queue/actions are mounted at `/campus/v1/admin/verifications`
  and mirrored under `/user/v1/campus/...` for mobile compatibility.
- Approval updates the employee student profile with verified university
  evidence, so the Career Passport verified-student badge can be based on real
  backend state.
- Flutter now exposes campus verification from the campus dashboard More actions,
  including email-code verification, status/rejection display, document upload,
  and resubmit. Live email delivery, real Android file-picker QA, and
  university admin approve/reject device QA remain open work.

University dashboard screens:

- `UniversityDashboardScreen`
- `VerificationQueueScreen`
- `StudentReadinessListScreen`
- `MajorInsightsScreen`
- `CampusEventsAdminScreen`
- `EmployerConnectionsScreen`

Required dashboard reports:

| Report | Metrics |
| --- | --- |
| Student activation | Registered, verified, pending, rejected students. |
| Career readiness | Average score, under 50, 50-79, 80+. |
| CV readiness | CV uploaded count, average CV score, missing CV sections. |
| Applications | Applications, shortlisted, interviews, offers, hired. |
| Major insights | Students by major, missing skills by major, hiring companies by major. |
| Events/resources | Attendance, workshop completion, resource views. |
| Employer engagement | Connected companies, campus jobs, internships, interviews. |

Permissions and privacy:

- `university_admin` sees only their university data.
- `super_admin` can view all universities.
- Company users cannot access university dashboards unless they also own a
  university context.
- Aggregate reports must not expose personal student data without verified
  university/student relationship.

## Global Scope

Launch constraint: country selection, Arabic/English translation, and salary
currencies limited to USD, EUR, and GBP only.

Country/currency requirements:

- Add `country_code` and `city` to users, jobs, companies, universities, and
  campus events.
- Currency selector allows only USD, EUR, GBP.
- Salary display uses `salary_min`, `salary_max`, `currency`, `pay_period`.
- Do not auto-convert currencies unless verified exchange-rate settings exist.
- Super admin can enable countries and set default USD/EUR/GBP currency.

Current implementation note:

- `/user/v1/global/countries`, `/user/v1/global/cities`,
  `/user/v1/global/currencies`, and `/user/v1/global/work-modes` are mounted for
  mobile/global selection.
- The launch contract currently allows only `USD`, `EUR`, and `GBP` salary
  currencies and only `onsite`, `remote`, and `hybrid` work modes.
- Company job create/update, job browse/search filters, seeker work-preference
  salary updates, and Flutter company/seeker salary UI now use the launch
  contract. Remaining work is production data cleanup and admin-managed country
  rollout controls.

Translation requirements:

- Backend generates Arabic/English job translations.
- Backend generates Arabic/English CV/Career Passport translations.
- Store original text, translated text, source language, target language,
  `ai_request_id`, approval user, and approval timestamp.
- Human approval is required before publishing/saving translated job or CV.

Translation APIs:

- `POST /ai/v1/translate/job/{jobId}`
- `POST /ai/v1/translate/cv`
- `PUT /jobs/v1/{jobId}/translations/{lang}`
- `PUT /user/v1/cv/translations/{lang}`

Work mode requirements:

- `work_mode`: `onsite`, `hybrid`, `remote`.
- `remote_country_policy`: `same_country_only`, `region_allowed`, `worldwide`.
- Office location is required for onsite and hybrid.
- Hybrid may include `hybrid_days_per_week`.
- Remote may include timezone-overlap requirements.

## Trust, Tracker, Notifications, Analytics

Trust foundation:

- Company verification badge only after email/domain/phone/document/admin review.
- Job Trust Score flags verified company, salary realism, duplicate text,
  suspicious wording, contact method, and reports.
- Suspicious job warnings cover unrealistic salary, payment requests, personal
  document requests, external-chat-only contact, and duplicate posts.
- Users can report job/company for scam, wrong info, abuse, expired job, or fake
  company.
- Admin review queue lets super admin suspend, request documents, or mark safe.
- AI may flag risk; human/admin decides final action.

Trust APIs:

- `POST /trust/v1/jobs/{jobId}/score`
- `POST /trust/v1/jobs/{jobId}/report`
- `GET /admin/v1/trust/review-queue`
- `POST /admin/v1/trust/jobs/{jobId}/mark-safe`
- `POST /admin/v1/trust/jobs/{jobId}/suspend`
- `POST /admin/v1/trust/jobs/{jobId}/request-documents`
- Dashboard aliases also exist under `/dash/v1/trust/*` for the existing admin portal.

Application statuses:

| Side | Statuses |
| --- | --- |
| Job seeker | saved, applied, viewed_by_company, shortlisted, interview_scheduled, rejected, offer, hired, withdrawn |
| Company | new, reviewed, shortlisted, interview, offer, hired, rejected, archived |
| Campus/university | applied, shortlisted, interview, hired, needs_support, missing_cv, low_readiness |

Notification APIs:

- `POST /notifications/v1/device-token`
- `DELETE /notifications/v1/device-token`
- `GET /notifications/v1/list`
- `POST /notifications/v1/read`

Required notification events:

- Application status changed.
- Interview scheduled/updated/cancelled.
- Company viewed profile.
- New matching job.
- Campus verification approved/rejected.
- Campus event reminder.
- Employer received applicant.
- CV export ready.
- AI result ready if async.

Analytics events:

| Group | Events |
| --- | --- |
| Activation | `signup_completed`, `login_completed`, `account_context_switched`, `profile_completed` |
| AI | `ai_score_generated`, `ai_cv_rewritten`, `ai_job_match_viewed`, `ai_cover_letter_generated`, `ai_interview_practiced`, `ai_shortlist_generated` |
| Jobs | `job_viewed`, `job_saved`, `job_applied`, `job_reported`, `remote_filter_used`, `hybrid_filter_used` |
| Company | `company_profile_updated`, `job_created`, `job_published`, `candidate_shortlisted`, `interview_scheduled`, `cv_exported` |
| Campus | `campus_verification_started`, `campus_verification_approved`, `event_joined`, `readiness_viewed` |
| Global | `country_changed`, `currency_selected`, `job_translated`, `cv_translated` |

## Launch Blockers

- Production signing and Android package/update strategy.
- Real device QA for seeker, student/campus, company, and future university/admin
  contexts.
- No fake/demo data in release flows.
- Full Arabic/English localization if localization is included in launch.
- Push notification credentials and end-to-end notification event QA.
- Package/update strategy must decide whether to replace the previous developer
  APK package or launch as a new app package.
- Release builds must use a production signing key, not debug/local test signing.
- Version code must monotonically increase and version name/build label must
  match APK manifest metadata.
- Consider split APK/App Bundle by ABI before public distribution.
- Add only needed Android permissions.
- No demo/fake values in release flows; use real backend data or proper empty
  states.
