import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: mongoose.Schema.Types.Mixed, required: true },

    // Backward-compatible fields used by the current apps.
    screen: { type: String, default: "" },
    order_id: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },

    // New routing fields for dashboards and web/mobile clients.
    type: { type: String, default: "notification", index: true },
    audience: { type: String, enum: ["employee", "company", "admin", "app", "unknown"], default: "unknown", index: true },
    route_key: { type: String, default: "" },
    route_path: { type: String, default: "" },
    target_url: { type: String, default: "" },
    url: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Optional idempotency key. Must be optional; otherwise one user can only receive
    // one notification because MongoDB unique indexes treat missing values as null.
    dedupeKey: { type: String, default: undefined, index: true },
  },
  {
    collection: "notification",
    strict: false,
    timestamps: true,
  }
);

NotificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, type: 1, createdAt: -1 });
NotificationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 365 * 24 * 60 * 60,
    name: "read_notifications_created_at_ttl",
    partialFilterExpression: { read: true },
  }
);
NotificationSchema.index(
  { user_id: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dedupeKey: { $exists: true, $type: "string" },
    },
  }
);

const NotificationModel = mongoose.model("Notification", NotificationSchema);

export default NotificationModel;
