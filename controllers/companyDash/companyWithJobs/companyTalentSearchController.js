import {
  EmployeeModel,
  JobEmployeeMatchModel,
  JobZainTalentRequestModel
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
} from "../../../helper/companyDash/companyTalentSearchHelpers.js";

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

  const dir = direction === "asc" || String(value).startsWith("") === false ? 1 : -1;
  return { [field]: dir, _id: dir };
};

export const searchEmployees = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const filter = buildEmployeeSearchFilter(req.query, companyData.company._id);

    const result = await paginate(EmployeeModel, filter, req, {
      populate: employeePopulate,
      sort: parseSort(req.query.sort),
    });

    const items = result.items.map((employee) => normalizeEmployeeForCompany(employee));

    return success(res, items, "employees_search_result", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

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

    let payload = normalizeTalentRequestPayload(req.body, companyData);

    if (payload.job_id) {
      const job = await getJobOrFail(req, res, companyData, payload.job_id);
      if (!job) return;

      payload = {
        ...payload,
        title: payload.title || job.job_name || "",
        description: payload.description || job.description || "",
        required_skills: payload.required_skills.length
          ? payload.required_skills
          : (job.skills_required || []).map((x) => x.title).filter(Boolean),
        preferred_skills: payload.preferred_skills.length
          ? payload.preferred_skills
          : (job.skills_optional || []).map((x) => x.title).filter(Boolean),
        countries: payload.countries.length ? payload.countries : job.countries || [],
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
      return fail(res, "talent_request_missing_requirements", 422);
    }

    const request = await JobZainTalentRequestModel.create(payload);
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
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.job_id && isValidObjectId(req.query.job_id)) filter.job_id = req.query.job_id;

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


export const getSmartEmployeesForJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;
    const job = await getJobOrFail(req, res, companyData, jobId);
    if (!job) return;

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit || req.query.paginate || 20), 1),
      100
    );

    const skip = (page - 1) * limit;
    const minScore = Math.min(
      Math.max(toNumber(req.query.min_score, 0), 0),
      100
    );

    const filter = {
      job_id: job._id,
      company_id: companyData.company._id,
      is_recommended_to_company: true,
      score: { $gte: minScore },
    };

    let total = await JobEmployeeMatchModel.countDocuments(filter);

    if (total === 0 && req.query.auto_generate !== "false") {
      const candidateFilter = buildCandidateFilterFromJob(
        job,
        companyData.company._id
      );

      const candidates = await EmployeeModel.find(candidateFilter)
        .populate(employeePopulate)
        .limit(100)
        .lean();

      for (const employee of candidates) {
        await upsertJobEmployeeMatch({
          job,
          employee,
          companyId: companyData.company._id,
        });
      }

      total = await JobEmployeeMatchModel.countDocuments(filter);
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
 const generateSmartEmployeesForJob = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const { jobId } = req.params;

    const job = await getJobOrFail(
      req,
      res,
      companyData,
      jobId
    );

    if (!job) return;

    const limit = Math.min(
      Math.max(Number(req.body.limit || req.query.limit || 100), 1),
      500
    );

    const minScore = Math.min(
      Math.max(
        Number(req.body.min_score || req.query.min_score || 0),
        0
      ),
      100
    );

    const candidateFilter = buildCandidateFilterFromJob(
      job,
      companyData.company._id
    );

    const employees = await EmployeeModel.find(candidateFilter)
      .populate(employeePopulate)
      .limit(limit)
      .lean();

    const generatedMatches = [];

    for (const employee of employees) {
      try {
        const match = await upsertJobEmployeeMatch({
          job,
          employee,
          companyId: companyData.company._id,
        });

        if (
          match &&
          match.score >= minScore &&
          match.is_recommended_to_company
        ) {
          generatedMatches.push(match);
        }
      } catch (error) {
        console.error(
          "generateSmartEmployeesForJob employee error:",
          employee?._id,
          error
        );
      }
    }

    generatedMatches.sort((a, b) => {
      return (b.score || 0) - (a.score || 0);
    });

    return success(
      res,
      {
        generated: generatedMatches.length,
        job_id: job._id,
        matches: generatedMatches,
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
