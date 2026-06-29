import fs from "fs";
import puppeteer from "puppeteer";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const logPath = new URL("../tmp-smoke-web-portals.log", import.meta.url);
const smokeOrigin = new URL(baseUrl).origin;

const knownBrowserPaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const executablePath = knownBrowserPaths.find((candidate) => fs.existsSync(candidate));

const log = (message) => {
  fs.appendFileSync(logPath, `${message}\n`);
  console.log(message);
};

fs.writeFileSync(logPath, "");

const routes = [
  { path: "/", name: "home" },
  { path: "/campus", name: "campus" },
  { path: "/company", name: "company" },
  { path: "/seeker", name: "seeker" },
  { path: "/admin", name: "admin" },
];

const routeActions = {
  campus: ["opportunities", "applications", "career passport", "resources", "interview prep", "job alerts", "events", "talent visibility", "notifications", "settings", "University portal", "students", "verifications", "partners", "post internship", "members", "events/resources"],
  company: ["jobs", "applicants", "interviews", "talent pool", "messages/templates", "campus", "salary guidance", "public profile", "billing", "team/settings", "analytics", "support", "reviews"],
  seeker: ["jobs", "applications", "interviews", "offers", "saved", "job alerts", "cv studio", "resources", "salary insights", "companies", "interview prep", "notifications", "settings"],
  admin: ["moderation", "users", "companies", "universities", "resource library", "platform settings", "communication logs", "salary insights", "subscriptions", "support/legal"],
};

const forbiddenRouteButtons = {
  campus: ["profile"],
  company: ["pipeline", "invitations", "subscription", "members", "library", "profile"],
  seeker: ["profile", "cv builder"],
  admin: ["jobs", "trust", "analytics", "talent"],
};

const clientSettingsPayload = {
  data: {
    features: {
      ai_tools_enabled: false,
      cv_parsing_enabled: true,
      resource_library_enabled: true,
      salary_insights_enabled: true,
    },
    security: { otp_digits: 5 },
    localization: { default_currency: "SYP" },
  },
};

const corsHeadersFor = (request) => ({
  "Access-Control-Allow-Origin": request.headers().origin || smokeOrigin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    request.headers()["access-control-request-headers"] ||
    "authorization,content-type,x-lang,x-requested-with",
});

const isExpectedBrowserResourceError = (text) =>
  /Failed to load resource: the server responded with a status of 4\d\d/.test(text) ||
  text === "Failed to load resource: net::ERR_FAILED";

log(`launch browser ${executablePath || "puppeteer-default"}`);
const browser = await puppeteer.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: "new",
  protocolTimeout: 45000,
  args: ["--no-first-run", "--no-default-browser-check", "--disable-dev-shm-usage", "--no-sandbox"],
});
log("browser launched");
const page = await browser.newPage();
log("new page created");

page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(10000);

const pageErrors = [];
const consoleErrors = [];
const httpErrors = [];
const fatalHttpErrors = [];
const requestFailures = [];
const missingActions = [];
const forbiddenActions = [];

page.on("pageerror", (error) => {
  pageErrors.push(error.message);
  log(`pageerror ${error.message}`);
});

page.on("console", (message) => {
  if (message.type() === "error") {
    const text = message.text();
    if (isExpectedBrowserResourceError(text)) {
      log(`console-resource ${text}`);
      return;
    }
    consoleErrors.push(text);
    log(`console-error ${text}`);
  }
});

page.on("response", async (response) => {
  const status = response.status();
  if (status < 400) return;
  const url = response.url();
  const message = `${status} ${url}`;
  httpErrors.push(message);
  if (status >= 500) fatalHttpErrors.push(message);
  log(`http-error ${message}`);
});

page.on("requestfailed", (request) => {
  const failure = request.failure()?.errorText || "request_failed";
  if (failure === "net::ERR_ABORTED") {
    log(`request-aborted ${request.url()}`);
    return;
  }
  const message = `${failure} ${request.url()}`;
  requestFailures.push(message);
  log(`request-failed ${message}`);
});

await page.setRequestInterception(true);
page.on("request", (request) => {
  const url = new URL(request.url());
  if (url.hostname === "jobzain.com" && request.method() === "OPTIONS") {
    log(`stub-options ${url.pathname}`);
    request.respond({
      status: 204,
      headers: corsHeadersFor(request),
    });
    return;
  }
  if (
    url.pathname === "/public/v1/client-settings" ||
    url.pathname === "/public/v1/settings/client"
  ) {
    log(`stub ${url.pathname}`);
    request.respond({
      status: 200,
      headers: corsHeadersFor(request),
      contentType: "application/json",
      body: JSON.stringify(clientSettingsPayload),
    });
    return;
  }
  if (url.pathname === "/public/v1/salary-insights") {
    log(`stub ${url.pathname}`);
    request.respond({
      status: 200,
      headers: corsHeadersFor(request),
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
    return;
  }
  if (url.hostname === "jobzain.com") {
    log(`stub-api ${url.pathname}`);
    request.respond({
      status: 200,
      headers: corsHeadersFor(request),
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
    return;
  }
  request.continue();
});

await page.evaluateOnNewDocument(() => {
  localStorage.setItem("jz_lang", "en");
});

const clickByText = async (text) => {
  const clicked = await page.evaluate((label) => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    const candidates = Array.from(document.querySelectorAll("button, summary"));
    const target = candidates.find((node) => normalize(node.textContent) === label);
    if (!target) return false;
    target.click();
    return true;
  }, text);
  log(`click ${text} ${clicked ? "ok" : "missing"}`);
  await new Promise((resolve) => setTimeout(resolve, 800));
  return clicked;
};

try {
  log(`open ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  log("initial goto ready");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  log("initial settle done");

  for (const route of routes) {
    log(`route start ${route.name}`);
    if (route.path === "/") {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      log(`route ${route.name} goto ready`);
    } else {
      await page.evaluate((path) => {
        history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, route.path);
      log(`route ${route.name} pushState done`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    log(`route ${route.name} settled`);

    const mainText = await page.evaluate(() =>
      (document.querySelector("main")?.textContent || document.body.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600)
    );
    const buttons = await page.$$eval("button, summary", (nodes) =>
      nodes
        .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, 40)
    );

    log(`route ${route.name} text ${mainText}`);
    log(`route ${route.name} buttons ${JSON.stringify(buttons)}`);
    log("---");

    const actions = routeActions[route.name] || [];
    for (const forbidden of forbiddenRouteButtons[route.name] || []) {
      if (buttons.includes(forbidden)) {
        const message = `${route.name}:${forbidden}`;
        forbiddenActions.push(message);
        log(`forbidden-action ${message}`);
      }
    }

    for (const action of actions) {
      const errorStart = httpErrors.length;
      const clicked = await clickByText(action);
      if (!clicked) missingActions.push(`${route.name}:${action}`);
      const actionText = await page.evaluate(() =>
        (document.querySelector("main")?.textContent || document.body.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 260)
      );
      const newErrors = httpErrors.slice(errorStart);
      log(`after ${route.name}:${action} ${actionText}`);
      if (newErrors.length) log(`after ${route.name}:${action} http-errors ${JSON.stringify(newErrors)}`);
    }
  }

  if (pageErrors.length) {
    log(`page-errors ${JSON.stringify(pageErrors)}`);
  }
  if (consoleErrors.length) {
    log(`console-errors ${JSON.stringify(consoleErrors)}`);
  }
  if (httpErrors.length) {
    log(`http-errors ${JSON.stringify(httpErrors)}`);
  }
  if (fatalHttpErrors.length) {
    log(`fatal-http-errors ${JSON.stringify(fatalHttpErrors)}`);
  }
  if (requestFailures.length) {
    log(`request-failures ${JSON.stringify(requestFailures)}`);
  }
  if (missingActions.length) {
    log(`missing-actions ${JSON.stringify(missingActions)}`);
  }
  if (forbiddenActions.length) {
    log(`forbidden-actions ${JSON.stringify(forbiddenActions)}`);
  }

  const fatalFailures = [
    ...pageErrors.map((message) => `pageerror: ${message}`),
    ...consoleErrors.map((message) => `console-error: ${message}`),
    ...fatalHttpErrors.map((message) => `http-error: ${message}`),
    ...requestFailures.map((message) => `request-failed: ${message}`),
    ...missingActions.map((message) => `missing-action: ${message}`),
    ...forbiddenActions.map((message) => `forbidden-action: ${message}`),
  ];

  if (fatalFailures.length) {
    throw new Error(`web_portal_smoke_failed\n${fatalFailures.join("\n")}`);
  }
} finally {
  log("closing browser");
  await browser.close();
  log("browser closed");
}
