import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { KeywordModel } from "../../models/index.js";

const get=async(req,res)=>{
 try {
  const keywords=await KeywordModel.findOne();
   return ReturnDashData.getData({
        res,
        data: keywords,
      });
 } catch (error) {
  console.log('====================================');
  console.log(error);
  console.log('====================================');
 }
}
const updateKeyWord = async (req, res, next) => {
  try {
    const data = req.body.inputs;

    // Validate the 'inputs' field
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, message: "'inputs' must be an array" });
    }

 

    // Create or fetch the dynamic model for 'keyWord'
    let currentItem = await KeywordModel.findOne();

    // If no item exists, create a new one
    if (!currentItem) {
      currentItem = await KeywordModel.create({ inputs: data });
    } else {
      // Update the existing item
      currentItem = await KeywordModel.findByIdAndUpdate(
        currentItem._id,
        { inputs: data },
        { new: true } // Return the updated document
      );
    }

    // Send the response
    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: currentItem,
    });
  } catch (error) {
    console.error("Error in updateKeyWord:", error);
    next(error); // Pass the error to the global error handler
  }
};
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const ar = require("../../helper/ar.json");
const en = require("../../helper/en.json");
const logKeyword = async (req, res, next) => {
  await KeywordModel.deleteMany();
  const result = Object.keys(ar).map((key) => ({
    name: key,
    title_ar: ar[key] ?? "",
    title_en: en[key] ?? ""
  }));

  const currentItem = await KeywordModel.create({type:"app", inputs: result });
  return res.json(currentItem);
};

export default {
 get,
 updateKeyWord,
 logKeyword
}