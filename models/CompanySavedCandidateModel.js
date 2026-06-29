import mongoose from "mongoose";

const { Schema } = mongoose;

const CompanySavedCandidateSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    source: {
      type: String,
      enum: ["application", "campus", "manual", "invitation"],
      default: "application",
      index: true,
    },
    source_application_id: { type: Schema.Types.ObjectId, ref: "user_applying_job", default: null, index: true },
    status: {
      type: String,
      enum: ["active", "archived", "do_not_contact"],
      default: "active",
      index: true,
    },
    rating: { type: Number, min: 1, max: 5, default: null },
    tags: { type: [String], default: [], index: true },
    saved_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    last_contacted_at: { type: Date, default: null },
  },
  { collection: "company_saved_candidates", timestamps: true },
);

CompanySavedCandidateSchema.index({ company_id: 1, employee_id: 1 }, { unique: true });
CompanySavedCandidateSchema.index({ company_id: 1, status: 1, updatedAt: -1 });
CompanySavedCandidateSchema.index({ company_id: 1, tags: 1 });

const CompanySavedCandidateModel = mongoose.model("company_saved_candidates", CompanySavedCandidateSchema);

export default CompanySavedCandidateModel;
