// Idempotency-Key middleware. When a POST arrives with an Idempotency-Key
// header, we look up whether we've already processed that key for this
// user in the last IDEMPOTENCY_KEY_TTL_SECONDS (default 24h). If yes,
// replay the cached response — same status code, same body — without
// re-invoking the route handler. Otherwise, run the handler and cache
// what it wrote.
//
// This is what payment-gateway integrations expect and what protects
// against double-submits on flaky networks. Applies only to POST for
// now; extendable to PATCH once the client contracts settle.
//
// Requires REDIS_URL. When Redis is unavailable the middleware is a
// no-op (skipped instead of failing) so an outage doesn't take out
// writes — better to allow a rare duplicate than to lock everyone out.

import { createClient } from "redis";
import crypto from "crypto";

const TTL_SECONDS = Math.max(
  60,
  Number.parseInt(process.env.IDEMPOTENCY_KEY_TTL_SECONDS || "86400", 10) || 86400,
);

const KEY_HEADER = "idempotency-key";
const NAMESPACE = "idem:";

let sharedClient = null;
let clientAttempted = false;

const ensureClient = () => {
  if (sharedClient || clientAttempted) return sharedClient;
  clientAttempted = true;
  const url = process.env.REDIS_URL || "";
  if (!url) return null;
  sharedClient = createClient({ url });
  sharedClient.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[idempotency] redis error:", err?.message || err);
  });
  sharedClient
    .connect()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[idempotency] failed to connect:", err?.message || err);
    });
  return sharedClient;
};

// Idempotency-Key scope: per-user (so two different accounts can't collide
// on the same UUID). Falls back to (IP + normalized key) for unauth
// requests so guest POSTs still benefit.
const scopeIdentifier = (req) => {
  if (req.user?._id) return `u:${req.user._id}`;
  return `ip:${req.ip || "unknown"}`;
};

// Hash the caller-supplied key together with the route path so two
// different endpoints receiving the same key don't return each other's
// cached response.
const buildRedisKey = (req, keyHeader) => {
  const scope = scopeIdentifier(req);
  const route = `${req.method}:${req.baseUrl || ""}${req.path}`;
  const material = `${scope}|${route}|${keyHeader}`;
  return NAMESPACE + crypto.createHash("sha256").update(material).digest("hex");
};

export const idempotencyMiddleware = async (req, res, next) => {
  // Only POST for now. GET/PATCH/DELETE flows either don't have the
  // duplicate-submit problem or need per-endpoint reasoning.
  if (req.method !== "POST") return next();

  const rawKey = String(req.get(KEY_HEADER) || "").trim();
  if (!rawKey) return next();

  const client = ensureClient();
  if (!client) return next();
  if (!client.isOpen) {
    try {
      await client.connect();
    } catch (_) {
      return next();
    }
  }

  const redisKey = buildRedisKey(req, rawKey);
  try {
    const cached = await client.get(redisKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      res.set("X-Idempotent-Replay", "true");
      res.status(parsed.status || 200);
      if (parsed.headers) {
        for (const [k, v] of Object.entries(parsed.headers)) {
          res.set(k, v);
        }
      }
      // Body can be either a JSON object (most of our responses) or a
      // raw string (rare — file downloads etc). We stored a flag so we
      // can pick the right send path.
      if (parsed.bodyType === "json") {
        return res.json(parsed.body);
      }
      return res.send(parsed.body);
    }
  } catch (_) {
    // Redis hiccup → fall through and treat as a fresh request.
  }

  // Intercept res.json/res.send so we can cache what the handler emits.
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseCached = false;

  const cacheResponse = async (bodyType, body) => {
    if (responseCached) return;
    responseCached = true;
    try {
      const payload = JSON.stringify({
        status: res.statusCode,
        bodyType,
        body,
      });
      // NX so a second concurrent request from the same key doesn't
      // clobber the first response.
      await client.set(redisKey, payload, {
        EX: TTL_SECONDS,
        NX: true,
      });
    } catch (_) {
      /* soft-fail — the request still succeeds */
    }
  };

  res.json = (body) => {
    // Fire and forget — don't block the response on the cache write.
    cacheResponse("json", body).catch(() => null);
    return originalJson(body);
  };
  res.send = (body) => {
    cacheResponse("raw", typeof body === "string" ? body : String(body)).catch(
      () => null,
    );
    return originalSend(body);
  };

  return next();
};

export default idempotencyMiddleware;
