import fs from "fs";
import puppeteer from "puppeteer";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const logPath = new URL("../tmp-smoke-web-portals.log", import.meta.url);
const executablePath =
  process.env.PUPPETEER_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

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
  campus: ["opportunities", "applications", "profile", "notifications", "resources", "University portal", "students", "partners", "post internship"],
  company: ["jobs", "applicants", "pipeline", "invitations", "talent", "reviews", "subscription", "analytics", "support", "members", "library", "profile", "campus"],
  seeker: ["applications", "interviews", "offers", "saved", "companies", "profile", "notifications", "cv builder"],
  admin: ["companies", "jobs", "trust", "analytics", "talent", "universities", "subscriptions"],
};

log(`launch browser ${executablePath}`);
const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  protocolTimeout: 45000,
  args: ["--no-first-run", "--no-default-browser-check"],
});
log("browser launched");
const page = await browser.newPage();
log("new page created");

page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(10000);

const pageErrors = [];
const consoleErrors = [];
const httpErrors = [];

page.on("pageerror", (error) => {
  pageErrors.push(error.message);
  log(`pageerror ${error.message}`);
});

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
    log(`console-error ${message.text()}`);
  }
});

page.on("response", async (response) => {
  const status = response.status();
  if (status < 400) return;
  const url = response.url();
  const message = `${status} ${url}`;
  httpErrors.push(message);
  log(`http-error ${message}`);
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
    for (const action of actions) {
      const errorStart = httpErrors.length;
      await clickByText(action);
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
} finally {
  log("closing browser");
  await browser.close();
  log("browser closed");
}
