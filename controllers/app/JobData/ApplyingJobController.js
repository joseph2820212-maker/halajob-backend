import mongoose from "mongoose";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  jobsModel,
  EmployeeCvModel,
  EmployeeModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  JobEmployeeMatchModel,
} from "../../../models/index.js";
import { calculateJobEmployeeMatch } from "../../../services/matching/jobEmployeeMatching.js";
import { calculateAtsApplicationResult } from "../../../services/matching/atsScoring.service.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";
import { ApplicationStatusHistoryModel } from "../../../models/index.js";
import { job_applied_notification } from "../../../notification/JobCompanyNotifications.js";

const { Types } = mongoose;

const toObjectId = (value) =>
  mongoose.isValidObjectId(String(value || "")) ? new Types.ObjectId(String(value)) : null;

const cleanText = (value = "") => String(value || "").trim();
const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const getId = (value) => value?._id || value?.id || value || null;

const publicJobFilter = () => {
  const now = new Date();

  return {
    status: true,
    is_accepted: true,
    publish_status: { $in: ["published", null] },
    $and: [
      { $or: [{ started_date: null }, { started_date: { $lte: now } }] },
      { $or: [{ end_date: null }, { end_date: { $gte: now } }] },
      { $or: [{ apply_deadline: null }, { apply_deadline: { $gte: now } }] },
    ],
  };
};

const msg = (req, ar, en) =>
  String(req.get("lan") || "en").toLowerCase().startsWith("ar") ? ar : en;

const isCompanyUser = (user = {}) => {
  const type = cleanText(
    user.user_type ||
      user.type ||
      user.account_type ||
      user.dashboard_type ||
      user.role_name ||
      user.role?.name ||
      user.role?.key
  ).toLowerCase();

  return Boolean(
    user.company ||
      user.company_id ||
      user.companyId ||
      type === "company" ||
      type.includes("company")
  );
};


const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "external", "outside"].includes(normalized)) return true;
    if (["false", "0", "no", "internal", "platform"].includes(normalized)) return false;
  }
  return fallback;
};

const getExternalApplyLink = (job = {}) =>
  cleanText(
    job.out_link ||
      job.outside_link ||
      job.external_link ||
      job.external_url ||
      job.apply_url ||
      job.application_url ||
      ""
  );

const isExternalJob = (job = {}) => {
  const explicit =
    job.is_external ??
    job.is_out_side ??
    job.isOutside ??
    job.outside ??
    job.external;

  if (explicit !== undefined && explicit !== null) {
    return normalizeBoolean(explicit);
  }

  const method = cleanText(job.apply_method || job.application_type).toLowerCase();
  if (["external", "outside", "company_site"].includes(method)) return true;
  if (["internal", "platform"].includes(method)) return false;

  return Boolean(getExternalApplyLink(job));
};

const buildApplyMeta = (job = {}) => {
  const outLink = getExternalApplyLink(job);
  const isExternal = isExternalJob(job);

  return {
    is_external: isExternal,
    is_out_side: isExternal,
    apply_method: isExternal ? "external" : "internal",
    out_link: outLink || null,
  };
};

const hasText = (value) => cleanText(value).length > 0;
const hasArray = (value) => Array.isArray(value) && value.length > 0;

const cvUrlFromRecord = (cv = {}) => {
  const file = cleanText(cv.url || cv.pdf_file || cv.file || cv.path);
  if (!file) return "";
  return file.startsWith("/") || /^https?:\/\//i.test(file) ? file : `/${file.replace(/\\/g, "/")}`;
};

const getActiveCv = (employee = {}) => {
  const cvs = Array.isArray(employee.cvs) ? employee.cvs : [];
  const active =
    cvs.find((cv) => cv.status === "active" && hasText(cv.url)) ||
    cvs.find((cv) => hasText(cv.url)) ||
    null;
  if (!active) return null;
  return { ...active, url: cvUrlFromRecord(active) || active.url };
};

const getEmployee = async (userId) => {
  const employee = await EmployeeModel.findOne({ user_id: userId }).lean();
  if (!employee?._id) return employee;

  const activeCv = getActiveCv(employee);
  if (activeCv) return employee;

  const savedCv = await EmployeeCvModel.findOne({ employee_id: employee._id })
    .sort({ is_default: -1, createdAt: -1 })
    .lean();

  if (!savedCv) return employee;
  return {
    ...employee,
    cvs: [{
      _id: savedCv._id,
      status: savedCv.is_default ? "active" : "saved",
      title: savedCv.title,
      url: cvUrlFromRecord(savedCv),
    }],
  };
};

const getEmployeeCountryId = (employee = {}, user = {}, job = {}) => {
  const fromEmployee = Array.isArray(employee.preferred_countries)
    ? employee.preferred_countries.find(Boolean)
    : null;

  const fromUser = user.country_id || user.country || null;

  const fromJob = Array.isArray(job.countries)
    ? job.countries.find((item) => mongoose.isValidObjectId(String(item || "")))
    : null;

  return toObjectId(getId(fromEmployee) || getId(fromUser) || getId(fromJob));
};

const buildProfileApplySummary = (employee = {}, user = {}, job = {}) => {
  const activeCv = getActiveCv(employee);

  const existing = [];
  const missing = [];

  const add = ({ key, exists, title, description, priority = "medium", action = null }) => {
    const item = { key, title, description, priority, action };
    if (exists) existing.push(item);
    else missing.push(item);
  };

  add({
    key: "employee_profile",
    exists: Boolean(employee?._id),
    title: "employee_profile",
    description: "employee_profile_required_to_apply",
    priority: "high",
    action: "employee_profile",
  });

  add({
    key: "active_cv",
    exists: Boolean(activeCv),
    title: "active_cv",
    description: "active_cv_required_to_apply",
    priority: job.is_cv_required === false ? "medium" : "high",
    action: "cv",
  });

  add({
    key: "name",
    exists: hasText(user.first_name) || hasText(employee.first_name),
    title: "name",
    description: "name_is_used_in_application",
    priority: "high",
    action: "edit_profile",
  });

  add({
    key: "email",
    exists: hasText(user.email),
    title: "email",
    description: "email_is_used_in_application",
    priority: "high",
    action: "edit_profile",
  });

  add({
    key: "phone",
    exists: hasText(user.phone_code) && hasText(user.phone_national),
    title: "phone",
    description: "phone_is_used_in_application",
    priority: "medium",
    action: "edit_profile",
  });

  add({
    key: "country",
    exists: Boolean(getEmployeeCountryId(employee, user, job)),
    title: "country",
    description: "country_is_taken_from_employee_profile",
    priority: "high",
    action: "job_preferences",
  });

  add({
    key: "skills",
    exists: hasArray(employee.skills),
    title: "skills",
    description: "skills_improve_job_matching",
    priority: "medium",
    action: "skills",
  });

  add({
    key: "languages",
    exists: hasArray(employee.languages),
    title: "languages",
    description: "languages_improve_job_matching",
    priority: "low",
    action: "languages",
  });

  return {
    can_apply:
      Boolean(employee?._id) &&
      Boolean(getEmployeeCountryId(employee, user, job)) &&
      hasText(user.email) &&
      (job.is_cv_required === false || Boolean(activeCv)),
    active_cv: activeCv
      ? {
          id: activeCv._id || null,
          url: activeCv.url,
          fileName: activeCv.fileName || activeCv.title || "",
          status: activeCv.status || "",
        }
      : null,
    existing_items: existing,
    missing_items: missing,
    missing_count: missing.length,
  };
};

const normalizeAnswers = (answers = [], questions = []) => {
  const list = Array.isArray(answers) ? answers : [];

  const byId = new Map(
    list.map((answer) => [String(answer.question_id || answer.id || ""), answer])
  );

  return (questions || [])
    .map((question) => {
      const answer =
        byId.get(String(question._id)) ||
        list.find(
          (item) =>
            cleanText(item.question).toLowerCase() ===
            cleanText(question.question).toLowerCase()
        );

      return {
        question_id: question._id || null,
        question: question.question || answer?.question || "",
        answer: answer?.answer ?? answer?.value ?? null,
      };
    })
    .filter((answer) => answer.question || answer.answer !== null);
};

const missingRequiredAnswers = (answers = [], questions = []) => {
  const answerMap = new Map(
    answers.map((answer) => [String(answer.question_id || ""), answer.answer])
  );

  return (questions || []).filter((question) => {
    if (!question.is_required) return false;

    const value = answerMap.get(String(question._id));

    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || cleanText(value) === "";
  });
};

const getApplyReadiness = async (req, res, next) => {
  try {
    const user = req.user;
    const jobId = toObjectId(req.params.id);

    if (!user?._id) {
      return ReturnAppData.getError({
        res,
        status: 401,
        message: msg(req, "غير مصرح.", "Unauthorized."),
      });
    }

    if (isCompanyUser(user)) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: msg(
          req,
          "حسابات الشركات لا يمكنها التقديم على الوظائف.",
          "Company accounts cannot apply for jobs."
        ),
      });
    }

    if (!jobId) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: msg(req, "معرّف الوظيفة غير صالح.", "Invalid job id."),
      });
    }

    const [job, employee] = await Promise.all([
      jobsModel.findOne({ _id: jobId, ...publicJobFilter() }).lean(),
      getEmployee(user._id),
    ]);

    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: msg(
          req,
          "الوظيفة غير موجودة أو غير متاحة للتقديم.",
          "Job not found or not available for applications."
        ),
      });
    }

    const applyMeta = buildApplyMeta(job);

    if (applyMeta.is_external) {
      return ReturnAppData.getData({
        res,
        data: {
          can_apply: false,
          ...applyMeta,
          questions: [],
          profile: buildProfileApplySummary(employee || {}, user, job),
        },
        message: msg(
          req,
          "هذه الوظيفة خارجية، استخدم رابط التقديم الخارجي.",
          "This is an external job. Use external application flow."
        ),
      });
    }

    const profile = buildProfileApplySummary(employee || {}, user, job);

    return ReturnAppData.getData({
      res,
      data: {
        can_apply: profile.can_apply,
        ...applyMeta,
        questions: (job.questions || []).map((question) => ({
          id: question._id,
          question: question.question,
          type: question.type,
          options: question.options || [],
          is_required: Boolean(question.is_required),
          help_text: question.help_text || "",
        })),
        profile,
      },
      message: "success",
    });
  } catch (error) {
    next(error);
  }
};

const applyJob = async (req, res, next) => {
  try {
    const user = req.user;
    const jobId = toObjectId(req.params.id);

    if (!user?._id) {
      return ReturnAppData.getError({
        res,
        status: 401,
        message: msg(req, "غير مصرح.", "Unauthorized."),
      });
    }

    if (isCompanyUser(user)) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: msg(
          req,
          "حسابات الشركات لا يمكنها التقديم على الوظائف.",
          "Company accounts cannot apply for jobs."
        ),
      });
    }

    if (!jobId) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: msg(req, "معرّف الوظيفة غير صالح.", "Invalid job id."),
      });
    }

    const [job, employee] = await Promise.all([
      jobsModel.findOne({ _id: jobId, ...publicJobFilter() }).lean(),
      getEmployee(user._id),
    ]);

    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: msg(
          req,
          "الوظيفة غير موجودة أو غير متاحة للتقديم.",
          "Job not found or not available for applications."
        ),
      });
    }

    const applyMeta = buildApplyMeta(job);

    if (applyMeta.is_external) {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: msg(
          req,
          "هذه الوظيفة خارجية، استخدم رابط التقديم الخارجي.",
          "This is an external job. Use external application flow."
        ),
        other: applyMeta,
      });
    }

    if (!employee?._id) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: msg(
          req,
          "يجب أن يكون لديك ملف موظف حتى تتمكن من التقديم.",
          "Employee profile is required to apply."
        ),
        other: {
          profile: buildProfileApplySummary({}, user, job),
        },
      });
    }

    const profile = buildProfileApplySummary(employee, user, job);
    const activeCv = profile.active_cv;
    const countryId = getEmployeeCountryId(employee, user, job);

    if (!profile.can_apply) {
      return ReturnAppData.getError({
        res,
        status: 422,
        message: msg(
          req,
          "لا يمكن التقديم قبل إكمال البيانات المطلوبة.",
          "You cannot apply before completing the required profile data."
        ),
        other: { profile },
      });
    }

    const answers = normalizeAnswers(req.body.answers, job.questions || []);
    const missingQuestions = missingRequiredAnswers(answers, job.questions || []);

    if (missingQuestions.length) {
      return ReturnAppData.getError({
        res,
        status: 422,
        message: msg(
          req,
          "يجب الإجابة على الأسئلة المطلوبة.",
          "Required questions must be answered."
        ),
        other: {
          missing_questions: missingQuestions.map((question) => ({
            id: question._id,
            question: question.question,
            type: question.type,
          })),
          profile,
        },
      });
    }

    const coverLetter = cleanText(req.body.cover_letter);

    const matchResult = calculateJobEmployeeMatch(job, employee);
    const atsResult = calculateAtsApplicationResult({ job, employee, answers });
    const initialStatus = atsResult.questions.knockout.has_failed
      ? (atsResult.questions.knockout.action === "reject" && job.ats_settings?.auto_reject_on_knockout ? "rejected" : "not_match")
      : "new";

    const payload = {
      user_id: user._id,
      employee_id: employee._id,
      job_id: job._id,
      company_id: job.company_id,

      first_name: user.first_name || employee.first_name || "Employee",
      last_name: user.last_name || employee.last_name || ".",
      email: user.email,
      phone_code: user.phone_code || "",
      phone_national: user.phone_national || "",
      country_id: countryId,

      answers,
      cover_letter: coverLetter,
      cv: activeCv?.url || "",

      source: "app",
      status: initialStatus,
      status_changed_at: new Date(),
      is_filter: Boolean(matchResult),
      filter_on: Boolean(matchResult),
      filter_result: matchResult
        ? {
            score: matchResult.score,
            matched_skills: matchResult.matched_skills || [],
            missing_skills: matchResult.missing_skills || [],
            reason: "calculated_from_employee_profile",
          }
        : undefined,
      ats_score: atsResult.score,
      ats_summary: atsResult.summary,
      matching_details: atsResult,
      knockout_result: atsResult.questions.knockout,
      rejection_reason_code: initialStatus === "rejected" ? "failed_knockout" : "",
      rejection_reason: initialStatus === "rejected" ? "failed_knockout_question" : "",
      last_activity_at: new Date(),
    };

    let created;

    try {
      created = await UserApplyingJobModel.create(payload);
    } catch (error) {
      if (error?.code === 11000) {
        return ReturnAppData.getError({
          res,
          status: 409,
          message: msg(
            req,
            "لقد قدمت على هذه الوظيفة مسبقاً.",
            "You already applied for this job."
          ),
        });
      }

      throw error;
    }

    await Promise.all([
      ApplicationStatusHistoryModel.create({
        application_id: created._id,
        job_id: job._id,
        company_id: job.company_id,
        user_id: user._id,
        old_status: null,
        new_status: initialStatus,
        changed_by: user._id,
        actor_type: "employee",
        action: "application_created",
        note: atsResult.summary || "application_created_by_candidate",
        metadata: { ats_score: atsResult.score, knockout: atsResult.questions.knockout },
      }).catch(() => null),
      writeAuditLog({
        req,
        companyId: job.company_id,
        actorUserId: user._id,
        actorType: "employee",
        action: "application_created",
        entityType: "application",
        entityId: created._id,
        jobId: job._id,
        applicationId: created._id,
        newValue: { status: initialStatus, ats_score: atsResult.score, knockout: atsResult.questions.knockout },
      }),
      jobsModel.updateOne(
        { _id: job._id },
        {
          $inc: {
            user_applying: 1,
            "search_index.score_signals.applies": 1,
          },
        }
      ),
      matchResult
        ? JobEmployeeMatchModel.findOneAndUpdate(
            { job_id: job._id, employee_id: employee._id },
            {
              job_id: job._id,
              employee_id: employee._id,
              company_id: job.company_id,
              user_id: user._id,
              ...matchResult,
              generated_at: new Date(),
            },
            { upsert: true, setDefaultsOnInsert: true }
          )
        : null,
    ]);

    job_applied_notification(job, created).catch?.(console.error);

    return ReturnAppData.createData({
      res,
      data: {
        application: created,
        profile,
        match: matchResult
          ? {
              score: matchResult.score,
              matched_skills: matchResult.matched_skills || [],
              missing_skills: matchResult.missing_skills || [],
            }
          : null,
      },
      message: msg(req, "تم تقديم الطلب بنجاح.", "Application submitted successfully."),
    });
  } catch (error) {
    next(error);
  }
};

const getAppliedJobs = async (req, res, next) => {
  try {
    const user = req.user;
    const page = parseIntBounded(req.query.page, 1, 1, 100000);
    const limit = parseIntBounded(req.query.limit, 10, 1, 50);
    const skip = (page - 1) * limit;
    const status = cleanText(req.query.status);

    const match = { user_id: new Types.ObjectId(user._id) };
    if (status) match.status = status;

    const [agg] = await UserApplyingJobModel.aggregate([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "jobs",
                localField: "job_id",
                foreignField: "_id",
                as: "job",
                pipeline: [
                  {
                    $project: {
                      job_name: 1,
                      company_id: 1,
                      is_remote: 1,
                      search_projection: 1,
                      salary: 1,
                      apply_deadline: 1,
                      publish_status: 1,
                      is_out_side: 1,
                      is_external: 1,
                      apply_method: 1,
                      out_link: 1,
                      outside_link: 1,
                      external_link: 1,
                      external_url: 1,
                      apply_url: 1,
                      application_url: 1,
                    },
                  },
                ],
              },
            },
            { $set: { job: { $first: "$job" } } },
            {
              $lookup: {
                from: "companies",
                localField: "company_id",
                foreignField: "_id",
                as: "company",
                pipeline: [{ $project: { company_name: 1, image: 1, logo: 1 } }],
              },
            },
            { $set: { company: { $first: "$company" } } },
            {
              $lookup: {
                from: UserSavedJobModel.collection.name,
                let: { jid: "$job_id", uid: "$user_id" },
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
                as: "saved",
              },
            },
            {
              $project: {
                status: 1,
                status_changed_at: 1,
                applied_at: "$createdAt",
                filter_result: 1,
                source: 1,
                cv: 1,
                cover_letter: 1,
                answers: 1,
                job: {
                  id: "$job._id",
                  title: "$job.job_name",
                  is_remote: "$job.is_remote",
                  salary: "$job.salary",
                  apply_deadline: "$job.apply_deadline",
                  publish_status: "$job.publish_status",
                  is_external: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$job.is_external", true] },
                          { $eq: ["$job.is_out_side", true] },
                          { $eq: ["$job.is_out_side", 1] },
                          { $eq: ["$job.apply_method", "external"] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$job.out_link", ""] } }, 0] },
                        ],
                      },
                      true,
                      false,
                    ],
                  },
                  is_out_side: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$job.is_external", true] },
                          { $eq: ["$job.is_out_side", true] },
                          { $eq: ["$job.is_out_side", 1] },
                          { $eq: ["$job.apply_method", "external"] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$job.out_link", ""] } }, 0] },
                        ],
                      },
                      true,
                      false,
                    ],
                  },
                  apply_method: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$job.is_external", true] },
                          { $eq: ["$job.is_out_side", true] },
                          { $eq: ["$job.is_out_side", 1] },
                          { $eq: ["$job.apply_method", "external"] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$job.out_link", ""] } }, 0] },
                        ],
                      },
                      "external",
                      "internal",
                    ],
                  },
                  out_link: {
                    $ifNull: [
                      "$job.out_link",
                      {
                        $ifNull: [
                          "$job.outside_link",
                          {
                            $ifNull: [
                              "$job.external_link",
                              {
                                $ifNull: [
                                  "$job.external_url",
                                  { $ifNull: ["$job.apply_url", "$job.application_url"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                company: {
                  id: "$company._id",
                  name: "$company.company_name",
                  image: { $ifNull: ["$company.image", "$company.logo"] },
                },
                is_saved: { $gt: [{ $size: "$saved" }, 0] },
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]).allowDiskUse(true);

    const items = agg?.items || [];
    const total = agg?.meta?.[0]?.total || 0;

    return ReturnAppData.getData({
      res,
      data: items,
      other: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_more: page * limit < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { applyJob, getApplyReadiness, getAppliedJobs };
