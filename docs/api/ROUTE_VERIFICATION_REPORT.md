# Route Verification Report

Generated: 2026-06-29T03:48:52.871Z
Source: live Express app via `express-list-endpoints`.

## Summary

| Metric | Count |
|---|---:|
| Raw Express endpoint entries | 2535 |
| Unique method/path endpoints | 3991 |
| Endpoints with detected auth/role guard | 3839 |
| Known public/system endpoints | 112 |
| Unguarded endpoints needing manual classification | 40 |

Full machine-readable inventory:

```text
docs/api/HALAJOB_ROUTE_INVENTORY.json
```

## Module Counts

| Module | Total | Protected | Known public | Needs classification |
| --- | --- | --- | --- | --- |
| Admin | 3328 | 3323 | 5 | 0 |
| AI | 12 | 12 | 0 | 0 |
| Analytics | 5 | 5 | 0 | 0 |
| Campus | 18 | 16 | 2 | 0 |
| Campus Student | 51 | 49 | 2 | 0 |
| Company | 181 | 143 | 5 | 33 |
| Files | 1 | 0 | 1 | 0 |
| Health | 4 | 0 | 4 | 0 |
| Jobs | 2 | 2 | 0 | 0 |
| Legacy User | 204 | 120 | 77 | 7 |
| Notifications | 20 | 20 | 0 | 0 |
| Other | 15 | 0 | 15 | 0 |
| Seeker | 110 | 109 | 1 | 0 |
| Trust | 4 | 4 | 0 | 0 |
| University | 36 | 36 | 0 | 0 |

## Guard Detection

Detected guard middleware names:

```text
activeContextGuard
authUser
isAdmin
requireAppAccount
requireCampusStudent
requireCompanyContext
requireCompanyPermission
requireUniversityAdminContext
```

Middleware names observed in the live app:

```text
SendInterView
acknowledgePolicy
activeContextGuard
activeContextPermissionGuard
addAdminMessage
addApplicationMessage
addApplicationNote
addCandidateNote
addCandidateTags
addMessage
addTicketMessage
adminApproveVerification
adminCampusPartners
adminCampusPrivacyAudit
adminCohorts
adminDownloadStudentVerificationDocument
adminHealth
adminList
adminListVerifications
adminRebuild
adminRejectVerification
adminRequestVerificationInfo
adminSummary
anonymous
applicationDetails
applications
applyExternalOpportunity
applyJob
applyOutsideJob
applyToJob
approve
approveCompanyRequest
approveJob
archiveResource
assignSubscriptionPlan
assignUniversityResource
auditMissingDashboardLoginCredentials
authUser
blockApplicationApplicant
browseCompanies
browseJobs
bulkApplicationCvs
bulkExportApplications
bulkUpdateJobs
campusRegister
cancelAccountDeletion
cancelApplication
cancelCompanyPartnerRequest
cancelEventRegistration
cancelInterview
cancelJobInvitation
cancelJobZainTalentRequest
cancelMyApplication
changeApplicationStatus
changeInterviewStatus
changeJobStatus
changeStatus
checkPermissionMiddleware
checkResourcePermissionMiddleware
cities
cloneJob
closeTicket
companiesFromMyActivity
companiesFromSavedJobs
companiesIAppliedTo
companiesViewedByMe
companyCheck
companyData
companyDetails
companyOpportunities
companyPartnerDetail
companyStudentDetail
companySuggest
completeResource
confirmParseJob
confirmStudentVerificationEmail
content
corsMiddleware
countries
create
createAccessibilityRequest
createCvTemplate
createDashboardUser
createInterview
createManualWhatsappLink
createMyCvDownloadUrl
createPrivacyRequest
createReport
createTicket
csv
currencies
dashboard
deleteCompanyFile
deleteDeviceToken
deleteFile
deleteMyUploadedCv
deleteToken
details
downloadCompanyFile
downloadCoverLetter
downloadFile
downloadMyCv
downloadSavedCv
downloadStudentVerificationDocument
duplicateCv
educationLevel
events
experienceLevel
exportMyData
forceCompanyWebAuthScope
forgotPassword
generateSmartEmployeesForJob
get
getAllApplications
getApplicants
getApplicationAuditLogs
getApplicationCv
getApplicationDetails
getApplicationsAnalytics
getAppliedJobs
getApplyReadiness
getAtsPipeline
getAuditLogs
getBillingSummary
getById
getCandidateDetails
getClientSettings
getCompany
getCompanyAnalytics
getCompanyDashboard
getCompanyInterviews
getCompanyJobReviews
getCompanyJobs
getCompanyReviews
getCompanySettings
getCompanySubscription
getCoverLetterTemplates
getCreatedJobs
getCurrencies
getCvTemplatesPublic
getEmployeeDashboard
getEmployeeDetails
getFileLinks
getFilters
getHelpArticle
getHiringSummary
getInterviewDetails
getInterviewedJobs
getInterviews
getJobApplicants
getJobApplications
getJobAuditLogs
getJobById
getJobDetails
getJobInvitationDetails
getJobRatingStats
getJobReviews
getJobSavers
getJobType
getJobZainTalentRequestDetails
getJobsAnalytics
getJobsStatistics
getLanguages
getMyAppDashboardOverview
getMyApplicationDetails
getMyBasicCompanyProfile
getMyBasicProfile
getMyCompanyCompletion
getMyCompanyProfile
getMyEmployeeCompletion
getMyEmployeeProfile
getMyInterviewDetails
getMyInvoiceDetails
getMyInvoices
getMyJobDetails
getMyJobInvitationDetails
getMyJobs
getMySection
getMySubscription
getMyUploadedCvs
getPage
getParseJob
getPlatformSettings
getPlatformSettingsSchema
getPreferences
getProfileAnalytics
getPublicProfile
getRecommendedEmployeesForJob
getReport
getRequest
getResource
getSavedJob
getSavedSearch
getSmartEmployeesForJob
getTalentPool
getTalentVisibility
getTicket
getTicketDetails
getUniversitySettings
getUserJobCounts
getUserSettings
globalSearch
industry
insert
inviteCandidateToJob
isAdmin
jobPrep
joinRequest
jsonParser
list
listAlertLogs
listAuditLogs
listCategories
listCompanies
listCompanyFiles
listCompanyRequests
listConsents
listContexts
listDeliveryLogs
listFaq
listFeatures
listHelpArticles
listHelpCategories
listJobReviewQueue
listJobReviews
listJobSavers
listLimits
listMembers
listNotificationLogs
listPages
listPending
listQuestions
listRequests
listResources
listSavedSearches
listSessions
listTalentPool
listTalentRequests
listTemplates
listTickets
listTokens
listTranslations
listUniversities
listUniversityCampuses
listUniversityMembers
listUniversityResources
logKeyword
login
logout
logoutAll
markAllRead
markDoNotContact
markInterviewNoShow
markJobSafe
markRead
markUnread
matchEmployeeWithJob
me
multerMiddleware
myApplications
myInterviews
myJobInvitations
myProgress
myRejectedApplications
opportunities
opportunityDetails
optionalAuthUser
overview
parseUpload
partners
passcodeVerify
permissions
previewCoverLetter
previewMyCv
previewParseJob
previewPublicProfile
profile
protectHealth
publicInsight
publicInsightByTitle
publishResource
questions
rateApplicant
rateJob
rebuildMyCompanySearchFilters
rebuildMySearchFilters
recommendedJobs
recommendedResources
recomputeJobRatingBreakdown
refresh
refreshScore
refreshToken
register
registerEvent
registerToken
reject
rejectCompanyRequest
rejectJob
rejectParseJob
remove
removeCandidateTag
replaceJobNames
replaceJobTypes
replaceMinSalary
reportJob
requestAccountDeletion
requestDocuments
requestInterviewReschedule
requestJobZainTalentHelp
requestPlanChange
requireCampusOpportunity
requireCampusStudent
resendOtp
resetPassword
resources
respondToInterview
respondToJobInvitation
restoreApplication
resubmitStudentVerification
reviewCompany
reviewJob
reviewQueue
revokeSession
runSavedSearchNow
salaryType
saveCandidate
saveCvTranslation
saveJob
saveJobTranslation
saveMyCvSettings
saveOpportunity
saveQuestionNote
saveResource
savedJobs
scoreCvQuality
scoreJob
searchEmployees
seedFreePlan
sendApplicationMessage
sendInterviewReminder
sendJobInvitation
sendNotification
services
setActiveContext
setActiveCv
setConsent
setDefaultCv
share
shared
skills
startStudentVerification
studentVerificationStatus
students
submitInterviewFeedback
submitJobDocuments
submitPublicProfileReview
summary
suspendJob
testSend
toggleSaveJob
toggleSaveOpportunity
track
tracking
universityLogin
universityOverview
universityResourceAnalytics
unreadCount
update
updateAboutMe
updateApplicationStatus
updateCategory
updateChecklistProgress
updateCompanyAbout
updateCompanyContact
updateCompanyLocation
updateCompanyMedia
updateCvTemplate
updateImage
updateInterview
updateKeyWord
updateLatestWorkExperience
updateLimit
updateMember
updateMyCompanyUserProfile
updateProfile
updateProgress
updateQuestion
updateSectionItem
updateTalentRequestStatus
updateTemplate
updateTicketStatus
updateToken
updateUniversityMember
updateUniversityResource
updateUniversityStatus
updateVisibility
updateWorkPreferences
uploadExcel
uploadFile
uploadMyCv
uploadStudentVerificationDocument
userInsight
userJobInsight
userUniversityEmployabilityAnalytics
userUniversityOpportunities
userUniversityOutcomeReport
userUniversityOverview
userUniversityPartners
userUniversityStudentCareerPassport
userUniversityStudentDetail
userUniversityStudents
validateRequest
whatIsMyRole
workMode
workModes
workTime
```

Parent-mount guards inferred from route index files:

```text
inferred:approvedCompanyGuard
inferred:authUser
inferred:employeeAccountGuard
inferred:isAdmin
inferred:universityAdminGuard
```

Note: parent-mount guards are inferred because `express-list-endpoints` does not consistently attach `router.use(...)` middleware names to every nested child route.

## Unguarded Endpoints Needing Manual Classification

These endpoints do not expose one of the known guard middleware names, do not match a known protected parent mount, and are not in the known-public allowlist. Some may be intentionally public or may be protected indirectly by controller code. Review them before launch.

| Method | Path | Module | Middlewares |
| --- | --- | --- | --- |
| POST | /company/v1/auth/refresh | Company | multerMiddleware, validateRequest, refresh |
| POST | /company/v1/auth/refresh-token | Company | multerMiddleware, validateRequest, refresh |
| POST | /company/v1/auth/reset-password | Company | forceCompanyWebAuthScope, multerMiddleware, validateRequest, resetPassword |
| GET | /company/v1/interviews | Company | anonymous, multerMiddleware, validateRequest, getInterviews |
| POST | /company/v1/interviews | Company | anonymous, multerMiddleware, validateRequest, getInterviews |
| GET | /company/v1/interviews/:interviewId | Company | anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| PATCH | /company/v1/interviews/:interviewId | Company | anonymous, multerMiddleware, validateRequest, getInterviewDetails |
| POST | /company/v1/interviews/:interviewId/cancel | Company | anonymous, multerMiddleware, validateRequest, cancelInterview |
| POST | /company/v1/interviews/:interviewId/feedback | Company | anonymous, multerMiddleware, validateRequest, submitInterviewFeedback |
| POST | /company/v1/interviews/:interviewId/mark-no-show | Company | anonymous, multerMiddleware, validateRequest, markInterviewNoShow |
| POST | /company/v1/interviews/:interviewId/send-reminder | Company | anonymous, multerMiddleware, validateRequest, sendInterviewReminder |
| PATCH | /company/v1/interviews/:interviewId/status | Company | anonymous, multerMiddleware, validateRequest, changeInterviewStatus |
| GET | /company/v1/profile/public | Company | anonymous, validateRequest, getPublicProfile |
| PATCH | /company/v1/profile/public | Company | anonymous, validateRequest, getPublicProfile |
| POST | /company/v1/profile/public/preview | Company | anonymous, multerMiddleware, validateRequest, previewPublicProfile |
| POST | /company/v1/profile/public/submit-review | Company | anonymous, multerMiddleware, validateRequest, submitPublicProfileReview |
| POST | /company/v1/salary-insights/check | Company | jsonParser, validateRequest, companyCheck |
| GET | /company/v1/salary-insights/suggest | Company | validateRequest, companySuggest |
| GET | /company/v1/settings | Company | validateRequest, getCompanySettings |
| PATCH | /company/v1/settings | Company | validateRequest, getCompanySettings |
| PUT | /company/v1/settings | Company | validateRequest, getCompanySettings |
| GET | /company/v1/talent-pool | Company | anonymous, multerMiddleware, validateRequest, listTalentPool |
| POST | /company/v1/talent-pool/candidates | Company | anonymous, multerMiddleware, validateRequest, saveCandidate |
| DELETE | /company/v1/talent-pool/candidates/:id | Company | anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| GET | /company/v1/talent-pool/candidates/:id | Company | anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| PATCH | /company/v1/talent-pool/candidates/:id | Company | anonymous, multerMiddleware, validateRequest, getCandidateDetails |
| POST | /company/v1/talent-pool/candidates/:id/do-not-contact | Company | anonymous, multerMiddleware, validateRequest, markDoNotContact |
| POST | /company/v1/talent-pool/candidates/:id/invite-to-job | Company | anonymous, multerMiddleware, validateRequest, inviteCandidateToJob |
| GET | /company/v1/talent-pool/candidates/:id/notes | Company | anonymous, multerMiddleware, validateRequest, addCandidateNote |
| POST | /company/v1/talent-pool/candidates/:id/notes | Company | anonymous, multerMiddleware, validateRequest, addCandidateNote |
| POST | /company/v1/talent-pool/candidates/:id/tags | Company | anonymous, multerMiddleware, validateRequest, addCandidateTags |
| DELETE | /company/v1/talent-pool/candidates/:id/tags/:tag | Company | anonymous, multerMiddleware, validateRequest, removeCandidateTag |
| GET | /company/v1/talent-pool/search | Company | anonymous, multerMiddleware, validateRequest, listTalentPool |
| POST | /user/v1/communication/manual-whatsapp-link | Legacy User | jsonParser, validateRequest, createManualWhatsappLink |
| GET | /user/v1/communication/preferences | Legacy User | validateRequest, getPreferences |
| PATCH | /user/v1/communication/preferences | Legacy User | validateRequest, getPreferences |
| PUT | /user/v1/communication/preferences | Legacy User | validateRequest, getPreferences |
| GET | /user/v1/company/public/:companyId | Legacy User | companyDetails |
| GET | /user/v1/salary-insights | Legacy User | validateRequest, userInsight |
| GET | /user/v1/salary-insights/jobs/:jobId | Legacy User | validateRequest, userJobInsight |



## Current Verification Coverage

| Area | Evidence |
|---|---|
| Mobile/campus route mounts | `npm run test:mobile-routes` |
| Security HTTP contracts | `npm run test:security-http` |
| AI route/safety contracts | `npm run test:ai-safety` |
| Launch filters/contracts | `npm run test:global-launch-contract` |
| Secret/runtime-file hygiene | `npm run check:secrets` |

## Gaps Still To Close

| Gap | Status |
|---|---|
| Full endpoint request/response API reference | Route and auth inventory exists in `docs/api/HALAJOB_API_REFERENCE.md`; exact request/response schemas are still not complete. |
| OpenAPI file | Generated skeleton exists at `docs/api/HALAJOB_OPENAPI.yaml`; operation paths, methods, tags, auth, and generic responses are present, but exact schemas still need route-by-route expansion. |
| Postman collection | Generated collection exists at `docs/api/HALAJOB_POSTMAN_COLLECTION.json` with local/dev environments; endpoint-specific example bodies still need route-by-route expansion. |
| Per-route validator coverage | Not mechanically complete because validators/multer/controller validation are not consistently named. |
| Per-route role matrix | Baseline exists in `docs/security/ROLE_PERMISSION_MATRIX.md`; route-by-route expansion still required. |
| Live smoke results | Requires deployed API and approved test accounts. |
