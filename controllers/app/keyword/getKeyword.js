import { KeywordModel } from "../../../models/index.js";

const get=async(req,res,next)=>{
 const locale=req.get("lan")||"ar"
   let currentItem = await KeywordModel.findOne();
   return res.json({data:currentItem.inputs.map((item)=>{
    return{
     key:item.name,
     title:locale==="ar"?item.title_ar:item.title_en
    }
   })});
}
export default {get}