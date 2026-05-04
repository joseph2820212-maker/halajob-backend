import mongoose from "mongoose";

const LanguageSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    title_ar: { type: String, required: true },
    title_en: { type: String, required: true },
}, { collection: "languages" })

const PermissionModel = mongoose.model('languagesSchema', LanguageSchema)

export default PermissionModel;