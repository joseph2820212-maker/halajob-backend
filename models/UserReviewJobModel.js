
import mongoose from "mongoose";

const UserReviewJob = new mongoose.Schema({
 user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
 job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", index: true, required: true },
 message:{type:String,required:true}
}, { collection: "user_review_job" })

const UserReviewJobModel = mongoose.model('user_review_job', UserReviewJob)

export default UserReviewJobModel;