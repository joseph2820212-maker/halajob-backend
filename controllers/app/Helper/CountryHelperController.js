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

function tokenize(text = "") {
  const norm = normalizeMixed(text);

  return norm
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 2);
}

function uniquePreserveOrder(arr) {
  const seen = new Set();
  const out = [];

  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }

  return out;
}

function extractPhrases(tokens, { maxPhrases = 5 } = {}) {
  const phrases = [];

  for (let i = 0; i < tokens.length; i++) {
    const bigram = [tokens[i], tokens[i + 1]].filter(Boolean);

    if (bigram.length === 2) {
      phrases.push(bigram.join(" "));
    }
  }

  return uniquePreserveOrder(phrases).slice(0, maxPhrases);
}

/* ======================== Dictionary ======================== */
let DICT_CACHE = { terms: [], at: 0 };

const DICT_TTL_MS = 10 * 60 * 1000;

async function getDictionary() {
  const now = Date.now();

  if (
    now - DICT_CACHE.at < DICT_TTL_MS &&
    DICT_CACHE.terms.length
  ) {
    return DICT_CACHE.terms;
  }

  const docs = await CountryModel.find(
    {},
    {
      country_code: 1,
      country_name_ar: 1,
      country_name_en: 1,
      city_name_ar: 1,
      city_name_en: 1,
    }
  ).lean();

  const set = new Set();

  for (const d of docs) {
    [
      d.country_code,
      d.country_name_ar,
      d.country_name_en,
      d.city_name_ar,
      d.city_name_en,
    ]
      .filter(Boolean)
      .forEach((t) => {
        const n = normalizeMixed(String(t));

        if (n) {
          set.add(n);

          n.split(/\s+/).forEach((w) => {
            if (w) set.add(w);
          });
        }
      });
  }

  DICT_CACHE = {
    terms: Array.from(set),
    at: now,
  };

  return DICT_CACHE.terms;
}

/* ======================== Levenshtein ======================== */
function levenshtein(a = "", b = "") {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);

  for (let i = 0; i < v0.length; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;

    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;

      v1[j + 1] = Math.min(
        v1[j] + 1,
        v0[j + 1] + 1,
        v0[j] + cost
      );
    }

    for (let j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[b.length];
}

function correctTokens(tokens, dict) {
  const out = [];

  for (const t of tokens) {
    if (t.length <= 3) {
      out.push(t);
      continue;
    }

    let best = t;
    let bestDist = Infinity;

    for (const cand of dict) {
      if (
        Math.abs(cand.length - t.length) >
        Math.max(2, Math.floor(t.length * 0.5))
      ) {
        continue;
      }

      const d = levenshtein(t, cand);

      if (d < bestDist) {
        bestDist = d;
        best = cand;
      }

      if (bestDist === 0) break;
    }

    out.push(
      bestDist <= Math.max(2, Math.floor(t.length * 0.25))
        ? best
        : t
    );
  }

  return uniquePreserveOrder(out);
}

/* ======================== Mongo ======================== */
function buildAndMatch(tokens) {
  return {
    $and: tokens.map((tok) => {
      const rx = new RegExp(escapeRegex(tok), "i");

      return {
        $or: [
          { country_code: rx },
          { country_name_ar: rx },
          { country_name_en: rx },
          { city_name_ar: rx },
          { city_name_en: rx },
        ],
      };
    }),
  };
}

function buildScoreExpr(tokens, phrases) {
  const fields = [
    "$country_code",
    "$country_name_ar",
    "$country_name_en",
    "$city_name_ar",
    "$city_name_en",
  ];

  const tokenPoints = tokens.map((tok) => {
    const rx = escapeRegex(tok);

    return {
      $cond: [
        {
          $or: fields.map((f) => ({
            $regexMatch: {
              input: { $ifNull: [f, ""] },
              regex: rx,
              options: "i",
            },
          })),
        },
        1,
        0,
      ],
    };
  });

  const phrasePoints = phrases.map((ph) => {
    const rx = escapeRegex(ph).replace(/\s+/g, "\\s+");

    return {
      $cond: [
        {
          $or: fields.map((f) => ({
            $regexMatch: {
              input: { $ifNull: [f, ""] },
              regex: rx,
              options: "i",
            },
          })),
        },
        2,
        0,
      ],
    };
  });

  return {
    $add: [...tokenPoints, ...phrasePoints],
  };
}

/* ======================== Search ======================== */
const search = async (req, res) => {
  const lan = String(req.get("lan") || "en").toLowerCase();

  try {
    const rawQuery = String(req.query.search || "").trim();

    if (!rawQuery) {
      return ReturnAppData.getError({
        res,
        message:
          lan === "ar"
            ? "حقل البحث مطلوب"
            : "query 'search' required",
      });
    }

    let tokens = tokenize(rawQuery);

    if (!tokens.length) {
      return ReturnAppData.getData({
        res,
        data: [],
      });
    }

    tokens = uniquePreserveOrder(tokens).slice(0, 8);

    const phrases = extractPhrases(tokens);

    const pipeline = [
      {
        $match: buildAndMatch(tokens),
      },
      {
        $addFields: {
          __score: buildScoreExpr(tokens, phrases),
        },
      },
      {
        $sort: {
          __score: -1,
        },
      },
      {
        $limit: 50,
      },
    ];

    let docs = await CountryModel.aggregate(pipeline);

    if (docs.length === 0) {
      const dict = await getDictionary();

      const corrected = correctTokens(tokens, dict);

      if (corrected.join(" ") !== tokens.join(" ")) {
        docs = await CountryModel.aggregate([
          {
            $match: buildAndMatch(corrected),
          },
          {
            $addFields: {
              __score: buildScoreExpr(corrected, []),
            },
          },
          {
            $sort: {
              __score: -1,
            },
          },
          {
            $limit: 50,
          },
        ]);
      }
    }

    const results = docs.map((d) => ({
      id: String(d._id),

      symbol: d.country_code || null,

      country_code: d.country_code || null,

      country_name:
        lan === "ar"
          ? d.country_name_ar
          : d.country_name_en,

      city_name:
        lan === "ar"
          ? d.city_name_ar
          : d.city_name_en,

      country_name_ar: d.country_name_ar || null,
      country_name_en: d.country_name_en || null,

      city_name_ar: d.city_name_ar || null,
      city_name_en: d.city_name_en || null,

      title:
        lan === "ar"
          ? d.city_name_ar
          : d.city_name_en,
    }));

    return ReturnAppData.getData({
      res,
      data: results,
    });
  } catch (err) {
    console.error(err);

    return ReturnAppData.getError({
      res,
      message:
        lan === "ar"
          ? "حدث خطأ غير متوقع"
          : "server error",
    });
  }
};

const get = async (req, res) => {
  const lan = String(req.get("lan") || "en").toLowerCase();

  try {
    const docs = await CountryModel.find({}).lean();

    const results = docs.map((d) => ({
      id: String(d._id),

      symbol: d.country_code || null,

      country_code: d.country_code || null,

      country_name:
        lan === "ar"
          ? d.country_name_ar
          : d.country_name_en,

      city_name:
        lan === "ar"
          ? d.city_name_ar
          : d.city_name_en,

      country_name_ar: d.country_name_ar || null,
      country_name_en: d.country_name_en || null,

      city_name_ar: d.city_name_ar || null,
      city_name_en: d.city_name_en || null,
    }));

    return ReturnAppData.getData({
      res,
      data: results,
    });
  } catch (err) {
    console.error(err);

    return ReturnAppData.getError({
      res,
      message:
        lan === "ar"
          ? "حدث خطأ غير متوقع"
          : "server error",
    });
  }
};

export default {
  search,
  get,
};