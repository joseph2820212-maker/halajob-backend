import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const app = read("mobile/lib/src/app.dart");
const cards = read("mobile/lib/src/widgets/hala_cards.dart");
const company = read(
  "mobile/lib/src/features/company/company_dashboard_screen.dart",
);
const dashboard = read(
  "mobile/lib/src/features/dashboard/dashboard_screen.dart",
);
const university = read(
  "mobile/lib/src/features/university/university_dashboard_screen.dart",
);
const universityService = read(
  "mobile/lib/src/features/university/university_dashboard_service.dart",
);
const authScreen = read("mobile/lib/src/features/auth/auth_screen.dart");
const authService = read("mobile/lib/src/features/auth/auth_service.dart");
const clientFeatureSettings = read(
  "mobile/lib/src/core/config/client_feature_settings.dart",
);
const appShell = read("mobile/lib/src/app.dart");
const buildAndroid = read("mobile/scripts/build-android.ps1");
const mobileCi = read(".github/workflows/flutter-mobile-ci.yml");
const plist = read("mobile/ios/Runner/Info.plist");

function assertContains(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

function assertNotContains(source, needle, label) {
  assert.ok(!source.includes(needle), `${label} should not contain: ${needle}`);
}

function extractClass(source, className) {
  const index = source.indexOf(`class ${className}`);
  assert.ok(index >= 0, `missing class ${className}`);
  const nextClass = source.indexOf("\nclass ", index + 1);
  return nextClass >= 0 ? source.slice(index, nextClass) : source.slice(index);
}

const header = extractClass(cards, "HalaNativeHeader");
const normalizedHeader = header.replace(/\r\n/g, "\n");
const iconButton = extractClass(cards, "HalaHeaderIconButton");
const menuButton = extractClass(cards, "HalaHeaderMenuButton");
const brand = extractClass(cards, "_HalaHeaderBrand");
const bottomNav = extractClass(cards, "HalaBottomNav");
const bottomNavItem = extractClass(cards, "_HalaBottomNavItem");
const normalizedBottomNavItem = bottomNavItem.replace(/\r\n/g, "\n");
const companyHeader = extractClass(company, "_CompanyHeader");
const companyMorePanel = extractClass(company, "_CompanyMorePanel");
const normalizedDashboard = dashboard.replace(/\r\n/g, "\n");

assertContains(
  app,
  "_AdaptiveOrientationPolicy",
  "mobile app orientation policy",
);
assertContains(
  app,
  "shortestSide >= _tabletShortestSide",
  "tablet breakpoint policy",
);
assertContains(app, "DeviceOrientation.values", "tablet landscape policy");
assertNotContains(
  app,
  "await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);",
  "mobile app startup",
);
assertContains(
  plist,
  "UIInterfaceOrientationLandscapeLeft",
  "iPad orientation plist",
);
assertContains(
  plist,
  "UIInterfaceOrientationLandscapeRight",
  "iPad orientation plist",
);

assertContains(
  cards,
  "const double halaHeaderBrandMarkSize = 22;",
  "section 3 header constants",
);
assertContains(
  cards,
  "const double halaHeaderActionSize = 36;",
  "section 3 header constants",
);
assertContains(header, "color: halaNavy", "HalaNativeHeader");
assertContains(
  header,
  "AnnotatedRegion<SystemUiOverlayStyle>",
  "HalaNativeHeader",
);
assertContains(
  header,
  "statusBarIconBrightness: Brightness.light",
  "HalaNativeHeader",
);
assertContains(
  header,
  "halaOrange.withValues(alpha: 0.28)",
  "HalaNativeHeader",
);
assertContains(
  iconButton,
  "this.size = halaHeaderActionSize",
  "HalaHeaderIconButton",
);
assertContains(
  iconButton,
  ": halaHeaderBtnBg",
  "HalaHeaderIconButton",
);
assertContains(iconButton, "? halaHeaderFg", "HalaHeaderIconButton");
assertContains(
  menuButton,
  "this.size = halaHeaderActionSize",
  "HalaHeaderMenuButton",
);
assertContains(
  menuButton,
  "child: Icon(icon, color: halaHeaderFg",
  "HalaHeaderMenuButton",
);
assertContains(brand, "size: halaHeaderBrandMarkSize", "header brand");
assertContains(brand, "leftColor: halaCreamSoft", "header brand");

assertContains(
  cards,
  "class HalaBottomNav extends StatelessWidget",
  "shared bottom nav",
);
assertContains(
  bottomNavItem,
  "color: active ? halaOrange : Colors.transparent",
  "bottom nav selected indicator color",
);
assertContains(
  normalizedBottomNavItem,
  "Icon(\n                      active ? destination.activeIcon : destination.icon",
  "bottom nav icon before selected indicator",
);
assertContains(
  normalizedBottomNavItem,
  "const SizedBox(height: 3),\n                    Container(\n                      width: 22,\n                      height: 4",
  "bottom nav selected indicator must sit under the icon",
);
assertContains(
  normalizedBottomNavItem,
  "const SizedBox(height: 3),\n                    Text(",
  "bottom nav label after selected indicator",
);
assertNotContains(
  bottomNavItem,
  "Positioned(",
  "bottom nav selected indicator should not be pinned to the top edge",
);
assertContains(
  normalizedHeader,
  "if (leading != null) ...[leading!, const SizedBox(width: 6)]",
  "title header back button alignment",
);
assert.ok(
  /Expanded\(\s+child:\s+showBrand/.test(normalizedHeader),
  "title header title alignment missing Expanded showBrand branch",
);
assertNotContains(
  dashboard,
  "class _HalaBottomNavItem",
  "dashboard duplicate nav item",
);
assertNotContains(
  company,
  "class _CompanyBottomNavItem",
  "company duplicate nav item",
);
assertNotContains(
  university,
  "class _UniversityBottomNavItem",
  "university duplicate nav item",
);
assertContains(
  university,
  "key: const ValueKey('university-header-notifications')",
  "university header notifications",
);
assertContains(
  university,
  "child: _UniversityNotificationsScreen(",
  "university notifications screen",
);
assertNotContains(
  university,
  "child: const _UniversityNotificationsScreen()",
  "university notifications placeholder",
);
assertContains(
  universityService,
  "Future<UniversityNotificationsSnapshot> loadNotifications",
  "university notification backend loading",
);
assertContains(
  universityService,
  "'/notifications/v1/list'",
  "university notification backend loading",
);
assertContains(
  universityService,
  "Future<void> markAllNotificationsRead",
  "university notification actions",
);
assertContains(
  dashboard,
  "const _DashboardTab({",
  "dashboard stable tab model",
);
assertContains(
  dashboard,
  "required this.keyId",
  "dashboard stable tab model",
);
assertContains(
  dashboard,
  "key: ValueKey('bottom-nav-${tab.keyId}')",
  "dashboard stable bottom nav keys",
);
assertContains(dashboard, "keyId: 'home'", "dashboard stable tab keys");
assertContains(dashboard, "keyId: 'jobs'", "dashboard stable tab keys");
assertContains(dashboard, "keyId: 'my-jobs'", "dashboard stable tab keys");
assertContains(dashboard, "keyId: 'opportunities'", "dashboard stable tab keys");
assertContains(dashboard, "keyId: 'events'", "dashboard stable tab keys");
assertContains(
  dashboard,
  "keyId: 'my-applications'",
  "dashboard stable tab keys",
);
assertContains(dashboard, "keyId: 'more'", "dashboard stable tab keys");
assertContains(
  dashboard,
  "key: const ValueKey('dashboard-header-notifications')",
  "dashboard header",
);
assertContains(
  dashboard,
  "static const Set<String> _chromeQuickActionIds",
  "dashboard chrome quick action filter",
);
assertContains(
  dashboard,
  "_chromeQuickActionIds.contains(_normalizedQuickActionId(action))",
  "dashboard overview chrome quick action filter",
);
assertContains(
  dashboard,
  "static const Set<String> _morePrimaryFlowActionIds = {",
  "dashboard More primary flow filter",
);
[
  "'browse_jobs'",
  "'saved_jobs'",
  "'applications'",
  "'campus_feed'",
  "'campus_events'",
  "'campus_resources'",
].forEach((id) =>
  assertContains(dashboard, id, "dashboard More primary flow filter"),
);
assertContains(
  dashboard,
  "if (_morePrimaryFlowActionIds.contains(actionId))",
  "dashboard More primary flow filter",
);
assertContains(
  dashboard,
  "'Career tools': <_QuickActionItem>[]",
  "dashboard More canonical sections",
);
assertContains(
  dashboard,
  "'Account': <_QuickActionItem>[]",
  "dashboard More canonical sections",
);
assertContains(
  dashboard,
  "'Support & legal': <_QuickActionItem>[]",
  "dashboard More canonical sections",
);
assertContains(
  dashboard,
  "final showBottomRemoteSync",
  "dashboard sync placement",
);
assertContains(
  normalizedDashboard,
  "_buildPanel(context),\n                            if (showBottomRemoteSync)",
  "dashboard sync placement",
);
assertNotContains(
  dashboard,
  "showInlineSyncFeedback",
  "dashboard sync placement",
);
assertContains(
  dashboard,
  "_CampusSegment.saved",
  "campus saved tab segment",
);
assertContains(
  dashboard,
  "'Saved campus roles'",
  "campus saved tab title",
);

assertContains(
  companyHeader,
  "key: const ValueKey('company-header-notifications')",
  "company header",
);
assertContains(
  companyHeader,
  "tooltip: loc.t('notifications')",
  "company header",
);
assertContains(
  companyHeader,
  "key: const ValueKey('company-header-profile')",
  "company header",
);
assertContains(
  companyHeader,
  "tooltip: loc.t('profile')",
  "company header",
);
assertContains(
  companyHeader,
  "key: const ValueKey('company-header-settings')",
  "company header",
);
assertContains(
  companyHeader,
  "tooltip: loc.t('settings')",
  "company header",
);
assertContains(
  companyHeader,
  "key: const ValueKey('company-header-switch-account')",
  "company header",
);
assertNotContains(
  companyHeader,
  "ValueKey('company-header-account-menu')",
  "company header",
);
assertNotContains(
  companyHeader,
  "ValueKey('company-account-menu-profile-settings')",
  "company header",
);
assertNotContains(
  companyHeader,
  "ValueKey('company-account-menu-account-settings')",
  "company header",
);
assertNotContains(
  companyHeader,
  "ValueKey('company-account-menu-sign-out')",
  "company header",
);
assertNotContains(
  companyHeader,
  "ValueKey('company-account-menu-settings-item')",
  "company header account menu",
);
assertNotContains(
  companyHeader,
  "_CompanyHeaderAction.settings",
  "company header account menu",
);
assertContains(
  company,
  "1 => _CompanyJobsPanel(",
  "company canonical tab panels",
);
assertContains(
  company,
  "2 => _CompanyApplicantsPanel(",
  "company canonical tab panels",
);
assertContains(
  company,
  "? _CompanyTalentPanel(",
  "company canonical tab panels",
);
assertContains(
  company,
  "title: HalaJobLocalizations.of(context).t('accountAndSettings')",
  "company account settings title",
);
assertContains(
  company,
  "loc.t('accountAndSettings')",
  "company account settings screen",
);
assertContains(
  company,
  "key: const ValueKey('company-account-sign-out-button')",
  "company account settings sign out",
);
assertContains(
  company,
  "aiToolsEnabled: widget.aiToolsEnabled",
  "company AI flag propagation",
);
assertContains(
  companyMorePanel,
  "if (aiToolsEnabled)",
  "company AI tools are feature-flagged",
);
assertContains(
  companyMorePanel,
  "moduleSection('AI tools', aiModules)",
  "company AI tools stay grouped when enabled",
);
[
  "moduleSection('Company files', fileModules)",
  "moduleSection('Support', supportModules)",
  "moduleSection('Account', accountModules)",
  "moduleSection('Team and templates', teamModules)",
].forEach((needle) =>
  assertContains(companyMorePanel, needle, "company More canonical sections"),
);
[
  "title: 'Hiring dashboard'",
  "title: 'Recent jobs'",
  "title: 'Recent applicants'",
  "title: 'Hiring pipeline'",
  "title: 'Talent pool'",
  "title: 'Invitations'",
  "title: 'Talent help'",
].forEach((needle) =>
  assertNotContains(
    companyMorePanel,
    needle,
    "company More should not duplicate primary tabs",
  ),
);
assertNotContains(
  companyMorePanel,
  "title: 'AI job drafts'",
  "company AI tools should not be spread into separate More cards",
);
assertNotContains(
  companyMorePanel,
  "title: 'Shortlist explanations'",
  "company AI tools should not be spread into separate More cards",
);
assertNotContains(
  companyMorePanel,
  "title: 'Hiring messages'",
  "company AI tools should not be spread into separate More cards",
);
assertContains(
  company,
  "target.contains('company_profile')",
  "company notification target routing",
);
assertContains(
  company,
  "target.contains('account_setting')",
  "company notification target routing",
);

assertContains(authScreen, "resizeToAvoidBottomInset: true", "auth keyboard layout");
assertContains(
  authScreen,
  "const _passcodeLength = 5;",
  "auth OTP length",
);
assertContains(
  authScreen,
  "ValueKey('verification-code-input')",
  "auth OTP input",
);
assertContains(authScreen, "Positioned.fill", "auth OTP input overlay");
assertContains(
  authScreen,
  "FilteringTextInputFormatter.digitsOnly",
  "auth OTP digit formatter",
);
assertContains(
  authScreen,
  "LengthLimitingTextInputFormatter(_passcodeLength)",
  "auth OTP length formatter",
);
assertContains(
  authScreen,
  "'login-identifier-${_selectedRole.id}-${_usesLocalCampusAuth ? 'local' : 'remote'}'",
  "auth login identifier field key",
);
assertContains(
  authScreen,
  "'login-password-${_selectedRole.id}-${_usesLocalCampusAuth ? 'local' : 'remote'}'",
  "auth login password field key",
);
assertContains(authScreen, "style: halaInputTextStyle", "auth editable text style");

assertContains(
  authService,
  "role == AppRole.company",
  "mobile company auth routing",
);
assertContains(
  authService,
  "'/company/v1/auth/logout'",
  "mobile company logout routing",
);
assertContains(
  authService,
  "'/company/v1/auth/forgot-password'",
  "mobile company recovery routing",
);
assertContains(
  authService,
  "'/company/v1/auth/passcode-forgot-password'",
  "mobile company recovery routing",
);
assertContains(
  authService,
  "'/company/v1/auth/resetPassword'",
  "mobile company recovery routing",
);
assertContains(
  authService,
  "'/public/v1/client-settings'",
  "mobile canonical public client settings route",
);
assertContains(
  authService,
  "'/public/v1/settings/client'",
  "mobile legacy public client settings fallback",
);
assertContains(
  clientFeatureSettings,
  "'ai_tools_enabled'",
  "mobile AI flag should prefer DB-backed enabled key",
);
assertContains(
  clientFeatureSettings,
  "'ai_tools'",
  "mobile AI flag legacy fallback",
);
assertContains(
  authService,
  "Future<ClientFeatureSettings> fetchClientFeatureSettings",
  "mobile full client feature settings loader",
);
[
  "cvStudioEnabled",
  "resourceLibraryEnabled",
  "interviewPrepEnabled",
  "savedSearchesEnabled",
  "salaryInsightsEnabled",
  "campusCareerCenterEnabled",
  "talentPoolCrmEnabled",
  "employerBrandingEnabled",
].forEach((name) =>
  assertContains(
    clientFeatureSettings,
    name,
    `mobile client feature setting ${name}`,
  ),
);
assertContains(
  appShell,
  "_clientFeatureSettings",
  "mobile app-shell cached client feature settings",
);
assertContains(
  dashboard,
  "_isQuickActionFeatureEnabled",
  "mobile seeker/campus feature guard",
);
assertContains(
  company,
  "talentPoolCrmEnabled",
  "mobile company talent-pool feature guard",
);
assertContains(appShell, "role: session.role", "mobile role-aware logout");
assertContains(buildAndroid, "[switch]$EnableAiTools", "mobile AI tester build flag");
assertContains(
  buildAndroid,
  "--dart-define=FEATURE_AI_TOOLS_ENABLED=$($EnableAiTools.IsPresent.ToString().ToLowerInvariant())",
  "mobile AI tester build flag",
);
assertContains(buildAndroid, "aiToolsEnabled = $AiToolsEnabled", "mobile AI APK metadata");
assertContains(
  mobileCi,
  "--dart-define=FEATURE_AI_TOOLS_ENABLED=true --dart-define=HALA_APP_BUILD_MODE=ci-tester",
  "mobile CI tester AI build flag",
);

const sourceFiles = [
  "mobile/lib/src/features/dashboard/dashboard_screen.dart",
  "mobile/lib/src/features/company/company_dashboard_screen.dart",
  "mobile/lib/src/features/university/university_dashboard_screen.dart",
  "mobile/lib/src/features/auth/auth_screen.dart",
  "mobile/lib/src/features/legal_help/legal_help_screens.dart",
];
const directUiText =
  /Text\(\s*['"](?:Settings|Profile|Notifications|Sign out|Switch account|Account settings|Save settings|Refresh|Back|Close)['"]/;
const bannedFixedChoiceControls = [
  "DropdownButton",
  "DropdownMenu",
  "DropdownMenuItem",
];
for (const file of sourceFiles) {
  const source = read(file);
  assert.ok(
    !directUiText.test(source),
    `${file} has direct hardcoded chrome text; use HalaJobLocalizations`,
  );
  assertNotContains(source, "AppLocalizations", file);
  for (const banned of bannedFixedChoiceControls) {
    assertNotContains(
      source,
      banned,
      `${file} fixed-choice UI contract`,
    );
  }
}

console.log(
  "Mobile UI contract verified for tablet orientation, locked navy header chrome, shared bottom nav, fixed-choice controls, and localized chrome strings.",
);
