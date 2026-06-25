import mongoose from "mongoose";

const { Schema } = mongoose;

const UniversityPartnerSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "pending",
      index: true,
    },
    note: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: true }
);

const UniversityCampusSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { _id: true, timestamps: true }
);

const UniversitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    name_en: { type: String, trim: true, default: "" },
    logo: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    email_domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    career_center_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    verified: { type: Boolean, default: false, index: true },
    students_count: { type: Number, default: 0, min: 0 },
    campuses: { type: [UniversityCampusSchema], default: [] },
    partners: { type: [UniversityPartnerSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "pending",
      index: true,
    },
  },
  { collection: "universities", timestamps: true }
);

UniversitySchema.index({ name: "text", name_en: "text", city: "text", country: "text" });

const UniversityModel = mongoose.model("universities", UniversitySchema);

export default UniversityModel;
