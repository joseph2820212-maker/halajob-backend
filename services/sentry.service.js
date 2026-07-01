// Sentry integration. No-op unless SENTRY_DSN is set — this file is safe
// to import from anywhere and is safe to run in local dev without any
// Sentry account.
//
// When enabled:
//   - Sentry.init picks up SENTRY_DSN, SENTRY_ENVIRONMENT (defaults to
//     NODE_ENV or "development"), and SENTRY_TRACES_SAMPLE_RATE (default
//     0.1 = 10% of requests traced).
//   - initSentryHttpHooks(app) wires the request handler + tracing handler
//     so every request auto-creates a transaction; call BEFORE the app's
//     route stack.
//   - initSentryErrorHook(app) wires the error handler; call AFTER routes
//     but BEFORE any custom error middleware.
//   - captureException(err, extra) is the manual API to record an error
//     that was already caught (matches Sentry.captureException's shape).

import * as Sentry from "@sentry/node";

const DSN = String(process.env.SENTRY_DSN || "").trim();
const ENABLED = Boolean(DSN);

let initialised = false;

const ensureInit = () => {
  if (initialised || !ENABLED) return;
  const environment =
    String(process.env.SENTRY_ENVIRONMENT || "").trim() ||
    String(process.env.NODE_ENV || "").trim() ||
    "development";
  const tracesSampleRate = Math.max(
    0,
    Math.min(
      1,
      Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1") || 0.1,
    ),
  );
  Sentry.init({
    dsn: DSN,
    environment,
    tracesSampleRate,
    // Keep the fingerprint tight — Sentry's defaults for the express
    // integration are fine.
  });
  initialised = true;
};

export const isSentryEnabled = () => ENABLED;

// Manually record an error you already caught. Pass `extra` to attach
// arbitrary context (userId, requestId, etc). No-op when Sentry isn't
// configured, so this is safe to call from any handler.
export const captureException = (err, extra) => {
  if (!ENABLED) return;
  ensureInit();
  try {
    if (extra && typeof extra === "object") {
      Sentry.withScope((scope) => {
        for (const [key, value] of Object.entries(extra)) {
          scope.setExtra(key, value);
        }
        Sentry.captureException(err);
      });
    } else {
      Sentry.captureException(err);
    }
  } catch (_) {
    /* never let Sentry itself crash the request */
  }
};

// Attach Sentry's express handlers. Called from app.js.
//
// - initSentryHttpHooks runs before all route middleware so every request
//   gets a Sentry transaction (assuming tracesSampleRate > 0).
// - initSentryErrorHook runs after all routes so it sees unhandled errors
//   from the route stack.
export const initSentryHttpHooks = (app) => {
  if (!ENABLED) return;
  ensureInit();
  // v8+ integrates via the http integration by default; the request /
  // tracing handlers are exposed under Sentry.Handlers only in v7. Try
  // v7 first; fall through to v8's setupExpressErrorHandler-only path.
  const handlers = Sentry.Handlers;
  if (handlers?.requestHandler) {
    app.use(handlers.requestHandler());
  }
  if (handlers?.tracingHandler) {
    app.use(handlers.tracingHandler());
  }
};

export const initSentryErrorHook = (app) => {
  if (!ENABLED) return;
  ensureInit();
  if (typeof Sentry.setupExpressErrorHandler === "function") {
    Sentry.setupExpressErrorHandler(app);
    return;
  }
  const handlers = Sentry.Handlers;
  if (handlers?.errorHandler) {
    app.use(handlers.errorHandler());
  }
};
