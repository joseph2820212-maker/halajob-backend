// Sentry integration. No-op unless SENTRY_DSN is set — this file is safe
// to import from anywhere and is safe to run in local dev without any
// Sentry account.
//
// @sentry/node v8+ retired the v7 Handlers.requestHandler / tracingHandler
// API. What we actually get from v10:
//   - Sentry.init() must run BEFORE the express import chain for auto-
//     instrumentation to see all the routes.
//   - Sentry.setupExpressErrorHandler(app) — the only handler we need to
//     mount on the app. Auto-instrumentation via OpenTelemetry handles
//     request/tracing under the hood; there's no requestHandler middleware
//     to mount.
//
// Because index.js already runs `import app from './app.js'` at the top,
// perfect init ordering (init BEFORE any import) would require moving init
// into a --import instrument.js file (see docs/OBSERVABILITY.md for the
// canonical setup). For the launch-hardening pass we ship the pragmatic
// path: init once on first import, capture errors via
// setupExpressErrorHandler, and warn the operator that tracing spans may
// not attach to inbound HTTP if init lands after express is imported.

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

// v8+ no longer exposes request/tracing handlers as middleware. Kept as a
// no-op entry point so the existing app.js callsite doesn't have to change
// — and so that if we later move to --import instrument.js we can rewire
// the init here without touching app.js.
export const initSentryHttpHooks = (_app) => {
  if (!ENABLED) return;
  ensureInit();
};

// Attach Sentry's express error handler AFTER the route stack. Must run
// BEFORE the app's own error middleware so Sentry sees the raw exception,
// not a serialised HTTP response.
export const initSentryErrorHook = (app) => {
  if (!ENABLED) return;
  ensureInit();
  if (typeof Sentry.setupExpressErrorHandler === "function") {
    Sentry.setupExpressErrorHandler(app);
  }
};
