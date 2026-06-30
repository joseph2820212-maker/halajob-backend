import { readFile } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const extOf = (file) =>
  String(path.extname(file?.originalname || file?.path || "") || "")
    .toLowerCase()
    .replace(/^\./, "");

const isDocx = (file) =>
  file?.mimetype === DOCX_MIME || extOf(file) === "docx";

const isPlainText = (file) =>
  String(file?.mimetype || "").startsWith("text/") ||
  ["txt", "md", "text"].includes(extOf(file));

/**
 * Read the raw text out of an uploaded CV file. Supports plain text and DOCX
 * (via mammoth). PDF and other binary formats are intentionally unsupported in
 * this build — the caller falls back to a manual-review failure.
 */
export const extractRawText = async (file) => {
  if (!file?.path) return { text: "", unsupported: true };

  if (isPlainText(file)) {
    const text = await readFile(file.path, "utf8");
    return { text, unsupported: false };
  }

  if (isDocx(file)) {
    const { value } = await mammoth.extractRawText({ path: file.path });
    return { text: value || "", unsupported: false };
  }

  return { text: "", unsupported: true };
};

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const URL_RE = /\bhttps?:\/\/[^\s)]+/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/;

const sectionLines = (lines, headings) => {
  const lower = headings.map((h) => h.toLowerCase());
  const collected = [];
  let active = false;
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.replace(/[:：].*$/, "").trim().toLowerCase();
    if (lower.includes(heading)) {
      active = true;
      continue;
    }
    // A new short heading-like line ends the current section.
    if (active && /^[A-Za-z][A-Za-z &/]{1,30}:?$/.test(line) && line.length < 32 && !line.includes(",")) {
      const h = line.replace(/[:：].*$/, "").trim().toLowerCase();
      if (!lower.includes(h)) {
        active = false;
        continue;
      }
    }
    if (active && line) collected.push(line);
  }
  return collected;
};

/**
 * Heuristically pull structured fields out of raw CV text. This is a best-effort
 * local adapter — it never throws, and confidence reflects how much it found.
 */
export const extractFieldsFromText = (text = "") => {
  const clean = String(text || "").replace(/\r/g, "");
  const lines = clean.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  const email = (clean.match(EMAIL_RE) || [])[0] || "";
  const phone = (clean.match(PHONE_RE) || [])[0] || "";
  const links = [...new Set((clean.match(URL_RE) || []).map((u) => u.replace(/[.,;]+$/, "")))];

  // The first meaningful line is usually the candidate's name; the next is often
  // a headline/role.
  const fullName = nonEmpty[0] && nonEmpty[0].length <= 80 ? nonEmpty[0] : "";
  const headlineCandidate = nonEmpty[1] && nonEmpty[1].length <= 120 ? nonEmpty[1] : "";

  const skills = sectionLines(lines, ["skills", "technical skills", "key skills"])
    .join(", ");
  const languages = sectionLines(lines, ["languages", "language"]).join(", ");
  const summary = sectionLines(lines, ["summary", "profile", "about", "objective"])
    .join(" ")
    .slice(0, 3000);

  return {
    profile_headline: headlineCandidate,
    current_job_title: headlineCandidate,
    about_me: summary,
    skills,
    languages,
    links,
    full_name: fullName,
    email,
    phone,
  };
};

const FIELD_WEIGHTS = [
  ["full_name", 0.2],
  ["email", 0.2],
  ["skills", 0.25],
  ["about_me", 0.15],
  ["profile_headline", 0.1],
  ["phone", 0.1],
];

export const scoreConfidence = (fields = {}) =>
  Math.round(
    FIELD_WEIGHTS.reduce(
      (sum, [key, weight]) =>
        sum + (String(fields[key] || "").trim() ? weight : 0),
      0,
    ) * 100,
  ) / 100;

export default { extractRawText, extractFieldsFromText, scoreConfidence };
