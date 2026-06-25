import mongoose from "mongoose";

const { Schema } = mongoose;

const UniversityMembershipSchema = new Schema(
  {
    university_id: { type: Schema.Types.ObjectId, ref: "universities", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    role: {
      type: String,
      enum: ["owner", "admin", "career_center", "advisor", "viewer"],
      default: "career_center",
      index: true,
    },
    permissions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "invited", "suspended", "removed"],
      default: "active",
      index: true,
    },
    invited_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    accepted_at: { type: Date, default: null },
  },
  { collection: "university_memberships", timestamps: true }
);

UniversityMembershipSchema.index({ university_id: 1, user_id: 1 }, { unique: true });
UniversityMembershipSchema.index({ university_id: 1, status: 1, role: 1 });

const UniversityMembershipModel = mongoose.model("university_memberships", UniversityMembershipSchema);

export default UniversityMembershipModel;
