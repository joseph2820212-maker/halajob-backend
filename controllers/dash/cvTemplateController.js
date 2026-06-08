import CvTemplateModel from "../../models/CvTemplateModel.js";
import { cleanCvTemplateHtml } from "../../services/cv/cvTemplateSanitize.service.js";

export const createCvTemplate = async (req, res, next) => {
  try {
    const {
      key,
      title_ar,
      title_en,
      description_ar,
      description_en,
      preview_image,
      html,
      css,
      default_colors,
      default_font,
      supported_languages,
      is_active,
      sort_order,
    } = req.body;

    if (!key || !title_ar || !title_en || !html) {
      return res.status(400).json({
        success: false,
        message: "missing_required_fields",
      });
    }

    const template = await CvTemplateModel.create({
      key,
      title_ar,
      title_en,
      description_ar,
      description_en,
      preview_image,
      html: cleanCvTemplateHtml(html),
      css: css || "",
      default_colors,
      default_font,
      supported_languages,
      is_active,
      sort_order,
    });

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCvTemplate = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (payload.html) {
      payload.html = cleanCvTemplateHtml(payload.html);
    }

    const template = await CvTemplateModel.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "cv_template_not_found",
      });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const getCvTemplatesAdmin = async (req, res, next) => {
  try {
    const templates = await CvTemplateModel.find()
      .sort({ sort_order: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: templates,
    });
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

    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getCvTemplateById = async (req, res, next) => {
  try {
    const template = await CvTemplateModel.findById(req.params.id).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "cv_template_not_found",
      });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCvTemplate = async (req, res, next) => {
  try {
    const template = await CvTemplateModel.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "cv_template_not_found",
      });
    }

    return res.json({
      success: true,
      message: "cv_template_deleted",
    });
  } catch (error) {
    next(error);
  }
};
export default {
  createCvTemplate,
  updateCvTemplate,
  getCvTemplatesAdmin,
  getCvTemplateById,
  deleteCvTemplate
}