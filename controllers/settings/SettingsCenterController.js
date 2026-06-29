import ReturnAppData from "../../helper/ReturnAppData/index.js";
import {
  CompanyModel,
  CompanySettingsModel,
  EmployeeModel,
  PlatformSettingsModel,
  PrivacyRequestModel,
  RefreshTokenModel,
  UniversityModel,
  UniversitySettingsModel,
  UserModel,
  UserSettingsModel,
} from "../../models/index.js";
import { buildCompanyOwnerQuery } from "../../services/appAccount.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";
import { getOrCreateNotificationPreferences } from "../../services/notifications/notificationPreference.service.js";
import {
  clearPlatformSettingsCache,
  clientSettingsFromPlatform,
  loadPlatformSettings,
} from "../../services/settings/platformSettings.service.js";

const USER_SECTIONS = new Set([
  "security",
  "privacy",
  "preferences",
  "support",
  "job_alerts",
  "consent",
]);
const COMPANY_SECTIONS = new Set([
  "security",
  "privacy",
  "preferences",
  "billing",
  "ats",
  "campus",
  "support",
]);
const UNIVERSITY_SECTIONS = new Set([
  "security",
  "privacy",
  "preferences",
  "campus",
  "verification",
  "members",
  "support",
]);
const PLATFORM_SECTIONS = new Set([
  "general",
  "maintenance",
  "security",
  "uploads",
  "features",
  "jobs",
  "campus",
  "billing",
  "notifications",
  "ai",
  "privacy",
  "integrations",
]);

const objectId = (value) => value?._id || value || null;
const cleanText = (value) => String(value || "").trim();

const pickSections = (body = {}, allowedSections) =>
  Object.entries(body || {}).reduce((patch, [key, value]) => {
    if (allowedSections.has(key))
      patch[key] = value && typeof value === "object" ? value : {};
    return patch;
  }, {});

const userAccount = (user = {}) => ({
  id: user._id,
  first_name: user.first_name || "",
  mid_name: user.mid_name || "",
  last_name: user.last_name || "",
  email: user.email || "",
  phone_code: user.phone_code || "",
  phone: user.phone_national || user.phone || "",
  image: user.image || "",
  status: user.status !== false,
});

const companyAccount = (company = {}) => ({
  id: company._id,
  name: company.company_name || "",
  email: company.company_email || "",
  phone: company.company_phone || "",
  country: company.company_country || "",
  city: company.company_city || "",
  accepted: company.accepted !== false,
  status: company.status !== false,
  verified: company.is_verified === true,
});

const universityAccount = (university = {}) => ({
  id: university._id,
  name: university.name || "",
  name_en: university.name_en || "",
  email_domain: university.email_domain || "",
  career_center_email: university.career_center_email || "",
  status: university.status || "",
  verified: university.verified === true,
});

const securitySummary = async (userId) => ({
  active_sessions: await RefreshTokenModel.countDocuments({ userRef: userId }),
  logout_all_endpoint: "/auth/logout-all",
  sessions_endpoint: "/auth/sessions",
});

const recentPrivacyRequests = async (userId) =>
  PrivacyRequestModel.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("type status requestedAt resolvedAt createdAt updatedAt")
    .lean();

const resolveCompany = async (req) => {
  const activeCompanyId = ["company_admin", "company_member"].includes(
    req.activeContext?.context_type,
  )
    ? req.activeContext.entity_id
    : null;
  if (activeCompanyId) return CompanyModel.findById(activeCompanyId).lean();
  return CompanyModel.findOne(buildCompanyOwnerQuery(req.user?._id)).lean();
};

const resolveUniversity = async (req) => {
  const activeUniversityId =
    req.activeContext?.context_type === "university_admin"
      ? req.activeContext.entity_id
      : null;
  if (!activeUniversityId) return null;
  return UniversityModel.findById(activeUniversityId).lean();
};

const syncUserPrivacyFields = async (userId, privacy = {}) => {
  const set = {};
  const profileVisibility = cleanText(
    privacy.profile_visibility || privacy.visibility,
  );
  if (["public", "private", "companies_only"].includes(profileVisibility)) {
    set.profile_visibility = profileVisibility;
  }

  const campusDiscoveryVisibility = cleanText(
    privacy.campus_discovery_visibility,
  );
  if (
    ["partner_companies", "public_talent_pool", "hidden"].includes(
      campusDiscoveryVisibility,
    )
  ) {
    set["student_profile.campus_discovery_visibility"] =
      campusDiscoveryVisibility;
  }

  const contactVisibility = cleanText(privacy.contact_visibility);
  if (["hidden", "partner_companies", "public"].includes(contactVisibility)) {
    set["student_profile.contact_visibility"] = contactVisibility;
  }

  const cvVisibility = cleanText(privacy.cv_visibility);
  if (["hidden", "partner_companies", "public"].includes(cvVisibility)) {
    set["student_profile.cv_visibility"] = cvVisibility;
  }

  if (Object.keys(set).length) {
    await EmployeeModel.updateOne(
      { user_id: userId },
      { $set: set },
      { runValidators: true },
    );
  }
};

export const getUserSettings = async (req, res, next) => {
  try {
    const [user, employee, settings, notifications, sessions, privacyRequests] =
      await Promise.all([
        UserModel.findById(req.user._id)
          .select("-password -passcode -another_device_code -pending_device")
          .lean(),
        EmployeeModel.findOne({ user_id: req.user._id })
          .select(
            "profile_visibility blocked_companies job_alerts student_profile profile_completion",
          )
          .lean(),
        UserSettingsModel.findOneAndUpdate(
          { user_id: req.user._id },
          { $setOnInsert: { user_id: req.user._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean(),
        getOrCreateNotificationPreferences(req.user._id),
        securitySummary(req.user._id),
        recentPrivacyRequests(req.user._id),
      ]);

    return ReturnAppData.getData({
      res,
      message: "user_settings",
      data: {
        account: userAccount(user),
        profile: employee || null,
        security: sessions,
        notifications,
        privacy_requests: privacyRequests,
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserSettings = async (req, res, next) => {
  try {
    const patch = pickSections(req.body, USER_SECTIONS);
    await syncUserPrivacyFields(req.user._id, patch.privacy);
    const settings = await UserSettingsModel.findOneAndUpdate(
      { user_id: req.user._id },
      {
        $set: { ...patch, updated_by: req.user._id },
        $setOnInsert: { user_id: req.user._id },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "user_settings_updated",
      entityType: "user",
      entityId: req.user._id,
      newValue: { sections: Object.keys(patch) },
    });

    return ReturnAppData.updateData({
      res,
      message: "user_settings_updated",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanySettings = async (req, res, next) => {
  try {
    const company = await resolveCompany(req);
    if (!company?._id)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "company_not_found",
      });

    const [settings, notifications, sessions] = await Promise.all([
      CompanySettingsModel.findOneAndUpdate(
        { company_id: company._id },
        { $setOnInsert: { company_id: company._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean(),
      getOrCreateNotificationPreferences(req.user._id),
      securitySummary(req.user._id),
    ]);

    return ReturnAppData.getData({
      res,
      message: "company_settings",
      data: {
        account: companyAccount(company),
        security: sessions,
        notifications,
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req, res, next) => {
  try {
    const company = await resolveCompany(req);
    if (!company?._id)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "company_not_found",
      });

    const patch = pickSections(req.body, COMPANY_SECTIONS);
    const settings = await CompanySettingsModel.findOneAndUpdate(
      { company_id: company._id },
      {
        $set: { ...patch, updated_by: req.user._id },
        $setOnInsert: { company_id: company._id },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    await writeAuditLog({
      req,
      companyId: company._id,
      actorUserId: req.user._id,
      actorType:
        req.activeContext?.context_type === "company_member"
          ? "company_member"
          : "company_owner",
      action: "company_settings_updated",
      entityType: "company",
      entityId: company._id,
      newValue: { sections: Object.keys(patch) },
    });

    return ReturnAppData.updateData({
      res,
      message: "company_settings_updated",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getUniversitySettings = async (req, res, next) => {
  try {
    const university = await resolveUniversity(req);
    if (!university?._id)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "university_not_found",
      });

    const [settings, notifications, sessions] = await Promise.all([
      UniversitySettingsModel.findOneAndUpdate(
        { university_id: university._id },
        { $setOnInsert: { university_id: university._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean(),
      getOrCreateNotificationPreferences(req.user._id),
      securitySummary(req.user._id),
    ]);

    return ReturnAppData.getData({
      res,
      message: "university_settings",
      data: {
        account: universityAccount(university),
        security: sessions,
        notifications,
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUniversitySettings = async (req, res, next) => {
  try {
    const university = await resolveUniversity(req);
    if (!university?._id)
      return ReturnAppData.getError({
        res,
        status: 404,
        message: "university_not_found",
      });

    const patch = pickSections(req.body, UNIVERSITY_SECTIONS);
    const settings = await UniversitySettingsModel.findOneAndUpdate(
      { university_id: university._id },
      {
        $set: { ...patch, updated_by: req.user._id },
        $setOnInsert: { university_id: university._id },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    await writeAuditLog({
      req,
      actorUserId: req.user._id,
      actorType: "university_admin",
      action: "university_settings_updated",
      entityType: "other",
      entityId: university._id,
      newValue: { sections: Object.keys(patch) },
    });

    return ReturnAppData.updateData({
      res,
      message: "university_settings_updated",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await loadPlatformSettings({
      upsert: true,
      useCache: false,
    });
    return ReturnAppData.getData({
      res,
      message: "platform_settings",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getClientSettings = async (_req, res, next) => {
  try {
    const settings = await loadPlatformSettings();
    return ReturnAppData.getData({
      res,
      message: "client_settings",
      data: clientSettingsFromPlatform(settings),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSettings = async (req, res, next) => {
  try {
    const patch = pickSections(req.body, PLATFORM_SECTIONS);
    const settings = await PlatformSettingsModel.findOneAndUpdate(
      { key: "default" },
      {
        $set: { ...patch, updated_by: req.user?._id },
        $setOnInsert: { key: "default" },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();
    clearPlatformSettingsCache();

    await writeAuditLog({
      req,
      actorUserId: req.user?._id,
      actorType: "admin",
      action: "platform_settings_updated",
      entityType: "admin",
      entityId: req.user?._id,
      newValue: { sections: Object.keys(patch) },
    });

    return ReturnAppData.updateData({
      res,
      message: "platform_settings_updated",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettingsSchema = (_req, res) =>
  ReturnAppData.getData({
    res,
    message: "platform_settings_schema",
    data: {
      sections: [...PLATFORM_SECTIONS],
      user_sections: [...USER_SECTIONS],
      company_sections: [...COMPANY_SECTIONS],
      university_sections: [...UNIVERSITY_SECTIONS],
    },
  });

export default {
  getUserSettings,
  updateUserSettings,
  getCompanySettings,
  updateCompanySettings,
  getUniversitySettings,
  updateUniversitySettings,
  getClientSettings,
  getPlatformSettings,
  updatePlatformSettings,
  getPlatformSettingsSchema,
};
