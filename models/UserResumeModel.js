import mongoose from "mongoose";

const UserResumesSchema = new mongoose.Schema({
 user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
 font_id: { type: mongoose.Schema.Types.ObjectId, ref: "fonts", required: true },
 color_id: { type: mongoose.Schema.Types.ObjectId, ref: "colors", required: true },
 resume_id: { type: mongoose.Schema.Types.ObjectId, ref: "resumes", required: true },
 is_active: { type: Boolean, default: true }
}, { collection: "user_resumes" })

const UserResumeModel = mongoose.model('user_resumes', UserResumesSchema)

export default UserResumeModel;