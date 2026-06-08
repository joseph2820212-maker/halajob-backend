import mongoose from "mongoose";

const { Schema } = mongoose;

const PlanLimitsSchema = new Schema(
  {
    job_posts: { type: Number, default: -1 },
    active_jobs: { type: Number, default: -1 },
    talent_searches: { type: Number, default: -1 },
    talent_requests: { type: Number, default: -1 },
    invitations: { type: Number, default: -1 },
    interviews: { type: Number, default: -1 },
    cv_downloads: { type: Number, default: -1 },
    application_exports: { type: Number, default: -1 },
    smart_matching: { type: Number, default: -1 },
    external_jobs: { type: Number, default: -1 },
    max_questions_per_job: { type: Number, default: -1 },
  },
  { _id: false }
);

const PlanFeaturesSchema = new Schema(
  {
    can_post_jobs: { type: Boolean, default: true },
    can_publish_external_jobs: { type: Boolean, default: true },
    can_search_employees: { type: Boolean, default: true },
    can_view_employee_contacts: { type: Boolean, default: true },
    can_request_talent_help: { type: Boolean, default: true },
    can_use_smart_matching: { type: Boolean, default: true },
    can_invite_candidates: { type: Boolean, default: true },
    can_schedule_interviews: { type: Boolean, default: true },
    can_download_cvs: { type: Boolean, default: true },
    can_export_applications: { type: Boolean, default: true },
    can_manage_applications: { type: Boolean, default: true },
  },
  { _id: false }
);

const SubscriptionPlanSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    description_ar: { type: String, trim: true, default: "" },
    description_en: { type: String, trim: true, default: "" },

    price: { type: Number, default: 0, min: 0 },
    currency_code: { type: String, uppercase: true, trim: true, default: "USD" },
    billing_period: {
      type: String,
      enum: ["free", "monthly", "quarterly", "yearly", "lifetime", "custom"],
      default: "free",
      index: true,
    },

    features: { type: PlanFeaturesSchema, default: () => ({}) },
    limits: { type: PlanLimitsSchema, default: () => ({}) },

    // Governance remains separate from feature permissions.
    // Even a full-access free plan can still require admin review before public publishing.
    jobs_require_admin_approval: { type: Boolean, default: true, index: true },

    trial_days: { type: Number, default: 0, min: 0 },
    sort_order: { type: Number, default: 0, index: true },
    is_default: { type: Boolean, default: false, index: true },
    is_system: { type: Boolean, default: false, index: true },
    status: { type: Boolean, default: true, index: true },
  },
  { collection: "subscription_plans", timestamps: true }
);

SubscriptionPlanSchema.index({ status: 1, sort_order: 1 });
SubscriptionPlanSchema.index({ title_ar: "text", title_en: "text", description_ar: "text", description_en: "text", key: "text" });

const SubscriptionPlanModel = mongoose.model("subscription_plans", SubscriptionPlanSchema);
export default SubscriptionPlanModel;
