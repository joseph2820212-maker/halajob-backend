import mongoose from 'mongoose';
import Item from './models/Item.js';
import { meili } from './client.js';
import { buildText } from './normalize.js';

function toDoc(x) {
  return {
    id: `item:${x._id.toString()}`,
    type: 'item',
    name: x.name,
    title_ar: x.title_ar,
    title_en: x.title_en,
    keywords: x.keyword || [],
    text: buildText({
      name: x.name, title_ar: x.title_ar, title_en: x.title_en, keywords: x.keyword || []
    }),
    popularity: x.popularity || 0,
    published_at: x.published_at ? new Date(x.published_at).toISOString() : null
  };
}

async function fullReindex() {
  await mongoose.connect(process.env.MONGO_URI);
  const content = meili.index('content');
  await content.deleteAllDocuments();

  const all = await Item.find().lean();
  const docs = all.map(toDoc);
  for (let i=0; i<docs.length; i+=1000) {
    await content.addDocuments(docs.slice(i, i+1000));
  }
  console.log(`Indexed ${docs.length} docs`);
  process.exit(0);
}

if (process.argv[2] === 'watch') {
  (async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const content = meili.index('content');
    const stream = Item.watch([], { fullDocument: 'updateLookup' });
    stream.on('change', async (ch) => {
      if (['insert','replace','update'].includes(ch.operationType)) {
        await content.addDocuments([toDoc(ch.fullDocument)]);
      } else if (ch.operationType === 'delete') {
        await content.deleteDocuments([`item:${ch.documentKey._id.toString()}`]);
      }
    });
    console.log('Change stream watching… (Ctrl+C to stop)');
  })();
} else {
  fullReindex().catch(console.error);
}
