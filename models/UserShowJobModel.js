
import mongoose from "mongoose";

const UserShowJob = new mongoose.Schema({
 user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
 job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", index: true, required: true },

}, { collection: "user_show_job" })

const UserShowJobModel = mongoose.model('user_show_job', UserShowJob)

export default UserShowJobModel;