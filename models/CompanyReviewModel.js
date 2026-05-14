import mongoose from "mongoose";
const { Schema } = mongoose;
const CompanyReviewSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "published", "hidden", "rejected"], default: "pending", index: true },
    is_anonymous: { type: Boolean, default: false },
  },
  { collection: "company_reviews", timestamps: true }
);
CompanyReviewSchema.index({ user_id: 1, company_id: 1 }, { unique: true });
CompanyReviewSchema.index({ company_id: 1, status: 1, createdAt: -1 });
const CompanyReviewModel = mongoose.model("company_reviews", CompanyReviewSchema);
export default CompanyReviewModel;
