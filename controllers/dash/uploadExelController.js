// controllers/uploadController.js
import fs from "fs";
import ExcelJS from "exceljs";
import csvParser from "csv-parser"; // npm i csv-parser
import path from "path";
import { CountryModel } from "../../models/index.js";

const cellText = (cell) => {
  const value = cell?.value;
  if (value && typeof value === "object") {
    if (value.text) return String(value.text);
    if (value.result !== undefined) return String(value.result);
    if (value.richText) return value.richText.map((part) => part.text || "").join("");
  }
  return cell?.text || String(value ?? "");
};

const worksheetToObjects = (worksheet) => {
  const headers = worksheet.getRow(1).values.slice(1).map((header) => String(header ?? "").trim());
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    headers.forEach((header, index) => {
      if (!header) return;
      item[header] = cellText(row.getCell(index + 1)) || null;
    });
    if (Object.values(item).some((value) => value !== null && value !== "")) rows.push(item);
  });

  return rows;
};

/** قراءة ملف Excel وإرجاع الصفوف كـ JSON */
export const create = async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ error: "no file" });

    // اقرأ المصنف
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];
    if (!sheet) return res.status(400).json({ error: "empty workbook" });

    // حوّل الورقة الأولى إلى JSON
    const rows = worksheetToObjects(sheet);
    /* Removed legacy xlsx parser block.
      defval: null, // عيّن القيم الفارغة إلى null
      raw: false,   // صيّغ التواريخ كنص مقروء
      dateNF: "yyyy-mm-dd"
    */

    // تنظيف الملف المؤقت
    fs.unlink(req.file.path, () => {});

    return res.json({ count: rows.length, rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/** قراءة ملف CSV وإرجاع الصفوف كـ JSON */
export const csv = async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ error: "no file" });
    await CountryModel.deleteMany();
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser({
          separator: ",",
          mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim(),
          mapValues: ({ value }) => typeof value === "string" ? value.trim() : value
        }))
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });
    fs.unlink(req.file.path, () => {});

    if (!rows.length) return res.json({ totalRows: 0, matched: 0, modified: 0, upserted: 0 });

    const ops = rows.map((r) => {
      const alpha2 = String(r.COUNTRY_ALPHA2_CODE || "").trim().toUpperCase();
      const regionCode = String(r.REGION_CODE ?? "").trim();
      if (!alpha2) return null;

      const filter = { country_alpha2_code: alpha2 };
      if (regionCode) filter.region_code = regionCode;

      const doc = {
        country_alpha2_code: alpha2,
        country_numeric_code: r.COUNTRY_NUMERIC_CODE ? Number(r.COUNTRY_NUMERIC_CODE) : null,
        region_code: regionCode || null,
        country_name_en: r.COUNTRY_NAME?.trim() || null,
        country_name_ar: r.COUNTRY_NAME_AR?.trim() || null,
        region_name_en: r.REGION_NAME?.trim() || null,

      };

      return { updateOne: { filter, update: { $set: doc }, upsert: true } };
    }).filter(Boolean);
    if (!ops.length) return res.status(400).json({ error: "headers mismatch or empty alpha2" });
    const result = await CountryModel.bulkWrite(ops, { ordered: false });
    return res.json({
      totalRows: rows.length,
      matched: result.matchedCount ?? 0,
      modified: result.modifiedCount ?? 0,
      upserted: result.upsertedCount ?? (result.upserted?.length || 0),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


export default { create, csv };
