import fs from "fs";
import path from "path";
import { EmployeeCvModel, CvTemplateModel, ContentTranslationModel } from "../../../models/index.js";
import { fail, getEmployeePlain, success } from "../../../helper/employeeDash/employeeDashHelpers.js";

const CV_ROOT = path.resolve(process.cwd(), "cv");

const normalizeFilePath = (file) => file?.path?.replace(/\\/g, "/") || "";

const safeStoredCvPath = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withoutQuery = raw.split("?")[0].split("#")[0].replace(/\\/g, "/");
  const relativePath = withoutQuery.replace(/^\/+/, "");
  const resolved = path.resolve(path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath));

  if (resolved === CV_ROOT || !resolved.startsWith(CV_ROOT + path.sep)) return "";
  return resolved;
};

const removeStoredCvFile = async (value = "") => {
  const filePath = safeStoredCvPath(value);
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};

const getDefaultTemplate = async () =>
  CvTemplateModel.findOne({ is_active: true }).sort({ sort_order: 1, createdAt: -1 }).lean();

const langFromReq = (req) =>
  String(req.get("lan") || req.get("x-language") || req.get("lang") || "en")
    .toLowerCase()
    .startsWith("ar")
    ? "ar"
    : "en";

const toIdString = (value) => String(value?._id || value || "").trim();

const translatedField = (translation, key) => {
  const text = translation?.translated_text;
  if (!text || typeof text !== "object" || Array.isArray(text)) return "";
  return String(text[key] || "").trim();
};

const loadApprovedCvTranslations = async ({ cvIds = [], employeeId, lang = "en" }) => {
  if (!cvIds.length || !employeeId || !["ar", "en"].includes(lang)) return new Map();
  const rows = await ContentTranslationModel.find({
    entity_type: "cv",
    entity_id: { $in: cvIds },
    employee_id: employeeId,
    target_language: lang,
    status: "approved",
  }).select("entity_id target_language translated_text updatedAt").lean();

  return new Map(rows.map((row) => [toIdString(row.entity_id), row]));
};

const decorateCvs = async ({ cvs = [], employee, lang }) => {
  const translations = await loadApprovedCvTranslations({
    cvIds: cvs.map((cv) => cv._id).filter(Boolean),
    employeeId: employee?._id,
    lang,
  });

  return cvs.map((cv) => {
    const translation = translations.get(toIdString(cv._id));
    const translatedTitle = translatedField(translation, "title");
    const hasApprovedTranslation = Boolean(translation && (translatedTitle || translation.translated_text));

    return {
      ...cv,
      title: translatedTitle || cv.title || "",
      translation: hasApprovedTranslation ? {
        language: lang,
        status: "approved",
        source: "content_translations",
        translated_text: translation.translated_text || {},
        updated_at: translation.updatedAt || null,
      } : null,
    };
  });
};

export const uploadMyCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const filePath = normalizeFilePath(req.file);
    if (!filePath) return fail(res, "cv_file_required", 400);

    const template = await getDefaultTemplate();
    if (!template) return fail(res, "cv_template_not_found", 404);

    const makeDefault = String(req.body?.is_default ?? "true") !== "false";
    if (makeDefault) {
      await EmployeeCvModel.updateMany({ employee_id: employee._id }, { $set: { is_default: false } });
    }

    const cv = await EmployeeCvModel.create({
      employee_id: employee._id,
      template_id: template._id,
      template_key: template.key,
      title: req.body?.title || req.file?.originalname || "Uploaded CV",
      lang: req.body?.lang === "ar" ? "ar" : "en",
      pdf_file: filePath,
      source: "upload",
      status: "active",
      is_default: makeDefault,
    });

    return success(res, cv, "cv_uploaded", 201);
  } catch (error) {
    next(error);
  }
};

export const getMyUploadedCvs = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;
    const lang = langFromReq(req);

    const cvs = await EmployeeCvModel.find({ employee_id: employee._id })
      .populate("template_id", "key title_ar title_en preview_image")
      .sort({ is_default: -1, createdAt: -1 })
      .lean();

    return success(res, await decorateCvs({ cvs, employee, lang }));
  } catch (error) {
    next(error);
  }
};

export const setActiveCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await EmployeeCvModel.findOne({ _id: req.params.cvId, employee_id: employee._id });
    if (!cv) return fail(res, "cv_not_found", 404);

    await EmployeeCvModel.updateMany({ employee_id: employee._id }, { $set: { is_default: false } });
    cv.is_default = true;
    await cv.save();

    return success(res, cv, "cv_set_active");
  } catch (error) {
    next(error);
  }
};

export const deleteMyUploadedCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const deleted = await EmployeeCvModel.findOneAndDelete({ _id: req.params.cvId, employee_id: employee._id });
    if (!deleted) return fail(res, "cv_not_found", 404);

    await removeStoredCvFile(deleted.pdf_file);

    return success(res, { id: req.params.cvId }, "cv_deleted");
  } catch (error) {
    next(error);
  }
};

export default {
  uploadMyCv,
  getMyUploadedCvs,
  setActiveCv,
  deleteMyUploadedCv,
};
