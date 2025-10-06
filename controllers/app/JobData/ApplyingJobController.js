import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { jobsModel, UserApplyingJobModel } from "../../../models/index.js";

/**
 * تقديم طلب توظيف داخلي
 */
const applyJob = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const user = req.user;
    const { answers = [], cv = "", cover_letter = "", country_id } = req.body;
    const id = req.params.id;

    const MSG = {
      MISSING: lan === "ar" ? "المعطيات ناقصة." : "Missing required fields.",
      BAD_ID: lan === "ar" ? "معرّف الوظيفة غير صالح." : "Invalid job id.",
      JOB_404: lan === "ar" ? "الوظيفة غير موجودة." : "Job not found.",
      DUPLICATE: lan === "ar" ? "لقد قدمت طلبًا لهذه الوظيفة مسبقًا." : "Application already submitted.",
      OK: lan === "ar" ? "تم تقديم الطلب بنجاح." : "Application submitted successfully.",
    };

    if (!mongoose.isValidObjectId(id)) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.BAD_ID });
    }

    if (
      !user?.first_name ||
      !user?.last_name ||
      !user?.email ||
      !user?.phone_code ||
      !user?.phone_national
    ) {
      return ReturnAppData.createError({ res, status: 400, message: MSG.MISSING });
    }

    // تأكد أن الوظيفة موجودة
    const job = await jobsModel.findById(id).select("_id").lean();
    if (!job) {
      return ReturnAppData.createError({ res, status: 404, message: MSG.JOB_404 });
    }

    // منع التكرار
    const existing = await UserApplyingJobModel.findOne({ user_id: user._id, job_id: job._id }).lean();
    if (existing) {
      return ReturnAppData.createError({ res, status: 409, message: MSG.DUPLICATE });
    }

    // معاملة: إنشاء الطلب + زيادة العداد
    let doc;
    await session.withTransaction(async () => {
      doc = await UserApplyingJobModel.create([{
        user_id: user._id,
        job_id: job._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_code: user.phone_code,
        phone_national: user.phone_national,
        country_id: country_id ?? user.country_id ?? null,
        answers: Array.isArray(answers) ? answers : [],
        cv,
        cover_letter,
      }], { session });

      await jobsModel.updateOne(
        { _id: job._id },
        { $inc: { user_applying: 1 } },
        { session }
      );
    });

    return ReturnAppData.createData({ res, data: doc?.[0] ?? null, message: MSG.OK });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

export default { applyJob };
