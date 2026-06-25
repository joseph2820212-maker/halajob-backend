import mongoose from "mongoose";

const { Schema } = mongoose;

const AccountContextSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    context_key: { type: String, required: true, trim: true },
    context_type: {
      type: String,
      enum: ["job_seeker", "student", "company_member", "company_admin", "university_admin", "super_admin"],
      required: true,
      index: true,
    },
    entity_id: { type: Schema.Types.ObjectId, default: null, index: true },
    entity_model: {
      type: String,
      enum: ["users", "employees", "companies", "universities", "platform", ""],
      default: "",
    },
    display_name: { type: String, trim: true, default: "" },
    avatar_url: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "pending", "suspended", "removed"],
      default: "active",
      index: true,
    },
    permissions: { type: [String], default: [] },
    is_default: { type: Boolean, default: false, index: true },
    last_used_at: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "account_contexts", timestamps: true }
);

AccountContextSchema.index({ user_id: 1, context_key: 1 }, { unique: true });
AccountContextSchema.index({ user_id: 1, status: 1, is_default: 1 });
AccountContextSchema.index({ user_id: 1, context_type: 1, status: 1 });

const AccountContextModel = mongoose.model("account_contexts", AccountContextSchema);

export default AccountContextModel;
