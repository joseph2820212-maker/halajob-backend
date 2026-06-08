import mongoose from "mongoose";
import {
  CompanyModel,
  CompanySubscriptionModel,
  SubscriptionPlanModel,
  jobsModel,
} from "../../models/index.js";

export const FREE_PLAN_KEY = "free";
export const UNLIMITED = -1;

export const DEFAULT_FEATURES = {
  can_post_jobs: true,
  can_publish_external_jobs: true,
  can_search_employees: true,
  can_view_employee_contacts: true,
  can_request_talent_help: true,
  can_use_smart_matching: true,
  can_invite_candidates: true,
  can_schedule_interviews: true,
  can_download_cvs: true,
  can_export_applications: true,
  can_manage_applications: true,
};

export const DEFAULT_LIMITS = {
  job_posts: UNLIMITED,
  active_jobs: UNLIMITED,
  talent_searches: UNLIMITED,
  talent_requests: UNLIMITED,
  invitations: UNLIMITED,
  interviews: UNLIMITED,
  cv_downloads: UNLIMITED,
  application_exports: UNLIMITED,
  smart_matching: UNLIMITED,
  external_jobs: UNLIMITED,
  max_questions_per_job: UNLIMITED,
};

export const buildFreePlanPayload = () => ({
  key: FREE_PLAN_KEY,
  title_ar: "الخطة المجانية",
  title_en: "Free plan",
  description_ar: "الخطة الافتراضية للشركات. تحتوي على كل صلاحيات لوحة الشركة بشكل مبدئي مع حدود غير مقيدة، مع بقاء موافقة الإدارة على نشر الوظائف.",
  description_en: "Default company plan. It initially includes all company dashboard permissions with unlimited usage while keeping admin approval for job publishing.",
  price: 0,
  currency_code: "USD",
  billing_period: "free",
  features: { ...DEFAULT_FEATURES },
  limits: { ...DEFAULT_LIMITS },
  jobs_require_admin_approval: true,
  is_default: true,
  is_system: true,
  status: true,
  sort_order: 0,
});

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(String(value)) ? new mongoose.Types.ObjectId(String(value)) : null;
};

const limitValue = (limits = {}, key) => {
  const value = Number(limits?.[key]);
  return Number.isFinite(value) ? value : UNLIMITED;
};

const usageValue = (subscription = {}, key) => Number(subscription?.usage?.[key] || 0);

export const isUnlimited = (value) => Number(value) < 0;

export const ensureFreeSubscriptionPlan = async () => {
  const payload = buildFreePlanPayload();

  const plan = await SubscriptionPlanModel.findOneAndUpdate(
    { key: FREE_PLAN_KEY },
    {
      $set: payload,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return plan;
};
export const getDefaultSubscriptionPlan = async () => {
  return (
    (await SubscriptionPlanModel.findOne({ is_default: true, status: true }).sort({ sort_order: 1, createdAt: 1 })) ||
    (await ensureFreeSubscriptionPlan())
  );
};

export const buildSubscriptionSnapshot = (plan, overrides = {}) => ({
  plan_id: plan._id,
  plan_key: plan.key,
  status: overrides.status || "active",
  starts_at: overrides.starts_at || new Date(),
  ends_at: overrides.ends_at ?? null,
  features: { ...DEFAULT_FEATURES, ...(plan.features?.toObject?.() || plan.features || {}), ...(overrides.features || {}) },
  limits: { ...DEFAULT_LIMITS, ...(plan.limits?.toObject?.() || plan.limits || {}), ...(overrides.limits || {}) },
  jobs_require_admin_approval:
    overrides.jobs_require_admin_approval ?? plan.jobs_require_admin_approval ?? true,
  assigned_by: overrides.assigned_by || null,
  admin_note: overrides.admin_note || "",
});

export const getActiveCompanySubscription = async (companyId) => {
  const id = toObjectId(companyId);
  if (!id) return null;

  const now = new Date();
  return CompanySubscriptionModel.findOne({
    company_id: id,
    status: { $in: ["active", "trialing"] },
    $or: [{ ends_at: null }, { ends_at: { $gte: now } }],
  })
    .populate("plan_id")
    .sort({ createdAt: -1 });
};

export const syncCompanySubscriptionSnapshot = async (companyId, subscription) => {
  if (!companyId || !subscription?._id) return;

  await CompanyModel.findByIdAndUpdate(companyId, {
    $set: {
      "subscription.plan_id": subscription.plan_id?._id || subscription.plan_id,
      "subscription.plan_key": subscription.plan_key,
      "subscription.subscription_id": subscription._id,
      "subscription.status": subscription.status,
      "subscription.active_until": subscription.ends_at || null,
      "subscription.features": subscription.features || {},
      "subscription.limits": subscription.limits || {},
      "subscription.jobs_require_admin_approval": subscription.jobs_require_admin_approval !== false,
    },
  });
};

export const ensureCompanySubscription = async (companyId, options = {}) => {
  const id = toObjectId(companyId);
  if (!id) return null;

  const existing = await getActiveCompanySubscription(id);
  if (existing) {
    await syncCompanySubscriptionSnapshot(id, existing);
    return existing;
  }

  const plan = options.plan || (await getDefaultSubscriptionPlan());
  const snapshot = buildSubscriptionSnapshot(plan, options);

  const subscription = await CompanySubscriptionModel.create({
    company_id: id,
    ...snapshot,
  });

  const populated = await CompanySubscriptionModel.findById(subscription._id).populate("plan_id");
  await syncCompanySubscriptionSnapshot(id, populated || subscription);
  return populated || subscription;
};

export const assignPlanToCompany = async ({ companyId, planId, planKey, assignedBy, startsAt, endsAt, status = "active", adminNote = "" }) => {
  const companyObjectId = toObjectId(companyId);
  if (!companyObjectId) {
    const err = new Error("invalid_company_id");
    err.statusCode = 400;
    throw err;
  }

  const plan = planId && toObjectId(planId)
    ? await SubscriptionPlanModel.findById(planId)
    : await SubscriptionPlanModel.findOne({ key: String(planKey || FREE_PLAN_KEY).trim().toLowerCase() });

  if (!plan) {
    const err = new Error("subscription_plan_not_found");
    err.statusCode = 404;
    throw err;
  }

  await CompanySubscriptionModel.updateMany(
    { company_id: companyObjectId, status: { $in: ["active", "trialing"] } },
    { $set: { status: "cancelled", cancelled_at: new Date() } }
  );

  const snapshot = buildSubscriptionSnapshot(plan, {
    status,
    starts_at: startsAt ? new Date(startsAt) : new Date(),
    ends_at: endsAt ? new Date(endsAt) : null,
    assigned_by: toObjectId(assignedBy),
    admin_note: adminNote,
  });

  const subscription = await CompanySubscriptionModel.create({
    company_id: companyObjectId,
    ...snapshot,
  });

  const populated = await CompanySubscriptionModel.findById(subscription._id).populate("plan_id");
  await syncCompanySubscriptionSnapshot(companyObjectId, populated || subscription);
  return populated || subscription;
};

export const getCompanySubscriptionSummary = async (companyId) => {
  const subscription = await ensureCompanySubscription(companyId);
  if (!subscription) return null;

  return {
    id: subscription._id,
    status: subscription.status,
    starts_at: subscription.starts_at,
    ends_at: subscription.ends_at,
    plan: subscription.plan_id || null,
    plan_id: subscription.plan_id?._id || subscription.plan_id,
    plan_key: subscription.plan_key,
    features: subscription.features || {},
    limits: subscription.limits || {},
    usage: subscription.usage || {},
    jobs_require_admin_approval: subscription.jobs_require_admin_approval !== false,
  };
};

export const checkCompanyFeature = async (companyId, featureKey, metricKey = null, amount = 1, options = {}) => {
  const subscription = await ensureCompanySubscription(companyId);
  if (!subscription) {
    return { allowed: false, message: "company_subscription_not_found", status: 403 };
  }

  const features = subscription.features || {};
  if (featureKey && features[featureKey] === false) {
    return {
      allowed: false,
      message: "subscription_feature_not_allowed",
      status: 403,
      feature: featureKey,
      subscription,
    };
  }

  if (metricKey) {
    const limit = limitValue(subscription.limits || {}, metricKey);
    if (!isUnlimited(limit)) {
      let current = usageValue(subscription, metricKey);

      if (metricKey === "active_jobs") {
        current = await jobsModel.countDocuments({
          company_id: subscription.company_id,
          status: true,
          publish_status: { $in: ["pending_review", "published", "paused"] },
        });
      }

      if (current + Number(amount || 1) > limit) {
        return {
          allowed: false,
          message: "subscription_limit_reached",
          status: 403,
          metric: metricKey,
          limit,
          used: current,
          requested: Number(amount || 1),
          subscription,
        };
      }
    }
  }

  if (options.maxQuestionsMetric && Array.isArray(options.questions)) {
    const maxQuestions = limitValue(subscription.limits || {}, options.maxQuestionsMetric);
    if (!isUnlimited(maxQuestions) && options.questions.length > maxQuestions) {
      return {
        allowed: false,
        message: "subscription_questions_limit_reached",
        status: 403,
        metric: options.maxQuestionsMetric,
        limit: maxQuestions,
        used: options.questions.length,
        subscription,
      };
    }
  }

  return { allowed: true, subscription };
};

export const recordCompanyUsage = async (companyId, metricKey, amount = 1) => {
  const id = toObjectId(companyId);
  if (!id || !metricKey) return null;
  const incKey = `usage.${metricKey}`;
  return CompanySubscriptionModel.findOneAndUpdate(
    {
      company_id: id,
      status: { $in: ["active", "trialing"] },
      $or: [{ ends_at: null }, { ends_at: { $gte: new Date() } }],
    },
    { $inc: { [incKey]: Number(amount || 1) } },
    { new: true }
  );
};

export const shouldJobRequireAdminApproval = async (companyId) => {
  const subscription = await ensureCompanySubscription(companyId);
  return subscription?.jobs_require_admin_approval !== false;
};
