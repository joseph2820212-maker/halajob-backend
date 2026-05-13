import { JobNameModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

const get = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();

  

    const docs = await JobNameModel.aggregate([
      { $sample: { size: 5 } },
      { $project: { _id: 0, title_ar: 1, title_en: 1 } },
    ]);

    const data = docs.map(it => ({
      title: lan === "ar"
        ? (it.title_ar ?? it.title_en ?? "")
        : (it.title_en ?? it.title_ar ?? "")
    }));

    return ReturnAppData.getData({ res, data });
  } catch (err) {
    return ReturnAppData.getError({ res, message: err?.message || "Get failed" });
  }
};

export default { get };
