import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "profile-upload-validation-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "profile-upload-validation-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, contextId) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (contextId) headers["X-Active-Context-Id"] = String(contextId);
  return headers;
}

async function multipartRequest(baseUrl, method, pathName, { token, contextId, form }) {
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: authHeaders(token, contextId),
    body: form,
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

async function expectErrorMessage(responsePromise, expected, messagePattern, label) {
  const response = await responsePromise;
  const payload = await readJson(response);
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`
  );
  assert.match(
    String(payload.message || payload.error || ""),
    messagePattern,
    `${label} should include ${messagePattern} in its error message`
  );
  return payload;
}

const appendFakeImage = (
  form,
  { field = "image", size = 28, type = "text/html", name = "avatar.png" } = {}
) => {
  const bytes = type.startsWith("image/")
    ? Buffer.alloc(size, 137)
    : Buffer.from("<html>not really an image</html>");
  form.append(field, new Blob([bytes], { type }), name);
  return form;
};

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-profile-upload-${nowToken()}`,
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
    CompanyModel,
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
      name: `profile-upload-employee-${suffix}`,
      role_number: 970001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `profile-upload-company-${suffix}`,
      role_number: 970002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, companyUser] = await UserModel.create([
    {
      first_name: "Profile",
      last_name: "Seeker",
      email: `profile.seeker.${suffix}@example.com`,
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
      first_name: "Profile",
      last_name: "Company",
      email: `profile.company.${suffix}@example.com`,
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

  const company = await CompanyModel.create({
    company_name: `Profile Upload Company ${suffix}`,
    company_email: `profile.upload.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 80,
  });

  const companyContext = await AccountContextModel.create({
    user_id: companyUser._id,
    context_key: `company_admin:${company._id}`,
    context_type: "company_admin",
    entity_id: company._id,
    entity_model: "companies",
    display_name: company.company_name,
    status: "active",
    permissions: ["*"],
    is_default: true,
  });

  await UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } });

  const device = { brand: "Profile Upload", model_name: "Integration", is_device: false };
  const [seekerTokens, companyTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(companyUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectErrorMessage(
    multipartRequest(baseUrl, "POST", "/user/v1/auth/update-image", {
      token: seekerTokens.accessToken,
      form: appendFakeImage(new FormData()),
    }),
    400,
    /unsupported_file_type/,
    "seeker profile image upload rejects MIME mismatch"
  );

  await expectErrorMessage(
    multipartRequest(baseUrl, "POST", "/user/v1/auth/update-image", {
      token: seekerTokens.accessToken,
      form: appendFakeImage(new FormData(), { size: 4 * 1024 * 1024 + 1, type: "image/png", name: "too-large.png" }),
    }),
    413,
    /file_too_large/,
    "seeker profile image upload rejects oversize image"
  );

  await expectErrorMessage(
    multipartRequest(baseUrl, "PUT", "/company/v1/global/me/image", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      form: appendFakeImage(new FormData()),
    }),
    400,
    /unsupported_file_type/,
    "company user profile image upload rejects MIME mismatch"
  );

  await expectErrorMessage(
    multipartRequest(baseUrl, "PUT", "/company/v1/global/me/image", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      form: appendFakeImage(new FormData(), { size: 4 * 1024 * 1024 + 1, type: "image/png", name: "too-large-company.png" }),
    }),
    413,
    /file_too_large/,
    "company user profile image upload rejects oversize image"
  );

  await expectErrorMessage(
    multipartRequest(baseUrl, "PUT", "/company/v1/global/profile/media", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      form: appendFakeImage(new FormData(), { field: "logo", name: "logo.png" }),
    }),
    400,
    /unsupported_file_type/,
    "company logo upload rejects MIME mismatch"
  );

  await expectErrorMessage(
    multipartRequest(baseUrl, "PUT", "/company/v1/global/profile/media", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      form: appendFakeImage(new FormData(), {
        field: "cover_image",
        size: 4 * 1024 * 1024 + 1,
        type: "image/png",
        name: "too-large-cover.png",
      }),
    }),
    413,
    /file_too_large/,
    "company cover image upload rejects oversize image"
  );

  const [seekerAfterRejectedUploads, companyUserAfterRejectedUploads] = await Promise.all([
    UserModel.findById(seekerUser._id).lean(),
    UserModel.findById(companyUser._id).lean(),
  ]);
  const companyAfterRejectedUploads = await CompanyModel.findById(company._id).lean();

  assert.ok(!seekerAfterRejectedUploads.image, "rejected seeker image uploads should not mutate user image");
  assert.ok(!companyUserAfterRejectedUploads.image, "rejected company image uploads should not mutate owner image");
  assert.ok(!companyAfterRejectedUploads.logo, "rejected company logo uploads should not mutate company logo");
  assert.ok(!companyAfterRejectedUploads.cover_image, "rejected company cover uploads should not mutate company cover image");

  console.log("Profile and company media upload validation verified for MIME/size rejection.");
}

try {
  await main();
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
  if (mongo) await mongo.stop();
}
