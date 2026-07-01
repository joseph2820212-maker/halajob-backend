// Structured logger. Zero deps to keep the launch footprint tight.
//
// Output shape:
//   LOG_FORMAT=json   → one JSON line per event; drop-in for any log
//                       aggregator (Datadog / Elastic / Loki / CloudWatch).
//   LOG_FORMAT=pretty → human-readable colored output for local dev.
//                       Auto-selected when NODE_ENV isn't "production" and
//                       stdout is a TTY.
//
// LOG_LEVEL gates minimum severity (debug < info < warn < error).
//
// Every event carries: ts, level, msg, and any object fields passed as the
// second arg. Errors get their name/message/stack serialized instead of
// the raw class (JSON.stringify would drop them otherwise).

const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };
const LEVEL_COLORS = {
  debug: "\x1b[90m", // grey
  info: "\x1b[36m",  // cyan
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
  fatal: "\x1b[41m", // red-bg
};
const COLOR_RESET = "\x1b[0m";

const configuredLevel = () => {
  const raw = String(process.env.LOG_LEVEL || "").trim().toLowerCase();
  if (LEVEL_ORDER[raw]) return raw;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

const configuredFormat = () => {
  const raw = String(process.env.LOG_FORMAT || "").trim().toLowerCase();
  if (raw === "json" || raw === "pretty") return raw;
  if (process.env.NODE_ENV === "production") return "json";
  return process.stdout.isTTY ? "pretty" : "json";
};

const MIN_LEVEL = configuredLevel();
const FORMAT = configuredFormat();

const shouldLog = (level) =>
  (LEVEL_ORDER[level] || 100) >= (LEVEL_ORDER[MIN_LEVEL] || 20);

const serializeError = (err) => ({
  name: err?.name || "Error",
  message: err?.message || String(err),
  stack: err?.stack,
  // Extra fields many mongoose / express errors carry:
  code: err?.code,
  statusCode: err?.statusCode,
  ...(err?.cause ? { cause: serializeError(err.cause) } : {}),
});

const normalizeContext = (ctx) => {
  if (!ctx || typeof ctx !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (value instanceof Error) {
      out[key] = serializeError(value);
    } else if (typeof value === "bigint") {
      out[key] = value.toString();
    } else {
      out[key] = value;
    }
  }
  return out;
};

const emit = (level, msg, ctx) => {
  if (!shouldLog(level)) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg: String(msg ?? ""),
    ...normalizeContext(ctx),
  };
  const stream = level === "error" || level === "fatal" ? process.stderr : process.stdout;
  if (FORMAT === "pretty") {
    const color = LEVEL_COLORS[level] || "";
    const paddedLevel = level.toUpperCase().padEnd(5);
    const ctxStr = Object.keys(record).filter((k) => k !== "ts" && k !== "level" && k !== "msg").length
      ? " " + JSON.stringify(record, (k, v) => (k === "ts" || k === "level" || k === "msg" ? undefined : v))
      : "";
    stream.write(`${color}${paddedLevel}${COLOR_RESET} ${record.ts} ${record.msg}${ctxStr}\n`);
  } else {
    stream.write(JSON.stringify(record) + "\n");
  }
};

// Bind a context object that will be merged into every event this child
// emits. Great for request-scoped loggers: log.child({ request_id, user_id })
// carries those fields through without every call-site repeating them.
const makeLogger = (base = {}) => ({
  debug: (msg, ctx) => emit("debug", msg, { ...base, ...(ctx || {}) }),
  info: (msg, ctx) => emit("info", msg, { ...base, ...(ctx || {}) }),
  warn: (msg, ctx) => emit("warn", msg, { ...base, ...(ctx || {}) }),
  error: (msg, ctx) => emit("error", msg, { ...base, ...(ctx || {}) }),
  fatal: (msg, ctx) => emit("fatal", msg, { ...base, ...(ctx || {}) }),
  child: (extra) => makeLogger({ ...base, ...(extra || {}) }),
});

export const logger = makeLogger();
export default logger;
