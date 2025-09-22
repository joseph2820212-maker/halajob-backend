import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
    image:{type:String},
    files:{type:[String]},
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true ,unique: true},
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "roles", required: true },
    permissions: { type: [String] },
    description:{type:String},
    status:{type:Boolean,default:true},
    accepted:{type:Boolean}
    
},{collection : "companies"})

const EmployeeModel = mongoose.model('EmployeeSchema', EmployeeSchema)

export default EmployeeModel;