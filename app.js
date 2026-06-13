import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import userRoutes from "./routesUser/index.js";
import employeeRoutes from "./routesEmployee/index.js";
import companyRoutes from "./routesCompany/index.js";
import routesHealth from "./routesHealth/index.js";
import error from "./middlewares/error.js";

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

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (!isProduction) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error("not_allowed_by_cors");
    error.statusCode = 403;
    return callback(error);
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

app.use(
  "/uploads",
  express.static(uploadsPath, {
    maxAge: isProduction ? "7d" : 0,
    index: false,
    dotfiles: "deny",

    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      if (!isProduction) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    },
  })
);

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
  ],
  uploadLimiter
);

/* ----------------------------- Routes ----------------------------- */

app.use("/dash/v1", routes);
app.use("/employee/v1", employeeRoutes);
app.use("/company/v1", companyRoutes);
app.use("/health", routesHealth);
app.use("/user/v1", userRoutes);

/* ----------------------------- Error Handling ----------------------------- */

app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;