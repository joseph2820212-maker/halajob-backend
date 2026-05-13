import mongoose from "mongoose";
const WorkTimeTypeSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true, trim: true, lowercase: true }, title_ar: { type: String, required: true, trim: true }, title_en: { type: String, required: true, trim: true }, keyword: { type: [String], default: [] }, max_day: { type: Number, default: null, min: 0 }, is_active: { type: Boolean, default: true }, sort_order: { type: Number, default: 0 } }, { collection: "work_time", timestamps: true });
WorkTimeTypeSchema.index({ name: 1 }, { unique: true });
WorkTimeTypeSchema.index({ is_active: 1, sort_order: 1 });
const WorkTimeTypeModel = mongoose.model("work_time", WorkTimeTypeSchema);
export default WorkTimeTypeModel;
