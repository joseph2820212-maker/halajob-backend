import mongoose from "mongoose";

const FontsSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  file:{type:String}
}, { collection: "fonts" })

const FontModel = mongoose.model('fonts', FontsSchema)

export default FontModel;