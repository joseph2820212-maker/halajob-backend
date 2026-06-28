# Route Validation Coverage

Generated: 2026-06-28T07:26:43.042Z

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | 3401 |
| Public/system endpoints | 5 |
| Read-only endpoints allowed without body validator | 294 |
| Write/update/delete endpoints | 2149 |
| Write/update/delete endpoints with validator | 2062 |
| Write/update/delete endpoints missing validator | 87 |
| Write validation coverage | 96% |
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
| company | 134 | 65 | 65 | 0 |
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
| DELETE | /employee/v1/jobs/:jobId/save | seeker | authUser, anonymous, multerMiddleware, saveJob |
| POST | /employee/v1/jobs/:jobId/save | seeker | authUser, anonymous, multerMiddleware, saveJob |
