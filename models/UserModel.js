import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model_name: { type: String, required: true, trim: true },
    model_id: { type: String, default: null },
    is_device: { type: Boolean, required: true },
    build_id: { type: String, default: null },
    is_default: { type: Boolean, default: false },
    last_seen_at: { type: Date },
  },
  { _id: false }
);

const PendingDeviceSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model_name: { type: String, required: true, trim: true },
    model_id: { type: String, default: null },
    is_device: { type: Boolean, required: true },
    build_id: { type: String, default: null },
    is_default: { type: Boolean, default: false },
    last_seen_at: { type: Date },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    mid_name: { type: String, trim: true, default: null },
    last_name: { type: String, required: true, trim: true },

    image: { type: String, default: null },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    lan: {
      type: String,
      default: "en",
      enum: ["ar", "en"],
    },

    default_context_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account_contexts",
      default: null,
      index: true,
    },

    last_login_at: {
      type: Date,
      default: null,
      index: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },

    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles",
      required: true,
      index: true,
    },

    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permissions",
        default: [],
      },
    ],
    password: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    passcode_active: {
      type: Boolean,
      default: false,
    },

    can_update_password: {
      type: Boolean,
      default: false,
    },

    phone: { type: String, default: null },

    phone_e164: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    phone_country: {
      type: String,
      required: true,
    },

    phone_code: {
      type: String,
      required: true,
    },

    phone_national: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    passcode: {
      type: String,
      default: null,
    },

    passcode_expires_at: {
      type: Date,
      default: null,
    },

    // Failed passcode-verify attempts for the current code (brute-force lockout).
    passcode_attempts: {
      type: Number,
      default: 0,
    },

    otp_last_sent_at: {
      type: Date,
      default: null,
    },

    another_device_code: {
      type: String,
      default: null,
    },

    another_device_expires_at: {
      type: Date,
      default: null,
    },

    pending_device: {
      type: PendingDeviceSchema,
      default: null,
    },

    device: {
      type: [DeviceSchema],
      default: [],
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone_e164: 1 }, { unique: true });
userSchema.index({ phone_national: 1 }, { unique: true });
userSchema.index({ role_id: 1 });
userSchema.index({ status: 1 });

const UserModel = mongoose.model("users", userSchema);

export default UserModel;
