import mongoose from "mongoose";
import XLSX from "xlsx";
import {
  ApplicationStatusHistoryModel,
  EmployeeModel,
  InterviewModel,
  JobInvitationModel,
  UserApplyingJobModel,
} from "../../../models/index.js";

import {
  fail,
  getCompanyUserIdOrFail,
  normalizeApplication,
  normalizeInterview,
  paginate,
  success,
} from "../../../helper/companyDash/companyDashHelpers.js";

import {
  collectApplicationCvEntries,
  createZipBuffer,
  findCvEntry,
  makeZipEntryName,
  sanitizeCvEntries,
  sendCvFile,
} from "../../../helper/companyDash/secureCvDownloadHelpers.js";

import {
  APPLICATION_STATUSES,
  INTERVIEW_STATUSES,
  INVITATION_STATUSES,
  buildApplicationsFilter,
  buildApplicationsSort,
  buildInterviewPayload,
  buildInterviewsFilter,
  buildInvitationsFilter,
  cleanText,
  ensureObjectId,
  findEmployeeForInvitationOrFail,
  getOwnedApplicationOrFail,
  getOwnedInterviewOrFail,
  getOwnedInvitationOrFail,
  getOwnedJobOrFail,
  normalizeApplicant,
  normalizeCompanyInvitation,
  normalizeCompanyJobActivitySummary,
  normalizeCompanyReviewItem,
  paginateApplications,
  populateApplicationQuery,
  toDateOrNull,
  toNumber,
} from "../../../helper/companyDash/companyJobHiringHelpers.js";

const withTransaction = async (handler) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await handler(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const createStatusHistory = async ({ application, oldStatus, newStatus, companyData, note = "", session = null }) => {
  return ApplicationStatusHistoryModel.create(
    [
      {
        application_id: application._id,
        job_id: application.job_id,
        company_id: application.company_id,
        user_id: application.user_id,
        old_status: oldStatus || null,
        new_status: newStatus,
        changed_by: companyData?.userId || null,
        actor_type: "company",
        note,
      },
    ],
    session ? { session } : undefined
  );
};

const parseArrayBody = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    }
  }
  return [value];
};

const applicationCvFiles = (application) => sanitizeCvEntries(collectApplicationCvEntries(application));

const normalizeApplicationWithCvMeta = (application) => {
  const normalized = normalizeApplication(application);
  const cvFiles = applicationCvFiles(application);
  return {
    ...normalized,
    has_cv: cvFiles.length > 0,
    cv_files_count: cvFiles.length,
    cv_files: cvFiles,
  };
};

const normalizeApplicantWithCvMeta = (application) => {
  const normalized = normalizeApplicant(application);
  const cvFiles = applicationCvFiles(application);
  return {
    ...normalized,
    application: {
      ...normalized.application,
      has_cv: cvFiles.length > 0,
      cv_files_count: cvFiles.length,
      cv_files: cvFiles,
    },
    cv_files_count: cvFiles.length,
    cv_files: cvFiles,
  };
};

const applicationExportRow = (application, index = 1) => {
  const applicant = application.user_id || {};
  const employee = application.employee_id || {};
  const answers = (application.answers || [])
    .map((item, answerIndex) => `${answerIndex + 1}. ${item.question || ""}: ${Array.isArray(item.answer) ? item.answer.join(", ") : item.answer ?? ""}`)
    .join("\n");

  return {
    "#": index,
    application_id: String(application._id || ""),
    job_name: application.job_id?.job_name || "",
    status: application.status || "",
    applied_at: application.createdAt ? new Date(application.createdAt).toISOString() : "",
    applicant_name: [applicant.first_name || application.first_name, applicant.mid_name, applicant.last_name || application.last_name].filter(Boolean).join(" "),
    email: application.email || applicant.email || "",
    phone: [application.phone_code || applicant.phone_code, application.phone_national || applicant.phone_national].filter(Boolean).join(" "),
    candidate_stage: employee.candidate_stage || "",
    experience_years: employee.experience_years ?? "",
    profile_headline: employee.profile_headline || "",
    current_job_title: employee.current_job_title || "",
    cover_letter: application.cover_letter || "",
    answers,
    cv_files_count: applicationCvFiles(application).length,
  };
};

const buildBulkApplicationsFilter = async (req, res, companyData) => {
  const body = req.body || {};
  const rawIds = parseArrayBody(body.application_ids || body.applications || body.ids);
  const ids = rawIds.map((id) => String(id?._id || id || "").trim()).filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (ids.length) {
    return { _id: { $in: ids }, company_id: companyData.company._id };
  }

  const filter = buildApplicationsFilter(companyData.company._id, { ...req.query, ...body });
  const jobId = body.job_id || req.query.job_id || req.params.jobId;
  if (jobId) {
    const job = await getOwnedJobOrFail(req, res, companyData.company._id, jobId, "_id");
    if (!job) return null;
    filter.job_id = job._id;
  }

  return filter;
};

export const getHiringSummary = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const companyId = companyData.company._id;
    const now = new Date();

    const [applications, waiting, interview, offer, accepted, rejected, interviews, upcomingInterviews, invitations, sentInvitations, acceptedInvitations] = await Promise.all([
      UserApplyingJobModel.countDocuments({ company_id: companyId }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "waiting" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "interview" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "offer" }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: { $in: ["accepted", "hired"] } }),
      UserApplyingJobModel.countDocuments({ company_id: companyId, status: "rejected" }),
      InterviewModel.countDocuments({ company_id: companyId }),
      InterviewModel.countDocuments({ company_id: companyId, start_at: { $gte: now }, status: { $in: ["scheduled", "rescheduled"] } }),
      JobInvitationModel.countDocuments({ company_id: companyId }),
      JobInvitationModel.countDocuments({ company_id: companyId, status: "sent" }),
      JobInvitationModel.countDocuments({ company_id: companyId, status: "accepted" }),
    ]);

    return success(
      res,
      normalizeCompanyJobActivitySummary({
        applications,
        waiting,
        interview,
        offer,
        accepted,
        rejected,
        interviews,
        upcomingInterviews,
        invitations,
        sentInvitations,
        acceptedInvitations,
      }),
      "company_hiring_summary"
    );
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildApplicationsFilter(companyData.company._id, req.query);

    if (req.params.jobId) {
      const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.params.jobId, "_id");
      if (!job) return;
      filter.job_id = job._id;
    }

    const result = await paginateApplications(req, filter, buildApplicationsSort(req.query));
    return success(res, result.items.map(normalizeApplicationWithCvMeta), "applications", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getApplicants = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildApplicationsFilter(companyData.company._id, req.query);

    if (req.params.jobId) {
      const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.params.jobId, "_id");
      if (!job) return;
      filter.job_id = job._id;
    }

    const result = await paginateApplications(req, filter, buildApplicationsSort(req.query));
    return success(res, result.items.map(normalizeApplicantWithCvMeta), "applicants", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getApplicationDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!ensureObjectId(res, applicationId, "invalid_application_id")) return;

    const application = await populateApplicationQuery(
      UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id })
    ).lean();

    if (!application) return fail(res, "application_not_found", 404);

    const [interviews, invitation, histories] = await Promise.all([
      InterviewModel.find({ application_id: applicationId, company_id: companyData.company._id }).sort({ start_at: -1 }).lean(),
      JobInvitationModel.findOne({
        job_id: application.job_id?._id || application.job_id,
        user_id: application.user_id?._id || application.user_id,
        company_id: companyData.company._id,
      })
        .sort({ createdAt: -1 })
        .lean(),
      ApplicationStatusHistoryModel.find({ application_id: applicationId, company_id: companyData.company._id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return success(
      res,
      {
        ...normalizeApplicantWithCvMeta(application),
        interviews: interviews.map(normalizeInterview),
        invitation: invitation ? normalizeCompanyInvitation(invitation) : null,
        histories,
      },
      "application_details"
    );
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.params.applicationId);
    if (!application) return;

    const status = cleanText(req.body.status);
    if (!APPLICATION_STATUSES.has(status)) return fail(res, "invalid_application_status", 422);

    const oldStatus = application.status;
    application.status = status;
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();

    await withTransaction(async (session) => {
      await application.save({ session });
      await createStatusHistory({
        application,
        oldStatus,
        newStatus: status,
        companyData,
        note: cleanText(req.body.note),
        session,
      });
    });

    return success(res, normalizeApplication(application), "application_status_updated");
  } catch (error) {
    next(error);
  }
};

export const createInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.body.application_id || req.params.applicationId);
    if (!application) return;

    const { payload, error } = buildInterviewPayload({ body: req.body, companyData, application });
    if (error) return fail(res, error, 422);

    let interview;
    await withTransaction(async (session) => {
      [interview] = await InterviewModel.create([payload], { session });

      const oldStatus = application.status;
      application.status = "interview";
      application.status_changed_at = new Date();
      application.last_activity_at = new Date();
      await application.save({ session });

      await createStatusHistory({
        application,
        oldStatus,
        newStatus: "interview",
        companyData,
        note: cleanText(req.body.company_note || req.body.note || "interview_scheduled"),
        session,
      });
    });

    const populated = await InterviewModel.findById(interview._id)
      .populate({ path: "job_id", select: "job_name city salary" })
      .populate({ path: "application_id", select: "first_name last_name email phone_code phone_national status" })
      .populate({ path: "employee_user_id", select: "first_name mid_name last_name email image" })
      .lean();

    return success(res, normalizeInterview(populated || interview), "interview_created", 201);
  } catch (error) {
    next(error);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildInterviewsFilter(companyData.company._id, req.query);

    const result = await paginate(InterviewModel, filter, req, {
      sort: { start_at: req.query.upcoming === "true" ? 1 : -1, _id: -1 },
      populate: [
        { path: "job_id", select: "job_name city salary" },
        { path: "application_id", select: "first_name last_name email phone_code phone_national status" },
        { path: "employee_user_id", select: "first_name mid_name last_name email image" },
      ],
      lean: true,
    });

    return success(res, result.items.map(normalizeInterview), "interviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const interview = await getOwnedInterviewOrFail(req, res, companyData.company._id, req.params.interviewId);
    if (!interview) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, interview.application_id);
    if (!application) return;

    const { payload, error } = buildInterviewPayload({ body: req.body, companyData, application, oldInterview: interview });
    if (error) return fail(res, error, 422);

    const willReschedule = payload.start_at && String(payload.start_at) !== String(interview.start_at);
    Object.assign(interview, payload);
    if (willReschedule) {
      interview.status = "rescheduled";
      interview.reschedule_count = Number(interview.reschedule_count || 0) + 1;
    }

    await interview.save();
    return success(res, normalizeInterview(interview), "interview_updated");
  } catch (error) {
    next(error);
  }
};

export const changeInterviewStatus = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const interview = await getOwnedInterviewOrFail(req, res, companyData.company._id, req.params.interviewId);
    if (!interview) return;

    const status = cleanText(req.body.status);
    if (!INTERVIEW_STATUSES.has(status)) return fail(res, "invalid_interview_status", 422);

    interview.status = status;
    if (req.body.result_note !== undefined) interview.result_note = cleanText(req.body.result_note);
    if (req.body.rating !== undefined) interview.rating = toNumber(req.body.rating, null);
    await interview.save();

    return success(res, normalizeInterview(interview), "interview_status_updated");
  } catch (error) {
    next(error);
  }
};

export const sendJobInvitation = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const job = await getOwnedJobOrFail(req, res, companyData.company._id, req.body.job_id || req.params.jobId, "_id job_name company_id");
    if (!job) return;

    const employee = await findEmployeeForInvitationOrFail(req, res);
    if (!employee) return;

    const userId = employee.user_id?._id || employee.user_id;
    if (!userId) return fail(res, "employee_user_not_found", 422);

    const expiresAt = toDateOrNull(req.body.expires_at || req.body.expiresAt);

    const invitation = await JobInvitationModel.findOneAndUpdate(
      { job_id: job._id, employee_id: employee._id },
      {
        $set: {
          company_id: companyData.company._id,
          job_id: job._id,
          employee_id: employee._id,
          user_id: userId,
          sent_by: companyData.userId,
          status: "sent",
          message: cleanText(req.body.message),
          salary_offer: req.body.salary_offer || req.body.salaryOffer || undefined,
          starts_at: toDateOrNull(req.body.starts_at || req.body.startsAt),
          expires_at: expiresAt,
          responded_at: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate({ path: "job_id", select: "job_name city salary company_id" })
      .populate({ path: "employee_id", select: "user_id profile_headline current_job_title experience_years" })
      .populate({ path: "user_id", select: "first_name mid_name last_name email image" });

    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_sent", 201);
  } catch (error) {
    if (error?.code === 11000) return fail(res, "job_invitation_already_exists", 409);
    next(error);
  }
};

export const getJobInvitations = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildInvitationsFilter(companyData.company._id, req.query);

    const result = await paginate(JobInvitationModel, filter, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [
        { path: "job_id", select: "job_name city salary company_id" },
        { path: "employee_id", select: "user_id profile_headline current_job_title experience_years" },
        { path: "user_id", select: "first_name mid_name last_name email image" },
      ],
      lean: true,
    });

    return success(res, result.items.map(normalizeCompanyInvitation), "job_invitations", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getJobInvitationDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const invitation = await JobInvitationModel.findOne({ _id: req.params.invitationId, company_id: companyData.company._id })
      .populate({ path: "job_id", select: "job_name city salary company_id" })
      .populate({
        path: "employee_id",
        select: "user_id profile_headline current_job_title about_me candidate_stage experience_years profile_completion skills languages education experience cvs links expected_salary",
        populate: [
          { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
          { path: "skills.skill_id" },
          { path: "languages.language_id" },
          { path: "education.education_level_id" },
        ],
      })
      .populate({ path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" })
      .lean();

    if (!invitation) return fail(res, "job_invitation_not_found", 404);

    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_details");
  } catch (error) {
    next(error);
  }
};

export const cancelJobInvitation = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const invitation = await getOwnedInvitationOrFail(req, res, companyData.company._id, req.params.invitationId);
    if (!invitation) return;

    if (!["sent", "seen"].includes(invitation.status)) {
      return fail(res, "only_pending_invitation_can_be_cancelled", 422);
    }

    invitation.status = "cancelled";
    invitation.responded_at = new Date();
    await invitation.save();

    return success(res, normalizeCompanyInvitation(invitation), "job_invitation_cancelled");
  } catch (error) {
    next(error);
  }
};


export const getApplicationCv = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { applicationId } = req.params;
    if (!ensureObjectId(res, applicationId, "invalid_application_id")) return;

    const application = await populateApplicationQuery(
      UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyData.company._id })
    ).lean();

    if (!application) return fail(res, "application_not_found", 404);

    const entries = collectApplicationCvEntries(application);
    const selectedCv = findCvEntry(entries, req.query);

    if (!selectedCv) return fail(res, "cv_not_found", 404);

    const sent = await sendCvFile({
      res,
      cvEntry: selectedCv,
      fallbackName: selectedCv.fileName || `application-${applicationId}.pdf`,
      inline: req.query.inline === "true",
    });

    if (!sent) return fail(res, "cv_file_not_found", 404);

    await UserApplyingJobModel.updateOne(
      { _id: application._id, company_id: companyData.company._id },
      { $set: { cv_download: true, last_activity_at: new Date() } }
    );
  } catch (error) {
    next(error);
  }
};

export const blockApplicationApplicant = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const application = await getOwnedApplicationOrFail(req, res, companyData.company._id, req.params.applicationId);
    if (!application) return;

    const employeeId = application.employee_id || req.body.employee_id;
    const note = cleanText(req.body.note || "blocked_by_company");

    let employee = null;
    if (employeeId && mongoose.Types.ObjectId.isValid(String(employeeId))) {
      employee = await EmployeeModel.findByIdAndUpdate(
        employeeId,
        { $addToSet: { blocked_companies: companyData.company._id } },
        { new: true }
      );
    }

    const oldStatus = application.status;
    application.status = "rejected";
    application.status_changed_at = new Date();
    application.last_activity_at = new Date();

    await withTransaction(async (session) => {
      await application.save({ session });
      await createStatusHistory({
        application,
        oldStatus,
        newStatus: "rejected",
        companyData,
        note,
        session,
      });
    });

    return success(res, {
      application: normalizeApplication(application),
      employee_blocked: Boolean(employee),
      employee_id: employee?._id || employeeId || null,
    }, "applicant_blocked");
  } catch (error) {
    next(error);
  }
};


export const bulkApplicationCvs = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = await buildBulkApplicationsFilter(req, res, companyData);
    if (!filter) return;

    const limit = Math.min(Math.max(Number(req.body?.limit || req.query.limit || 500), 1), 1000);
    const applications = await populateApplicationQuery(
      UserApplyingJobModel.find(filter).sort(buildApplicationsSort({ ...req.query, ...req.body })).limit(limit)
    ).lean();

    const zipFiles = [];
    applications.forEach((application, appIndex) => {
      const entries = collectApplicationCvEntries(application);
      entries.forEach((entry, cvIndex) => {
        zipFiles.push({
          ...entry,
          zipName: makeZipEntryName({
            application,
            cvEntry: entry,
            index: zipFiles.length + 1 || appIndex + cvIndex + 1,
          }),
        });
      });
    });

    if (!zipFiles.length) return fail(res, "cv_not_found", 404);

    const zipBuffer = await createZipBuffer(zipFiles);
    if (!zipBuffer.length) return fail(res, "cv_file_not_found", 404);

    const applicationIds = applications.map((application) => application._id);
    if (applicationIds.length) {
      await UserApplyingJobModel.updateMany(
        { _id: { $in: applicationIds }, company_id: companyData.company._id },
        { $set: { cv_download: true, last_activity_at: new Date() } }
      );
    }

    const fileName = `jobzain-cvs-${Date.now()}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader("Content-Length", zipBuffer.length);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

export const bulkExportApplications = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = await buildBulkApplicationsFilter(req, res, companyData);
    if (!filter) return;

    const limit = Math.min(Math.max(Number(req.body?.limit || req.query.limit || 500), 1), 1000);
    const applications = await populateApplicationQuery(
      UserApplyingJobModel.find(filter).sort(buildApplicationsSort({ ...req.query, ...req.body })).limit(limit)
    ).lean();

    if (req.query.format === "json" || req.body?.format === "json") {
      return success(
        res,
        {
          count: applications.length,
          items: applications.map((application) => ({
            ...normalizeApplicantWithCvMeta(application),
            cv_files: applicationCvFiles(application),
          })),
        },
        "applications_export"
      );
    }

    const rows = applications.map(applicationExportRow);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "applications");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const fileName = `jobzain-applications-${Date.now()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getCompanyJobReviews = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const job = req.params.jobId
      ? await getOwnedJobOrFail(req, res, companyData.company._id, req.params.jobId, "_id")
      : null;
    if (req.params.jobId && !job) return;

    const jobIds = req.params.jobId
      ? [job._id]
      : await mongoose.model("jobs").find({ company_id: companyData.company._id }).distinct("_id");

    const filter = { job_id: { $in: jobIds } };
    const result = await paginate(mongoose.model("user_reviews_jobs"), filter, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: [
        { path: "job_id", select: "job_name company_id" },
        { path: "user_id", select: "first_name mid_name last_name email image" },
      ],
      lean: true,
    });

    return success(res, result.items.map(normalizeCompanyReviewItem), "company_job_reviews", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export default {
  getHiringSummary,
  getJobApplications,
  getApplicants,
  getApplicationDetails,
  updateApplicationStatus,
  getApplicationCv,
  bulkApplicationCvs,
  bulkExportApplications,
  blockApplicationApplicant,
  createInterview,
  getInterviews,
  updateInterview,
  changeInterviewStatus,
  sendJobInvitation,
  getJobInvitations,
  getJobInvitationDetails,
  cancelJobInvitation,
  getCompanyJobReviews,
};
