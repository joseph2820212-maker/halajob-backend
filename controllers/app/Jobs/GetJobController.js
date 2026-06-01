import mongoose from "mongoose";
import { CompanyModel, jobsModel } from "../../../models/index.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";

const { isValidObjectId } = mongoose;

/* تأكيد وجود شركة مالك الطلب */
export async function ensureCompany(req, res) {
  const lan = (req.get("lan") || "en").toLowerCase();
  try {
    const company = await CompanyModel
      .findOne({ ...buildCompanyOwnerQuery(req.user._id), status: true, accepted: true })
      .select("_id")
      .lean();

    if (!company) {
      ReturnAppData.getError({
        res,
        status: 403,
        message: lan === "ar"
          ? "لا يمكن عرض بيانات الوظيفة حالياً."
          : "Job data cannot be displayed currently.",
      });
      return null;
    }
    return company;
  } catch (err) {
    ReturnAppData.getError({
      res,
      status: 500,
      message: lan === "ar" ? "فشل التحقق من الشركة" : "Company check failed",
      other: { code: err.code },
    });
    return null;
  }
}

/* GET /jobs/:id  — جلب وظيفة مملوكة لهذه الشركة فقط */
const getById = async (req, res) => {
  const lan = (req.get("lan") || "en").toLowerCase();
  const { id } = req.params || {};

  // تحقق من صحة المعرّف
  if (!isValidObjectId(id)) {
    return ReturnAppData.getError({
      res,
      status: 400,
      message: lan === "ar" ? "معرّف غير صالح" : "Invalid id",
    });
  }

  // تحقق من الشركة
  const company = await ensureCompany(req, res);
  if (!company) return;

  try {
    // استعلام مباشر يضمن ملكية الوظيفة
    const job = await jobsModel
      .findOne({ _id: id, company_id: company._id })
      .lean();

    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: lan === "ar" ? "لم يتم العثور على الوظيفة" : "Job not found",
      });
    }

    return ReturnAppData.getData({ res, data: job });
  } catch (err) {
    return ReturnAppData.getError({
      res,
      status: 500,
      message: lan === "ar" ? "فشل جلب البيانات" : "Failed to fetch job",
      other: { code: err.code },
    });
  }
};

export default { getById };
