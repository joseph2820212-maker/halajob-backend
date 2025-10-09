import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },

    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles",
      required: true,
    },

    permissions: [String],
    cvs: [String],

    status: { type: Boolean, default: true },
    accepted: Boolean,

    latest_work_experience:  {
        company_name: String,
        start_date:Date,
        end_date:Date,
        is_until_now:Boolean,
        position:String,
        points:[{
          title:String,
          contents:[{
            title:String,
            description:String
          }]
        }]
      },
    about_me:{type:String},
    experience: [
      {
        company_name: String,
        start_date:Date,
        end_date:Date,
        is_until_now:Boolean,
        position:String,
        points:[{
          title:String,
          contents:[{
            title:String,
            description:String
          }]
        }]
      }
    ],
    education: [
      {
        level: String,
        study: String,
      },
    ],

    skills: [
      {
        title: String,
        years: Number,
      },
    ],

    languages: [
      {
        name: String,
        level: { type: Number, min: 1, max: 5 },
      },
    ],

    licenses: [
      {
        name: String,
        end_in: Date,
        is_for_ever: Boolean,
      },
    ],

    testimony: [
      {
        name: String,
        end_in: Date,
        is_for_ever: Boolean,
      },
    ],

    job_names: [String],

    job_types: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "jop_type",
      },
    ],

    min_salary: [
      {
        amount: Number,
        ber: { type: String, enum: ["year", "month", "day", "hour"] },
      },
    ],

    work_location: { type: String, enum: ["remote", "personal", "in_office"] },
    links:[
      {
        title:String,
        url:String
      }
    ],
    is_can_move: { type: Boolean, default: false },
    is_free_for_work: { type: Boolean, default: false },
  },
  { collection: "employees" }
);

const EmployeeModel = mongoose.model("employees", EmployeeSchema);

export default EmployeeModel;
