import assert from "node:assert/strict";

process.env.NODE_ENV ||= "test";
process.env.JWT_SECRET ||= "security-http-contract-secret";
process.env.CONNECTION_URL ||= "mongodb://127.0.0.1:27017/halajob-security-http-contract";
process.env.HEALTH_SECRET ||= "security-health-secret";

const { default: app } = await import("../app.js");

const server = app.listen(0);

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

try {
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
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
