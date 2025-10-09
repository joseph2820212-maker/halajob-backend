// jobs.controller.js

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
  UserShowJobModel,
  UserSavedJobModel
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
const JOP_TYPE_COLL = JopTypeModel.collection.name;            // "jop_type"
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
    const countryId = (req.query.country_id || "").trim();

    // user_id من الهيدر أولاً ثم من req.user
    const userIdHeader = req.get("user_id") || null;
    const userId = userIdHeader && isValidObjectId(userIdHeader)
      ? new Types.ObjectId(userIdHeader)
      : (req.user?._id ? new Types.ObjectId(req.user._id) : null);

    const tokens = tokenizeBasic(rawSearch);

    // ===== parse filters (الواردة من العميل) =====
    const rawFilters = (() => {
      const f = req.query.filters;
      if (!f) return {};
      if (typeof f === "string") { try { return JSON.parse(f); } catch { return {}; } }
      if (typeof f === "object") return f;
      return {};
    })();

    const companyIds = parseIds(rawFilters.companies);                 // select_one
    const typeIds = parseIds(rawFilters.types);                     // select_many
    const publishKey = typeof rawFilters.publish_date === "string" ? rawFilters.publish_date : null; // select_one
    const isRemote = typeof rawFilters.is_remote === "boolean" ? rawFilters.is_remote : null;      // boolean
    const notSeen = rawFilters.not_seen === true;                   // boolean (وظائف لم تُشاهد)

    const createdAtGte = publishKey ? dateFromBucket(publishKey) : null;

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

    // ===== base match =====
    const match = {
      status: true,
      is_accepted: true,
      ...(countryId && { countries: countryId }),
      ...(tokens.length && { keywords_norm: { $in: tokens } }),
      ...(companyIds.length && { company_id: companyIds[0] }), // select_one
      ...(typeIds.length && { jop_type_id: { $in: typeIds } }),
      ...(createdAtGte && { createdAt: { $gte: createdAtGte } }),
      ...(isRemote === true && { is_remote: true }),
      ...(isRemote === false && { is_remote: false }),
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
          pipeline: [{ $project: { company_name: 1, image: 1 } }]
        }
      },
      { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: JOP_TYPE_COLL,
          localField: "jop_type_id",
          foreignField: "_id",
          as: "jop_type",
          pipeline: [{ $project: { [`title_${lan}`]: 1 } }]
        }
      },
      { $unwind: { path: "$jop_type", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          company_name: "$company.company_name",
          company_image: "$company.image",
          job_type_title: `$jop_type.title_${lan}`,
          _kwScore: tokens.length
            ? { $size: { $setIntersection: [{ $ifNull: ["$keywords_norm", []] }, tokens] } }
            : 0
        }
      },
    ];

    // فلتر "غير مُشاهدة" عبر user_show_job
    const seenFilter = (notSeen && userId)
      ? [
        {
          $lookup: {
            from: USS_COLL, // user_show_job
            let: { jid: "$._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$job_id", "$$jid"] },
                      { $eq: ["$user_id", userId] }
                    ]
                  }
                }
              },
              { $limit: 1 }
            ],
            as: "seenHit"
          }
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
          jop_type_id: 1,
          createdAt: 1,
          is_remote: 1,
          countries: 1,
          company: "$company_name",
          company_image: 1,
          job_type: "$job_type_title",
        }
      },
    ];
    // ===== check saved jobs =====
    const savedJoin = userId
      ? [
        {
          $lookup: {
            from: UserSavedJobModel.collection.name,
            let: { jid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$job_id", "$$jid"] },
                      { $eq: ["$user_id", userId] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "savedHit",
          },
        },
        {
          $addFields: {
            is_saved: { $cond: [{ $gt: [{ $size: "$savedHit" }, 0] }, true, false] },
          },
        },
        { $project: { savedHit: 0 } },
      ]
      : [];
    // ===== facets (بدون عدّادات) =====
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
        { $match: { jop_type_id: { $type: "objectId" } } },
        { $group: { _id: "$jop_type_id", title: { $first: "$job_type" } } },
        { $sort: { title: 1 } },
        { $limit: 100 },
      ];
      // remote/publish_date/not_seen خيارات ثابتة
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
      is_saved: !!it.is_saved, // جديد
    }));

    const other = {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    if (page === 1 && !req.query.filters) {
      // خيارات الفلاتر
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

      const notSeenOpts = [
        { value: true, label: L.not_seen_true },
      ];

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

    if (!isValidObjectId(id)) {
      return ReturnAppData.getError({ res, code: 400, message: "invalid id" });
    }

    const job = await jobsModel.findOne(
      { _id: id, status: true, is_accepted: true },
      "job_name description jop_type_id jop_type_info jop_time_id jop_time_info jop_salary_id jop_salary_info currency_id company_id is_out_side out_link"
    ).lean();

    if (!job) {
      return ReturnAppData.getError({ res, code: 404, message: "Job not found" });
    }

    const serviceIds = Array.isArray(job.jop_service)
      ? job.jop_service.filter(Boolean).map(v => (typeof v === "string" ? new Types.ObjectId(v) : v))
      : [];

    const [salary, currency, workTime, services, company, jopType] = await Promise.all([
      job.jop_salary_id ? JopSalaryModel.findById(job.jop_salary_id).lean() : null,
      job.currency_id ? CurrencyModel.findById(job.currency_id).lean() : null,
      job.jop_time_id ? WorkTimeTypeModel.findById(job.jop_time_id).lean() : null,
      serviceIds.length ? JopServiceModel.find({ _id: { $in: serviceIds } }).lean() : [],
      job.company_id ? CompanyModel.findById(job.company_id).lean() : null,
      job.jop_type_id ? JopTypeModel.findById(job.jop_type_id).lean() : null,
    ]);

    const response = {
      id: job._id,
      title: job.job_name || "",
      description: job.description || "",
      job_type: jopType?.[`title_${lan}`] || null,
      jop_type_info: job.jop_type_info ?? null,
      salary_type: salary?.[`title_${lan}`] || null,
      currency: currency
        ? {
          title: currency[`name_${lan}`] ?? null,
          symbol: currency[`symbol_${lan}`] ?? null,
          code: currency.code ?? null,
        }
        : null,
      jop_time: workTime ? { title: workTime[`title_${lan}`] ?? null } : null,
      jop_time_info: job.jop_time_info ?? null,
      jop_salary_info: job.jop_salary_info ?? null,
      is_out_side: !!job.is_out_side,
      out_link: job.out_link || null,
      jop_services: (services || []).map(s => ({ title: s?.[`title_${lan}`] || null })),
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