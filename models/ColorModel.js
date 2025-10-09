import mongoose from "mongoose";

const ColorsSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  code:{type:String}
}, { collection: "colors" })

const ColorModel = mongoose.model('colors', ColorsSchema)

export default ColorModel;