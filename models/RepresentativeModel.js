import mongoose from "mongoose";

const RepresentativeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    about: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    status: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

RepresentativeSchema.index({ user_id: 1 }, { unique: true });

const RepresentativeModel =
  mongoose.models.Representative ||
  mongoose.model("Representative", RepresentativeSchema);

export default RepresentativeModel;
