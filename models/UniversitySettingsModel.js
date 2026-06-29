import mongoose from "mongoose";

const { Schema } = mongoose;

const UniversitySettingsSchema = new Schema(
  {
    university_id: {
      type: Schema.Types.ObjectId,
      ref: "universities",
      required: true,
      unique: true,
      index: true,
    },
    security: { type: Schema.Types.Mixed, default: {} },
    privacy: { type: Schema.Types.Mixed, default: {} },
    preferences: { type: Schema.Types.Mixed, default: {} },
    campus: { type: Schema.Types.Mixed, default: {} },
    verification: { type: Schema.Types.Mixed, default: {} },
    members: { type: Schema.Types.Mixed, default: {} },
    support: { type: Schema.Types.Mixed, default: {} },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "university_settings", timestamps: true },
);

const UniversitySettingsModel = mongoose.model(
  "university_settings",
  UniversitySettingsSchema,
);

export default UniversitySettingsModel;
