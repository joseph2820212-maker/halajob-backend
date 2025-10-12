import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CompanyModel,
  jobsModel,
  UserApplyingJobModel,
} from "../../../models/index.js";

/* helper: تحقق شركة المالك */
async function ensureCompany(req, res) {
  const lan = (req.get("lan") || "en").toLowerCase();
  const company = await CompanyModel.findOne({
    user_id: req.user._id,
    status: true,
    accepted: true,
  }).select("_id");
  if (!company) {
    ReturnAppData.createError({
      res,
      status: 403,
      message: lan === "ar"
        ? "لا يمكن عرض بيانات الوظيفة حالياً."
        : "Job data cannot be displayed currently.",
    });
    return null;
  }
  return company;
}

/* المتقدمون للوظيفة */
export const getJobApplicants = async (req, res, next) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = req.params.id;
    const page = Math.max(0, parseInt(req.query.page ?? "0", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "5", 10)));

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }

    const company = await ensureCompany(req, res);
    if (!company) return;

    const owned = await jobsModel.exists({ _id: id, company_id: company._id });
    if (!owned) {
      return ReturnAppData.createError({ res, status: 404, message: lan === "ar" ? "الوظيفة غير موجودة" : "Job not found" });
    }

    const items = await UserApplyingJobModel.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(id) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: page * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "u",
          pipeline: [{ $project: { first_name: 1, last_name: 1 } }],
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          status:1,
          status_changed_at:1,
          // بيانات الاتصال المخزنة لحظة التقديم
          email: 1,
          phone_code: 1,
          phone_national: 1,
          country_id: 1,
          // لا نعيد CV أو الإجابات إلا إذا أردت ذلك
          // cv: 1,
          // answers: 1,
          user: {
            _id: "$user_id",
            // اسم حيّ من users وإن لم يوجد فالمحفوظ عند التقديم
            name: {
              $trim: {
                input: {
                  $cond: [
                    { $or: [
                      { $ifNull: [{ $arrayElemAt: ["$u.first_name", 0] }, false] },
                      { $ifNull: [{ $arrayElemAt: ["$u.last_name", 0] }, false] },
                    ]},
                    {
                      $concat: [
                        { $ifNull: [{ $arrayElemAt: ["$u.first_name", 0] }, "" ] },
                        " ",
                        { $ifNull: [{ $arrayElemAt: ["$u.last_name", 0] }, "" ] },
                      ],
                    },
                    { $concat: [ { $ifNull: ["$first_name", "" ] }, " ", { $ifNull: ["$last_name", "" ] } ] }
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    return ReturnAppData.createData({
      res,
      data:items,
      other: { page, limit, hasMore: items.length === limit,  }
    });
  } catch (e) {
    next(e);
  }
};

export default { getJobApplicants };
