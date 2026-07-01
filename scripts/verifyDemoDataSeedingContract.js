import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const demoNeedles = [
  "Nexa Retail",
  "CV Office Hours",
  "CV lab for students",
  "Student Marketing Intern",
  "Campus Ambassador",
  "King Saud University",
];

const mobileShippedRoots = [
  "mobile/assets",
  "mobile/lib",
  "mobile/android/app/src/main",
  "mobile/ios/Runner",
];

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function walkFiles(relativeRoot) {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  const results = [];
  if (!fs.existsSync(absoluteRoot)) return results;

  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteRoot, entry.name);
    const relativePath = path.relative(repoRoot, absolutePath);
    if (entry.isDirectory()) {
      results.push(...walkFiles(relativePath));
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }
  return results;
}

function isTextFile(relativePath) {
  return /\.(arb|dart|gradle|json|kts|kt|plist|swift|txt|xml|yaml|yml)$/i.test(
    relativePath,
  );
}

const mobileOffenders = [];
for (const root of mobileShippedRoots) {
  for (const file of walkFiles(root)) {
    if (!isTextFile(file)) continue;
    const text = readText(file);
    for (const needle of demoNeedles) {
      if (text.includes(needle)) {
        mobileOffenders.push(`${file}: ${needle}`);
      }
    }
  }
}

assert.deepEqual(
  mobileOffenders,
  [],
  "Claude/demo campus records must not be embedded in APK/iOS shipped assets or source.",
);

const backendCampusContent = readText("data/campusContent.json");
for (const needle of demoNeedles) {
  assert(
    backendCampusContent.includes(needle),
    `Backend campus demo seed payload must contain ${needle}.`,
  );
}

const campusSeedUtil = readText("scripts/utils/campusDemoContentSeed.js");
assert(
  campusSeedUtil.includes("CampusContentModel.findOneAndUpdate"),
  "Campus demo content must be written into CampusContentModel.",
);
assert(
  campusSeedUtil.includes("data/campusContent.json"),
  "Campus demo content seed must read the backend seed payload.",
);

const demoSeed = readText("scripts/seedDemoData.js");
assert(
  demoSeed.includes("seedCampusDemoContent"),
  "General demo seed must also seed campus demo content.",
);
assert(
  demoSeed.includes("@demo.halajob.local"),
  "General demo seed must keep demo accounts clearly namespaced.",
);

const packageJson = JSON.parse(readText("package.json"));
assert.equal(
  packageJson.scripts["seed:demo"],
  "node scripts/seedDemoData.js",
);
assert.equal(
  packageJson.scripts["seed:demo-campus"],
  "node scripts/seedCampusDemoContent.js",
);
assert.equal(
  packageJson.scripts["seed:demo:teardown"],
  "node scripts/seedDemoData.js --teardown",
);
assert.equal(
  packageJson.scripts["seed:demo-campus:teardown"],
  "node scripts/seedCampusDemoContent.js --teardown",
);

console.log(
  "Demo data seeding contract verified: backend seed owns demo records; mobile shipped files do not embed them.",
);
