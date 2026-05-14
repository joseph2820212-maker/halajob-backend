import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import routes from "./routes/index.js";
import userRoutes from "./routesUser/index.js";
import employeeRoutes from "./routesEmployee/index.js";
import routesHealth from "./routesHealth/index.js";
import error from "./middlewares/error.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", true);

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:3000",
// ];

// const corsOptions = {
//   origin(origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     return callback(new Error("Not allowed by CORS"));
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//   allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "lan"],
//   exposedHeaders: ["Content-Disposition", "Content-Length", "Content-Type"],
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));


//temp
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "lan",
  ],
  exposedHeaders: [
    "Content-Disposition",
    "Content-Length",
    "Content-Type",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
//end temp

app.use(express.json({ limit: "10mb", type: "application/json" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// app.use(helmet());
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);
app.use(compression());
app.use(mongoSanitize());

// app.use(
//   "/uploads",
//   express.static(path.join(process.cwd(), "uploads"), {
//     maxAge: "7d",
//     index: false,
//   })
// );
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "7d",
    index: false,
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use("/dash/v1", routes);
app.use("/employee/v1", employeeRoutes);
app.use("/health", routesHealth);
app.use("/user/v1", userRoutes);

app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;