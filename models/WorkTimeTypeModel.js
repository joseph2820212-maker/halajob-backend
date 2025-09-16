import mongoose from "mongoose";

const WorkTimeTypeSchema = new mongoose.Schema({
    name_ar: { type: String, required: true, unique: true },
    name_en: { type: String, required: true },
    keyword: { type: [String] }
}, { collection: "work_time" })

const WorkTimeTypeModel = mongoose.model('WorkTimeTypeSchema', WorkTimeTypeSchema)

export default WorkTimeTypeModel;