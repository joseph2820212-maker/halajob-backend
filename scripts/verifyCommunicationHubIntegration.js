import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "communication-hub-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "communication-hub-health-secret";
process.env.SMS_PROVIDER = "disabled";
process.env.WHATSAPP_BUSINESS_ENABLED = "false";

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
    phone: `+963${phone}`,
    phone_e164: `+963${phone}`,
    phone_country: "SY",
    phone_code: "+963",
    phone_national: phone,
    lan: "en",
  };
}

function jobSeed({ suffix, userId, companyId }) {
  const lookupId = () => new mongoose.Types.ObjectId();
  return {
    job_name: "Communication Hub QA Engineer",
    description: `Communication hub QA role ${suffix} for reliable cross-channel launch verification in Syria.`,
    ref: `COMM-HUB-${suffix}`,
    status: true,
    is_accepted: true,
    publish_status: "published",
    deleted_at: null,
    started_date: new Date(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    city: "Damascus",
    cities: ["Damascus"],
    countries: ["Syria"],
    keywords_norm: ["communication"],
    search_index: {
      title_norm: "communication hub qa engineer",
      text_norm: "communication hub qa engineer",
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
    company_id: companyId,
    user_id: userId,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-communication-hub-${nowToken()}`,
    },
  });
  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService, communication, savedSearchService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
    import("../services/communication/communication.service.js"),
    import("../services/jobAlerts/savedSearch.service.js"),
  ]);

  const {
    CommunicationDeliveryLogModel,
    NotificationModel,
    NotificationPreferenceModel,
    RoleModel,
    SavedSearchModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;
  const { sendCommunicationEvent } = communication;
  const { runSavedSearchAlertsForSearch } = savedSearchService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken().toLowerCase();
  const [employeeRole, adminRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `communication-employee-${suffix}`,
      role_number: 995201,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: "admin",
      role_number: 1,
      title_ar: "Admin",
      title_en: "Admin",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, otherUser, adminUser, companyUser] = await UserModel.create([
    userSeed({
      firstName: "Communication",
      lastName: "Seeker",
      email: `comm.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: "944111001",
    }),
    userSeed({
      firstName: "Other",
      lastName: "Seeker",
      email: `comm.other.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: "944111002",
    }),
    userSeed({
      firstName: "Admin",
      lastName: "User",
      email: `comm.admin.${suffix}@example.com`,
      roleId: adminRole._id,
      phone: "944111003",
    }),
    userSeed({
      firstName: "Company",
      lastName: "User",
      email: `comm.company.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: "944111004",
    }),
  ]);

  const device = { brand: "Communication Hub", model_name: "Integration", is_device: false };
  const [seekerTokens, otherTokens, adminTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(otherUser, device),
    generateAuthTokens(adminUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const defaultPrefs = await expectStatus(
    request(baseUrl, "GET", "/user/v1/communication/preferences", {
      token: seekerTokens.accessToken,
    }),
    200,
    "user reads communication preferences",
  );
  assert.equal(defaultPrefs.payload.data.channels.in_app, true);
  assert.equal(defaultPrefs.payload.data.channels.manual_whatsapp, false);

  await expectStatus(
    request(baseUrl, "PATCH", "/user/v1/communication/preferences", {
      token: seekerTokens.accessToken,
      body: {
        channels: { sms: true, manual_whatsapp: true, whatsapp_business: true },
        phone_for_sms: "+963944222333",
        categories: { jobs: true, marketing: false },
      },
    }),
    200,
    "user updates communication preferences",
  );
  const updatedPreference = await NotificationPreferenceModel.findOne({ user_id: seekerUser._id }).lean();
  assert.equal(updatedPreference.channels.sms, true);
  assert.equal(updatedPreference.channels.manual_whatsapp, true);
  assert.equal(updatedPreference.channels.whatsapp_business, false);
  assert.equal(updatedPreference.phone_for_sms, "+963944222333");
  assert.ok(updatedPreference.sms_opted_in_at, "SMS opt-in timestamp should be written");
  assert.ok(updatedPreference.manual_whatsapp_opted_in_at, "manual WhatsApp opt-in timestamp should be written");

  await expectStatus(
    request(baseUrl, "PATCH", "/user/v1/communication/preferences", {
      token: otherTokens.accessToken,
      body: {
        user_id: String(seekerUser._id),
        channels: { sms: false },
        phone_for_sms: "+963000000000",
      },
    }),
    200,
    "another user can only update their own communication preferences",
  );
  const seekerAfterOtherPatch = await NotificationPreferenceModel.findOne({ user_id: seekerUser._id }).lean();
  const otherPreference = await NotificationPreferenceModel.findOne({ user_id: otherUser._id }).lean();
  assert.equal(seekerAfterOtherPatch.phone_for_sms, "+963944222333");
  assert.equal(otherPreference.phone_for_sms, "+963000000000");

  const manualLink = await expectStatus(
    request(baseUrl, "POST", "/user/v1/communication/manual-whatsapp-link", {
      token: seekerTokens.accessToken,
      body: { phone: "+963944222333", text: "Your Hala Job application update is ready." },
    }),
    201,
    "manual WhatsApp link is generated safely",
  );
  assert.match(manualLink.payload.data.url, /^https:\/\/wa\.me\/963944222333\?text=/);
  assert.equal(manualLink.payload.data.copy_text, "Your Hala Job application update is ready.");

  const delivery = await sendCommunicationEvent({
    userId: seekerUser._id,
    eventKey: "application_status_shortlisted",
    category: "applications",
    channels: ["in_app", "sms", "manual_whatsapp", "whatsapp_business"],
    variables: {
      title: "Application update",
      body: "You have a new application update.",
      message: "You have a new application update.",
      phone: "+963944222333",
    },
    route: { audience: "employee", route_key: "applications" },
  });
  assert.equal(delivery.sent, 1, "in-app delivery should be sent");
  assert.equal(delivery.queued, 1, "manual WhatsApp should be queued for manual action");
  assert.ok(delivery.skipped >= 2, "disabled SMS provider and official WhatsApp should be skipped");
  assert.ok(
    await NotificationModel.findOne({ user_id: seekerUser._id, type: "application_status_shortlisted" }).lean(),
    "in-app communication should create a notification",
  );
  assert.ok(
    await CommunicationDeliveryLogModel.findOne({
      user_id: seekerUser._id,
      channel: "sms",
      status: "skipped",
      failure_reason: "provider_disabled",
    }).lean(),
    "disabled SMS should create a provider_disabled skipped log",
  );
  assert.ok(
    await CommunicationDeliveryLogModel.findOne({
      user_id: seekerUser._id,
      channel: "manual_whatsapp",
      status: "queued",
    }).lean(),
    "manual WhatsApp should be logged as queued manual action",
  );

  const companyId = new mongoose.Types.ObjectId();
  const job = await jobsModel.create(jobSeed({ suffix, userId: companyUser._id, companyId }));
  const savedSearch = await SavedSearchModel.create({
    user_id: seekerUser._id,
    name: "Communication jobs",
    scope: "seeker",
    filters: { keyword: "communication", city: "Damascus", country: "Syria" },
    frequency: "daily",
    channels: { in_app: true, sms: true, manual_whatsapp: true },
    is_active: true,
  });
  const alertResult = await runSavedSearchAlertsForSearch(savedSearch, { since: null });
  assert.equal(alertResult.sent, 1);
  assert.ok(
    await CommunicationDeliveryLogModel.findOne({
      user_id: seekerUser._id,
      event_key: "job_alert",
      channel: "in_app",
      status: "sent",
    }).lean(),
    "saved-search job alert should use the communication hub",
  );
  assert.ok(
    await NotificationModel.findOne({
      user_id: seekerUser._id,
      type: "job_alert",
      "data.job_id": String(job._id),
    }).lean(),
    "saved-search job alert should still create an in-app notification",
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/communication/logs?limit=5", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin lists communication delivery logs",
  );

  await expectStatus(
    request(baseUrl, "POST", "/dash/v1/communication/test-send", {
      token: adminTokens.accessToken,
      body: {
        user_id: String(seekerUser._id),
        event_key: "admin_test_send",
        channels: ["sms"],
        variables: { message: "Admin test SMS" },
        respect_preferences: false,
      },
    }),
    201,
    "admin test-send writes delivery logs without a live SMS provider",
  );

  console.log(
    "Communication hub integration verified for canonical preferences, user ownership isolation, safe manual WhatsApp links, disabled SMS skip logs, in-app delivery, official WhatsApp disabled state, saved-search alert dispatch, and admin communication routes.",
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
