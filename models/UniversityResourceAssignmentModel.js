import mongoose from "mongoose";

const { Schema } = mongoose;

const UniversityResourceAssignmentSchema = new Schema(
  {
    university_id: { type: Schema.Types.ObjectId, ref: "universities", required: true, index: true },
    resource_id: { type: Schema.Types.ObjectId, ref: "learning_resources", required: true, index: true },
    assigned_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    audience: { type: [String], default: ["students"], index: true },
    required: { type: Boolean, default: false, index: true },
    due_at: { type: Date, default: null },
    note: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { collection: "university_resource_assignments", timestamps: true }
);

UniversityResourceAssignmentSchema.index({ university_id: 1, resource_id: 1 }, { unique: true });

const UniversityResourceAssignmentModel = mongoose.model(
  "university_resource_assignments",
  UniversityResourceAssignmentSchema
);

export default UniversityResourceAssignmentModel;
