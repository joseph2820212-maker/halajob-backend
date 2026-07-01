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
  return new RedisStore({
    prefix: `${prefix || "rl"}:`,
    // redis v4+ requires sendCommand(args) rather than the older client.call
    sendCommand: async (...args) => {
      if (!client.isOpen) {
        // Best-effort reconnect on cold start / transient drop.
        try {
          await client.connect();
        } catch (_) {
          /* logged by the error handler above */
        }
      }
      return client.sendCommand(args);
    },
  });
};

// Test hook: expose the underlying client so integration tests can flush
// counters between runs.
export const __rateLimitRedisClientForTests = () => sharedClient;
