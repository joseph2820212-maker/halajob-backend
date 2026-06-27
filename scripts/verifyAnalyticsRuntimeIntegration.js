import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "analytics-runtime-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "analytics-runtime-health-secret";

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

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-analytics-runtime-${nowToken()}`,
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
    AnalyticsEventModel,
    RoleModel,
    UniversityModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);
  const [employeeRole, adminRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `analytics-runtime-employee-${suffix}`,
      role_number: 4,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: `analytics-runtime-admin-${suffix}`,
      role_number: 1,
      title_ar: "Admin",
      title_en: "Admin",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, otherUser, universityUser, superAdminUser] = await UserModel.create([
    {
      first_name: "Analytics",
      last_name: "Seeker",
      email: `analytics.seeker.${suffix}@example.com`,
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
      first_name: "Analytics",
      last_name: "Other",
      email: `analytics.other.${suffix}@example.com`,
      gender: "male",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}02`,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
    {
      first_name: "Analytics",
      last_name: "University",
      email: `analytics.university.${suffix}@example.edu`,
      gender: "female",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}03`,
      phone_e164: `+1555${phoneSeed}03`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}03`,
    },
    {
      first_name: "Analytics",
      last_name: "Admin",
      email: `analytics.admin.${suffix}@example.com`,
      gender: "male",
      role_id: adminRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}04`,
      phone_e164: `+1555${phoneSeed}04`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}04`,
    },
  ]);

  const university = await UniversityModel.create({
    name: `Analytics University ${suffix}`,
    name_en: `Analytics University ${suffix}`,
    email_domain: `analytics-${suffix}.edu`,
    career_center_email: universityUser.email,
    verified: true,
    status: "active",
  });

  const universityContext = await AccountContextModel.create({
    user_id: universityUser._id,
    context_key: `university_admin:${university._id}`,
    context_type: "university_admin",
    entity_id: university._id,
    entity_model: "universities",
    display_name: university.name,
    status: "active",
    permissions: ["campus.dashboard.view"],
    is_default: true,
  });
  await UserModel.updateOne({ _id: universityUser._id }, { $set: { default_context_id: universityContext._id } });

  const [seekerTokens, otherTokens, universityTokens, superAdminTokens] = await Promise.all([
    generateAuthTokens(seekerUser, { brand: "Analytics Seeker", model_name: "Integration", is_device: false }),
    generateAuthTokens(otherUser, { brand: "Analytics Other", model_name: "Integration", is_device: false }),
    generateAuthTokens(universityUser, { brand: "Analytics University", model_name: "Integration", is_device: false }),
    generateAuthTokens(superAdminUser, { brand: "Analytics Admin", model_name: "Integration", is_device: false }),
  ]);

  await AnalyticsEventModel.create([
    {
      event: "event_joined",
      group: "campus",
      user_id: seekerUser._id,
      active_context_id: universityContext._id,
      context_type: "university_admin",
      entity_type: "campus",
      metadata: { university_id: String(university._id), source: "seeded_context" },
      platform: "android",
      app_version: "1.0.0",
    },
    {
      event: "profile_completed",
      group: "activation",
      user_id: otherUser._id,
      context_type: "job_seeker",
      entity_type: "other",
      metadata: { university_id: "outside-university" },
      platform: "web",
      app_version: "1.0.0",
    },
  ]);

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/events", {}),
      401,
      "missing token analytics list"
    );

    const trackPayload = await expectStatus(
      request(baseUrl, "POST", "/analytics/v1/events", {
        token: seekerTokens.accessToken,
        body: {
          event: "job_viewed",
          group: "jobs",
          entity_type: "job",
          entity_id: new mongoose.Types.ObjectId().toString(),
          platform: "android",
          app_version: "1.0.2",
          metadata: { source: "runtime_test" },
        },
      }),
      201,
      "track analytics event"
    );
    assert.equal(trackPayload.data.event, "job_viewed");
    assert.equal(trackPayload.data.group, "jobs");

    await expectStatus(
      request(baseUrl, "POST", "/analytics/v1/events", {
        token: seekerTokens.accessToken,
        body: {
          event: "currency_selected",
          group: "jobs",
        },
      }),
      422,
      "analytics group mismatch"
    );

    const minePayload = await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/events?limit=20", {
        token: seekerTokens.accessToken,
      }),
      200,
      "list own analytics events"
    );
    assert.equal(minePayload.data.length, 2, "own analytics list should include seeded and tracked own events");
    assert.ok(
      minePayload.data.every((event) => String(event.user_id) === String(seekerUser._id)),
      "own analytics list must not leak another user's events"
    );

    await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/admin/summary", {
        token: seekerTokens.accessToken,
      }),
      403,
      "seeker denied analytics admin summary"
    );

    const platformSummary = await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/admin/summary", {
        token: superAdminTokens.accessToken,
      }),
      200,
      "super admin analytics summary"
    );
    assert.equal(platformSummary.data.scope.type, "platform");
    assert.ok(platformSummary.data.totals.events >= 3, "super admin summary should see platform-wide events");

    const universitySummary = await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/admin/summary", {
        token: universityTokens.accessToken,
        headers: { "X-Active-Context-Id": String(universityContext._id) },
      }),
      200,
      "university analytics summary"
    );
    assert.equal(universitySummary.data.scope.type, "university");
    assert.equal(universitySummary.data.scope.university_id, String(university._id));
    assert.equal(universitySummary.data.totals.events, 1);
    assert.deepEqual(
      universitySummary.data.by_event.map((item) => item.event),
      ["event_joined"],
      "university summary should only include university-scoped events"
    );

    const universityCohorts = await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/admin/cohorts", {
        token: universityTokens.accessToken,
        headers: { "X-Active-Context-Id": String(universityContext._id) },
      }),
      200,
      "university analytics cohorts"
    );
    assert.equal(universityCohorts.data.scope.type, "university");
    assert.equal(universityCohorts.data.by_platform.length, 1);
    assert.equal(universityCohorts.data.by_platform[0].platform, "android");

    await expectStatus(
      request(baseUrl, "GET", "/analytics/v1/admin/summary", {
        token: otherTokens.accessToken,
        headers: { "X-Active-Context-Id": String(universityContext._id) },
      }),
      403,
      "other user cannot borrow university analytics context"
    );

    console.log("Analytics runtime integration verified for tracking, own listing, and scoped admin reports.");
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
