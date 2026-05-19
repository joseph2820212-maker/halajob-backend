import mongoose from "mongoose";

const UserOutSideApplyingJob = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
  },
  { collection: "user_out_side_applying_job", timestamps: true }
);

UserOutSideApplyingJob.index({ user_id: 1, job_id: 1 }, { unique: true });
UserOutSideApplyingJob.index({ job_id: 1, createdAt: -1 });

const UserOutSideApplyingJobModel = mongoose.model("user_out_side_applying_job", UserOutSideApplyingJob);
export default UserOutSideApplyingJobModel;
