import mongoose, { Schema } from "mongoose";

const ResumesSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  image: { type: String },
  is_generate: { type: Boolean, default: false },
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: "employees",
    required: true,
    index: true,
  },
  color_id: {
    type: Schema.Types.ObjectId,
    ref: "colors",
  },
  font_id: {
    type: Schema.Types.ObjectId,
    ref: "fonts",
  },
  file: { type: String }
}, { collection: "resumes", timestamps: true })

const ResumeModel = mongoose.model('resumes', ResumesSchema)

export default ResumeModel;