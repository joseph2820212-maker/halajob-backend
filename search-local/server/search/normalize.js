export function normalizeArabic(input='') {
  return input
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function normalizeEnglish(input='') {
  return input.normalize('NFKC').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function buildText({ name='', title_ar='', title_en='', keywords=[] }) {
  const a = normalizeArabic(`${name} ${title_ar} ${keywords.join(' ')}`);
  const e = normalizeEnglish(`${title_en} ${keywords.join(' ')}`);
  return `${a} ${e}`.trim();
}
