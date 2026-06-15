import mongoose from "mongoose";

const { Schema } = mongoose;

const UniversityOpportunityRequestSchema = new Schema(
  {
    university_id: { type: Schema.Types.ObjectId, ref: "universities", required: true, index: true },
    requested_by_user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    target: { type: String, enum: ["students", "fresh_graduates"], default: "students", index: true },
    requested_count: { type: Number, min: 1, max: 500, default: 25 },
    status: { type: String, enum: ["new", "in_progress", "published", "closed", "cancelled"], default: "new", index: true },
    note: { type: String, trim: true, default: "" },
  },
  { collection: "university_opportunity_requests", timestamps: true }
);

UniversityOpportunityRequestSchema.index({ university_id: 1, createdAt: -1 });
UniversityOpportunityRequestSchema.index({ status: 1, createdAt: -1 });

const UniversityOpportunityRequestModel = mongoose.model("university_opportunity_requests", UniversityOpportunityRequestSchema);

export default UniversityOpportunityRequestModel;
