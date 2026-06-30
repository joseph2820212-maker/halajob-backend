import mongoose from "mongoose";

const { Schema } = mongoose;

const CampusEventSchema = new Schema(
  {
    university_id: {
      type: Schema.Types.ObjectId,
      ref: "universities",
      default: null,
      index: true,
    },
    event_id: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    organizer: { type: String, trim: true, default: "" },
    kind: { type: String, trim: true, default: "" },
    mode: { type: String, trim: true, default: "" },
    date_label: { type: String, trim: true, default: "" },
    start_at: { type: Date, default: null, index: true },
    end_at: { type: Date, default: null },
    location: { type: String, trim: true, default: "" },
    campus_name: { type: String, trim: true, default: "" },
    registration_url: { type: String, trim: true, default: "" },
    capacity: { type: Number, min: 0, default: null },
    registered_count: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [], index: true },
    bullets: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "cancelled"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "campus"],
      default: "campus",
      index: true,
    },
    sort_order: { type: Number, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "campus_events", timestamps: true },
);

CampusEventSchema.index({ university_id: 1, status: 1, start_at: 1 });
CampusEventSchema.index({
  status: 1,
  visibility: 1,
  featured: -1,
  sort_order: 1,
  start_at: 1,
});

const CampusEventModel = mongoose.model("campus_events", CampusEventSchema);

export default CampusEventModel;
