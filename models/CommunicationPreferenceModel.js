import mongoose from "mongoose";

const { Schema } = mongoose;

// Per-user communication channel preferences. Critical security/legal notices
// are always sent regardless of these flags.
const CommunicationPreferenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true, unique: true, index: true },
    transactionalEmail: { type: Boolean, default: true }, // informational; cannot be disabled for critical notices
    marketingEmail: { type: Boolean, default: true },
    jobAlertEmail: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsOrWhatsapp: { type: Boolean, default: false },
    updatedFrom: { type: String, enum: ["mobile", "web", "admin"], default: "mobile" },
  },
  { collection: "communication_preferences", timestamps: true }
);

const CommunicationPreferenceModel = mongoose.model("communication_preferences", CommunicationPreferenceSchema);
export default CommunicationPreferenceModel;
