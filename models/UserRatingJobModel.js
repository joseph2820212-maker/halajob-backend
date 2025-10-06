
import mongoose from "mongoose";

const UserRatingJob = new mongoose.Schema({
 user_id: { type: mongoose.Schema.Types.ObjectId, ref: "UserSchema", required: true },
 job_id: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", index: true, required: true },
 rating: { type:Number,min:1,max:5 },

}, { collection: "user_rating_job" })

const UserRatingJobModel = mongoose.model('user_rating_job', UserRatingJob)

export default UserRatingJobModel;