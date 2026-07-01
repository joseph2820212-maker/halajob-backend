const REFRESH_COOKIE_NAMES = {
  seeker: "hj_rt_seeker",
  campus: "hj_rt_campus",
  company: "hj_rt_company",
  admin: "hj_rt_admin",
};

const AUTH_SCOPES = new Set(Object.keys(REFRESH_COOKIE_NAMES));

const refreshCookieDays = () => Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || 30);

const sameSiteValue = () => {
  const configured = String(process.env.REFRESH_COOKIE_SAMESITE || "").trim().toLowerCase();
  if (["lax", "strict", "none"].includes(configured)) return configured;
  return process.env.NODE_ENV === "production" ? "none" : "lax";
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: sameSiteValue(),
  path: "/",
});

const writeCookieOptions = () => ({
  ...cookieOptions(),
  maxAge: refreshCookieDays() * 24 * 60 * 60 * 1000,
});

const parseCookies = (header = "") =>
  String(header || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const index = entry.indexOf("=");
      if (index <= 0) return acc;
      const key = entry.slice(0, index).trim();
      const value = entry.slice(index + 1);
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});

const isWebAuthRequest = (req) =>
  String(req.get?.("x-web-client") || "").toLowerCase() === "halajob-web" ||
  Boolean(req.get?.("x-web-auth-scope"));

const webAuthScope = (req, fallback = "seeker") => {
  const requested = String(req.get?.("x-web-auth-scope") || "").trim().toLowerCase();
  if (AUTH_SCOPES.has(requested)) return requested;
  return AUTH_SCOPES.has(fallback) ? fallback : "seeker";
};

const refreshCookieName = (scope = "seeker") => REFRESH_COOKIE_NAMES[scope] || REFRESH_COOKIE_NAMES.seeker;

const setRefreshCookie = (req, res, refreshToken, fallbackScope = "seeker") => {
  if (!refreshToken || !isWebAuthRequest(req)) return;
  res.cookie(refreshCookieName(webAuthScope(req, fallbackScope)), refreshToken, writeCookieOptions());
};

const clearRefreshCookie = (req, res, fallbackScope = "seeker") => {
  if (!isWebAuthRequest(req)) return;
  res.clearCookie(refreshCookieName(webAuthScope(req, fallbackScope)), cookieOptions());
};

const clearAllRefreshCookies = (res) => {
  Object.values(REFRESH_COOKIE_NAMES).forEach((name) => res.clearCookie(name, cookieOptions()));
};

// Refresh-token extraction. For web clients (identified by X-Web-Client
// / X-Web-Auth-Scope headers) we prefer the httpOnly cookie and IGNORE
// body/header refresh tokens — otherwise the "httpOnly cookie protection"
// is undermined by every accompanying x-refresh-token header, and any XSS
// that reads a JS-accessible refresh token still wins.
//
// Native mobile clients continue to use the header/body path since they
// don't run in a cookie jar.
const refreshTokenFromRequest = (req, fallbackScope = "seeker") => {
  const cookies = parseCookies(req.get?.("cookie"));
  const cookieValue =
    cookies[refreshCookieName(webAuthScope(req, fallbackScope))] || "";

  if (isWebAuthRequest(req)) {
    // Cookie only. If a caller (accidentally or maliciously) sent an
    // additional body/header refresh token, ignore it.
    return cookieValue;
  }

  const explicit =
    req.body?.refreshToken ||
    req.body?.refresh_token ||
    req.get?.("x-refresh-token");
  if (explicit) return explicit;

  return cookieValue;
};

export {
  clearAllRefreshCookies,
  clearRefreshCookie,
  isWebAuthRequest,
  refreshCookieName,
  refreshTokenFromRequest,
  setRefreshCookie,
  webAuthScope,
};
