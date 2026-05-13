// controllers/seedJobs.controller.js
import mongoose from "mongoose";
import {
  SheetModel,
  JobNameModel,
  jobsModel,
  CompanyModel,
  CurrencyModel,
  CountryModel,
  JobTypeModel,
  WorkTimeTypeModel,
  JobSalaryModel,
  JobServiceModel,
} from "../../models/index.js";

/* أدوات مساعدة */
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());
const pickMany = (arr, n) => shuffle(arr).slice(0, Math.min(n, arr.length));
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const normalizeTokens = (arr = []) => [...new Set(arr.filter(Boolean).map((s) => String(s).trim().toLowerCase()))];

function randomEmailSimple() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const userLen = 6 + Math.floor(Math.random() * 6);
  let user = "";
  for (let i = 0; i < userLen; i++) user += chars[Math.floor(Math.random() * chars.length)];
  const domains = ["example.com", "mail.com", "test.org", "random.email"];
  return `${user}@${pickOne(domains)}`;
}
function randomLanguages() {
  const all = ["English","Arabic","French","German","Spanish","Italian","Japanese","Chinese","Russian","Portuguese","Korean","Turkish","Dutch","Hindi","Swedish"];
  return pickMany(all, 2 + Math.floor(Math.random() * 5)).map((name) => ({ name, level: 1 + Math.floor(Math.random() * 5) }));
}

/* الإدخال على دفعات */
const BATCH_SIZE = 500; // عدّلها حسب قدرتك

const insert = async (req, res) => {
  try {
    const [
      jobsName, companies, countries, currencies, jobTimes, jobTypes, jobSalaries, jobServices
    ] = await Promise.all([
      JobNameModel.find().lean(),
      CompanyModel.find().lean(),
      CountryModel.find().lean(),
      CurrencyModel.find().lean(),
      WorkTimeTypeModel.find().lean(),
      JobTypeModel.find().lean(),
      JobSalaryModel.find().lean(),
      JobServiceModel.find().lean(),
    ]);

    if (!jobsName.length || !companies.length || !countries.length || !currencies.length ||
        !jobTimes.length || !jobTypes.length || !jobSalaries.length) {
      return res.status(400).json({
        ok: false,
        msg: "نواقص في بيانات المراجع: تأكد من وجود شركات، دول، عملات، أوقات، أنواع، رواتب، ومسميات."
      });
    }

    const started_date = new Date();
    const end_date = addDays(started_date, 100);

    let buffer = [];
    let totalInserted = 0;
    let totalBatches = 0;

    const flush = async () => {
      if (!buffer.length) return;
      const chunk = buffer;
      buffer = [];
      const result = await jobsModel.insertMany(chunk, { ordered: false });
      totalInserted += Array.isArray(result) ? result.length : 0;
      totalBatches += 1;
    };

    for (const jn of jobsName) {
      const allKw = Array.isArray(jn.keywords) ? jn.keywords : [];
      if (!allKw.length) continue;

      const company = pickOne(companies);
      const companyId = company?._id;
      const userId = company?.user_id || pickOne(companies)?.user_id;

      const currency = pickOne(currencies);
      const jType = pickOne(jobTypes);
      const wTime = pickOne(jobTimes);
      const jSalary = pickOne(jobSalaries);
      const services = pickMany(jobServices.map((s) => s?.name || s?.slug || s?._id), 3);
      const pickedCountries = pickMany(countries, 5).map((c) => (c?._id && c._id.toString()) || c?.code || c?.name || String(c));
      const tokens = normalizeTokens(allKw);

     for (const [index, kw] of allKw.entries()) {
        const isRemote = index % 2 === 0;
        const is_send_emails = Math.random() < 0.6;
        const is_out_side = !is_send_emails && Math.random() < 0.5;
        const emails = is_send_emails ? [randomEmailSimple()] : undefined;
        const out_link = is_out_side ? `https://jobs.example.com/${jn.dedupeKey || jn._id}` : "";

        const Job_type_info = { _id: jType._id, name: jType?.name || jType?.title || "type" };
        const Job_time_info = { _id: wTime._id, name: wTime?.name || wTime?.title || "time" };
        const Job_salary_info = {
          _id: jSalary._id,
          name: jSalary?.name || jSalary?.title || "salary",
          min: 500 + Math.floor(Math.random() * 500),
          max: 1500 + Math.floor(Math.random() * 2000),
          period: "monthly",
          currency: currency?._id,
        };

        buffer.push({
          job_name: String(kw),
          job_name_id: jn._id,
          description: (allKw.join(", ") || "general role").slice(0, 2000),
          is_remote: isRemote,
          job_keywords: allKw,
          keywords_norm: tokens,
          phrases_norm: tokens,
          languages: randomLanguages(),

          status: true,
          is_accepted: true,
          started_date,
          end_date,
          ref: `REF-${jn._id}-${index}`,

          currency_id: currency._id,
          countries: pickedCountries,
          Job_type_id: jType._id,
          Job_type_info,
          Job_time_id: wTime._id,
          Job_time_info,
          Job_salary_id: jSalary._id,
          Job_salary_info,

          Job_service: services,

          show_company_information: Math.random() < 0.7,
          is_send_emails,
          is_cv_required: Math.random() < 0.8,
          is_contact_on_emails: is_send_emails,
          emails,

          is_out_side,
          out_link,

          user_show: Math.floor(Math.random() * 1000),
          user_review: Math.floor(Math.random() * 200),
          user_applying: Math.floor(Math.random() * 300),
          out_side_applying: Math.floor(Math.random() * 150),
          user_saved: Math.floor(Math.random() * 500),
          rating: Math.round((Math.random() * 5) * 10) / 10,
          is_update: false,

          questions: pickMany(
            [
              { q: "Years of experience?", type: "number", required: true },
              { q: "Portfolio link", type: "text", required: false },
              { q: "Do you speak English?", type: "boolean", required: true },
              { q: "Earliest start date", type: "date", required: false },
              { q: "Expected salary", type: "number", required: false },
            ],
            1 + Math.floor(Math.random() * 3)
          ),

          company_id: companyId,
          user_id: userId || new mongoose.Types.ObjectId(),
        });

        if (buffer.length >= BATCH_SIZE) {
          // إدخال الدفعة الحالية ثم المتابعة
          // eslint-disable-next-line no-await-in-loop
          await flush();
        }
      };
    }

    // دفعة أخيرة إن وُجدت
    await flush();

    if (!totalInserted) {
      return res.status(200).json({ ok: true, inserted: 0, batches: 0, msg: "لا توجد كلمات مفتاحية لإنشاء وظائف." });
    }

    return res.status(201).json({ ok: true, inserted: totalInserted, batches: totalBatches });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
};

export default { insert };
