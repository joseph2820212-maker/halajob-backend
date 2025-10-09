import mongoose from "mongoose";

const ResumesSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  image:{type:String},
  file:{type:String}
}, { collection: "resumes" })

const ResumeModel = mongoose.model('resumes', ResumesSchema)

export default ResumeModel;