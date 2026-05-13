
import mongoose from "mongoose";

const UserOutSideApplyingJob = new mongoose.Schema({
 user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
 job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", index: true, required: true },

}, { collection: "user_out_side_applying_job" ,timestamps:true})

const UserOutSideApplyingJobModel = mongoose.model('user_out_side_applying_job', UserOutSideApplyingJob)

export default UserOutSideApplyingJobModel;