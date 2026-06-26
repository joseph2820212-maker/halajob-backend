import mongoose from "mongoose";
import {
  CompanyModel,
  JobReportModel,
  jobsModel,
} from "../../models/index.js";

const { Types } = mongoose;

export const TRUST_REPORT_REASONS = Object.freeze([
  "fake_job",
  "spam",
  "scam",
  "wrong_information",
  "discrimination",
  "abuse",
  "expired",
  "other",
]);

const SUSPICIOUS_PATTERNS = Object.freeze([
  { key: "payment_request", regex: /\b(pay|payment|fee|deposit|transfer|western union|crypto|bitcoin|wallet)\b/i, penalty: 25 },
  { key: "personal_document_request", regex: /\b(passport|national id|bank statement|bank details|credit card|debit card)\b/i, penalty: 20 },
  { key: "external_chat_only", regex: /\b(whatsapp|telegram|signal|wechat|dm me|message me)\b/i, penalty: 15 },
  { key: "too_good_to_be_true", regex: /\b(no experience required|instant hire|guaranteed income|work only .* hours|earn .* per day)\b/i, penalty: 15 },
]);

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

const toObjectId = (value) => {
  const id = String(value?._id || value || "").trim();
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
};

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const riskLevelForScore = (score) => {
  if (score < 35) return "critical";
  if (score < 55) return "high";
  if (score < 75) return "medium";
  return "low";
};

const reportPenalty = (count) => {
  if (count >= 10) return 35;
  if (count >= 5) return 25;
  if (count >= 2) return 15;
  if (count >= 1) return 8;
  return 0;
};

const salaryFlags = (job = {}) => {
  const flags = [];
  let penalty = 0;
  const salary = job.salary || {};
  const min = Number(salary.min_usd ?? salary.min);
  const max = Number(salary.max_usd ?? salary.max);
  const visible = salary.is_visible !== false && salary.mode !== "hidden";

  if (!visible) return { flags, penalty };
  if (Number.isFinite(min) && min < 0) {
    flags.push("invalid_salary_min");
    penalty += 25;
  }
  if (Number.isFinite(max) && max < 0) {
    flags.push("invalid_salary_max");
    penalty += 25;
  }
  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    flags.push("salary_min_above_max");
    penalty += 30;
  }
  if (Number.isFinite(max) && max > 500000) {
    flags.push("unrealistic_salary_high");
    penalty += 18;
  }
  if (Number.isFinite(max) && max > 0 && Number.isFinite(min) && min > 0 && max / min > 5) {
    flags.push("very_wide_salary_range");
    penalty += 8;
  }

  return { flags, penalty };
};

const suspiciousTextFlags = (job = {}) => {
  const text = normalizeText([
    job.job_name,
    job.description,
    job.job_keywords?.join?.(" "),
    job.out_link,
    job.emails?.join?.(" "),
  ].filter(Boolean).join(" "));
  const flags = [];
  let penalty = 0;

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.regex.test(text)) {
      flags.push(pattern.key);
      penalty += pattern.penalty;
    }
  }

  return { flags, penalty };
};

const duplicateCountForJob = async (job = {}) => {
  const companyId = toObjectId(job.company_id);
  const description = normalizeText(job.description);
  if (!companyId || description.length < 80) return 0;

  return jobsModel.countDocuments({
    _id: { $ne: job._id },
    company_id: companyId,
    description: job.description,
    deleted_at: null,
  });
};

export const calculateJobTrustScore = async (jobInput) => {
  const job =
    typeof jobInput?.populate === "function"
      ? jobInput
      : await jobsModel.findById(jobInput).populate("company_id").lean();

  if (!job) return null;

  const company = job.company_id && typeof job.company_id === "object"
    ? job.company_id
    : await CompanyModel.findById(job.company_id).lean();

  const [reportCount, duplicateCount] = await Promise.all([
    JobReportModel.countDocuments({
      job_id: job._id,
      status: { $in: ["pending", "reviewing", "resolved"] },
    }),
    duplicateCountForJob(job),
  ]);

  let score = 70;
  const flags = [];

  if (company?.is_verified || company?.trust?.is_verified) score += 12;
  else flags.push("company_not_verified");

  if (company?.accepted === true && company?.status === true) score += 8;
  else {
    flags.push("company_not_approved");
    score -= 15;
  }

  if (job.is_out_side && job.out_link) {
    flags.push("external_application_link");
    score -= 6;
  }
  if (job.is_contact_on_emails || job.is_send_emails) {
    flags.push("direct_email_contact");
    score -= 4;
  }

  const salary = salaryFlags(job);
  flags.push(...salary.flags);
  score -= salary.penalty;

  const text = suspiciousTextFlags(job);
  flags.push(...text.flags);
  score -= text.penalty;

  if (reportCount > 0) flags.push("user_reports");
  score -= reportPenalty(reportCount);

  if (duplicateCount > 0) {
    flags.push("duplicate_post_text");
    score -= Math.min(20, duplicateCount * 5);
  }

  if (job.trust?.review_status === "safe") score = Math.max(score, 85);
  if (job.trust?.review_status === "suspended") score = Math.min(score, 20);

  const finalScore = clamp(Math.round(score));
  return {
    score: finalScore,
    risk_level: riskLevelForScore(finalScore),
    flags: [...new Set(flags)],
    report_count: reportCount,
    duplicate_count: duplicateCount,
    review_status: job.trust?.review_status || "unreviewed",
    last_scored_at: new Date(),
  };
};

export const recomputeAndSaveJobTrust = async (jobId) => {
  const score = await calculateJobTrustScore(jobId);
  if (!score) return null;

  await jobsModel.updateOne(
    { _id: jobId },
    {
      $set: {
        "trust.score": score.score,
        "trust.risk_level": score.risk_level,
        "trust.flags": score.flags,
        "trust.report_count": score.report_count,
        "trust.duplicate_count": score.duplicate_count,
        "trust.last_scored_at": score.last_scored_at,
      },
    }
  );

  return score;
};
