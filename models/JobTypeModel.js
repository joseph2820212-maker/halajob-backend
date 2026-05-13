import mongoose from "mongoose";
const JobTypeSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true, trim: true, lowercase: true }, title_ar: { type: String, required: true, trim: true }, title_en: { type: String, required: true, trim: true }, keyword: { type: [String], default: [] }, is_active: { type: Boolean, default: true }, sort_order: { type: Number, default: 0 } }, { collection: "job_type", timestamps: true });
JobTypeSchema.index({ name: 1 }, { unique: true });
JobTypeSchema.index({ is_active: 1, sort_order: 1 });
const JobTypeModel = mongoose.model("job_type", JobTypeSchema);
export default JobTypeModel;
