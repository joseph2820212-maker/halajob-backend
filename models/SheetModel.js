// models/Sheet.js
import mongoose from "mongoose";

const sheetSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  totalRows: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("sheet", sheetSchema);
