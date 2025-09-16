import mongoose from "mongoose";

const WorkLocationTypeSchema = new mongoose.Schema({
    name_ar: { type: String, required: true, unique: true },
    name_en: { type: String, required: true },
    keyword: { type: [String] }
}, { collection: "work_location" })

const WorkLocationTypeModel = mongoose.model('WorkLocationTypeSchema', WorkLocationTypeSchema)

export default WorkLocationTypeModel;