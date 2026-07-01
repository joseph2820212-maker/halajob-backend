// Prometheus /metrics endpoint. Off by default; set METRICS_ENABLED=true
// to expose it. Every mounted route contributes to:
//   - hala_http_requests_total{method,route,status}     (Counter)
//   - hala_http_request_duration_seconds{method,route}  (Histogram)
// plus the default node process metrics that prom-client ships (CPU,
// memory, event-loop lag, GC pauses, etc).
//
// Route labels use the express route pattern (e.g. "/user/v1/job/:id")
// rather than the raw path so metrics don't cardinality-explode on IDs.

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

// Express middleware — records the duration of each request and increments
// the counter on completion. Must be mounted BEFORE the app's routes so the
// req.route reference is populated by the matched handler.
export const httpMetricsMiddleware = (req, res, next) => {
  if (!METRICS_ENABLED) return next();
  ensureInitialised();
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const nanos = Number(process.hrtime.bigint() - start);
    const seconds = nanos / 1e9;
    // req.route is populated by express when a route matches; falls back to
    // req.baseUrl + req.path when nothing matched (404 catch-all).
    const routePattern = req.route
      ? `${req.baseUrl || ""}${req.route.path}`
      : `${req.baseUrl || ""}${req.path}`;
    const labels = {
      method: req.method,
      route: routePattern || "unknown",
      status: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpDurationSeconds.observe(
      { method: labels.method, route: labels.route },
      seconds,
    );
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
