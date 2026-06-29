import mongoose from "mongoose";

const { Schema } = mongoose;

const NoteSchema = new Schema(
  {
    by_user_id: { type: Schema.Types.ObjectId, ref: "users", default: null },
    note: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["company", "university", "admin", "system"],
      default: "company",
    },
  },
  { _id: true, timestamps: true },
);

const CampusOpportunitySchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "companies",
      required: true,
      index: true,
    },
    university_id: {
      type: Schema.Types.ObjectId,
      ref: "universities",
      default: null,
      index: true,
    },
    requested_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    job_id: {
      type: Schema.Types.ObjectId,
      ref: "jobs",
      default: null,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    target: {
      type: String,
      enum: ["students", "fresh_graduates"],
      default: "students",
      index: true,
    },
    requested_count: { type: Number, min: 1, max: 500, default: 5 },
    required_skills: { type: [String], default: [] },
    preferred_skills: { type: [String], default: [] },
    countries: { type: [String], default: [] },
    cities: { type: [String], default: [] },

    lifecycle_status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "university_review",
        "approved",
        "published",
        "closed",
        "outcomes_reported",
        "rejected",
        "cancelled",
      ],
      default: "submitted",
      index: true,
    },
    request_status: {
      type: String,
      enum: [
        "requested",
        "university_review",
        "accepted",
        "rejected",
        "converted_to_opportunity",
      ],
      default: "requested",
      index: true,
    },
    source: {
      type: String,
      enum: ["company_request", "university_request", "job_mirror", "system"],
      default: "company_request",
      index: true,
    },

    notes: { type: [NoteSchema], default: [] },
    admin_note: { type: String, trim: true, default: "" },
    published_at: { type: Date, default: null },
    closed_at: { type: Date, default: null },
    outcomes_reported_at: { type: Date, default: null },
  },
  { collection: "campus_opportunities", timestamps: true },
);

CampusOpportunitySchema.index({ company_id: 1, createdAt: -1 });
CampusOpportunitySchema.index({ university_id: 1, lifecycle_status: 1 });
CampusOpportunitySchema.index({ lifecycle_status: 1, createdAt: -1 });
CampusOpportunitySchema.index({ job_id: 1, source: 1 });

const CampusOpportunityModel = mongoose.model(
  "campus_opportunities",
  CampusOpportunitySchema,
);

export default CampusOpportunityModel;
