import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
import error from "./middlewares/error.js";
import ApiError from "./utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

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

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (!isProduction) {
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

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ----------------------------- Rate Limits ----------------------------- */

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "too_many_requests",
  },
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
app.use("/user/v1", userRoutes);

/* ----------------------------- Error Handling ----------------------------- */

app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;
