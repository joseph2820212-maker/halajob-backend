import mongoose from "mongoose";

const ChannelPreferenceSchema = new mongoose.Schema(
  {
    in_app: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
  },
  { _id: false }
);

const CategoryPreferenceSchema = new mongoose.Schema(
  {
    jobs: { type: Boolean, default: true },
    applications: { type: Boolean, default: true },
    interviews: { type: Boolean, default: true },
    campus: { type: Boolean, default: true },
    company: { type: Boolean, default: true },
    ai: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuietHoursSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: "22:00", trim: true },
    end: { type: String, default: "07:00", trim: true },
    timezone: { type: String, default: "UTC", trim: true },
  },
  { _id: false }
);

const NotificationPreferenceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true, index: true },
    channels: { type: ChannelPreferenceSchema, default: () => ({}) },
    categories: { type: CategoryPreferenceSchema, default: () => ({}) },
    quiet_hours: { type: QuietHoursSchema, default: () => ({}) },
    lang: { type: String, enum: ["ar", "en"], default: "en" },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
  },
  {
    collection: "notification_preferences",
    timestamps: true,
  }
);

const NotificationPreferenceModel = mongoose.model("NotificationPreference", NotificationPreferenceSchema);

export default NotificationPreferenceModel;
