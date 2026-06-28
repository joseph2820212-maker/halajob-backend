import mongoose from "mongoose";

const { Schema } = mongoose;

const UserPolicyAcknowledgementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    roleContext: { type: String, default: "seeker" },
    pageKey: { type: String, required: true, index: true },
    version: { type: String, required: true },
    acceptedAt: { type: Date, default: Date.now },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    source: { type: String, enum: ["mobile", "web", "admin"], default: "mobile" },
  },
  { collection: "user_policy_acknowledgements", timestamps: true }
);

UserPolicyAcknowledgementSchema.index({ userId: 1, pageKey: 1, version: 1 }, { unique: true });

const UserPolicyAcknowledgementModel = mongoose.model("user_policy_acknowledgements", UserPolicyAcknowledgementSchema);
export default UserPolicyAcknowledgementModel;
