import mongoose from "mongoose";

const { Schema } = mongoose;

const EmployeeCvSchema = new Schema(
  {
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: "employees",
      required: true,
      index: true,
    },

    template_id: {
      type: Schema.Types.ObjectId,
      ref: "cv_templates",
      required: true,
      index: true,
    },

    template_key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      default: "My CV",
      trim: true,
    },

    source: {
      type: String,
      enum: ["builder", "upload", "parsed_upload", "imported", "legacy"],
      default: "builder",
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
      index: true,
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    visibility: {
      type: String,
      enum: ["private", "link", "applications_only", "profile"],
      default: "private",
      index: true,
    },

    quality_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    quality_checks: {
      type: Schema.Types.Mixed,
      default: {},
    },

    last_exported_at: {
      type: Date,
      default: null,
    },

    last_parsed_at: {
      type: Date,
      default: null,
    },

    attached_application_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    lang: {
      type: String,
      enum: ["ar", "en"],
      default: "en",
    },

    colors: {
      background_color: { type: String, default: "#f0ebe3" },
      card_color: { type: String, default: "#ffffff" },
      sidebar_color: { type: String, default: "#2b2d42" },
      accent_color: { type: String, default: "#ef8354" },
      text_color: { type: String, default: "#555555" },
    },

    font: {
      family: { type: String, default: "Arial" },
      size: { type: Number, default: 14 },
    },

    sections: {
      profile: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
      experience: { type: Boolean, default: true },
      education: { type: Boolean, default: true },
      skills: { type: Boolean, default: true },
      languages: { type: Boolean, default: true },
      licenses: { type: Boolean, default: true },
      testimony: { type: Boolean, default: true },
      links: { type: Boolean, default: true },
      job_preferences: { type: Boolean, default: true },
      expected_salary: { type: Boolean, default: false },
    },

    section_order: {
      type: [String],
      default: [
        "profile",
        "experience",
        "education",
        "skills",
        "languages",
        "licenses",
        "testimony",
        "links",
      ],
    },

    pdf_file: {
      type: String,
      default: "",
    },
    public_download_token: {
      type: String,
      default: "",
      select: false,
      index: true,
    },
    public_download_expires_at: {
      type: Date,
      default: null,
      index: true,
    },

    is_default: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { collection: "employee_cvs", timestamps: true }
);

EmployeeCvSchema.index({ employee_id: 1, is_default: 1 });
EmployeeCvSchema.index({ employee_id: 1, status: 1, is_default: -1, createdAt: -1 });
EmployeeCvSchema.index({ employee_id: 1, visibility: 1, status: 1 });

const EmployeeCvModel = mongoose.model("employee_cvs", EmployeeCvSchema);

export default EmployeeCvModel;
