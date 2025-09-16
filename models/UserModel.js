import mongoose from "mongoose";
const OptionSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model_name: { type: String, required: true },
  model_id:     { type: String|null },
  is_device:{ type: Boolean, required: true }, 
  build_id:   { type:String },
  is_default:{type:Boolean,default:true}
}, { _id: false });
const userSchema = new mongoose.Schema({
    first_name: { type: String,required:true },
    mid_name: { type: String, },
    last_name: { type: String,required:true },
    image: { type: String },
    email: { type: String, required: true, unique: true },
    lan: {
        type: String, default: "en",
        enum: ['ar', "en"],
    },
    gender: {
        type: String, required: true,
        enum: ['male', "female"],
    },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "roles", required: true },
    permissions: { type: [String] },
    password: { type: String , required: true },
    phone: { type: String },
    another_device:{type:String},
    status: { type: Boolean, required: true },
    can_update_password:{type:Boolean},
    phone_e164: { type: String , required: true },          // "+9665xxxxxxx"
   phone_country: { type: String , required: true },       // "SA"
    phone_code: { type: String , required: true }, // "+966"
    phone_national: { type: String , required: true },      
    passcode_expires_at: { type: Date },
    passcode:{type:String},
    twofa_expires_at: { type: Date },
    device:{type:[OptionSchema],default:[]},
    passcode_active: { type: Boolean, default: false }
    
}, { collection: "users" })

const UserModel = mongoose.model('UserSchema', userSchema)

export default UserModel;