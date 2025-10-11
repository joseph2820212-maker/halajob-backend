// tt.js
import dict from './screens.json'  with { type: 'json' };


export default function screen( key) {
  const primary = dict?.routes[key]?.route_key;

  // إحلال متغيّرات بصيغة {name}
  return String(value).replace(/\{(\w+)\}/g, (_, p) => {
    const v = primary;
    return v === undefined || v === null ? '' : String(v);
  });
}
