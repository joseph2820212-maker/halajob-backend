import path from "path";
import mongoose from "mongoose";
import {
  CvParseJobModel,
  CvTemplateModel,
  EmployeeCvModel,
  EmployeeModel,
  jobsModel,
  CompanyModel,
} from "../../../models/index.js";
import { fail, getAuthUserId, getEmployeePlain, success } from "../../../helper/employeeDash/employeeDashHelpers.js";
import { parseCvUpload } from "../../../services/cvParsing/cvParserProvider.js";
import { applyParsedCvToEmployee } from "../../../services/cvParsing/cvParseApply.service.js";
import { updateCvQuality } from "../../../services/cvStudio/cvQuality.service.js";
import {
  listCoverLetterTemplates,
  renderCoverLetter,
} from "../../../services/cvStudio/coverLetterTemplate.service.js";

const cleanText = (value = "") => String(value || "").trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const normalizeFilePath = (file) => file?.path?.replace(/\\/g, "/") || "";

const getDefaultTemplate = async () =>
  CvTemplateModel.findOne({ is_active: true }).sort({ sort_order: 1, createdAt: -1 }).lean();

const ownerCv = async (employeeId, cvId) => {
  if (!isObjectId(cvId)) return null;
  return EmployeeCvModel.findOne({ _id: cvId, employee_id: employeeId });
};

const ownerParseJob = async (employeeId, jobId) => {
  if (!isObjectId(jobId)) return null;
  return CvParseJobModel.findOne({ _id: jobId, employee_id: employeeId });
};

const sanitizeParseJob = (job) => {
  const plain = job?.toObject ? job.toObject() : job;
  if (!plain) return null;
  delete plain.raw_result;
  return plain;
};

const fileNameFromPath = (value = "") => path.basename(cleanText(value).replace(/\\/g, "/")) || "cv.pdf";

export const parseUpload = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const filePath = normalizeFilePath(req.file);
    if (!filePath) return fail(res, "cv_file_required", 400);

    const template = await getDefaultTemplate();
    if (!template) return fail(res, "cv_template_not_found", 404);

    const makeDefault = String(req.body?.is_default ?? "false") === "true";
    if (makeDefault) {
      await EmployeeCvModel.updateMany({ employee_id: employee._id }, { $set: { is_default: false } });
    }

    const parsed = await parseCvUpload({ file: req.file, employee });
    const cv = await EmployeeCvModel.create({
      employee_id: employee._id,
      template_id: template._id,
      template_key: template.key,
      title: cleanText(req.body?.title) || req.file?.originalname || "Parsed upload CV",
      lang: req.body?.lang === "ar" ? "ar" : "en",
      pdf_file: filePath,
      source: "parsed_upload",
      status: parsed.status === "parsed" ? "active" : "draft",
      is_default: makeDefault,
      visibility: "private",
      last_parsed_at: parsed.status === "parsed" ? new Date() : null,
    });

    const job = await CvParseJobModel.create({
      user_id: getAuthUserId(req),
      employee_id: employee._id,
      cv_id: cv._id,
      file_path: filePath,
      original_name: req.file?.originalname || fileNameFromPath(filePath),
      mime_type: req.file?.mimetype || "",
      provider: parsed.provider || "manual",
      status: parsed.status || "failed",
      raw_result: parsed.raw_result || {},
      normalized_result: parsed.normalized_result || {},
      confidence: parsed.confidence || 0,
      error_code: parsed.error_code || "",
      error_message: parsed.error_message || "",
    });

    return success(
      res,
      {
        cv,
        parse_job: sanitizeParseJob(job),
      },
      parsed.status === "parsed" ? "cv_parse_completed" : "cv_parse_pending_manual_review",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getParseJob = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const job = await ownerParseJob(employee._id, req.params.jobId);
    if (!job) return fail(res, "cv_parse_job_not_found", 404);

    return success(res, sanitizeParseJob(job));
  } catch (error) {
    next(error);
  }
};

export const previewParseJob = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const job = await ownerParseJob(employee._id, req.params.jobId);
    if (!job) return fail(res, "cv_parse_job_not_found", 404);

    return success(res, {
      id: job._id,
      status: job.status,
      confidence: job.confidence,
      normalized_result: job.normalized_result || {},
      error_code: job.error_code || "",
      error_message: job.error_message || "",
    });
  } catch (error) {
    next(error);
  }
};

export const confirmParseJob = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const job = await ownerParseJob(employee._id, req.params.jobId);
    if (!job) return fail(res, "cv_parse_job_not_found", 404);
    if (job.status !== "parsed") return fail(res, "cv_parse_job_not_ready", 409);

    await applyParsedCvToEmployee({ employee, parsed: job.normalized_result || {} });
    job.status = "confirmed";
    job.confirmed_at = new Date();
    await job.save();

    if (job.cv_id) {
      await EmployeeCvModel.updateOne(
        { _id: job.cv_id, employee_id: employee._id },
        {
          $set: {
            status: "active",
            source: "parsed_upload",
            last_parsed_at: new Date(),
          },
        }
      );
    }

    return success(res, sanitizeParseJob(job), "cv_parse_confirmed");
  } catch (error) {
    next(error);
  }
};

export const rejectParseJob = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const job = await ownerParseJob(employee._id, req.params.jobId);
    if (!job) return fail(res, "cv_parse_job_not_found", 404);
    job.status = "rejected";
    await job.save();

    return success(res, sanitizeParseJob(job), "cv_parse_rejected");
  } catch (error) {
    next(error);
  }
};

export const scoreCvQuality = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    const populatedEmployee = await EmployeeModel.findById(employee._id).populate("user_id");
    const result = await updateCvQuality({ cv, employee: populatedEmployee || employee });
    return success(res, { cv_id: cv._id, ...result }, "cv_quality_scored");
  } catch (error) {
    next(error);
  }
};

export const duplicateCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    const data = cv.toObject();
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.public_download_token;
    delete data.public_download_expires_at;

    const duplicate = await EmployeeCvModel.create({
      ...data,
      title: cleanText(req.body?.title) || `Copy of ${cv.title || "My CV"}`,
      is_default: false,
      status: "draft",
      visibility: "private",
      version: Number(cv.version || 1) + 1,
      quality_score: 0,
      quality_checks: {},
      attached_application_count: 0,
      public_download_token: "",
      public_download_expires_at: null,
    });

    return success(res, duplicate, "cv_duplicated", 201);
  } catch (error) {
    next(error);
  }
};

export const updateVisibility = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    cv.visibility = req.body.visibility;
    await cv.save();

    return success(res, cv, "cv_visibility_updated");
  } catch (error) {
    next(error);
  }
};

export const setDefaultCv = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    await EmployeeCvModel.updateMany({ employee_id: employee._id }, { $set: { is_default: false } });
    cv.is_default = true;
    cv.status = "active";
    await cv.save();

    return success(res, cv, "cv_set_default");
  } catch (error) {
    next(error);
  }
};

const resolveCoverLetterContext = async ({ employee, body = {} }) => {
  const jobId = body.job_id || body.jobId;
  if (jobId && isObjectId(jobId)) {
    const job = await jobsModel.findById(jobId).lean();
    const company = job?.company_id ? await CompanyModel.findById(job.company_id).lean() : null;
    return { job: job || {}, company: company || {} };
  }
  return {
    job: { job_name: cleanText(body.job_title || body.role) },
    company: { company_name: cleanText(body.company_name) },
    employee,
  };
};

export const getCoverLetterTemplates = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    return success(res, listCoverLetterTemplates());
  } catch (error) {
    next(error);
  }
};

export const previewCoverLetter = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    const populatedEmployee = await EmployeeModel.findById(employee._id).populate("user_id").lean();
    const context = await resolveCoverLetterContext({ employee: populatedEmployee || employee, body: req.body });
    const rendered = renderCoverLetter({
      templateKey: req.body.template_key || req.body.key || "direct",
      employee: populatedEmployee || employee,
      job: context.job,
      company: context.company,
      custom: req.body,
    });

    return success(res, {
      cv_id: cv._id,
      ...rendered,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadCoverLetter = async (req, res, next) => {
  try {
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await ownerCv(employee._id, req.params.cvId);
    if (!cv) return fail(res, "cv_not_found", 404);

    const populatedEmployee = await EmployeeModel.findById(employee._id).populate("user_id").lean();
    const context = await resolveCoverLetterContext({ employee: populatedEmployee || employee, body: req.body });
    const rendered = renderCoverLetter({
      templateKey: req.body.template_key || req.body.key || "direct",
      employee: populatedEmployee || employee,
      job: context.job,
      company: context.company,
      custom: req.body,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"cover-letter.txt\"");
    return res.send(rendered.text);
  } catch (error) {
    next(error);
  }
};

export default {
  parseUpload,
  getParseJob,
  previewParseJob,
  confirmParseJob,
  rejectParseJob,
  scoreCvQuality,
  duplicateCv,
  updateVisibility,
  setDefaultCv,
  getCoverLetterTemplates,
  previewCoverLetter,
  downloadCoverLetter,
};
