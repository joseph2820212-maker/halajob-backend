import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const auditDate = new Date().toISOString().slice(0, 10);
const inventoryPath = path.join(root, "docs", "api", "HALAJOB_ROUTE_INVENTORY.json");
const reportPath = path.join(root, "docs", "audits", `backend-ui-coverage-${auditDate}.md`);
const jsonPath = path.join(root, "docs", "audits", `backend-ui-coverage-${auditDate}.json`);

const sourceDirs = {
  mobile: ["mobile/lib/src", "mobile/test"],
  web: ["web/src"],
};

const testFile = path.join(root, "mobile", "test", "widget_test.dart");
const dashboardScreen = path.join(root, "mobile", "lib", "src", "features", "dashboard", "dashboard_screen.dart");
const companyScreen = path.join(root, "mobile", "lib", "src", "features", "company", "company_dashboard_screen.dart");

function read(relativeOrAbsolutePath) {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(root, relativeOrAbsolutePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function walkFiles(dir, extensions, files = []) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return files;

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const fullPath = path.join(fullDir, entry.name);
    const relativePath = path.relative(root, fullPath).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      walkFiles(relativePath, extensions, files);
      continue;
    }
    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }
  return files;
}

function readSourceBundle(dirs, extensions) {
  return dirs
    .flatMap((dir) => walkFiles(dir, extensions))
    .map((file) => `\n/* ${file} */\n${read(file)}`)
    .join("\n");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeRegex(routePath) {
  if (!routePath || routePath === "*" || routePath.includes("*")) return null;
  const segments = routePath.split("/").filter(Boolean);
  if (!segments.length) return null;
  const dynamicSegment = "(?:\\$\\{[^}]+\\}|\\$[A-Za-z_][A-Za-z0-9_]*|[^'\"`\\s/]+)";
  const body = segments
    .map((segment) => (segment.startsWith(":") ? dynamicSegment : escapeRegex(segment)))
    .join("\\/");
  return new RegExp(`\\/${body}(?=[/'"\`\\s),;?]|$)`);
}

function hasComposedDynamicRouteEvidence(source, routePath) {
  if (!routePath || !routePath.includes("/:")) return false;
  const match = routePath.match(/^(.*)\/:[^/]+(.*)$/);
  if (!match) return false;

  const [, staticPrefix, staticSuffix = ""] = match;
  const hasStaticPrefix =
    source.includes(`'${staticPrefix}'`) ||
    source.includes(`"${staticPrefix}"`) ||
    source.includes(`\`${staticPrefix}\``);
  if (!hasStaticPrefix) return false;

  const suffix = escapeRegex(staticSuffix);
  const variableSegment = new RegExp(
    `\\}/\\$[A-Za-z_][A-Za-z0-9_]*${suffix}(?=['"\`])`,
  );
  const interpolationSegment = new RegExp(
    `\\}/\\$\\{[^}]+\\}${suffix}(?=['"\`])`,
  );
  return variableSegment.test(source) || interpolationSegment.test(source);
}

function scopeBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = source.indexOf(end, startIndex + start.length);
  return endIndex === -1 ? source.slice(startIndex) : source.slice(startIndex, endIndex);
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replaceAll("|", "\\|")).join(" | ")} |`),
  ].join("\n");
}

function hasTapEvidence(testSource, key) {
  if (new RegExp(`tester\\.tap\\([\\s\\S]{0,120}ValueKey\\('${escapeRegex(key)}'\\)`).test(testSource)) {
    return true;
  }
  const quickActionPrefix = "quick-action-";
  if (key.startsWith(quickActionPrefix)) {
    const id = key.slice(quickActionPrefix.length);
    if (testSource.includes(`_openMoreAction(tester, '${id}')`)) return true;
    if (
      testSource.includes(`'${id}':`) &&
      testSource.includes("ValueKey('quick-action-$actionId')") &&
      testSource.includes("tester.tap(action)")
    ) {
      return true;
    }
  }
  const companyModulePrefix = "company-module-";
  if (key.startsWith(companyModulePrefix)) {
    const title = key.slice(companyModulePrefix.length);
    if (
      testSource.includes(`'${title}':`) &&
      testSource.includes("ValueKey('company-module-$title')") &&
      testSource.includes("tester.tap(module)")
    ) {
      return true;
    }
  }
  return false;
}

function constantGroupHasTapEvidence(testSource, groupName, key) {
  return (
    testSource.includes(`ValueKey('${key}')`) &&
    testSource.includes(`for (final key in ${groupName}.skip(1))`) &&
    testSource.includes(`tester.tap(find.byKey(${groupName}.first))`)
  );
}

function hasShellTapEvidence(testSource, key) {
  if (hasTapEvidence(testSource, key)) return true;
  const groups = [
    "_seekerBottomNavKeys",
    "_campusBottomNavKeys",
    "_companyBottomNavKeys",
  ];
  return groups.some((groupName) =>
    constantGroupHasTapEvidence(testSource, groupName, key),
  );
}

function hasVisibilityEvidence(testSource, key) {
  if (testSource.includes(`ValueKey('${key}')`)) return true;
  const companyModulePrefix = "company-module-";
  if (key.startsWith(companyModulePrefix)) {
    const title = key.slice(companyModulePrefix.length);
    return (
      testSource.includes(`'${title}':`) &&
      testSource.includes("ValueKey('company-module-$title')")
    );
  }
  return false;
}

function extractDashboardTabKeys(source) {
  return [
    ...new Set(
      [...source.matchAll(/keyId:\s*'([^']+)'/g)]
        .map((match) => match[1])
        .filter((keyId) =>
          [
            "home",
            "jobs",
            "my-jobs",
            "opportunities",
            "events",
            "my-applications",
            "more",
          ].includes(keyId),
        )
        .map((keyId) => `bottom-nav-${keyId}`),
    ),
  ].sort();
}

function extractCompanyTabKeys(source) {
  return [
    ...new Set(
      [...source.matchAll(/key:\s*ValueKey\('([^']+)'\)/g)]
        .map((match) => match[1])
        .filter((key) => key.startsWith("company-tab-")),
    ),
  ].sort();
}

function extractHeaderActionKeys(source, prefix) {
  return [
    ...new Set(
      [...source.matchAll(/key:\s*const ValueKey\('([^']+)'\)/g)]
        .map((match) => match[1])
        .filter((key) =>
          key.startsWith(prefix) &&
          (key.endsWith("-notifications") ||
            key.endsWith("-profile") ||
            key.endsWith("-settings")),
        ),
    ),
  ].sort();
}

const inventory = JSON.parse(read(inventoryPath));
const records = inventory.records || [];
const mobileSource = readSourceBundle(sourceDirs.mobile, new Set([".dart"]));
const webSource = readSourceBundle(sourceDirs.web, new Set([".ts", ".tsx"]));
const widgetTestSource = read(testFile);
const dashboardSource = read(dashboardScreen);
const companySource = read(companyScreen);

const endpointCoverage = records.map((record) => {
  const regex = routeRegex(record.path);
  const mobileClient = regex
    ? regex.test(mobileSource) ||
      hasComposedDynamicRouteEvidence(mobileSource, record.path)
    : hasComposedDynamicRouteEvidence(mobileSource, record.path);
  const webClient = regex
    ? regex.test(webSource) ||
      hasComposedDynamicRouteEvidence(webSource, record.path)
    : hasComposedDynamicRouteEvidence(webSource, record.path);
  return {
    method: record.method,
    path: record.path,
    module: record.module,
    mobileClient,
    webClient,
    anyClient: mobileClient || webClient,
  };
});

const moduleNames = [...new Set(endpointCoverage.map((record) => record.module))].sort();
const moduleSummary = moduleNames.map((module) => {
  const rows = endpointCoverage.filter((record) => record.module === module);
  const mobile = rows.filter((record) => record.mobileClient).length;
  const web = rows.filter((record) => record.webClient).length;
  const any = rows.filter((record) => record.anyClient).length;
  return {
    module,
    total: rows.length,
    mobile,
    web,
    any,
    noClientEvidence: rows.length - any,
  };
});

const moreScope = scopeBetween(
  dashboardSource,
  "List<_QuickActionItem> _moreActions()",
  "List<_QuickActionItem> _visibleOverviewQuickActions()",
);
const quickActionIds = [
  ...new Set([...moreScope.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1])),
].sort();

const companyMoreScope = scopeBetween(
  companySource,
  "class _CompanyMorePanel extends StatelessWidget",
  "class _CompanySectionCard extends StatelessWidget",
);
const companyModuleTitles = [
  ...new Set([...companyMoreScope.matchAll(/_CompanyModuleCardData\(\s*title:\s*'([^']+)'/g)].map((match) => match[1])),
].sort();

const mobileQuickActions = quickActionIds.map((id) => {
  const key = `quick-action-${id}`;
  return {
    key,
    visibleInTests: hasVisibilityEvidence(widgetTestSource, key),
    tappedInTests: hasTapEvidence(widgetTestSource, key),
  };
});

const companyModules = companyModuleTitles.map((title) => {
  const key = `company-module-${title}`;
  return {
    key,
    visibleInTests: hasVisibilityEvidence(widgetTestSource, key),
    tappedInTests: hasTapEvidence(widgetTestSource, key),
  };
});

const shellNavigationKeys = [
  ...extractDashboardTabKeys(dashboardSource),
  ...extractCompanyTabKeys(companySource),
];

const shellHeaderKeys = [
  ...extractHeaderActionKeys(dashboardSource, "dashboard-header-"),
  ...extractHeaderActionKeys(companySource, "company-header-"),
];

const shellNavigation = shellNavigationKeys.map((key) => ({
  key,
  visibleInTests: hasVisibilityEvidence(widgetTestSource, key),
  tappedInTests: hasShellTapEvidence(widgetTestSource, key),
}));

const shellHeaders = shellHeaderKeys.map((key) => ({
  key,
  visibleInTests: hasVisibilityEvidence(widgetTestSource, key),
}));

const requiredNavigationKeys = [
  ...mobileQuickActions.map((item) => item.key),
  ...companyModules.map((item) => item.key),
];

const navigationLookup = new Map(
  [...mobileQuickActions, ...companyModules].map((item) => [item.key, item]),
);
const missingRequiredNavigation = requiredNavigationKeys.filter(
  (key) => !navigationLookup.get(key)?.tappedInTests,
);
const missingRequiredShellNavigation = shellNavigation
  .filter((item) => !item.visibleInTests || !item.tappedInTests)
  .map((item) => item.key);
const missingRequiredShellHeaders = shellHeaders
  .filter((item) => !item.visibleInTests)
  .map((item) => item.key);

const priorityModules = new Set([
  "AI",
  "Campus Student",
  "Company",
  "Notifications",
  "Seeker",
  "University",
]);
const missingPriorityClientEvidence = endpointCoverage
  .filter((record) => priorityModules.has(record.module) && !record.anyClient)
  .slice(0, 80);

const summary = {
  generatedAt: new Date().toISOString(),
  sourceInventory: "docs/api/HALAJOB_ROUTE_INVENTORY.json",
  endpointTotals: {
    total: endpointCoverage.length,
    anyClient: endpointCoverage.filter((record) => record.anyClient).length,
    mobileClient: endpointCoverage.filter((record) => record.mobileClient).length,
    webClient: endpointCoverage.filter((record) => record.webClient).length,
  },
  moduleSummary,
  mobileQuickActions,
  companyModules,
  shellNavigation,
  shellHeaders,
  requiredNavigationKeys,
  missingRequiredNavigation,
  missingRequiredShellNavigation,
  missingRequiredShellHeaders,
  missingPriorityClientEvidence,
};

if (missingRequiredNavigation.length) {
  console.error("Backend/UI coverage audit failed required More-card navigation proof:");
  for (const key of missingRequiredNavigation) console.error(`  - ${key}`);
  process.exit(1);
}

if (missingRequiredShellNavigation.length) {
  console.error("Backend/UI coverage audit failed required shell navigation proof:");
  for (const key of missingRequiredShellNavigation) console.error(`  - ${key}`);
  process.exit(1);
}

if (missingRequiredShellHeaders.length) {
  console.error("Backend/UI coverage audit failed required header action proof:");
  for (const key of missingRequiredShellHeaders) console.error(`  - ${key}`);
  process.exit(1);
}

if (!checkOnly) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);

  const moduleRows = moduleSummary.map((item) => [
    item.module,
    item.total,
    item.mobile,
    item.web,
    item.any,
    item.noClientEvidence,
  ]);
  const quickRows = mobileQuickActions.map((item) => [
    item.key,
    item.visibleInTests ? "yes" : "no",
    item.tappedInTests ? "yes" : "no",
  ]);
  const companyRows = companyModules.map((item) => [
    item.key,
    item.visibleInTests ? "yes" : "no",
    item.tappedInTests ? "yes" : "no",
  ]);
  const shellNavigationRows = shellNavigation.map((item) => [
    item.key,
    item.visibleInTests ? "yes" : "no",
    item.tappedInTests ? "yes" : "no",
  ]);
  const shellHeaderRows = shellHeaders.map((item) => [
    item.key,
    item.visibleInTests ? "yes" : "no",
  ]);
  const missingRows = missingPriorityClientEvidence.map((item) => [
    item.method,
    item.path,
    item.module,
  ]);

  const report = `# Backend To UI Coverage Audit

Generated: ${summary.generatedAt}
Source inventory: \`${summary.sourceInventory}\`

This is a machine-generated progress audit, not a claim of full completion.
It answers three questions:

1. Does a backend method/path have matching mobile or web client source evidence?
2. Do the currently visible mobile More/module cards have widget-test navigation proof?
3. Do locked bottom tabs and header actions have widget-test shell proof?

## Endpoint Client Evidence Summary

${table(["Module", "Endpoints", "Mobile client", "Web client", "Any client", "No client evidence"], moduleRows)}

## Mobile More Card Navigation Evidence

${table(["Key", "Visible in tests", "Tapped in tests"], quickRows)}

## Company More Module Navigation Evidence

${table(["Key", "Visible in tests", "Tapped in tests"], companyRows)}

## Locked Shell Navigation Evidence

${table(["Key", "Visible in tests", "Tapped in tests"], shellNavigationRows)}

## Locked Header Action Evidence

${table(["Key", "Visible in tests"], shellHeaderRows)}

## Required Navigation Guard

The audit fails in \`--check\` mode unless extracted mobile More cards,
company More cards, role bottom tabs, and locked header actions have widget-test
proof:

${[
  ...requiredNavigationKeys,
  ...shellNavigationKeys,
  ...shellHeaderKeys,
].map((key) => `- \`${key}\``).join("\n")}

Current result: **pass**

## Priority Backend Endpoints Without Client Evidence

These are the first ${missingPriorityClientEvidence.length} priority endpoints where this static scan did not find a matching mobile/web client route literal. Some may be intentionally backend-only, admin-only through a generated table, aliases, or covered by dynamic route construction. They still need manual classification before the goal can be called complete.

${missingRows.length ? table(["Method", "Path", "Module"], missingRows) : "No priority gaps found by static scan."}
`;

  fs.writeFileSync(reportPath, report);
  console.log(`Backend/UI coverage audit written to ${path.relative(root, reportPath)}`);
  console.log(`Backend/UI coverage JSON written to ${path.relative(root, jsonPath)}`);
} else {
  console.log("Backend/UI coverage audit required navigation proof passed.");
}
