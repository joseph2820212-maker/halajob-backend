import mongoose from "mongoose";

const { Schema } = mongoose;

const UserResourceProgressSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    resource_id: { type: Schema.Types.ObjectId, ref: "learning_resources", required: true, index: true },
    saved: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started", index: true },
    progress_percent: { type: Number, min: 0, max: 100, default: 0 },
    completed_at: { type: Date, default: null },
    last_opened_at: { type: Date, default: null },
  },
  { collection: "user_resource_progress", timestamps: true }
);

UserResourceProgressSchema.index({ user_id: 1, resource_id: 1 }, { unique: true });

const UserResourceProgressModel = mongoose.model("user_resource_progress", UserResourceProgressSchema);

export default UserResourceProgressModel;
