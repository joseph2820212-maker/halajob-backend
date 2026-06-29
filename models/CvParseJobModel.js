import mongoose from "mongoose";

const { Schema } = mongoose;

const CvParseJobSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: "employees",
      required: true,
      index: true,
    },
    cv_id: {
      type: Schema.Types.ObjectId,
      ref: "employee_cvs",
      default: null,
      index: true,
    },
    file_path: {
      type: String,
      required: true,
      trim: true,
    },
    original_name: {
      type: String,
      default: "",
      trim: true,
    },
    mime_type: {
      type: String,
      default: "",
      trim: true,
    },
    provider: {
      type: String,
      enum: ["local", "external", "manual"],
      default: "local",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "parsed", "failed", "confirmed", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    raw_result: {
      type: Schema.Types.Mixed,
      default: {},
      select: false,
    },
    normalized_result: {
      type: Schema.Types.Mixed,
      default: {},
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    error_code: {
      type: String,
      default: "",
      trim: true,
    },
    error_message: {
      type: String,
      default: "",
      trim: true,
    },
    confirmed_at: {
      type: Date,
      default: null,
    },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { collection: "cv_parse_jobs", timestamps: true }
);

CvParseJobSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
CvParseJobSchema.index({ employee_id: 1, status: 1, createdAt: -1 });

const CvParseJobModel = mongoose.model("cv_parse_jobs", CvParseJobSchema);

export default CvParseJobModel;
