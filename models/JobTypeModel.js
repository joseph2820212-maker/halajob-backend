import mongoose from "mongoose";
const OptionSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  type:     { type: String, enum: ['number','time','tow_time','number_with_select'], required: true },
  required: { type: Boolean, default: false },
  is_hidden:{ type: Boolean, default: false }, 
  option:   { type: [{title_ar:String,title_en:String}], default: [] },   //
}, { _id: false });

const JopTypeSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true },
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  keyword:  { type: [String], default: [] },
  option:   { type: [OptionSchema], default: [] },
}, { collection: 'job_type', timestamps: true });

const JopTypeModel = mongoose.model('job_type', JopTypeSchema)

export default JopTypeModel;