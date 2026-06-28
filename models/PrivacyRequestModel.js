import mongoose from "mongoose";

const { Schema } = mongoose;

const PrivacyRequestSchema = new Schema(
  {
    requestNo: { type: String, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    email: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["data_access", "data_export", "data_correction", "data_deletion", "marketing_opt_out", "consent_withdrawal", "account_restriction", "objection_to_processing", "cookie_preferences"],
      required: true,
      index: true,
    },
    status: { type: String, enum: ["received", "verifying_identity", "processing", "completed", "rejected", "cancelled"], default: "received", index: true },
    verificationStatus: { type: String, enum: ["not_required", "pending", "verified", "failed"], default: "pending" },
    details: { type: String, default: "", trim: true },
    deadlineAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    responseSummary: { type: String, default: "" },
    exportFileId: { type: Schema.Types.ObjectId, default: null },
    handledBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "privacy_requests", timestamps: true }
);

PrivacyRequestSchema.index({ status: 1, createdAt: -1 });

const PrivacyRequestModel = mongoose.model("privacy_requests", PrivacyRequestSchema);
export default PrivacyRequestModel;
