import mongoose from "mongoose";

const KeywordsSchema = new mongoose.Schema(
  {
    inputs: [
      {
        name: { type: String, required: true, unique: true },
        title_ar: { type: String, required: true },
        title_en: { type: String, required: true },
      },
    ],
  },
  { collection: "Keywords" }
);

const KeywordModel = mongoose.model("keyword", KeywordsSchema);

export default KeywordModel;