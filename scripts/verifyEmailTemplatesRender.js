// check:emails — verifies the full email template catalogue renders end-to-end
// without a database or SMTP. Builds every entry in emails.json through the same
// buildEmailTemplate() the seeder uses, then renders each in EN and AR and
// asserts: non-empty subject + html, no leftover {{tokens}} in the shell,
// marketing templates carry an unsubscribe block, and every key has a footer.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildEmailTemplate } from "../seeders/contentSeeder.js";
import { renderTemplateDoc } from "../services/email/templatedEmail.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAILS_JSON = path.join(__dirname, "..", "seeders", "data", "content", "email_templates", "emails.json");

const sampleVars = {
  name: "Sample User",
  actionUrl: "https://halajob.com/example",
  actionLabel: "Open Hala Job",
  code: "123456",
};

const errors = [];
const raw = JSON.parse(fs.readFileSync(EMAILS_JSON, "utf-8"));
const docs = raw.map(buildEmailTemplate);

const keys = new Set();
for (const doc of docs) {
  if (keys.has(doc.key)) errors.push(`duplicate key: ${doc.key}`);
  keys.add(doc.key);

  for (const lang of ["en", "ar"]) {
    let result;
    try {
      result = renderTemplateDoc(doc, { lang, variables: sampleVars });
    } catch (err) {
      errors.push(`${doc.key} [${lang}]: render threw — ${err.message}`);
      continue;
    }
    if (!result.subject) errors.push(`${doc.key} [${lang}]: empty subject`);
    if (!result.html || result.html.length < 200) errors.push(`${doc.key} [${lang}]: html too short`);
    if (/\{\{\s*\w+\s*\}\}/.test(result.html)) errors.push(`${doc.key} [${lang}]: unresolved {{token}} in html`);
    if (!/Hala Job/.test(result.html)) errors.push(`${doc.key} [${lang}]: missing Hala Job branding`);
    if (/jobzain/i.test(result.html)) errors.push(`${doc.key} [${lang}]: old brand 'jobzain' in rendered html`);
  }

  const hasFooter = (doc.bodyBlocks || []).some((b) => b.type === "footer");
  if (!hasFooter) errors.push(`${doc.key}: no footer block`);
  if (doc.isMarketing) {
    const hasUnsub = (doc.bodyBlocks || []).some((b) => b.type === "unsubscribe");
    if (!hasUnsub) errors.push(`${doc.key}: marketing template missing unsubscribe block`);
  }
}

if (errors.length) {
  console.error(`✗ check:emails failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✓ check:emails passed: ${docs.length} templates render in EN + AR (subject, html, branding, footer, unsubscribe).`);
