import mongoose from "mongoose";

const CurrencySchema = new mongoose.Schema({
  code: { type: String, uppercase: true, unique: true, index: true },
  name_en: { type: String, default: "" },
  name_ar: { type: String, default: "" },
  is_auto:{type:Boolean,default:false},
  symbol_ar: String,
  symbol_en: String,
  rate_base: { type: String, default: "USD" },
  rate: { type: Number, default: null },
  rate_updated_at: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
}, { collection: "currencies" });

const CurrencyModel = mongoose.model('currencies', CurrencySchema)

export default CurrencyModel;