import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { BannerModel} from "../../../models/index.js";
function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}
const get=async(req,res,next)=>{
try {
   const locale=req.get("lan")||"ar"
   let currentItem = await BannerModel.find();
  return ReturnAppData.getData({res,data:currentItem.map((item)=>{
    return{
      
      image:buildPublicUrl(process.env.PUBLIC_BASE_URL, item.image)
    }
  })});
} catch (error) {
  next(error)
}
}
export default {get}