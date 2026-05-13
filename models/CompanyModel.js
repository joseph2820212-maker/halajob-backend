import mongoose from "mongoose";
const { Schema } = mongoose;

const SocialLinkSchema = new Schema({ type: { type: String, trim: true }, url: { type: String, trim: true } }, { _id: false });

const CompanySchema = new Schema(
  {
    image: { type: String, default: null },
    cover_image: { type: String, default: null },
    files: { type: [String], default: [] },
    company_name: { type: String, required: true, trim: true, unique: true },
    company_email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    owner_user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, unique: true, index: true },
    role_id: { type: Schema.Types.ObjectId, ref: "roles", required: true },
    permissions: { type: [String], default: [] },
    created_year: { type: Number, min: 1800, default: null },
    description: { type: String, default: "", trim: true },
    industry_id: { type: Schema.Types.ObjectId, ref: "industries", default: null },
    industry_name: { type: String, default: "", trim: true },
    company_size: { type: Number, default: null, min: 1 },
    company_size_type: { type: String, enum: ["startup", "small", "medium", "large", "enterprise", "unknown"], default: "unknown" },
    company_type: { type: String, default: "", trim: true },
    company_country: { type: String, default: "", trim: true },
    company_city: { type: String, default: "", trim: true },
    company_address: { type: String, default: "", trim: true },
    location: { latitude: { type: Number, default: null }, longitude: { type: Number, default: null } },
    company_contact: { type: [String], default: [] },
    company_phone: { type: String, default: "", trim: true },
    company_phone_code: { type: String, default: "", trim: true },
    company_website: { type: String, default: "", trim: true },
    social_links: { type: [SocialLinkSchema], default: [] },
    status: { type: Boolean, default: false, index: true },
    accepted: { type: Boolean, default: false, index: true },
    is_verified: { type: Boolean, default: false, index: true },
    verified_at: { type: Date, default: null },
    verified_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    can_upload: { type: Boolean, default: true },
    free_post_balance: { type: Number, default: 0, min: 0 },
    rating_avg: { type: Number, default: 0, min: 0, max: 5 },
    rating_count: { type: Number, default: 0, min: 0 },
  },
  { collection: "companies", timestamps: true }
);
CompanySchema.index({ company_name: "text", description: "text", industry_name: "text" });
CompanySchema.index({ owner_user_id: 1 }, { unique: true });
CompanySchema.index({ accepted: 1, status: 1, is_verified: 1 });
const CompanyModel = mongoose.model("companies", CompanySchema);
export default CompanyModel;
