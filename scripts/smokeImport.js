process.env.JWT_SECRET ||= "smoke-test-secret";
process.env.CONNECTION_URL ||= "mongodb://127.0.0.1:27017/halajobe-smoke";

await import("../app.js");

console.log("app import smoke check passed");
