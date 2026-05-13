import EmployeeModel from "../../../models/EmployeeModel.js";
import CvTemplateModel from "../../../models/CvTemplateModel.js";
import EmployeeCvModel from "../../../models/EmployeeCvModel.js";

import { buildCvTemplateData } from "../services/cvData.service.js";
import { renderCvHtml, generatePdfFromHtml } from "../services/cvPdf.service.js";

const getEmployeeForCv = async (userId) => {
  return EmployeeModel.findOne({ user_id: userId })
    .populate(
      "user_id",
      "first_name mid_name last_name email phone phone_code phone_national image lan"
    )
    .populate("skills.skill_id", "title_ar title_en")
    .populate("languages.language_id", "title_ar title_en name")
    .populate("education.education_level_id", "title_ar title_en")
    .populate(
      "job_names",
      "title_ar title_en sector_ar sector_en subSector_ar subSector_en"
    )
    .populate("job_types", "title_ar title_en name")
    .populate(
      "preferred_countries",
      "country_code country_name_ar country_name_en city_name_ar city_name_en"
    )
    .populate("preferred_work_modes", "title_ar title_en key")
    .lean();
};

const buildRenderedCv = async ({ userId, payload }) => {
  const {
    template_key = "modern",
    lang = "en",
    colors = {},
    font = {},
    sections = {},
  } = payload;

  const template = await CvTemplateModel.findOne({
    key: template_key,
    is_active: true,
  }).lean();

  if (!template) {
    return {
      error: {
        status: 404,
        message: "cv_template_not_found",
      },
    };
  }

  const employee = await getEmployeeForCv(userId);

  if (!employee) {
    return {
      error: {
        status: 404,
        message: "employee_profile_not_found",
      },
    };
  }

  const mergedColors = {
    ...template.default_colors,
    ...colors,
  };

  const mergedFont = {
    ...template.default_font,
    ...font,
  };

  const data = buildCvTemplateData({
    employee,
    lang,
    colors: mergedColors,
    font: mergedFont,
    sections,
  });

  const html = renderCvHtml({
    template,
    data,
  });

  return {
    html,
    template,
    employee,
    data,
  };
};

export const previewMyCv = async (req, res, next) => {
  try {
    const result = await buildRenderedCv({
      userId: req.user._id,
      payload: req.body,
    });

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    return res.json({
      success: true,
      data: {
        html: result.html,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadMyCv = async (req, res, next) => {
  try {
    const result = await buildRenderedCv({
      userId: req.user._id,
      payload: req.body,
    });

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const pdfBuffer = await generatePdfFromHtml(result.html);

    return res
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `attachment; filename=cv-${result.template.key}.pdf`
      )
      .send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const saveMyCvSettings = async (req, res, next) => {
  try {
    const {
      template_key,
      title,
      lang = "en",
      colors = {},
      font = {},
      sections = {},
      section_order = [],
      is_default = false,
    } = req.body;

    const employee = await EmployeeModel.findOne({ user_id: req.user._id })
      .select("_id")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "employee_profile_not_found",
      });
    }

    const template = await CvTemplateModel.findOne({
      key: template_key,
      is_active: true,
    }).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "cv_template_not_found",
      });
    }

    if (is_default) {
      await EmployeeCvModel.updateMany(
        { employee_id: employee._id },
        { $set: { is_default: false } }
      );
    }

    const cv = await EmployeeCvModel.create({
      employee_id: employee._id,
      template_id: template._id,
      template_key: template.key,
      title,
      lang,
      colors: {
        ...template.default_colors,
        ...colors,
      },
      font: {
        ...template.default_font,
        ...font,
      },
      sections,
      section_order,
      is_default,
    });

    return res.status(201).json({
      success: true,
      data: cv,
    });
  } catch (error) {
    next(error);
  }
};

export const getMySavedCvs = async (req, res, next) => {
  try {
    const employee = await EmployeeModel.findOne({ user_id: req.user._id })
      .select("_id")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "employee_profile_not_found",
      });
    }

    const cvs = await EmployeeCvModel.find({ employee_id: employee._id })
      .populate("template_id", "title_ar title_en preview_image key")
      .sort({ is_default: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: cvs,
    });
  } catch (error) {
    next(error);
  }
};