import fs from "fs";
import path from "path";
import { CvTemplateModel, EmployeeCvModel } from "../../../models/index.js";
import { buildCvTemplateData } from "../../../services/cv/cvData.service.js";
import { generatePdfFromHtml, renderCvHtml } from "../../../services/cv/cvPdf.service.js";
import { fail, getEmployeeOrFail, getEmployeePlain, success } from "../../../helper/employeeDash/employeeDashHelpers.js";

const CV_OUTPUT_ROOT = path.resolve("cv", "generated");

const ensureOutputDir = async () => {
  await fs.promises.mkdir(CV_OUTPUT_ROOT, { recursive: true });
};

const pickTemplate = async (templateIdOrKey) => {
  if (templateIdOrKey) {
    const query = String(templateIdOrKey).match(/^[a-f\d]{24}$/i)
      ? { _id: templateIdOrKey }
      : { key: String(templateIdOrKey).toLowerCase() };
    const template = await CvTemplateModel.findOne({ ...query, is_active: true }).lean();
    if (template) return template;
  }

  return CvTemplateModel.findOne({ is_active: true }).sort({ sort_order: 1, createdAt: -1 }).lean();
};

const buildRenderContext = async (req, res) => {
  const employee = await getEmployeeOrFail(req, res);
  if (!employee) return null;

  const template = await pickTemplate(req.body?.template_id || req.body?.template_key || req.query?.template_id || req.query?.template_key);
  if (!template) {
    fail(res, "cv_template_not_found", 404);
    return null;
  }

  const lang = req.body?.lang === "ar" || req.query?.lang === "ar" ? "ar" : "en";
  const colors = { ...(template.default_colors || {}), ...(req.body?.colors || {}) };
  const font = { ...(template.default_font || {}), ...(req.body?.font || {}) };
  if (font.font_family && !font.family) font.family = font.font_family;
  if (font.font_size && !font.size) font.size = font.font_size;

  const data = buildCvTemplateData({
    employee,
    lang,
    colors,
    font,
    sections: req.body?.sections || {},
  });

  return { employee, template, lang, data, colors, font };
};

export const previewMyCv = async (req, res, next) => {
  try {
    const context = await buildRenderContext(req, res);
    if (!context) return;

    return success(res, {
      html: renderCvHtml({ template: context.template, data: context.data }),
      template: {
        _id: context.template._id,
        key: context.template.key,
        title_ar: context.template.title_ar,
        title_en: context.template.title_en,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadMyCv = async (req, res, next) => {
  try {
    const context = await buildRenderContext(req, res);
    if (!context) return;

    const html = renderCvHtml({ template: context.template, data: context.data });
    const pdf = await generatePdfFromHtml(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=\"cv.pdf\"");
    return res.send(pdf);
  } catch (error) {
    next(error);
  }
};

export const createMyCvDownloadUrl = async (req, res, next) => {
  try {
    const context = await buildRenderContext(req, res);
    if (!context) return;

    await ensureOutputDir();
    const html = renderCvHtml({ template: context.template, data: context.data });
    const pdf = await generatePdfFromHtml(html);
    const fileName = `${context.employee._id}-${Date.now()}.pdf`;
    const filePath = path.join(CV_OUTPUT_ROOT, fileName);
    await fs.promises.writeFile(filePath, pdf);

    const cv = await EmployeeCvModel.create({
      employee_id: context.employee._id,
      template_id: context.template._id,
      template_key: context.template.key,
      title: req.body?.title || "Generated CV",
      lang: context.lang,
      colors: context.colors,
      font: context.font,
      sections: req.body?.sections || {},
      pdf_file: filePath.replace(/\\/g, "/"),
      is_default: Boolean(req.body?.is_default),
    });

    return success(res, { cv, url: `/${cv.pdf_file}` }, "cv_generated", 201);
  } catch (error) {
    next(error);
  }
};

export const downloadSavedCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await EmployeeCvModel.findOne({ _id: req.params.cvId, employee_id: employee._id }).lean();
    if (!cv?.pdf_file) return fail(res, "cv_not_found", 404);

    const resolved = path.resolve(cv.pdf_file);
    if (!resolved.startsWith(path.resolve("cv") + path.sep)) return fail(res, "invalid_cv_path", 400);

    return res.download(resolved, `${cv.title || "cv"}.pdf`);
  } catch (error) {
    next(error);
  }
};

export const saveMyCvSettings = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const template = await pickTemplate(req.body?.template_id || req.body?.template_key);
    if (!template) return fail(res, "cv_template_not_found", 404);

    const makeDefault = Boolean(req.body?.is_default);
    if (makeDefault) {
      await EmployeeCvModel.updateMany({ employee_id: employee._id }, { $set: { is_default: false } });
    }

    const cv = await EmployeeCvModel.create({
      employee_id: employee._id,
      template_id: template._id,
      template_key: template.key,
      title: req.body?.title || "My CV",
      lang: req.body?.lang === "ar" ? "ar" : "en",
      colors: { ...(template.default_colors || {}), ...(req.body?.colors || {}) },
      font: {
        family: req.body?.font?.family || template.default_font?.family || template.default_font?.font_family || "Arial",
        size: req.body?.font?.size || template.default_font?.size || template.default_font?.font_size || 14,
      },
      sections: req.body?.sections || {},
      section_order: req.body?.section_order,
      is_default: makeDefault,
    });

    return success(res, cv, "cv_settings_saved", 201);
  } catch (error) {
    next(error);
  }
};

export const getCvTemplatesPublic = async (req, res, next) => {
  try {
    const templates = await CvTemplateModel.find({ is_active: true })
      .select("-html -css")
      .sort({ sort_order: 1, createdAt: -1 })
      .lean();

    return success(res, templates);
  } catch (error) {
    next(error);
  }
};

export default {
  previewMyCv,
  downloadMyCv,
  createMyCvDownloadUrl,
  downloadSavedCv,
  saveMyCvSettings,
  getCvTemplatesPublic,
};
