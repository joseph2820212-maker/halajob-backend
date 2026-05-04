import mongoose from "mongoose";
const CompanySchema = new mongoose.Schema({
    image:{type:String},
    files:{type:[String]},
    company_name:{type:String,required:false,unique: true},
    company_email:{type:String,required:false,unique: true},
     user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "roles", required: true },
    permissions: { type: [String] },
    can_upload:{type:Boolean,default:true},
    created_year:{type:Date},
    description:{type:String},
    company_size:{type:Number},
    company_type:{type:String},
    company_country:{type:String},
    company_address:{type:String},
    company_contact:{type:[String]},
    company_phone:{type:String},
    company_phone_code:{type:String},
    company_website:{type:String},
    status:{type:Boolean,default:false},
    accepted:{type:Boolean}
    
},{collection : "companies"})

const CompanyModel = mongoose.model('companies', CompanySchema)

export default CompanyModel;