import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "saved-search-alerts-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "saved-search-alerts-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, contextId, extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(contextId ? { "X-Active-Context-Id": String(contextId) } : {}),
    ...extra,
  };
}

async function request(baseUrl, method, pathName, { token, contextId, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: token
      ? authHeaders(token, contextId, headers)
      : { Accept: "application/json", "Content-Type": "application/json", ...headers },
    ...(hasBody ? { body: JSON.stringify(body || {}) } : {}),
  });
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function expectStatus(responsePromise, expected, label) {
  const response = await responsePromise;
  const payload = await readJson(response);
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`,
  );
  return { response, payload };
}

function userSeed({ firstName, lastName, email, roleId, phone }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "female",
    role_id: roleId,
    password: "not-used",
    status: true,
    phone: `+1887${phone}`,
    phone_e164: `+1887${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `887${phone}`,
  };
}

function jobSeed({ suffix, userId, companyId, title, keyword, city = "Damascus", country = "Syria" }) {
  const lookupId = () => new mongoose.Types.ObjectId();
  return {
    job_name: title,
    description: `${title} role using ${keyword}, APIs, reliable delivery, and customer-facing product work.`,
    ref: `SAVED-SEARCH-${suffix}-${title.replace(/[^a-z0-9]/gi, "-")}`,
    status: true,
    is_accepted: true,
    publish_status: "published",
    started_date: new Date(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    city,
    cities: [city],
    countries: [country],
    keywords_norm: [keyword.toLowerCase()],
    search_index: {
      title_norm: title.toLowerCase(),
      text_norm: `${title} ${keyword}`.toLowerCase(),
    },
    work_mode_id: lookupId(),
    job_type_id: lookupId(),
    job_time_id: lookupId(),
    job_salary_id: lookupId(),
    salary: {
      currency_id: lookupId(),
      currency_code: "SYP",
      currency_rate_snapshot: 1,
      min: 1000000,
      max: 1500000,
    },
    skills_required: [{ title: keyword, level: 4, years: 2 }],
    company_id: companyId,
    user_id: userId,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-saved-search-alerts-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService, scheduler, savedSearchService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
    import("../jobs/scheduler.js"),
    import("../services/jobAlerts/savedSearch.service.js"),
  ]);

  const {
    AccountContextModel,
    EmployeeModel,
    JobAlertLogModel,
    NotificationModel,
    RoleModel,
    SavedSearchModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;
  const { runScheduledJobNow } = scheduler;
  const { buildJobQueryForSavedSearch } = savedSearchService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken().toLowerCase();
  const phoneSeed = suffix.slice(-8).replace(/\D/g, "").padEnd(8, "0");
  const companyId = new mongoose.Types.ObjectId();

  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `saved-search-employee-${suffix}`,
      role_number: 994201,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `saved-search-company-${suffix}`,
      role_number: 994202,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, otherUser, legacyUser, companyUser] = await UserModel.create([
    userSeed({
      firstName: "Saved",
      lastName: "Seeker",
      email: `saved.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Other",
      lastName: "Seeker",
      email: `saved.other.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Legacy",
      lastName: "Seeker",
      email: `saved.legacy.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Alert",
      lastName: "Company",
      email: `saved.company.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}04`,
    }),
  ]);

  const [seekerEmployee, otherEmployee, legacyEmployee] = await EmployeeModel.create([
    {
      user_id: seekerUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: false,
      candidate_stage: "experienced",
      profile_headline: "Backend developer",
    },
    {
      user_id: otherUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: false,
      candidate_stage: "experienced",
      profile_headline: "Support analyst",
    },
    {
      user_id: legacyUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      profile_headline: "Student analyst",
      job_alerts: [{ keyword: "legacy analyst", countries: ["Syria"], is_active: true }],
    },
  ]);

  const [seekerContext, otherContext, legacyContext] = await AccountContextModel.create([
    {
      user_id: seekerUser._id,
      context_key: `job_seeker:${seekerEmployee._id}`,
      context_type: "job_seeker",
      entity_id: seekerEmployee._id,
      entity_model: "employees",
      display_name: "Saved Seeker",
      status: "active",
      permissions: ["profile.manage"],
      is_default: true,
    },
    {
      user_id: otherUser._id,
      context_key: `job_seeker:${otherEmployee._id}`,
      context_type: "job_seeker",
      entity_id: otherEmployee._id,
      entity_model: "employees",
      display_name: "Other Seeker",
      status: "active",
      permissions: ["profile.manage"],
      is_default: true,
    },
    {
      user_id: legacyUser._id,
      context_key: `student:${legacyEmployee._id}`,
      context_type: "student",
      entity_id: legacyEmployee._id,
      entity_model: "employees",
      display_name: "Legacy Student",
      status: "active",
      permissions: ["profile.manage"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: seekerUser._id }, { $set: { default_context_id: seekerContext._id } }),
    UserModel.updateOne({ _id: otherUser._id }, { $set: { default_context_id: otherContext._id } }),
    UserModel.updateOne({ _id: legacyUser._id }, { $set: { default_context_id: legacyContext._id } }),
  ]);

  const device = { brand: "Saved Search", model_name: "Integration", is_device: false };
  const [seekerTokens, otherTokens, legacyTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(otherUser, device),
    generateAuthTokens(legacyUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const invalid = await expectStatus(
    request(baseUrl, "POST", "/user/v1/saved-searches", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: { name: "No filters" },
    }),
    400,
    "saved search requires at least one filter",
  );
  assert.match(JSON.stringify(invalid.payload), /At least one saved-search filter is required/);

  const created = await expectStatus(
    request(baseUrl, "POST", "/user/v1/saved-searches", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        name: "Python jobs in Damascus",
        filters: {
          keyword: "python",
          city: "Damascus",
          country: "Syria",
        },
        frequency: "daily",
        channels: { in_app: true, push: true },
      },
    }),
    201,
    "seeker creates saved search",
  );
  const savedSearchId = created.payload.data.id;
  assert.equal(created.payload.data.filters.keyword, "python");
  assert.equal(created.payload.data.scope, "seeker");

  const listed = await expectStatus(
    request(baseUrl, "GET", "/user/v1/saved-searches", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker lists saved searches",
  );
  assert.ok(listed.payload.data.some((item) => item.id === savedSearchId));

  await expectStatus(
    request(baseUrl, "GET", `/user/v1/saved-searches/${savedSearchId}`, {
      token: otherTokens.accessToken,
      contextId: otherContext._id,
    }),
    404,
    "another seeker cannot read saved search",
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/saved-searches/${savedSearchId}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: { name: "Updated Python jobs", frequency: "weekly" },
    }),
    200,
    "seeker updates saved search metadata without losing filters",
  );
  const preserved = await SavedSearchModel.findById(savedSearchId).lean();
  assert.equal(preserved.name, "Updated Python jobs");
  assert.equal(preserved.frequency, "weekly");
  assert.equal(preserved.filters.keyword, "python");
  assert.equal(preserved.filters.city, "Damascus");

  const matchingJob = await jobsModel.create(
    jobSeed({
      suffix,
      userId: companyUser._id,
      companyId,
      title: "Python Backend Engineer",
      keyword: "python",
    }),
  );
  const directMatchCount = await jobsModel.countDocuments(buildJobQueryForSavedSearch(preserved, { since: null }));
  assert.equal(
    directMatchCount,
    1,
    `saved-search matcher should find seeded job; query=${JSON.stringify(buildJobQueryForSavedSearch(preserved, { since: null }))}; job=${JSON.stringify(await jobsModel.findById(matchingJob._id).lean())}`,
  );

  const runNow = await expectStatus(
    request(baseUrl, "POST", `/user/v1/saved-searches/${savedSearchId}/run-now`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker runs saved search alert immediately",
  );
  assert.equal(
    runNow.payload.data.result.sent,
    1,
    `run-now should send one alert; result=${JSON.stringify(runNow.payload.data.result)}`,
  );
  assert.equal(
    runNow.payload.data.result.matched,
    1,
    `run-now should match one job; result=${JSON.stringify(runNow.payload.data.result)}`,
  );

  const sentLog = await JobAlertLogModel.findOne({
    saved_search_id: savedSearchId,
    job_id: matchingJob._id,
    user_id: seekerUser._id,
    status: "sent",
  }).lean();
  assert.ok(sentLog, "run-now should create a sent alert log");

  const notification = await NotificationModel.findOne({
    user_id: seekerUser._id,
    type: "job_alert",
    "data.job_id": String(matchingJob._id),
  }).lean();
  assert.ok(notification, "run-now should create an in-app job alert notification");
  assert.equal(notification.route_key, "job_detail");

  const duplicate = await expectStatus(
    request(baseUrl, "POST", `/user/v1/saved-searches/${savedSearchId}/run-now`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "duplicate run-now does not resend same alert",
  );
  assert.equal(duplicate.payload.data.result.sent, 0);
  assert.equal(duplicate.payload.data.result.skipped, 1);
  assert.equal(
    await JobAlertLogModel.countDocuments({ saved_search_id: savedSearchId, job_id: matchingJob._id }),
    1,
  );

  const logs = await expectStatus(
    request(baseUrl, "GET", `/user/v1/job-alerts/logs?saved_search_id=${savedSearchId}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker lists job alert logs",
  );
  assert.equal(logs.payload.data.length, 1);
  assert.equal(logs.payload.data[0].status, "sent");

  const disabled = await expectStatus(
    request(baseUrl, "POST", "/user/v1/saved-searches", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        name: "Disabled alerts",
        keyword: "node",
        frequency: "off",
      },
    }),
    201,
    "seeker creates disabled saved search",
  );
  const disabledRun = await expectStatus(
    request(baseUrl, "POST", `/user/v1/saved-searches/${disabled.payload.data.id}/run-now`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "disabled saved search does not send alerts",
  );
  assert.equal(disabledRun.payload.data.result.checked, 0);
  assert.equal(disabledRun.payload.data.result.sent, 0);

  const scheduled = await expectStatus(
    request(baseUrl, "POST", "/user/v1/saved-searches", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        name: "Scheduler QA alerts",
        filters: { keyword: "scheduler qa", country: "Syria" },
        frequency: "instant",
      },
    }),
    201,
    "seeker creates scheduled saved search",
  );
  const scheduledSearch = await SavedSearchModel.findById(scheduled.payload.data.id).lean();
  const scheduledJob = await jobsModel.create(
    jobSeed({
      suffix,
      userId: companyUser._id,
      companyId,
      title: "Scheduler QA Specialist",
      keyword: "scheduler qa",
    }),
  );
  await SavedSearchModel.updateOne(
    { _id: scheduledSearch._id },
    { $set: { last_checked_at: new Date(Date.now() - 60 * 60 * 1000) } },
  );
  const scheduledResult = await runScheduledJobNow("saved-search-alerts");
  assert.ok(scheduledResult.sent >= 1, "scheduled job should send due saved-search alerts");
  assert.ok(
    await JobAlertLogModel.findOne({
      saved_search_id: scheduledSearch._id,
      job_id: scheduledJob._id,
      status: "sent",
    }).lean(),
  );

  const legacyJob = await jobsModel.create(
    jobSeed({
      suffix,
      userId: companyUser._id,
      companyId,
      title: "Legacy Analyst",
      keyword: "legacy analyst",
    }),
  );
  const migrated = await expectStatus(
    request(baseUrl, "GET", "/user/v1/campus/saved-searches", {
      token: legacyTokens.accessToken,
      contextId: legacyContext._id,
    }),
    200,
    "legacy embedded employee alerts migrate into campus saved searches",
  );
  assert.equal(migrated.payload.migrated, 1);
  assert.equal(migrated.payload.data.length, 1);
  assert.equal(migrated.payload.data[0].created_from, "migration");
  assert.equal(migrated.payload.data[0].scope, "campus");

  const migratedRun = await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/saved-searches/${migrated.payload.data[0].id}/run-now`, {
      token: legacyTokens.accessToken,
      contextId: legacyContext._id,
    }),
    200,
    "migrated legacy alert can run and notify",
  );
  assert.equal(migratedRun.payload.data.result.sent, 1);
  assert.ok(
    await JobAlertLogModel.findOne({
      saved_search_id: migrated.payload.data[0].id,
      job_id: legacyJob._id,
      user_id: legacyUser._id,
      status: "sent",
    }).lean(),
  );

  await expectStatus(
    request(baseUrl, "DELETE", `/user/v1/saved-searches/${savedSearchId}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker deletes saved search",
  );
  assert.equal(await SavedSearchModel.exists({ _id: savedSearchId }), null);

  console.log(
    "Saved search and job alert integration verified for create/list/get/update/delete, ownership isolation, run-now matching, in-app notification, duplicate suppression, disabled alerts, scheduler dispatch, log listing, and legacy employee job_alerts migration.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect().catch(() => null);
    if (mongo) await mongo.stop();
  });
