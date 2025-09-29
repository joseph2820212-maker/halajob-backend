import { EmployeeModel, RoleModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}
const profile = async (req, res, next) => {
 const user = req.user;
 const lan = (req.get("lan") || "en").toLowerCase();
 let employee = await EmployeeModel.findOne({ user_id: user._id });
 if (!employee) {
  const role = await RoleModel.findOne({ role_number: 21 })
  employee = await EmployeeModel.create({
   user_id: user._id,
   role_id: role._id
  });
 }
 if (employee.status === false) {
  return ReturnAppData.getError({
   res,
   status: 403,
   message:
    lan === "ar"
     ? "حسابك غير مفعل او تم حظره"
     : "Your account is inactive or blocked",
  });
 }
 const response={
  user:{
   first_name:user.first_name,
   mid_name:user.mid_name,
   last_name:user.last_name,
   image:user.image?buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image):null,
   phone_country:user.phone_country,
   phone_national:user.phone_national
  },
  employee:{
   latest_work_experience:employee.latest_work_experience,
   education:employee.education,
   skills:employee.skills,
   languages:employee.languages,
   licenses:employee.licenses,
   testimony:employee.testimony,
   job_names:employee.job_names,
   job_types:employee.job_types,
   min_salary:employee.min_salary,
   work_location:employee.work_location,
   is_can_move:employee.is_can_move,
   is_free_for_work:employee.is_free_for_work,
  }
 }
 return ReturnAppData.getData({res,data:response});
}
export default {profile}