// Idempotency-Key middleware. When a POST arrives with an Idempotency-Key
// header, we look up whether we've already processed that key for this
// caller in the last IDEMPOTENCY_KEY_TTL_SECONDS (default 24h). If yes,
// replay the cached response — same status code, same body — without
// re-invoking the route handler. Otherwise, run the handler and cache
// what it wrote (only on 2xx; error responses get a short TTL so a
// transient failure doesn't lock the caller out for the full 24h).
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
// Error responses get a much shorter TTL — a transient 500 shouldn't
// stick around for 24h, otherwise every retry with the same key gets
// the same failure back forever.
const ERROR_TTL_SECONDS = 60;
// Reject client-supplied keys longer than this so an attacker can't blow
// up Redis memory by sending megabyte-long keys.
const MAX_KEY_LENGTH = 200;

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

// Caller identity for scoping the cache key.
//
// req.user is only populated by auth middleware, and this middleware runs
// globally (before any per-route auth), so it's always undefined here.
// We reach into the Authorization header ourselves and hash it — that
// gives us an identity handle that's stable across a single access-token
// lifetime without needing to actually verify the JWT. Guest callers
// (no auth header) fall back to IP scoping.
//
// Without this fix, every authed request would scope by IP alone. Two
// legitimate users behind the same NAT gateway sharing an Idempotency-Key
// UUID space would receive each other's cached responses, including PII.
const scopeIdentifier = (req) => {
  const auth = String(req.get?.("authorization") || "").trim();
  if (auth) {
    const hash = crypto.createHash("sha256").update(auth).digest("hex");
    return `a:${hash.slice(0, 32)}`;
  }
  if (req.user?._id) return `u:${req.user._id}`;
  return `ip:${req.ip || "unknown"}`;
};

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

  // Bound key length so a hostile caller can't waste Redis memory just by
  // shipping enormous idempotency headers.
  if (rawKey.length > MAX_KEY_LENGTH) return next();

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

    // Never cache binary payloads — String() mangles Buffers and there's
    // no meaningful idempotency story for a downloaded file anyway.
    if (Buffer.isBuffer(body)) return;

    const status = res.statusCode || 200;
    // Only cache success responses at the full TTL. 4xx/5xx get a much
    // shorter TTL so a transient failure doesn't get stuck for 24h and
    // lock the client out of every retry.
    const isSuccess = status >= 200 && status < 300;
    const ttl = isSuccess ? TTL_SECONDS : ERROR_TTL_SECONDS;

    try {
      const payload = JSON.stringify({
        status,
        bodyType,
        body,
      });
      await client.set(redisKey, payload, {
        EX: ttl,
        NX: true,
      });
    } catch (_) {
      /* soft-fail — the request still succeeds */
    }
  };

  res.json = (body) => {
    cacheResponse("json", body).catch(() => null);
    return originalJson(body);
  };
  res.send = (body) => {
    if (Buffer.isBuffer(body)) {
      // Bypass the cache for buffers entirely.
      return originalSend(body);
    }
    cacheResponse("raw", typeof body === "string" ? body : String(body)).catch(
      () => null,
    );
    return originalSend(body);
  };

  return next();
};

export default idempotencyMiddleware;
