import mongoose from "mongoose";

constAppSettingsSchema = new mongoose.Schema({
 for:{type:String,required:true,unique:true,enum: ['app','dash','company','employee']},
 title:{type: String, required: true, unique: true},
 free_post:{type:Number},
}, { collection: "app_settings" })

const AppSettingsModel = mongoose.model('JopServiceSchema',AppSettingsSchema)

export default AppSettingsModel;