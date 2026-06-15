import mongoose from "mongoose";

const CampusEventRegistrationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      default: null,
      index: true,
    },
    event_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      type: String,
      trim: true,
      default: "",
    },
    kind: {
      type: String,
      trim: true,
      default: "",
    },
    date_label: {
      type: String,
      trim: true,
      default: "",
    },
    mode: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["registered", "cancelled", "attended"],
      default: "registered",
      index: true,
    },
  },
  {
    collection: "campus_event_registrations",
    timestamps: true,
  }
);

CampusEventRegistrationSchema.index({ user_id: 1, event_id: 1 }, { unique: true });
CampusEventRegistrationSchema.index({ event_id: 1, status: 1 });

export default mongoose.model("campus_event_registrations", CampusEventRegistrationSchema);
