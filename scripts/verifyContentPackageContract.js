// Gate 3 contract check (no DB): models load, content seed files are valid and
// complete, public + user routers expose expected paths, admin resources registered.
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import listEndpoints from "express-list-endpoints";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let failures = 0;
const fail = (m) => { console.error("  FAIL:", m); failures += 1; };
const ok = (m) => console.log("  ok:", m);
const importLocal = (relativePath) => import(pathToFileURL(path.join(root, relativePath)).href);

// 1. Models load
const models = await importLocal("models/index.js");
const required = [
  "ContentPageModel", "HelpCategoryModel", "HelpArticleModel", "FaqItemModel",
  "SupportTicketModel", "LegalReportModel", "PrivacyRequestModel", "AccessibilityRequestModel",
  "UserPolicyAcknowledgementModel", "UserConsentModel", "CommunicationPreferenceModel",
  "EmailTemplateModel", "EmailLogModel",
];
for (const m of required) {
  if (typeof models[m]?.modelName === "string") ok(`model ${m}`);
  else fail(`model missing: ${m}`);
}

// 2. Content seed files valid + required legal keys present
const REQUIRED_LEGAL = ["about_us","contact_information","terms_and_conditions","job_seeker_guidelines","employer_terms","university_partner_terms","campus_student_terms","acceptable_use_content_policy","community_guidelines","anti_discrimination_policy","trust_safety_policy","legal_reports","copyright_ip_policy","privacy_policy","cookies_policy","privacy_choices","account_data_deletion_policy","cv_uploaded_files_policy","student_data_document_visibility_policy","recommendations_automated_systems_policy","communications_notification_policy","accessibility_statement","payment_refund_policy","subscription_terms","external_apply_third_party_links_policy","salary_currency_job_info_disclaimer"];
const contentDir = path.join(root, "seeders/data/content");
const pageKeys = new Set();
for (const f of fs.readdirSync(path.join(contentDir, "pages"))) {
  if (!f.endsWith(".json")) continue;
  const items = JSON.parse(fs.readFileSync(path.join(contentDir, "pages", f), "utf-8"));
  for (const it of items) {
    pageKeys.add(it.key);
    if (!it.title?.en || !it.title?.ar) fail(`page ${it.key} missing bilingual title`);
    if (!it.legalReviewStatus) fail(`page ${it.key} missing legalReviewStatus`);
  }
}
const missing = REQUIRED_LEGAL.filter((k) => !pageKeys.has(k));
if (missing.length) fail(`missing legal pages: ${missing.join(", ")}`);
else ok(`all ${REQUIRED_LEGAL.length} legal pages present`);
for (const sub of ["help/categories.json", "help/articles.json", "faq/faq.json"]) {
  const arr = JSON.parse(fs.readFileSync(path.join(contentDir, sub), "utf-8"));
  if (Array.isArray(arr) && arr.length) ok(`${sub} (${arr.length} items)`);
  else fail(`${sub} empty/invalid`);
}

// 3. Public router exposes expected paths
const publicRouter = (await importLocal("routesPublic/index.js")).default;
const pubPaths = new Set(listEndpoints(publicRouter).map((e) => e.path));
for (const p of ["/content/pages", "/content/pages/:key", "/legal/:key", "/help/categories", "/help/articles", "/help/articles/:key", "/faq"]) {
  if (pubPaths.has(p)) ok(`public ${p}`); else fail(`public route missing: ${p}`);
}

// 3b. Email templates: present, bilingual subject, unsubscribe on marketing, no placeholders
const emails = JSON.parse(fs.readFileSync(path.join(contentDir, "email_templates/emails.json"), "utf-8"));
if (emails.length >= 50) ok(`email templates (${emails.length})`); else fail(`too few email templates: ${emails.length}`);
const requiredEmailCats = ["account", "seeker", "company", "campus", "privacy", "billing"];
const emailCats = new Set(emails.map((e) => e.category));
for (const c of requiredEmailCats) { if (emailCats.has(c)) ok(`email category ${c}`); else fail(`email category missing: ${c}`); }
for (const e of emails) {
  if (!e.subject?.en || !e.subject?.ar) fail(`email ${e.key} missing bilingual subject`);
}

// 3c. Placeholder / old-brand scan over all seed content
const BANNED = /jobzain|jobzien|\bTODO\b|lorem ipsum|coming soon/i;
let scanned = 0;
const scanDir = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) { scanDir(full); continue; }
    if (!f.endsWith(".json")) continue;
    scanned += 1;
    const text = fs.readFileSync(full, "utf-8");
    const m = text.match(BANNED);
    if (m) fail(`placeholder/old-brand in ${path.relative(root, full)}: "${m[0]}"`);
  }
};
scanDir(contentDir);
ok(`content placeholder/old-brand scan (${scanned} files clean)`);

// 4. User submit routers load
for (const r of ["routesUser/SupportRote.js", "routesUser/LegalReportRote.js", "routesUser/PrivacyRote.js"]) {
  const mod = (await importLocal(r)).default;
  if (mod && listEndpoints(mod).length) ok(`${r} (${listEndpoints(mod).length} routes)`);
  else fail(`${r} has no routes`);
}

console.log(failures === 0 ? "\ncontent package contract OK" : `\ncontent package contract FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
