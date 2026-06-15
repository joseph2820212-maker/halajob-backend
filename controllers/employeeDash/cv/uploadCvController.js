import { EmployeeCvModel, CvTemplateModel } from "../../../models/index.js";
import { fail, getEmployeePlain, success } from "../../../helper/employeeDash/employeeDashHelpers.js";

const normalizeFilePath = (file) => file?.path?.replace(/\\/g, "/") || "";

const getDefaultTemplate = async () =>
  CvTemplateModel.findOne({ is_active: true }).sort({ sort_order: 1, createdAt: -1 }).lean();

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

    const cvs = await EmployeeCvModel.find({ employee_id: employee._id })
      .populate("template_id", "key title_ar title_en preview_image")
      .sort({ is_default: -1, createdAt: -1 })
      .lean();

    return success(res, cvs);
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
