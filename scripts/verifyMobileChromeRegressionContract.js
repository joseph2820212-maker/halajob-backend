import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const widgets = read("mobile/lib/src/widgets/hala_cards.dart");
const dashboard = read("mobile/lib/src/features/dashboard/dashboard_screen.dart");
const company = read("mobile/lib/src/features/company/company_dashboard_screen.dart");
const university = read(
  "mobile/lib/src/features/university/university_dashboard_screen.dart",
);
const widgetTest = read("mobile/test/widget_test.dart");

function assertContains(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

function assertNotContains(source, needle, label) {
  assert.ok(!source.includes(needle), `${label} should not contain: ${needle}`);
}

function assertOccurrenceCount(source, needle, expected, label) {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count = Array.from(source.matchAll(new RegExp(escaped, "g"))).length;
  assert.equal(
    count,
    expected,
    `${label} expected ${expected} occurrence(s) of ${needle} but found ${count}`,
  );
}

function assertOrder(source, ordered, label) {
  let position = -1;
  for (const needle of ordered) {
    const nextPosition = source.indexOf(needle, position + 1);
    assert.ok(
      nextPosition >= 0,
      `${label} missing ordered text after ${position}: ${needle}`,
    );
    position = nextPosition;
  }
}

function extractClass(source, className) {
  const match = new RegExp(`class\\s+${className}\\b`).exec(source);
  assert.ok(match, `missing class ${className}`);
  const index = match.index;
  const nextClass = source.indexOf("\nclass ", index + 1);
  return nextClass >= 0 ? source.slice(index, nextClass) : source.slice(index);
}

function extractBetween(source, start, end, label) {
  const startIndex = source.indexOf(start);
  assert.ok(startIndex >= 0, `${label} missing start: ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(endIndex >= 0, `${label} missing end: ${end}`);
  return source.slice(startIndex, endIndex);
}

const nativeHeader = extractClass(widgets, "HalaNativeHeader");
const headerBrand = extractClass(widgets, "_HalaHeaderBrand");
const headerIconButton = extractClass(widgets, "HalaHeaderIconButton");
const bottomNav = extractClass(widgets, "HalaBottomNav");
const bottomNavItem = extractClass(widgets, "_HalaBottomNavItem");
const dashboardHeader = extractClass(dashboard, "_DashboardHeader");
const dashboardTabsFor = extractBetween(
  dashboard,
  "List<_DashboardTab> _tabsFor(BuildContext context, AppRole role) {",
  "_DashboardContent _contentFor(AppRole role)",
  "dashboard tab contract",
);
const dashboardMoreActions = extractBetween(
  dashboard,
  "List<_QuickActionItem> _moreActions()",
  "List<_QuickActionItem> _visibleOverviewQuickActions()",
  "dashboard More action contract",
);
const dashboardWorkflowMethod = extractBetween(
  dashboard,
  "Widget _dashboardWorkflowPage(",
  "Widget _dashboardWorkflowBottomNav(BuildContext routeContext)",
  "dashboard workflow page method",
);
const dashboardWorkflowPage = extractClass(dashboard, "_DashboardWorkflowPage");
const companyHeader = extractClass(company, "_CompanyHeader");
const companyBottomNav = extractClass(company, "_CompanyBottomNav");
const companyWorkflowMethod = extractBetween(
  company,
  "Widget _companyWorkflowPage(",
  "Widget _companyWorkflowBottomNav()",
  "company workflow page method",
);
const companyWorkflowPage = extractClass(company, "_CompanyWorkflowPage");
const companyMorePanel = extractClass(company, "_CompanyMorePanel");
const universityHeader = extractClass(university, "_UniversityHeader");
const universityBottomNav = extractClass(university, "_UniversityBottomNav");
const universityWorkflowPage = extractClass(university, "_UniversityWorkflowPage");

assertContains(nativeHeader, "color: halaNavy", "native header navy shell");
assertContains(
  nativeHeader,
  "bottom: BorderSide(color: halaOrange.withValues(alpha: 0.28))",
  "native header orange bottom hairline",
);
assertContains(headerBrand, "fontSize: 17", "locked HalaJob logo size");
assertContains(headerBrand, "letterSpacing: 0", "locked HalaJob logo spacing");
assertContains(
  headerIconButton,
  "this.size = halaHeaderActionSize",
  "locked header icon size",
);

assertContains(bottomNav, "color: halaNavy", "bottom nav navy shell");
assertContains(bottomNav, "height: 80", "bottom nav locked height");
assertOrder(
  bottomNavItem,
  ["Icon(", "height: 4,", "Text("],
  "bottom nav active orange line must sit under the icon and above the label",
);
assertContains(
  bottomNavItem,
  "color: active ? halaOrange : Colors.transparent",
  "bottom nav active orange line",
);

assertOccurrenceCount(
  dashboardHeader,
  "HalaHeaderIconButton(",
  3,
  "seeker/campus header fixed action count",
);
assertOrder(
  dashboardHeader,
  [
    "ValueKey('dashboard-header-notifications')",
    "onPressed: onOpenNotifications",
    "ValueKey('dashboard-header-profile')",
    "onPressed: onOpenProfile",
    "ValueKey('dashboard-header-settings')",
    "onPressed: onOpenSettings",
  ],
  "seeker/campus header action order and wiring",
);
assertOccurrenceCount(
  companyHeader,
  "HalaHeaderIconButton(",
  3,
  "company header fixed action count",
);
assertOrder(
  companyHeader,
  [
    "ValueKey('company-header-notifications')",
    "onPressed: onOpenNotifications",
    "ValueKey('company-header-profile')",
    "onPressed: onOpenProfileSettings",
    "ValueKey('company-header-settings')",
    "onPressed: onOpenAccountProfile",
  ],
  "company header keeps profile settings separate from account settings",
);
assertOccurrenceCount(
  universityHeader,
  "HalaHeaderIconButton(",
  3,
  "university header fixed action count",
);
assertOrder(
  universityHeader,
  [
    "ValueKey('university-header-notifications')",
    "onPressed: onOpenNotifications",
    "ValueKey('university-header-profile')",
    "onPressed: onOpenProfile",
    "ValueKey('university-header-settings')",
    "onPressed: onOpenSettings",
  ],
  "university header action order and wiring",
);

assertOccurrenceCount(
  dashboardTabsFor,
  "_DashboardTab(",
  9,
  "dashboard seeker/campus total fixed tab count",
);
assertOrder(
  dashboardTabsFor,
  [
    "if (role == AppRole.campusStudent) {",
    "keyId: 'home'",
    "keyId: 'opportunities'",
    "keyId: 'events'",
    "keyId: 'my-applications'",
    "keyId: 'more'",
    "return [",
    "keyId: 'home'",
    "keyId: 'jobs'",
    "keyId: 'my-jobs'",
    "keyId: 'more'",
  ],
  "campus five tabs and seeker four tabs must keep their approved order",
);
assertOccurrenceCount(
  companyBottomNav,
  "_CompanyBottomTab(",
  5,
  "company fixed five bottom tabs",
);
assertOrder(
  companyBottomNav,
  [
    "ValueKey('company-tab-home')",
    "ValueKey('company-tab-jobs')",
    "ValueKey('company-tab-applicants')",
    "ValueKey('company-tab-talent')",
    "ValueKey('company-tab-more')",
    "const tabs = [..._primaryTabs, _talentTab, _moreTab]",
  ],
  "company fixed five tab order",
);
assertOccurrenceCount(
  universityBottomNav,
  "_UniversityBottomTab(",
  5,
  "university fixed five bottom tabs",
);
assertOrder(
  universityBottomNav,
  [
    "keyId: 'home'",
    "keyId: 'students'",
    "keyId: 'verifications'",
    "keyId: 'partners'",
    "keyId: 'more'",
  ],
  "university fixed five tab order",
);

for (const fileBlock of [
  dashboardHeader,
  companyHeader,
  universityHeader,
  dashboardMoreActions,
]) {
  for (const banned of [
    "dashboard-header-account-menu",
    "company-header-account-menu",
    "university-header-account-menu",
    "dashboard-header-switch-account",
    "company-header-switch-account",
    "university-header-switch-account",
    "id: 'profile'",
    "id: 'notifications'",
    "id: 'settings'",
    "label: 'Profile'",
    "label: 'Notifications'",
    "label: 'Settings'",
  ]) {
    assertNotContains(fileBlock, banned, "locked header/More duplicate action");
  }
}

assertContains(
  dashboardWorkflowMethod,
  "bottomNavigationBar: _dashboardWorkflowBottomNav(routeContext)",
  "seeker/campus follow-up bottom navigation",
);
assertContains(
  dashboardWorkflowPage,
  "bottomNavigationBar: bottomNavigationBar",
  "seeker/campus workflow scaffold keeps bottom nav",
);
assertContains(
  dashboardWorkflowPage,
  "leading: HalaHeaderBackButton(",
  "seeker/campus follow-up header back button",
);
assertContains(
  companyWorkflowMethod,
  "bottomNavigationBar: _companyWorkflowBottomNav()",
  "company follow-up bottom navigation",
);
assertContains(
  companyWorkflowPage,
  "bottomNavigationBar: bottomNavigationBar",
  "company workflow scaffold keeps bottom nav",
);
assertContains(
  companyWorkflowPage,
  "leading: HalaHeaderBackButton(",
  "company follow-up header back button",
);
assertContains(
  universityWorkflowPage,
  "bottomNavigationBar: bottomNavigationBar",
  "university workflow scaffold keeps bottom nav",
);
assertContains(
  universityWorkflowPage,
  "leading: HalaHeaderBackButton(",
  "university follow-up header back button",
);

[
  "seeker main tabs keep the locked header and four bottom tabs",
  "campus main tabs keep the locked header and five bottom tabs",
  "company main tabs keep the locked header and five bottom tabs",
  "university main tabs keep the locked header and five bottom tabs",
  "approved profile settings notification chrome stays locked for every role",
  "_expectExactBottomNav",
  "_expectNoMergedAccountMenu",
  "_expectLockedFollowUpChrome",
].forEach((needle) =>
  assertContains(widgetTest, needle, "mobile chrome widget regression proof"),
);

[
  "title: 'Hiring dashboard'",
  "title: 'Recent jobs'",
  "title: 'Recent applicants'",
  "title: 'AI job drafts'",
  "title: 'Shortlist explanations'",
  "title: 'Hiring messages'",
].forEach((needle) =>
  assertNotContains(
    companyMorePanel,
    needle,
    "company More should not duplicate dashboard cards or spread AI tools",
  ),
);

console.log(
  "Mobile chrome regression contract verified: fixed role tab counts, navy headers, separated profile/settings actions, bottom nav indicator placement, and follow-up bottom nav.",
);
