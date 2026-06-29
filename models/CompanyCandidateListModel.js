import mongoose from "mongoose";

const { Schema } = mongoose;

const CompanyCandidateListSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    candidate_ids: [{ type: Schema.Types.ObjectId, ref: "company_saved_candidates", index: true }],
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "company_candidate_lists", timestamps: true },
);

CompanyCandidateListSchema.index({ company_id: 1, name: 1 }, { unique: true });

const CompanyCandidateListModel = mongoose.model("company_candidate_lists", CompanyCandidateListSchema);

export default CompanyCandidateListModel;
