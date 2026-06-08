import {
  EmployeeModel,
  JobEmployeeMatchModel,
  JobZainTalentRequestModel,
  UserModel,
} from "../../../models/index.js";
import {
  getCompanyUserIdOrFail,
  success,
  fail,
  paginate,
  isValidObjectId,
} from "../../../helper/companyDash/companyDashHelpers.js";
import {
  employeePopulate,
  buildEmployeeSearchFilter,
  normalizeEmployeeForCompany,
  getJobOrFail,
  buildCandidateFilterFromJob,
  upsertJobEmployeeMatch,
  normalizeTalentRequestPayload,
  normalizeTalentRequest,
  getEmployeeDetailsOrFail,
  toNumber,
  cleanText,
  escapeRegex,
  firstValue,
} from "../../../helper/companyDash/companyTalentSearchHelpers.js";
import {
  checkCompanyFeature,
  recordCompanyUsage,
} from "../../../services/subscriptions/companySubscription.service.js";


const failSubscription = (res, check) => fail(res, check.message || "subscription_not_allowed", check.status || 403, {
  feature: check.feature,
  metric: check.metric,
  limit: check.limit,
  used: check.used,
  requested: check.requested,
});

const parseSort = (value = "") => {
  const allowed = new Set([
    "createdAt",
    "updatedAt",
    "experience_years",
    "profile_completion",
    "current_job_title",
  ]);

  if (!value) return { profile_completion: -1, experience_years: -1, createdAt: -1 };

  const [field, direction = "desc"] = String(value).replace(/^-/, "").split(":");
  if (!allowed.has(field)) return { profile_completion: -1, experience_years: -1, createdAt: -1 };

  const raw = String(value).trim();
  const dir = raw.startsWith("-") || direction === "desc" ? -1 : 1;
  return { [field]: dir, _id: dir };
};

const addUserSearchToEmployeeFilter = async (filter, query = {}) => {
  const search = cleanText(query.search || query.q || query.keyword);
  if (!search) return filter;

  const regex = new RegExp(escapeRegex(search), "i");
  const tokens = search.split(/\s+/).map((x) => cleanText(x)).filter(Boolean);

  const userOr = [
    { first_name: regex },
    { mid_name: regex },
    { last_name: regex },
    { email: regex },
    { phone: regex },
    { phone_e164: regex },
    { phone_national: regex },
  ];

  if (tokens.length > 1) {
    userOr.push({
      $and: tokens.map((token) => ({
        $or: [
          { first_name: new RegExp(escapeRegex(token), "i") },
          { mid_name: new RegExp(escapeRegex(token), "i") },
          { last_name: new RegExp(escapeRegex(token), "i") },
        ],
      })),
    });
  }

  const users = await UserModel.find({ $or: userOr }).select("_id").limit(500).lean();
  const userIds = users.map((user) => user._id);
  if (!userIds.length) return filter;

  const userClause = { user_id: { $in: userIds } };
  if (Array.isArray(filter.$or)) filter.$or.push(userClause);
  else filter.$or = [userClause];

  return filter;
};

export const searchEmployees = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_search_employees", "talent_searches", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const filter = await addUserSearchToEmployeeFilter(
      buildEmployeeSearchFilter(req.query, companyData.company._id),
      req.query
    );

    const result = await paginate(EmployeeModel, filter, req, {
      populate: employeePopulate,
      sort: parseSort(req.query.sort),
    });

    let matchesByEmployee = new Map();
    if (req.query.job_id && isValidObjectId(req.query.job_id) && result.items.length) {
      const matches = await JobEmployeeMatchModel.find({
        job_id: req.query.job_id,
        employee_id: { $in: result.items.map((employee) => employee._id) },
        company_id: companyData.company._id,
      }).lean();
      matchesByEmployee = new Map(matches.map((match) => [String(match.employee_id), match]));
    }

    const items = result.items.map((employee) =>
      normalizeEmployeeForCompany(employee, matchesByEmployee.get(String(employee._id)) || null)
    );

    await recordCompanyUsage(companyData.company._id, "talent_searches", 1);
    return success(res, items, "employees_search_result", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_view_employee_contacts", null, 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const employee = await getEmployeeDetailsOrFail(req, res, companyData, req.params.employeeId);
    if (!employee) return;

    let match = null;
    if (req.query.job_id && isValidObjectId(req.query.job_id)) {
      match = await JobEmployeeMatchModel.findOne({
        job_id: req.query.job_id,
        employee_id: employee._id,
        company_id: companyData.company._id,
      }).lean();
    }

    return success(res, normalizeEmployeeForCompany(employee, match), "employee_details");
  } catch (error) {
    next(error);
  }
};

export const requestJobZainTalentHelp = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_request_talent_help", "talent_requests", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const body = { ...(req.body || {}) };
    const routeJobId = req.params?.jobId;
    if (!body.job_id && !body.jobId && routeJobId) body.job_id = routeJobId;

    let payload = normalizeTalentRequestPayload(body, companyData);

    if (payload.job_id) {
      const job = await getJobOrFail(req, res, companyData, payload.job_id);
      if (!job) return;

      payload = {
        ...payload,
        title: payload.title || job.job_name || "",
        description: payload.description || job.description || "",
        required_skills: payload.required_skills.length
          ? payload.required_skills
          : [
              ...(job.skills_required || []).map((x) => x.title).filter(Boolean),
              ...(job.search_projection?.requirements?.skills || []),
              ...(job.search_index?.filters?.skills || []),
            ].filter(Boolean),
        preferred_skills: payload.preferred_skills.length
          ? payload.preferred_skills
          : (job.skills_optional || []).map((x) => x.title).filter(Boolean),
        countries: payload.countries.length
          ? payload.countries
          : [ ...(job.countries || []), ...(job.search_projection?.requirements?.countries || []) ],
        cities: payload.cities.length ? payload.cities : job.cities || [],
        work_mode_id: payload.work_mode_id || job.work_mode_id || null,
        job_type_id: payload.job_type_id || job.job_type_id || null,
        experience_level_id: payload.experience_level_id || job.experience_level_id || null,
        education_level_id: payload.education_level_id || job.education_level_id || null,
        min_experience_years: payload.min_experience_years || job.min_experience_years || 0,
        max_experience_years: payload.max_experience_years ?? job.max_experience_years ?? null,
        salary_min: payload.salary_min ?? job.salary?.min ?? null,
        salary_max: payload.salary_max ?? job.salary?.max ?? null,
        currency_code: payload.currency_code || job.salary?.currency_code || "",
      };
    }

    if (!payload.title && !payload.description && !payload.required_skills.length) {
      return fail(res, "talent_request_missing_requirements", 422, {
        required: ["title", "description", "required_skills", "job_id"],
      });
    }

    const request = await new JobZainTalentRequestModel(payload).save();
    await recordCompanyUsage(companyData.company._id, "talent_requests", 1);
    const populated = await JobZainTalentRequestModel.findById(request._id).populate("job_id");

    return success(res, normalizeTalentRequest(populated), "jobzain_talent_request_created", 201);
  } catch (error) {
    next(error);
  }
};

export const getMyJobZainTalentRequests = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = { company_id: companyData.company._id };
    const status = cleanText(firstValue(req.query.status, req.query.request_status));
    const priority = cleanText(firstValue(req.query.priority));
    const jobId = firstValue(req.query.job_id, req.query.jobId, req.params?.jobId);

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (jobId && isValidObjectId(jobId)) filter.job_id = jobId;

    const result = await paginate(JobZainTalentRequestModel, filter, req, {
      populate: "job_id",
      sort: { createdAt: -1, _id: -1 },
    });

    const items = result.items.map(normalizeTalentRequest);
    return success(res, items, "jobzain_talent_requests", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getJobZainTalentRequestDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { requestId } = req.params;
    if (!isValidObjectId(requestId)) return fail(res, "invalid_request_id", 400);

    const request = await JobZainTalentRequestModel.findOne({
      _id: requestId,
      company_id: companyData.company._id,
    }).populate("job_id");

    if (!request) return fail(res, "talent_request_not_found", 404);

    return success(res, normalizeTalentRequest(request), "jobzain_talent_request_details");
  } catch (error) {
    next(error);
  }
};

export const cancelJobZainTalentRequest = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { requestId } = req.params;
    if (!isValidObjectId(requestId)) return fail(res, "invalid_request_id", 400);

    const request = await JobZainTalentRequestModel.findOneAndUpdate(
      {
        _id: requestId,
        company_id: companyData.company._id,
        status: { $nin: ["closed", "cancelled"] },
      },
      {
        $set: { status: "cancelled", closed_at: new Date() },
        $push: {
          notes: {
            by_user_id: companyData.userId,
            note: req.body?.note || "cancelled_by_company",
            type: "company",
          },
        },
      },
      { new: true }
    ).populate("job_id");

    if (!request) return fail(res, "talent_request_not_found_or_already_closed", 404);

    return success(res, normalizeTalentRequest(request), "jobzain_talent_request_cancelled");
  } catch (error) {
    next(error);
  }
};


const loadCandidatesForSmartSearch = async ({ job, companyId, limit }) => {
  const strictFilter = buildCandidateFilterFromJob(job, companyId);
  let employees = await EmployeeModel.find(strictFilter)
    .populate(employeePopulate)
    .limit(limit)
    .lean();

  if (!employees.length) {
    const relaxedFilter = buildCandidateFilterFromJob(job, companyId, { relaxed: true });
    employees = await EmployeeModel.find(relaxedFilter)
      .populate(employeePopulate)
      .sort({ profile_completion: -1, experience_years: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  return employees;
};

const generateMatchesForJob = async ({ job, companyId, limit = 100, minScore = 0 }) => {
  const employees = await loadCandidatesForSmartSearch({ job, companyId, limit });
  const generatedMatches = [];

  for (const employee of employees) {
    try {
      const match = await upsertJobEmployeeMatch({ job, employee, companyId });
      if (match && Number(match.score || 0) >= minScore) generatedMatches.push(match);
    } catch (error) {
      console.error("generateSmartEmployeesForJob employee error:", employee?._id, error?.message || error);
    }
  }

  generatedMatches.sort((a, b) => (b.score || 0) - (a.score || 0));
  return generatedMatches;
};

export const getSmartEmployeesForJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    const job = await getJobOrFail(req, res, companyData, jobId);
    if (!job) return;

    const page = Math.max(toNumber(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toNumber(firstValue(req.query.limit, req.query.paginate), 20), 1), 100);
    const skip = (page - 1) * limit;
    const minScore = Math.min(Math.max(toNumber(firstValue(req.query.min_score, req.query.minScore), 0), 0), 100);

    const filter = {
      job_id: job._id,
      company_id: companyData.company._id,
      score: { $gte: minScore },
    };

    let total = await JobEmployeeMatchModel.countDocuments(filter);

    if (total === 0 && req.query.auto_generate !== "false") {
      const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_use_smart_matching", "smart_matching", 1);
      if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);
      await generateMatchesForJob({
        job,
        companyId: companyData.company._id,
        limit: Math.max(limit * 5, 50),
        minScore,
      });
      total = await JobEmployeeMatchModel.countDocuments(filter);
      await recordCompanyUsage(companyData.company._id, "smart_matching", 1);
    }

    const matches = await JobEmployeeMatchModel.find(filter)
      .sort({ score: -1, generated_at: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "employee_id", populate: employeePopulate })
      .lean();

    const items = matches
      .filter((match) => match.employee_id)
      .map((match) => normalizeEmployeeForCompany(match.employee_id, match));

    return success(res, items, "smart_employees_for_job", 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSmartEmployeesForJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_use_smart_matching", "smart_matching", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const { jobId } = req.params;
    const job = await getJobOrFail(req, res, companyData, jobId);
    if (!job) return;

    const limit = Math.min(Math.max(toNumber(firstValue(req.body.limit, req.query.limit), 100), 1), 500);
    const minScore = Math.min(Math.max(toNumber(firstValue(req.body.min_score, req.body.minScore, req.query.min_score, req.query.minScore), 0), 0), 100);

    const generatedMatches = await generateMatchesForJob({
      job,
      companyId: companyData.company._id,
      limit,
      minScore,
    });

    await recordCompanyUsage(companyData.company._id, "smart_matching", 1);

    const populatedMatches = await JobEmployeeMatchModel.find({
      _id: { $in: generatedMatches.map((match) => match._id) },
    })
      .sort({ score: -1, generated_at: -1, _id: -1 })
      .populate({ path: "employee_id", populate: employeePopulate })
      .lean();

    return success(
      res,
      {
        generated: populatedMatches.length,
        job_id: job._id,
        matches: populatedMatches
          .filter((match) => match.employee_id)
          .map((match) => normalizeEmployeeForCompany(match.employee_id, match)),
      },
      "smart_employees_generated"
    );
  } catch (error) {
    next(error);
  }
};

export const matchEmployeeWithJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const subscriptionCheck = await checkCompanyFeature(companyData.company._id, "can_use_smart_matching", "smart_matching", 1);
    if (!subscriptionCheck.allowed) return failSubscription(res, subscriptionCheck);

    const { jobId, employeeId } = req.params;
    const job = await getJobOrFail(req, res, companyData, jobId);
    if (!job) return;

    const employee = await getEmployeeDetailsOrFail(req, res, companyData, employeeId);
    if (!employee) return;

    const match = await upsertJobEmployeeMatch({
      job,
      employee: employee.toObject ? employee.toObject() : employee,
      companyId: companyData.company._id,
    });
    await recordCompanyUsage(companyData.company._id, "smart_matching", 1);

    return success(
      res,
      normalizeEmployeeForCompany(employee, match),
      "employee_job_match_calculated"
    );
  } catch (error) {
    next(error);
  }
};

export default {
  searchEmployees,
  getEmployeeDetails,
  requestJobZainTalentHelp,
  getMyJobZainTalentRequests,
  getJobZainTalentRequestDetails,
  cancelJobZainTalentRequest,
  generateSmartEmployeesForJob,
  getSmartEmployeesForJob,
  matchEmployeeWithJob,
};
