import mongoose from "mongoose";

const { Schema } = mongoose;

// Granular, purpose-based consent records (e.g. marketing, AI data use, cookies).
// Policy/version acceptance is tracked separately in UserPolicyAcknowledgement.
const UserConsentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    purpose: { type: String, required: true, index: true }, // marketing | ai_data | cookies_analytics | cookies_marketing | data_processing
    granted: { type: Boolean, default: false },
    source: { type: String, enum: ["mobile", "web", "admin"], default: "mobile" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    changedAt: { type: Date, default: Date.now },
  },
  { collection: "user_consents", timestamps: true }
);

UserConsentSchema.index({ userId: 1, purpose: 1 }, { unique: true });

const UserConsentModel = mongoose.model("user_consents", UserConsentSchema);
export default UserConsentModel;
