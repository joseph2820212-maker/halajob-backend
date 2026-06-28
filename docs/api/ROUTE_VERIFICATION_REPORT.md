# Route Verification Report

Generated: 2026-06-28T08:56:26.127Z
Source: live Express app via `express-list-endpoints`.

## Summary

| Metric | Count |
|---|---:|
| Raw Express endpoint entries | 2410 |
| Unique method/path endpoints | 3831 |
| Endpoints with detected auth/role guard | 3730 |
| Known public/system endpoints | 94 |
| Unguarded endpoints needing manual classification | 7 |

Full machine-readable inventory:

```text
docs/api/HALAJOB_ROUTE_INVENTORY.json
```

## Module Counts

| Module | Total | Protected | Known public | Needs classification |
| --- | --- | --- | --- | --- |
| Admin | 3297 | 3292 | 5 | 0 |
| AI | 12 | 12 | 0 | 0 |
| Analytics | 5 | 5 | 0 | 0 |
| Campus | 18 | 16 | 2 | 0 |
| Campus Student | 43 | 41 | 2 | 0 |
| Company | 134 | 132 | 2 | 0 |
| Files | 1 | 0 | 1 | 0 |
| Health | 4 | 0 | 4 | 0 |
| Jobs | 2 | 2 | 0 | 0 |
| Legacy User | 174 | 97 | 77 | 0 |
| Notifications | 16 | 16 | 0 | 0 |
| Other | 7 | 0 | 0 | 7 |
| Seeker | 94 | 93 | 1 | 0 |
| Trust | 4 | 4 | 0 | 0 |
| University | 20 | 20 | 0 | 0 |

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
addMessage
addTicketMessage
adminApproveVerification
adminCohorts
adminDownloadStudentVerificationDocument
adminListVerifications
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
approveCompanyRequest
approveJob
assignSubscriptionPlan
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
cancelEventRegistration
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
companyData
companyDetails
companyOpportunities
confirmStudentVerificationEmail
content
corsMiddleware
countries
create
createAccessibilityRequest
createCvTemplate
createDashboardUser
createInterview
createMyCvDownloadUrl
createPrivacyRequest
createReport
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
downloadFile
downloadMyCv
downloadSavedCv
downloadStudentVerificationDocument
educationLevel
events
experienceLevel
exportMyData
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
getCompanyAnalytics
getCompanyDashboard
getCompanyInterviews
getCompanyJobReviews
getCompanySubscription
getCreatedJobs
getCurrencies
getCvTemplatesPublic
getEmployeeDashboard
getEmployeeDetails
getFileLinks
getFilters
getHelpArticle
getHiringSummary
getInterviewedJobs
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
getMyInvoiceDetails
getMyInvoices
getMyJobDetails
getMyJobInvitationDetails
getMyJobs
getMySection
getMySubscription
getMyUploadedCvs
getPage
getPreferences
getProfileAnalytics
getRecommendedEmployeesForJob
getReport
getRequest
getSavedJob
getSmartEmployeesForJob
getTalentPool
getTicket
getTicketDetails
getUserJobCounts
globalSearch
industry
insert
isAdmin
joinRequest
jsonParser
list
listAuditLogs
listCompanyFiles
listCompanyRequests
listConsents
listContexts
listFaq
listFeatures
listHelpArticles
listHelpCategories
listJobReviewQueue
listJobReviews
listJobSavers
listLimits
listMembers
listMyTickets
listNotificationLogs
listPages
listQuestions
listRequests
listTalentRequests
listTemplates
listTickets
listTokens
listTranslations
listUniversities
listUniversityCampuses
listUniversityMembers
logKeyword
login
logout
logoutAll
markAllRead
markJobSafe
markRead
markUnread
matchEmployeeWithJob
me
multerMiddleware
myApplications
myInterviews
myJobInvitations
myRejectedApplications
opportunities
opportunityDetails
optionalAuthUser
overview
partners
passcodeVerify
permissions
previewMyCv
profile
protectHealth
rateApplicant
rateJob
rebuildMyCompanySearchFilters
rebuildMySearchFilters
recommendedJobs
recomputeJobRatingBreakdown
refresh
refreshScore
refreshToken
register
registerEvent
registerToken
rejectCompanyRequest
rejectJob
remove
replaceJobNames
replaceJobTypes
replaceMinSalary
reportJob
requestAccountDeletion
requestDocuments
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
salaryType
saveCvTranslation
saveJob
saveJobTranslation
saveMyCvSettings
saveOpportunity
savedJobs
scoreJob
searchEmployees
seedFreePlan
sendApplicationMessage
sendJobInvitation
sendNotification
services
setActiveContext
setActiveCv
setConsent
share
shared
skills
startStudentVerification
studentVerificationStatus
students
submitJobDocuments
summary
suspendJob
toggleSaveJob
toggleSaveOpportunity
track
tracking
universityLogin
universityOverview
unreadCount
update
updateAboutMe
updateApplicationStatus
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
updateQuestion
updateSectionItem
updateTalentRequestStatus
updateTemplate
updateTicketStatus
updateToken
updateUniversityMember
updateUniversityStatus
updateWorkPreferences
uploadExcel
uploadFile
uploadMyCv
uploadStudentVerificationDocument
userUniversityEmployabilityAnalytics
userUniversityOpportunities
userUniversityOutcomeReport
userUniversityOverview
userUniversityPartners
userUniversityStudentCareerPassport
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
| GET | /public/v1/content/pages | Other | listPages |
| GET | /public/v1/content/pages/:key | Other | getPage |
| GET | /public/v1/faq | Other | listFaq |
| GET | /public/v1/help/articles | Other | listHelpArticles |
| GET | /public/v1/help/articles/:key | Other | getHelpArticle |
| GET | /public/v1/help/categories | Other | listHelpCategories |
| GET | /public/v1/legal/:key | Other | getPage |



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
