// helper/word/lib/keywords.js
import fs from "fs";
import path from "path";

/* ========= مسارات آمنة ========= */
const DATA_DIR = path.join(process.cwd(), "data");
const CORPUS = path.join(DATA_DIR, "corpus.jsonl");

function ensureCorpus() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CORPUS)) fs.writeFileSync(CORPUS, "");
}

/* ========= أدوات بسيطة ========= */
const AR = /[\u0600-\u06FF]/;
const tokenize = (s) =>
  (String(s).toLowerCase().match(/[A-Za-z\u0600-\u06FF]+/g) || []);

const STOP_AR = new Set(["في","من","على","عن","إلى","الى","و","يا","ما","لا","لم","لن","إن","ان","أن","اذا","قد","هذه","هذا","ذلك","هناك","هو","هي","هم","هن","كان","كانت","كل"]);
const STOP_EN = new Set(["the","a","an","and","or","but","to","in","on","for","of","with","at","by","is","are","was","were","be","been","this","that","these","those","it","as","from"]);

const notStop = (w) => {
  if (AR.test(w)) return !STOP_AR.has(w) && w.length > 2;
  return !STOP_EN.has(w) && w.length > 2;
};

/* ========= الكتابة للكوربس ========= */
export function addDocToCorpus(id, lang, text) {
  try {
    ensureCorpus();
    const row = {
      t: Date.now(),
      id: String(id || `doc-${Date.now()}`),
      lang: lang === "ar" ? "ar" : "en",
      text: String(text || "")
    };
    fs.appendFileSync(CORPUS, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    // لا تفشل السريان؛ فقط سجّل
    console.warn("addDocToCorpus warn:", e.message);
  }
}

/* ========= استخراج الكلمات المفتاحية من الكوربس ========= */
export function topKeywords({ k = 25 } = {}) {
  try {
    if (!fs.existsSync(CORPUS)) return [];
    const freq = new Map();
    const rl = fs.readFileSync(CORPUS, "utf8").split(/\r?\n/);

    for (const line of rl) {
      if (!line) continue;
      let obj;
      try { obj = JSON.parse(line); } catch { continue; }
      for (const w of tokenize(obj.text)) {
        if (notStop(w)) freq.set(w, (freq.get(w) || 0) + 1);
      }
    }

    return Array.from(freq.entries())
      .sort((a,b) => b[1]-a[1])
      .slice(0, k)
      .map(([term, count]) => ({ term, count }));
  } catch (e) {
    console.warn("topKeywords warn:", e.message);
    return [];
  }
}

export default { addDocToCorpus, topKeywords };
