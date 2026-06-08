import mongoose from "mongoose";

const { Schema } = mongoose;

const SocialLinkSchema = new Schema(
  {
    type: {
      type: String,
      trim: true,
      lowercase: true,
      enum: [
        "linkedin",
        "facebook",
        "instagram",
        "x",
        "website",
        "youtube",
        "tiktok",
        "github",
        "other",
      ],
      default: "other",
    },

    url: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const CompanyGallerySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    url: {
      type: String,
      trim: true,
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true, timestamps: true }
);

const VerificationDocumentSchema = new Schema(
  {
    type: {
      type: String,
      trim: true,
      default: "",
    },

    file: {
      type: String,
      trim: true,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true, timestamps: true }
);

const CompanyLocationSchema = new Schema(
  {
    country_id: { type: Schema.Types.ObjectId, ref: "countries", default: null },
    city_id: { type: Schema.Types.ObjectId, ref: "countries", default: null },
    country: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    site_type: {
      type: String,
      enum: ["headquarters", "branch", "representative_office", "remote", "other"],
      default: "headquarters",
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    visibility: {
      show_country: { type: Boolean, default: true },
      show_address: { type: Boolean, default: true },
      show_map: { type: Boolean, default: true },
    },
    is_primary: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const CompanyPrivacySettingsSchema = new Schema(
  {
    show_contact_info: { type: Boolean, default: true },
    show_location: { type: Boolean, default: true },
    show_employees_count: { type: Boolean, default: true },
    show_reviews: { type: Boolean, default: true },
    appear_in_search: { type: Boolean, default: true },
    allow_direct_contact: { type: Boolean, default: true },
  },
  { _id: false }
);
const CompanySearchFiltersSchema = new Schema(
  {
    text: {
      profile: { type: [String], default: [] },
      all: { type: [String], default: [], index: true },
    },

    identity: {
      company_name: { type: String, default: "", index: true },
      slug: { type: String, default: "", index: true },
      industry_id: {
        type: Schema.Types.ObjectId,
        ref: "industries",
        default: null,
        index: true,
      },
      industry_name: { type: String, default: "", index: true },
      company_type: { type: String, default: "", index: true },
      company_size_type: { type: String, default: "unknown", index: true },
      specialties: { type: [String], default: [], index: true },
      benefits: { type: [String], default: [] },
    },

    location: {
      country_id: {
        type: Schema.Types.ObjectId,
        ref: "countries",
        default: null,
        index: true,
      },
      city_id: {
        type: Schema.Types.ObjectId,
        ref: "countries",
        default: null,
        index: true,
      },
      country_code: { type: String, default: "", uppercase: true, index: true },
      country_name_ar: { type: String, default: "" },
      country_name_en: { type: String, default: "" },
      city_name_ar: { type: String, default: "" },
      city_name_en: { type: String, default: "" },
      company_country: { type: String, default: "", index: true },
      company_city: { type: String, default: "", index: true },
      timezone: { type: String, default: "UTC", index: true },
    },

    hiring: {
      is_hiring: { type: Boolean, default: true, index: true },
      can_upload: { type: Boolean, default: true, index: true },
      free_post_balance: { type: Number, default: 0, index: true },
      jobs_count: { type: Number, default: 0, index: true },
      active_jobs_count: { type: Number, default: 0, index: true },
    },

    trust: {
      status: { type: Boolean, default: false, index: true },
      accepted: { type: Boolean, default: false, index: true },
      is_verified: { type: Boolean, default: false, index: true },
      rating_avg: { type: Number, default: 0, index: true },
      rating_count: { type: Number, default: 0, index: true },
      profile_completion: { type: Number, default: 0, index: true },
    },

    stats: {
      employees_count: { type: Number, default: 0, index: true },
      views_count: { type: Number, default: 0, index: true },
      followers_count: { type: Number, default: 0, index: true },
    },
  },
  { _id: false }
);

const CompanySubscriptionSnapshotSchema = new Schema(
  {
    plan_id: { type: Schema.Types.ObjectId, ref: "subscription_plans", default: null, index: true },
    subscription_id: { type: Schema.Types.ObjectId, ref: "company_subscriptions", default: null, index: true },
    plan_key: { type: String, lowercase: true, trim: true, default: "free", index: true },
    status: { type: String, trim: true, default: "active", index: true },
    active_until: { type: Date, default: null },
    features: { type: Schema.Types.Mixed, default: {} },
    limits: { type: Schema.Types.Mixed, default: {} },
    jobs_require_admin_approval: { type: Boolean, default: true, index: true },
  },
  { _id: false }
);

const LanguageEmployeeSchema = new Schema(
  {
    language_id: {
      type: Schema.Types.ObjectId,
      ref: "languages",
      default: null,
      index: true,
    },
  },
  { _id: true, timestamps: true }
);
const CompanySchema = new Schema(

  {
    company_projection: {
      searchable_tokens: { type: [String], default: [] },
      searchable_text: { type: String, default: "" },

      hiring_score: { type: Number, default: 0 },
      trust_score: { type: Number, default: 0 },
      activity_score: { type: Number, default: 0 },
      branding_score: { type: Number, default: 0 },
      total_score: { type: Number, default: 0 },

      normalized_specialties: { type: [String], default: [] },
      normalized_benefits: { type: [String], default: [] },
      normalized_industry: { type: String, default: "" },
      normalized_location: { type: [String], default: [] },
    },
    search_filters: {
      type: CompanySearchFiltersSchema,
      default: () => ({}),
    },
    image: {
      type: String,
      default: null,
    },

    cover_image: {
      type: String,
      default: null,
    },
    logo: {
      type: String,
      default: null,
    },
    gallery: {
      type: [CompanyGallerySchema],
      default: [],
    },

    files: {
      type: [String],
      default: [],
    },

    company_name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },

    company_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    owner_user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },

    role_id: {
      type: Schema.Types.ObjectId,
      ref: "roles",
      required: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    profile_completion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },

    created_year: {
      type: Number,
      min: 1800,
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1500,
    },

    company_short_description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    mission: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    vision: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    culture: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    benefits: {
      type: [String],
      default: [],
    },

    specialties: {
      type: [String],
      default: [],
      index: true,
    },

    industry_id: {
      type: Schema.Types.ObjectId,
      ref: "industries",
      default: null,
      index: true,
    },

    industry_name: {
      type: String,
      default: "",
      trim: true,
    },

    company_size: {
      type: Number,
      default: null,
      min: 1,
    },

    company_size_type: {
      type: String,
      enum: [
        "1_10",
        "11_50",
        "51_200",
        "201_500",
        "500_plus",
        "startup",
        "small",
        "medium",
        "large",
        "enterprise",
        "unknown",
      ],
      default: "unknown",
      index: true,
    },

    company_type: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    country_id: {
      type: Schema.Types.ObjectId,
      ref: "countries",
      default: null,
      index: true,
    },

    city_id: {
      type: Schema.Types.ObjectId,
      ref: "countries",
      default: null,
      index: true,
    },

    company_country: {
      type: String,
      default: "",
      trim: true,
    },

    company_city: {
      type: String,
      default: "",
      trim: true,
    },

    company_address: {
      type: String,
      default: "",
      trim: true,
    },

    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },

    location: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    site_type: {
      type: String,
      enum: ["headquarters", "branch", "representative_office", "remote", "other"],
      default: "headquarters",
    },

    location_visibility: {
      show_country: { type: Boolean, default: true },
      show_address: { type: Boolean, default: true },
      show_map: { type: Boolean, default: true },
    },

    company_locations: {
      type: [CompanyLocationSchema],
      default: [],
    },

    privacy_settings: {
      type: CompanyPrivacySettingsSchema,
      default: () => ({}),
    },

    company_contact: {
      type: [String],
      default: [],
    },

    company_phone: {
      type: String,
      default: "",
      trim: true,
    },

    company_phone_code: {
      type: String,
      default: "",
      trim: true,
    },

    company_whatsapp: {
      type: String,
      default: "",
      trim: true,
    },

    company_website: {
      type: String,
      default: "",
      trim: true,
    },

    social_links: {
      type: [SocialLinkSchema],
      default: [],
    },

    hr_name: {
      type: String,
      trim: true,
      default: "",
    },

    hr_email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    hr_phone: {
      type: String,
      trim: true,
      default: "",
    },

    languages: { type: [LanguageEmployeeSchema], default: [] },

    is_hiring: {
      type: Boolean,
      default: true,
      index: true,
    },

    jobs_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    active_jobs_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    employees_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    views_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    followers_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: Boolean,
      default: false,
      index: true,
    },

    accepted: {
      type: Boolean,
      default: false,
      index: true,
    },

    is_verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verified_at: {
      type: Date,
      default: null,
    },

    verified_by: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },

    reviewed_at: { type: Date, default: null },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    rejection_reason: { type: String, trim: true, default: "" },

    verification_documents: {
      type: [VerificationDocumentSchema],
      default: [],
    },

    can_upload: {
      type: Boolean,
      default: true,
    },

    free_post_balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    rating_avg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    rating_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    subscription: {
      type: CompanySubscriptionSnapshotSchema,
      default: () => ({}),
    },
  },
  {
    collection: "companies",
    timestamps: true,
  }
);

CompanySchema.index({
  company_name: "text",
  description: "text",
  industry_name: "text",
  specialties: "text",
});

CompanySchema.index({
  owner_user_id: 1,
});

CompanySchema.index({
  accepted: 1,
  status: 1,
  is_verified: 1,
  is_hiring: 1,
});

CompanySchema.index({
  country_id: 1,
  city_id: 1,
});

CompanySchema.index({
  company_size_type: 1,
  company_type: 1,
});

CompanySchema.index({
  specialties: 1,
});
CompanySchema.index({ "search_filters.text.all": "text" });

CompanySchema.index({
  "search_filters.identity.industry_id": 1,
  "search_filters.identity.company_size_type": 1,
  "search_filters.hiring.is_hiring": 1,
});

CompanySchema.index({
  "search_filters.location.country_id": 1,
  "search_filters.location.city_id": 1,
});

CompanySchema.index({
  "search_filters.trust.accepted": 1,
  "search_filters.trust.status": 1,
  "search_filters.trust.is_verified": 1,
});

CompanySchema.index({
  "search_filters.hiring.active_jobs_count": -1,
  "search_filters.trust.rating_avg": -1,
});
CompanySchema.index({ "company_projection.searchable_tokens": 1 });
CompanySchema.index({ "company_projection.total_score": -1 });
CompanySchema.index({ "company_projection.hiring_score": -1 });
CompanySchema.index({ "company_projection.trust_score": -1 });
CompanySchema.index({ "company_projection.normalized_specialties": 1 });
CompanySchema.index({ "company_projection.normalized_industry": 1 });
CompanySchema.index({ "company_projection.normalized_location": 1 });
const CompanyModel = mongoose.model("companies", CompanySchema);

export default CompanyModel;