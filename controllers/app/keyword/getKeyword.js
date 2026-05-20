import { KeywordModel } from "../../../models/index.js";

const get=async(req,res,next)=>{
try {
   const locale=req.get("lan")||"ar"
   let currentItem = await KeywordModel.findOne({type:"app"});
   return res.json({data:currentItem.inputs.map((item)=>{
    return{
     key:item.name,
     title:locale==="ar"?item.title_ar:item.title_en,
     title_ar:item.title_ar,
     title_en:item.title_en
    }
   })});
} catch (error) {
  next(error)
}
}
export default {get}