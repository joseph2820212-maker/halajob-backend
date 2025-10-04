// lib/spellers.js  (ESM)
import fs from "fs";
import path from "path";
import nspell from "nspell";

const DATA = (p="") => path.join(process.cwd(), "data", "builddict", p);
export async function loadArabicSpeller() {
  const aff = fs.readFileSync(DATA("arb_alias.aff"), "utf8");
  const dic = fs.readFileSync(DATA("arb_alias.dic"), "utf8");
  const sp = nspell(aff, dic);

  const userWordsPath = DATA("arabic_words.txt");
  if (fs.existsSync(userWordsPath)) {
    const list = fs.readFileSync(userWordsPath, "utf8")
      .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    for (const w of list) sp.add(w);       // يحقن الكلمات المخصّصة
  }
  return sp;
}
