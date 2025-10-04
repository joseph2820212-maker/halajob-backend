import fs from "fs";
import path from "path";
import dictEN from "dictionary-en";
import nspell from "nspell";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { queueUnknown, autoPromote } from "./lib/learning.js";
import { addDocToCorpus, topKeywords } from "./lib/keywords.js";
 import * as araby from "araby";
 const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
 const _fallbackStrip = (s="") => s.replace(AR_DIACRITICS, "");
 const stripDia =
   (araby && (araby.arabicStripTashkeel || araby.stripTashkeel)) || _fallbackStrip;
/* ================= إعدادات قابلة للتخصيص ================= */
const TARGET_KEYWORDS = new Set([
  "طلب","فاتورة","دفع","شحن","عقد","مرتجع","عنوان","شركة","عميل",
  "order","invoice","payment","shipping","contract","refund","address","company","customer"
]);

const CURRENCY_CODES = new Set(["USD","EUR","GBP","JPY","CNY","SAR","AED","EGP","SYP","TRY","IQD","JOD","KWD","QAR","OMR","MAD","TND"]);
const COUNTRY_ALPHA2 = new Set(["US","GB","DE","FR","IT","ES","TR","AE","SA","EG","SY","JO","QA","OM","KW","IQ","TN","MA"]);

/* ================= تطبيع ولواحق ================= */
const AR = /[\u0600-\u06FF]/;
const AR_TATWEEL = /\u0640/g;
const AR_ALEF_VAR = /[\u0622\u0623\u0625]/g;
const AR_ALEF_MAKSURA = /\u0649/g;
const AR_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;
const arDigitsMap = {
  "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9",
  "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9"
};
const mapArDigits = s => s.replace(AR_DIGITS, d => arDigitsMap[d] || d);

const normalizeArabic = (s="") =>
  mapArDigits(stripDia(s).replace(AR_TATWEEL,"").replace(AR_ALEF_VAR,"ا").replace(AR_ALEF_MAKSURA,"ي")).trim();

const normalizeEnglish = (s="") =>
  mapArDigits(s.normalize("NFKD").replace(/[^\w\s.@:/+-]/g,"")).toLowerCase().trim();

const normalizeAll = (s="") => (AR.test(s) ? normalizeArabic(s) : normalizeEnglish(s));

/* ================= تجزئة ================= */
const tokenize = (s) =>
  (s.match(/(https?:\/\/\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|[A-Za-z\u0600-\u06FF]+|\d+[\d.,/:-]*)/g) || []);

/* ================= Damerau–Levenshtein ================= */
function dld(a,b){
  const A=a.length,B=b.length,dp=Array.from({length:A+1},()=>Array(B+1).fill(0));
  for(let i=0;i<=A;i++) dp[i][0]=i;
  for(let j=0;j<=B;j++) dp[0][j]=j;
  for(let i=1;i<=A;i++){
    for(let j=1;j<=B;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost);
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) dp[i][j]=Math.min(dp[i][j],dp[i-2][j-2]+cost);
    }
  }
  return dp[A][B];
}

/* ================= nspell EN ================= */
const enSpeller = await new Promise((resolve, reject) => {
  dictEN((err, dict) => err ? reject(err) : resolve(nspell(dict)));
});

/* ================= nspell AR (اختياري) ================= */
const DICT = (p="") => path.join(process.cwd(), "data", "builddict", p); // aff/dic فقط
const USER = (p="") => path.join(process.cwd(), "data", p);              // ملفات المستخدم
// تحميل القاموس العربي مع حماية من ENOENT
let arSpeller = null;
try {
  const affBuf = fs.readFileSync(DICT("arb_alias.aff"), "utf8");
  const dicBuf = fs.readFileSync(DICT("arb_alias.dic"), "utf8");
  arSpeller = nspell(affBuf, dicBuf);
  const userFile = USER("arabic_words.txt");
  if (fs.existsSync(userFile)) {
    for (const w of fs.readFileSync(userFile,"utf8").split(/\r?\n/)) {
      if (w.trim()) arSpeller.add(w.trim());
    }
  }
} catch (e) {
  console.warn("Arabic speller disabled:", e.message);
}

/* ================= gazetteer أماكن عربية (اختياري) ================= */
let arPlaces = new Set();
if (fs.existsSync(DICT("ar_places.txt"))) {
  arPlaces = new Set(
    fs.readFileSync(DICT("ar_places.txt"), "utf8").split(/\r?\n/).filter(Boolean).map(normalizeArabic)
  );
}

/* ================= wink-nlp EN ================= */
const nlp = winkNLP(model);
const its = nlp.its;

/* ================= أنماط عامة ================= */
const RX = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  url: /\bhttps?:\/\/[^\s]+/g,
  phone: /\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b/g,
  date: /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/g,
  money: /\b(?:(?:[A-Z]{3})\s?\d[\d,\.]*|\d[\d,\.]*\s?(?:[A-Z]{3})|\d[\d,\.]*\$|\$?\d[\d,\.]*\s?(?:ريال|جنيه|دولار))\b/gu,
  iso: /\b[A-Z]{2,3}\b/g
};
const collect = (rx, s) => Array.from(new Set([...(s.match(rx)||[])]));

/* ================= مصحح عربي ================= */
function correctAR(tok){
  if (arSpeller && /^[\u0600-\u06FF]+$/.test(tok)) {
    if (arSpeller.correct(tok)) return tok;
    const s = arSpeller.suggest(tok);
    if (s && s.length) return normalizeArabic(s[0]);
  }
  return tok;
}

/* ================= مصحح إنجليزي ================= */
function correctEN(tok){
  if (!/^[A-Za-z]+$/.test(tok)) return tok;
  if (enSpeller.correct(tok)) return tok;
  const s = enSpeller.suggest(tok);
  return s[0] || tok;
}

/* ================= مفاتيح مستهدفة ================= */
function pickKeywords(tokens){
  const low = tokens.map(x => x.toLowerCase());
  const hits = [];
  for (const w of low) if (TARGET_KEYWORDS.has(w)) hits.push(w);
  return Array.from(new Set(hits));
}

/* ================= كشف أماكن عربية بسيط ================= */
function arabicPlaceCandidates(tokens){
  const out = new Set();
  for (let i=0;i<tokens.length;i++){
    const t1 = tokens[i], t2 = tokens[i+1] || "";
    if (arPlaces.has(t1)) out.add(t1);
    const bi = `${t1} ${t2}`.trim();
    if (arPlaces.has(bi)) out.add(bi);
  }
  return Array.from(out);
}

/* ================= الدالة الرئيسية ================= */
export function analyze(text){
  const original = String(text||"");
  const normalized = normalizeAll(original);
  const tokens = tokenize(normalized);

  const corrected = tokens.map(tok=>{
    if (/^https?:\/\//.test(tok) || /@/.test(tok) || /^\d/.test(tok)) return tok;
    return AR.test(tok) ? correctAR(tok) : correctEN(tok);
  });

  // NER إنجليزي
  const enDoc = nlp.readDoc(original);
  const persons = enDoc.entities().out(its.detail).filter(e=>e.type==="PERSON").map(e=>e.value);
  const orgs    = enDoc.entities().out(its.detail).filter(e=>e.type==="ORG").map(e=>e.value);

  // أماكن عربية
  const arPlacesHits = arabicPlaceCandidates(corrected);

  const emails = collect(RX.email, original);
  const urls = collect(RX.url, original);
  const phones = collect(RX.phone, original);
  const dates = collect(RX.date, mapArDigits(original));
  const money = collect(RX.money, original);
  const isoAll = collect(RX.iso, original);
  const currencies = isoAll.filter(x => CURRENCY_CODES.has(x));
  const countries = isoAll.filter(x => COUNTRY_ALPHA2.has(x));
  const numbers = Array.from(new Set(corrected.filter(t => /^\d[\d,./:-]*$/.test(t))));
  const keywords = pickKeywords(corrected);
  const unknown = queueUnknown(arSpeller, original, "analyze");
  const promoted = autoPromote(arSpeller, { threshold: 5 });
  addDocToCorpus(`doc-${Date.now()}`, AR.test(original) ? "ar" : "en", original);
  const projectKeywords = topKeywords({ k: 25 });
  return {
    original,
    normalized,
    correctedText: corrected.join(" "),
    hits: {
      keywords,
      numbers,
      emails, urls, phones, dates, money, currencies, countries,
      persons: Array.from(new Set(persons)),
      orgs: Array.from(new Set(orgs)),
      ar_places: arPlacesHits
    },
    learning: { unknown, promoted, projectKeywords }
  };
}



export default { analyze };
