import mongoose from "mongoose";
const JobServiceSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true, trim: true, lowercase: true }, title_ar: { type: String, required: true, trim: true }, title_en: { type: String, required: true, trim: true }, keyword: { type: [String], default: [] }, is_active: { type: Boolean, default: true }, sort_order: { type: Number, default: 0 } }, { collection: "job_service", timestamps: true });
JobServiceSchema.index({ name: 1 }, { unique: true });
JobServiceSchema.index({ is_active: 1, sort_order: 1 });
const JobServiceModel = mongoose.model("job_service", JobServiceSchema);
export default JobServiceModel;
