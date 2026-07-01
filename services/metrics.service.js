// Prometheus /metrics endpoint. Off by default; set METRICS_ENABLED=true
// to expose it. Every mounted route contributes to:
//   - hala_http_requests_total{method,route,status}     (Counter)
//   - hala_http_request_duration_seconds{method,route}  (Histogram)
// plus the default node process metrics that prom-client ships (CPU,
// memory, event-loop lag, GC pauses, etc).
//
// Route label uses the express route pattern (e.g. "/user/v1/job/:id")
// rather than the raw path so metrics don't cardinality-explode on IDs.
// Unmatched requests (404s, bot scans, static /uploads/*) are labelled
// as "unmatched" for the same reason — feeding user-controlled path into
// a Prometheus label unbounds memory.

import client from "prom-client";

const METRICS_ENABLED =
  String(process.env.METRICS_ENABLED || "").trim().toLowerCase() === "true";

let register = null;
let httpRequestsTotal = null;
let httpDurationSeconds = null;

const ensureInitialised = () => {
  if (register) return;
  register = new client.Registry();
  register.setDefaultLabels({ service: "halajob-backend" });
  client.collectDefaultMetrics({ register });

  httpRequestsTotal = new client.Counter({
    name: "hala_http_requests_total",
    help: "Total HTTP requests, labelled by method / route / status.",
    labelNames: ["method", "route", "status"],
    registers: [register],
  });

  httpDurationSeconds = new client.Histogram({
    name: "hala_http_request_duration_seconds",
    help: "HTTP request duration in seconds, labelled by method / route.",
    labelNames: ["method", "route"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });
};

export const isMetricsEnabled = () => METRICS_ENABLED;

// Resolve the route label without letting user-controlled URL pieces
// leak into the Prometheus label set.
const routeLabelFor = (req) => {
  if (!req.route || !req.route.path) return "unmatched";
  // req.baseUrl is the mount prefix set by app.use("/prefix", router).
  // Combined with req.route.path this yields the parameterised template
  // "/user/v1/job/:id" — safe cardinality.
  return `${req.baseUrl || ""}${req.route.path}`;
};

// Express middleware — records the duration of each request and increments
// the counter on completion. Must be mounted BEFORE the app's routes so
// req.route is populated by the matched handler.
//
// Records on BOTH 'finish' and 'close' so client-aborted / upstream-
// disconnected requests are still counted (finish alone silently under-
// counts real traffic and Grafana error rates look artificially healthy).
export const httpMetricsMiddleware = (req, res, next) => {
  if (!METRICS_ENABLED) return next();
  ensureInitialised();
  const start = process.hrtime.bigint();
  let recorded = false;

  const record = (status) => {
    if (recorded) return;
    recorded = true;
    const nanos = Number(process.hrtime.bigint() - start);
    const seconds = nanos / 1e9;
    const labels = {
      method: req.method,
      route: routeLabelFor(req),
      status: String(status),
    };
    httpRequestsTotal.inc(labels);
    httpDurationSeconds.observe(
      { method: labels.method, route: labels.route },
      seconds,
    );
  };

  res.on("finish", () => record(res.statusCode));
  // "close" fires when the underlying connection closes before finish —
  // client abort, mid-response timeout, upstream reset. Record with a
  // sentinel 499 (nginx convention for "client closed request") so these
  // don't vanish from the count.
  res.on("close", () => {
    if (!res.writableEnded) record(499);
  });
  next();
};

// GET /metrics handler. When disabled, returns 404 so the endpoint is
// indistinguishable from "not mounted" for an outside caller.
export const metricsHandler = async (_req, res) => {
  if (!METRICS_ENABLED) {
    res.status(404).json({ success: false, message: "metrics_disabled" });
    return;
  }
  ensureInitialised();
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
};
