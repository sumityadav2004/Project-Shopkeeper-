import crypto from "crypto";

const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS) || 60 * 60 * 12;

function getSecret() {
  return process.env.AUTH_SECRET || "dev-shopkeeper-secret-change-me";
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createAuthToken(username) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encodePayload({
    u: username,
    exp: now + TOKEN_TTL_SECONDS,
  });
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function safeEqual(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function verifyAuthToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  if (!safeEqual(signature, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded?.u || !decoded?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) return null;
    return { username: decoded.u };
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : "";
  const user = verifyAuthToken(token);
  if (!user) {
    res.status(401).json({ message: "Unauthorized. Please login again." });
    return;
  }
  req.user = user;
  next();
}
