process.env.JWT_SECRET ||= "smoke-test-secret";
process.env.CONNECTION_URL ||= "mongodb://127.0.0.1:27017/jobzain-smoke";
process.env.HEALTH_SECRET ||= "smoke-health-secret";

const { default: app } = await import("../app.js");

const server = app.listen(0);

try {
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health?key=${process.env.HEALTH_SECRET}`);
  const body = await response.text();

  if (response.status !== 200 || !body.includes("API Health & Routes")) {
    throw new Error(`health smoke check failed with status ${response.status}`);
  }

  console.log("http smoke check passed");
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
