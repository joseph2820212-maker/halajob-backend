import mongoose from "mongoose";

const { Schema } = mongoose;

const CompanySettingsSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "companies",
      required: true,
      unique: true,
      index: true,
    },
    security: { type: Schema.Types.Mixed, default: {} },
    privacy: { type: Schema.Types.Mixed, default: {} },
    preferences: { type: Schema.Types.Mixed, default: {} },
    billing: { type: Schema.Types.Mixed, default: {} },
    ats: { type: Schema.Types.Mixed, default: {} },
    campus: { type: Schema.Types.Mixed, default: {} },
    support: { type: Schema.Types.Mixed, default: {} },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "company_settings", timestamps: true },
);

const CompanySettingsModel = mongoose.model(
  "company_settings",
  CompanySettingsSchema,
);

export default CompanySettingsModel;
