// lib/learning.js
import fs from "fs";
import path from "path";
const DATA = (p="") => path.join(process.cwd(), "data", p);

const QUEUE = DATA("learn_queue.jsonl");      // سطر/JSON لكل مرشح
const STATS = DATA("term_freq.json");         // { term: count }

function tokenizeAr(s) {
  return (s.match(/[\u0600-\u06FF]+/g) || []);
}

export function queueUnknown(speller, text, source="free") {
  if (!speller) return [];
  const tokens = tokenizeAr(text);
  const unknown = [];
  for (const t of tokens) {
    if (!speller.correct(t)) unknown.push(t);
  }
  if (!unknown.length) return [];

  // احصِ التكرار
  let freq = {};
  try { freq = JSON.parse(fs.readFileSync(STATS, "utf8")); } catch {}
  for (const w of unknown) freq[w] = (freq[w] || 0) + 1;
  fs.writeFileSync(STATS, JSON.stringify(freq, null, 2));

  // اكتب طابور مراجعة
  const fd = fs.openSync(QUEUE, "a");
  for (const w of unknown) {
    fs.writeSync(fd, JSON.stringify({ term:w, source, ts:Date.now() }) + "\n");
  }
  fs.closeSync(fd);
  return unknown;
}

// اعتماد تلقائي: عتبة تكرار + تحقق بسيط
export function autoPromote(speller, {threshold=5} = {}) {
  if (!speller) return [];
  let freq = {};
  try { freq = JSON.parse(fs.readFileSync(STATS, "utf8")); } catch {}

  const candidates = Object.entries(freq)
    .filter(([term, c]) => c >= threshold && /^[\u0600-\u06FF]+$/.test(term));

  if (!candidates.length) return [];

  const added = [];
  const userPath = DATA("arabic_words.txt");
  const fd = fs.openSync(userPath, "a");

  for (const [term] of candidates) {
    speller.add(term);                  // حقن فوري
    fs.writeSync(fd, term + "\n");      // حفظ دائم
    delete freq[term];                  // صفّر عدّاده حتى لا يعاد ضمّه
    added.push(term);
  }
  fs.closeSync(fd);
  fs.writeFileSync(STATS, JSON.stringify(freq, null, 2));
  return added;
}
