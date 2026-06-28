import mongoose from "mongoose";

const { Schema } = mongoose;

const AccessibilityRequestSchema = new Schema(
  {
    requestNo: { type: String, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    email: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    area: { type: String, default: "general" }, // web | mobile | email | general
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["received", "in_progress", "resolved", "closed"], default: "received", index: true },
    handledBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { collection: "accessibility_requests", timestamps: true }
);

const AccessibilityRequestModel = mongoose.model("accessibility_requests", AccessibilityRequestSchema);
export default AccessibilityRequestModel;
