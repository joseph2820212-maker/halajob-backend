import mongoose from "mongoose";

const UserSavedJobSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id:  { type: mongoose.Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
  },
  { collection: "user_saved_job", timestamps: true }
);

// فهارس
UserSavedJobSchema.index({ user_id: 1, createdAt: -1 });
UserSavedJobSchema.index({ user_id: 1, job_id: 1 }, { unique: true }); // يمنع التكرار

const UserSavedJobModel = mongoose.model("user_saved_job", UserSavedJobSchema);
export default UserSavedJobModel;
