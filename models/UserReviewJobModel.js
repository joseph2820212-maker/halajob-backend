import mongoose from "mongoose";

const UserReviewJob = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    message: { type: String, required: true, trim: true },
  },
  { collection: "user_review_job", timestamps: true }
);

UserReviewJob.index({ user_id: 1, job_id: 1 }, { unique: true });
UserReviewJob.index({ job_id: 1, createdAt: -1 });

const UserReviewJobModel = mongoose.model("user_review_job", UserReviewJob);
export default UserReviewJobModel;
