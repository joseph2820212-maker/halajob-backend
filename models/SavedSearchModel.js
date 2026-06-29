import mongoose from "mongoose";

const { Schema } = mongoose;

const SavedSearchFiltersSchema = new Schema(
  {
    keyword: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    date_posted: { type: String, trim: true, default: "" },
    job_type: { type: String, trim: true, default: "" },
    experience: { type: String, trim: true, default: "" },
    education_level: { type: String, trim: true, default: "" },
    skills: { type: [String], default: [] },
    salary: { type: String, trim: true, default: "" },
    work_mode: { type: String, trim: true, default: "" },
    deadline: { type: String, trim: true, default: "" },
    job_type_id: { type: Schema.Types.ObjectId, ref: "job_type", default: null },
    work_mode_id: { type: Schema.Types.ObjectId, ref: "work_modes", default: null },
    experience_level_id: { type: Schema.Types.ObjectId, ref: "experience_levels", default: null },
    salary_min: { type: Number, default: null, min: 0 },
    salary_max: { type: Number, default: null, min: 0 },
    currency_code: { type: String, trim: true, uppercase: true, default: "" },
    is_remote: { type: Boolean, default: null },
    easy_apply: { type: Boolean, default: null },
    is_for_students: { type: Boolean, default: null },
    is_for_fresh_graduates: { type: Boolean, default: null },
    verified_employer: { type: Boolean, default: null },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null },
  },
  { _id: false },
);

const SavedSearchChannelsSchema = new Schema(
  {
    in_app: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    manual_whatsapp: { type: Boolean, default: false },
  },
  { _id: false },
);

const SavedSearchSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", default: null, index: true },
    name: { type: String, trim: true, default: "" },
    scope: { type: String, enum: ["seeker", "campus"], default: "seeker", index: true },
    filters: { type: SavedSearchFiltersSchema, default: () => ({}) },
    frequency: { type: String, enum: ["instant", "daily", "weekly", "off"], default: "daily", index: true },
    channels: { type: SavedSearchChannelsSchema, default: () => ({}) },
    is_active: { type: Boolean, default: true, index: true },
    last_checked_at: { type: Date, default: null },
    last_sent_at: { type: Date, default: null },
    created_from: { type: String, enum: ["search", "migration", "onboarding"], default: "search", index: true },
    legacy_alert_id: { type: String, trim: true, default: undefined },
  },
  { collection: "saved_searches", timestamps: true },
);

SavedSearchSchema.index({ user_id: 1, is_active: 1, frequency: 1, last_checked_at: 1 });
SavedSearchSchema.index({ employee_id: 1, created_from: 1 });
SavedSearchSchema.index({ "filters.keyword": 1, "filters.city": 1, "filters.country": 1 });
SavedSearchSchema.index({ "filters.education_level": 1, "filters.skills": 1 });
SavedSearchSchema.index(
  { user_id: 1, employee_id: 1, legacy_alert_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      legacy_alert_id: { $exists: true, $type: "string" },
    },
  },
);

const SavedSearchModel = mongoose.model("saved_searches", SavedSearchSchema);

export default SavedSearchModel;
