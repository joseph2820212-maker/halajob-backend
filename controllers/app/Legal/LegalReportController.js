import crypto from "crypto";
import { LegalReportModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const VALID_REASONS = LegalReportModel.schema.path("reason").enumValues;
const VALID_TARGETS = LegalReportModel.schema.path("targetType").enumValues;

const makeReportNo = () => `LR-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(1000, 9999)}`;

const HIGH_RISK = new Set(["asks_for_money", "asks_for_sensitive_documents", "impersonation", "fake_company", "harassment"]);

const createReport = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!VALID_REASONS.includes(body.reason)) {
      return ReturnAppData.getError({ res, status: 400, message: "invalid_report_reason" });
    }
    const targetType = VALID_TARGETS.includes(body.targetType) ? body.targetType : "other";
    const report = await LegalReportModel.create({
      reportNo: makeReportNo(),
      reporterUserId: req.user?._id || null,
      reporterEmail: req.user?.email || (typeof body.email === "string" ? body.email.trim() : ""),
      reporterRole: req.user ? "user" : "visitor",
      targetType,
      targetId: body.targetId || null,
      reason: body.reason,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "",
      severity: HIGH_RISK.has(body.reason) ? "high" : "normal",
    });
    await writeAuditLog({ req, actorUserId: req.user?._id || null, actorType: req.user ? "employee" : "system", action: "legal_report_submitted", entityType: "other", entityId: report._id, note: `${targetType}:${body.reason}` });
    return ReturnAppData.createData({ res, data: { reportNo: report.reportNo, status: report.status }, message: "legal_report_received" });
  } catch (error) {
    return next(error);
  }
};

const listMyReports = async (req, res, next) => {
  try {
    const reports = await LegalReportModel.find({ reporterUserId: req.user._id })
      .select("reportNo targetType reason status severity createdAt")
      .sort("-createdAt")
      .lean();
    return ReturnAppData.getData({ res, data: reports, message: "legal_reports" });
  } catch (error) {
    return next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const report = await LegalReportModel.findOne({ _id: req.params.id, reporterUserId: req.user._id })
      .select("-adminNotes")
      .lean();
    if (!report) return ReturnAppData.getError({ res, status: 404, message: "report_not_found" });
    return ReturnAppData.getData({ res, data: report, message: "legal_report" });
  } catch (error) {
    return next(error);
  }
};

export default { createReport, listMyReports, getReport };
