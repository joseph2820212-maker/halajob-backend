import mongoose from "mongoose";

const { Schema } = mongoose;

const EmailLogSchema = new Schema(
  {
    templateKey: { type: String, default: "", index: true },
    recipientEmail: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    role: { type: String, default: "" },
    subject: { type: String, default: "" },
    status: { type: String, enum: ["queued", "sent", "failed", "bounced", "suppressed"], default: "queued", index: true },
    providerMessageId: { type: String, default: "" },
    error: { type: String, default: "" },
    sentAt: { type: Date, default: null },
  },
  { collection: "email_logs", timestamps: true }
);

EmailLogSchema.index({ status: 1, createdAt: -1 });

const EmailLogModel = mongoose.model("email_logs", EmailLogSchema);
export default EmailLogModel;
