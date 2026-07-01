import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import hpp from "hpp";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRateLimitStore } from "./services/rateLimitStore.js";
import { verifyCvPublicToken } from "./services/cvPublicToken.service.js";
import { httpMetricsMiddleware, metricsHandler, isMetricsEnabled } from "./services/metrics.service.js";
import { idempotencyMiddleware } from "./middlewares/idempotency.js";
import { initSentryHttpHooks, initSentryErrorHook, isSentryEnabled } from "./services/sentry.service.js";

import routes from "./routes/index.js";
import userRoutes from "./routesUser/index.js";
import employeeRoutes from "./routesEmployee/index.js";
import companyRoutes from "./routesCompany/index.js";
import jobsRoutes from "./routesJobs/index.js";
import aiRoutes from "./routesAi/index.js";
import analyticsRoutes from "./routesAnalytics/index.js";
import trustRoutes from "./routesTrust/index.js";
import trustAdminRoutes from "./routesTrust/admin.js";
import notificationRoutes from "./routesNotifications/index.js";
import campusRoutes from "./routesCampus/index.js";
import universityRoutes from "./routesUniversity/index.js";
import routesHealth from "./routesHealth/index.js";
import publicRoutes from "./routesPublic/index.js";
import error from "./middlewares/error.js";
import ApiError from "./utils/apiError.js";
import { EmployeeCvModel } from "./models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Explicit opt-in for the "allow any origin" behaviour that used to be
// implicit whenever NODE_ENV !== "production". Any staging/preview deploy
// without NODE_ENV=production was previously reflecting Access-Control-Allow-
// Origin for every caller. Now callers must set ALLOW_ANY_CORS=true (only
// safe for local dev) to reopen that door.
const allowAnyCors =
  (process.env.ALLOW_ANY_CORS || "").trim().toLowerCase() === "true";

// TRUST_PROXY controls how many upstream proxies express counts as trusted
// when reading req.ip. Vercel/Cloudflare/etc typically want 1; a bare host
// wants 0. Kept as env with a safe default of 1 for the current deploy shape.
const trustProxy = Number.parseInt(process.env.TRUST_PROXY || "1", 10);
app.set("trust proxy", Number.isFinite(trustProxy) ? trustProxy : 1);

/* ----------------------------- CORS ----------------------------- */

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const wildcardPatternToRegExp = (pattern) => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^.:/]+");
  return new RegExp(`^${escaped}$`);
};

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);
const allowedOriginPatterns = parseOrigins(process.env.CORS_ORIGIN_PATTERNS).map(wildcardPatternToRegExp);

const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) || allowedOriginPatterns.some((pattern) => pattern.test(origin));

// Boot-time assertion: production deploys must have a non-empty CORS_ORIGINS
// (or the explicit ALLOW_ANY_CORS bypass) so we never silently reflect
// Access-Control-Allow-Origin for the world. Non-production (staging,
// docs / verify scripts that import app.js, test runners) get a warning
// instead of a fatal — those contexts don't serve real traffic.
if (
  allowedOrigins.length === 0 &&
  allowedOriginPatterns.length === 0 &&
  !allowAnyCors
) {
  const msg =
    "[cors] CORS_ORIGINS is empty and ALLOW_ANY_CORS!=true. All cross-origin " +
    "requests will be denied. Set CORS_ORIGINS to the comma-separated list of " +
    "allowed origins.";
  if (isProduction) {
    // eslint-disable-next-line no-console
    console.error(`[cors] refusing to boot: ${msg}`);
    process.exit(1);
  } else {
    // eslint-disable-next-line no-console
    console.warn(msg);
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    // Explicit dev-time bypass. Never gated on NODE_ENV alone — we saw deploys
    // in the wild running with NODE_ENV unset, which used to reopen CORS to
    // the world. Now the bypass requires the operator to set the env var.
    if (allowAnyCors) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError(403, "not_allowed_by_cors", "CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "lan",
    "x-language",
    "X-Refresh-Token",
    "x-refresh-token",
    "X-Web-Client",
    "x-web-client",
    "X-Web-Auth-Scope",
    "x-web-auth-scope",
    "X-Active-Context-Id",
    "active_context_id",
  ],

  exposedHeaders: [
    "Content-Disposition",
    "Content-Length",
    "Content-Type",
  ],

  maxAge: 86400,
  optionsSuccessStatus: 204,
};

// Sentry request + tracing handlers must be the FIRST middleware so
// every request is captured, including ones that die inside CORS / rate
// limit. No-op when SENTRY_DSN is unset.
initSentryHttpHooks(app);
if (isSentryEnabled()) {
  // eslint-disable-next-line no-console
  console.log("[sentry] request tracing enabled");
}

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ----------------------------- Metrics ----------------------------- */

// Mount BEFORE routes so req.route is populated when the middleware fires.
// GET /metrics returns 404 when METRICS_ENABLED != true — indistinguishable
// from "not mounted" for outside callers, so scraping infra can hard-fail
// if the endpoint is expected but disabled.
app.use(httpMetricsMiddleware);
app.get("/metrics", metricsHandler);
if (isMetricsEnabled()) {
  // eslint-disable-next-line no-console
  console.log("[metrics] GET /metrics enabled");
}

/* ----------------------------- Idempotency ----------------------------- */

// Middleware is a no-op unless the request is a POST AND carries an
// Idempotency-Key header AND REDIS_URL is reachable. On a match, replays
// the cached response instead of running the handler.
app.use(idempotencyMiddleware);

/* ----------------------------- Rate Limits ----------------------------- */

// Key generator: fold the raw IP into a normalized form and combine it with
// the caller's identity when we have one. Without the /64 IPv6 grouping,
// attackers rotate the low 64 bits of an IPv6 address and defeat per-IP
// limits entirely — the abuse profile we saw in the pre-launch audit.
//
// - ipKeyGenerator collapses IPv6 addresses to /64 blocks and normalizes IPv4.
// - Auth-tier limits also key off normalized email/user_id so credential
//   stuffing from a botnet can't hide behind a fresh IP per attempt.
const identityKey = (req) => {
  const emailFromBody = String(req.body?.email || "").trim().toLowerCase();
  const emailFromQuery = String(req.query?.email || "").trim().toLowerCase();
  const phoneFromBody = String(req.body?.phone || req.body?.phone_national || "").trim();
  const userId = req.user?._id ? String(req.user._id) : "";
  return emailFromBody || emailFromQuery || phoneFromBody || userId || "";
};

const ipOnlyKey = (req) => ipKeyGenerator(req.ip || "");

const ipPlusIdentityKey = (req) => {
  const identity = identityKey(req);
  const ip = ipKeyGenerator(req.ip || "");
  return identity ? `${ip}|${identity}` : ip;
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "too_many_requests",
  },
  keyGenerator: ipOnlyKey,
  store: createRateLimitStore("rl:global"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "too_many_auth_requests",
  },
  keyGenerator: ipPlusIdentityKey,
  store: createRateLimitStore("rl:auth"),
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "too_many_upload_requests",
  },
  keyGenerator: ipPlusIdentityKey,
  store: createRateLimitStore("rl:upload"),
});

app.use(globalLimiter);

/* ----------------------------- Security Headers ----------------------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    // Enforce HTTPS for 1 year (incl. subdomains) and allow preload listing.
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

/* ----------------------------- Parsers ----------------------------- */

app.use(
  express.json({
    limit: process.env.JSON_LIMIT || "2mb",
    type: ["application/json", "application/*+json"],
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URL_ENCODED_LIMIT || "2mb",
    parameterLimit: 200,
  })
);

/* ----------------------------- Logs ----------------------------- */

if (!isProduction) {
  app.use(morgan("dev"));
}

/* ----------------------------- Extra Protection ----------------------------- */

app.use(compression());

app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

app.use(
  hpp({
    whitelist: [
      "sort",
      "fields",
      "select",
      "populate",
      "page",
      "limit",
      "keyword",
      "search",
      "status",
      "type",
      "ids",
    ],
  })
);

/* ----------------------------- Static Uploads ----------------------------- */

const uploadsPath = path.join(process.cwd(), "uploads");
const generatedCvPath = path.resolve(process.cwd(), "cv", "generated");
const inlineUploadExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".ico", ".ttf", ".woff", ".woff2"]);
const activeUploadExtensions = new Set([".svg", ".html", ".htm", ".xml"]);

const safeAttachmentName = (filePath) => path.basename(filePath).replace(/["\\]/g, "_");

const generatedCvRecordPath = (fileName) => path.posix.join("cv", "generated", fileName);
const generatedCvTokenFromRequest = (req) =>
  String(req.query.token || req.get("x-cv-download-token") || "").trim();
const allowUntrackedGeneratedCvDownloads =
  !isProduction &&
  String(process.env.ALLOW_UNTRACKED_GENERATED_CV_DOWNLOADS || "")
    .trim()
    .toLowerCase() === "true";

const verifyGeneratedCvPublicAccess = async (req, fileName) => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "cv_access_temporarily_unavailable", "CV");
  }

  const cv = await EmployeeCvModel.findOne({ pdf_file: generatedCvRecordPath(fileName) })
    .select("pdf_file +public_download_token public_download_expires_at")
    .lean();

  if (!cv) {
    if (allowUntrackedGeneratedCvDownloads) return;
    throw new ApiError(404, "cv_not_found", "CV");
  }

  if (String(cv.pdf_file || "") !== generatedCvRecordPath(fileName)) {
    throw new ApiError(403, "invalid_cv_public_link_token", "CV");
  }

  const storedToken = String(cv.public_download_token || "").trim();
  if (!storedToken) {
    throw new ApiError(403, "cv_public_link_token_required", "CV");
  }

  const expiresAt = cv.public_download_expires_at ? new Date(cv.public_download_expires_at).getTime() : 0;
  if (!expiresAt || expiresAt <= Date.now()) {
    throw new ApiError(410, "cv_public_link_expired", "CV");
  }

  // Timing-safe compare, and handles both SHA-256 stored rows (new default)
  // and legacy plaintext rows so pending share links keep working after this
  // deploy lands. See services/cvPublicToken.service.js.
  if (!verifyCvPublicToken(generatedCvTokenFromRequest(req), storedToken)) {
    throw new ApiError(403, "invalid_cv_public_link_token", "CV");
  }
};

app.use("/uploads/files", (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  return res.status(404).json({ status: false, message: "file_not_public" });
});

app.use(
  "/uploads",
  express.static(uploadsPath, {
    maxAge: isProduction ? "7d" : 0,
    index: false,
    dotfiles: "deny",

    setHeaders: (res, filePath) => {
      const extension = path.extname(filePath).toLowerCase();

      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      if (activeUploadExtensions.has(extension)) {
        res.setHeader("Content-Security-Policy", "default-src 'none'; img-src data:; style-src 'unsafe-inline'");
      }

      if (!inlineUploadExtensions.has(extension)) {
        res.setHeader("Content-Disposition", `attachment; filename="${safeAttachmentName(filePath)}"`);
      }

      if (!isProduction) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    },
  })
);

app.get("/cv/generated/:fileName", async (req, res, next) => {
  try {
    const fileName = String(req.params.fileName || "");
    const extension = path.extname(fileName).toLowerCase();

    if (path.basename(fileName) !== fileName || extension !== ".pdf") {
      throw new ApiError(400, "invalid_cv_file", "CV");
    }

    const filePath = path.resolve(generatedCvPath, fileName);
    if (!filePath.startsWith(generatedCvPath + path.sep)) {
      throw new ApiError(400, "invalid_cv_file", "CV");
    }

    await fs.promises.access(filePath, fs.constants.R_OK);
    await verifyGeneratedCvPublicAccess(req, fileName);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/pdf");

    if (!isProduction) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    return res.download(filePath, "cv.pdf");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return next(new ApiError(404, "cv_not_found", "CV"));
    }

    return next(error);
  }
});

/* ----------------------------- Routes Limits ----------------------------- */

app.use(
  [
    "/user/v1/auth",
    "/employee/v1/auth",
    "/company/v1/auth",
    "/dash/v1/auth",
  ],
  authLimiter
);

app.use(
  [
    "/user/v1/profile",
    "/employee/v1/profile",
    "/company/v1/profile",
    "/company/v1/media",
    "/company/v1/global/profile",
    "/company/v1/global/profile/media",
  ],
  uploadLimiter
);

/* ----------------------------- Routes ----------------------------- */

app.use("/dash/v1", routes);
app.use("/employee/v1", employeeRoutes);
app.use("/company/v1", companyRoutes);
app.use("/jobs/v1", jobsRoutes);
app.use("/ai/v1", aiRoutes);
app.use("/analytics/v1", analyticsRoutes);
app.use("/trust/v1", trustRoutes);
app.use("/admin/v1/trust", trustAdminRoutes);
app.use("/notifications/v1", notificationRoutes);
app.use("/campus/v1", campusRoutes);
app.use("/university/v1", universityRoutes);
app.use("/health", routesHealth);
app.use("/public/v1", publicRoutes);
app.use("/user/v1", userRoutes);

/* ----------------------------- Error Handling ----------------------------- */

// Sentry error handler runs BEFORE our own so it captures the exception
// before error.handler serialises it into an HTTP response. No-op when
// SENTRY_DSN is unset.
initSentryErrorHook(app);

app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;
