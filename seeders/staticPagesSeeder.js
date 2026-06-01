import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import dotenv from "dotenv";

import { PageModel } from "../models/index.js";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "seeders/data");
const STATIC_PAGES_DIR = path.join(DATA_DIR, "static_pages");
const STATIC_PAGES_FILES_DIR = path.join(STATIC_PAGES_DIR, "files");

const cleanValue = (value = "") => {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
};

const isEmptyValue = (value = "") => !cleanValue(value);

const readJsonFile = async (filePath) => {
  const content = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(content);
};

const readDocxText = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
};

const normalizeLines = (text = "") => {
  return String(text || "")
    .split(/\r?\n/)
    .map(cleanValue)
    .filter(Boolean);
};

const isEnglishVersionLine = (line = "") => {
  return cleanValue(line).toLowerCase() === "english version";
};

const isArabicBrandLine = (line = "") => {
  const value = cleanValue(line);
  return value === "هلا جوب / Hala Job";
};

const isEnglishBrandLine = (line = "") => {
  const value = cleanValue(line);
  return value === "Hala Job / هلا جوب";
};

const isBrandLine = (line = "") => {
  return isArabicBrandLine(line) || isEnglishBrandLine(line);
};

const isArabicMainHeaderNoise = (line = "") => {
  const value = cleanValue(line);

  return (
    value.startsWith("هلا جوب / Hala Job |") ||
    value.startsWith("هلا جوب / Hala Job -") ||
    value === "هلا جوب / Hala Job - صفحة تعريف بالتطبيق" ||
    value === "ــــــــــــــــــــــــــــــــــــــــ"
  );
};

const isFooterLine = (line = "") => {
  const value = cleanValue(line);

  return (
    value.startsWith("هلا جوب / Hala Job - آخر تحديث") ||
    value.startsWith("Hala Job / هلا جوب - Last updated") ||
    value === "Hala Job / هلا جوب" ||
    value.includes("support@halajob.com | privacy@halajob.com")
  );
};

const isArabicUpdatedLine = (line = "") => {
  const value = cleanValue(line);
  return value.startsWith("آخر تحديث");
};

const isEnglishUpdatedLine = (line = "") => {
  const value = cleanValue(line);
  return value.startsWith("Last updated");
};

const isUpdatedLine = (line = "") => {
  return isArabicUpdatedLine(line) || isEnglishUpdatedLine(line);
};

const isContactHeading = (line = "") => {
  const value = cleanValue(line).toLowerCase();

  return value === "معلومات التواصل" || value === "contact information";
};

const isNumberedHeading = (line = "") => {
  return /^\d+\.\s+/.test(cleanValue(line));
};

const getCustomTitleMarkers = (pageConfig = {}, lang = "ar") => {
  const key = lang === "ar" ? "ar_title_markers" : "en_title_markers";

  return Array.isArray(pageConfig[key])
    ? pageConfig[key].map(cleanValue).filter(Boolean)
    : [];
};

const isCustomHeadingLine = (line = "", pageConfig = {}, lang = "ar") => {
  const value = cleanValue(line);
  const markers = getCustomTitleMarkers(pageConfig, lang);

  return markers.includes(value);
};

const isHeadingLine = (line = "", pageConfig = {}, lang = "ar") => {
  if (isConfiguredPageTitle(line, pageConfig, lang)) {
    return false;
  }

  return (
    isNumberedHeading(line) ||
    isContactHeading(line) ||
    isCustomHeadingLine(line, pageConfig, lang)
  );
};

const getHeadingComparableKey = (line = "", pageConfig = {}, lang = "ar") => {
  const value = cleanValue(line);

  const numberMatch = value.match(/^(\d+)\./);
  if (numberMatch) {
    return `number:${numberMatch[1]}`;
  }

  if (isContactHeading(value)) {
    return "contact_information";
  }

  const arMarkers = getCustomTitleMarkers(pageConfig, "ar");
  const enMarkers = getCustomTitleMarkers(pageConfig, "en");

  if (lang === "ar") {
    const index = arMarkers.indexOf(value);
    if (index !== -1) return `custom:${index}`;
  }

  if (lang === "en") {
    const index = enMarkers.indexOf(value);
    if (index !== -1) return `custom:${index}`;
  }

  return `heading:${value.toLowerCase()}`;
};

const assertCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const splitArabicAndEnglishLines = (lines = [], fileName = "", pageConfig = {}) => {
  const customMarker = cleanValue(pageConfig.english_start_marker);

  if (customMarker) {
    const markerIndex = lines.findIndex((line) => {
      return cleanValue(line).toLowerCase() === customMarker.toLowerCase();
    });

    assertCondition(
      markerIndex !== -1,
      `Missing english_start_marker "${customMarker}" in file: ${fileName}`
    );

    const arLines = lines.slice(0, markerIndex);
    const enLines = lines.slice(markerIndex);

    assertCondition(arLines.length > 0, `Arabic section is empty: ${fileName}`);
    assertCondition(enLines.length > 0, `English section is empty: ${fileName}`);

    return {
      arLines,
      enLines,
    };
  }

  const englishIndex = lines.findIndex(isEnglishVersionLine);

  assertCondition(
    englishIndex !== -1,
    `Missing "English Version" separator in file: ${fileName}`
  );

  const arLines = lines.slice(0, englishIndex);
  const enLines = lines.slice(englishIndex + 1);

  assertCondition(arLines.length > 0, `Arabic section is empty: ${fileName}`);
  assertCondition(enLines.length > 0, `English section is empty: ${fileName}`);

  return {
    arLines,
    enLines,
  };
};

const getArabicTitle = (lines = [], fileName = "", pageConfig = {}) => {
  if (pageConfig.title_ar) {
    return cleanValue(pageConfig.title_ar);
  }

  const title = lines.find((line) => {
    if (isArabicMainHeaderNoise(line)) return false;
    if (isBrandLine(line)) return false;
    if (isUpdatedLine(line)) return false;
    if (isHeadingLine(line, pageConfig, "ar")) return false;
    if (isFooterLine(line)) return false;
    return !isEmptyValue(line);
  });

  assertCondition(title, `Missing Arabic title in file: ${fileName}`);

  return cleanValue(title);
};

const getEnglishTitle = (lines = [], fileName = "", pageConfig = {}) => {
  if (pageConfig.title_en) {
    return cleanValue(pageConfig.title_en);
  }

  const title = lines.find((line) => {
    if (isBrandLine(line)) return false;
    if (isUpdatedLine(line)) return false;
    if (isHeadingLine(line, pageConfig, "en")) return false;
    if (isFooterLine(line)) return false;
    return !isEmptyValue(line);
  });

  assertCondition(title, `Missing English title in file: ${fileName}`);

  return cleanValue(title);
};

const getFallbackDescriptionAfterFirstHeading = ({
  lines = [],
  firstHeadingIndex = 0,
  pageConfig = {},
  lang = "ar",
}) => {
  const descriptionLines = [];

  for (const rawLine of lines.slice(firstHeadingIndex + 1)) {
    const line = cleanValue(rawLine);

    if (!line) continue;
    if (isHeadingLine(line, pageConfig, lang)) break;
    if (isBrandLine(line)) continue;
    if (isFooterLine(line)) continue;
    if (isUpdatedLine(line)) continue;
    if (isEnglishVersionLine(line)) continue;
    if (isArabicMainHeaderNoise(line)) continue;

    descriptionLines.push(line);
  }

  return descriptionLines.join("\n");
};
const isConfiguredPageTitle = (line = "", pageConfig = {}, lang = "ar") => {
  const value = cleanValue(line);

  const configuredTitle =
    lang === "ar" ? pageConfig.title_ar : pageConfig.title_en;

  return configuredTitle && value === cleanValue(configuredTitle);
};
const getSectionDescription = ({
  lines = [],
  title = "",
  fileName = "",
  lang = "ar",
  pageConfig = {},
}) => {
  const manualUpdatedText =
    lang === "ar" ? pageConfig.updated_text_ar : pageConfig.updated_text_en;

  const updatedIndex = lines.findIndex((line) => {
    return lang === "ar" ? isArabicUpdatedLine(line) : isEnglishUpdatedLine(line);
  });

  assertCondition(
    updatedIndex !== -1 || manualUpdatedText,
    `Missing ${lang} updated line in file: ${fileName}`
  );

  const firstHeadingIndex = lines.findIndex((line) => {
    return isHeadingLine(line, pageConfig, lang);
  });

  assertCondition(
    firstHeadingIndex !== -1,
    `Missing ${lang} first heading in file: ${fileName}`
  );

  if (updatedIndex !== -1) {
    assertCondition(
      firstHeadingIndex > updatedIndex || pageConfig.allow_heading_before_updated === true,
      `Invalid ${lang} structure. First heading appears before updated line in file: ${fileName}`
    );
  }

  const sliceStart = updatedIndex !== -1 ? updatedIndex + 1 : 0;

  const descriptionLines = lines
    .slice(sliceStart, firstHeadingIndex)
    .filter((line) => {
      const value = cleanValue(line);

      if (!value) return false;
      if (value === cleanValue(title)) return false;
      if (isBrandLine(value)) return false;
      if (isFooterLine(value)) return false;
      if (isUpdatedLine(value)) return false;
      if (isEnglishVersionLine(value)) return false;
      if (isArabicMainHeaderNoise(value)) return false;

      return true;
    })
    .map(cleanValue);

  let description = descriptionLines.join("\n");

  if (!description) {
    description = getFallbackDescriptionAfterFirstHeading({
      lines,
      firstHeadingIndex,
      pageConfig,
      lang,
    });
  }

  assertCondition(
    description,
    `Missing ${lang} description in file: ${fileName}`
  );

  return {
    description,
    updatedText:
      updatedIndex !== -1 ? cleanValue(lines[updatedIndex]) : cleanValue(manualUpdatedText),
    firstHeadingIndex,
  };
};

const parseContentBlocks = ({
  lines = [],
  startIndex = 0,
  updatedText = "",
  fileName = "",
  lang = "ar",
  pageConfig = {},
}) => {
  const blocks = [];

  if (updatedText) {
    blocks.push({
      type: "description",
      value: updatedText,
    });
  }

  let currentDescriptionLines = [];

  const flushDescription = () => {
    const value = currentDescriptionLines
      .map(cleanValue)
      .filter(Boolean)
      .join("\n");

    if (value) {
      blocks.push({
        type: "description",
        value,
      });
    }

    currentDescriptionLines = [];
  };

  for (const rawLine of lines.slice(startIndex)) {
    const line = cleanValue(rawLine);

    if (!line) continue;
    if (isConfiguredPageTitle(line, pageConfig, lang)) continue;
    if (isBrandLine(line)) continue;
    if (isFooterLine(line)) continue;
    if (isEnglishVersionLine(line)) continue;
    if (isUpdatedLine(line)) continue;
    if (isArabicMainHeaderNoise(line)) continue;

    if (isHeadingLine(line, pageConfig, lang)) {
      flushDescription();

      blocks.push({
        type: "title",
        value: line,
      });

      continue;
    }

    currentDescriptionLines.push(line);
  }

  flushDescription();

  assertCondition(
    blocks.length > 0,
    `No ${lang} content blocks parsed in file: ${fileName}`
  );

  assertCondition(
    blocks.some((block) => block.type === "title"),
    `No ${lang} title blocks parsed in file: ${fileName}`
  );

  return blocks;
};

const parseArabicPage = (lines = [], fileName = "", pageConfig = {}) => {
  const title = getArabicTitle(lines, fileName, pageConfig);

  const { description, updatedText, firstHeadingIndex } = getSectionDescription({
    lines,
    title,
    fileName,
    lang: "ar",
    pageConfig,
  });

  const blocks = parseContentBlocks({
    lines,
    startIndex: firstHeadingIndex,
    updatedText,
    fileName,
    lang: "ar",
    pageConfig,
  });

  return {
    title,
    description,
    blocks,
  };
};

const parseEnglishPage = (lines = [], fileName = "", pageConfig = {}) => {
  const title = getEnglishTitle(lines, fileName, pageConfig);

  const { description, updatedText, firstHeadingIndex } = getSectionDescription({
    lines,
    title,
    fileName,
    lang: "en",
    pageConfig,
  });

  const blocks = parseContentBlocks({
    lines,
    startIndex: firstHeadingIndex,
    updatedText,
    fileName,
    lang: "en",
    pageConfig,
  });

  return {
    title,
    description,
    blocks,
  };
};

const mergeArabicAndEnglishBlocks = ({
  arBlocks = [],
  enBlocks = [],
  fileName = "",
  pageConfig = {},
}) => {
  assertCondition(
    arBlocks.length === enBlocks.length,
    [
      `Arabic/English content blocks count mismatch in file: ${fileName}`,
      `Arabic blocks: ${arBlocks.length}`,
      `English blocks: ${enBlocks.length}`,
    ].join("\n")
  );

  return arBlocks.map((arBlock, index) => {
    const enBlock = enBlocks[index];

    assertCondition(
      arBlock.type === enBlock.type,
      [
        `Arabic/English block type mismatch in file: ${fileName}`,
        `Index: ${index}`,
        `Arabic type: ${arBlock.type}`,
        `English type: ${enBlock.type}`,
        `Arabic value: ${arBlock.value}`,
        `English value: ${enBlock.value}`,
      ].join("\n")
    );

    if (arBlock.type === "title") {
      const arComparableKey = getHeadingComparableKey(
        arBlock.value,
        pageConfig,
        "ar"
      );

      const enComparableKey = getHeadingComparableKey(
        enBlock.value,
        pageConfig,
        "en"
      );

      assertCondition(
        arComparableKey === enComparableKey,
        [
          `Arabic/English title alignment mismatch in file: ${fileName}`,
          `Index: ${index}`,
          `Arabic title: ${arBlock.value}`,
          `English title: ${enBlock.value}`,
          `Arabic key: ${arComparableKey}`,
          `English key: ${enComparableKey}`,
        ].join("\n")
      );
    }

    return {
      type: arBlock.type,
      value_ar: arBlock.value,
      value_en: enBlock.value,
    };
  });
};

const validatePageConfig = (pageConfig = {}) => {
  assertCondition(pageConfig.key, "Page config missing key");

  assertCondition(
    pageConfig.file_name,
    `Page config missing file_name for key: ${pageConfig.key}`
  );
};

const validatePageData = (page = {}) => {
  assertCondition(page.key, "Page data missing key");
  assertCondition(page.title_ar, `Missing title_ar for page: ${page.key}`);
  assertCondition(page.title_en, `Missing title_en for page: ${page.key}`);

  assertCondition(
    page.description_ar,
    `Missing description_ar for page: ${page.key}`
  );

  assertCondition(
    page.description_en,
    `Missing description_en for page: ${page.key}`
  );

  assertCondition(
    Array.isArray(page.content),
    `Content must be array for page: ${page.key}`
  );

  assertCondition(
    page.content.length > 0,
    `Content is empty for page: ${page.key}`
  );

  for (const [index, item] of page.content.entries()) {
    assertCondition(
      ["title", "description"].includes(item.type),
      `Invalid content type at ${page.key}[${index}]: ${item.type}`
    );

    assertCondition(
      typeof item.value_ar === "string",
      `value_ar must be string at ${page.key}[${index}]`
    );

    assertCondition(
      typeof item.value_en === "string",
      `value_en must be string at ${page.key}[${index}]`
    );
  }
};

const readStaticPagesManifest = async () => {
  const manifestPath = path.join(STATIC_PAGES_DIR, "pages_manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Static pages manifest not found: ${manifestPath}`);
  }

  const manifest = await readJsonFile(manifestPath);

  assertCondition(
    Array.isArray(manifest),
    "Static pages manifest must be an array"
  );

  return manifest;
};

const buildPageFromDocx = async (pageConfig = {}) => {
  validatePageConfig(pageConfig);

  const filePath = path.join(STATIC_PAGES_FILES_DIR, pageConfig.file_name);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Static page DOCX file not found: ${filePath}`);
  }

  const text = await readDocxText(filePath);
  const lines = normalizeLines(text);

  assertCondition(
    lines.length > 0,
    `DOCX file is empty or unreadable: ${pageConfig.file_name}`
  );

  const { arLines, enLines } = splitArabicAndEnglishLines(
    lines,
    pageConfig.file_name,
    pageConfig
  );

  const arPage = parseArabicPage(arLines, pageConfig.file_name, pageConfig);
  const enPage = parseEnglishPage(enLines, pageConfig.file_name, pageConfig);

  const content = mergeArabicAndEnglishBlocks({
    arBlocks: arPage.blocks,
    enBlocks: enPage.blocks,
    fileName: pageConfig.file_name,
    pageConfig,
  });

  const pageData = {
    key: pageConfig.key,

    image: pageConfig.image || null,

    title_ar: arPage.title,
    title_en: enPage.title,

    description_ar: arPage.description,
    description_en: enPage.description,

    content,

    status: pageConfig.status !== undefined ? Boolean(pageConfig.status) : true,
    is_ios: pageConfig.is_ios !== undefined ? Boolean(pageConfig.is_ios) : false,
  };

  validatePageData(pageData);

  return pageData;
};

const buildStaticPagesFromDocxFiles = async () => {
  const manifest = await readStaticPagesManifest();

  const pages = [];
  const keys = new Set();

  for (const pageConfig of manifest) {
    validatePageConfig(pageConfig);

    if (keys.has(pageConfig.key)) {
      throw new Error(`Duplicated static page key in manifest: ${pageConfig.key}`);
    }

    keys.add(pageConfig.key);

    const page = await buildPageFromDocx(pageConfig);
    pages.push(page);
  }

  return pages;
};

const readCombinedStaticPages = async (filePath) => {
  const pages = await readJsonFile(filePath);

  assertCondition(
    Array.isArray(pages),
    "static_pages_combined.json must be an array"
  );

  pages.forEach(validatePageData);

  return pages;
};

const buildStaticPages = async () => {
  const combinedPath = path.join(STATIC_PAGES_DIR, "static_pages_combined.json");

  if (fs.existsSync(combinedPath)) {
    console.log("Reading static pages from static_pages_combined.json");
    return readCombinedStaticPages(combinedPath);
  }

  return buildStaticPagesFromDocxFiles();
};

export const generateCombinedStaticPagesFile = async () => {
  const pages = await buildStaticPagesFromDocxFiles();

  const outputPath = path.join(STATIC_PAGES_DIR, "static_pages_combined.json");

  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(pages, null, 2),
    "utf8"
  );

  console.log(`✅ Combined static pages file generated: ${outputPath}`);
  console.log(`Total pages: ${pages.length}`);
};

export const seedStaticPages = async () => {
  try {
    const pages = await buildStaticPages();

    console.log(`Preparing ${pages.length} static pages...`);

    if (!pages.length) {
      console.log("⚠️ No static pages found");
      return;
    }

    const operations = pages.map((page) => ({
      updateOne: {
        filter: { key: page.key },
        update: {
          $set: {
            image: page.image || null,

            title_ar: page.title_ar,
            title_en: page.title_en,

            description_ar: page.description_ar,
            description_en: page.description_en,

            content: page.content,

            status: page.status !== undefined ? Boolean(page.status) : true,
            is_ios: page.is_ios !== undefined ? Boolean(page.is_ios) : false,
          },
          $setOnInsert: {
            key: page.key,
          },
        },
        upsert: true,
      },
    }));

    const result = await PageModel.bulkWrite(operations, {
      ordered: false,
    });

    console.log("✅ Static pages seeded successfully");
    console.log({
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (error) {
    console.error("❌ Static pages seeder error:", error);
    throw error;
  }
};

export default seedStaticPages;