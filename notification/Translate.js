// tt.js
import dict from './keyword.json' with { type: 'json' };

/** الحصول على قيمة بمسار مثل: "errors.create" */
function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
}

/**
 * tt(lan, key, params?)
 * - lan: 'ar' | 'en' (مع fallback)
 * - key: مسار نص مثل 'create' أو 'errors.create'
 * - params: كائن لإحلال المتغيّرات داخل النص {name:'Ali'}
 */
export default function tt(lan, key, params = {}) {
  const lang = (lan || '').toLowerCase();
  const primary = dict[lang] ?? dict.en ?? {};
  const value = getByPath(primary, key) ?? getByPath(dict.en ?? {}, key) ?? key;

  // إحلال متغيّرات بصيغة {name}
  return String(value).replace(/\{(\w+)\}/g, (_, p) => {
    const v = params[p];
    return v === undefined || v === null ? '' : String(v);
  });
}
