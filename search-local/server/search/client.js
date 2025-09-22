// server/search/client.js
// يجعل الاستيراد متوافقاً مع جميع إصدارات الحزمة (Named أو Default)
let MeiliCtor;

try {
  const mod = await import('meilisearch');
  MeiliCtor = mod.MeiliSearch ?? mod.default;
  if (typeof MeiliCtor !== 'function') {
    throw new Error('MeiliSearch constructor not found on this module');
  }
} catch (e) {
  console.error('Failed to load meilisearch client module:', e);
  process.exit(1);
}

export const meili = new MeiliCtor({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_KEY || 'change_me_local',
});
