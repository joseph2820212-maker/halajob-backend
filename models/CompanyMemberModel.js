import mongoose from "mongoose";
const { Schema } = mongoose;
const CompanyMemberSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    role_id: { type: Schema.Types.ObjectId, ref: "roles", default: null },
    member_role: { type: String, enum: ["owner", "admin", "hr_manager", "recruiter", "viewer"], default: "recruiter", index: true },
    permissions: { type: [String], default: [] },
    status: { type: String, enum: ["active", "invited", "suspended", "removed"], default: "active", index: true },
    invited_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    invited_at: { type: Date, default: null },
    joined_at: { type: Date, default: Date.now },
  },
  { collection: "company_members", timestamps: true }
);
CompanyMemberSchema.index({ company_id: 1, user_id: 1 }, { unique: true });
CompanyMemberSchema.index({ company_id: 1, status: 1, member_role: 1 });
const CompanyMemberModel = mongoose.model("company_members", CompanyMemberSchema);
export default CompanyMemberModel;
