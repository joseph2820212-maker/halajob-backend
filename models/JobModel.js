import mongoose from "mongoose";

const { Schema } = mongoose;

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const jobsSchema = new Schema(
  {
    // أساسية
    job_name: { type: String, required: true, trim: true },
    job_name_id: { type: Schema.Types.ObjectId, ref: "jop_name", required: false },
    description: { type: String, required: true, trim: true },
    languages: [
      {
        name: String,
        level: { type: Number, min: 1, max: 5 },
      },
    ],
    // حالة ونشر
    status: { type: Boolean, default: false },
    is_accepted: { type: Boolean, default: false },
    started_date: { type: Date },
    end_date: { type: Date },
    ref: { type: String, trim: true },

    // تصنيفات إضافية (احتفظت بها إن كنت تستعملها)
    jobs_name: [{ type: String, trim: true }],

    // النوع والوقت والراتب والموقع   
    currency_id: { type: Schema.Types.ObjectId, ref: "currencies", required: true },
    countries: { type:[String],  required: true },
    jop_type_id: { type: Schema.Types.ObjectId, ref: "jop_type", required: true },
    jop_type_info: { type: Schema.Types.Mixed, required: false, default: {} }, // كان [Object]، صُحح إلى كائن/مختلط
    jop_time_id: { type: Schema.Types.ObjectId, ref: "work_time", required: true },
    jop_time_info: { type: Schema.Types.Mixed, required: false, default: {} },
    jop_salary_id: { type: Schema.Types.ObjectId, ref: "jop_salary", required: true }, // كان salary_type_id
    jop_salary_info: { type: Schema.Types.Mixed, required: true }, // بحسب المواصفات required:true


    // الخدمات
    jop_service: [{ type: String, trim: true }], // كان jobs_service

    // تحكم بالظهور والتواصل
    show_company_information: { type: Boolean, required: true },
    is_send_emails: { type: Boolean, required: true },
    is_cv_required: { type: Boolean, required: true },
    is_contact_on_emails: { type: Boolean, required: true },

    // بريد إلكتروني عند الإرسال
    emails: {
      type: [String],
      validate: [
        {
          validator(v) {
            // إذا كان الإرسال بالبريد مفعل فيجب وجود بريد واحد صحيح على الأقل
            if (this.is_send_emails) {
              return Array.isArray(v) && v.length > 0 && v.every((e) => emailRegex.test(e));
            }
            // إن لم يكن مفعلًا فتجاهل التحقق
            return !v || v.every((e) => emailRegex.test(e));
          },
          message: "invalid or missing emails when is_send_emails=true",
        },
      ],
      default: undefined,
    },

    // وظائف خارجية
    is_out_side: { type: Boolean, required: true },
    out_link: {
      type: String,
      trim: true,
      validate: [
        {
          validator(v) {
            if (this.is_out_side) {
              try {
                new URL(v);
                return true;
              } catch {
                return false;
              }
            }
            return v == null || v === "";
          },
          message: "out_link is required and must be a valid URL when is_out_side=true",
        },
      ],
    },
    user_show:{type:Number,default:0},
    user_review:{type:Number,default:0},
    user_applying:{type:Number,default:0},
    out_side_applying:{type:Number,default:0},
    user_saved:{type:Number,default:0}, 
    rating:{type:Number,default:0},
    is_update:{type:Boolean,default:false},
    // أسئلة إضافية بحد أقصى 5
    questions: {
      type: [Schema.Types.Mixed],
      validate: [
        {
          validator(v) {
            return !v || v.length <= 5;
          },
          message: "questions max length is 5",
        },
      ],
      default: undefined,
    },

    // الربط
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
  },
  {
    collection: "jobs",
    timestamps: true,
  }
);

// فهارس مفيدة
jobsSchema.index({ company_id: 1, status: 1, is_accepted: 1 });
jobsSchema.index({ job_name: "text", description: "text" });

const jobsModel = mongoose.model("jobs", jobsSchema);
export default jobsModel;
