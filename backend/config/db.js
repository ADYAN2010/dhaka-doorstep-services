/**
 * Reusable MySQL connection pool — production-hardened.
 *
 *  - All settings come from env vars. NO credentials in code.
 *  - Lazy singleton: pool is created on first use, so the server
 *    can boot even if DB env is missing (great for first deploy).
 *  - `isConfigured()` lets routes degrade gracefully when DB is down.
 *  - `query()` uses parameterised `?` placeholders → no SQL injection.
 */
const mysql = require("mysql2/promise");

function bool(v, fallback = false) {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v).toLowerCase() === "true";
}

function int(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function readConfig() {
  return {
    host: process.env.DB_HOST,
    port: int(process.env.DB_PORT, 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: int(process.env.DB_CONNECTION_LIMIT, 10),
    queueLimit: int(process.env.DB_QUEUE_LIMIT, 0),
    connectTimeout: int(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
    charset: "utf8mb4_unicode_ci",
    ...(bool(process.env.DB_SSL) ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

let pool = null;

/** Returns true if DB_HOST/DB_USER/DB_NAME are all present. */
function isConfigured() {
  const c = readConfig();
  return Boolean(c.host && c.user && c.database);
}

/** Returns a structured config status (safe to expose to authenticated admins). */
function configStatus() {
  const c = readConfig();
  return {
    configured: isConfigured(),
    host: c.host ? maskHost(c.host) : null,
    port: c.port,
    database: c.database || null,
    user: c.user ? maskUser(c.user) : null,
    ssl: bool(process.env.DB_SSL),
    pool_limit: c.connectionLimit,
  };
}

function maskHost(h) {
  // keep TLD, mask middle: "srv547.hstgr.io" → "s****7.hstgr.io"
  if (h.length < 4) return "****";
  return h[0] + "****" + h.slice(-8);
}
function maskUser(u) {
  if (u.length <= 4) return "****";
  return u.slice(0, 2) + "****" + u.slice(-2);
}

function getPool() {
  if (!pool) {
    if (!isConfigured()) {
      const err = new Error(
        "Database is not configured. Set DB_HOST, DB_USER, DB_NAME (and DB_PASSWORD) in your environment.",
      );
      err.code = "DB_NOT_CONFIGURED";
      err.status = 503;
      throw err;
    }
    pool = mysql.createPool(readConfig());
  }
  return pool;
}

/**
 * Run a parameterised query. ALWAYS use `?` placeholders.
 *   const rows = await query("SELECT * FROM users WHERE id = ?", [id]);
 */
async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** Quick health check used by /api/test-db and /api/admin/system-status. */
async function ping() {
  if (!isConfigured()) {
    return { ok: false, configured: false, message: "DB env vars are missing" };
  }
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
    const [rows] = await conn.query(
      "SELECT 1 AS ok, NOW() AS server_time, DATABASE() AS db, VERSION() AS version",
    );
    return { ok: true, configured: true, ...rows[0] };
  } finally {
    conn.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, ping, closePool, isConfigured, configStatus };
