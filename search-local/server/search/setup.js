import { meili } from './client.js';
async function setup() {
  const content = meili.index('content');
  await content.updateSettings({
    searchableAttributes: ['text','name','title_ar','title_en','keywords'],
    filterableAttributes: ['type','published_at'],
    sortableAttributes: ['popularity','published_at'],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 } },
    stopWords: ['the','a','an','of','في','على','من','عن','و'],
    synonyms: { youtube: ['yt','يوتيوب'], course: ['tutorial','شرح'] }
  });
  const suggestions = meili.index('suggestions');
  await suggestions.updateSettings({
    searchableAttributes: ['q'],
    sortableAttributes: ['weight']
  });
  console.log('Meilisearch indices configured');
}
setup().catch(console.error);
