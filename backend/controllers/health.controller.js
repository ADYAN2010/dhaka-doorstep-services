/**
 * Health + DB diagnostics.
 *   GET /api/health   → liveness (no DB required)
 *   GET /api/test-db  → connection-readiness probe:
 *                        1. checks required env vars are present
 *                        2. attempts a real pooled MySQL connection
 *                        3. runs a minimal "SELECT 1" via ping()
 *                        4. returns clean JSON — never leaks credentials
 */
const { ping, isConfigured, configStatus } = require("../config/db");
const { asyncHandler } = require("../middleware/error-handler");

const REQUIRED_DB_VARS = ["DB_HOST", "DB_USER", "DB_NAME"];
const OPTIONAL_DB_VARS = ["DB_PORT", "DB_PASSWORD", "DB_SSL"];

function envPresence(names) {
  const out = {};
  for (const k of names) out[k] = Boolean(process.env[k] && String(process.env[k]).length > 0);
  return out;
}

exports.health = (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db_configured: isConfigured(),
  });
};

exports.testDb = asyncHandler(async (req, res) => {
  const required = envPresence(REQUIRED_DB_VARS);
  const optional = envPresence(OPTIONAL_DB_VARS);
  const missing = REQUIRED_DB_VARS.filter((k) => !required[k]);

  // 1) Env-var pre-check — fail fast with a helpful message, no connection attempt.
  if (missing.length) {
    return res.status(503).json({
      ok: false,
      stage: "env_check",
      configured: false,
      missing_env: missing,
      env_present: { ...required, ...optional },
      hint: "Set the missing variables in backend/.env (local) or in hPanel → Node.js → Environment Variables (production).",
    });
  }

  // 2) Real connection + safe SELECT.
  try {
    const info = await ping();
    return res.json({
      ok: true,
      stage: "query",
      configured: true,
      env_present: { ...required, ...optional },
      db: {
        // configStatus() returns masked host/user — safe to expose to operators.
        ...configStatus(),
        server_time: info.server_time,
        version: info.version,
        database: info.db,
      },
    });
  } catch (err) {
    return res.status(503).json({
      ok: false,
      stage: "connection",
      configured: true,
      env_present: { ...required, ...optional },
      error: {
        // mysql2 error codes are safe (e.g. ER_ACCESS_DENIED_ERROR, ENOTFOUND, ETIMEDOUT)
        code: err.code || "UNKNOWN",
        message: err.message,
      },
      hint: "Verify DB_HOST is reachable, DB_USER has access from this host, and DB_PASSWORD is correct. On Hostinger, also check Remote MySQL whitelist.",
    });
  }
});
