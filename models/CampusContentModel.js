import mongoose from "mongoose";

const { Schema } = mongoose;

const CampusContentSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    version: {
      type: String,
      trim: true,
      default: "campus-content-v2",
    },
    source: {
      type: String,
      trim: true,
      default: "manual",
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    seeded_at: { type: Date, default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "campus_content", timestamps: true, minimize: false },
);

CampusContentSchema.index({ key: 1, status: 1 });

const CampusContentModel = mongoose.model(
  "campus_content",
  CampusContentSchema,
);

export default CampusContentModel;
