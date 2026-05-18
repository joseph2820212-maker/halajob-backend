import {
  jobsModel,
  EmployeeModel,
  CompanyModel,
  JobEmployeeMatchModel,
} from "../../models/index.js";

import { buildJobProjection } from "./buildJobProjection.js";
import { buildEmployeeProjection } from "./buildEmployeeProjection.js";
import { buildCompanyProjection } from "./buildCompanyProjection.js";
import { calculateJobEmployeeMatch } from "../matching/jobEmployeeMatching.js";

const publicJobFilter = {
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
};

const publicEmployeeFilter = {
  status: true,
  accepted: true,
  profile_visibility: { $in: ["public", "companies_only"] },
};

export const applyJobProjection = async (job) => {
  if (!job) return null;
  job.search_projection = await buildJobProjection(job);
  return job;
};

export const applyEmployeeProjection = async (employee) => {
  if (!employee) return null;
  employee.matching_profile = await buildEmployeeProjection(employee);
  return employee;
};

export const applyCompanyProjection = async (company) => {
  if (!company) return null;
  company.company_projection = await buildCompanyProjection(company);
  return company;
};

export const rebuildJobProjection = async (jobId) => {
  const job = await jobsModel.findById(jobId);
  if (!job) return null;
  await applyJobProjection(job);
  await job.save();
  return job;
};

export const rebuildEmployeeProjection = async (employeeId) => {
  const employee = await EmployeeModel.findById(employeeId);
  if (!employee) return null;
  await applyEmployeeProjection(employee);
  await employee.save();
  return employee;
};

export const rebuildCompanyProjection = async (companyId) => {
  const company = await CompanyModel.findById(companyId);
  if (!company) return null;
  await applyCompanyProjection(company);
  await company.save();
  return company;
};

export const rebuildCompanyJobsProjection = async (companyId) => {
  const jobs = await jobsModel.find({ company_id: companyId }).select("_id");
  for (const job of jobs) await rebuildJobProjection(job._id);
  return jobs.length;
};

export const upsertJobEmployeeMatch = async (job, employee) => {
  const result = calculateJobEmployeeMatch(job, employee);
  await JobEmployeeMatchModel.findOneAndUpdate(
    { job_id: job._id, employee_id: employee._id },
    {
      job_id: job._id,
      employee_id: employee._id,
      company_id: job.company_id,
      user_id: employee.user_id || null,
      ...result,
      is_recommended_to_employee: result.score >= 50,
      is_recommended_to_company: result.score >= 60,
      generated_at: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return result;
};

export const rebuildMatchForJob = async (jobId) => {
  const job = await jobsModel.findById(jobId).lean();
  if (!job) return 0;

  const employees = await EmployeeModel.find({
    ...publicEmployeeFilter,
    "matching_profile.free_for_work": true,
  }).lean();

  let count = 0;
  for (const employee of employees) {
    await upsertJobEmployeeMatch(job, employee);
    count += 1;
  }
  return count;
};

export const rebuildMatchForEmployee = async (employeeId) => {
  const employee = await EmployeeModel.findById(employeeId).lean();
  if (!employee) return 0;

  const jobs = await jobsModel.find(publicJobFilter).lean();
  let count = 0;
  for (const job of jobs) {
    await upsertJobEmployeeMatch(job, employee);
    count += 1;
  }
  return count;
};

export const rebuildJobIntegration = async (jobId, { rebuildMatches = true } = {}) => {
  const job = await rebuildJobProjection(jobId);
  const matches_count = rebuildMatches && job ? await rebuildMatchForJob(job._id) : 0;
  return { job, matches_count };
};

export const rebuildEmployeeIntegration = async (employeeId, { rebuildMatches = true } = {}) => {
  const employee = await rebuildEmployeeProjection(employeeId);
  const matches_count = rebuildMatches && employee ? await rebuildMatchForEmployee(employee._id) : 0;
  return { employee, matches_count };
};

export const rebuildCompanyIntegration = async (companyId) => {
  const company = await rebuildCompanyProjection(companyId);
  const jobs_count = company ? await rebuildCompanyJobsProjection(company._id) : 0;
  return { company, jobs_count };
};
