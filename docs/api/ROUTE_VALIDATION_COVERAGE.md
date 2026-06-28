# Route Validation Coverage

Generated: 2026-06-28T07:22:59.861Z

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | 3401 |
| Public/system endpoints | 5 |
| Read-only endpoints allowed without body validator | 311 |
| Write/update/delete endpoints | 2149 |
| Write/update/delete endpoints with validator | 1997 |
| Write/update/delete endpoints missing validator | 152 |
| Write validation coverage | 92.9% |
| Core auth/account missing validators | 0 |

## Module Summary

| Module | Total | Writes | Writes With Validator | Writes Missing Validator |
| --- | --- | --- | --- | --- |
| account | 6 | 3 | 3 | 0 |
| admin | 2882 | 1902 | 1902 | 0 |
| ai | 12 | 12 | 12 | 0 |
| analytics | 5 | 2 | 2 | 0 |
| auth | 14 | 14 | 14 | 0 |
| campus | 61 | 34 | 34 | 0 |
| company | 134 | 65 | 0 | 65 |
| jobs | 2 | 1 | 1 | 0 |
| legacy-user | 139 | 42 | 0 | 42 |
| notifications | 16 | 12 | 12 | 0 |
| other | 12 | 6 | 6 | 0 |
| seeker | 94 | 45 | 0 | 45 |
| trust | 4 | 4 | 4 | 0 |
| university | 20 | 7 | 7 | 0 |

## Missing Write Validators

| Method | Path | Module | Middlewares |
| --- | --- | --- | --- |
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
| POST | /employee/v1/cv/generate/download | seeker | downloadMyCv |
| POST | /employee/v1/cv/generate/download-url | seeker | createMyCvDownloadUrl |
| POST | /employee/v1/cv/generate/preview | seeker | previewMyCv |
| POST | /employee/v1/cv/generate/save | seeker | saveMyCvSettings |
| POST | /employee/v1/cv/upload | seeker | multerMiddleware, uploadMyCv |
| PUT | /employee/v1/cv/upload/:cvId | seeker | setActiveCv |
| DELETE | /employee/v1/cv/uploaded/:cvId | seeker | deleteMyUploadedCv |
| PATCH | /employee/v1/global/applications/:applicationId/cancel | seeker | multerMiddleware, cancelMyApplication |
| POST | /employee/v1/global/applications/:applicationId/messages | seeker | multerMiddleware, addApplicationMessage |
| PATCH | /employee/v1/global/applications/interviews/:interviewId/respond | seeker | multerMiddleware, respondToInterview |
| PATCH | /employee/v1/global/applications/offers/:invitationId/reject | seeker | multerMiddleware, anonymous |
| PATCH | /employee/v1/global/applications/offers/:invitationId/respond | seeker | multerMiddleware, respondToJobInvitation |
| POST | /employee/v1/global/companies/:companyId/review | seeker | multerMiddleware, reviewCompany |
| POST | /employee/v1/global/jobs/:jobId/apply | seeker | multerMiddleware, applyToJob |
| POST | /employee/v1/global/jobs/:jobId/rate | seeker | multerMiddleware, rateJob |
| POST | /employee/v1/global/jobs/:jobId/review | seeker | multerMiddleware, reviewJob |
| DELETE | /employee/v1/global/jobs/:jobId/save | seeker | multerMiddleware, saveJob |
| POST | /employee/v1/global/jobs/:jobId/save | seeker | multerMiddleware, saveJob |
| PUT | /employee/v1/global/me/basic-profile | seeker | getMyBasicProfile |
| PUT | /employee/v1/global/profile | seeker | getMyEmployeeProfile |
| POST | /employee/v1/global/profile/:section | seeker | getMySection |
| PUT | /employee/v1/global/profile/:section | seeker | getMySection |
| DELETE | /employee/v1/global/profile/:section/:itemId | seeker | multerMiddleware, updateSectionItem |
| PATCH | /employee/v1/global/profile/:section/:itemId | seeker | multerMiddleware, updateSectionItem |
| PUT | /employee/v1/global/profile/about-me | seeker | multerMiddleware, updateAboutMe |
| PUT | /employee/v1/global/profile/job-names | seeker | multerMiddleware, replaceJobNames |
| PUT | /employee/v1/global/profile/job-types | seeker | multerMiddleware, replaceJobTypes |
| PUT | /employee/v1/global/profile/latest-work-experience | seeker | multerMiddleware, updateLatestWorkExperience |
| PUT | /employee/v1/global/profile/min-salary | seeker | multerMiddleware, replaceMinSalary |
| POST | /employee/v1/global/profile/rebuild-search-filters | seeker | multerMiddleware, rebuildMySearchFilters |
| PUT | /employee/v1/global/profile/work-preferences | seeker | multerMiddleware, updateWorkPreferences |
| POST | /employee/v1/jobs/:jobId/apply | seeker | authUser, anonymous, multerMiddleware, applyToJob |
| POST | /employee/v1/jobs/:jobId/rate | seeker | authUser, anonymous, multerMiddleware, rateJob |
| POST | /employee/v1/jobs/:jobId/review | seeker | authUser, anonymous, multerMiddleware, reviewJob |
