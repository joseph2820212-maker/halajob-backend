import mongoose from "mongoose";

const { Schema } = mongoose;

const CompanyCandidateNoteSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    saved_candidate_id: {
      type: Schema.Types.ObjectId,
      ref: "company_saved_candidates",
      required: true,
      index: true,
    },
    author_user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    note: { type: String, required: true, trim: true, maxlength: 4000 },
    visibility: { type: String, enum: ["team", "owner_only"], default: "team" },
  },
  { collection: "company_candidate_notes", timestamps: true },
);

CompanyCandidateNoteSchema.index({ company_id: 1, saved_candidate_id: 1, createdAt: -1 });

const CompanyCandidateNoteModel = mongoose.model("company_candidate_notes", CompanyCandidateNoteSchema);

export default CompanyCandidateNoteModel;
