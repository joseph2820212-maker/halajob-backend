import mongoose from "mongoose";

const { Schema } = mongoose;

const LimitSnapshotSchema = new Schema(
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

const FeatureSnapshotSchema = new Schema(
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

const UsageSchema = new Schema(
  {
    job_posts: { type: Number, default: 0, min: 0 },
    active_jobs: { type: Number, default: 0, min: 0 },
    talent_searches: { type: Number, default: 0, min: 0 },
    talent_requests: { type: Number, default: 0, min: 0 },
    invitations: { type: Number, default: 0, min: 0 },
    interviews: { type: Number, default: 0, min: 0 },
    cv_downloads: { type: Number, default: 0, min: 0 },
    application_exports: { type: Number, default: 0, min: 0 },
    smart_matching: { type: Number, default: 0, min: 0 },
    external_jobs: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const CompanySubscriptionSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "subscription_plans", required: true, index: true },
    plan_key: { type: String, lowercase: true, trim: true, required: true, index: true },

    status: {
      type: String,
      enum: ["active", "trialing", "expired", "cancelled", "suspended"],
      default: "active",
      index: true,
    },

    starts_at: { type: Date, default: Date.now, index: true },
    ends_at: { type: Date, default: null, index: true },
    cancelled_at: { type: Date, default: null },
    last_usage_reset_at: { type: Date, default: Date.now },

    features: { type: FeatureSnapshotSchema, default: () => ({}) },
    limits: { type: LimitSnapshotSchema, default: () => ({}) },
    usage: { type: UsageSchema, default: () => ({}) },
    jobs_require_admin_approval: { type: Boolean, default: true, index: true },

    assigned_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    admin_note: { type: String, trim: true, default: "" },
  },
  { collection: "company_subscriptions", timestamps: true }
);

CompanySubscriptionSchema.index({ company_id: 1, status: 1, createdAt: -1 });
CompanySubscriptionSchema.index({ plan_id: 1, status: 1 });

const CompanySubscriptionModel = mongoose.model("company_subscriptions", CompanySubscriptionSchema);
export default CompanySubscriptionModel;
