import mongoose from "mongoose";
const { Schema } = mongoose;
const SearchHistorySchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    type: { type: String, enum: ["job", "company", "employee"], default: "job", index: true },
    query: { type: String, default: "", trim: true },
    query_norm: { type: String, default: "", trim: true, index: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    result_count: { type: Number, default: 0, min: 0 },
    ip: { type: String, default: "" },
    user_agent: { type: String, default: "" },
  },
  { collection: "search_history", timestamps: true }
);
SearchHistorySchema.index({ user_id: 1, type: 1, createdAt: -1 });
SearchHistorySchema.index({ query_norm: 1, createdAt: -1 });
SearchHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60, name: "search_history_created_at_ttl" }
);
const SearchHistoryModel = mongoose.model("search_history", SearchHistorySchema);
export default SearchHistoryModel;
