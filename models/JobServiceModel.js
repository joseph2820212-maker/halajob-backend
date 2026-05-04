import mongoose from "mongoose";

const JopServiceSchema = new mongoose.Schema({
 name:{type: String, required: true, unique: true},
 title_ar: { type: String, required: true },
 title_en: { type: String, required: true },
 keyword: { Service: [String] },
}, { collection: "job_service" })

const JopServiceModel = mongoose.model('JobServiceSchema', JopServiceSchema)

export default JopServiceModel;