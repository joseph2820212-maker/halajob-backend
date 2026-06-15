process.env.NODE_ENV = "production";
process.env.JWT_SECRET ||= "smoke-test-secret";
process.env.CONNECTION_URL ||= "mongodb://127.0.0.1:27017/jobzain-smoke";
process.env.CORS_ORIGINS = "https://jobzain.com,https://hala-job.vercel.app";
process.env.CORS_ORIGIN_PATTERNS = "https://*.vercel.app";

const { default: app } = await import("../app.js");

const server = app.listen(0);

const requestPreflight = async (port, origin) =>
  fetch(`http://127.0.0.1:${port}/user/v1/job/get`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type",
    },
  });

try {
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const exact = await requestPreflight(port, "https://hala-job.vercel.app");
  if (exact.status !== 204 || exact.headers.get("access-control-allow-origin") !== "https://hala-job.vercel.app") {
    throw new Error("exact Vercel origin was not allowed by CORS");
  }

  const preview = await requestPreflight(port, "https://halajobe-git-website-implementation-user.vercel.app");
  if (preview.status !== 204 || preview.headers.get("access-control-allow-origin") !== "https://halajobe-git-website-implementation-user.vercel.app") {
    throw new Error("Vercel preview origin pattern was not allowed by CORS");
  }

  const blocked = await requestPreflight(port, "https://example.com");
  if (blocked.headers.get("access-control-allow-origin")) {
    throw new Error("unknown origin should not receive an allow-origin header");
  }

  console.log("cors smoke check passed");
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
