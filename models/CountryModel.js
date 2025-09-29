import mongoose from "mongoose";

const CountrySchema = new mongoose.Schema({
  country_alpha2_code: { type: String, required: true },
  country_numeric_code: { type: Number },      // كان String
  region_code:        { type: String },        // كان regin_code
  country_name_ar:    { type: String },
  country_name_en:    { type: String },
  region_name_ar:     { type: String },
  region_name_en:     { type: String },
}, { collection: "countries", timestamps: false });

CountrySchema.index({ country_alpha2_code: 1, region_code: 1 }, { unique: true });

const CountryModel = mongoose.model("Country", CountrySchema); // اسم موديل واضح
export default CountryModel;
