import mongoose from 'mongoose';
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  keyword: { type: [String], default: [] },
  popularity: { type: Number, default: 0 },
  published_at: { type: Date, default: Date.now }
}, { collection: 'items' });
export default mongoose.model('Item', itemSchema);
