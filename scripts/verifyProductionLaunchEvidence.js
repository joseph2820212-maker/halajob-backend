import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requireComplete = process.argv.includes("--require-complete");
const evidencePath = "docs/testing/PRODUCTION_LAUNCH_EVIDENCE.md";
const source = readFileSync(join(root, evidencePath), "utf8");

const requiredRows = [
  "production_secret_rotation",
  "privileged_user_audit",
  "live_backend_smoke",
  "live_web_smoke",
  "live_smtp_email",
  "live_firebase_push",
  "live_storage_upload_download",
  "ai_provider_or_disabled",
  "cv_parser_or_disabled",
  "payments_mode",
  "domain_https_cors",
  "backup_restore",
  "production_android_signing",
  "owner_real_device_qa",
];

const allowedStatuses = new Set(["PENDING_OWNER", "PASS", "ACCEPTED_EXCLUSION"]);
const incompletePhrases = [
  "not yet",
  "not claimed",
  "pending",
  "todo",
  "tbd",
  "missing",
  "requires owner",
];

assert.ok(
  source.trimStart().startsWith("# Production Launch Evidence"),
  `${evidencePath} must start with a Production Launch Evidence title.`,
);

for (const needle of [
  "npm run test:production-launch-evidence",
  "npm run test:production-launch-evidence:complete",
  "do not mark a row `PASS`",
  "PENDING_OWNER",
  "ACCEPTED_EXCLUSION",
]) {
  assert.ok(
    source.toLowerCase().includes(needle.toLowerCase()),
    `${evidencePath} is missing ${needle}.`,
  );
}

const tableRows = source
  .split(/\r?\n/)
  .filter((line) => /^\|\s*`[^`]+`\s*\|/.test(line))
  .map((line) => {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return {
      key: cells[0]?.replace(/^`|`$/g, ""),
      status: cells[1],
      closeEvidence: cells[2] || "",
      currentEvidence: cells[3] || "",
      ownerAction: cells[4] || "",
      raw: line,
    };
  });

const rowByKey = new Map(tableRows.map((row) => [row.key, row]));

for (const key of requiredRows) {
  const row = rowByKey.get(key);
  assert.ok(row, `${evidencePath} is missing evidence row ${key}.`);
  assert.ok(
    allowedStatuses.has(row.status),
    `${key} has invalid status ${row.status}; use ${[...allowedStatuses].join(", ")}.`,
  );
  assert.ok(
    row.closeEvidence.length >= 20,
    `${key} must describe the evidence required to close the row.`,
  );

  if (row.status === "PENDING_OWNER") {
    assert.ok(
      row.ownerAction.length >= 12,
      `${key} is pending but does not explain the owner/external action.`,
    );
    assert.match(
      row.ownerAction.toLowerCase(),
      /(owner|provide|approve|run|supply|decide|complete|record|rotate|build|test)/,
      `${key} pending owner action is too vague: ${row.ownerAction}`,
    );
  }

  if (row.status === "PASS") {
    const evidence = row.currentEvidence.toLowerCase();
    assert.ok(
      !incompletePhrases.some((phrase) => evidence.includes(phrase)),
      `${key} is marked PASS but current evidence still reads incomplete: ${row.currentEvidence}`,
    );
    assert.match(
      row.currentEvidence,
      /(https?:\/\/|npm run|commit|sha|screenshot|report|log|ticket|artifact|aab|apk|email|push|storage|audit|approved|passed)/i,
      `${key} PASS row must cite concrete evidence, not a bare assertion.`,
    );
  }

  if (row.status === "ACCEPTED_EXCLUSION") {
    assert.match(
      row.currentEvidence,
      /(owner|approved|accepted|decision|signed off|launch exclusion)/i,
      `${key} accepted exclusion must cite owner approval/decision evidence.`,
    );
  }
}

const unexpectedRows = tableRows
  .map((row) => row.key)
  .filter((key) => !requiredRows.includes(key));
assert.deepEqual(unexpectedRows, [], `Unexpected production evidence rows: ${unexpectedRows.join(", ")}`);

const pendingRows = tableRows.filter((row) => row.status === "PENDING_OWNER");
if (requireComplete && pendingRows.length > 0) {
  throw new Error(
    `Production launch evidence is incomplete: ${pendingRows
      .map((row) => row.key)
      .join(", ")} remain PENDING_OWNER.`,
  );
}

console.log(
  `Production launch evidence contract verified for ${requiredRows.length} rows` +
    (requireComplete ? " in complete mode." : ` (${pendingRows.length} pending owner/external rows).`),
);
