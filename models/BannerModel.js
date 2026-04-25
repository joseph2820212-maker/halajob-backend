import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  code:{type:String}
}, { collection: "banner" })

const BannerModel = mongoose.model('banner', BannerSchema)

export default BannerModel;