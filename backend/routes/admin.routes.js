/**
 * /api/admin — dashboard stats + system status.
 * All endpoints require a valid admin JWT.
 */
const router = require("express").Router();
const { query, ping, configStatus, isConfigured } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error-handler");

async function safeCount(sql, params = []) {
  try {
    const rows = await query(sql, params);
    return Number(rows[0]?.n ?? 0);
  } catch {
    return null; // table may not exist yet — degrade gracefully
  }
}

/** GET /api/admin/dashboard-stats */
router.get(
  "/dashboard-stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isConfigured()) {
      return res.json({
        configured: false,
        message: "Database not configured. Add DB env vars to enable stats.",
        totals: {},
      });
    }

    const [
      customers,
      providers,
      bookings,
      bookings_new,
      bookings_completed,
      categories,
      services,
      cities,
      areas,
    ] = await Promise.all([
      safeCount("SELECT COUNT(*) AS n FROM customers"),
      safeCount("SELECT COUNT(*) AS n FROM providers"),
      safeCount("SELECT COUNT(*) AS n FROM bookings"),
      safeCount("SELECT COUNT(*) AS n FROM bookings WHERE status = 'new'"),
      safeCount("SELECT COUNT(*) AS n FROM bookings WHERE status = 'completed'"),
      safeCount("SELECT COUNT(*) AS n FROM categories"),
      safeCount("SELECT COUNT(*) AS n FROM services"),
      safeCount("SELECT COUNT(*) AS n FROM cities"),
      safeCount("SELECT COUNT(*) AS n FROM areas"),
    ]);

    const recent = await query(
      "SELECT id, full_name, category, area, status, preferred_date, created_at FROM bookings ORDER BY created_at DESC LIMIT 5",
    ).catch(() => []);

    res.json({
      configured: true,
      totals: {
        customers,
        providers,
        bookings,
        bookings_new,
        bookings_completed,
        categories,
        services,
        cities,
        areas,
      },
      recent_bookings: recent,
    });
  }),
);

/**
 * GET /api/admin/system-status
 * Developer/operator-facing. Does NOT reveal credentials — only
 * masked host/user, env booleans, and live DB ping result.
 */
router.get(
  "/system-status",
  requireAuth,
  asyncHandler(async (req, res) => {
    let dbPing = null;
    try {
      dbPing = await ping();
    } catch (err) {
      dbPing = { ok: false, configured: isConfigured(), error: err.message };
    }
    res.json({
      node_env: process.env.NODE_ENV || "development",
      uptime_seconds: Math.round(process.uptime()),
      memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      db: configStatus(),
      db_ping: dbPing,
      auth: {
        jwt_configured: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16),
        jwt_expires_in: process.env.JWT_EXPIRES_IN || "12h",
      },
    });
  }),
);

module.exports = router;
