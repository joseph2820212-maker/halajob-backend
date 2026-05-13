// controllers/uploadExcel.controller.js
import fs from "fs";
import xlsx from "xlsx";
import { SheetModel, JobNameModel } from "../../models/index.js";

const H = {
  title_ar: new Set(["المسمى الوظيفي", "المسمى الوظيفي المختصر"]),
  title_en: new Set(["job title", "clean job title"]),
};

const norm = (s) => String(s ?? "").trim();
const nlow = (s) => norm(s).toLowerCase();

const hnorm = (s) =>
  String(s ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\u00A0/g, " ")
    .trim();

const toUndef = (v) => {
  const s = norm(v);
  return s ? s : undefined;
};

function pick(headers, candidatesSet) {
  const normalizedHeaders = headers.map(hnorm);

  for (let i = 0; i < normalizedHeaders.length; i++) {
    if (candidatesSet.has(nlow(normalizedHeaders[i]))) {
      return headers[i];
    }
  }

  return null;
}

const buildDedupeKey = (p) =>
  [p.title_ar, p.title_en].map(nlow).join("|");

export const uploadExcel = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ error: "no file" });
    }

    const wb = xlsx.readFile(req.file.path, {
      cellDates: false,
      raw: false,
    });

    fs.unlink(req.file.path, () => {});

    const sheetName =
      wb.SheetNames.find((n) => n.trim() === "Clean_Jobs") ||
      wb.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({ error: "sheet not found" });
    }

    const ws = wb.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ error: "sheet empty" });
    }

    const headers = (
      xlsx.utils.sheet_to_json(ws, { header: 1 })[0] || []
    ).map(String);

    const c = {
      title_ar: pick(headers, H.title_ar),
      title_en: pick(headers, H.title_en),
    };

    if (!c.title_ar && !c.title_en) {
      return res.status(400).json({
        error: "job title columns not found",
      });
    }

    await JobNameModel.deleteMany({});
    await SheetModel.deleteMany({});

    const sheetDoc = await SheetModel.create({
      name: sheetName,
      totalRows: rows.length,
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const ops = [];

    for (const r of rows) {
      const payload = {
        title_ar: toUndef(c.title_ar ? r[c.title_ar] : ""),
        title_en: toUndef(c.title_en ? r[c.title_en] : ""),
      };

      if (!payload.title_ar && !payload.title_en) {
        skipped++;
        continue;
      }

      const dedupeKey = buildDedupeKey(payload);

      if (!dedupeKey.replace(/\|/g, "")) {
        skipped++;
        continue;
      }

      ops.push({
        updateOne: {
          filter: {
            sheet: sheetDoc._id,
            dedupeKey,
          },
          update: {
            $set: {
              sheet: sheetDoc._id,
              dedupeKey,
              ...payload,
              is_auto: true,
            },
          },
          upsert: true,
        },
      });
    }

    if (ops.length) {
      const result = await JobNameModel.bulkWrite(ops, {
        ordered: false,
      });

      inserted =
        result.upsertedCount ??
        Object.keys(result.upsertedIds || {}).length ??
        0;

      updated = result.modifiedCount || 0;
    }

    return res.json({
      resetDone: true,
      sheetCreated: sheetDoc.name,
      totalRows: rows.length,
      jobNamesInserted: inserted,
      jobNamesUpdated: updated,
      skipped,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "server error",
    });
  }
};

export default { uploadExcel };