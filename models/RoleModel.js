import mongoose from "mongoose";

const rolesSchema = new mongoose.Schema(
  {
    log_to: {
      type: String,
      required: true,
      enum: ["employee", "company", "dash"],
      index: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      // مثال: admin, doctor, secretary
    },

    role_number: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    title_ar: {
      type: String,
      required: true,
      trim: true,
    },

    title_en: {
      type: String,
      required: true,
      trim: true,
    },

    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permissions",
        default: [],
      },
    ],

    status: {
      type: Boolean,
      default: true,
      index: true,
    },

    is_system: {
      type: Boolean,
      default: false,
      // للأدوار الأساسية مثل admin حتى لا تنحذف بالغلط
    },
  },
  {
    collection: "roles",
    timestamps: true,
  }
);

rolesSchema.index({ name: 1 }, { unique: true });
rolesSchema.index({ log_to: 1 });

const RoleModel = mongoose.model("roles", rolesSchema);

export default RoleModel;