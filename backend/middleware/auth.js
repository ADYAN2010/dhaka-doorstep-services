/**
 * JWT auth middleware.
 *
 *   - `requireAuth`  → 401 unless a valid Bearer token is present
 *   - `requireRole(...roles)` → 403 unless the token user has one of the roles
 *   - `optionalAuth` → attaches req.user if a valid token exists, otherwise no-op
 *
 * Token shape (signed with JWT_SECRET):
 *   { sub: <admin_id>, email, role, iat, exp }
 */
const jwt = require("jsonwebtoken");
const { HttpError } = require("./error-handler");

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

function assertSecret() {
  if (!JWT_SECRET || JWT_SECRET.length < 16) {
    throw new HttpError(
      500,
      "Server misconfigured: JWT_SECRET is missing or too short. Set it in backend/.env",
    );
  }
}

function signToken(payload) {
  assertSecret();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  assertSecret();
  return jwt.verify(token, JWT_SECRET);
}

function readBearer(req) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

function requireAuth(req, res, next) {
  const token = readBearer(req);
  if (!token) return next(new HttpError(401, "Missing bearer token"));
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(new HttpError(401, err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"));
  }
}

function optionalAuth(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next();
  try {
    req.user = verifyToken(token);
  } catch {
    /* ignore — treat as anonymous */
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Insufficient role", { required: roles }));
    }
    next();
  };
}

module.exports = { signToken, verifyToken, requireAuth, optionalAuth, requireRole, JWT_EXPIRES_IN };
