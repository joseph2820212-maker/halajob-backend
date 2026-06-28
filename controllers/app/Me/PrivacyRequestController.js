import crypto from "crypto";
import {
  PrivacyRequestModel,
  AccessibilityRequestModel,
  UserPolicyAcknowledgementModel,
  UserConsentModel,
  CommunicationPreferenceModel,
} from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const VALID_TYPES = PrivacyRequestModel.schema.path("type").enumValues;
const makeNo = (p) => `${p}-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(1000, 9999)}`;

const createPrivacyRequest = async (req, res, next) => {
  try {
    const type = req.body?.type;
    if (!VALID_TYPES.includes(type)) return ReturnAppData.getError({ res, status: 400, message: "invalid_privacy_request_type" });
    const reqDoc = await PrivacyRequestModel.create({
      requestNo: makeNo("PR"),
      userId: req.user._id,
      email: req.user.email || "",
      type,
      details: typeof req.body?.details === "string" ? req.body.details.trim().slice(0, 2000) : "",
    });
    await writeAuditLog({ req, actorUserId: req.user._id, actorType: "employee", action: "privacy_request_created", entityType: "user", entityId: req.user._id, note: type });
    return ReturnAppData.createData({ res, data: { requestNo: reqDoc.requestNo, status: reqDoc.status }, message: "privacy_request_received" });
  } catch (error) {
    return next(error);
  }
};

const listMyPrivacyRequests = async (req, res, next) => {
  try {
    const items = await PrivacyRequestModel.find({ userId: req.user._id }).select("requestNo type status createdAt completedAt").sort("-createdAt").lean();
    return ReturnAppData.getData({ res, data: items, message: "privacy_requests" });
  } catch (error) {
    return next(error);
  }
};

const acknowledgePolicy = async (req, res, next) => {
  try {
    const pageKey = String(req.params.pageKey || "").trim();
    const version = typeof req.body?.version === "string" ? req.body.version.trim() : "";
    if (!pageKey || !version) return ReturnAppData.getError({ res, status: 400, message: "pageKey_and_version_required" });
    await UserPolicyAcknowledgementModel.updateOne(
      { userId: req.user._id, pageKey, version },
      { $set: { userId: req.user._id, pageKey, version, acceptedAt: new Date(), ip: req.ip || "", userAgent: req.headers?.["user-agent"] || "", source: req.body?.source === "web" ? "web" : "mobile" } },
      { upsert: true }
    );
    return ReturnAppData.updateData({ res, data: { pageKey, version }, message: "policy_acknowledged" });
  } catch (error) {
    return next(error);
  }
};

const listConsents = async (req, res, next) => {
  try {
    const [consents, prefs] = await Promise.all([
      UserConsentModel.find({ userId: req.user._id }).select("purpose granted changedAt").lean(),
      CommunicationPreferenceModel.findOne({ userId: req.user._id }).select("-__v").lean(),
    ]);
    return ReturnAppData.getData({ res, data: { consents, communicationPreferences: prefs }, message: "consents" });
  } catch (error) {
    return next(error);
  }
};

const setConsent = async (req, res, next) => {
  try {
    const purpose = String(req.params.purpose || "").trim();
    if (!purpose) return ReturnAppData.getError({ res, status: 400, message: "purpose_required" });
    const granted = req.body?.granted === true || req.body?.granted === "true";
    await UserConsentModel.updateOne(
      { userId: req.user._id, purpose },
      { $set: { userId: req.user._id, purpose, granted, changedAt: new Date(), ip: req.ip || "", userAgent: req.headers?.["user-agent"] || "", source: req.body?.source === "web" ? "web" : "mobile" } },
      { upsert: true }
    );
    await writeAuditLog({ req, actorUserId: req.user._id, actorType: "employee", action: "consent_updated", entityType: "user", entityId: req.user._id, note: `${purpose}:${granted}` });
    return ReturnAppData.updateData({ res, data: { purpose, granted }, message: "consent_updated" });
  } catch (error) {
    return next(error);
  }
};

const createAccessibilityRequest = async (req, res, next) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return ReturnAppData.getError({ res, status: 400, message: "message_required" });
    const doc = await AccessibilityRequestModel.create({
      requestNo: makeNo("AC"),
      userId: req.user?._id || null,
      email: req.user?.email || (typeof req.body?.email === "string" ? req.body.email.trim() : ""),
      name: [req.user?.first_name, req.user?.last_name].filter(Boolean).join(" "),
      area: typeof req.body?.area === "string" ? req.body.area.trim() : "general",
      message,
    });
    return ReturnAppData.createData({ res, data: { requestNo: doc.requestNo, status: doc.status }, message: "accessibility_request_received" });
  } catch (error) {
    return next(error);
  }
};

export default { createPrivacyRequest, listMyPrivacyRequests, acknowledgePolicy, listConsents, setConsent, createAccessibilityRequest };
