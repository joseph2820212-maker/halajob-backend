// controllers/searchController.js
import { CountryModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

/* ======================== Helpers ======================== */
const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_AR_EN = /[^A-Za-z\u0600-\u06FF\s]/g;

function normalizeArabic(str = "") {
  return str
    .replace(AR_DIACRITICS, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "");
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

  // اجلب الحقول اللازمة فعليًا
  const docs = await CountryModel.find(
    {},
    {
      code: 1,
      name: 1,
      keyword: 1,
      region_name_ar: 1,
      region_name_en: 1,
      country_name_ar: 1,
      country_name_en: 1
    }
  ).lean();

  const set = new Set();
  for (const d of docs) {
    [
      d.name,
      d.code,
      d.region_name_ar,
      d.region_name_en,
      d.country_name_ar,
      d.country_name_en
    ]
      .filter(Boolean)
      .forEach(t => {
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
function pickTitle(doc, lan,is_country=false) {
  const region = lan === "ar" ? (doc.region_name_ar || doc.region_name_en) : (doc.region_name_en || doc.region_name_ar);
  const country = lan === "ar" ? (doc.country_name_ar || doc.country_name_en) : (doc.country_name_en || doc.country_name_ar);
  if (is_country) {
    
    return country
  }
  return region || country || doc.name || doc.code || "";
}

/* =============== بناء الاستعلام =============== */
function buildAndMatch(tokens) {
  return {
    $and: tokens.map((tok) => {
      const rxObj = new RegExp(escapeRegex(tok), "i");
      return {
        $or: [
          { code: rxObj },
          { region_name_en: rxObj },
          { region_name_ar: rxObj },
          { country_name_en: rxObj },
          { country_name_ar: rxObj },
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
            { $regexMatch: { input: "$code",            regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$region_name_en",  regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$region_name_ar",  regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$country_name_en", regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$country_name_ar", regex: rxStr, options: "i" } },
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
            { $regexMatch: { input: "$code",            regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$region_name_en",  regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$region_name_ar",  regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$country_name_en", regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$country_name_ar", regex: rxStr, options: "i" } },
          ]
        },
        2, 0
      ]
    };
  });

  return { $add: [...tokenPoints, ...phrasePoints] };
}

/* ======================== Controller ======================== */
const search = async (req, res) => {
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
          _id: 1,
          code: 1,
          region_name_ar: 1,
          region_name_en: 1,
          country_name_ar: 1,
          country_name_en: 1,
          name: 1
        }
      }
    ];

    let docs = await CountryModel.aggregate(pipeline).exec();

    // 3) تصحيح إملائي إن لزم
    if (docs.length === 0) {
      const dict = await getDictionary();
      const corrected = correctTokens(tokens, dict);
      if (corrected.join(" ") !== tokens.join(" ")) {
        const phrases2 = extractPhrases(corrected, { maxPhrases: 5 });
        const pipeline2 = [
          { $match: buildAndMatch(corrected) },
          { $addFields: { __score: buildScoreExpr(corrected, phrases2) } },
          { $sort: { __score: -1 } },
          { $limit: 50 },
          {
            $project: {
              _id: 1,
              code: 1,
              region_name_ar: 1,
              region_name_en: 1,
              country_name_ar: 1,
              country_name_en: 1,
              name: 1
            }
          }
        ];
        docs = await CountryModel.aggregate(pipeline2).exec();
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
          symbol: d.code || null, // رمز حقيقي
          title,
          country_name_ar: d.country_name_ar ?? null,
          country_name_en: d.country_name_en ?? null
        });
      }
    }

    return ReturnAppData.getData({ res, data: results });
  } catch (err) {
    console.error(err);
    const lan = String(req.get("lan") || "en").toLowerCase();
    return ReturnAppData.getError({
      res,
      message: lan === "ar" ? "حدث خطأ غير متوقع" : "server error"
    });
  }
};

const get = async (req, res) => {
  const lan = (req.get("lan") || "en").toLowerCase();
  const docs = await CountryModel.find(
    {},
    {
      _id: 1,
      code: 1,
      region_name_ar: 1,
      region_name_en: 1,
      country_name_ar: 1,
      country_name_en: 1,
      name: 1
    }
  ).lean();

  const results = docs.map((d) => ({
    id: String(d._id),
    region: pickTitle(d, lan),
    country: pickTitle(d, lan,true),
  }));

  return ReturnAppData.getData({ res, data: results });
};

export default { search, get };
