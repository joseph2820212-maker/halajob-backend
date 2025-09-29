// controllers/searchController.js
import { CurrencyModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

/* ======================== Helpers ======================== */
// حركات/تنقية
const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_AR_EN = /[^A-Za-z\u0600-\u06FF\s]/g;

function normalizeArabic(str = "") {
  return str
    .replace(AR_DIACRITICS, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا") // آ/أ/إ -> ا
    .replace(/\u0649/g, "ي")               // ى -> ي
    .replace(/\u0640/g, "");               // ـ
}
function normalizeEnglish(str = "") {
  return str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function filterArEn(str = "") {
  return str.replace(NON_AR_EN, " ").replace(/\s+/g, " ").trim();
}
function normalizeMixed(str = "") {
  let s = filterArEn(str);
  s = normalizeArabic(s);
  s = normalizeEnglish(s);
  return s;
}
function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// توقفات شائعة
const AR_STOP = new Set([
  "في","فيه","من","على","علي","الى","إلى","عن","أن","إن","او","أو","ثم","حتى","كل","كلا","كما",
  "كان","كانت","يكون","تكون","هذا","هذه","ذلك","تلك","هناك","هنا","هو","هي","هم","هن","ما","ماذا",
  "لم","لن","لا","قد","لقد","مع","بعد","قبل","بين","أين","اي","أي","كيف","لماذا","لما","إنما","أما",
  "أيضا","ايضا","وهذا","وهذه","وذلك","وتلك","و","يا","هل"
]);
const EN_STOP = new Set([
  "the","a","an","and","or","but","if","then","else","of","in","on","at","to","for","from","by",
  "is","are","was","were","be","been","being","this","that","these","those","there","here","with",
  "about","as","it","its","i","you","he","she","they","we","not","no","yes","do","does","did","done",
  "have","has","had","can","could","should","would","will","just","also","too","very"
]);

function tokenize(text = "") {
  const norm = normalizeMixed(text);
  const toks = norm.split(/\s+/).filter(Boolean);
  return toks.filter(t => t.length >= 2 && !AR_STOP.has(t) && !EN_STOP.has(t));
}

function uniquePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) if (!seen.has(x)) { seen.add(x); out.push(x); }
  return out;
}

// عبارات 2-3 كلمات
function extractPhrases(tokens, { maxPhrases = 5 } = {}) {
  const phrases = [];
  for (let i = 0; i < tokens.length; i++) {
    const bigram = [tokens[i], tokens[i + 1]].filter(Boolean);
    const trigram = [tokens[i], tokens[i + 1], tokens[i + 2]].filter(Boolean);
    if (bigram.length === 2) phrases.push(bigram.join(" "));
    if (trigram.length === 3) phrases.push(trigram.join(" "));
  }
  return uniquePreserveOrder(phrases).slice(0, maxPhrases);
}

/* ---- Levenshtein + قاموس ---- */
function levenshtein(a = "", b = "") {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);
  for (let i = 0; i < v0.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

let DICT_CACHE = { terms: [], at: 0 };
const DICT_TTL_MS = 10 * 60 * 1000;

async function getDictionary() {
  const now = Date.now();
  if (now - DICT_CACHE.at < DICT_TTL_MS && DICT_CACHE.terms.length) return DICT_CACHE.terms;
  const docs = await CurrencyModel.find({}, { name_ar: 1, name_en: 1 }).lean();
  const set = new Set();
  for (const d of docs) {
    [d.name, d.name_ar, d.name_en].filter(Boolean).forEach(t => {
      const n = normalizeMixed(String(t));
      if (n) {
        set.add(n);
        n.split(/\s+/).forEach(w => w && set.add(w));
      }
    });
    (Array.isArray(d.keyword) ? d.keyword : []).forEach(k => {
      const n = normalizeMixed(String(k));
      if (n) set.add(n);
    });
  }
  DICT_CACHE = { terms: Array.from(set), at: now };
  return DICT_CACHE.terms;
}

function correctTokens(tokens, dict) {
  const out = [];
  for (const t of tokens) {
    if (t.length <= 3) { out.push(t); continue; }
    let best = t, bestDist = Infinity;
    for (const cand of dict) {
      if (Math.abs(cand.length - t.length) > Math.max(2, Math.floor(t.length * 0.5))) continue;
      const d = levenshtein(t, cand);
      if (d < bestDist) { bestDist = d; best = cand; }
      if (bestDist === 0) break;
    }
    out.push(bestDist <= Math.max(2, Math.floor(t.length * 0.25)) ? best : t);
  }
  return uniquePreserveOrder(out);
}

/* اختيار العنوان */
function pickTitle(doc, lan) {
  return lan === "ar" ? (doc.name_ar || doc.name_en || doc.name) : (doc.name_en || doc.name_ar || doc.name);
}

/* =============== بناء الاستعلام =============== */
function buildAndMatch(tokens) {
  return {
    $and: tokens.map((tok) => {
      const rxObj = new RegExp(escapeRegex(tok), "i");
      return {
        $or: [
          { code: rxObj },
          { name_en: rxObj },
          { name_ar: rxObj },
        ],
      };
    }),
  };
}
function buildScoreExpr(tokens, phrases) {
  const tokenPoints = tokens.map(tok => {
    const rxStr = escapeRegex(tok);
    return {
      $cond: [
        {
          $or: [
            { $regexMatch: { input: "$code",     regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$name_en",  regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$name_ar",  regex: rxStr, options: "i" } },
          ]
        },
        1, 0
      ]
    };
  });

  const phrasePoints = phrases.map(ph => {
    const rxStr = escapeRegex(ph).replace(/\s+/g, "\\s+");
    return {
      $cond: [
        {
          $or: [
            { $regexMatch: { input: "$code",     regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$name_en",  regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$name_ar",  regex: rxStr, options: "i" } },
          ]
        },
        2, 0
      ]
    };
  });

  return { $add: [...tokenPoints, ...phrasePoints] }; // يُستخدم مباشرة داخل $addFields
}

/* ======================== Controller ======================== */
const search = async (req, res) => {
  // عرّف lan خارج try لتكون متاحة داخل catch
  const lan = String(req.get("lan") || "en").toLowerCase();

  try {
    const rawQuery = String(req.query.search || "").trim();
    if (!rawQuery) {
      return ReturnAppData.getError({
        res,
        message: lan === "ar" ? "حقل البحث مطلوب" : "query 'search' required"
      });
    }

    // 1) تحليل النص
    let tokens = tokenize(rawQuery);
    if (!tokens.length) return ReturnAppData.getData({ res, data: [] });

    const MAX_TOKENS = 8;
    tokens = uniquePreserveOrder(tokens).slice(0, MAX_TOKENS);
    const phrases = extractPhrases(tokens, { maxPhrases: 5 });

    // 2) الاستعلام الأول
   const pipeline = [
  { $match: buildAndMatch(tokens) },
  { $addFields: { __score: buildScoreExpr(tokens, phrases) } },
  { $sort: { __score: -1 } },
  { $limit: 50 },
  {
    $project: {
      name_ar: 1,
      name_en: 1,
      symbol_ar: 1,
      symbol_en: 1
    }
  }
];

    let docs = await CurrencyModel.aggregate(pipeline).exec();

    // 3) تصحيح إملائي إن لزم
    if (docs.length === 0) {
      const dict = await getDictionary();
      const corrected = correctTokens(tokens, dict);
      const changed = corrected.join(" ") !== tokens.join(" ");
      if (changed) {
        const phrases2 = extractPhrases(corrected, { maxPhrases: 5 });
     const pipeline2 = [
  { $match: buildAndMatch(corrected) },
  { $addFields: { __score: buildScoreExpr(corrected, phrases2) } },
  { $sort: { __score: -1 } },
  { $limit: 50 },
  {
    $project: {
      name_ar: 1,
      name_en: 1,
      symbol_ar: 1,
      symbol_en: 1
    }
  }
];

        docs = await CurrencyModel.aggregate(pipeline2).exec();
      }
    }

    // 4) النتائج
    const results = [];
    const seen = new Set();
    for (const d of docs) {
      const title = pickTitle(d, lan);
      if (title && !seen.has(title)) {
        seen.add(title);
        results.push({
          id: String(d._id),
          title,
          symbol_ar: d.symbol_ar ?? null,
          symbol_en: d.symbol_en ?? null,
        });
      }
    }

    return ReturnAppData.getData({ res, data: results });
  } catch (err) {
    console.error(err);
    return ReturnAppData.getError({
      res,
      message: lan === "ar" ? "حدث خطأ غير متوقع" : "server error"
    });
  }
};
const get=async(req,res,next)=>{
  const lan = (req.get("lan") || "en").toLowerCase();
  const data=await CurrencyModel.find();
  const results=data.map((item)=>{
    return {
      id:item._id,
      symbol:lan==="ar"?item.symbol_ar:item.symbol_en,
      title:lan==="ar"?item.name_ar:item.name_en,
     
    }
  })
  return ReturnAppData.getData({res,data:results})
}
export default { search,get };
