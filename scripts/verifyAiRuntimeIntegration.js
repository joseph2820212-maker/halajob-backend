import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "ai-runtime-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "ai-runtime-health-secret";
process.env.HALA_AI_ENABLED = "false";

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
    headers: token ? authHeaders(token, headers) : { Accept: "application/json", ...headers },
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

async function waitForDoc(model, filter, label) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const found = await model.findOne(filter).lean();
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(`${label} was not written`);
}

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-ai-runtime-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    AiRequestModel,
    AiUsageLimitModel,
    AnalyticsEventModel,
    AuditLogModel,
    CompanyModel,
    EmployeeModel,
    RoleModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `ai-runtime-employee-${suffix}`,
      role_number: 4,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `ai-runtime-company-${suffix}`,
      role_number: 3,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, companyUser] = await UserModel.create([
    {
      first_name: "AI",
      last_name: "Seeker",
      email: `ai.seeker.${suffix}@example.com`,
      gender: "female",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}01`,
      phone_e164: `+1555${phoneSeed}01`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}01`,
    },
    {
      first_name: "AI",
      last_name: "Company",
      email: `ai.company.${suffix}@example.com`,
      gender: "male",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}02`,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
  ]);

  const seekerEmployee = await EmployeeModel.create({
    user_id: seekerUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    profile_headline: "AI runtime seeker",
    current_job_title: "Student",
    candidate_stage: "student",
    is_student: true,
    experience_years: 1,
  });

  const company = await CompanyModel.create({
    company_name: `AI Runtime Company ${suffix}`,
    company_email: `ai.runtime.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 80,
  });

  const [seekerTokens, companyTokens] = await Promise.all([
    generateAuthTokens(seekerUser, {
      brand: "AI Runtime Seeker",
      model_name: "Integration",
      is_device: false,
    }),
    generateAuthTokens(companyUser, {
      brand: "AI Runtime Company",
      model_name: "Integration",
      is_device: false,
    }),
  ]);

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const profileBody = {
      profile: {
        headline: "Junior software developer",
        skills: ["JavaScript", "React"],
      },
    };

    const blockedPayload = await expectStatus(
      request(baseUrl, "POST", "/ai/v1/profile/score", {
        token: seekerTokens.accessToken,
        body: profileBody,
      }),
      503,
      "disabled employee AI request"
    );

    assert.equal(blockedPayload.data?.ai_status?.reason, "ai_feature_not_enabled");
    const blockedRecord = await waitForDoc(
      AiRequestModel,
      {
        feature: "profile_score",
        user_id: seekerUser._id,
        status: "blocked",
        error: "ai_feature_not_enabled",
      },
      "blocked employee AI request"
    );

    await waitForDoc(
      AuditLogModel,
      {
        action: "ai_request_blocked",
        entity_id: blockedRecord._id,
        actor_user_id: seekerUser._id,
      },
      "blocked employee AI audit log"
    );

    await AiUsageLimitModel.create({
      feature: "profile_score",
      scope_type: "global",
      scope_id: "global",
      enabled: true,
      daily_limit: 1,
      monthly_limit: 5,
      provider: "mock",
      model: "mock-profile-v1",
    });

    const completedPayload = await expectStatus(
      request(baseUrl, "POST", "/ai/v1/profile/score", {
        token: seekerTokens.accessToken,
        body: profileBody,
      }),
      200,
      "mock employee AI request"
    );

    const profileRequestId = completedPayload.data?.ai_status?.request_id;
    assert.ok(profileRequestId, "completed employee AI response should include request id");
    assert.equal(completedPayload.data?.ai_status?.status, "completed");
    assert.equal(completedPayload.data?.safety?.auto_action_performed, false);
    assert.equal(completedPayload.data?.output?.score, 72);

    const completedRecord = await AiRequestModel.findById(profileRequestId).lean();
    assert.equal(completedRecord?.status, "completed");
    assert.equal(String(completedRecord?.user_id), String(seekerUser._id));
    assert.equal(String(completedRecord?.employee_id), String(seekerEmployee._id));
    assert.equal(completedRecord?.active_context_type, "job_seeker");
    assert.equal(completedRecord?.output_json?.score, 72);

    await waitForDoc(
      AuditLogModel,
      {
        action: "ai_request_completed",
        entity_id: completedRecord._id,
        actor_user_id: seekerUser._id,
      },
      "completed employee AI audit log"
    );

    await waitForDoc(
      AnalyticsEventModel,
      {
        event: "ai_score_generated",
        entity_id: completedRecord._id,
        user_id: seekerUser._id,
      },
      "completed employee AI analytics event"
    );

    const cachedPayload = await expectStatus(
      request(baseUrl, "POST", "/ai/v1/profile/score", {
        token: seekerTokens.accessToken,
        body: profileBody,
      }),
      200,
      "cached employee AI request"
    );
    assert.equal(cachedPayload.message, "ai_cached_result");
    assert.equal(cachedPayload.data?.ai_status?.cached, true);
    assert.equal(cachedPayload.data?.ai_status?.request_id, profileRequestId);
    assert.equal(
      await AiRequestModel.countDocuments({ feature: "profile_score", user_id: seekerUser._id, status: "completed" }),
      1,
      "cached AI request should reuse the completed request"
    );

    const limitedPayload = await expectStatus(
      request(baseUrl, "POST", "/ai/v1/profile/score?force=true", {
        token: seekerTokens.accessToken,
        body: profileBody,
      }),
      429,
      "employee AI daily limit"
    );
    assert.equal(limitedPayload.data?.ai_status?.reason, "ai_daily_usage_limit_reached");

    await AiUsageLimitModel.create({
      feature: "company_job_generate",
      scope_type: "global",
      scope_id: "global",
      enabled: true,
      daily_limit: 5,
      monthly_limit: 20,
      provider: "mock",
      model: "mock-company-v1",
    });

    const companyPayload = await expectStatus(
      request(baseUrl, "POST", "/ai/v1/company/jobs/generate", {
        token: companyTokens.accessToken,
        body: {
          title: "Campus Ambassador",
          seniority: "entry",
          location: "Remote",
        },
      }),
      200,
      "mock company AI job draft request"
    );

    const companyRequestId = companyPayload.data?.ai_status?.request_id;
    const companyRecord = await AiRequestModel.findById(companyRequestId).lean();
    assert.equal(companyPayload.data?.output?.title, "Campus Ambassador");
    assert.equal(companyRecord?.status, "completed");
    assert.equal(String(companyRecord?.company_id), String(company._id));
    assert.equal(companyRecord?.active_context_type, "company_admin");

    await waitForDoc(
      AuditLogModel,
      {
        action: "ai_request_completed",
        entity_id: companyRecord._id,
        company_id: company._id,
      },
      "completed company AI audit log"
    );

    await waitForDoc(
      AnalyticsEventModel,
      {
        event: "ai_job_draft_generated",
        entity_id: companyRecord._id,
        company_id: company._id,
      },
      "completed company AI analytics event"
    );

    const companyRequestCount = await AiRequestModel.countDocuments({ feature: "company_job_generate" });
    await expectStatus(
      request(baseUrl, "POST", "/ai/v1/company/jobs/generate", {
        token: seekerTokens.accessToken,
        body: { title: "Should not run" },
      }),
      403,
      "seeker blocked from company AI request"
    );
    assert.equal(
      await AiRequestModel.countDocuments({ feature: "company_job_generate" }),
      companyRequestCount,
      "wrong-role company AI attempt should not create an AI request record"
    );

    console.log("AI runtime integration verified for blocked, completed, cached, limited, and wrong-role requests.");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
