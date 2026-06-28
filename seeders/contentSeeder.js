import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ContentPageModel,
  HelpCategoryModel,
  HelpArticleModel,
  FaqItemModel,
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

export const seedContent = async () => {
  console.log("Seeding legal/help/faq content...");
  const pages = readDir("pages");
  const categories = readJson("help/categories.json");
  const articles = readJson("help/articles.json");
  const faq = readJson("faq/faq.json");

  await upsertAll(ContentPageModel, pages, "content_pages");
  await upsertAll(HelpCategoryModel, categories, "help_categories");
  await upsertAll(HelpArticleModel, articles, "help_articles");
  await upsertAll(FaqItemModel, faq, "faq_items");
  console.log("Content seeding complete.");
};

export default seedContent;
