import mongoose from "mongoose";
const { Schema } = mongoose;

export const APPLICATION_STATUSES = [
  "waiting",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "accepted",
  "hired",
  "rejected",
  "withdrawn",
  "auto_cancel",
  "new",
  "reviewing",
  "initial_match",
  "not_match",
  "contacted",
  "interview_scheduled",
  "interview_completed",
  "archived",
  "offer_declined",
];

const ApplicationAnswerSchema = new Schema({ question_id: { type: Schema.Types.ObjectId, default: null }, question: { type: String, trim: true }, answer: Schema.Types.Mixed }, { _id: false });

const buildApplicationNo = (year, seq) => `APP-${year}-${String(seq).padStart(5, "0")}`;

const UserApplyingJobSchema = new Schema(
  {
    status: { type: String, default: "new", enum: APPLICATION_STATUSES, index: true },
    application_no: { type: String, trim: true, unique: true, sparse: true, index: true },
    status_changed_at: { type: Date, default: null },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", default: null, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone_code: { type: String, required: true, trim: true },
    phone_national: { type: String, required: true, trim: true },
    country_id: { type: Schema.Types.ObjectId, ref: "countries", required: true },
    answers: { type: [ApplicationAnswerSchema], default: [] },
    cv: { type: String, default: "" },
    cover_letter: { type: String, default: "" },
    user_job_rating: { type: Number, default: 0, min: 0, max: 5 },
    is_collect_rating: { type: Boolean, default: false },
    cv_download: { type: Boolean, default: false },
    is_filter: { type: Boolean, default: false },
    filter_on: { type: Boolean, default: false },
    filter_result: { score: { type: Number, default: null }, matched_skills: { type: [String], default: [] }, missing_skills: { type: [String], default: [] }, reason: { type: String, default: "" } },
    ats_score: { type: Number, default: null, min: 0, max: 100, index: true },
    ats_summary: { type: String, default: "", trim: true },
    matching_details: { type: Schema.Types.Mixed, default: {} },
    knockout_result: {
      has_failed: { type: Boolean, default: false, index: true },
      failed_questions: { type: [String], default: [] },
      action: { type: String, enum: ["none", "mark_not_match", "needs_manual_review", "reject"], default: "none" },
    },
    company_note: { type: String, default: "", trim: true },
    company_rating: { type: Number, default: null, min: 1, max: 5 },
    company_rating_note: { type: String, default: "", trim: true },
    visible_status: {
      type: String,
      enum: ["received", "reviewing", "interview_scheduled", "accepted", "not_selected"],
      default: "received",
      index: true,
    },
    rejection_reason: { type: String, default: "", trim: true },
    rejection_reason_code: {
      type: String,
      enum: ["", "requirements_not_met", "insufficient_experience", "education_not_suitable", "failed_knockout", "failed_interview", "salary_above_budget", "another_candidate_selected", "other"],
      default: "",
    },
    internal_rejection_note: { type: String, default: "", trim: true },
    candidate_rejection_message: { type: String, default: "", trim: true },
    rejection_message_visible_to_candidate: { type: Boolean, default: false },
    rejected_at: { type: Date, default: null },
    hired_at: { type: Date, default: null },
    archived_at: { type: Date, default: null },
    archive_reason: { type: String, default: "", trim: true },
    restored_at: { type: Date, default: null },
    withdrawn_at: { type: Date, default: null },
    stage_order: { type: Number, default: 0, index: true },
    communication_log: [{
      channel: { type: String, enum: ["email", "sms", "notification", "phone", "whatsapp", "internal"], default: "internal" },
      message: { type: String, default: "", trim: true },
      created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
      created_at: { type: Date, default: Date.now },
    }],
    source: { type: String, enum: ["app", "web", "external", "invitation"], default: "app" },
    last_activity_at: { type: Date, default: Date.now },
  },
  { collection: "user_applying_job", timestamps: true }
);
UserApplyingJobSchema.pre("validate", async function (next) {
  try {
    if (!this.application_no) {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({ application_no: new RegExp(`^APP-${year}-`) });
      this.application_no = buildApplicationNo(year, count + 1);
    }

    if (this.ats_score == null && this.filter_result?.score != null) {
      this.ats_score = this.filter_result.score;
    }

    if (!this.ats_summary && this.filter_result?.reason) {
      this.ats_summary = this.filter_result.reason;
    }

    const visibleStatusMap = {
      waiting: "received",
      new: "received",
      screening: "reviewing",
      reviewing: "reviewing",
      shortlisted: "reviewing",
      initial_match: "reviewing",
      not_match: "reviewing",
      contacted: "reviewing",
      interview: "interview_scheduled",
      interview_scheduled: "interview_scheduled",
      interview_completed: "reviewing",
      offer: "accepted",
      accepted: "accepted",
      hired: "accepted",
      rejected: "not_selected",
      auto_cancel: "not_selected",
      withdrawn: "not_selected",
      offer_declined: "not_selected",
      archived: "reviewing",
    };
    this.visible_status = visibleStatusMap[this.status] || this.visible_status || "received";
    if (this.status === "archived" && !this.archived_at) this.archived_at = new Date();
    if (this.status === "rejected" && !this.rejected_at) this.rejected_at = new Date();
    if (this.status === "hired" && !this.hired_at) this.hired_at = new Date();
    if (["withdrawn", "offer_declined"].includes(this.status) && !this.withdrawn_at) this.withdrawn_at = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

UserApplyingJobSchema.index({ user_id: 1, job_id: 1 }, { unique: true });
UserApplyingJobSchema.index({ job_id: 1, status: 1, createdAt: -1 });
UserApplyingJobSchema.index({ company_id: 1, status: 1, createdAt: -1 });
UserApplyingJobSchema.index({ company_id: 1, ats_score: -1, createdAt: -1 });
UserApplyingJobSchema.index({ company_id: 1, "knockout_result.has_failed": 1, createdAt: -1 });
UserApplyingJobSchema.index({ company_id: 1, visible_status: 1, createdAt: -1 });
UserApplyingJobSchema.index({ company_id: 1, archived_at: -1 });
const UserApplyingJobModel = mongoose.model("user_applying_job", UserApplyingJobSchema);
export default UserApplyingJobModel;
