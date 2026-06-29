import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSettingsSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },
    security: { type: Schema.Types.Mixed, default: {} },
    privacy: { type: Schema.Types.Mixed, default: {} },
    preferences: { type: Schema.Types.Mixed, default: {} },
    support: { type: Schema.Types.Mixed, default: {} },
    job_alerts: { type: Schema.Types.Mixed, default: {} },
    consent: { type: Schema.Types.Mixed, default: {} },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "user_settings", timestamps: true },
);

const UserSettingsModel = mongoose.model("user_settings", UserSettingsSchema);

export default UserSettingsModel;
