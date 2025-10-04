import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  type:     { type: String, enum: ['tow_number_with_select','number_with_select'], required: true },
  required: { type: Boolean, default: false },
  is_hidden:{ type: Boolean, default: false }, 
  option:   { type: [{title_ar:String,title_en:String}], default: [] },   //
}, { _id: false });

const JopSalarySchema = new mongoose.Schema({
 name:{type: String, required: true, unique: true},
 title_ar: { type: String, required: true },
 title_en: { type: String, required: true },
 keyword: { type: [String] },
 option:   { type: [OptionSchema], default: [] },

}, { collection: "jop_salary" })

const JopSalaryModel = mongoose.model('jop_salary', JopSalarySchema)

export default JopSalaryModel;