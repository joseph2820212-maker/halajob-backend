import { CompanyModel } from "../../../models/index.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

const whatIsMyRole=async(req,res,next)=>{
 try {
   const user = req.user;
    const lan = (req.get("lan") || "en").toLowerCase();
    const company=await CompanyModel.findOne({
     ...buildCompanyOwnerQuery(user._id),
     status:true,
     accepted:true
    });
    if (!company) {
     return ReturnAppData.getError({res,message:lan==="ar"?"لا يمكن اضافة وظيفة حاليا يرجى تقديم طلب لتفعيل حساب الشركة لديك":"It is not possible to add a job currently, please submit a request to activate your company account"})
    }
//jop name               single 
 // work location         single
 // work location         single
 // jop type    select many with options
 // jop salary  select one with options
 // description
 // request emails many 
 // is send emails
 // is cv required
 // is contact on this emails
 // job time type this ref to end date 
 // jop service insert many
 // questions 
   let data=[
    {key:"job_name",type:"string",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-name",required:true},
    {key:"job_name_id",type:"string",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-name",required:false},
    {key:"work_location_id",type:"string",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-location",require:true},
    {key:"jop_type_id",type:"string",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-type-get",require:true},
    {key:"jop_type_info",type:"object",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-type-get",require:false},
    {key:"jop_salary_id",type:"string",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-salary-get",require:true},
    {key:"jop_salary_info",type:"object",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-salary-get",require:true},
    {key:"description",type:"string",helper_url:null,require:true},
    {key:"emails",type:"array<string>",helper_url:null,require:false},
    {key:"is_send_emails",type:"boolean",helper_url:null,require:true},
    {key:"is_cv_required",type:"boolean",helper_url:null,require:true},
    {key:"is_contact_on_emails",type:"boolean",helper_url:null,require:true},
    {key:"jop_time_id",type:"string",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-time-get",require:true},
    {key:"jop_time_info",type:"object",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-time-get",require:false},
    {key:"jop_service",type:"array<string>",helper_url:process.env.PUBLIC_BASE_URL+"/user/v1/helper/job-service",require:false},
    {key:"is_out_side",type:"boolean",helper_url:null,required:true},
    {key:"show_company_information",type:"boolean",helper_url:null,required:true},
    {key:"out_link",type:"url",helper_url:null,required:false},
    {key:"questions",type:"array<object>",helper_url:null,required:false,max:5},
   ]
     return ReturnAppData.getData({res,data})
 } catch (err) {
   return next(err);
 }
}

export default {whatIsMyRole}
