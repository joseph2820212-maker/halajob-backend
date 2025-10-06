
import mongoose from "mongoose";

const UserSavedJob = new mongoose.Schema({
 user_id: { type: mongoose.Schema.Types.ObjectId, ref: "UserSchema", required: true },
 job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", index: true, required: true },

}, { collection: "user_saved_job" })

const UserSavedJobModel = mongoose.model('user_saved_job', UserSavedJob)

export default UserSavedJobModel;