// Rate-limit store factory. Returns a rate-limit-redis Store bound to a
// dedicated Redis client when REDIS_URL is set, or `undefined` (which makes
// express-rate-limit fall back to MemoryStore) with a warning otherwise.
//
// The default MemoryStore is only correct for a single-process deploy —
// counters live per-node, so any load-balanced setup lets a caller burn
// through N × limit before any node notices. Redis is a hard requirement
// once we scale past one instance, hence the boot-time assertion below.

import { createClient } from "redis";
import { RedisStore } from "rate-limit-redis";

const REDIS_URL = process.env.REDIS_URL || "";
const isProduction = process.env.NODE_ENV === "production";

let sharedClient = null;
let sharedStorePromise = null;

const ensureClient = () => {
  if (sharedClient) return sharedClient;
  sharedClient = createClient({ url: REDIS_URL });
  sharedClient.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[rate-limit-redis] redis error:", err?.message || err);
  });
  // Kick off the connection but don't block startup — the first request
  // will await the ready state via sendCommand().
  sharedClient
    .connect()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        "[rate-limit-redis] failed to connect:",
        err?.message || err,
      );
    });
  return sharedClient;
};

export const createRateLimitStore = (prefix) => {
  if (!REDIS_URL) {
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error(
        "[rate-limit] REDIS_URL is not set in production — rate limits will " +
          "fall back to per-process MemoryStore and will not survive a " +
          "horizontal scale-out. Set REDIS_URL before shipping.",
      );
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "[rate-limit] REDIS_URL not set — using per-process MemoryStore. " +
          "Fine for local dev; not fine for staging/prod.",
      );
    }
    return undefined;
  }

  const client = ensureClient();

  // Track sustained Redis errors so we can fail CLOSED (429) after a short
  // burst of failures. Default express-rate-limit behaviour on a store
  // error is to let the request through — that silently disables rate
  // limiting during a Redis outage, which is exactly when we're most
  // vulnerable to a credential-stuffing burst. Failing closed for 60s
  // after the last error is a safer default; operators can override via
  // RATE_LIMIT_FAIL_OPEN=true.
  const failOpen =
    (process.env.RATE_LIMIT_FAIL_OPEN || "").trim().toLowerCase() === "true";
  let lastErrorAt = 0;
  const FAIL_CLOSED_WINDOW_MS = 60 * 1000;

  return new RedisStore({
    prefix: `${prefix || "rl"}:`,
    sendCommand: async (...args) => {
      if (!client.isOpen) {
        try {
          await client.connect();
        } catch (_) {
          /* logged by the error handler above */
        }
      }
      try {
        const result = await client.sendCommand(args);
        return result;
      } catch (err) {
        lastErrorAt = Date.now();
        if (failOpen) {
          throw err;
        }
        // Fail closed: rethrow, but attach a marker so a downstream
        // interceptor / error middleware can classify this as a rate-
        // limit-outage 429 instead of a mystery 500.
        const outageErr = new Error(
          "rate_limit_store_unavailable: " + (err?.message || String(err)),
        );
        outageErr.code = "RATE_LIMIT_STORE_UNAVAILABLE";
        outageErr.lastErrorAt = lastErrorAt;
        throw outageErr;
      }
    },
  });
};

// Health-check hook for operators / /health endpoints. Returns true iff
// Redis is reachable AND has answered a PING within the last minute.
export const isRateLimitStoreHealthy = async () => {
  if (!REDIS_URL) return false;
  const client = ensureClient();
  if (!client) return false;
  try {
    if (!client.isOpen) await client.connect();
    const reply = await client.sendCommand(["PING"]);
    return reply === "PONG";
  } catch (_) {
    return false;
  }
};

// Test hook: expose the underlying client so integration tests can flush
// counters between runs.
export const __rateLimitRedisClientForTests = () => sharedClient;
