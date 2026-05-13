// jobs.controller.js

import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  JobSalaryModel,
  CurrencyModel,
  JobServiceModel,
  WorkTimeTypeModel,
  CompanyModel,
  JobTypeModel,
  UserShowJobModel,
  UserSavedJobModel,
  CountryModel
} from "../../../models/index.js";

/* ========= utils ========= */
const { Types, isValidObjectId } = mongoose;

function buildPublicUrl(base, rel) {
  if (!base) return process.env.PUBLIC_BASE_URL + "/" + rel || null;
  const c = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + c : `${base}/${c}`;
}

const NON_AR_EN = /[^\dA-Za-z\u0600-\u06FF\s]/g; // أبقِ الأرقام
const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670-\u06ED]/g;
const AR_STOP = new Set(["في", "من", "على", "الى", "عن", "و", "أو", "هذا", "هذه", "ذلك", "هناك", "هنا", "هو", "هي", "هم", "هن", "ما", "لم", "لن", "لا", "قد", "مع", "بعد", "قبل", "بين", "هل", "يا", "كما", "أيضا", "ايضا"]);
const EN_STOP = new Set(["the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "from", "by", "is", "are", "was", "were", "be", "been", "being", "this", "that", "these", "those", "there", "here", "with", "about", "as", "it", "its", "i", "you", "he", "she", "they", "we", "not", "no", "yes", "do", "does", "did", "done", "have", "has", "had", "can", "could", "should", "would", "will", "just", "also", "too", "very"]);

const normalizeArabic = s =>
  s.replace(AR_DIACRITICS, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "");

const normalizeEnglish = s =>
  s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const normalizeMixed = s =>
  normalizeEnglish(
    normalizeArabic((s || "").replace(NON_AR_EN, " ").replace(/\s+/g, " ").trim())
  );

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenizeBasic(text) {
  const toks = normalizeMixed(text).split(/\s+/).filter(Boolean);
  return Array.from(
    new Set(toks.filter(t => t.length >= 2 && !AR_STOP.has(t) && !EN_STOP.has(t)))
  ).slice(0, 8);
}

function dateFromBucket(key) {
  const now = new Date();
  const d = new Date(now);
  if (key === "last_24h") { d.setDate(now.getDate() - 1); return d; }
  if (key === "last_7d") { d.setDate(now.getDate() - 7); return d; }
  if (key === "last_30d") { d.setDate(now.getDate() - 30); return d; }
  return null;
}

function parseIds(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => new Types.ObjectId(String(x)));
  if (typeof v === "string")
    return v.split(",").map(s => s.trim()).filter(Boolean).map(x => new Types.ObjectId(String(x)));
  return [];
}

/* ========= constants ========= */
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || "";
const Job_TYPE_COLL = JobTypeModel.collection.name;            // "Job_type"
const COMPANY_COLL = CompanyModel.collection.name;             // "companies"
const USS_COLL = UserShowJobModel.collection.name;         // "user_show_job" (أو حسب اسمك الفعلي)


/* ========= list ========= */
const get = async (req, res) => {
  try {
    // ===== inputs =====
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const lan = (req.get("lan") || "en").toLowerCase();
    const rawSearch = String(req.query.search || "").slice(0, 100).trim();
    const countryIdRaw = (req.query.country_id || "").trim();

    // user_id
    const userIdParam =
      req.query.user_id || req.params.user_id || req.get("user_id") || req.user?._id || null;
    const userObjId = isValidObjectId(userIdParam) ? new Types.ObjectId(String(userIdParam)) : null;

    // ===== parse filters =====
    const rawFilters = (() => {
      const f = req.query.filters;
      if (!f) return {};
      if (typeof f === "string") { try { return JSON.parse(f); } catch { return {}; } }
      if (typeof f === "object") return f;
      return {};
    })();

    const companyIds = parseIds(rawFilters.companies);
    const typeIds    = parseIds(rawFilters.types);
    const publishKey = typeof rawFilters.publish_date === "string" ? rawFilters.publish_date : null;
    const isRemote   = typeof rawFilters.is_remote === "boolean" ? rawFilters.is_remote : null;
    const notSeen    = rawFilters.not_seen === true;
    const createdAtGte = publishKey ? dateFromBucket(publishKey) : null;

    // ===== country condition (يدعم id أو code/اسم) =====
    let countryCond = {};
    if (countryIdRaw) {
      if (isValidObjectId(countryIdRaw)) {
        // جلب مرجع الدولة لإنتاج بدائل مطابقة مع حقل countries النصّي
        const cDoc = await CountryModel.findById(countryIdRaw)
          .select("code name_en name_ar").lean().catch(() => null);
        const candidates = [
          String(countryIdRaw),
          cDoc?.code,
          cDoc?.code?.toLowerCase?.(),
          cDoc?.code?.toUpperCase?.(),
          cDoc?.name_en,
          cDoc?.name_ar,
        ].filter(Boolean);
        if (candidates.length) countryCond = { countries: { $in: candidates } };
        else countryCond = { countries: { $in: [String(countryIdRaw)] } };
      } else {
        countryCond = { countries: { $in: [countryIdRaw] } };
      }
    }

    // ===== search tokens & regex =====
    const tokens = tokenizeBasic(rawSearch);
    let orConds = [];
    if (tokens.length) {
      orConds.push({ keywords_norm: { $in: tokens } });
      orConds.push({ phrases_norm:  { $in: tokens } });
      const rx = new RegExp(tokens.map(t => escapeRegExp(t)).join("|"), "i");
      orConds.push({ job_name: rx }, { description: rx }, { keywords_norm: rx }, { phrases_norm: rx });
    }

    // ===== match =====
    const match = {
      status: true,
      is_accepted: true,
      ...countryCond,
      ...(orConds.length && { $or: orConds }),
      ...(companyIds.length && { company_id: companyIds[0] }),
      ...(typeIds.length && { Job_type_id: { $in: typeIds } }),
      ...(createdAtGte && { createdAt: { $gte: createdAtGte } }),
      ...(isRemote === true && { is_remote: true }),
      ...(isRemote === false && { is_remote: false }),
    };

    // ===== localization =====
    const L = lan === "ar"
      ? {
          companies: "الشركات",
          types: "أنواع الوظائف",
          remote: "عن بُعد",
          remote_yes: "عن بُعد",
          remote_no: "في المكتب",
          publish_date: "تاريخ النشر",
          pd_24h: "آخر 24 ساعة",
          pd_7d: "آخر 7 أيام",
          pd_30d: "آخر 30 يومًا",
          not_seen: "وظائف لم تُشاهد",
          not_seen_true: "غير مُشاهدة بعد",
        }
      : {
          companies: "Companies",
          types: "Job types",
          remote: "Remote",
          remote_yes: "Remote",
          remote_no: "On-site",
          publish_date: "Publish date",
          pd_24h: "Last 24 hours",
          pd_7d: "Last 7 days",
          pd_30d: "Last 30 days",
          not_seen: "Unseen jobs",
          not_seen_true: "Not seen yet",
        };

    const skip = (page - 1) * limit;

    // ===== core pipeline =====
    const core = [
      { $match: match },
      {
        $lookup: {
          from: COMPANY_COLL,
          localField: "company_id",
          foreignField: "_id",
          as: "company",
          pipeline: [{ $project: { company_name: 1, image: 1 } }],
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: Job_TYPE_COLL,
          localField: "Job_type_id",
          foreignField: "_id",
          as: "Job_type",
          pipeline: [{ $project: { [`title_${lan}`]: 1 } }],
        },
      },
      { $unwind: { path: "$Job_type", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          company_name: "$company.company_name",
          company_image: "$company.image",
          job_type_title: `$Job_type.title_${lan}`,
          _kwScore: tokens.length
            ? { $size: { $setIntersection: [{ $ifNull: ["$keywords_norm", []] }, tokens] } }
            : 0,
        },
      },
    ];

    // not_seen
    const seenFilter = (notSeen && userObjId)
      ? [
          {
            $lookup: {
              from: USS_COLL,
              let: { jid: "$._id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$job_id", "$$jid"] },
                        { $eq: ["$user_id", userObjId] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "seenHit",
            },
          },
          { $match: { seenHit: { $size: 0 } } },
        ]
      : [];

    const sortAndProject = [
      { $sort: { _kwScore: -1, createdAt: -1, _id: -1 } },
      {
        $project: {
          title: "$job_name",
          company_id: 1,
          Job_type_id: 1,
          createdAt: 1,
          is_remote: 1,
          countries: 1,
          company: "$company_name",
          company_image: 1,
          job_type: "$job_type_title",
        },
      },
    ];

    const savedJoin = userObjId
      ? [
          {
            $lookup: {
              from: UserSavedJobModel.collection.name,
              let: { jid: "$_id", uid: userObjId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$job_id", "$$jid"] },
                        { $eq: ["$user_id", "$$uid"] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "savedHit",
            },
          },
          { $addFields: { is_saved: { $gt: [{ $size: "$savedHit" }, 0] } } },
          { $project: { savedHit: 0 } },
        ]
      : [];

    // ===== facets =====
    const facet = {
      items: [{ $skip: skip }, { $limit: limit }],
      meta: [{ $count: "total" }],
    };

    if (page === 1 && !req.query.filters) {
      facet.companies = [
        { $match: { company_id: { $type: "objectId" } } },
        { $group: { _id: "$company_id", name: { $first: "$company" }, image: { $first: "$company_image" } } },
        { $sort: { name: 1 } },
        { $limit: 100 },
      ];
      facet.types = [
        { $match: { Job_type_id: { $type: "objectId" } } },
        { $group: { _id: "$Job_type_id", title: { $first: "$job_type" } } },
        { $sort: { title: 1 } },
        { $limit: 100 },
      ];
    }

    const pipeline = [
      ...core,
      ...seenFilter,
      ...sortAndProject,
      ...savedJoin,
      { $facet: facet },
    ];

    // ===== run =====
    const [agg] = await jobsModel.aggregate(pipeline).allowDiskUse(true);

    const items = agg?.items || [];
    const total = agg?.meta?.[0]?.total || 0;

    const data = items.map(it => ({
      id: it._id,
      title: it.title || "",
      company: it.company || null,
      company_image: it.company_image ? buildPublicUrl(PUBLIC_BASE, it.company_image) : null,
      job_type: it.job_type || null,
      is_remote: !!it.is_remote,
      countries: it.countries || [],
      created_at: it.createdAt,
      is_saved: !!it.is_saved,
    }));

    const other = {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    if (page === 1 && !req.query.filters) {
      const companiesOpts = (() => {
        const seen = new Set();
        return (agg.companies || [])
          .filter(c => { const k = String(c._id); if (seen.has(k)) return false; seen.add(k); return true; })
          .map(c => ({
            id: c._id,
            label: c.name || "",
            image: c.image ? buildPublicUrl(PUBLIC_BASE, c.image) : null,
          }));
      })();

      const typesOpts = (agg.types || []).map(t => ({
        id: t._id,
        label: t.title || "",
      }));

      const remoteOpts = [
        { value: true, label: L.remote_yes },
        { value: false, label: L.remote_no },
      ];

      const publishOpts = [
        { value: "last_24h", label: L.pd_24h },
        { value: "last_7d", label: L.pd_7d },
        { value: "last_30d", label: L.pd_30d },
      ];

      const notSeenOpts = [{ value: true, label: L.not_seen_true }];

      other.filters = {
        groups: [
          { key: "companies", title: L.companies, type: "select_one", options: companiesOpts, selected: companyIds[0] || null },
          { key: "types", title: L.types, type: "select_many", options: typesOpts, selected: typeIds },
          { key: "remote", title: L.remote, type: "boolean", options: remoteOpts, selected: typeof isRemote === "boolean" ? isRemote : null },
          { key: "publish_date", title: L.publish_date, type: "select_one", options: publishOpts, selected: publishKey || null },
          { key: "not_seen", title: L.not_seen, type: "boolean", options: notSeenOpts, selected: notSeen === true ? true : null },
        ],
      };
    }

    return ReturnAppData.getData({ res, data, other });
  } catch (err) {
    return ReturnAppData.getError({ res, message: err?.message || "Get failed" });
  }
};

/* ========= details ========= */
const getById = async (req, res) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    const id = String(req.params.id || "");
      const userIdParam =
  req.query.user_id ||        // <-- أضف هذا
  req.params.user_id ||
  req.get("user_id") ||
  req.user?._id ||
  null;
const userObjId = isValidObjectId(userIdParam) ? new Types.ObjectId(String(userIdParam)) : null;

    if (!isValidObjectId(id)) {
      return ReturnAppData.getError({ res, code: 400, message: "invalid id" });
    }

    const job = await jobsModel.findOne(
      { _id: id, status: true, is_accepted: true },
      "job_name description Job_type_id Job_type_info Job_time_id Job_time_info Job_salary_id Job_salary_info currency_id company_id is_out_side out_link"
    ).lean();

    if (!job) {
      return ReturnAppData.getError({ res, code: 404, message: "Job not found" });
    }

    const serviceIds = Array.isArray(job.Job_service)
      ? job.Job_service.filter(Boolean).map(v => (typeof v === "string" ? new Types.ObjectId(v) : v))
      : [];
const [salary, currency, workTime, services, company, JobType, isSavedDoc] = await Promise.all([
  job.Job_salary_id ? JobSalaryModel.findById(job.Job_salary_id).lean() : null,
  job.currency_id ? CurrencyModel.findById(job.currency_id).lean() : null,
  job.Job_time_id ? WorkTimeTypeModel.findById(job.Job_time_id).lean() : null,
  serviceIds.length ? JobServiceModel.find({ _id: { $in: serviceIds } }).lean() : [],
  job.company_id ? CompanyModel.findById(job.company_id).lean() : null,
  job.Job_type_id ? JobTypeModel.findById(job.Job_type_id).lean() : null,
 userObjId ? UserSavedJobModel.exists({ job_id: job._id, user_id: userObjId }) : false,
]);
const is_saved = !!isSavedDoc;

    const response = {
      id: job._id,
      title: job.job_name || "",
      description: job.description || "",
      job_type: JobType?.[`title_${lan}`] || null,
      Job_type_info: job.Job_type_info ?? null,
      salary_type: salary?.[`title_${lan}`] || null,
      is_saved,
      currency: currency
        ? {
          title: currency[`name_${lan}`] ?? null,
          symbol: currency[`symbol_${lan}`] ?? null,
          code: currency.code ?? null,
        }
        : null,
      Job_time: workTime ? { title: workTime[`title_${lan}`] ?? null } : null,
      Job_time_info: job.Job_time_info ?? null,
      Job_salary_info: job.Job_salary_info ?? null,
      is_out_side: !!job.is_out_side,
      out_link: job.out_link || null,
      Job_services: (services || []).map(s => ({ title: s?.[`title_${lan}`] || null })),
      company: company
        ? {
          name: company.company_name ?? null,
          email: company.company_email ?? null,
          company_address: company.company_address ?? null,
          company_image: company?.image ? buildPublicUrl(PUBLIC_BASE, company.image) : null,
        }
        : null,
    };

    return ReturnAppData.getData({ res, data: response });
  } catch (err) {
    return ReturnAppData.getError({ res, message: err?.message || "Get by id failed" });
  }
};

export default { get, getById };

// const get = (req, res, next) => {
//   try {
//     const data = analyze(req.body.data);
//     return res.json(data);
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// };