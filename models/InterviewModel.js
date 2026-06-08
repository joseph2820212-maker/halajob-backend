import mongoose from "mongoose";
const { Schema } = mongoose;
const InterviewSchema = new Schema(
  {
    application_id: { type: Schema.Types.ObjectId, ref: "user_applying_job", required: true, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    employee_user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    scheduled_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    type: { type: String, enum: ["online", "in_office", "phone", "on_app"], default: "online", index: true },
    status: { type: String, enum: ["scheduled", "rescheduled", "completed", "cancelled", "no_show", "accepted", "rejected"], default: "scheduled", index: true },
    start_at: { type: Date, required: true, index: true },
    end_at: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
    meet_link: { type: String, default: "", trim: true },
    office_address: { type: String, default: "", trim: true },
    longitude: { type: Number, default: null },
    latitude: { type: Number, default: null },
    company_note: { type: String, default: "", trim: true },
    candidate_note: { type: String, default: "", trim: true },
    result_note: { type: String, default: "", trim: true },
    rating: { type: Number, default: null, min: 1, max: 5 },
    scorecard: {
      technical: { type: Number, default: null, min: 0, max: 100 },
      communication: { type: Number, default: null, min: 0, max: 100 },
      culture_fit: { type: Number, default: null, min: 0, max: 100 },
      overall: { type: Number, default: null, min: 0, max: 100 },
      recommendation: { type: String, enum: ["", "hire", "maybe", "reject"], default: "" },
      notes: { type: String, default: "", trim: true },
    },
    completed_at: { type: Date, default: null },
    cancelled_reason: { type: String, default: "", trim: true },
    reschedule_count: { type: Number, default: 0, min: 0 },
  },
  { collection: "interviews", timestamps: true }
);
InterviewSchema.index({ application_id: 1, start_at: -1 });
InterviewSchema.index({ company_id: 1, status: 1, start_at: 1 });
InterviewSchema.index({ employee_user_id: 1, status: 1, start_at: 1 });
const InterviewModel = mongoose.model("interviews", InterviewSchema);
export default InterviewModel;
