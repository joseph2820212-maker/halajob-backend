import mongoose from "mongoose";

const WorkTimeTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    title_ar: { type: String, required: true, unique: true },
    title_en: { type: String, required: true },
    keyword: { type: [String] },
    max_day:{type:Number}
}, { collection: "work_time" })

const WorkTimeTypeModel = mongoose.model('work_time', WorkTimeTypeSchema)

export default WorkTimeTypeModel;