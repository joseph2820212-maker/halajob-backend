import mongoose from "mongoose";

const UserShowJob = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
  },
  { collection: "user_show_job", timestamps: true }
);

UserShowJob.index({ user_id: 1, job_id: 1 }, { unique: true });
UserShowJob.index({ user_id: 1, createdAt: -1 });
UserShowJob.index({ job_id: 1, createdAt: -1 });

const UserShowJobModel = mongoose.model("user_show_job", UserShowJob);
export default UserShowJobModel;
