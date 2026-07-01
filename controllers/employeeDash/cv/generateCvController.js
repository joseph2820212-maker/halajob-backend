import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import { CvTemplateModel, EmployeeCvModel } from "../../../models/index.js";
import { buildCvTemplateData } from "../../../services/cv/cvData.service.js";
import { generatePdfFromHtml, renderCvHtml } from "../../../services/cv/cvPdf.service.js";
import { fail, getEmployeeOrFail, getEmployeePlain, success } from "../../../helper/employeeDash/employeeDashHelpers.js";
import { hashCvPublicToken } from "../../../services/cvPublicToken.service.js";

const CV_OUTPUT_ROOT = path.resolve("cv", "generated");
const CV_ROOT = path.resolve("cv");
const PUBLIC_CV_URL_TTL_MINUTES = Math.max(
  1,
  Number.parseInt(process.env.GENERATED_CV_PUBLIC_URL_TTL_MINUTES || "60", 10) || 60
);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const safeStoredCvPath = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withoutQuery = raw.split("?")[0].split("#")[0].replace(/\\/g, "/");
  const relativePath = withoutQuery.replace(/^\/+/, "");
  const resolved = path.resolve(path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath));

  if (resolved === CV_ROOT || !resolved.startsWith(CV_ROOT + path.sep)) return "";
  return resolved;
};

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
    const fileName = `generated-${randomBytes(12).toString("hex")}.pdf`;
    const filePath = path.join(CV_OUTPUT_ROOT, fileName);
    const publicPath = path.posix.join("cv", "generated", fileName);
    // The plaintext token is what the recipient uses in the share URL. The
    // hash is what we store in the DB so a DB leak can't turn into a working
    // share link. See services/cvPublicToken.service.js.
    const publicDownloadToken = randomBytes(24).toString("hex");
    const publicDownloadTokenHash = hashCvPublicToken(publicDownloadToken);
    const publicDownloadExpiresAt = new Date(Date.now() + PUBLIC_CV_URL_TTL_MINUTES * 60 * 1000);
    const makeDefault = Boolean(req.body?.is_default);
    await fs.promises.writeFile(filePath, pdf);
    if (makeDefault) {
      await EmployeeCvModel.updateMany({ employee_id: context.employee._id }, { $set: { is_default: false } });
    }

    const cv = await EmployeeCvModel.create({
      employee_id: context.employee._id,
      template_id: context.template._id,
      template_key: context.template.key,
      title: req.body?.title || "Generated CV",
      lang: context.lang,
      colors: context.colors,
      font: context.font,
      sections: req.body?.sections || {},
      pdf_file: publicPath,
      source: "builder",
      status: "active",
      last_exported_at: new Date(),
      public_download_token: publicDownloadTokenHash,
      public_download_expires_at: publicDownloadExpiresAt,
      is_default: makeDefault,
    });
    const publicDownloadUrl = `/${cv.pdf_file}?token=${publicDownloadToken}`;
    const ownerDownloadUrl = `/employee/v1/cv/download/${cv._id}`;
    const cvData = cv.toObject ? cv.toObject() : cv;
    delete cvData.public_download_token;

    return success(
      res,
      {
        cv: cvData,
        url: publicDownloadUrl,
        download_url: publicDownloadUrl,
        owner_download_url: ownerDownloadUrl,
        public_download_expires_at: publicDownloadExpiresAt,
      },
      "cv_generated",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const downloadSavedCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;
    if (!isValidObjectId(req.params.cvId)) return fail(res, "invalid_cv_id", 400);

    const cv = await EmployeeCvModel.findOne({ _id: req.params.cvId, employee_id: employee._id }).lean();
    if (!cv?.pdf_file) return fail(res, "cv_not_found", 404);

    const resolved = safeStoredCvPath(cv.pdf_file);
    if (!resolved) return fail(res, "invalid_cv_path", 400);

    try {
      await fs.promises.access(resolved, fs.constants.R_OK);
    } catch (error) {
      if (error?.code === "ENOENT") return fail(res, "cv_file_not_found", 404);
      throw error;
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Content-Type", "application/pdf");
    return res.download(resolved, `${cv.title || "cv"}.pdf`, (error) => {
      if (error && !res.headersSent) return next(error);
      return undefined;
    });
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
      source: "builder",
      status: "draft",
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
