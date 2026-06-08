import mongoose from "mongoose";

const ScheduledJobLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true, trim: true },
    owner: { type: String, default: "", trim: true },
    locked_until: { type: Date, default: null, index: true },
    last_started_at: { type: Date, default: null },
    last_finished_at: { type: Date, default: null },
    last_success_at: { type: Date, default: null },
    last_error: { type: String, default: "" },
    run_count: { type: Number, default: 0, min: 0 },
    fail_count: { type: Number, default: 0, min: 0 },
    last_stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    collection: "scheduled_job_locks",
    timestamps: true,
  }
);

ScheduledJobLockSchema.index({ key: 1, locked_until: 1 });

const ScheduledJobLockModel = mongoose.model("scheduled_job_locks", ScheduledJobLockSchema);
export default ScheduledJobLockModel;
