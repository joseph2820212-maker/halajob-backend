import mongoose from "mongoose";

const CurrencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
    name_en: { type: String, required: true, trim: true },
    name_ar: { type: String, required: true, trim: true },
    symbol_en: { type: String, default: "", trim: true },
    symbol_ar: { type: String, default: "", trim: true },
    // System base conversion: 1 rate_base = rate code. Example: 1 USD = 13000 SYP.
    rate_base: { type: String, default: "USD", uppercase: true, trim: true },
    rate: { type: Number, required: true, min: 0, default: 1 },
    is_base: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_auto_update: { type: Boolean, default: false },
    rate_updated_at: { type: Date, default: null },
  },
  { collection: "currencies", timestamps: true }
);

CurrencySchema.index({ code: 1 }, { unique: true });
CurrencySchema.index({ is_active: 1 });
CurrencySchema.index({ is_base: 1 });

const CurrencyModel = mongoose.model("currencies", CurrencySchema);
export default CurrencyModel;
