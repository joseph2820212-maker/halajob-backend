import mongoose from 'mongoose';
import Item from './models/Item.js';
import { meili } from './client.js';
import { normalizeArabic, normalizeEnglish } from './normalize.js';

const dedup = (a) => Array.from(new Set(a.filter(Boolean)));
function candidates(d) {
  const base = [d.name, d.title_ar, d.title_en, ...(d.keyword||[])];
  const plus = [];
  base.forEach(s => { plus.push(normalizeArabic(s)); plus.push(normalizeEnglish(s)); });
  return dedup([...base, ...plus]).filter(s => s.length >= 2 && s.length <= 64);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const idx = meili.index('suggestions');
  const items = await Item.find().lean();
  let id=0, batch=[];
  for (const doc of items) {
    for (const q of candidates(doc)) {
      batch.push({ id: `seed:${id++}`, q, weight: 1 });
      if (batch.length >= 5000) { await idx.addDocuments(batch); batch.length=0; }
    }
  }
  if (batch.length) await idx.addDocuments(batch);
  console.log('Seeded suggestions');
  process.exit(0);
})();
