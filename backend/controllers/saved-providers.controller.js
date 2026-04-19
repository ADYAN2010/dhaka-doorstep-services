/**
 * /api/saved-providers — customer favorites.
 *
 *   GET    /                → current customer's saved provider list (full provider rows)
 *   GET    /ids             → just the saved provider ids (lightweight check)
 *   POST   /                { provider_id }  → save
 *   DELETE /:providerId     → unsave
 *
 * All endpoints require a customer JWT.
 */
const crypto = require("crypto");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");
const { requireAuth } = require("../middleware/auth");

function ensureCustomer(req) {
  if (!req.user || req.user.role !== "customer") {
    throw new HttpError(403, "Customers only");
  }
}

exports.list = [
  requireAuth,
  asyncHandler(async (req, res) => {
    ensureCustomer(req);
    const rows = await query(
      `SELECT p.id, p.slug, p.full_name, p.business_name, p.avatar_url,
              p.primary_area, p.primary_category, p.rating, p.review_count,
              p.is_verified, p.is_top_rated, sp.created_at AS saved_at
       FROM saved_providers sp
       INNER JOIN providers p ON p.id = sp.provider_id
       WHERE sp.customer_id = ?
       ORDER BY sp.created_at DESC`,
      [req.user.sub],
    );
    res.json({ data: rows });
  }),
];

exports.listIds = [
  requireAuth,
  asyncHandler(async (req, res) => {
    ensureCustomer(req);
    const rows = await query(
      "SELECT provider_id FROM saved_providers WHERE customer_id = ?",
      [req.user.sub],
    );
    res.json({ data: rows.map((r) => r.provider_id) });
  }),
];

exports.save = [
  requireAuth,
  asyncHandler(async (req, res) => {
    ensureCustomer(req);
    const { provider_id } = req.body || {};
    if (typeof provider_id !== "string" || !/^[0-9a-fA-F-]{32,36}$/.test(provider_id)) {
      throw new HttpError(400, "Valid provider_id is required");
    }
    const [{ n }] = await query("SELECT COUNT(*) AS n FROM providers WHERE id = ?", [provider_id]);
    if (!n) throw new HttpError(404, "Provider not found");

    // Idempotent
    await query(
      `INSERT IGNORE INTO saved_providers (id, customer_id, provider_id) VALUES (?, ?, ?)`,
      [crypto.randomUUID(), req.user.sub, provider_id],
    );
    res.status(201).json({ ok: true });
  }),
];

exports.unsave = [
  requireAuth,
  asyncHandler(async (req, res) => {
    ensureCustomer(req);
    const providerId = String(req.params.providerId || "");
    await query(
      "DELETE FROM saved_providers WHERE customer_id = ? AND provider_id = ?",
      [req.user.sub, providerId],
    );
    res.status(204).end();
  }),
];
