/**
 * Reusable MySQL connection pool.
 * Reads ALL settings from environment variables — no credentials in code.
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

const config = {
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

// Lazy singleton — pool is created on first use so the server can boot
// even before you've filled in real credentials.
let pool = null;

function getPool() {
  if (!pool) {
    if (!config.host || !config.user || !config.database) {
      throw new Error(
        "Database is not configured. Set DB_HOST, DB_USER, DB_NAME (and DB_PASSWORD) in backend/.env",
      );
    }
    pool = mysql.createPool(config);
  }
  return pool;
}

/**
 * Run a parameterised query. Always use `?` placeholders — never string-concat user input.
 *   const rows = await query("SELECT * FROM users WHERE id = ?", [id]);
 */
async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** Quick health check used by /api/test-db */
async function ping() {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
    const [rows] = await conn.query("SELECT 1 AS ok, NOW() AS server_time, DATABASE() AS db");
    return rows[0];
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

module.exports = { getPool, query, ping, closePool };
