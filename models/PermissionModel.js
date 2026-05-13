import mongoose from "mongoose";

const PermissionsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      // مثال: users.read
    },

    group: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      // مثال: users
    },

    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // مثال: read/create/update/delete/manage
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

    description_ar: {
      type: String,
      default: null,
    },

    description_en: {
      type: String,
      default: null,
    },

    status: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    collection: "permissions",
    timestamps: true,
  }
);

PermissionsSchema.index({ key: 1 }, { unique: true });
PermissionsSchema.index({ group: 1, action: 1 });

const PermissionModel = mongoose.model("permissions", PermissionsSchema);

export default PermissionModel;