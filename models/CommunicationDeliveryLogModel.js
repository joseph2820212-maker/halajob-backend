import mongoose from "mongoose";

const CHANNELS = [
  "in_app",
  "push",
  "email",
  "sms",
  "manual_whatsapp",
  "whatsapp_business",
];

const STATUSES = ["queued", "sent", "skipped", "failed", "delivered", "read"];

const CommunicationDeliveryLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null, index: true },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    channel: { type: String, enum: CHANNELS, required: true, index: true },
    event_key: { type: String, default: "", trim: true, index: true },
    category: { type: String, default: "system", trim: true, index: true },
    template_key: { type: String, default: "", trim: true, index: true },
    recipient: { type: String, default: "", trim: true },
    status: { type: String, enum: STATUSES, default: "queued", index: true },
    provider: { type: String, default: "", trim: true },
    provider_message_id: { type: String, default: "", trim: true },
    failure_reason: { type: String, default: "", trim: true },
    payload_redacted: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    sent_at: { type: Date, default: null, index: true },
  },
  {
    collection: "communication_delivery_logs",
    timestamps: true,
  },
);

CommunicationDeliveryLogSchema.index({ user_id: 1, createdAt: -1 });
CommunicationDeliveryLogSchema.index({ company_id: 1, createdAt: -1 });
CommunicationDeliveryLogSchema.index({ channel: 1, status: 1, createdAt: -1 });
CommunicationDeliveryLogSchema.index({ event_key: 1, createdAt: -1 });

const CommunicationDeliveryLogModel = mongoose.model(
  "communication_delivery_logs",
  CommunicationDeliveryLogSchema,
);

export default CommunicationDeliveryLogModel;
