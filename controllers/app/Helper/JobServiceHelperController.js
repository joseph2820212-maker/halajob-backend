// controllers/searchController.js
import { JobServiceModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

/* ======================== Helpers ======================== */
// حركات/تنقية
const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_AR_EN = /[^A-Za-z\u0600-\u06FF\s]/g;

// ملاحظـة: أبقيت "ة" كما هي (لم أحولها إلى "ه") لنتائج أدق.
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
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// توقفات شائعة (مختصرة) بالعربية والإنجليزية
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

function tokenize(text) {
  const norm = normalizeMixed(text);
  const toks = norm.split(/\s+/).filter(Boolean);
  // استبعاد الوقفيات + كلمات قصيرة جداً
  const filtered = toks.filter(t => t.length >= 2 && !AR_STOP.has(t) && !EN_STOP.has(t));
  return filtered;
}

function uniquePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) { if (!seen.has(x)) { seen.add(x); out.push(x); } }
  return out;
}

// استخراج عبارات 2-3 كلمات (من الكلمات المهمة فقط)
function extractPhrases(tokens, {maxPhrases = 5} = {}) {
  const phrases = [];
  for (let i = 0; i < tokens.length; i++) {
    const bigram = [tokens[i], tokens[i+1]].filter(Boolean);
    const trigram = [tokens[i], tokens[i+1], tokens[i+2]].filter(Boolean);
    if (bigram.length === 2) phrases.push(bigram.join(" "));
    if (trigram.length === 3) phrases.push(trigram.join(" "));
  }
  return uniquePreserveOrder(phrases).slice(0, maxPhrases);
}

/* ---- Levenshtein و قاموس بسيط للتصحيح ---- */
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
  const docs = await JobServiceModel.find({}, { name: 1, title_ar: 1, title_en: 1, keyword: 1 }).lean();
  const set = new Set();
  for (const d of docs) {
    [d.name, d.title_ar, d.title_en].filter(Boolean).forEach(t => {
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
  // نصحح فقط الكلمات التي >3 حروف ولم نجد أي نتيجة لاحقاً
  const out = [];
  for (const t of tokens) {
    if (t.length <= 3) { out.push(t); continue; }
    let best = t, bestDist = Infinity;
    for (const cand of dict) {
      // نتجاهل المرشحين الطويلين جداً لتقليل الكلفة
      if (Math.abs(cand.length - t.length) > Math.max(2, Math.floor(t.length * 0.5))) continue;
      const d = levenshtein(t, cand);
      if (d < bestDist) { bestDist = d; best = cand; }
      if (bestDist === 0) break;
    }
    // عتبة تصحيح معتدلة
    out.push(bestDist <= Math.max(2, Math.floor(t.length * 0.25)) ? best : t);
  }
  return uniquePreserveOrder(out);
}

/* اختيار العنوان بحسب اللغة */
function pickTitle(doc, lan) {
  return lan === "ar" ? (doc.title_ar || doc.title_en || doc.name) : (doc.title_en || doc.title_ar || doc.name);
}

/* =============== البحث الدلالي المبسّط عبر Aggregation ===============

  الفكرة:
  - نستخرج كلمات مفتاحية من نص طويل (مع عبارات 2-3 كلمات).
  - نبني $match باستخدام AND لكل كلمة (كل كلمة لازم تظهر في أحد الحقول).
  - نبني score بالـ $addFields: لكل كلمة نقطة إذا ظهرت (1)،
    ولكل "عبارة" نعطي وزن 2.
  - نرتّب حسب score تنازليًا.
  - نُعيد فقط العناوين (deduped).
*/

function buildAndMatch(tokens) {
  return {
    $and: tokens.map((tok) => {
      const rxObj = new RegExp(escapeRegex(tok), "i"); // RegExp فيه i
      return {
        $or: [
          { name: rxObj },
          { title_ar: rxObj },
          { title_en: rxObj },
          // 👇 أهم تعديل: شِل $options لأن rxObj أصلاً يحمل i
          { keyword: { $elemMatch: { $regex: rxObj } } },
        ],
      };
    }),
  };
}
// نبني تعبير score داخل $addFields
function buildScoreExpr(tokens, phrases) {
  const tokenPoints = tokens.map(tok => {
    const rxStr = escapeRegex(tok); // نص فقط
    return {
      $cond: [
        {
          $or: [
            { $regexMatch: { input: "$name",     regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$title_ar", regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$title_en", regex: rxStr, options: "i" } },
            {
              $anyElementTrue: {
                $map: {
                  input: { $ifNull: ["$keyword", []] },
                  as: "k",
                  in: { $regexMatch: { input: "$$k", regex: rxStr, options: "i" } }
                }
              }
            }
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
            { $regexMatch: { input: "$name",     regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$title_ar", regex: rxStr, options: "i" } },
            { $regexMatch: { input: "$title_en", regex: rxStr, options: "i" } },
            {
              $anyElementTrue: {
                $map: {
                  input: { $ifNull: ["$keyword", []] },
                  as: "k",
                  in: { $regexMatch: { input: "$$k", regex: rxStr, options: "i" } }
                }
              }
            }
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
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const rawQuery = String(req.query.search || "").trim();
    if (!rawQuery) 
     return ReturnAppData.getError({res,message:lan==="ar"?"حقل البحث مطلوب":"query 'search reuired"});

    // 1) تحليل النص الطويل -> كلمات مفتاحية + عبارات
    let tokens = tokenize(rawQuery);
   if (!tokens.length) return ReturnAppData.getData({res,data:[]}); 

    // حد أقصى حتى لا تصبح الاستعلامات ثقيلة
    const MAX_TOKENS = 8;
    tokens = uniquePreserveOrder(tokens).slice(0, MAX_TOKENS);

    const phrases = extractPhrases(tokens, { maxPhrases: 5 });

    // 2) الاستعلام الأول: AND على الكلمات (ترتيب حر) + ترتيب بحسب score
    const pipeline = [
      { $match: buildAndMatch(tokens) },
      {
        $addFields: {
          __score: buildScoreExpr(tokens, phrases)
        }
      },
      { $sort: { __score: -1 } },
      { $limit: 50 },
      { $project: { title_ar: 1, title_en: 1, name: 1, __score: 1 } }
    ];

    let docs = await JobServiceModel.aggregate(pipeline).exec();

    // 3) إن لم نجد نتائج، جرّب التصحيح الإملائي لكل كلمة ثم أعد البحث
    if (docs.length === 0) {
      const dict = await getDictionary();
      const corrected = correctTokens(tokens, dict);
      // لو حصل تغيير حقيقي نعيد المحاولة
      const changed = corrected.join(" ") !== tokens.join(" ");
      if (changed) {
        const pipeline2 = [
          { $match: buildAndMatch(corrected) },
          { $addFields: { __score: buildScoreExpr(corrected, extractPhrases(corrected)) } },
          { $sort: { __score: -1 } },
          { $limit: 50 },
          { $project: { title_ar: 1, title_en: 1, name: 1, __score: 1 } }
        ];
        docs = await JobServiceModel.aggregate(pipeline2).exec();
      }
    }

    // 4) إعادة العناوين فقط (بدون تكرار)
   const results = [];
const seen = new Set();

for (const d of docs) {
  const title = pickTitle(d, lan);
  if (title && !seen.has(title)) {
    seen.add(title);
    results.push({
      id: String(d._id),
      title
    });
  }
}
    return ReturnAppData.getData({res,data:results})
  } catch (err) {
    console.error(err);
     return ReturnAppData.getError({res,message:lan==="ar"?"حدث خطأ غير متوقع":"server error"})
  }
};
const get=async(req,res,next)=>{
  const lan = (req.get("lan") || "en").toLowerCase();
  const data=await JobServiceModel.find();
  const results=data.map((item)=>{
    return {
      id:item._id,
      title:lan==="ar"?item.title_ar:item.title_en,
     
    }
  })
  return ReturnAppData.getData({res,data:results})
}
export default { search ,get};
