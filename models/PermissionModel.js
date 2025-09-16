import mongoose from "mongoose";

const PermissionsSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    title_ar: { type: String, required: true },
    title_en: { type: String, required: true },
}, { collection: "permissions" })

const PermissionModel = mongoose.model('permissionsSchema', PermissionsSchema)

export default PermissionModel;