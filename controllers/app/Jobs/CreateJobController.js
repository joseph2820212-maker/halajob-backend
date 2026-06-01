// controllers/jobs/create.js
import * as yup from "yup";
import { setLocale } from "yup";
import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel, jobsModel, JobNameModel } from "../../../models/index.js";
import { Job_created_notification } from "../../../notification/JobCompanyNotifications.js";
import { buildCompanyOwnerQuery } from "../../../services/appAccount.service.js";

/* ========== i18n ========== */
const buildLocale = (lan = "en") =>
  lan === "ar"
    ? {
        mixed: { required: "${path} مطلوب", notType: "${path} نوع غير صحيح" },
        string: {
          required: "${path} مطلوب",
          url: "${path} يجب أن يكون رابطًا صالحًا",
          email: "${path} يجب أن يكون بريدًا صحيحًا",
        },
        array: { min: "${path} يجب أن يحوي على الأقل ${min} عنصر" },
        boolean: { isValue: "${path} قيمة غير صحيحة" },
      }
    : undefined;

/* ========== Schema ========== */
const jobSchema = yup
  .object({
    job_name: yup.string().required(),
    job_name_id: yup.string().optional(),
    is_remote: yup.boolean().required(),
    Job_type_id: yup.string().required(),
    Job_type_info: yup.object().optional(),

    Job_salary_id: yup.string().required(),
    Job_salary_info: yup.object().required(),

     languages: yup.array().of(
       yup.object({
         name: yup.string().required(),
         level: yup.number().min(1).max(5).required(),
       })
     ).optional(),
    description: yup.string().required(),

    countries: yup.array().of(yup.string().trim().min(1)).min(1).required(),
    currency_id: yup.string().required(),

    is_send_emails: yup.boolean().required(),
    emails: yup
      .array()
      .of(yup.string().trim().email())
      .when("is_send_emails", {
        is: true,
        then: (s) => s.min(1).required(),
        otherwise: (s) => s.strip().optional(),
      }),

    is_cv_required: yup.boolean().required(),
    is_contact_on_emails: yup.boolean().required(),

    Job_time_id: yup.string().required(),
    Job_time_info: yup.object().optional(),

    Job_service: yup.array().of(yup.string()).optional(),

    is_out_side: yup.boolean().required(),
    show_company_information: yup.boolean().required(),

    out_link: yup.string().url().when("is_out_side", {
      is: true,
      then: (s) => s.required("out_link مطلوب عند is_out_side=true"),
      otherwise: (s) => s.strip().optional(),
    }),

    questions: yup.array().of(yup.object()).max(5).optional(),
  })
  .noUnknown(true, "حقل غير معروف: ${unknown}");

/* ========== Helpers ========== */
const uniqClean = (arr) =>
  Array.from(
    new Set(
      (arr || [])
        .flat()
        .filter(Boolean)
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0)
    )
  );

const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670-\u06ED]/g;
const NON_AR_EN = /[^A-Za-z\u0600-\u06FF0-9\s]/g;

function normalizeArabic(s = "") {
  return s
    .replace(AR_DIACRITICS, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "");
}
function normalizeEnglish(s = "") {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function normalizeMixed(s = "") {
  const t = s.replace(NON_AR_EN, " ").replace(/\s+/g, " ").trim();
  return normalizeEnglish(normalizeArabic(t));
}

const AR_STOP = new Set([
  "في","من","على","الى","إلى","عن","أن","إن","او","أو","ثم","كل","كما","كان","كانت","يكون","تكون",
  "هذا","هذه","ذلك","هناك","هنا","هو","هي","هم","هن","ما","ماذا","لم","لن","لا","قد","لقد","مع",
  "بعد","قبل","بين","أين","أي","كيف","لماذا","إنما","أما","أيضا","و","يا","هل"
]);
const EN_STOP = new Set([
  "the","a","an","and","or","but","if","then","else","of","in","on","at","to","for","from","by",
  "is","are","was","were","be","been","being","this","that","these","those","there","here","with",
  "about","as","it","its","i","you","he","she","they","we","not","no","yes","do","does","did","done",
  "have","has","had","can","could","should","would","will","just","also","too","very"
]);

const AR_PRE = [/^(وال|بال|كال|فال|لل)/, /^(ال)/, /^(و|ف|ب|ك|ل)/];
const AR_SUF = [/(يات|ات|كما|هما)$/,(/(تون|تين|ون|ين|ان)$/),(/(كما|ها|هم|هن|نا|كم|كن|ي|ك|ه|ة)$/)];

function arLightStem(w) {
  let s = w;
  for (const r of AR_PRE) s = s.replace(r, "");
  for (const r of AR_SUF) s = s.replace(r, "");
  return s.replace(/^(?:ال)/, "");
}

function tokenizeDeep(text) {
  const norm = normalizeMixed(text);
  const raw = norm.split(/\s+/).filter(Boolean);
  const out = [];
  for (const t of raw) {
    if (t.length < 2) continue;
    const isAr = /[\u0600-\u06FF]/.test(t);
    const isEn = /^[a-z0-9]+$/.test(t);
    if ((isAr && AR_STOP.has(t)) || (isEn && EN_STOP.has(t))) continue;
    const stem = isAr ? arLightStem(t) : t;
    if (stem && stem.length >= 2) out.push(stem);
  }
  return out;
}

function uniquePreserve(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr) {
    if (!s.has(x)) {
      s.add(x);
      out.push(x);
    }
  }
  return out;
}

function extractPhrases(tokens, maxPhrases = 50) {
  const ph = [];
  for (let i = 0; i < tokens.length; i++) {
    const bi = [tokens[i], tokens[i + 1]].every(Boolean)
      ? tokens[i] + " " + tokens[i + 1]
      : null;
    const tri = [tokens[i], tokens[i + 1], tokens[i + 2]].every(Boolean)
      ? tokens[i] + " " + tokens[i + 1] + " " + tokens[i + 2]
      : null;
    if (bi) ph.push(bi);
    if (tri) ph.push(tri);
  }
  return uniquePreserve(ph).slice(0, maxPhrases);
}

function scoreKeywords(tokens, phrases, { posBoost = true } = {}) {
  const freq = Object.create(null);
  const N = tokens.length || 1;

  tokens.forEach((t, i) => {
    const base = 1;
    const lenBonus = Math.min(2, t.length / 6);
    const pos = posBoost ? 1 + (1 - i / N) : 1;
    freq[t] = (freq[t] || 0) + base + lenBonus + pos;
  });

  phrases.forEach((p, i) => {
    const words = p.split(" ");
    const base = 2 + Math.min(2, words.length - 1);
    const pos = posBoost ? 1 + (1 - i / Math.max(1, phrases.length)) : 1;
    freq[p] = (freq[p] || 0) + base + pos;
  });

  const entries = Object.entries(freq).filter(([k]) => k.length >= 2);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.map(([k]) => k);
}

function extractKeywordsDeep(text, { limit = 25 } = {}) {
  if (!text) return [];
  const tokens = tokenizeDeep(text).slice(0, 200);
  if (!tokens.length) return [];
  const phrases = extractPhrases(tokens, 50);
  const ranked = scoreKeywords(tokens, phrases);
  return ranked.slice(0, limit);
}

function variantsForSearch(arr) {
  const out = [];
  for (const k of arr || []) {
    out.push(k);
    if (/\s/.test(k)) out.push(k.replace(/\s+/g, " "));
  }
  return uniquePreserve(out);
}

/* ========== Limits ========== */
const TOK_LIMIT = 200;
const KW_LIMIT  = 40;   // حجم نهائي قابل للفهرسة
const PH_LIMIT  = 120;

/* ========== Controller ========== */
export const create = async (req, res) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    setLocale(buildLocale(lan));

    const company = await CompanyModel.findOne({
      ...buildCompanyOwnerQuery(req.user._id),
      status: true,
      accepted: true,
    }).lean();

    if (!company) {
      return ReturnAppData.createError({
        res,
        message:
          lan === "ar"
            ? "لا يمكن إضافة وظيفة حالياً. يرجى تفعيل حساب الشركة."
            : "It is not possible to add a job currently. Please activate your company account.",
      });
    }

    const validated = await jobSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const emails =
      validated.is_send_emails && Array.isArray(validated.emails)
        ? uniqClean(validated.emails).map((e) => e.toLowerCase())
        : undefined;

    let JobNameDoc = null;
    if (validated.job_name_id && mongoose.isValidObjectId(validated.job_name_id)) {
      JobNameDoc = await JobNameModel.findById(validated.job_name_id)
        .select("title_ar title_en keywords keyword")
        .lean();
    }

    // توصيف النص
    const tokensDesc  = tokenizeDeep(validated.description).slice(0, TOK_LIMIT);
    const phrasesDesc = extractPhrases(tokensDesc, PH_LIMIT);
    const descKw      = extractKeywordsDeep(validated.description, { limit: KW_LIMIT });

    // مصادر الكلمات
    const JobKeywordsField = Array.isArray(JobNameDoc?.keywords)
      ? JobNameDoc.keywords
      : String(JobNameDoc?.keywords || "").split(",");
    const JobKeywordField2 = Array.isArray(JobNameDoc?.keyword)
      ? JobNameDoc.keyword
      : String(JobNameDoc?.keyword || "").split(",");

    // حقل العرض القديم (حر)
    const job_keywords = uniqClean([
      validated.job_name,
      variantsForSearch(descKw),
      JobNameDoc?.title_ar,
      JobNameDoc?.title_en,
      JobKeywordsField,
      JobKeywordField2,
      company.company_name,
      company.company_email,
      company.company_website,
    ]).slice(0, KW_LIMIT);

    // الحقول القابلة للفهرسة
    const keywords_norm = Array.from(
      new Set(
        [
          ...tokensDesc,
          normalizeMixed(validated.job_name),
        ].filter(Boolean)
      )
    ).slice(0, KW_LIMIT);

    const phrases_norm = phrasesDesc.slice(0, PH_LIMIT);

    const out_link = validated.is_out_side ? validated.out_link : undefined;

    const job = await jobsModel.create({
      ...validated,
      emails,
      out_link,
      job_keywords,         // حر للاستعراض/الفرز البسيط
      keywords_norm,        // للفهرسة والبحث السريع ($all/$in)
      phrases_norm,         // إن احتجت لاحقًا
      company_id: company._id,
      user_id: req.user._id,
    });
Job_created_notification(job);
    return ReturnAppData.createData({
      res,
      data: job,
      message: lan === "ar" ? "تم إنشاء الوظيفة" : "Job created",
    });
  } catch (e) {
   if (e.name === "ValidationError") {
  const lan = (req.get("lan") || "en").toLowerCase();
  const errors = e.inner?.length
    ? e.inner.reduce((acc, curr) => {
        const path = curr.path || "_";
        (acc[path] ||= []).push(curr.message);
        return acc;
      }, {})
    : { _: [e.message] };

  // نص موحد للمستخدم يوضح الحقول المطلوبة
  const missingFields = Object.keys(errors).join(", ");
  const userMessage =
    lan === "ar"
      ? `البيانات غير صالحة. يرجى تعبئة الحقول التالية: ${missingFields}`
      : `Invalid data. Please fill the following fields: ${missingFields}`;

  return ReturnAppData.createError({
    res,
    message: userMessage,
    errors,
  });
}
 
  }
};

export default { create };
