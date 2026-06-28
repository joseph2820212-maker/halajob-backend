# Route Validation Coverage

Generated: 2026-06-28T07:16:20.467Z

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | 3401 |
| Public/system endpoints | 5 |
| Read-only endpoints allowed without body validator | 316 |
| Write/update/delete endpoints | 2149 |
| Write/update/delete endpoints with validator | 1956 |
| Write/update/delete endpoints missing validator | 193 |
| Write validation coverage | 91% |
| Core auth/account missing validators | 0 |

## Module Summary

| Module | Total | Writes | Writes With Validator | Writes Missing Validator |
| --- | --- | --- | --- | --- |
| account | 6 | 3 | 3 | 0 |
| admin | 2882 | 1902 | 1902 | 0 |
| ai | 12 | 12 | 12 | 0 |
| analytics | 5 | 2 | 2 | 0 |
| auth | 14 | 14 | 14 | 0 |
| campus | 61 | 34 | 0 | 34 |
| company | 134 | 65 | 0 | 65 |
| jobs | 2 | 1 | 1 | 0 |
| legacy-user | 139 | 42 | 0 | 42 |
| notifications | 16 | 12 | 12 | 0 |
| other | 12 | 6 | 6 | 0 |
| seeker | 94 | 45 | 0 | 45 |
| trust | 4 | 4 | 4 | 0 |
| university | 20 | 7 | 0 | 7 |

## Missing Write Validators

| Method | Path | Module | Middlewares |
| --- | --- | --- | --- |
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
| POST | /company/v1/global/support-tickets/:ticketId/messages | company | anonymous, multerMiddleware, addTicketMessage |
| POST | /company/v1/jobs/hiring/:jobId/invitations | company | anonymous, multerMiddleware, sendJobInvitation |
| PATCH | /company/v1/jobs/hiring/applications/:applicationId/block-applicant | company | anonymous, multerMiddleware, blockApplicationApplicant |
| POST | /company/v1/jobs/hiring/applications/:applicationId/interviews | company | anonymous, multerMiddleware, createInterview |
| POST | /company/v1/jobs/hiring/applications/:applicationId/messages | company | anonymous, multerMiddleware, sendApplicationMessage |
| PATCH | /company/v1/jobs/hiring/applications/:applicationId/restore | company | anonymous, multerMiddleware, restoreApplication |
| PATCH | /company/v1/jobs/hiring/applications/:applicationId/status | company | anonymous, multerMiddleware, updateApplicationStatus |
| POST | /company/v1/jobs/hiring/applications/bulk-cv | company | anonymous, multerMiddleware, bulkApplicationCvs |
| POST | /company/v1/jobs/hiring/applications/bulk-export | company | anonymous, multerMiddleware, bulkExportApplications |
| POST | /company/v1/jobs/hiring/interviews | company | anonymous, multerMiddleware, createInterview |
| PATCH | /company/v1/jobs/hiring/interviews/:interviewId | company | anonymous, multerMiddleware, updateInterview |
| PATCH | /company/v1/jobs/hiring/interviews/:interviewId/status | company | anonymous, multerMiddleware, changeInterviewStatus |
| POST | /company/v1/jobs/hiring/invitations | company | anonymous, multerMiddleware, sendJobInvitation |
| PATCH | /company/v1/jobs/hiring/invitations/:invitationId/cancel | company | anonymous, multerMiddleware, cancelJobInvitation |
| POST | /company/v1/jobs/talent/:jobId/help-requests | company | anonymous, multerMiddleware, requestJobZainTalentHelp |
| POST | /company/v1/jobs/talent/:jobId/smart-employees/generate | company | anonymous, multerMiddleware, generateSmartEmployeesForJob |
| POST | /company/v1/jobs/talent/help-requests | company | anonymous, multerMiddleware, requestJobZainTalentHelp |
| PATCH | /company/v1/jobs/talent/help-requests/:requestId/cancel | company | anonymous, multerMiddleware, cancelJobZainTalentRequest |
| POST | /user/v1/applying-job/insert/:id | legacy-user | authUser, anonymous, applyJob |
| PUT | /user/v1/career-passport | legacy-user | authUser, anonymous, get |
| POST | /user/v1/career-passport/share | legacy-user | authUser, anonymous, jsonParser, share |
| POST | /user/v1/company/delete-file | legacy-user | authUser, deleteFile |
| POST | /user/v1/company/join-request | legacy-user | authUser, multerMiddleware, joinRequest |
| POST | /user/v1/company/update-my-company | legacy-user | authUser, update |
| POST | /user/v1/company/update-my-company-image | legacy-user | authUser, multerMiddleware, updateImage |
| POST | /user/v1/company/upload-file | legacy-user | authUser, multerMiddleware, uploadFile |
| PUT | /user/v1/cv/translations/:lang | legacy-user | authUser, anonymous, multerMiddleware, saveCvTranslation |
| POST | /user/v1/employee/profile-update | legacy-user | authUser, anonymous, multerMiddleware, update |
| POST | /user/v1/fcm/delete-tokens/:id | legacy-user | authUser, deleteToken |
| POST | /user/v1/fcm/tokens | legacy-user | authUser, listTokens |
| POST | /user/v1/fcm/update-tokens/:id | legacy-user | authUser, jsonParser, updateToken |
| POST | /user/v1/handle-applied-job/change-job-status/:id | legacy-user | authUser, anonymous, changeStatus |
| POST | /user/v1/handle-applied-job/send-interview/:id | legacy-user | authUser, anonymous, SendInterView |
| POST | /user/v1/job-information/apply-outside/:id | legacy-user | authUser, anonymous, applyOutsideJob |
| POST | /user/v1/job-information/rate-job/:id | legacy-user | authUser, anonymous, rateJob |
| POST | /user/v1/job-information/report-job/:id | legacy-user | authUser, anonymous, reportJob |
| POST | /user/v1/job-information/review-job/:id | legacy-user | authUser, anonymous, reviewJob |
| POST | /user/v1/job-information/toggle-save-job/:id | legacy-user | authUser, anonymous, toggleSaveJob |
| POST | /user/v1/job/create | legacy-user | authUser, anonymous, create |
| POST | /user/v1/job/update/:id | legacy-user | authUser, anonymous, update |
| DELETE | /user/v1/notification/:id | legacy-user | authUser, remove |
| POST | /user/v1/notification/:id/delete | legacy-user | authUser, remove |
| PATCH | /user/v1/notification/:id/read | legacy-user | authUser, markRead |
| POST | /user/v1/notification/:id/read | legacy-user | authUser, markRead |
| PATCH | /user/v1/notification/:id/unread | legacy-user | authUser, markUnread |
| POST | /user/v1/notification/:id/unread | legacy-user | authUser, markUnread |
| PATCH | /user/v1/notification/preferences | legacy-user | authUser, getPreferences |
| PUT | /user/v1/notification/preferences | legacy-user | authUser, getPreferences |
| PATCH | /user/v1/notification/read-all | legacy-user | authUser, markAllRead |
| POST | /user/v1/notification/read-all | legacy-user | authUser, markAllRead |
| DELETE | /user/v1/notifications/:id | legacy-user | authUser, remove |
| POST | /user/v1/notifications/:id/delete | legacy-user | authUser, remove |
| PATCH | /user/v1/notifications/:id/read | legacy-user | authUser, markRead |
| POST | /user/v1/notifications/:id/read | legacy-user | authUser, markRead |
| PATCH | /user/v1/notifications/:id/unread | legacy-user | authUser, markUnread |
| POST | /user/v1/notifications/:id/unread | legacy-user | authUser, markUnread |
| PATCH | /user/v1/notifications/preferences | legacy-user | authUser, getPreferences |
| PUT | /user/v1/notifications/preferences | legacy-user | authUser, getPreferences |
| PATCH | /user/v1/notifications/read-all | legacy-user | authUser, markAllRead |
| POST | /user/v1/notifications/read-all | legacy-user | authUser, markAllRead |
| PATCH | /employee/v1/applications/:applicationId/cancel | seeker | authUser, anonymous, multerMiddleware, cancelMyApplication |
| POST | /employee/v1/applications/:applicationId/cancel | seeker | authUser, anonymous, multerMiddleware, cancelMyApplication |
| POST | /employee/v1/applications/:applicationId/messages | seeker | authUser, anonymous, multerMiddleware, addApplicationMessage |
| PATCH | /employee/v1/applications/interviews/:interviewId/respond | seeker | authUser, anonymous, multerMiddleware, respondToInterview |
| POST | /employee/v1/applications/interviews/:interviewId/respond | seeker | authUser, anonymous, multerMiddleware, respondToInterview |
| PATCH | /employee/v1/applications/offers/:invitationId/respond | seeker | authUser, anonymous, multerMiddleware, respondToJobInvitation |
| POST | /employee/v1/applications/offers/:invitationId/respond | seeker | authUser, anonymous, multerMiddleware, respondToJobInvitation |
| POST | /employee/v1/auth/login | seeker | multerMiddleware, login |
| POST | /employee/v1/companies/:companyId/review | seeker | authUser, anonymous, multerMiddleware, reviewCompany |
