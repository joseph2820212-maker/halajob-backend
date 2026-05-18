import fs from "fs";
import path from "path";
import csv from "csv-parser";
import dotenv from "dotenv";

import { SkillModel } from "../models/index.js";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "seeders/data");

const cleanValue = (value = "") => String(value || "").trim();

const normalizeKey = (value = "") => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
};

const getValueByKeys = (row = {}, keys = []) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && cleanValue(row[key])) {
      return cleanValue(row[key]);
    }
  }

  return "";
};

const getFirstColumnValue = (row = {}) => {
  const firstKey = Object.keys(row)[0];
  return cleanValue(row[firstKey]);
};

const EN_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "by",
  "from",
  "as",
  "is",
  "are",
  "be",
  "use",
  "using",
  "make",
  "apply",
  "manage",
]);

const AR_STOP_WORDS = new Set([
  "في",
  "من",
  "على",
  "إلى",
  "عن",
  "مع",
  "او",
  "أو",
  "و",
  "التي",
  "الذي",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "يتم",
  "تم",
]);

const buildKeywords = (text = "", lang = "en") => {
  const stopWords = lang === "ar" ? AR_STOP_WORDS : EN_STOP_WORDS;

  return [
    ...new Set(
      String(text || "")
        .toLowerCase()
        .replace(/[،,;|/\\()[\]{}"'“”‘’!?؟:.]/gu, " ")
        .split(/\s+/)
        .map((word) => cleanValue(word))
        .filter((word) => word.length >= 2)
        .filter((word) => !stopWords.has(word))
    ),
  ].slice(0, 40);
};

const mergeKeywords = (...lists) => {
  return [...new Set(lists.flat().filter(Boolean))].slice(0, 40);
};

const readCsv = async (filePath) => {
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
};

const readCombinedJson = async (filePath) => {
  const content = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(content);
};

const buildSkillsFromCsvFiles = async () => {
  const enPath = path.join(DATA_DIR, "skills.csv");
  const arPath = path.join(DATA_DIR, "skills_ar.csv");

  if (!fs.existsSync(enPath)) {
    throw new Error(`English CSV file not found: ${enPath}`);
  }

  if (!fs.existsSync(arPath)) {
    throw new Error(`Arabic CSV file not found: ${arPath}`);
  }

  const enRows = await readCsv(enPath);
  const arRows = await readCsv(arPath);

  console.log(`English rows: ${enRows.length}`);
  console.log(`Arabic rows: ${arRows.length}`);

  const skillsMap = new Map();

  const maxLength = Math.max(enRows.length, arRows.length);

  for (let i = 0; i < maxLength; i++) {
    const enRow = enRows[i] || {};
    const arRow = arRows[i] || {};

    const titleEn = getValueByKeys(enRow, [
      "title_en",
      "label_cleaned",
      "preferredLabel",
      "label",
      "name",
    ]);

    if (!titleEn) continue;

    const titleAr =
      getValueByKeys(arRow, [
        "title_ar",
        "تم تنظيف الملصق",
        "label_cleaned",
        "preferredLabel",
        "label",
        "name",
      ]) || getFirstColumnValue(arRow);

    const key = normalizeKey(getValueByKeys(enRow, ["key"]) || titleEn);
    if (!key) continue;

    const altEn = getValueByKeys(enRow, [
      "keywords_en",
      "altLabels",
      "alternativeLabels",
    ]);

    const altAr = getValueByKeys(arRow, [
      "keywords_ar",
      "altLabels",
      "alternativeLabels",
    ]);

    const keywordsEn = mergeKeywords(
      buildKeywords(titleEn, "en"),
      buildKeywords(altEn, "en")
    );

    const keywordsAr = mergeKeywords(
      buildKeywords(titleAr, "ar"),
      buildKeywords(altAr, "ar")
    );

    skillsMap.set(key, {
      key,

      title_en: titleEn,
      title_ar: titleAr || titleEn,

      category: getValueByKeys(enRow, ["category"]) || "general",

      keywords_en: keywordsEn,
      keywords_ar: keywordsAr,

      is_active: true,
      is_system: true,
    });
  }

  return [...skillsMap.values()];
};

const buildSkills = async () => {
  const combinedPath = path.join(DATA_DIR, "skills_combined.json");

  if (fs.existsSync(combinedPath)) {
    console.log("Reading skills from skills_combined.json");
    return readCombinedJson(combinedPath);
  }

  return buildSkillsFromCsvFiles();
};

export const generateCombinedSkillsFile = async () => {
  const skills = await buildSkillsFromCsvFiles();

  const outputPath = path.join(DATA_DIR, "skills_combined.json");

  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(skills, null, 2),
    "utf8"
  );

  console.log(`✅ Combined skills file generated: ${outputPath}`);
  console.log(`Total skills: ${skills.length}`);
};

export const seedSkillsFromEsco = async () => {
  try {
    const skills = await buildSkills();

    console.log(`Preparing ${skills.length} skills...`);

    if (!skills.length) {
      console.log("⚠️ No skills found");
      return;
    }

    const operations = skills.map((skill) => ({
      updateOne: {
        filter: { key: skill.key },
        update: {
          $set: {
            title_en: skill.title_en,
            title_ar: skill.title_ar,
            category: skill.category || "general",
            keywords_en: Array.isArray(skill.keywords_en)
              ? skill.keywords_en
              : buildKeywords(skill.keywords_en, "en"),
            keywords_ar: Array.isArray(skill.keywords_ar)
              ? skill.keywords_ar
              : buildKeywords(skill.keywords_ar, "ar"),
            is_active: true,
            is_system: true,
          },
          $setOnInsert: {
            key: skill.key,
          },
        },
        upsert: true,
      },
    }));

    const result = await SkillModel.bulkWrite(operations, {
      ordered: false,
    });

    console.log("✅ Skills seeded successfully");
    console.log({
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (error) {
    console.error("❌ Skills seeder error:", error);
    throw error;
  }
};

export default seedSkillsFromEsco;