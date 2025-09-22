import mongoose from "mongoose";

const WorkTimeTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    title_ar: { type: String, required: true, unique: true },
    title_en: { type: String, required: true },
    keyword: { type: [String] },
    max_date:{type:Date}
}, { collection: "work_time" })

const WorkTimeTypeModel = mongoose.model('WorkTimeTypeSchema', WorkTimeTypeSchema)

export default WorkTimeTypeModel;