import mongoose from "mongoose";
const { Schema } = mongoose;
const JobInvitationSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    sent_by: { type: Schema.Types.ObjectId, ref: "users", required: true },
    status: { type: String, enum: ["sent", "seen", "accepted", "declined", "expired", "cancelled"], default: "sent", index: true },
    message: { type: String, default: "", trim: true },
    salary_offer: { type: String, default: "", trim: true },
    starts_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
    responded_at: { type: Date, default: null },
  },
  { collection: "job_invitations", timestamps: true }
);
JobInvitationSchema.index({ job_id: 1, employee_id: 1 }, { unique: true });
JobInvitationSchema.index({ company_id: 1, status: 1, createdAt: -1 });
JobInvitationSchema.index(
  { expires_at: 1 },
  {
    expireAfterSeconds: 730 * 24 * 60 * 60,
    name: "closed_invitations_expires_at_ttl",
  }
);
const JobInvitationModel = mongoose.model("job_invitations", JobInvitationSchema);
export default JobInvitationModel;
