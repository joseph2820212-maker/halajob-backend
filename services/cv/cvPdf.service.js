import ejs from "ejs";
import puppeteer from "puppeteer";

export const renderCvHtml = ({ template, data }) => {
  return ejs.render(template.html, {
    ...data,
    css: template.css || "",
  });
};

// SSRF guard: CV templates are user-authored HTML/EJS. Without a request
// filter, page.setContent + waitUntil: "networkidle0" causes Chromium to
// fetch every <img>, <link>, and <script> src in the rendered document —
// which means a template that references http://169.254.169.254/... or
// http://internal-service.local/... can walk the internal network from
// the CV renderer. We block every request whose scheme is not data: or
// blob:. Local file URLs, http, and https are all denied.
const ALLOWED_URL_SCHEMES = new Set(["data:", "blob:"]);

// puppeteer was previously launched with --no-sandbox --disable-setuid-sandbox
// so it would work in unprivileged containers. That's a real risk boundary:
// the renderer parses templated HTML on behalf of authenticated users. We
// only re-enable those flags when the operator has explicitly opted in via
// PUPPETEER_ALLOW_NO_SANDBOX=true, which the deploy playbook restricts to
// hosts where the parent process is already sandboxed at the container edge.
const shouldAllowNoSandbox =
  (process.env.PUPPETEER_ALLOW_NO_SANDBOX || "").trim().toLowerCase() === "true";

const buildLaunchArgs = () => {
  const args = [];
  if (shouldAllowNoSandbox) {
    args.push("--no-sandbox", "--disable-setuid-sandbox");
  }
  return args;
};

export const generatePdfFromHtml = async (html) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: buildLaunchArgs(),
  });

  try {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      const scheme = (url.split(":")[0] || "").toLowerCase() + ":";
      if (ALLOWED_URL_SCHEMES.has(scheme)) {
        return request.continue();
      }
      return request.abort("blockedbyclient");
    });

    await page.setContent(html, {
      // No external requests survive the interceptor above, so waitUntil no
      // longer needs to worry about drifting network. "load" is enough.
      waitUntil: "load",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};
