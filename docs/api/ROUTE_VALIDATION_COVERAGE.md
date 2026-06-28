# Route Validation Coverage

Generated: 2026-06-28T07:02:24.215Z

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | 3401 |
| Public/system endpoints | 5 |
| Read-only endpoints allowed without body validator | 326 |
| Write/update/delete endpoints | 2149 |
| Write/update/delete endpoints with validator | 1864 |
| Write/update/delete endpoints missing validator | 285 |
| Write validation coverage | 86.7% |
| Core auth/account missing validators | 0 |

## Module Summary

| Module | Total | Writes | Writes With Validator | Writes Missing Validator |
| --- | --- | --- | --- | --- |
| account | 6 | 3 | 3 | 0 |
| admin | 2882 | 1902 | 1847 | 55 |
| ai | 12 | 12 | 0 | 12 |
| analytics | 5 | 2 | 0 | 2 |
| auth | 14 | 14 | 14 | 0 |
| campus | 61 | 34 | 0 | 34 |
| company | 134 | 65 | 0 | 65 |
| jobs | 2 | 1 | 0 | 1 |
| legacy-user | 139 | 42 | 0 | 42 |
| notifications | 16 | 12 | 0 | 12 |
| other | 12 | 6 | 0 | 6 |
| seeker | 94 | 45 | 0 | 45 |
| trust | 4 | 4 | 0 | 4 |
| university | 20 | 7 | 0 | 7 |

## Missing Write Validators

| Method | Path | Module | Middlewares |
| --- | --- | --- | --- |
| POST | /dash/v1/ai/limits | admin | checkPermissionMiddleware, listLimits |
| DELETE | /dash/v1/ai/limits/:id | admin | checkPermissionMiddleware, multerMiddleware, updateLimit |
| PATCH | /dash/v1/ai/limits/:id | admin | checkPermissionMiddleware, multerMiddleware, updateLimit |
| POST | /dash/v1/auth/admins | admin | isAdmin, multerMiddleware, createDashboardUser |
| POST | /dash/v1/auth/create-admin | admin | isAdmin, multerMiddleware, createDashboardUser |
| POST | /dash/v1/auth/login | admin | multerMiddleware, login |
| POST | /dash/v1/auth/logout | admin | multerMiddleware, logout |
| POST | /dash/v1/auth/refresh | admin | multerMiddleware, refresh |
| POST | /dash/v1/campus/universities | admin | checkPermissionMiddleware, listUniversities |
| PATCH | /dash/v1/campus/universities/:id/status | admin | checkPermissionMiddleware, multerMiddleware, updateUniversityStatus |
| PATCH | /dash/v1/company-requests/:id/approve | admin | checkPermissionMiddleware, multerMiddleware, approveCompanyRequest |
| POST | /dash/v1/company-requests/:id/approve | admin | checkPermissionMiddleware, multerMiddleware, approveCompanyRequest |
| PATCH | /dash/v1/company-requests/:id/reject | admin | checkPermissionMiddleware, multerMiddleware, rejectCompanyRequest |
| POST | /dash/v1/company-requests/:id/reject | admin | checkPermissionMiddleware, multerMiddleware, rejectCompanyRequest |
| POST | /dash/v1/cv/admin/cv-templates | admin | createCvTemplate |
| DELETE | /dash/v1/cv/admin/cv-templates/:id | admin | updateCvTemplate |
| PATCH | /dash/v1/cv/admin/cv-templates/:id | admin | updateCvTemplate |
| PUT | /dash/v1/cv/admin/cv-templates/:id | admin | updateCvTemplate |
| POST | /dash/v1/cv/templates | admin | createCvTemplate |
| DELETE | /dash/v1/cv/templates/:id | admin | updateCvTemplate |
| PATCH | /dash/v1/cv/templates/:id | admin | updateCvTemplate |
| PUT | /dash/v1/cv/templates/:id | admin | updateCvTemplate |
| POST | /dash/v1/excel/create | admin | multerMiddleware, create |
| POST | /dash/v1/excel/csv | admin | multerMiddleware, csv |
| POST | /dash/v1/excel/exsel | admin | multerMiddleware, uploadExcel |
| POST | /dash/v1/exsel/create | admin | multerMiddleware, create |
| POST | /dash/v1/exsel/csv | admin | multerMiddleware, csv |
| POST | /dash/v1/exsel/exsel | admin | multerMiddleware, uploadExcel |
| POST | /dash/v1/import/create | admin | multerMiddleware, create |
| POST | /dash/v1/import/csv | admin | multerMiddleware, csv |
| POST | /dash/v1/import/exsel | admin | multerMiddleware, uploadExcel |
| PATCH | /dash/v1/jobs/:id/approve | admin | checkPermissionMiddleware, multerMiddleware, approveJob |
| POST | /dash/v1/jobs/:id/approve | admin | checkPermissionMiddleware, multerMiddleware, approveJob |
| PATCH | /dash/v1/jobs/:id/reject | admin | checkPermissionMiddleware, multerMiddleware, rejectJob |
| POST | /dash/v1/jobs/:id/reject | admin | checkPermissionMiddleware, multerMiddleware, rejectJob |
| POST | /dash/v1/keyword/update/:id | admin | multerMiddleware, updateKeyWord |
| POST | /dash/v1/Keyword/update/:id | admin | multerMiddleware, updateKeyWord |
| POST | /dash/v1/notification/send | admin | checkPermissionMiddleware, multerMiddleware, sendNotification |
| POST | /dash/v1/notifications/send | admin | checkPermissionMiddleware, multerMiddleware, sendNotification |
| POST | /dash/v1/operations/notifications/send | admin | checkPermissionMiddleware, multerMiddleware, sendNotification |
| POST | /dash/v1/operations/support-tickets/:ticketId/messages | admin | checkPermissionMiddleware, multerMiddleware, addAdminMessage |
| PATCH | /dash/v1/operations/support-tickets/:ticketId/status | admin | checkPermissionMiddleware, multerMiddleware, updateTicketStatus |
| POST | /dash/v1/subscriptions/companies/:companyId/assign-plan | admin | checkPermissionMiddleware, multerMiddleware, assignSubscriptionPlan |
| POST | /dash/v1/subscriptions/seed-free | admin | checkPermissionMiddleware, multerMiddleware, seedFreePlan |
| POST | /dash/v1/support-tickets/:ticketId/messages | admin | checkPermissionMiddleware, multerMiddleware, addAdminMessage |
| PATCH | /dash/v1/support-tickets/:ticketId/status | admin | checkPermissionMiddleware, multerMiddleware, updateTicketStatus |
| POST | /dash/v1/talent-requests | admin | checkPermissionMiddleware, listTalentRequests |
| PATCH | /dash/v1/talent-requests/:id/status | admin | checkPermissionMiddleware, multerMiddleware, updateTalentRequestStatus |
| POST | /dash/v1/talent-requests/:id/status | admin | checkPermissionMiddleware, multerMiddleware, updateTalentRequestStatus |
| PATCH | /dash/v1/trust/jobs/:jobId/mark-safe | admin | checkPermissionMiddleware, multerMiddleware, markJobSafe |
| POST | /dash/v1/trust/jobs/:jobId/mark-safe | admin | checkPermissionMiddleware, multerMiddleware, markJobSafe |
| PATCH | /dash/v1/trust/jobs/:jobId/request-documents | admin | checkPermissionMiddleware, multerMiddleware, requestDocuments |
| POST | /dash/v1/trust/jobs/:jobId/request-documents | admin | checkPermissionMiddleware, multerMiddleware, requestDocuments |
| PATCH | /dash/v1/trust/jobs/:jobId/suspend | admin | checkPermissionMiddleware, multerMiddleware, suspendJob |
| POST | /dash/v1/trust/jobs/:jobId/suspend | admin | checkPermissionMiddleware, multerMiddleware, suspendJob |
| POST | /ai/v1/career-passport/score | ai | authUser, anonymous, refreshScore |
| POST | /ai/v1/career/copilot | ai | authUser, anonymous |
| POST | /ai/v1/company/jobs/:jobId/shortlist | ai | authUser, anonymous |
| POST | /ai/v1/company/jobs/generate | ai | authUser, anonymous |
| POST | /ai/v1/company/messages/generate | ai | authUser, anonymous |
| POST | /ai/v1/cv/rewrite | ai | authUser, anonymous |
| POST | /ai/v1/interview/practice | ai | authUser, anonymous |
| POST | /ai/v1/jobs/:jobId/cover-letter | ai | authUser, anonymous |
| POST | /ai/v1/jobs/:jobId/match | ai | authUser, anonymous |
| POST | /ai/v1/profile/score | ai | authUser, anonymous |
| POST | /ai/v1/translate/cv | ai | authUser, anonymous |
| POST | /ai/v1/translate/job/:jobId | ai | authUser, anonymous |
| POST | /analytics/v1/events | analytics | track |
| POST | /analytics/v1/track | analytics | track |
| POST | /campus/v1/admin/members | campus | authUser, activeContextGuard, activeContextPermissionGuard, listUniversityMembers |
| DELETE | /campus/v1/admin/members/:memberId | campus | authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, updateUniversityMember |
| PATCH | /campus/v1/admin/members/:memberId | campus | authUser, activeContextGuard, activeContextPermissionGuard, multerMiddleware, updateUniversityMember |
| POST | /campus/v1/admin/verifications/:id/approve | campus | authUser, activeContextGuard, multerMiddleware, adminApproveVerification |
| POST | /campus/v1/admin/verifications/:id/reject | campus | authUser, activeContextGuard, multerMiddleware, adminRejectVerification |
| POST | /campus/v1/admin/verifications/:id/request-info | campus | authUser, activeContextGuard, multerMiddleware, adminRequestVerificationInfo |
| POST | /campus/v1/student-verifications | campus | authUser, multerMiddleware, startStudentVerification |
| POST | /campus/v1/student-verifications/:id/resubmit | campus | authUser, multerMiddleware, resubmitStudentVerification |
| POST | /campus/v1/verification/confirm-email | campus | authUser, multerMiddleware, confirmStudentVerificationEmail |
| POST | /campus/v1/verification/start | campus | authUser, multerMiddleware, startStudentVerification |
| POST | /campus/v1/verification/upload-document | campus | authUser, multerMiddleware, uploadStudentVerificationDocument |
| POST | /user/v1/campus/admin/verifications/:id/approve | campus | authUser, activeContextGuard, multerMiddleware, adminApproveVerification |
| POST | /user/v1/campus/admin/verifications/:id/reject | campus | authUser, activeContextGuard, multerMiddleware, adminRejectVerification |
| POST | /user/v1/campus/admin/verifications/:id/request-info | campus | authUser, activeContextGuard, multerMiddleware, adminRequestVerificationInfo |
| PATCH | /user/v1/campus/applications/:id/cancel | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, cancelApplication |
| POST | /user/v1/campus/applications/:id/cancel | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, cancelApplication |
| POST | /user/v1/campus/applications/:id/messages | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, sendApplicationMessage |
| PATCH | /user/v1/campus/events/:eventId/cancel | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, cancelEventRegistration |
| POST | /user/v1/campus/events/:eventId/cancel | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, cancelEventRegistration |
| POST | /user/v1/campus/events/:eventId/register | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, registerEvent |
| POST | /user/v1/campus/opportunities/:id/apply | campus | authUser, anonymous, requireCampusStudent, requireCampusOpportunity, multerMiddleware, applyJob |
| POST | /user/v1/campus/opportunities/:id/apply-external | campus | authUser, anonymous, requireCampusStudent, requireCampusOpportunity, multerMiddleware, applyExternalOpportunity |
| DELETE | /user/v1/campus/opportunities/:id/save | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, saveOpportunity |
| POST | /user/v1/campus/opportunities/:id/save | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, saveOpportunity |
| POST | /user/v1/campus/opportunities/:id/toggle-save | campus | authUser, anonymous, requireCampusStudent, multerMiddleware, toggleSaveOpportunity |
| PATCH | /user/v1/campus/profile | campus | authUser, anonymous, requireCampusStudent, profile |
| POST | /user/v1/campus/profile | campus | authUser, anonymous, requireCampusStudent, profile |
| PUT | /user/v1/campus/profile | campus | authUser, anonymous, requireCampusStudent, profile |
| POST | /user/v1/campus/student-verifications | campus | authUser, multerMiddleware, startStudentVerification |
| POST | /user/v1/campus/student-verifications/:id/resubmit | campus | authUser, multerMiddleware, resubmitStudentVerification |
| POST | /user/v1/campus/university/opportunities | campus | authUser, activeContextGuard, userUniversityOpportunities |
| POST | /user/v1/campus/verification/confirm-email | campus | authUser, multerMiddleware, confirmStudentVerificationEmail |
| POST | /user/v1/campus/verification/start | campus | authUser, multerMiddleware, startStudentVerification |
| POST | /user/v1/campus/verification/upload-document | campus | authUser, multerMiddleware, uploadStudentVerificationDocument |
| POST | /company/v1/auth/login | company | multerMiddleware, login |
| POST | /company/v1/auth/logout | company | multerMiddleware, logout |
| POST | /company/v1/campus/opportunities | company | anonymous, companyOpportunities |
| POST | /company/v1/campus/partners | company | anonymous, partners |
| POST | /company/v1/global/applications/:applicationId/note | company | anonymous, multerMiddleware, addApplicationNote |
| POST | /company/v1/global/applications/:applicationId/rate | company | anonymous, multerMiddleware, rateApplicant |
| PATCH | /company/v1/global/applications/:applicationId/status | company | anonymous, multerMiddleware, changeApplicationStatus |
| POST | /company/v1/global/interviews | company | anonymous, getCompanyInterviews |
| DELETE | /company/v1/global/interviews/:interviewId | company | anonymous, multerMiddleware, updateInterview |
| PATCH | /company/v1/global/interviews/:interviewId | company | anonymous, multerMiddleware, updateInterview |
| POST | /company/v1/global/jobs | company | anonymous, getMyJobs |
| DELETE | /company/v1/global/jobs/:jobId | company | anonymous, getMyJobDetails |
| PATCH | /company/v1/global/jobs/:jobId | company | anonymous, getMyJobDetails |
| POST | /company/v1/global/jobs/:jobId | company | anonymous, getMyJobDetails |
| PUT | /company/v1/global/jobs/:jobId | company | anonymous, getMyJobDetails |
| PATCH | /company/v1/global/jobs/:jobId/archive | company | anonymous, multerMiddleware |
| POST | /company/v1/global/jobs/:jobId/clone | company | anonymous, multerMiddleware, cloneJob |
| PATCH | /company/v1/global/jobs/:jobId/pause | company | anonymous, multerMiddleware |
| PATCH | /company/v1/global/jobs/:jobId/publish | company | anonymous, multerMiddleware |
| PATCH | /company/v1/global/jobs/:jobId/restore | company | anonymous, multerMiddleware |
| PATCH | /company/v1/global/jobs/:jobId/status | company | anonymous, multerMiddleware, changeJobStatus |
| PATCH | /company/v1/global/jobs/bulk | company | anonymous, multerMiddleware, bulkUpdateJobs |
| PUT | /company/v1/global/me/basic-profile | company | getMyBasicCompanyProfile |
| PUT | /company/v1/global/me/image | company | multerMiddleware, updateMyCompanyUserProfile |
| POST | /company/v1/global/members | company | anonymous, listMembers |
| DELETE | /company/v1/global/members/:memberId | company | anonymous, multerMiddleware, updateMember |
| PATCH | /company/v1/global/members/:memberId | company | anonymous, multerMiddleware, updateMember |
| POST | /company/v1/global/message-templates | company | anonymous, listTemplates |
| DELETE | /company/v1/global/message-templates/:templateId | company | anonymous, multerMiddleware, updateTemplate |
| PATCH | /company/v1/global/message-templates/:templateId | company | anonymous, multerMiddleware, updateTemplate |
| PUT | /company/v1/global/profile | company | getMyCompanyProfile |
| POST | /company/v1/global/profile/:section | company | getMySection |
| PUT | /company/v1/global/profile/:section | company | getMySection |
| DELETE | /company/v1/global/profile/:section/:itemId | company | anonymous, multerMiddleware, updateSectionItem |
| PATCH | /company/v1/global/profile/:section/:itemId | company | anonymous, multerMiddleware, updateSectionItem |
| PUT | /company/v1/global/profile/about | company | anonymous, multerMiddleware, updateCompanyAbout |
| PUT | /company/v1/global/profile/contact | company | anonymous, multerMiddleware, updateCompanyContact |
| POST | /company/v1/global/profile/files | company | listCompanyFiles |
| DELETE | /company/v1/global/profile/files/:filename | company | anonymous, deleteCompanyFile |
| PUT | /company/v1/global/profile/location | company | anonymous, multerMiddleware, updateCompanyLocation |
| PUT | /company/v1/global/profile/media | company | anonymous, multerMiddleware, updateCompanyMedia |
| POST | /company/v1/global/profile/rebuild-search-filters | company | anonymous, multerMiddleware, rebuildMyCompanySearchFilters |
| POST | /company/v1/global/question-library | company | anonymous, listQuestions |
| DELETE | /company/v1/global/question-library/:questionId | company | anonymous, multerMiddleware, updateQuestion |
| PATCH | /company/v1/global/question-library/:questionId | company | anonymous, multerMiddleware, updateQuestion |
| POST | /company/v1/global/subscription/request | company | anonymous, multerMiddleware, requestPlanChange |
| POST | /company/v1/global/support-tickets | company | anonymous, listTickets |
