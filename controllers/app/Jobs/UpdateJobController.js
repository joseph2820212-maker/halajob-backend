import * as yup from "yup";
import { setLocale } from "yup";
import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { CompanyModel, jobsModel, JobNameModel } from "../../../models/index.js";
import { job_updated_notification } from "../../../notification/JobCompanyNotifications.js";

/* i18n */
const buildLocale = (lan="en") => lan === "ar"
  ? {
      mixed: { required: "${path} مطلوب", notType: "${path} نوع غير صحيح" },
      string: { required: "${path} مطلوب", url: "${path} يجب أن يكون رابطًا صالحًا", email: "${path} يجب أن يكون بريدًا صحيحًا" },
      array: { min: "${path} يجب أن يحوي على الأقل ${min} عنصر" },
      boolean: { isValue: "${path} قيمة غير صحيحة" },
    }
  : undefined;

/* Schema: كل الحقول اختيارية لكن بعلاقات منطقية */
const editSchema = yup.object({
  job_name: yup.string().optional(),
  job_name_id: yup.string().optional(),

  is_remote: yup.boolean().optional(),

  Job_type_id: yup.string().optional(),
  Job_type_info: yup.object().optional(),

  Job_salary_id: yup.string().optional(),
  Job_salary_info: yup.object().optional(),

    languages: yup.array().of(
    yup.object({
      name: yup.string().required(),
      level: yup.number().min(1).max(5).required(),
    })
  ).optional(),
  description: yup.string().optional(),

  countries: yup.array().of(yup.string().trim().min(1)).min(1).optional(),
  currency_id: yup.string().optional(),

  is_send_emails: yup.boolean().optional(),
  emails: yup.array()
    .of(yup.string().trim().email())
    .when("is_send_emails", {
      is: true,
      then: (s) => s.min(1).required(),
      otherwise: (s) => s.optional(),
    }),

  is_cv_required: yup.boolean().optional(),
  is_contact_on_emails: yup.boolean().optional(),

  Job_time_id: yup.string().optional(),
  Job_time_info: yup.object().optional(),

  Job_service: yup.array().of(yup.string()).optional(),

  is_out_side: yup.boolean().optional(),
  show_company_information: yup.boolean().optional(),

  out_link: yup.string().url().when("is_out_side", {
    is: true,
    then: (s) => s.required("out_link مطلوب عند is_out_side=true"),
    otherwise: (s) => s.optional(),
  }),

  questions: yup.array().of(yup.object()).max(5).optional(),
}).noUnknown(true, "حقل غير معروف: ${unknown}");

/* ثوابت وحدود */
const TOK_LIMIT = 200;
const KW_LIMIT  = 40;
const PH_LIMIT  = 120;

/* Utilities */
const AR_DIACRITICS=/[\u0610-\u061A\u064B-\u065F\u0670-\u06ED]/g;
const NON_AR_EN=/[^A-Za-z\u0600-\u06FF0-9\s]/g;
const AR_STOP=new Set(["في","من","على","الى","إلى","عن","أن","إن","او","أو","ثم","كل","كما","كان","كانت","يكون","تكون","هذا","هذه","ذلك","هناك","هنا","هو","هي","هم","هن","ما","ماذا","لم","لن","لا","قد","لقد","مع","بعد","قبل","بين","أين","أي","كيف","لماذا","إنما","أما","أيضا","و","يا","هل"]);
const EN_STOP=new Set(["the","a","an","and","or","but","if","then","else","of","in","on","at","to","for","from","by","is","are","was","were","be","been","being","this","that","these","those","there","here","with","about","as","it","its","i","you","he","she","they","we","not","no","yes","do","does","did","done","have","has","had","can","could","should","would","will","just","also","too","very"]);
const uniqClean = (arr)=>
  Array.from(new Set((arr||[]).flat().filter(Boolean).map(v=>String(v).trim()).filter(v=>v.length>0)));

function normalizeArabic(s=""){return s.replace(AR_DIACRITICS,"").replace(/[\u0622\u0623\u0625]/g,"ا").replace(/\u0649/g,"ي").replace(/\u0640/g,"");}
function normalizeEnglish(s=""){return s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function normalizeMixed(s=""){const t=(s||"").replace(NON_AR_EN," ").replace(/\s+/g," ").trim(); return normalizeEnglish(normalizeArabic(t));}
const AR_PRE=[/^(وال|بال|كال|فال|لل)/,/^(ال)/,/^(و|ف|ب|ك|ل)/];
const AR_SUF=[/(يات|ات|كما|هما)$/,/(تون|تين|ون|ين|ان)$/,/(كما|ها|هم|هن|نا|كم|كن|ي|ك|ه|ة)$/];
function arLightStem(w){let s=w; for(const r of AR_PRE) s=s.replace(r,""); for(const r of AR_SUF) s=s.replace(r,""); return s.replace(/^(?:ال)/,"");}
function tokenizeDeep(text){
  const norm=normalizeMixed(text);
  const raw=norm.split(/\s+/).filter(Boolean);
  const out=[];
  for(const t of raw){
    if(t.length<2) continue;
    const isAr=/[\u0600-\u06FF]/.test(t);
    const isEn=/^[a-z0-9]+$/.test(t);
    if((isAr && AR_STOP.has(t)) || (isEn && EN_STOP.has(t))) continue;
    const stem=isAr? arLightStem(t): t;
    if(stem && stem.length>=2) out.push(stem);
  }
  return out;
}
function uniquePreserve(arr){const s=new Set(); const out=[]; for(const x of arr){ if(!s.has(x)){ s.add(x); out.push(x);} } return out;}
function extractPhrases(tokens,maxPhrases=50){
  const ph=[]; for(let i=0;i<tokens.length;i++){
    const bi=[tokens[i],tokens[i+1]].every(Boolean)? `${tokens[i]} ${tokens[i+1]}`: null;
    const tri=[tokens[i],tokens[i+1],tokens[i+2]].every(Boolean)? `${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`: null;
    if(bi) ph.push(bi); if(tri) ph.push(tri);
  }
  return uniquePreserve(ph).slice(0,maxPhrases);
}
function extractKeywordsDeep(text,{limit=25}={}){
  if(!text) return [];
  const toks=tokenizeDeep(text).slice(0,TOK_LIMIT);
  if(!toks.length) return [];
  const phrases=extractPhrases(toks,50);
  // ترتيب بسيط: طول + تكرار + موقع
  const freq=Object.create(null); const N=toks.length||1;
  toks.forEach((t,i)=>{ const base=1; const lenB=Math.min(2,t.length/6); const pos=1+(1-i/N); freq[t]=(freq[t]||0)+base+lenB+pos; });
  phrases.forEach((p,i)=>{ const w=p.split(" ").length; const base=2+Math.min(2,w-1); const pos=1+(1-i/Math.max(1,phrases.length)); freq[p]=(freq[p]||0)+base+pos; });
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([k])=>k).slice(0,limit);
}
function variantsForSearch(arr){ const out=[]; for(const k of arr||[]){ out.push(k); if(/\s/.test(k)) out.push(k.replace(/\s+/g," ")); } return uniquePreserve(out); }

/* حقول محمية */
const PROTECTED_FIELDS = [
  "_id","user_id","company_id",
  "user_saved","user_review","out_side_applying","user_applying",
  "rating","rating_counts","rating_total",
  "createdAt","updatedAt",
];

/* Controller */
export const update = async (req, res) => {
  try {
    const lan = (req.get("lan") || "en").toLowerCase();
    setLocale(buildLocale(lan));

    const jobId = req.params.id;
    if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return ReturnAppData.createError({ res, status: 400, message: lan === "ar" ? "معرّف غير صالح" : "Invalid id" });
    }

    const company = await CompanyModel.findOne({ user_id: req.user._id, status: true, accepted: true }).lean();
    if (!company) {
      return ReturnAppData.createError({
        res,
        message: lan === "ar" ? "لا يمكن تعديل الوظيفة حالياً. يرجى تفعيل حساب الشركة." : "Cannot edit job now. Activate your company account.",
      });
    }

    const job = await jobsModel.findById(jobId).lean();
    if (!job || String(job.company_id) !== String(company._id)) {
      return ReturnAppData.createError({
        res, status: 404,
        message: lan === "ar" ? "الوظيفة غير موجودة أو لا تملك صلاحية تعديلها" : "Job not found or not owned",
      });
    }

    for (const k of PROTECTED_FIELDS) delete req.body[k];

    const payload = await editSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (Object.keys(payload).length === 0) {
      return ReturnAppData.createError({
        res, status: 400,
        message: lan === "ar" ? "لا توجد حقول صالحة للتعديل" : "No valid fields to update",
      });
    }

    // دمج القيم الحالية مع الجديدة لبناء الحقول المشتقة دائمًا
    const merged = {
      ...job,
      ...payload,
    };

    // emails/out_link حسب الأعلام
    const emails =
      merged.is_send_emails && Array.isArray(merged.emails)
        ? uniqClean(merged.emails).map((e) => e.toLowerCase())
        : undefined;
    if (!merged.is_send_emails) merged.emails = undefined;

    const out_link = merged.is_out_side ? merged.out_link : undefined;

    // جلب JobName إن توفر
    let JobNameDoc = null;
    if (merged.job_name_id && mongoose.isValidObjectId(merged.job_name_id)) {
      JobNameDoc = await JobNameModel.findById(merged.job_name_id)
        .select("title_ar title_en keywords keyword")
        .lean();
    }

    // بناء الحقول المشتقة مثل create
    const tokensDesc  = tokenizeDeep(merged.description || "");
    const phrasesDesc = extractPhrases(tokensDesc, PH_LIMIT);
    const descKw      = extractKeywordsDeep(merged.description || "", { limit: KW_LIMIT });

    const JobKeywordsField = Array.isArray(JobNameDoc?.keywords)
      ? JobNameDoc.keywords
      : String(JobNameDoc?.keywords || "").split(",");
    const JobKeywordField2 = Array.isArray(JobNameDoc?.keyword)
      ? JobNameDoc.keyword
      : String(JobNameDoc?.keyword || "").split(",");

    const job_keywords = uniqClean([
      merged.job_name,
      variantsForSearch(descKw),
      JobNameDoc?.title_ar,
      JobNameDoc?.title_en,
      JobKeywordsField,
      JobKeywordField2,
      company.company_name,
      company.company_email,
      company.company_website,
    ]).slice(0, KW_LIMIT);

    const keywords_norm = Array.from(
      new Set([
        ...tokensDesc.slice(0, TOK_LIMIT),
        normalizeMixed(merged.job_name || ""),
      ].filter(Boolean))
    ).slice(0, KW_LIMIT);

    const phrases_norm = phrasesDesc.slice(0, PH_LIMIT);

    // إعداد التحديث
    const setDoc = {
      ...payload,
      emails,
      out_link,
      job_keywords,
      keywords_norm,
      phrases_norm,
      status: false,
      is_update: true,
    };

    const updated = await jobsModel.findOneAndUpdate(
      { _id: jobId, company_id: company._id },
      { $set: setDoc },
      { new: true, runValidators: true }
    );
     job_updated_notification(updated);

    return ReturnAppData.createData({
      res,
      data: updated,
      message: lan === "ar" ? "تم تحديث الوظيفة" : "Job updated",
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
      return ReturnAppData.createError({
        res, status: 422,
        message: lan === "ar" ? "البيانات غير صالحة" : "Invalid payload",
        errors,
      });
    }
    return ReturnAppData.createError({
      res, status: 500,
      message: "Server error",
      errors: e?.message,
    });
  }
};

export default { update };
