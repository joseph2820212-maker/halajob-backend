import mongoose from "mongoose";

const UserRatingJob = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { collection: "user_rating_job", timestamps: true }
);

UserRatingJob.index({ user_id: 1, job_id: 1 }, { unique: true });
UserRatingJob.index({ job_id: 1, rating: 1 });

const UserRatingJobModel = mongoose.model("user_rating_job", UserRatingJob);
export default UserRatingJobModel;
