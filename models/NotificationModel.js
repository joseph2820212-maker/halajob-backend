import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  body: { type: mongoose.Schema.Types.Mixed, required: true },
  title: { type: String, required: true },
  screen: { type: String },
  order_id: { type: String },
  imageUrl: { type: String },
  read: { type: Boolean, default: false },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

  // e.g., title+type+screen (choose what makes sense)
  dedupeKey: { type: String, index: true },
}, { collection: "notification", strict: false, timestamps: true });

// Enforce uniqueness on (user_id, dedupeKey)
NotificationSchema.index({ user_id: 1, dedupeKey: 1 }, { unique: true });
const NotificationModel = mongoose.model('NotificationSchema', NotificationSchema)

export default NotificationModel;