// controllers/uploadExcel.controller.js
import fs from "fs";
import xlsx from "xlsx";
import { SheetModel, JopNameModel } from "../../models/index.js";

/* ===== خرائط رؤوس الأعمدة المحتملة بعد التطبيع ===== */
const H = {
  sheet: new Set(["sheet", "الورقة", "اسم الورقة"]),
  rows:  new Set(["rows", "عدد الصفوف", "sheet rows"]),

  sector_ar:    new Set(["القطاع"]),
  sector_en:    new Set(["sector"]),
  subsector_ar: new Set(["المجال الفرعي"]),
  subsector_en: new Set(["subsector"]),
  title_ar:     new Set(["المسمى الوظيفي"]),
  title_en:     new Set(["job title"]),
  keywords:     new Set(["الكلمات المفتاحية", "keywords"]),
};

/* ===== أدوات ===== */
const norm = (s) => String(s ?? "").trim();
const nlow = (s) => norm(s).toLowerCase();
const toUndef = (v) => {
  if (Array.isArray(v)) return v.length ? v : undefined;
  const s = norm(v);
  return s ? s : undefined;
};
// إزالة BOM و NBSP قبل المطابقة
const hnorm = (s) => String(s ?? "").replace(/\uFEFF/g, "").replace(/\u00A0/g, " ").trim();

/* مفتاح إزالة التكرار */
const buildDedupeKey = (p) =>
  [p.sector_ar, p.sector_en, p.subsector_ar, p.subsector_en, p.title_ar, p.title_en]
    .map(nlow)
    .join("|");

/* إيجاد اسم عمود من الهيدر */
function pick(headers, candidatesSet) {
  const Hn = headers.map(hnorm);
  for (let i = 0; i < Hn.length; i++) if (candidatesSet.has(nlow(Hn[i]))) return headers[i];
  return null;
}
/* إيجاد كل الأعمدة المطابقة */
function pickAll(headers, candidatesSet) {
  const out = [];
  const Hn = headers.map(hnorm);
  for (let i = 0; i < Hn.length; i++) if (candidatesSet.has(nlow(Hn[i]))) out.push(headers[i]);
  return out;
}

/* تقسيم الكلمات: , ، ؛ ; | وأسطر جديدة وتبويب */
function splitKeywords(v) {
  const s = norm(v);
  if (!s) return [];
  return s.split(/[,\u060C\u061B;|\n\r\t]+/).map((x) => x.trim()).filter(Boolean);
}

/* ===== المنفّذ ===== */
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ error: "no file" });

    // قراءة الملف
    const wb = xlsx.readFile(req.file.path, { cellDates: false, raw: false });
    fs.unlink(req.file.path, () => {});

    // إيجاد ورقة index
    const indexSheetName = wb.SheetNames.find(
      (n) => String(n).trim().toLowerCase() === "index"
    );
    if (!indexSheetName) return res.status(400).json({ error: "index sheet not found" });

    const indexWS = wb.Sheets[indexSheetName];
    const indexRows = xlsx.utils.sheet_to_json(indexWS, { defval: "" });
    if (!indexRows.length) return res.status(400).json({ error: "index sheet empty" });

    // رؤوس index
    const indexHeaders = (xlsx.utils.sheet_to_json(indexWS, { header: 1 })[0] || []).map(String);
    const colSheet = pick(indexHeaders, H.sheet) ?? "Sheet";
    const colRows  = pick(indexHeaders, H.rows)  ?? null;

    /* ===== حذف كل البيانات القديمة قبل البناء ===== */
    await JopNameModel.deleteMany({});
    await SheetModel.deleteMany({});

    /* ===== إنشاء سجلات Sheets من index ===== */
    const resultSheets = [];
    for (const r of indexRows) {
      const name = norm(r[colSheet]);
      if (!name) continue;
      const totalRows = colRows ? Number(r[colRows] || 0) : 0;

      const doc = await SheetModel.create({ name, totalRows });
      resultSheets.push(doc);
    }

    /* ===== إدخال jobNames بكفاءة مع bulkWrite ===== */
    let inserted = 0, updated = 0, skipped = 0;

    for (const sDoc of resultSheets) {
      const wsName = sDoc.name;
      if (!wb.SheetNames.includes(wsName)) { skipped++; continue; }

      const ws = wb.Sheets[wsName];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) { skipped++; continue; }

      // تحديد أعمدة الورقة الحالية
      const headers = (xlsx.utils.sheet_to_json(ws, { header: 1 })[0] || []).map(String);
      const c = {
        sector_ar:    pick(headers, H.sector_ar),
        sector_en:    pick(headers, H.sector_en),
        subsector_ar: pick(headers, H.subsector_ar),
        subsector_en: pick(headers, H.subsector_en),
        title_ar:     pick(headers, H.title_ar),
        title_en:     pick(headers, H.title_en),
      };
      // أعمدة الكلمات المفتاحية بالعربي والإنجليزي
      const kwCols = pickAll(headers, H.keywords);

      const ops = [];
      for (const r of rows) {
        // بناء keywords من كل الأعمدة المطابقة
        const kw = [];
        for (const kc of kwCols) kw.push(...splitKeywords(r[kc]));
        const seen = new Set();
        const keywords = kw.filter((k) => k && !seen.has(k) && seen.add(k));

        // حمولة خام
        const raw = {
          sector_ar:    r[c.sector_ar],
          sector_en:    r[c.sector_en],
          subsector_ar: r[c.subsector_ar],
          subsector_en: r[c.subsector_en],
          title_ar:     r[c.title_ar],
          title_en:     r[c.title_en],
          keywords,
        };

        // تنظيف
        const payload = Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [
            k,
            Array.isArray(v) ? (v.length ? v : undefined) : toUndef(v),
          ])
        );

        // صف فارغ إذا كانت الحقول الستة كلها فارغة
        const hasCore =
          payload.sector_ar || payload.sector_en ||
          payload.subsector_ar || payload.subsector_en ||
          payload.title_ar || payload.title_en;

        if (!hasCore) { skipped++; continue; }

        const dedupeKey = buildDedupeKey(payload);
        if (!dedupeKey.replace(/\|/g, "")) { skipped++; continue; }

        ops.push({
          updateOne: {
            filter: { sheet: sDoc._id, dedupeKey },
            update: { $set: { sheet: sDoc._id, dedupeKey, ...payload, is_auto: true } },
            upsert: true,
          },
        });
      }

      if (ops.length) {
        const result = await JopNameModel.bulkWrite(ops, { ordered: false });
        const upserts = result.upsertedCount ?? Object.keys(result.upsertedIds || {}).length ?? 0;
        inserted += upserts;
        updated  += result.modifiedCount || 0;
      }
    }

    return res.json({
      resetDone: true,
      sheetsCreated: resultSheets.length,
      jobNamesInserted: inserted,
      jobNamesUpdated: updated,
      skipped,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "server error" });
  }
};

export default { uploadExcel };
