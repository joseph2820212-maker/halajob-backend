import mongoose from "mongoose";

const { Schema } = mongoose;

const CompanyCandidateTagSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    label: { type: String, trim: true, default: "", maxlength: 120 },
    color: { type: String, trim: true, default: "", maxlength: 40 },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "company_candidate_tags", timestamps: true },
);

CompanyCandidateTagSchema.index({ company_id: 1, name: 1 }, { unique: true });

const CompanyCandidateTagModel = mongoose.model("company_candidate_tags", CompanyCandidateTagSchema);

export default CompanyCandidateTagModel;
