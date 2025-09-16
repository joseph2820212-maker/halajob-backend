import mongoose from "mongoose";

const rolesSchema = new mongoose.Schema({
  log_to: {
    type: String, required: true,
    enum: ['employee',"company", 'dash'],
  },
  name: { type: String, required: true, unique: true },
  role_number: { type: Number, required: true, unique: true },
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  permissions: { type: [String] },
}, { collection: "roles" })

const RoleModel = mongoose.model('roles', rolesSchema)

export default RoleModel;