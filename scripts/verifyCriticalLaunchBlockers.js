import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const exists = (path) => existsSync(join(root, path));
const listFiles = (relativePath) => {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return [];
  return readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = `${relativePath}/${entry.name}`;
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
};

const assertNoFile = (relativePath, message) => {
  assert.equal(exists(relativePath), false, message);
};

const assertNoneMatch = (files, pattern, message) => {
  const offenders = files.filter((file) => pattern.test(read(file)));
  assert.deepEqual(offenders, [], `${message}: ${offenders.join(", ")}`);
};

const jobModel = read("models/JobModel.js");
const jobIndexCalls = [
  ...jobModel.matchAll(
    /JobsSchema\.index\(\s*\{[\s\S]*?\}\s*(?:,\s*\{[\s\S]*?\})?\s*\);/g,
  ),
].map((match) => match[0]);
const textIndexes = jobIndexCalls.filter((indexCall) =>
  /["']text["']/.test(indexCall),
);

assert.equal(
  textIndexes.length,
  1,
  `JobModel must define exactly one MongoDB text index, found ${textIndexes.length}.`,
);
assert.match(textIndexes[0], /name:\s*["']jobs_text_search["']/);
[
  "job_name",
  "description",
  "search_index.title_norm",
  "search_index.text_norm",
  "search_projection.matching.text",
].forEach((field) => {
  assert.ok(
    textIndexes[0].includes(field),
    `jobs_text_search is missing ${field}.`,
  );
});

const refreshTokenModel = read("models/RefreshTokenModel.js");
const userRefBlock =
  refreshTokenModel.match(/userRef:\s*\{[\s\S]*?\n\s*\},/)?.[0] || "";
assert.match(
  userRefBlock,
  /type:\s*mongoose\.Schema\.Types\.ObjectId/,
  "RefreshToken.userRef must be a real ObjectId reference.",
);
assert.match(
  refreshTokenModel,
  /expiresAt:\s*\{[\s\S]*?type:\s*Date/,
  "Refresh tokens must have an expiresAt field.",
);
assert.match(
  refreshTokenModel,
  /expiresAt:\s*1[\s\S]*expireAfterSeconds:\s*0/,
  "Refresh tokens must have a TTL index.",
);
assert.doesNotMatch(
  userRefBlock,
  /type:\s*String/,
  "RefreshToken.userRef must not regress to String.",
);

const migration = read("scripts/migrateRefreshTokenUserRefObjectId.js");
assert.match(migration, /\$type:\s*["']string["']/);
assert.match(migration, /new mongoose\.Types\.ObjectId\(userRefString\)/);
assert.match(migration, /expirationBackfilled/);
assert.match(migration, /deleteOne\(\{\s*_id:\s*token\._id\s*\}\)/);
assert.match(migration, /invalidDeleted/);

const adminResourceController = read(
  "controllers/dash/adminResourceController.js",
);
[
  "role_id",
  "permissions",
  "status",
  "password",
  "owner_user_id",
  "accepted",
  "is_verified",
  "student_profile.student_email_verified",
  "student_profile.university_id",
  "partners",
  "career_center_email",
  "company_id",
  "publish_status",
  "is_accepted",
  "reviewed_by",
].forEach((field) => {
  assert.match(
    adminResourceController,
    new RegExp(`['"]${field}['"]`),
    `Admin resource controller must protect ${field}.`,
  );
});
assert.match(
  adminResourceController,
  /stripProtectedAdminUpdateFields\(sanitizeUpdatePayload\(payload\), config\)/,
);

const validateMiddleware = read("middlewares/validate.js");
assert.match(validateMiddleware, /const validated = await schema\.validate/);
assert.match(validateMiddleware, /req\.body = validated\.body/);
assert.match(validateMiddleware, /req\.params = validated\.params/);
assert.match(validateMiddleware, /req\.query = validated\.query/);

const webPackage = read("web/package.json");
assert.match(
  webPackage,
  /"dompurify"/,
  "Web package must keep DOMPurify for HTML previews.",
);

const authCookieService = read("services/authCookie.service.js");
assert.match(authCookieService, /httpOnly:\s*true/);
assert.match(authCookieService, /sameSite:/);
assert.match(authCookieService, /refreshTokenFromRequest/);
assert.match(authCookieService, /hj_rt_company/);
assert.match(authCookieService, /hj_rt_admin/);

const webApi = read("web/src/shared/api.ts");
assert.doesNotMatch(
  webApi,
  /localStorage\.setItem\(tokenKeys/,
  "Web must not store access tokens in localStorage.",
);
assert.doesNotMatch(
  webApi,
  /localStorage\.setItem\(refreshTokenKeys/,
  "Web must not store refresh tokens in localStorage.",
);
assert.doesNotMatch(
  webApi,
  /localStorage\.getItem\(tokenKeys/,
  "Web requests must not read access tokens from localStorage.",
);
assert.match(webApi, /const accessTokens: Partial<Record<AuthScope, string>>/);
assert.match(webApi, /"x-web-client": "halajob-web"/);
assert.match(webApi, /refreshEndpoints/);

const webHelpers = read("web/src/shared/helpers.ts");
assert.match(
  webHelpers,
  /DOMPurify\.sanitize/,
  "HTML previews must use DOMPurify.",
);
assert.doesNotMatch(
  webHelpers,
  /replace\(\s*\/<script/,
  "Regex-only HTML sanitizers must not return.",
);

const webMain = read("web/src/main.tsx");
assert.match(
  webMain,
  /<ErrorBoundary>/,
  "React root must be wrapped in an error boundary.",
);

const createJobRoleController = read(
  "controllers/app/Jobs/CreateJobRoleController.js",
);
assert.match(createJobRoleController, /catch\s*\(\s*err\s*\)/);
assert.match(createJobRoleController, /next\(err\)/);

const smokeWebPortals = read("scripts/smokeWebPortals.js");
assert.match(smokeWebPortals, /fatalHttpErrors/);
assert.match(smokeWebPortals, /requestFailures/);
assert.match(smokeWebPortals, /throw new Error\(`web_portal_smoke_failed/);

const companyAuthRoute = read("routesCompany/authRoute.js");
[
  "/refresh-token",
  "/logout-all",
  "/sessions",
  "/forgot-password",
  "/passcode-forgot-password",
  "/resetPassword",
  "/reset-password",
].forEach((route) => {
  assert.match(
    companyAuthRoute,
    new RegExp(route.replace(/\//g, "\\/")),
    `Company auth route missing ${route}.`,
  );
});
assert.match(companyAuthRoute, /forceCompanyWebAuthScope/);
assert.match(companyAuthRoute, /companySessionGuard/);

const companyLoginController = read(
  "controllers/companyDash/Auth/loginController.js",
);
assert.match(companyLoginController, /logoutAll/);
assert.match(companyLoginController, /listSessions/);
assert.match(companyLoginController, /revokeSession/);

const mobileAuthService = read(
  "mobile/lib/src/features/auth/auth_service.dart",
);
assert.match(mobileAuthService, /\/company\/v1\/auth\/logout/);
assert.match(mobileAuthService, /\/company\/v1\/auth\/forgot-password/);
assert.match(
  mobileAuthService,
  /\/company\/v1\/auth\/passcode-forgot-password/,
);
assert.match(mobileAuthService, /\/company\/v1\/auth\/resetPassword/);

assert.match(webApi, /\/company\/v1\/auth\/forgot-password/);

const campusController = read("controllers/app/campus/campusController.js");
const campusStudentsStart = campusController.lastIndexOf(
  "const students = async",
);
const campusStudentsEnd = campusController.indexOf(
  "const partners =",
  campusStudentsStart,
);
assert.ok(campusStudentsStart >= 0 && campusStudentsEnd > campusStudentsStart);
const campusStudentsBlock = campusController.slice(
  campusStudentsStart,
  campusStudentsEnd,
);
const campusStudentQueryStart = campusController.indexOf(
  "const campusStudentDirectoryQuery",
);
const campusStudentQueryEnd = campusController.indexOf(
  "const students = async",
  campusStudentQueryStart,
);
assert.ok(
  campusStudentQueryStart >= 0 && campusStudentQueryEnd > campusStudentQueryStart,
);
const campusStudentQueryBlock = campusController.slice(
  campusStudentQueryStart,
  campusStudentQueryEnd,
);
assert.match(campusController, /campus_student_directory_denied/);
assert.match(campusController, /campus_student_directory_viewed/);
assert.match(
  campusController,
  /partners:\s*\{\s*\$elemMatch:\s*\{\s*company_id:/,
);
assert.match(campusStudentQueryBlock, /student_email_verified/);
assert.match(campusStudentQueryBlock, /campus_visibility\.talent_pool_opt_in/);
assert.match(
  campusStudentQueryBlock,
  /campus_visibility\.visible_to_partner_companies/,
);
assert.doesNotMatch(
  campusStudentsBlock,
  /populate\(\{\s*path:\s*["']user_id["'][\s\S]*?select:\s*["'][^"']*\bemail\b/,
  "Company campus student directory must not populate student email.",
);

const employeeModel = read("models/EmployeeModel.js");
assert.match(employeeModel, /campus_discovery_visibility/);
assert.match(employeeModel, /contact_visibility/);
assert.match(employeeModel, /cv_visibility/);
assert.match(employeeModel, /campus_visibility/);
assert.match(employeeModel, /talent_pool_opt_in/);
assert.match(employeeModel, /visible_to_partner_companies/);

const settingsController = read(
  "controllers/settings/SettingsCenterController.js",
);
[
  "getUserSettings",
  "updateUserSettings",
  "getCompanySettings",
  "updateCompanySettings",
  "getUniversitySettings",
  "updateUniversitySettings",
  "getClientSettings",
  "getPlatformSettings",
  "updatePlatformSettings",
].forEach((name) => assert.match(settingsController, new RegExp(name)));
assert.match(settingsController, /loadPlatformSettings/);
assert.match(settingsController, /clientSettingsFromPlatform/);
assert.match(settingsController, /clearPlatformSettingsCache/);

const platformSettingsService = read(
  "services/settings/platformSettings.service.js",
);
const platformFeatureEnvFlags = [
  "FEATURE_AI_TOOLS_ENABLED",
  "FEATURE_CV_PARSING_ENABLED",
  "FEATURE_CV_STUDIO_ENABLED",
  "FEATURE_RESOURCE_LIBRARY_ENABLED",
  "FEATURE_INTERVIEW_PREP_ENABLED",
  "FEATURE_SAVED_SEARCHES_ENABLED",
  "FEATURE_SMS_ENABLED",
  "FEATURE_MANUAL_WHATSAPP_SHARE_ENABLED",
  "FEATURE_OFFICIAL_WHATSAPP_PROVIDER_ENABLED",
  "FEATURE_SALARY_INSIGHTS_ENABLED",
  "FEATURE_CAMPUS_CAREER_CENTER_ENABLED",
  "FEATURE_VIDEO_INTERVIEWS_ENABLED",
  "FEATURE_TALENT_POOL_CRM_ENABLED",
  "FEATURE_EMPLOYER_BRANDING_ENABLED",
  "FEATURE_PAYMENTS_MODE",
  "FEATURE_COMPANY_SELF_REGISTER_ENABLED",
];
[
  "PLATFORM_SETTINGS_DEFAULTS",
  "clientSettingsFromPlatform",
  "loadPlatformSettings",
  "getPlatformSetting",
  "isFeatureEnabled",
  "cv_studio_enabled",
  "manual_whatsapp_share_enabled",
  "official_whatsapp_provider_enabled",
  "salary_insights_enabled",
  "talent_pool_crm_enabled",
  "employer_branding_enabled",
].forEach((name) =>
  assert.match(
    platformSettingsService,
    new RegExp(name),
    `Platform settings service must expose ${name}.`,
  ),
);
platformFeatureEnvFlags.forEach((name) =>
  assert.match(
    platformSettingsService,
    new RegExp(name),
    `Platform settings service must use ${name} as a launch fallback.`,
  ),
);

const platformEnvExample = read(".env.example");
const platformEnvironmentDocs = read("docs/ENVIRONMENT.md");
platformFeatureEnvFlags.forEach((name) => {
  assert.match(platformEnvExample, new RegExp(`^${name}=`, "m"));
  assert.ok(
    platformEnvironmentDocs.includes(`\`${name}\``),
    `docs/ENVIRONMENT.md must document ${name}.`,
  );
});

const envFallbackFeatures = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        import { pathToFileURL } from "node:url";
        const mod = await import(pathToFileURL("services/settings/platformSettings.service.js").href);
        const settings = mod.clientSettingsFromPlatform({});
        console.log(JSON.stringify(settings.features));
      `,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        FEATURE_CV_STUDIO_ENABLED: "false",
        FEATURE_INTERVIEW_PREP_ENABLED: "false",
        FEATURE_SAVED_SEARCHES_ENABLED: "false",
        FEATURE_SMS_ENABLED: "true",
        FEATURE_OFFICIAL_WHATSAPP_PROVIDER_ENABLED: "true",
        FEATURE_TALENT_POOL_CRM_ENABLED: "false",
        FEATURE_EMPLOYER_BRANDING_ENABLED: "false",
        FEATURE_PAYMENTS_MODE: "manual",
        FEATURE_COMPANY_SELF_REGISTER_ENABLED: "false",
      },
    },
  ).trim(),
);
assert.equal(envFallbackFeatures.cv_studio_enabled, false);
assert.equal(envFallbackFeatures.cv_parsing_enabled, false);
assert.equal(envFallbackFeatures.interview_prep_enabled, false);
assert.equal(envFallbackFeatures.saved_searches_enabled, false);
assert.equal(envFallbackFeatures.sms_enabled, true);
assert.equal(envFallbackFeatures.official_whatsapp_provider_enabled, true);
assert.equal(envFallbackFeatures.talent_pool_crm_enabled, false);
assert.equal(envFallbackFeatures.employer_branding_enabled, false);
assert.equal(envFallbackFeatures.payments_mode, "manual");
assert.equal(envFallbackFeatures.company_self_register, false);

const legalContentEnforcement = read(
  "services/content/legalContentEnforcement.service.js",
);
assert.ok(
  platformEnvExample.includes("LEGAL_CONTENT_ENFORCEMENT_MODE=staging"),
  ".env.example must document the legal content enforcement mode default.",
);
assert.ok(
  platformEnvironmentDocs.includes("`LEGAL_CONTENT_ENFORCEMENT_MODE`"),
  "docs/ENVIRONMENT.md must document LEGAL_CONTENT_ENFORCEMENT_MODE.",
);
assert.match(legalContentEnforcement, /REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS/);
assert.match(legalContentEnforcement, /lawyer_approved/);
assert.match(legalContentEnforcement, /productionLegalApprovalFailures/);
assert.match(legalContentEnforcement, /filterPublicLegalContent/);

const userRoutes = read("routesUser/index.js");
const companyRoutes = read("routesCompany/index.js");
const universityRoutes = read("routesUniversity/index.js");
const adminRoutes = read("routes/index.js");
const publicRoutes = read("routesPublic/index.js");
assert.match(userRoutes, /router\.use\(['"]\/settings['"]/);
assert.match(companyRoutes, /router\.use\(["']\/settings["']/);
assert.match(universityRoutes, /["']\/settings["']/);
assert.match(adminRoutes, /["']\/platform\/settings["']/);
const platformSettingsRouteBlock =
  adminRoutes.match(
    /router\.get\(\s*["']\/platform\/settings["'][\s\S]*?SettingsCenterController\.getPlatformSettings,\s*\);/,
  )?.[0] || "";
const platformSettingsSchemaRouteBlock =
  adminRoutes.match(
    /router\.get\(\s*["']\/platform\/settings\/schema["'][\s\S]*?SettingsCenterController\.getPlatformSettingsSchema,\s*\);/,
  )?.[0] || "";
assert.match(platformSettingsRouteBlock, /settings\.view/);
assert.match(platformSettingsRouteBlock, /settings\.manage/);
assert.doesNotMatch(
  platformSettingsRouteBlock,
  /dashboard\.view/,
  "Dashboard-only admins must not read full platform launch settings.",
);
assert.match(platformSettingsSchemaRouteBlock, /settings\.view/);
assert.match(platformSettingsSchemaRouteBlock, /settings\.manage/);
assert.doesNotMatch(
  platformSettingsSchemaRouteBlock,
  /dashboard\.view/,
  "Dashboard-only admins must not read platform settings schema.",
);
assert.match(publicRoutes, /["']\/client-settings["']/);
assert.match(publicRoutes, /["']\/settings\/client["']/);
assert.match(publicRoutes, /getClientSettings/);

const webSettings = read("web/src/shared/settings.tsx");
assert.match(webSettings, /ai_tools:\s*["']false["']/);
assert.match(webSettings, /default_currency:\s*["']SYP["']/);

const webFeatureFlags = read("web/src/shared/featureFlags.ts");
assert.match(webFeatureFlags, /clientFeatureEnabledFromSettings/);
[
  "cv_studio_enabled",
  "resource_library_enabled",
  "interview_prep_enabled",
  "saved_searches_enabled",
  "salary_insights_enabled",
  "campus_career_center_enabled",
  "video_interviews_enabled",
  "talent_pool_crm_enabled",
  "employer_branding_enabled",
].forEach((featureKey) => {
  assert.ok(
    webFeatureFlags.includes(featureKey),
    `Web client settings helper must understand ${featureKey}.`,
  );
});

const seekerWebSource = read("web/src/seeker/screens.tsx");
const campusWebSource = read("web/src/campus/screens.tsx");
const companyWebSource = read("web/src/company/screens.tsx");
assert.match(seekerWebSource, /clientFeatureEnabledFromSettings/);
assert.match(campusWebSource, /clientFeatureEnabledFromSettings/);
assert.match(companyWebSource, /clientFeatureEnabledFromSettings/);

const syriaFirstUiFiles = [
  "web/src/shared/settings.tsx",
  "web/src/company/screens.tsx",
  "web/src/campus/screens.tsx",
  "mobile/lib/src/features/company/company_dashboard_service.dart",
  "mobile/lib/src/features/company/company_dashboard_screen.dart",
  "mobile/lib/src/features/dashboard/dashboard_screen.dart",
  "mobile/lib/src/l10n/hala_job_localizations.dart",
];
const syriaFirstUiSource = syriaFirstUiFiles.map(read).join("\n");
[
  "Damascus",
  "SYP",
  "Asia/Damascus",
  "+963",
  "Syria",
].forEach((value) => {
  assert.ok(
    syriaFirstUiSource.includes(value),
    `Syria-first UI defaults must include ${value}.`,
  );
});
[
  "Riyadh",
  "SAR",
  "+966",
  "SA, AE",
  "Asia/Riyadh",
  "Saudi Arabia",
  "United Arab Emirates",
  "GBP 11k",
  "USD 10k",
].forEach((value) => {
  assert.equal(
    syriaFirstUiSource.includes(value),
    false,
    `Launch-facing UI defaults must not regress to ${value}.`,
  );
});

const mobileApp = read("mobile/lib/src/app.dart");
assert.match(mobileApp, /fetchClientFeatureSettings/);
assert.match(mobileApp, /_clientFeatureSettings/);
const aiToolsGate =
  mobileApp.match(/bool get _aiToolsEnabled \{[\s\S]*?\n  \}/)?.[0] || "";
assert.match(aiToolsGate, /_compiledAiToolsEnabled/);
assert.match(aiToolsGate, /_clientFeatureSettings\.aiToolsEnabled/);
assert.match(aiToolsGate, /allowsAiToolsInspectionFallback/);

[
  "UserSettingsModel",
  "CompanySettingsModel",
  "UniversitySettingsModel",
  "PlatformSettingsModel",
  "CampusOpportunityModel",
].forEach((modelName) =>
  assert.match(read("models/index.js"), new RegExp(modelName)),
);

const campusOpportunityModel = read("models/CampusOpportunityModel.js");
assert.match(campusOpportunityModel, /collection:\s*["']campus_opportunities["']/);
assert.match(campusOpportunityModel, /lifecycle_status/);
assert.match(campusOpportunityModel, /request_status/);
assert.match(campusOpportunityModel, /company_request/);

const createCompanyOpportunityStart = campusController.indexOf(
  "const createCompanyOpportunity = async",
);
const createCompanyOpportunityEnd = campusController.indexOf(
  "const profile = async",
  createCompanyOpportunityStart,
);
assert.ok(
  createCompanyOpportunityStart >= 0 &&
    createCompanyOpportunityEnd > createCompanyOpportunityStart,
  "Campus company opportunity create block must be present.",
);
const createCompanyOpportunityBlock = campusController.slice(
  createCompanyOpportunityStart,
  createCompanyOpportunityEnd,
);
assert.match(createCompanyOpportunityBlock, /CampusOpportunityModel\.create/);
assert.doesNotMatch(
  createCompanyOpportunityBlock,
  /JobZainTalentRequestModel\.create/,
  "Company campus opportunities must use CampusOpportunityModel, not AI talent requests.",
);
assert.match(campusController, /source:\s*["']campus_opportunity["']/);

const companyJobRouteSource = read("routesCompany/jobRoute.js");
const companyTalentPoolRouteSource = read("routesCompany/talentPoolRoute.js");
const companyTalentPoolController = read(
  "controllers/companyDash/companyTalentPoolController.js",
);
assert.match(
  companyRoutes,
  /router\.use\(["']\/talent-pool["'],\s*approvedCompanyGuard,\s*talentPoolRoute\)/,
  "Company API must keep the richer /company/v1/talent-pool CRM route mounted.",
);
assert.match(
  companyJobRouteSource,
  /router\.get\(["']\/hiring\/talent-pool["'],\s*requireCompanyPermission\(["']ats\.view["']\)[\s\S]{0,160}controllerHiring\.getTalentPool\)/,
  "Legacy /company/v1/jobs/hiring/talent-pool must remain compatible for existing clients.",
);
[
  [/router\.get\(["']\/["'][\s\S]{0,220}controller\.listTalentPool/, "list candidates"],
  [/router\.get\(["']\/search["'][\s\S]{0,220}controller\.searchTalentPool/, "search candidates"],
  [/router\.post\(["']\/candidates["'][\s\S]{0,220}controller\.saveCandidate/, "save candidates"],
  [/router\.get\(["']\/candidates\/:id["'][\s\S]{0,220}controller\.getCandidateDetails/, "candidate details"],
  [/router\.patch\(["']\/candidates\/:id["'][\s\S]{0,220}controller\.updateCandidate/, "candidate updates"],
  [/router\.delete\(["']\/candidates\/:id["'][\s\S]{0,220}controller\.archiveCandidate/, "candidate archive"],
  [/router\.post\(["']\/candidates\/:id\/notes["'][\s\S]{0,220}controller\.addCandidateNote/, "notes"],
  [/router\.get\(["']\/candidates\/:id\/notes["'][\s\S]{0,220}controller\.listCandidateNotes/, "note history"],
  [/router\.post\(["']\/candidates\/:id\/tags["'][\s\S]{0,220}controller\.addCandidateTags/, "tags"],
  [/router\.delete\(["']\/candidates\/:id\/tags\/:tag["'][\s\S]{0,220}controller\.removeCandidateTag/, "tag removal"],
  [/router\.post\(["']\/candidates\/:id\/invite-to-job["'][\s\S]{0,240}controller\.inviteCandidateToJob/, "job invites"],
  [/router\.post\(["']\/candidates\/:id\/do-not-contact["'][\s\S]{0,240}controller\.markDoNotContact/, "do-not-contact"],
].forEach(([pattern, label]) => {
  assert.match(
    companyTalentPoolRouteSource,
    pattern,
    `Talent-pool CRM route is missing ${label}.`,
  );
});
[
  "CompanySavedCandidateModel",
  "CompanyCandidateNoteModel",
  "CompanyCandidateTagModel",
  "UserApplyingJobModel",
  "JobInvitationModel",
  "UniversityModel",
].forEach((modelName) =>
  assert.match(companyTalentPoolController, new RegExp(modelName)),
);
assert.match(companyTalentPoolController, /resolveCandidateAccess/);
assert.match(companyTalentPoolController, /isCampusVisibleToCompany/);
assert.match(
  companyTalentPoolController,
  /UserApplyingJobModel\.findOne\(\{\s*_id:\s*applicationId,\s*company_id:\s*companyId/,
  "Saving from an application must stay scoped to the company application.",
);
assert.match(
  companyTalentPoolController,
  /JobInvitationModel\.findOne\(\{[\s\S]{0,120}company_id:\s*companyId,[\s\S]{0,120}status:\s*["']accepted["']/,
  "Saving from an invitation must require an accepted invitation from the same company.",
);
[
  "student_email_verified",
  "talent_pool_opt_in",
  "visible_to_partner_companies",
  "profile_visibility === \"private\"",
  "candidate_not_visible_to_company",
].forEach((guard) =>
  assert.ok(
    companyTalentPoolController.includes(guard),
    `Talent-pool campus access guard is missing ${guard}.`,
  ),
);
assert.match(
  companyTalentPoolController,
  /UniversityModel\.exists\(\{[\s\S]{0,160}partners:\s*\{\s*\$elemMatch:\s*activeCampusPartnerMatch\(companyId\)/,
  "Campus talent-pool saves must require an active university partner relationship.",
);

// Syria-first handout architecture invariants: extend existing systems rather
// than introducing parallel CV, interview, salary, resource, or branding stacks.
assertNoFile(
  "models/VideoInterviewModel.js",
  "Live interviews must extend InterviewModel; VideoInterviewModel must not be created.",
);
assertNoFile(
  "models/CompanyPublicProfileModel.js",
  "Employer branding must extend CompanyModel; duplicate public company profile models are not allowed.",
);

const modelsIndex = read("models/index.js");
assert.doesNotMatch(modelsIndex, /VideoInterviewModel/);
assert.doesNotMatch(modelsIndex, /CompanyPublicProfileModel/);

const cvStudioFiles = [
  "routesEmployee/cvRoute.js",
  "controllers/employeeDash/cv/cvStudioController.js",
  "services/cvStudio/cvQuality.service.js",
  "services/cvStudio/coverLetterTemplate.service.js",
  "services/cvParsing/cvParseApply.service.js",
];
const cvStudioSource = cvStudioFiles.map(read).join("\n");
assert.match(cvStudioSource, /EmployeeCvModel/);
assert.match(cvStudioSource, /CvTemplateModel/);
assert.doesNotMatch(
  cvStudioSource,
  /\bResumeModel\b|\bUserResumeModel\b/,
  "New CV Studio/parsing code must not expand legacy ResumeModel/UserResumeModel.",
);

const salaryInsightFiles = [
  ...listFiles("services/salaryInsights"),
  "controllers/salaryInsights/SalaryInsightsController.js",
  "routesPublic/SalaryInsightsRoute.js",
  "routesUser/SalaryInsightsRote.js",
  "routesCompany/salaryInsightsRoute.js",
].filter((file) => exists(file));
assertNoneMatch(
  salaryInsightFiles,
  /JobSalaryModel/,
  "Salary insights must use JobModel.salary and not JobSalaryModel lookup data",
);
const salaryAggregateService = read(
  "services/salaryInsights/salaryAggregate.service.js",
);
assert.match(salaryAggregateService, /jobsModel/);
assert.match(salaryAggregateService, /"salary\.is_visible"/);
assert.match(salaryAggregateService, /"salary\.mode"/);
assert.match(salaryAggregateService, /"salary\.min"/);
assert.match(salaryAggregateService, /"salary\.max"/);

const adminRoutesSource = read("routes/index.js");
assert.match(adminRoutesSource, /["']\/learning-resources["']/);
assert.doesNotMatch(
  adminRoutesSource,
  /["']\/resources["'][\s\S]{0,160}LearningResourceAdminController/,
  "Learning resources must not be mounted at /dash/v1/resources.",
);

const interviewFiles = [
  "routesCompany/interviewRoute.js",
  "controllers/companyDash/companyWithJobs/companyJobHiringController.js",
  "controllers/employeeDash/employeeWithJobs/employeeWithJobsController.js",
];
const interviewSource = interviewFiles.map(read).join("\n");
assert.match(interviewSource, /InterviewModel/);
assert.doesNotMatch(interviewSource, /VideoInterviewModel/);

const companyBrandingFiles = [
  "models/CompanyModel.js",
  "services/companyPublicProfile.service.js",
  "controllers/companyDash/companyPublicProfileController.js",
  "controllers/dash/CompanyPublicProfileAdminController.js",
  "controllers/public/companyPublicController.js",
  "routesCompany/profileRoute.js",
  "routesPublic/index.js",
];
const companyBrandingSource = companyBrandingFiles.map(read).join("\n");
assert.match(companyBrandingSource, /public_profile/);
assert.match(companyBrandingSource, /CompanyModel/);
assert.doesNotMatch(companyBrandingSource, /CompanyPublicProfileModel/);

const universityModel = read("models/UniversityModel.js");
assert.match(universityModel, /const UniversityPartnerSchema/);
assert.match(universityModel, /partners/);
assert.match(universityModel, /allowed_departments/);
assert.match(universityModel, /access_level/);

const communicationService = read("services/communication/communication.service.js");
const notificationPreferenceService = read(
  "services/notifications/notificationPreference.service.js",
);
assert.match(communicationService, /manual_whatsapp/);
assert.match(communicationService, /official_whatsapp_disabled/);
assert.match(notificationPreferenceService, /whatsapp_business:\s*false/);
assert.match(
  notificationPreferenceService,
  /if \(channel === "whatsapp_business" && !officialWhatsappBusinessEnabled\(\)\)/,
);

const envExample = read(".env.example");
[
  "FEATURE_AI_TOOLS_ENABLED=false",
  "FEATURE_CV_PARSING_ENABLED=true",
  "FEATURE_CV_STUDIO_ENABLED=true",
  "FEATURE_RESOURCE_LIBRARY_ENABLED=true",
  "FEATURE_INTERVIEW_PREP_ENABLED=true",
  "FEATURE_SAVED_SEARCHES_ENABLED=true",
  "FEATURE_SMS_ENABLED=false",
  "FEATURE_SALARY_INSIGHTS_ENABLED=true",
  "FEATURE_CAMPUS_CAREER_CENTER_ENABLED=true",
  "FEATURE_VIDEO_INTERVIEWS_ENABLED=true",
  "FEATURE_TALENT_POOL_CRM_ENABLED=true",
  "FEATURE_EMPLOYER_BRANDING_ENABLED=true",
  "FEATURE_MANUAL_WHATSAPP_SHARE_ENABLED=true",
  "FEATURE_OFFICIAL_WHATSAPP_PROVIDER_ENABLED=false",
  "FEATURE_PAYMENTS_MODE=manual",
  "FEATURE_COMPANY_SELF_REGISTER_ENABLED=true",
  "CV_PARSER_PROVIDER=manual",
  "CV_PARSER_API_KEY=",
  "CV_PARSER_API_URL=",
  "CV_PARSE_JOB_TTL_DAYS=30",
  "SMS_PROVIDER=disabled",
  "SMS_API_KEY=",
  "SMS_API_URL=",
  "COMMUNICATION_LOG_RETENTION_DAYS=180",
  "SALARY_INSIGHTS_MIN_SAMPLE_SIZE=3",
  "SALARY_INSIGHTS_CACHE_TTL_SECONDS=3600",
  "SALARY_INSIGHTS_DEFAULT_CURRENCY=SYP",
  "PUBLIC_COMPANY_PROFILE_BASE_URL=",
  "PUBLIC_CV_SHARE_BASE_URL=",
  "LEGAL_CONTENT_ENFORCEMENT_MODE=staging",
].forEach((line) =>
  assert.ok(envExample.includes(line), `.env.example is missing ${line}`),
);

console.log("Critical launch blocker guard passed.");
