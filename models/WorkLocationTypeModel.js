import mongoose from "mongoose";

const WorkLocationTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    title_ar: { type: String, required: true, unique: true },
    title_en: { type: String, required: true },
    keyword: { type: [String] }
}, { collection: "work_location" })

const WorkLocationTypeModel = mongoose.model('WorkLocationTypeSchema', WorkLocationTypeSchema)

export default WorkLocationTypeModel;