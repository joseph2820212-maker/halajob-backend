import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "subscription-billing-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "subscription-billing-health-secret";

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

function companySeed({ name, email, ownerUserId, roleId }) {
  return {
    company_name: name,
    company_email: email,
    owner_user_id: ownerUserId,
    role_id: roleId,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 90,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-subscription-billing-${nowToken()}`,
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
    AuditLogModel,
    CompanyInvoiceModel,
    CompanyMemberModel,
    CompanyModel,
    CompanySubscriptionModel,
    CompanySupportTicketModel,
    RoleModel,
    SubscriptionPlanModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const [companyRole, dashRole, employeeRole] = await RoleModel.create([
    {
      log_to: "company",
      name: `subscription-company-${suffix}`,
      role_number: 3,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: `subscription-dash-admin-${suffix}`,
      role_number: 1,
      title_ar: "Dashboard Admin",
      title_en: "Dashboard Admin",
      status: true,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `subscription-employee-${suffix}`,
      role_number: 4,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const [ownerA, ownerB, billingMember, noBillingMember, seekerUser, adminUser] = await UserModel.create([
    userSeed({
      firstName: "Billing",
      lastName: "Alpha",
      email: `billing.alpha.owner.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Billing",
      lastName: "Beta",
      email: `billing.beta.owner.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Billing",
      lastName: "Member",
      email: `billing.member.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "No",
      lastName: "Billing",
      email: `billing.denied.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
    userSeed({
      firstName: "Billing",
      lastName: "Seeker",
      email: `billing.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}05`,
    }),
    userSeed({
      firstName: "Billing",
      lastName: "Admin",
      email: `billing.admin.${suffix}@example.com`,
      roleId: dashRole._id,
      phone: `${phoneSeed}06`,
    }),
  ]);

  const [companyA, companyB] = await CompanyModel.create([
    companySeed({
      name: `Billing Alpha ${suffix}`,
      email: `billing-alpha-${suffix}@company.example.com`,
      ownerUserId: ownerA._id,
      roleId: companyRole._id,
    }),
    companySeed({
      name: `Billing Beta ${suffix}`,
      email: `billing-beta-${suffix}@company.example.com`,
      ownerUserId: ownerB._id,
      roleId: companyRole._id,
    }),
  ]);

  await CompanyMemberModel.create([
    {
      company_id: companyA._id,
      user_id: billingMember._id,
      role_id: employeeRole._id,
      member_role: "recruiter",
      permissions: ["billing.manage"],
      status: "active",
      invited_by: ownerA._id,
      invited_at: new Date(),
    },
    {
      company_id: companyA._id,
      user_id: noBillingMember._id,
      role_id: employeeRole._id,
      member_role: "viewer",
      permissions: ["ats.view"],
      status: "active",
      invited_by: ownerA._id,
      invited_at: new Date(),
    },
  ]);

  const [ownerContextA, ownerContextB, billingContext, noBillingContext] = await AccountContextModel.create([
    {
      user_id: ownerA._id,
      context_key: `company_admin:${companyA._id}`,
      context_type: "company_admin",
      entity_id: companyA._id,
      entity_model: "companies",
      display_name: companyA.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: ownerB._id,
      context_key: `company_admin:${companyB._id}`,
      context_type: "company_admin",
      entity_id: companyB._id,
      entity_model: "companies",
      display_name: companyB.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: billingMember._id,
      context_key: `company_member:${companyA._id}`,
      context_type: "company_member",
      entity_id: companyA._id,
      entity_model: "companies",
      display_name: `${companyA.company_name} billing`,
      status: "active",
      permissions: ["billing.manage"],
      is_default: true,
    },
    {
      user_id: noBillingMember._id,
      context_key: `company_member:${companyA._id}`,
      context_type: "company_member",
      entity_id: companyA._id,
      entity_model: "companies",
      display_name: `${companyA.company_name} viewer`,
      status: "active",
      permissions: ["ats.view"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: ownerA._id }, { $set: { default_context_id: ownerContextA._id } }),
    UserModel.updateOne({ _id: ownerB._id }, { $set: { default_context_id: ownerContextB._id } }),
    UserModel.updateOne({ _id: billingMember._id }, { $set: { default_context_id: billingContext._id } }),
    UserModel.updateOne({ _id: noBillingMember._id }, { $set: { default_context_id: noBillingContext._id } }),
  ]);

  const [growthPlan, enterprisePlan] = await SubscriptionPlanModel.create([
    {
      key: `growth-${suffix}`.toLowerCase(),
      title_ar: "Growth",
      title_en: "Growth",
      description_ar: "Growth plan",
      description_en: "Growth plan",
      price: 99,
      currency_code: "USD",
      billing_period: "monthly",
      is_default: true,
      status: true,
      jobs_require_admin_approval: false,
      features: { can_post_jobs: true, can_download_cvs: true },
      limits: { job_posts: 10, cv_downloads: 50 },
    },
    {
      key: `enterprise-${suffix}`.toLowerCase(),
      title_ar: "Enterprise",
      title_en: "Enterprise",
      description_ar: "Enterprise plan",
      description_en: "Enterprise plan",
      price: 250,
      currency_code: "USD",
      billing_period: "monthly",
      status: true,
      jobs_require_admin_approval: true,
      features: { can_post_jobs: true, can_download_cvs: true },
      limits: { job_posts: 100, cv_downloads: 500 },
    },
  ]);

  const [subscriptionA, subscriptionB] = await CompanySubscriptionModel.create([
    {
      company_id: companyA._id,
      plan_id: growthPlan._id,
      plan_key: growthPlan.key,
      status: "active",
      starts_at: new Date(),
      features: { can_post_jobs: true, can_download_cvs: true },
      limits: { job_posts: 10, cv_downloads: 50 },
      usage: { job_posts: 2, cv_downloads: 3 },
      jobs_require_admin_approval: false,
      assigned_by: adminUser._id,
      admin_note: "Seeded by subscription integration test",
    },
    {
      company_id: companyB._id,
      plan_id: growthPlan._id,
      plan_key: growthPlan.key,
      status: "active",
      starts_at: new Date(),
      features: { can_post_jobs: true, can_download_cvs: true },
      limits: { job_posts: 10, cv_downloads: 50 },
      jobs_require_admin_approval: true,
      assigned_by: adminUser._id,
      admin_note: "Other company seed",
    },
  ]);

  const [invoiceA, invoiceB] = await CompanyInvoiceModel.create([
    {
      invoice_no: `INV-${suffix}-A`,
      company_id: companyA._id,
      subscription_id: subscriptionA._id,
      plan_id: growthPlan._id,
      plan_key: growthPlan.key,
      status: "paid",
      amount: 99,
      total_amount: 99,
      currency_code: "USD",
      billing_period: "monthly",
      items: [{ title: "Growth plan", quantity: 1, unit_price: 99, total: 99 }],
    },
    {
      invoice_no: `INV-${suffix}-B`,
      company_id: companyB._id,
      subscription_id: subscriptionB._id,
      plan_id: growthPlan._id,
      plan_key: growthPlan.key,
      status: "pending",
      amount: 99,
      total_amount: 99,
      currency_code: "USD",
      billing_period: "monthly",
      items: [{ title: "Growth plan", quantity: 1, unit_price: 99, total: 99 }],
    },
  ]);

  const device = { brand: "Subscription Runtime", model_name: "Integration", is_device: false };
  const [ownerATokens, ownerBTokens, billingMemberTokens, noBillingMemberTokens, seekerTokens, adminTokens] =
    await Promise.all([
      generateAuthTokens(ownerA, device),
      generateAuthTokens(ownerB, device),
      generateAuthTokens(billingMember, device),
      generateAuthTokens(noBillingMember, device),
      generateAuthTokens(seekerUser, device),
      generateAuthTokens(adminUser, device),
    ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/current"),
    401,
    "missing token company subscription"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/current", {
      token: seekerTokens.accessToken,
    }),
    403,
    "seeker denied company subscription"
  );

  const ownerSubscription = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/current", {
      token: ownerATokens.accessToken,
      headers: { "X-Active-Context-Id": String(ownerContextA._id) },
    }),
    200,
    "company owner reads own subscription"
  );
  assert.equal(ownerSubscription.data.plan_key, growthPlan.key);
  assert.equal(String(ownerSubscription.data.plan_id), String(growthPlan._id));
  assert.equal(ownerSubscription.data.jobs_require_admin_approval, false);

  const billingSummary = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/billing-summary", {
      token: billingMemberTokens.accessToken,
      headers: { "X-Active-Context-Id": String(billingContext._id) },
    }),
    200,
    "billing member reads billing summary"
  );
  assert.equal(billingSummary.data.subscription.plan_key, growthPlan.key);
  assert.equal(
    billingSummary.data.invoices_by_status.some((item) => item._id === "paid" && item.count === 1),
    true,
    "billing summary should include only company A paid invoice totals"
  );

  const invoiceList = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/invoices", {
      token: ownerATokens.accessToken,
      headers: { "X-Active-Context-Id": String(ownerContextA._id) },
    }),
    200,
    "company owner lists own invoices"
  );
  const ownInvoiceIds = (invoiceList.data || []).map((item) => String(item._id || item.id));
  assert.deepEqual(ownInvoiceIds, [String(invoiceA._id)], "company invoice list must not include other company invoice");

  const invoiceDetail = await expectStatus(
    request(baseUrl, "GET", `/company/v1/global/subscription/invoices/${invoiceA._id}`, {
      token: ownerATokens.accessToken,
      headers: { "X-Active-Context-Id": String(ownerContextA._id) },
    }),
    200,
    "company owner reads own invoice"
  );
  assert.equal(String(invoiceDetail.data._id), String(invoiceA._id));
  assert.equal(invoiceDetail.data.invoice_no, invoiceA.invoice_no);

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/global/subscription/invoices/${invoiceB._id}`, {
      token: ownerATokens.accessToken,
      headers: { "X-Active-Context-Id": String(ownerContextA._id) },
    }),
    404,
    "company owner cannot read another company invoice"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/invoices/not-an-id", {
      token: ownerATokens.accessToken,
      headers: { "X-Active-Context-Id": String(ownerContextA._id) },
    }),
    400,
    "company invoice invalid id"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/current", {
      token: noBillingMemberTokens.accessToken,
      headers: { "X-Active-Context-Id": String(noBillingContext._id) },
    }),
    403,
    "company member without billing permission is denied"
  );

  const supportBefore = await CompanySupportTicketModel.countDocuments({ company_id: companyA._id });
  const requestPayload = await expectStatus(
    request(baseUrl, "POST", "/company/v1/global/subscription/request", {
      token: billingMemberTokens.accessToken,
      headers: { "X-Active-Context-Id": String(billingContext._id) },
      body: { plan_name: "Enterprise", plan_key: enterprisePlan.key },
    }),
    201,
    "billing member creates plan-change support request"
  );
  assert.equal(requestPayload.data.type, "subscription_request");
  assert.equal(String(requestPayload.data.company_id), String(companyA._id));
  assert.equal(
    await CompanySupportTicketModel.countDocuments({ company_id: companyA._id }),
    supportBefore + 1,
    "plan change request should create one company support ticket"
  );
  assert.equal(
    await AuditLogModel.countDocuments({
      company_id: companyA._id,
      action: "subscription_request_created",
      entity_type: "support_ticket",
    }),
    1,
    "plan change request should be audit logged"
  );

  const companyBInvoiceAfterDenied = await CompanyInvoiceModel.findById(invoiceB._id).lean();
  assert.equal(companyBInvoiceAfterDenied.status, "pending", "cross-company invoice read must not mutate invoices");

  await expectStatus(
    request(baseUrl, "GET", `/dash/v1/subscriptions/companies/${companyA._id}`, {
      token: seekerTokens.accessToken,
    }),
    403,
    "non-admin denied dashboard subscription read"
  );

  const adminSubscription = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/subscriptions/companies/${companyA._id}`, {
      token: adminTokens.accessToken,
    }),
    200,
    "dashboard admin reads company subscription"
  );
  assert.equal(adminSubscription.data.plan_key, growthPlan.key);

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/subscriptions/companies/not-a-company", {
      token: adminTokens.accessToken,
    }),
    400,
    "dashboard subscription invalid company id"
  );

  const seedFreePayload = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/subscriptions/seed-free", {
      token: adminTokens.accessToken,
      body: {},
    }),
    201,
    "dashboard admin seeds free plan"
  );
  assert.equal(seedFreePayload.data.key, "free");
  assert.equal(
    await SubscriptionPlanModel.countDocuments({ key: "free", is_default: true, is_system: true }),
    1,
    "free plan seeding should be idempotent"
  );

  const assignPayload = await expectStatus(
    request(baseUrl, "POST", `/dash/v1/subscriptions/companies/${companyA._id}/assign-plan`, {
      token: adminTokens.accessToken,
      body: {
        plan_id: enterprisePlan._id,
        admin_note: "Upgrade verified by runtime integration",
      },
    }),
    201,
    "dashboard admin assigns subscription plan"
  );
  assert.equal(assignPayload.data.plan_key, enterprisePlan.key);

  const refreshedSubscription = await CompanySubscriptionModel.findById(subscriptionA._id).lean();
  assert.equal(refreshedSubscription.status, "cancelled", "old active subscription should be cancelled on reassignment");

  const companySnapshot = await CompanyModel.findById(companyA._id).lean();
  assert.equal(companySnapshot.subscription.plan_key, enterprisePlan.key);
  assert.equal(
    String(companySnapshot.subscription.subscription_id),
    String(assignPayload.data._id),
    "company subscription snapshot should point at the newly assigned subscription"
  );

  await expectStatus(
    request(baseUrl, "POST", `/dash/v1/subscriptions/companies/${companyB._id}/assign-plan`, {
      token: adminTokens.accessToken,
      body: { plan_id: new mongoose.Types.ObjectId().toString() },
    }),
    404,
    "dashboard admin cannot assign a missing plan"
  );

  const companyBAfterMissingPlan = await CompanySubscriptionModel.findOne({
    company_id: companyB._id,
    status: "active",
  }).lean();
  assert.equal(
    String(companyBAfterMissingPlan._id),
    String(subscriptionB._id),
    "missing plan assignment must not cancel the existing company subscription"
  );

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/global/subscription/invoices/${invoiceA._id}`, {
      token: ownerBTokens.accessToken,
      headers: { "X-Active-Context-Id": String(ownerContextB._id) },
    }),
    404,
    "company B cannot read company A invoice"
  );

  console.log("Subscription billing integration verified for company billing permissions, invoice ownership, plan requests, and admin plan assignment.");
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
