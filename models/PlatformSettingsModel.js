import mongoose from "mongoose";

const { Schema } = mongoose;

const PlatformSettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: "default",
    },
    general: { type: Schema.Types.Mixed, default: {} },
    maintenance: { type: Schema.Types.Mixed, default: {} },
    security: { type: Schema.Types.Mixed, default: {} },
    uploads: { type: Schema.Types.Mixed, default: {} },
    features: { type: Schema.Types.Mixed, default: {} },
    jobs: { type: Schema.Types.Mixed, default: {} },
    campus: { type: Schema.Types.Mixed, default: {} },
    billing: { type: Schema.Types.Mixed, default: {} },
    notifications: { type: Schema.Types.Mixed, default: {} },
    ai: { type: Schema.Types.Mixed, default: {} },
    privacy: { type: Schema.Types.Mixed, default: {} },
    integrations: { type: Schema.Types.Mixed, default: {} },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "platform_settings", timestamps: true },
);

const PlatformSettingsModel = mongoose.model(
  "platform_settings",
  PlatformSettingsSchema,
);

export default PlatformSettingsModel;
