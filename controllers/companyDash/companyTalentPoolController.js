import mongoose from "mongoose";
import {
  CompanyCandidateNoteModel,
  CompanyCandidateTagModel,
  CompanySavedCandidateModel,
  EmployeeModel,
  JobInvitationModel,
  UniversityModel,
  UserApplyingJobModel,
  jobsModel,
} from "../../models/index.js";
import {
  fail,
  getCompanyUserIdOrFail,
  paginate,
  success,
} from "../../helper/companyDash/companyDashHelpers.js";
import { sanitizeEmployeeCvs } from "../../helper/companyDash/secureCvDownloadHelpers.js";
import { checkCompanyFeature, recordCompanyUsage } from "../../services/subscriptions/companySubscription.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

const { ObjectId } = mongoose.Types;

const clean = (value = "") => String(value ?? "").trim();
const cleanLower = (value = "") => clean(value).toLowerCase();
const isObjectId = (value) => ObjectId.isValid(String(value || ""));
const toObjectId = (value) => (isObjectId(value) ? new ObjectId(String(value)) : null);
const uniqueTags = (value) => {
  const raw = Array.isArray(value) ? value : clean(value).split(/[,;|\n]+/);
  return [...new Set(raw.map(cleanLower).filter(Boolean).map((tag) => tag.slice(0, 80)))];
};

const candidatePopulate = [
  {
    path: "employee_id",
    select:
      "user_id profile_headline current_job_title about_me candidate_stage experience_years profile_completion expected_salary is_free_for_work work_location profile_visibility skills languages cvs links",
    populate: [
      { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
      { path: "skills.skill_id" },
      { path: "languages.language_id" },
    ],
  },
  { path: "user_id", select: "first_name mid_name last_name email image phone_code phone_national" },
  { path: "source_application_id", select: "first_name last_name email phone_code phone_national status visible_status job_id createdAt" },
  { path: "saved_by", select: "first_name mid_name last_name email image" },
];

const notePopulate = [{ path: "author_user_id", select: "first_name mid_name last_name email image" }];

const personName = (user = {}, fallback = "") =>
  [user.first_name, user.mid_name, user.last_name].map(clean).filter(Boolean).join(" ") || clean(fallback);

const employeeSummary = (employee = {}, userFallback = {}) => {
  const user = employee?.user_id && typeof employee.user_id === "object" ? employee.user_id : userFallback;
  return {
    _id: employee?._id || null,
    user_id: user?._id || employee?.user_id || null,
    name: personName(user, user?.email || ""),
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    image: user?.image || null,
    phone_code: user?.phone_code || "",
    phone_national: user?.phone_national || "",
    profile_headline: employee?.profile_headline || "",
    current_job_title: employee?.current_job_title || "",
    about_me: employee?.about_me || "",
    candidate_stage: employee?.candidate_stage || "unknown",
    experience_years: employee?.experience_years || 0,
    profile_completion: employee?.profile_completion || 0,
    expected_salary: employee?.expected_salary || null,
    is_free_for_work: Boolean(employee?.is_free_for_work),
    work_location: employee?.work_location || "unknown",
    skills: employee?.skills || [],
    languages: employee?.languages || [],
    cvs: sanitizeEmployeeCvs(employee?.cvs || []),
    links: employee?.links || [],
  };
};

const normalizeSavedCandidate = async (candidate, { includeNoteCount = true } = {}) => {
  if (!candidate) return null;
  const item = candidate.toObject?.() || candidate;
  const employee = employeeSummary(item.employee_id, item.user_id);
  const noteCount = includeNoteCount
    ? await CompanyCandidateNoteModel.countDocuments({ company_id: item.company_id, saved_candidate_id: item._id })
    : undefined;
  return {
    _id: item._id,
    company_id: item.company_id,
    source: item.source || "application",
    source_application_id: item.source_application_id?._id || item.source_application_id || null,
    source_application: item.source_application_id && typeof item.source_application_id === "object" ? item.source_application_id : null,
    status: item.status || "active",
    rating: item.rating ?? null,
    tags: item.tags || [],
    saved_by: item.saved_by || null,
    last_contacted_at: item.last_contacted_at || null,
    employee,
    user: item.user_id || employee.user_id || null,
    notes_count: noteCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const normalizeNote = (note) => ({
  _id: note._id,
  note: note.note || "",
  visibility: note.visibility || "team",
  author_user_id: note.author_user_id || null,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const companyActorType = (req) =>
  req.companyAccess?.role === "owner" ? "company_owner" : "company_member";

const activeCampusPartnerMatch = (companyId, now = new Date()) => ({
  company_id: toObjectId(companyId),
  status: "active",
  $and: [
    { $or: [{ expires_at: null }, { expires_at: { $exists: false } }, { expires_at: { $gte: now } }] },
    {
      $or: [
        { access_level: { $exists: false } },
        { access_level: "" },
        { access_level: "talent_pool_limited" },
      ],
    },
  ],
});

const isCampusVisibleToCompany = async (companyId, employee) => {
  const visibility = employee?.student_profile?.campus_visibility || {};
  const universityId = employee?.student_profile?.university_id;
  const blocked = (employee?.blocked_companies || []).some((id) => String(id) === String(companyId));
  if (
    blocked ||
    employee?.is_student !== true ||
    employee?.status !== true ||
    employee?.accepted !== true ||
    employee?.profile_visibility === "private" ||
    employee?.student_profile?.student_email_verified !== true ||
    visibility.talent_pool_opt_in !== true ||
    visibility.visible_to_partner_companies !== true ||
    !isObjectId(universityId)
  ) {
    return false;
  }

  return Boolean(
    await UniversityModel.exists({
      _id: universityId,
      partners: { $elemMatch: activeCampusPartnerMatch(companyId) },
    }),
  );
};

const findEmployeeFromPayload = async (body = {}) => {
  if (isObjectId(body.employee_id || body.employeeId)) {
    return EmployeeModel.findById(body.employee_id || body.employeeId).populate("user_id", "first_name mid_name last_name email image phone_code phone_national");
  }
  if (isObjectId(body.user_id || body.userId)) {
    return EmployeeModel.findOne({ user_id: body.user_id || body.userId }).populate("user_id", "first_name mid_name last_name email image phone_code phone_national");
  }
  return null;
};

const resolveCandidateAccess = async ({ companyId, body = {} }) => {
  const applicationId = body.source_application_id || body.application_id || body.applicationId;
  if (isObjectId(applicationId)) {
    const application = await UserApplyingJobModel.findOne({ _id: applicationId, company_id: companyId });
    if (!application) return { error: "application_not_found", status: 404 };
    const employee = application.employee_id
      ? await EmployeeModel.findById(application.employee_id).populate("user_id", "first_name mid_name last_name email image phone_code phone_national")
      : await EmployeeModel.findOne({ user_id: application.user_id }).populate("user_id", "first_name mid_name last_name email image phone_code phone_national");
    if (!employee) return { error: "employee_not_found", status: 404 };
    return { employee, userId: application.user_id, application, source: "application" };
  }

  const employee = await findEmployeeFromPayload(body);
  if (!employee) return { error: "employee_not_found", status: 404 };
  const userId = employee.user_id?._id || employee.user_id;

  const application = await UserApplyingJobModel.findOne({
    company_id: companyId,
    $or: [{ employee_id: employee._id }, { user_id: userId }],
  });
  if (application) return { employee, userId, application, source: "application" };

  const invitation = await JobInvitationModel.findOne({
    company_id: companyId,
    status: "accepted",
    $or: [{ employee_id: employee._id }, { user_id: userId }],
  });
  if (invitation) return { employee, userId, invitation, source: "invitation" };

  if (await isCampusVisibleToCompany(companyId, employee)) {
    return { employee, userId, source: "campus" };
  }

  return { error: "candidate_not_visible_to_company", status: 403 };
};

const getOwnedSavedCandidate = async (req, res, companyId, candidateId) => {
  if (!isObjectId(candidateId)) {
    fail(res, "invalid_candidate_id", 400);
    return null;
  }
  const candidate = await CompanySavedCandidateModel.findOne({ _id: candidateId, company_id: companyId });
  if (!candidate) {
    fail(res, "saved_candidate_not_found", 404);
    return null;
  }
  return candidate;
};

export const listTalentPool = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = { company_id: companyData.company._id };
    const status = cleanLower(req.query.status);
    if (status && ["active", "archived", "do_not_contact"].includes(status)) filter.status = status;
    const source = cleanLower(req.query.source);
    if (source && ["application", "campus", "manual", "invitation"].includes(source)) filter.source = source;
    const tags = uniqueTags(req.query.tag || req.query.tags);
    if (tags.length) filter.tags = { $all: tags };

    const q = clean(req.query.q || req.query.search);
    if (q) {
      const employeeIds = await EmployeeModel.find({
        $or: [
          { profile_headline: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { current_job_title: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { "matching_profile.searchable_text": new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        ],
      }).distinct("_id");
      filter.employee_id = { $in: employeeIds };
    }

    const result = await paginate(CompanySavedCandidateModel, filter, req, {
      sort: { updatedAt: -1, _id: -1 },
      populate: candidatePopulate,
      lean: true,
    });
    const items = await Promise.all(result.items.map((item) => normalizeSavedCandidate(item)));
    return success(res, items, "talent_pool_candidates", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const saveCandidate = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const access = await resolveCandidateAccess({ companyId: companyData.company._id, body: req.body || {} });
    if (access.error) return fail(res, access.error, access.status || 400);

    const rating = req.body?.rating === undefined || req.body?.rating === "" ? null : Number(req.body.rating);
    if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) return fail(res, "invalid_rating", 422);
    const tags = uniqueTags(req.body?.tags);

    const candidate = await CompanySavedCandidateModel.findOneAndUpdate(
      { company_id: companyData.company._id, employee_id: access.employee._id },
      {
        $setOnInsert: {
          company_id: companyData.company._id,
          employee_id: access.employee._id,
          user_id: access.userId,
          saved_by: companyData.userId,
        },
        $set: {
          source: req.body?.source && ["application", "campus", "manual", "invitation"].includes(cleanLower(req.body.source))
            ? cleanLower(req.body.source)
            : access.source,
          source_application_id: access.application?._id || req.body?.source_application_id || req.body?.application_id || null,
          ...(rating !== null ? { rating } : {}),
          ...(tags.length ? { tags } : {}),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate(candidatePopulate);

    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId: companyData.userId,
      actorType: companyActorType(req),
      action: "talent_pool_candidate_saved",
      entityType: "other",
      entityId: candidate._id,
      newValue: { employee_id: access.employee._id, source: candidate.source },
    });

    recordAnalyticsEvent({
      req,
      event: "talent_pool_candidate_saved",
      userId: companyData.userId,
      companyId: companyData.company._id,
      entityType: "other",
      entityId: candidate._id,
      metadata: { source: candidate.source },
    }).catch(() => null);

    return success(res, await normalizeSavedCandidate(candidate), "talent_pool_candidate_saved", 201);
  } catch (error) {
    if (error?.code === 11000) return fail(res, "candidate_already_saved", 409);
    next(error);
  }
};

export const getCandidateDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const candidate = await CompanySavedCandidateModel.findOne({
      _id: req.params.id,
      company_id: companyData.company._id,
    }).populate(candidatePopulate);
    if (!candidate) return fail(res, "saved_candidate_not_found", 404);

    const [normalized, notes] = await Promise.all([
      normalizeSavedCandidate(candidate),
      CompanyCandidateNoteModel.find({ company_id: companyData.company._id, saved_candidate_id: candidate._id })
        .populate(notePopulate)
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
    ]);

    return success(res, { ...normalized, recent_notes: notes.map(normalizeNote) }, "talent_pool_candidate_details");
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;

    const patch = {};
    const status = cleanLower(req.body?.status);
    if (status) {
      if (!["active", "archived", "do_not_contact"].includes(status)) return fail(res, "invalid_candidate_status", 422);
      patch.status = status;
    }
    if (req.body?.rating !== undefined) {
      const rating = req.body.rating === "" ? null : Number(req.body.rating);
      if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) return fail(res, "invalid_rating", 422);
      patch.rating = rating;
    }
    const tags = uniqueTags(req.body?.tags);
    if (tags.length) patch.tags = tags;
    if (!Object.keys(patch).length) return fail(res, "no_update_fields", 400);

    Object.assign(candidate, patch);
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return success(res, await normalizeSavedCandidate(candidate), "talent_pool_candidate_updated");
  } catch (error) {
    next(error);
  }
};

export const archiveCandidate = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    candidate.status = "archived";
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return success(res, await normalizeSavedCandidate(candidate), "talent_pool_candidate_archived");
  } catch (error) {
    next(error);
  }
};

export const addCandidateNote = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    const noteText = clean(req.body?.note || req.body?.message || req.body?.body);
    if (!noteText) return fail(res, "note_required", 422);

    const note = await CompanyCandidateNoteModel.create({
      company_id: companyData.company._id,
      saved_candidate_id: candidate._id,
      author_user_id: companyData.userId,
      note: noteText,
      visibility: ["team", "owner_only"].includes(cleanLower(req.body?.visibility)) ? cleanLower(req.body.visibility) : "team",
    });
    await note.populate(notePopulate);
    return success(res, normalizeNote(note), "talent_pool_candidate_note_added", 201);
  } catch (error) {
    next(error);
  }
};

export const listCandidateNotes = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    const result = await paginate(CompanyCandidateNoteModel, {
      company_id: companyData.company._id,
      saved_candidate_id: candidate._id,
    }, req, {
      sort: { createdAt: -1, _id: -1 },
      populate: notePopulate,
      lean: true,
    });
    return success(res, result.items.map(normalizeNote), "talent_pool_candidate_notes", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const addCandidateTags = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    const tags = uniqueTags(req.body?.tags || req.body?.tag);
    if (!tags.length) return fail(res, "tag_required", 422);
    for (const tag of tags) {
      await CompanyCandidateTagModel.findOneAndUpdate(
        { company_id: companyData.company._id, name: tag },
        { $setOnInsert: { company_id: companyData.company._id, name: tag, label: tag, created_by: companyData.userId } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
    candidate.tags = [...new Set([...(candidate.tags || []), ...tags])];
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return success(res, await normalizeSavedCandidate(candidate), "talent_pool_candidate_tags_added");
  } catch (error) {
    next(error);
  }
};

export const removeCandidateTag = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    const tag = cleanLower(req.params.tag);
    candidate.tags = (candidate.tags || []).filter((item) => cleanLower(item) !== tag);
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return success(res, await normalizeSavedCandidate(candidate), "talent_pool_candidate_tag_removed");
  } catch (error) {
    next(error);
  }
};

export const inviteCandidateToJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    if (candidate.status === "do_not_contact") return fail(res, "candidate_do_not_contact", 409);

    const jobId = req.body?.job_id || req.body?.jobId;
    if (!isObjectId(jobId)) return fail(res, "invalid_job_id", 400);
    const job = await jobsModel.findOne({ _id: jobId, company_id: companyData.company._id }).select("_id job_name company_id");
    if (!job) return fail(res, "job_not_found", 404);

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_invite_candidates", "invitations", 1);
    if (!subscriptionCheck.allowed) {
      return fail(res, subscriptionCheck.message || "subscription_not_allowed", subscriptionCheck.status || 403);
    }

    const existingInvitation = await JobInvitationModel.findOne({ job_id: job._id, employee_id: candidate.employee_id }).select("_id status");
    const shouldCountInvitationUsage = !existingInvitation || !["sent", "seen"].includes(existingInvitation.status);
    const invitation = await JobInvitationModel.findOneAndUpdate(
      { job_id: job._id, employee_id: candidate.employee_id },
      {
        $set: {
          company_id: companyData.company._id,
          job_id: job._id,
          employee_id: candidate.employee_id,
          user_id: candidate.user_id,
          sent_by: companyData.userId,
          status: "sent",
          message: clean(req.body?.message || "We would like to invite you to apply for this role."),
          salary_offer: clean(req.body?.salary_offer || req.body?.salaryOffer || ""),
          starts_at: req.body?.starts_at ? new Date(req.body.starts_at) : null,
          expires_at: req.body?.expires_at ? new Date(req.body.expires_at) : null,
          responded_at: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    if (shouldCountInvitationUsage) await recordCompanyUsage(companyData.company._id, "invitations", 1);
    candidate.last_contacted_at = new Date();
    await candidate.save();
    return success(res, { invitation, candidate: await normalizeSavedCandidate(candidate) }, "talent_pool_candidate_invited", 201);
  } catch (error) {
    if (error?.code === 11000) return fail(res, "job_invitation_already_exists", 409);
    next(error);
  }
};

export const markDoNotContact = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const candidate = await getOwnedSavedCandidate(req, res, companyData.company._id, req.params.id);
    if (!candidate) return;
    candidate.status = "do_not_contact";
    await candidate.save();
    await candidate.populate(candidatePopulate);
    return success(res, await normalizeSavedCandidate(candidate), "talent_pool_candidate_do_not_contact");
  } catch (error) {
    next(error);
  }
};

export const searchTalentPool = listTalentPool;

export default {
  listTalentPool,
  saveCandidate,
  getCandidateDetails,
  updateCandidate,
  archiveCandidate,
  addCandidateNote,
  listCandidateNotes,
  addCandidateTags,
  removeCandidateTag,
  inviteCandidateToJob,
  markDoNotContact,
  searchTalentPool,
};
