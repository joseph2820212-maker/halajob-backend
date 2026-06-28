import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ContentPageModel,
  HelpCategoryModel,
  HelpArticleModel,
  FaqItemModel,
  EmailTemplateModel,
} from "../models/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "data", "content");

const readJson = (relPath) => {
  const full = path.join(CONTENT_DIR, relPath);
  if (!fs.existsSync(full)) return [];
  return JSON.parse(fs.readFileSync(full, "utf-8"));
};

const readDir = (sub) => {
  const dir = path.join(CONTENT_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => readJson(path.join(sub, f)));
};

// Replace {{ENV_EMAIL}} tokens with configured addresses (env-driven, no hardcoded fakes).
const emailEnv = {
  SUPPORT_EMAIL: process.env.HALA_SUPPORT_EMAIL || "support@halajob.com",
  PRIVACY_EMAIL: process.env.HALA_PRIVACY_EMAIL || "privacy@halajob.com",
  LEGAL_EMAIL: process.env.HALA_LEGAL_EMAIL || "legal@halajob.com",
  BILLING_EMAIL: process.env.HALA_BILLING_EMAIL || "billing@halajob.com",
  ACCESSIBILITY_EMAIL: process.env.HALA_ACCESSIBILITY_EMAIL || "accessibility@halajob.com",
  PARTNERS_EMAIL: process.env.HALA_PARTNERS_EMAIL || "partners@halajob.com",
  SECURITY_EMAIL: process.env.HALA_SECURITY_EMAIL || "security@halajob.com",
};

const interpolate = (value) => {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (m, k) => emailEnv[k] ?? m);
  }
  if (Array.isArray(value)) return value.map(interpolate);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, interpolate(v)]));
  }
  return value;
};

const upsertAll = async (Model, items, label) => {
  let created = 0;
  let updated = 0;
  for (const raw of items) {
    const doc = interpolate(raw);
    const res = await Model.updateOne({ key: doc.key }, { $set: doc }, { upsert: true });
    if (res.upsertedCount) created += 1;
    else updated += 1;
  }
  console.log(`  ${label}: ${created} created, ${updated} updated (${items.length} total)`);
  return { created, updated, total: items.length };
};

// Build a complete EmailTemplate from a compact {key,category,subject,preheader,isMarketing}
// entry: standard bilingual greeting/body/footer, support links, and an unsubscribe
// line for marketing/job-alert templates.
const buildEmailTemplate = (raw) => {
  const bodyBlocks = [
    { type: "greeting", text: { en: "Hello,", ar: "مرحباً،" } },
    { type: "paragraph", text: { en: raw.preheader?.en || "", ar: raw.preheader?.ar || "" } },
    {
      type: "footer",
      text: {
        en: `This message was sent by Hala Job. Need help? Contact ${emailEnv.SUPPORT_EMAIL}. Privacy: ${emailEnv.PRIVACY_EMAIL}. Legal: ${emailEnv.LEGAL_EMAIL}.`,
        ar: `أُرسلت هذه الرسالة من هلا جوب. تحتاج مساعدة؟ تواصل مع ${emailEnv.SUPPORT_EMAIL}. الخصوصية: ${emailEnv.PRIVACY_EMAIL}. القانونية: ${emailEnv.LEGAL_EMAIL}.`,
      },
    },
  ];
  if (raw.isMarketing) {
    bodyBlocks.push({ type: "unsubscribe", text: { en: "To stop these emails, manage your notification preferences or unsubscribe.", ar: "لإيقاف هذه الرسائل، أدر تفضيلات الإشعارات أو ألغِ الاشتراك." } });
  }
  return {
    key: raw.key,
    category: raw.category || "account",
    subject: raw.subject || {},
    preheader: raw.preheader || {},
    bodyBlocks,
    isMarketing: Boolean(raw.isMarketing),
    fromName: "Hala Job",
    variables: ["name", "actionUrl", "code"],
    status: "published",
    version: "2026.06.28",
  };
};

export const seedContent = async () => {
  console.log("Seeding legal/help/faq/email content...");
  const pages = readDir("pages");
  const categories = readJson("help/categories.json");
  const articles = readJson("help/articles.json");
  const faq = readJson("faq/faq.json");
  const emails = readJson("email_templates/emails.json").map(buildEmailTemplate);

  await upsertAll(ContentPageModel, pages, "content_pages");
  await upsertAll(HelpCategoryModel, categories, "help_categories");
  await upsertAll(HelpArticleModel, articles, "help_articles");
  await upsertAll(FaqItemModel, faq, "faq_items");
  await upsertAll(EmailTemplateModel, emails, "email_templates");
  console.log("Content seeding complete.");
};

export default seedContent;
