import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "learning-resource-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "learning-resource-health-secret";

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
    phone: `+1777${phone}`,
    phone_e164: `+1777${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `777${phone}`,
  };
}

const resourceBody = (suffix, overrides = {}) => ({
  key: `learning-resource-${suffix}`,
  slug: `learning-resource-${suffix}`,
  type: "article",
  audience: ["students", "job_seekers"],
  title: {
    en: "Learning resource integration",
    ar: "مصدر تعلم تجريبي",
  },
  summary: {
    en: "A resource used to verify the student resource library.",
    ar: "مصدر للتحقق من مكتبة الطالب.",
  },
  body: {
    en: "Structured career content for learners.",
    ar: "محتوى مهني منظم للطلاب.",
  },
  tags: ["cv_writing", "job_search_strategy"],
  language: "both",
  estimated_minutes: 7,
  difficulty: "beginner",
  status: "draft",
  visibility: "students",
  featured: true,
  ...overrides,
});

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-learning-resources-${nowToken()}`,
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
    EmployeeModel,
    LearningResourceCategoryModel,
    LearningResourceModel,
    RoleModel,
    UniversityModel,
    UniversityResourceAssignmentModel,
    UserResourceProgressModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken().toLowerCase();
  const phoneSeed = suffix.slice(-8).replace(/\D/g, "").padEnd(8, "0");

  const [employeeRole, universityRole, dashRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `learning-resource-employee-${suffix}`,
      role_number: 993101,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `learning-resource-university-admin-${suffix}`,
      role_number: 993102,
      title_ar: "University Admin",
      title_en: "University Admin",
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

  const [universityA, universityB] = await UniversityModel.create([
    {
      name: `Learning University A ${suffix}`,
      name_en: `Learning University A ${suffix}`,
      email_domain: `learning-a-${suffix}.edu`,
      career_center_email: `career-a-${suffix}@example.edu`,
      verified: true,
      status: "active",
    },
    {
      name: `Learning University B ${suffix}`,
      name_en: `Learning University B ${suffix}`,
      email_domain: `learning-b-${suffix}.edu`,
      career_center_email: `career-b-${suffix}@example.edu`,
      verified: true,
      status: "active",
    },
  ]);

  const [studentUserA, studentUserB, universityAdminUser, dashboardAdminUser] =
    await UserModel.create([
      userSeed({
        firstName: "Student",
        lastName: "A",
        email: `learning.student.a.${suffix}@example.com`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}01`,
      }),
      userSeed({
        firstName: "Student",
        lastName: "B",
        email: `learning.student.b.${suffix}@example.com`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}02`,
      }),
      userSeed({
        firstName: "University",
        lastName: "Admin",
        email: `learning.university.admin.${suffix}@example.com`,
        roleId: universityRole._id,
        phone: `${phoneSeed}03`,
      }),
      userSeed({
        firstName: "Dashboard",
        lastName: "Admin",
        email: `learning.dashboard.admin.${suffix}@example.com`,
        roleId: dashRole._id,
        phone: `${phoneSeed}04`,
      }),
    ]);

  const [studentEmployeeA, studentEmployeeB] = await EmployeeModel.create([
    {
      user_id: studentUserA._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      profile_headline: "Computer science student",
      university: universityA.name,
      university_id: universityA._id,
      student_profile: {
        university: universityA.name,
        university_id: universityA._id,
        student_email_verified: true,
        projects: [],
      },
    },
    {
      user_id: studentUserB._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      profile_headline: "Business student",
      university: universityB.name,
      university_id: universityB._id,
      student_profile: {
        university: universityB.name,
        university_id: universityB._id,
        student_email_verified: true,
        projects: [],
      },
    },
  ]);

  const [studentContextA, studentContextB, universityAdminContext] =
    await AccountContextModel.create([
      {
        user_id: studentUserA._id,
        context_key: `student:${studentEmployeeA._id}`,
        context_type: "student",
        entity_id: studentEmployeeA._id,
        entity_model: "employees",
        display_name: "Student A",
        status: "active",
        permissions: ["campus.profile.manage"],
        is_default: true,
      },
      {
        user_id: studentUserB._id,
        context_key: `student:${studentEmployeeB._id}`,
        context_type: "student",
        entity_id: studentEmployeeB._id,
        entity_model: "employees",
        display_name: "Student B",
        status: "active",
        permissions: ["campus.profile.manage"],
        is_default: true,
      },
      {
        user_id: universityAdminUser._id,
        context_key: `university_admin:${universityA._id}`,
        context_type: "university_admin",
        entity_id: universityA._id,
        entity_model: "universities",
        display_name: universityA.name,
        status: "active",
        permissions: ["campus.resources.view", "campus.resources.manage"],
        is_default: true,
      },
    ]);

  await Promise.all([
    UserModel.updateOne(
      { _id: studentUserA._id },
      { $set: { default_context_id: studentContextA._id } },
    ),
    UserModel.updateOne(
      { _id: studentUserB._id },
      { $set: { default_context_id: studentContextB._id } },
    ),
    UserModel.updateOne(
      { _id: universityAdminUser._id },
      { $set: { default_context_id: universityAdminContext._id } },
    ),
  ]);

  const device = { brand: "Learning Resources", model_name: "Integration", is_device: false };
  const [studentTokensA, studentTokensB, universityAdminTokens, dashboardAdminTokens] =
    await Promise.all([
      generateAuthTokens(studentUserA, device),
      generateAuthTokens(studentUserB, device),
      generateAuthTokens(universityAdminUser, device),
      generateAuthTokens(dashboardAdminUser, device),
    ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const category = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/learning-resource-categories", {
      token: dashboardAdminTokens.accessToken,
      body: {
        key: `cv-writing-${suffix}`,
        title: { en: "CV Writing", ar: "كتابة السيرة الذاتية" },
      },
    }),
    201,
    "dashboard admin creates learning resource category",
  );
  assert.equal(category.payload.data.key, `cv-writing-${suffix}`);

  await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/learning-resource-categories/${category.payload.data._id}`, {
      token: dashboardAdminTokens.accessToken,
      body: { icon: "file-text", sort_order: 1 },
    }),
    200,
    "dashboard admin updates learning resource category",
  );

  const draft = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/learning-resources", {
      token: dashboardAdminTokens.accessToken,
      body: resourceBody(suffix, {
        category_ids: [category.payload.data._id],
      }),
    }),
    201,
    "dashboard admin creates draft learning resource",
  );

  const hiddenDraftList = await expectStatus(
    request(baseUrl, "GET", "/user/v1/resources", {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student lists resources before draft publish",
  );
  assert.equal(hiddenDraftList.payload.data.length, 0, "draft resource should be hidden from students");

  const published = await expectStatus(
    request(baseUrl, "POST", `/dash/v1/learning-resources/${draft.payload.data.id}/publish`, {
      token: dashboardAdminTokens.accessToken,
      body: { visibility: "students" },
    }),
    200,
    "dashboard admin publishes learning resource",
  );
  assert.equal(published.payload.data.status, "published");

  const studentList = await expectStatus(
    request(baseUrl, "GET", "/user/v1/resources?tag=cv_writing", {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student lists published learning resources",
  );
  assert.equal(studentList.payload.data.length, 1, "student should see published learner resource");
  assert.equal(studentList.payload.data[0].slug, `learning-resource-${suffix}`);

  const detail = await expectStatus(
    request(baseUrl, "GET", `/user/v1/resources/learning-resource-${suffix}`, {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student opens learning resource detail by slug",
  );
  assert.equal(detail.payload.data.title, "Learning resource integration");

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/resources/${draft.payload.data.id}/save`, {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student saves learning resource",
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/resources/${draft.payload.data.id}/progress`, {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
      body: { progress_percent: 45, status: "in_progress" },
    }),
    200,
    "student updates learning resource progress",
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/resources/${draft.payload.data.id}/complete`, {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student completes learning resource",
  );

  const progress = await UserResourceProgressModel.findOne({
    user_id: studentUserA._id,
    resource_id: draft.payload.data.id,
  }).lean();
  assert.equal(progress.saved, true, "saved flag should persist");
  assert.equal(progress.status, "completed", "completion should persist");
  assert.equal(progress.progress_percent, 100, "completion should set percent to 100");

  const progressList = await expectStatus(
    request(baseUrl, "GET", "/user/v1/resources/me/progress", {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student lists learning progress",
  );
  assert.equal(progressList.payload.data.length, 1);
  assert.equal(progressList.payload.data[0].resource.slug, `learning-resource-${suffix}`);

  const recommended = await expectStatus(
    request(baseUrl, "GET", "/user/v1/resources/recommended?limit=5", {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "student lists recommended resources",
  );
  assert.ok(
    recommended.payload.data.some((item) => item.slug === `learning-resource-${suffix}`),
    "recommendations should include relevant learner resource",
  );

  const campusCompatibility = await expectStatus(
    request(baseUrl, "GET", "/user/v1/campus/resources", {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "campus resources endpoint uses learning library",
  );
  assert.equal(campusCompatibility.payload.source, "learning_resources");
  assert.equal(campusCompatibility.payload.data[0].slug, `learning-resource-${suffix}`);

  const universityPrivate = await expectStatus(
    request(baseUrl, "POST", "/university/v1/resources", {
      token: universityAdminTokens.accessToken,
      contextId: universityAdminContext._id,
      body: resourceBody(`private-${suffix}`, {
        key: `university-private-${suffix}`,
        slug: `university-private-${suffix}`,
        title: { en: "Private university resource", ar: "مصدر جامعي خاص" },
        visibility: "university_private",
        status: "published",
      }),
    }),
    201,
    "university admin creates private learning resource",
  );
  assert.equal(universityPrivate.payload.data.visibility, "university_private");

  const sameUniversityList = await expectStatus(
    request(baseUrl, "GET", "/user/v1/resources?search=Private", {
      token: studentTokensA.accessToken,
      contextId: studentContextA._id,
    }),
    200,
    "same-university student lists private resource",
  );
  assert.equal(sameUniversityList.payload.data.length, 1, "same university student should see private resource");

  const otherUniversityList = await expectStatus(
    request(baseUrl, "GET", "/user/v1/resources?search=Private", {
      token: studentTokensB.accessToken,
      contextId: studentContextB._id,
    }),
    200,
    "other-university student lists private resource",
  );
  assert.equal(otherUniversityList.payload.data.length, 0, "other university student should not see private resource");

  await expectStatus(
    request(baseUrl, "GET", `/user/v1/resources/${universityPrivate.payload.data.id}`, {
      token: studentTokensB.accessToken,
      contextId: studentContextB._id,
    }),
    404,
    "other-university student cannot open private resource",
  );

  await expectStatus(
    request(baseUrl, "POST", `/university/v1/resources/${draft.payload.data.id}/assign`, {
      token: universityAdminTokens.accessToken,
      contextId: universityAdminContext._id,
      body: { required: true, note: "Recommended before internships" },
    }),
    200,
    "university admin assigns platform resource",
  );
  const assignment = await UniversityResourceAssignmentModel.findOne({
    university_id: universityA._id,
    resource_id: draft.payload.data.id,
  }).lean();
  assert.equal(assignment.required, true, "assignment should be stored");

  const analytics = await expectStatus(
    request(baseUrl, "GET", "/university/v1/resources/analytics", {
      token: universityAdminTokens.accessToken,
      contextId: universityAdminContext._id,
    }),
    200,
    "university admin reads resource analytics",
  );
  assert.ok(analytics.payload.data.resources >= 1, "analytics should count university resources");

  await expectStatus(
    request(baseUrl, "POST", `/dash/v1/learning-resources/${draft.payload.data.id}/archive`, {
      token: dashboardAdminTokens.accessToken,
    }),
    200,
    "dashboard admin archives learning resource",
  );
  const archived = await LearningResourceModel.findById(draft.payload.data.id).lean();
  assert.equal(archived.status, "archived", "archive action should mark resource archived");

  console.log(
    "Learning resource integration verified for admin publishing/categories, seeker list/detail/save/progress/recommendations, campus compatibility, university-private visibility, assignment, and analytics.",
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
