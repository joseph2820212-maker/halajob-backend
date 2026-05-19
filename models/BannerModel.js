import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  image:{type:String, required:true},
  linkTo:{type:String}
}, { collection: "banner" })

const BannerModel = mongoose.model('banner', BannerSchema)

export default BannerModel;