import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "career-passport-admin-operations-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "career-passport-admin-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function request(baseUrl, method, pathName, { token, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: token
      ? authHeaders(token, headers)
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
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`
  );
  return payload;
}

function userSeed({ firstName, lastName, email, roleId, phone }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "male",
    role_id: roleId,
    password: "not-used",
    status: true,
    phone: `+1555${phone}`,
    phone_e164: `+1555${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `555${phone}`,
  };
}

async function createPermission(PermissionModel, key) {
  const [group, action = "view"] = key.split(".");
  return PermissionModel.create({
    key,
    group,
    action,
    title_ar: key,
    title_en: key,
    status: true,
  });
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-career-passport-admin-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    AccountContextModel,
    CareerPassportModel,
    EmployeeModel,
    PermissionModel,
    RoleModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);
  const passportViewPermission = await createPermission(PermissionModel, "career_passports.view");

  const [passportAdminRole, auditOnlyRole, employeeRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `career-passport-admin-${suffix}`,
      role_number: 960101,
      title_ar: "Career Passport Admin",
      title_en: "Career Passport Admin",
      permissions: [passportViewPermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `career-passport-audit-${suffix}`,
      role_number: 960102,
      title_ar: "Audit Only",
      title_en: "Audit Only",
      permissions: [],
      status: true,
      is_system: false,
    },
    {
      log_to: "employee",
      name: `career-passport-employee-${suffix}`,
      role_number: 960103,
      title_ar: "Employee",
      title_en: "Employee",
      permissions: [],
      status: true,
      is_system: true,
    },
  ]);

  const [passportAdminUser, auditOnlyUser, seekerUser, secondSeekerUser] = await UserModel.create([
    userSeed({
      firstName: "Passport",
      lastName: "Admin",
      email: `passport.admin.${suffix}@example.com`,
      roleId: passportAdminRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Audit",
      lastName: "Only",
      email: `passport.audit.${suffix}@example.com`,
      roleId: auditOnlyRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Career",
      lastName: "Seeker",
      email: `passport.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Private",
      lastName: "Seeker",
      email: `passport.private.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
  ]);

  const [employee, privateEmployee] = await EmployeeModel.create([
    {
      user_id: seekerUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Public career passport owner",
      current_job_title: "Career readiness associate",
      about_me: "Seeded passport for dashboard operations coverage.",
      candidate_stage: "experienced",
      profile_completion: 86,
      skills: [{ title: "Readiness", level: 4 }],
    },
    {
      user_id: secondSeekerUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Private career passport owner",
      current_job_title: "Campus trainee",
      about_me: "Private seeded passport.",
      candidate_stage: "student",
      profile_completion: 58,
      skills: [{ title: "Campus", level: 3 }],
    },
  ]);

  const [context, privateContext] = await AccountContextModel.create([
    {
      user_id: seekerUser._id,
      context_key: `job_seeker:${employee._id}`,
      context_type: "job_seeker",
      entity_id: employee._id,
      entity_model: "employees",
      display_name: "Career passport seeker",
      status: "active",
      permissions: ["jobs.search", "career_passport.manage"],
      is_default: true,
    },
    {
      user_id: secondSeekerUser._id,
      context_key: `job_seeker:${privateEmployee._id}`,
      context_type: "job_seeker",
      entity_id: privateEmployee._id,
      entity_model: "employees",
      display_name: "Private passport seeker",
      status: "active",
      permissions: ["jobs.search", "career_passport.manage"],
      is_default: true,
    },
  ]);

  const [publicPassport, privatePassport] = await CareerPassportModel.create([
    {
      user_id: seekerUser._id,
      employee_id: employee._id,
      active_context_id: context._id,
      visibility: "public",
      share: {
        enabled: true,
        token: `share-${suffix}`,
        created_at: new Date(),
      },
      score: {
        total: 84,
        source: "rule_based_v1",
        generated_by_ai: true,
        explanation: "Strong launch readiness.",
        strengths: ["Clear profile"],
        next_actions: ["Add one more project"],
        components: [
          {
            key: "profile",
            label: "Profile",
            weight: 40,
            score: 86,
            explanation: "Detailed profile",
          },
        ],
        updated_at: new Date(),
      },
      snapshot: {
        identity: {
          full_name: "Career Seeker",
          headline: "Public career passport owner",
          current_job_title: "Career readiness associate",
        },
      },
    },
    {
      user_id: secondSeekerUser._id,
      employee_id: privateEmployee._id,
      active_context_id: privateContext._id,
      visibility: "private",
      share: { enabled: false },
      score: {
        total: 41,
        source: "rule_based_v1",
        generated_by_ai: false,
        explanation: "Needs more profile evidence.",
        updated_at: new Date(),
      },
      snapshot: {
        identity: {
          full_name: "Private Seeker",
          headline: "Private career passport owner",
        },
      },
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: seekerUser._id }, { $set: { default_context_id: context._id } }),
    UserModel.updateOne({ _id: secondSeekerUser._id }, { $set: { default_context_id: privateContext._id } }),
  ]);

  const device = { brand: "Career Passport Admin", model_name: "Integration", is_device: false };
  const [passportAdminTokens, auditOnlyTokens, seekerTokens] = await Promise.all([
    generateAuthTokens(passportAdminUser, device),
    generateAuthTokens(auditOnlyUser, device),
    generateAuthTokens(seekerUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports"),
    401,
    "missing token denied for career passport admin list"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports", { token: seekerTokens.accessToken }),
    403,
    "non-dashboard user denied for career passport admin list"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports", { token: auditOnlyTokens.accessToken }),
    403,
    "dashboard role without career passport permission denied"
  );

  const listPayload = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports?limit=10", {
      token: passportAdminTokens.accessToken,
    }),
    200,
    "career passport admin lists passports"
  );
  const ids = (listPayload.data || []).map((item) => String(item._id || item.id));
  assert.equal(ids.includes(String(publicPassport._id)), true, "admin list should include public passport");
  assert.equal(ids.includes(String(privatePassport._id)), true, "admin list should include private passport");
  assert.equal(listPayload.pagination.total, 2, "admin list should expose pagination totals");

  const filteredPayload = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports?visibility=public&share_enabled=true&generated_by_ai=true&score_min=80", {
      token: passportAdminTokens.accessToken,
    }),
    200,
    "career passport admin filters passport list"
  );
  assert.deepEqual(
    (filteredPayload.data || []).map((item) => String(item._id || item.id)),
    [String(publicPassport._id)],
    "filtered list should return only the public AI-scored shared passport"
  );

  const searchPayload = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports?q=Private%20career", {
      token: passportAdminTokens.accessToken,
    }),
    200,
    "career passport admin searches snapshot text"
  );
  assert.deepEqual(
    (searchPayload.data || []).map((item) => String(item._id || item.id)),
    [String(privatePassport._id)],
    "search should match snapshot headline"
  );

  const detailPayload = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/career-passports/${publicPassport._id}`, {
      token: passportAdminTokens.accessToken,
    }),
    200,
    "career passport admin reads passport detail"
  );
  assert.equal(String(detailPayload.data._id), String(publicPassport._id));
  assert.equal(detailPayload.data.visibility, "public");
  assert.equal(detailPayload.data.share.enabled, true);
  assert.equal(detailPayload.data.score.total, 84);
  assert.equal(String(detailPayload.data.user_id._id), String(seekerUser._id));
  assert.equal(String(detailPayload.data.employee_id._id), String(employee._id));

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/career-passports/not-an-id", {
      token: passportAdminTokens.accessToken,
    }),
    400,
    "career passport admin detail rejects invalid id"
  );

  console.log("Career passport admin operations integration verified for permission gates, list/detail/filter/search, populated owner data, and invalid-id handling.");
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
