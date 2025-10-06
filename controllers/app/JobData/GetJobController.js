// const get = (req, res, next) => {
//   try {
//     const data = analyze(req.body.data);   
//     return res.json(data);
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// };

import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  JopSalaryModel,
  CurrencyModel,
  JopServiceModel,
  WorkTimeTypeModel,
  CompanyModel,
  JopTypeModel,
} from "../../../models/index.js";

/* ============== LIST ============== */
function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

const get = async (req, res) => {
  try {
    const page  = Number(req.query.page  || 1);
    const limit = Number(req.query.limit || 10);
    const search = (req.query.search || "").trim();
    const lan = (req.get("lan") || "en").toLowerCase();

    const rx = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
    const filter = rx ? { $or: [{ job_name: rx }, { description: rx }] } : {};

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      jobsModel
        .find(filter, { job_name: 1, company_id: 1, jop_type_id: 1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "company_id", select: "company_name image" })
        .populate({ path: "jop_type_id", select: `title_${lan}` })
        .lean(),
      jobsModel.countDocuments(filter),
    ]);

    const data = items.map((it) => ({
      id: it._id,
      title: it.job_name || "",
      company: it.company_id?.company_name || null,
      company_image:it.company_id?.image?buildPublicUrl(process.env.PUBLIC_BASE_URL, it.company_id?.image):null,
      job_type: it.jop_type_id?.[`title_${lan}`] || null,
    }));

    return ReturnAppData.getData({
      res,
      data,
      other: {
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    return ReturnAppData.getError({ res, message: err.message || "Get failed" });
  }
};

/* ============== DETAILS ============== */
const getById = async (req, res) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = req.params.id;

    const job = await jobsModel.findById(id).lean();
    if (!job) {
      return ReturnAppData.getError({ res, code: 404, message: "Job not found" });
    }

    // جهّز IDs للخدمات
    const serviceIds = Array.isArray(job.jop_service)
      ? job.jop_service
          .filter(Boolean)
          .map((v) => (typeof v === "string" ? new mongoose.Types.ObjectId(v) : v))
      : [];

    // اجلب بالتوازي
    const [salary, currency, workTime, services, company, jopType] = await Promise.all([
      JopSalaryModel.findById(job.jop_salary_id).lean(),
      CurrencyModel.findById(job.currency_id).lean(),
      WorkTimeTypeModel.findById(job.jop_time_id).lean(),
      serviceIds.length ? JopServiceModel.find({ _id: { $in: serviceIds } }).lean() : Promise.resolve([]),
      CompanyModel.findById(job.company_id).lean(),
      JopTypeModel.findById(job.jop_type_id).lean(),
    ]);

    const response = {
      id: job._id,
      title: job.job_name || "",
      description: job.description || "",
      job_type: jopType?.[`title_${lan}`] || null,
      jop_type_info:job.jop_type_info,
      salary_type: salary?.[`title_${lan}`] || null,
      currency: currency
        ? {
            title: currency[`name_${lan}`] ?? null,
            symbol: currency[`symbol_${lan}`] ?? null,
            code: currency.code ?? null,
          }
        : null,
      jop_time: workTime ? { title: workTime[`title_${lan}`] ?? null } : null,
      jop_time_info:job.jop_time_info,
      jop_salary_info:job.jop_salary_info,
      is_out_side:job.is_out_side,
      out_link:job.out_link,
      jop_services: (services || []).map((s) => ({ title: s?.[`title_${lan}`] || null })),
      company: company
        ? { name: company.company_name ?? null, email: company.company_email ?? null,company_address:company.company_address,company_image:company?.image?buildPublicUrl(process.env.PUBLIC_BASE_URL, company?.image):null, }
        : null,
    };

    return ReturnAppData.getData({ res, data: response });
  } catch (err) {
    return ReturnAppData.getError({ res, message: err.message || "Get by id failed" });
  }
};

export default { get, getById };
