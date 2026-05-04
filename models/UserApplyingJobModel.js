import mongoose from "mongoose";

const UserApplyingJobSchema = new mongoose.Schema(
  {
     status: {
    type: String, default:"waiting",
    enum: ['waiting',"accepted", 'rejected',"auto_cancel"],
  },
  status_changed_at:{type:Date},
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "jobs",
      required: true,
      index: true,
    },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    phone_code: { type: String, required: true },
    phone_national: { type: String, required: true },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    answers: [
      {
        question: String,
        answer: mongoose.Schema.Types.Mixed,
      },
    ],
    cv: String,
    cover_letter: String,
    user_job_rating:{type:Number,default:0},
    is_collect_rating:{type:Boolean,default:false},
    cv_download:{type:Boolean,default:false},
    is_filter:{type:Boolean,default:false},
    filter_on:{type:Boolean,default:false},
    is_send_interview: { type: Boolean, default: false },
    send_interview_at:{type:Date},
    interview_information: {
      meet_link: String,
      date: Date,
      is_online: { type: Boolean, default: false },
      is_on_app: { type: Boolean, default: false },
      is_in_office: { type: Boolean, default: false },
      office_address: String,
      note:String,
      longitude: Number,
      latitude: Number,
    },
  },
  {
    collection: "user_applying_job",
    timestamps: true,
  }
);

UserApplyingJobSchema.index({ user_id: 1, job_id: 1 }, { unique: true });
UserApplyingJobSchema.index({ job_id: 1, createdAt: -1 });

const UserApplyingJobModel = mongoose.model(
  "user_applying_job",
  UserApplyingJobSchema
);
export default UserApplyingJobModel;
