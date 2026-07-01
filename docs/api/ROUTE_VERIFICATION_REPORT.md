# Route Verification Report

Generated: 2026-07-01T11:35:30.273Z
Source: live Express app via `express-list-endpoints`.

## Summary

| Metric | Count |
|---|---:|
| Raw Express endpoint entries | 766 |
| Unique method/path endpoints | 950 |
| Endpoints with detected auth/role guard | 834 |
| Known public/system endpoints | 116 |
| Unguarded endpoints needing manual classification | 0 |

Full machine-readable inventory:

```text
docs/api/HALAJOB_ROUTE_INVENTORY.json
```

## Module Counts

| Module | Total | Protected | Known public | Needs classification |
| --- | --- | --- | --- | --- |
| Admin | 290 | 285 | 5 | 0 |
| AI | 12 | 12 | 0 | 0 |
| Analytics | 5 | 5 | 0 | 0 |
| Campus | 18 | 16 | 2 | 0 |
| Campus Student | 51 | 49 | 2 | 0 |
| Company | 181 | 173 | 8 | 0 |
| Files | 1 | 0 | 1 | 0 |
| Health | 4 | 0 | 4 | 0 |
| Jobs | 2 | 2 | 0 | 0 |
| Legacy User | 205 | 127 | 78 | 0 |
| Notifications | 20 | 20 | 0 | 0 |
| Other | 15 | 0 | 15 | 0 |
| Seeker | 102 | 101 | 1 | 0 |
| Trust | 4 | 4 | 0 | 0 |
| University | 40 | 40 | 0 | 0 |

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
cancelPrivacyRequest
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
getCareerPassport
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
getInvoice
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
listCareerPassports
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
listInvoices
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
listUniversityEvents
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
updateUniversityEvent
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

None found.



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
