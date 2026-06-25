import mongoose from "mongoose";

const { Schema } = mongoose;

const StudentVerificationSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", default: null, index: true },
    university_id: { type: Schema.Types.ObjectId, ref: "universities", required: true, index: true },
    method: {
      type: String,
      enum: ["email", "document", "invite_code", "manual"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired", "needs_more_information"],
      default: "pending",
      index: true,
    },
    student_email: { type: String, trim: true, lowercase: true, default: "", index: true },
    student_id_number: { type: String, trim: true, default: "" },
    campus: { type: String, trim: true, default: "" },
    faculty_major: { type: String, trim: true, default: "" },
    degree_level: { type: String, trim: true, default: "" },
    graduation_year: { type: Number, default: null, index: true },
    invite_code: { type: String, trim: true, default: "" },
    document_url: { type: String, trim: true, default: "" },
    submitted_payload: { type: Schema.Types.Mixed, default: {} },
    email_code_hash: { type: String, trim: true, default: "" },
    email_code_expires_at: { type: Date, default: null },
    email_confirmed_at: { type: Date, default: null },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    reviewed_at: { type: Date, default: null },
    rejection_reason: { type: String, trim: true, default: "" },
    requested_information: { type: String, trim: true, default: "" },
  },
  { collection: "student_verifications", timestamps: true }
);

StudentVerificationSchema.index({ user_id: 1, university_id: 1, status: 1 });
StudentVerificationSchema.index({ university_id: 1, status: 1, createdAt: -1 });
StudentVerificationSchema.index({ student_email: 1, university_id: 1 });

const StudentVerificationModel = mongoose.model("student_verifications", StudentVerificationSchema);

export default StudentVerificationModel;
