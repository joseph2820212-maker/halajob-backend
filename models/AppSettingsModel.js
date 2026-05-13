import mongoose from "mongoose";

const AppSettingsSchema = new mongoose.Schema({
 for:{type:String,required:true,unique:true,enum: ['app','dash','company','employee']},
 title:{type: String, required: true, unique: true},
 free_post:{type:Number},
}, { collection: "app_settings" })

const AppSettingsModel = mongoose.model('app_settings',AppSettingsSchema)

export default AppSettingsModel;