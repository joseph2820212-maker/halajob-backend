// controllers/uploadExcel.controller.js
import fs from "fs";
import ExcelJS from "exceljs";
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

const cellText = (cell) => {
  const value = cell?.value;
  if (value && typeof value === "object") {
    if (value.text) return String(value.text);
    if (value.result !== undefined) return String(value.result);
    if (value.richText) return value.richText.map((part) => part.text || "").join("");
  }
  return cell?.text || String(value ?? "");
};

const worksheetToObjects = (worksheet, headers) => {
  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    headers.forEach((header, index) => {
      item[header] = cellText(row.getCell(index + 1));
    });
    if (Object.values(item).some((value) => String(value || "").trim())) rows.push(item);
  });
  return rows;
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

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);

    fs.unlink(req.file.path, () => {});

    const ws =
      wb.worksheets.find((sheet) => sheet.name.trim() === "Clean_Jobs") ||
      wb.worksheets[0];

    if (!ws) {
      return res.status(400).json({ error: "sheet not found" });
    }

    const headers = ws.getRow(1).values.slice(1).map(String);
    const rows = worksheetToObjects(ws, headers);

    if (!rows.length) {
      return res.status(400).json({ error: "sheet empty" });
    }

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
      name: ws.name,
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
