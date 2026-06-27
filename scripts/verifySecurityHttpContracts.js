import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

process.env.NODE_ENV ||= "test";
process.env.JWT_SECRET ||= "security-http-contract-secret";
process.env.CONNECTION_URL ||= "mongodb://127.0.0.1:27017/halajob-security-http-contract";
process.env.HEALTH_SECRET ||= "security-health-secret";

const { default: app } = await import("../app.js");

let server;
const uploadRoot = path.resolve(process.cwd(), "uploads");
const generatedCvDir = path.resolve(process.cwd(), "cv", "generated");
const privateUploadDir = path.join(uploadRoot, "files");
const uploadHtmlName = `security-inline-${Date.now()}.html`;
const privatePdfName = `security-private-${Date.now()}.pdf`;
const generatedCvName = `security-generated-${Date.now()}.pdf`;
const uploadHtmlPath = path.join(uploadRoot, uploadHtmlName);
const privatePdfPath = path.join(privateUploadDir, privatePdfName);
const generatedCvPath = path.join(generatedCvDir, generatedCvName);
const cleanupFiles = [uploadHtmlPath, privatePdfPath, generatedCvPath];

const protectedChecks = [
  ["GET", "/dash/v1/dashboard", "dashboard admin"],
  ["GET", "/dash/v1/resources/users", "dashboard generic resources"],
  ["GET", "/employee/v1/global/jobs", "employee canonical jobs"],
  ["POST", "/employee/v1/jobs/job-1/apply", "legacy employee mobile apply alias"],
  ["GET", "/employee/v1/applications", "legacy employee mobile applications alias"],
  ["GET", "/employee/v1/companies", "legacy employee mobile companies alias"],
  ["GET", "/company/v1/global", "company dashboard"],
  ["GET", "/university/v1/dashboard", "university admin"],
  ["GET", "/notifications/v1/list", "notifications"],
  ["POST", "/analytics/v1/events", "analytics tracking"],
  ["POST", "/ai/v1/profile/score", "employee AI"],
  ["POST", "/trust/v1/jobs/job-1/report", "trust report"],
  ["POST", "/trust/v1/jobs/job-1/documents", "trust company document response"],
  ["GET", "/campus/v1/student-verifications/me", "campus student verification"],
];

function jsonHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };
}

async function request(baseUrl, method, path, options = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: jsonHeaders(options.headers),
    ...(hasBody ? { body: JSON.stringify(options.body || {}) } : {}),
  });
}

async function assertStatus({ response, expectedStatus, label }) {
  assert.equal(
    response.status,
    expectedStatus,
    `${label} should return ${expectedStatus}; got ${response.status}`
  );
}

async function assertJsonMessage({ response, expectedStatus, label, includes }) {
  await assertStatus({ response, expectedStatus, label });
  const payload = await response.json();
  assert.equal(payload.statusCode, expectedStatus, `${label} should expose statusCode ${expectedStatus}`);
  if (includes) {
    assert.match(
      String(payload.message || ""),
      includes,
      `${label} should include ${includes} in its message`
    );
  }
}

async function assertJsonMessageFlexible({ response, expectedStatus, label, includes }) {
  await assertStatus({ response, expectedStatus, label });
  const payload = await response.json();
  assert.match(
    String(payload.message || payload.error || ""),
    includes,
    `${label} should include ${includes} in its message`
  );
}

try {
  await fs.promises.mkdir(privateUploadDir, { recursive: true });
  await fs.promises.mkdir(generatedCvDir, { recursive: true });
  await fs.promises.writeFile(uploadHtmlPath, "<html><body>unsafe inline upload</body></html>");
  await fs.promises.writeFile(privatePdfPath, "%PDF-1.4\n% private test document\n");
  await fs.promises.writeFile(generatedCvPath, "%PDF-1.4\n% generated CV test document\n");

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const healthWithoutSecret = await request(baseUrl, "GET", "/health");
  await assertStatus({
    response: healthWithoutSecret,
    expectedStatus: 403,
    label: "health without header secret",
  });

  const healthWithQuerySecret = await request(
    baseUrl,
    "GET",
    `/health?key=${process.env.HEALTH_SECRET}`
  );
  await assertStatus({
    response: healthWithQuerySecret,
    expectedStatus: 403,
    label: "health with query-string secret",
  });

  const healthWithHeaderSecret = await request(baseUrl, "GET", "/health", {
    headers: {
      "x-health-secret": process.env.HEALTH_SECRET,
    },
  });
  await assertStatus({
    response: healthWithHeaderSecret,
    expectedStatus: 200,
    label: "health with header secret",
  });

  const invalidCvExtension = await request(baseUrl, "GET", "/cv/generated/not-a-pdf.txt");
  await assertJsonMessage({
    response: invalidCvExtension,
    expectedStatus: 400,
    label: "generated CV invalid extension",
    includes: /invalid_cv_file/,
  });

  const traversalCvPath = await request(baseUrl, "GET", "/cv/generated/%2e%2e%2fsecret.pdf");
  assert.ok(
    [400, 404].includes(traversalCvPath.status),
    `generated CV traversal attempt should fail safely; got ${traversalCvPath.status}`
  );

  const generatedCv = await request(baseUrl, "GET", `/cv/generated/${generatedCvName}`);
  await assertStatus({
    response: generatedCv,
    expectedStatus: 200,
    label: "generated CV valid PDF download",
  });
  assert.match(
    String(generatedCv.headers.get("content-disposition") || ""),
    /attachment/i,
    "generated CV downloads should be attachments"
  );
  assert.equal(
    generatedCv.headers.get("x-content-type-options"),
    "nosniff",
    "generated CV downloads should include nosniff"
  );
  assert.equal(
    generatedCv.headers.get("cache-control"),
    "no-store",
    "generated CV downloads should not be cached"
  );

  const directPrivateUpload = await request(baseUrl, "GET", `/uploads/files/${privatePdfName}`);
  await assertStatus({
    response: directPrivateUpload,
    expectedStatus: 404,
    label: "direct private upload file access",
  });
  assert.equal(
    directPrivateUpload.headers.get("x-content-type-options"),
    "nosniff",
    "direct private upload denial should include nosniff"
  );
  assert.equal(
    directPrivateUpload.headers.get("cache-control"),
    "no-store",
    "direct private upload denial should not be cached"
  );

  const htmlUpload = await request(baseUrl, "GET", `/uploads/${uploadHtmlName}`);
  await assertStatus({
    response: htmlUpload,
    expectedStatus: 200,
    label: "root HTML upload static response",
  });
  assert.match(
    String(htmlUpload.headers.get("content-disposition") || ""),
    /attachment/i,
    "HTML uploads should be served as attachments"
  );
  assert.equal(
    htmlUpload.headers.get("x-content-type-options"),
    "nosniff",
    "HTML uploads should include nosniff"
  );
  assert.match(
    String(htmlUpload.headers.get("content-security-policy") || ""),
    /default-src 'none'/,
    "HTML uploads should include restrictive CSP"
  );

  for (const [path, label] of [
    ["/user/v1/auth/logout", "user logout"],
    ["/company/v1/auth/logout", "company logout"],
    ["/dash/v1/auth/logout", "dashboard logout"],
  ]) {
    const missingRefresh = await request(baseUrl, "POST", path);
    await assertJsonMessageFlexible({
      response: missingRefresh,
      expectedStatus: 400,
      label: `${label} missing refresh token`,
      includes: /Refresh token is required/,
    });
  }

  for (const [method, path, label] of protectedChecks) {
    const missingAuth = await request(baseUrl, method, path);
    await assertJsonMessage({
      response: missingAuth,
      expectedStatus: 401,
      label: `${label} missing token`,
      includes: /Authorization header missing or malformed/,
    });

    const malformedAuth = await request(baseUrl, method, path, {
      headers: {
        Authorization: "Bearer not-a-real-jwt",
      },
    });
    await assertJsonMessage({
      response: malformedAuth,
      expectedStatus: 401,
      label: `${label} malformed token`,
      includes: /Invalid or expired access token/,
    });
  }

  console.log(
    `Security HTTP contracts verified (${protectedChecks.length} protected route families).`
  );
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await Promise.all(cleanupFiles.map((file) => fs.promises.unlink(file).catch(() => null)));
}
