/**
 * Migration: rename the legacy `jobzain_talent_requests` collection to
 * `talent_requests` (brand cleanup, Category B in BRAND_CLEANUP_AUDIT.md).
 *
 * This script ONLY moves the data. It is safe and reversible. It uses MongoDB's
 * atomic `renameCollection`, which preserves all indexes and is instantaneous
 * (no document copy). Run it during a short maintenance window, paired with the
 * code change described in "CODE CHANGES" below — both must ship together.
 *
 * Usage (from repo root, with CONNECTION_URL set):
 *   node scripts/migrations/rename-jobzain-talent-requests.js --dry-run   # inspect only
 *   node scripts/migrations/rename-jobzain-talent-requests.js             # migrate
 *   node scripts/migrations/rename-jobzain-talent-requests.js --rollback  # undo
 *
 * Pre-flight checks performed automatically:
 *   - source collection exists and target does not (or target is empty)
 *   - prints document counts and index list before acting
 *   - --dry-run makes no changes
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CODE CHANGES TO APPLY IN THE SAME RELEASE (not done by this script):
 *   1. models/JobZainTalentRequestModel.js
 *        - collection: "jobzain_talent_requests"  ->  "talent_requests"
 *        - (optional) rename file + symbol JobZainTalentRequestModel -> TalentRequestModel
 *   2. models/index.js — update the import/export name if the symbol is renamed.
 *   3. controllers/companyDash/companyWithJobs/companyTalentSearchController.js
 *        - function names requestJobZainTalentHelp / getMyJobZainTalentRequests /
 *          getJobZainTalentRequestDetails / cancelJobZainTalentRequest (optional)
 *        - response status codes "jobzain_talent_request_created" / "_details" /
 *          "_cancelled" / "jobzain_talent_requests"  ->  "talent_request_*"
 *          ⚠️ Only rename status codes if web/mobile clients do NOT switch on the
 *             exact strings. Grep clients first; otherwise keep the codes.
 *   4. routesCompany/jobRoute.js, controllers/app/campus/campusController.js,
 *      controllers/dash/{adminResourceController,adminSearchController,
 *      adminDashboardController,adminModerationController}.js — update usages if
 *      the symbol is renamed.
 *   5. Run: npm run check:syntax && npm run check:imports && npm run smoke:import
 *      and the company/admin route tests; then npm run docs:api-artifacts.
 *
 * ROLLBACK: run this script with --rollback (renames talent_requests back to
 * jobzain_talent_requests) and revert the code change. Because renameCollection
 * does not copy data, rollback is also instantaneous and lossless.
 * ────────────────────────────────────────────────────────────────────────────
 */
import mongoose from "mongoose";

const SOURCE = "jobzain_talent_requests";
const TARGET = "talent_requests";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ROLLBACK = args.includes("--rollback");

const from = ROLLBACK ? TARGET : SOURCE;
const to = ROLLBACK ? SOURCE : TARGET;

const CONNECTION_URL = process.env.CONNECTION_URL;

async function main() {
  if (!CONNECTION_URL) {
    console.error("✗ CONNECTION_URL is not set. Aborting.");
    process.exit(1);
  }

  await mongoose.connect(CONNECTION_URL, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));

  console.log(`Migration: rename '${from}' -> '${to}'${DRY_RUN ? " (DRY RUN)" : ""}`);

  // Pre-flight checks.
  if (!names.has(from)) {
    console.error(`✗ Source collection '${from}' does not exist. Nothing to do.`);
    await mongoose.connection.close();
    process.exit(names.has(to) ? 0 : 1);
  }

  const fromCount = await db.collection(from).countDocuments();
  const fromIndexes = await db.collection(from).indexes();
  console.log(`  source '${from}': ${fromCount} documents, ${fromIndexes.length} indexes`);
  console.log("  indexes:", fromIndexes.map((i) => i.name).join(", "));

  if (names.has(to)) {
    const toCount = await db.collection(to).countDocuments();
    if (toCount > 0) {
      console.error(`✗ Target '${to}' already exists with ${toCount} documents. Resolve conflict manually before migrating.`);
      await mongoose.connection.close();
      process.exit(1);
    }
    console.warn(`  ! target '${to}' exists but is empty; dropping it so the rename can proceed.`);
    if (!DRY_RUN) await db.collection(to).drop();
  }

  if (DRY_RUN) {
    console.log(`✓ Dry run only. Would rename '${from}' -> '${to}' (renameCollection preserves all ${fromIndexes.length} indexes).`);
    await mongoose.connection.close();
    return;
  }

  // Atomic rename, preserves indexes; dropTarget=false (we already ensured target absent/empty).
  await db.collection(from).rename(to, { dropTarget: false });

  const verifyCount = await db.collection(to).countDocuments();
  const verifyIndexes = await db.collection(to).indexes();
  console.log(`✓ Renamed. '${to}' now has ${verifyCount} documents and ${verifyIndexes.length} indexes.`);
  if (verifyCount !== fromCount) {
    console.error(`✗ Document count mismatch (was ${fromCount}, now ${verifyCount}). Investigate immediately.`);
    process.exitCode = 1;
  }

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error("✗ Migration failed:", err?.message || err);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
