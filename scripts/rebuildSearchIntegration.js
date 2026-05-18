import dotenv from "dotenv";
import mongoose from "mongoose";
import { jobsModel, EmployeeModel, CompanyModel } from "../models/index.js";
import {
  rebuildCompanyProjection,
  rebuildJobProjection,
  rebuildEmployeeProjection,
  rebuildMatchForJob,
} from "../services/search/rebuildSearchData.js";

dotenv.config();

const connectionUrl = process.env.CONNECTION_URL;

if (!connectionUrl) {
  console.error("CONNECTION_URL is missing in .env");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(connectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const companies = await CompanyModel.find({}).select("_id");
  for (const company of companies) {
    await rebuildCompanyProjection(company._id);
  }

  const employees = await EmployeeModel.find({}).select("_id");
  for (const employee of employees) {
    await rebuildEmployeeProjection(employee._id);
  }

  const jobs = await jobsModel.find({}).select("_id");
  for (const job of jobs) {
    await rebuildJobProjection(job._id);
    await rebuildMatchForJob(job._id);
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        companies: companies.length,
        employees: employees.length,
        jobs: jobs.length,
      },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
