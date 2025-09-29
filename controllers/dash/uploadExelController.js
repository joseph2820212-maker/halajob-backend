// controllers/uploadController.js
import fs from "fs";
import xlsx from "xlsx";
import csvParser from "csv-parser"; // npm i csv-parser
import path from "path";
import { CountryModel } from "../../models/index.js";

/** قراءة ملف Excel وإرجاع الصفوف كـ JSON */
export const create = async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ error: "no file" });

    // اقرأ المصنف
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: "empty workbook" });

    // حوّل الورقة الأولى إلى JSON
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, {
      defval: null, // عيّن القيم الفارغة إلى null
      raw: false,   // صيّغ التواريخ كنص مقروء
      dateNF: "yyyy-mm-dd"
    });

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
    console.log('====================================');
    console.log(err);
    console.log('====================================');
    return res.status(500).json({ error: err.message });
  }
};


export default { create, csv };
