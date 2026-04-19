/**
 * /api/reviews — public listing + customer-authenticated submission.
 *
 *   GET    /providers/:providerId   → reviews for one provider (public, paginated)
 *   POST   /                        → upsert customer's review for a provider
 *                                     body: { provider_id, rating (1-5), comment? }
 *   PATCH  /:id                     → edit own review (rating/comment)
 *   DELETE /:id                     → delete own review
 *
 * The providers.rating + review_count columns are kept in sync by SQL
 * triggers in 014_reviews.sql.
 */
const crypto = require("crypto");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");
const { requireAuth } = require("../middleware/auth");

function shape(row) {
  return {
    id: row.id,
    provider_id: row.provider_id,
    customer_id: row.customer_id,
    customer_name: row.customer_name || "Customer",
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

exports.listForProvider = asyncHandler(async (req, res) => {
  const providerId = String(req.params.providerId || "");
  if (!/^[0-9a-fA-F-]{32,36}$/.test(providerId)) {
    throw new HttpError(400, "Invalid provider id");
  }
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  const rows = await query(
    `SELECT r.*, c.full_name AS customer_name
     FROM reviews r
     LEFT JOIN customers c ON c.id = r.customer_id
     WHERE r.provider_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [providerId, limit, offset],
  );
  const [{ total }] = await query(
    "SELECT COUNT(*) AS total FROM reviews WHERE provider_id = ?",
    [providerId],
  );
  res.json({ data: rows.map(shape), total, limit, offset });
});

exports.upsert = [
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") throw new HttpError(403, "Customers only");
    const { provider_id, rating, comment, booking_id } = req.body || {};
    if (typeof provider_id !== "string" || !/^[0-9a-fA-F-]{32,36}$/.test(provider_id)) {
      throw new HttpError(400, "Valid provider_id is required");
    }
    const r = parseInt(rating, 10);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw new HttpError(400, "rating must be an integer 1-5");
    }
    const cleanComment = typeof comment === "string" ? comment.slice(0, 2000) : null;

    // Provider must exist + be approved
    const [{ n }] = await query(
      "SELECT COUNT(*) AS n FROM providers WHERE id = ? AND status = 'approved'",
      [provider_id],
    );
    if (!n) throw new HttpError(404, "Provider not found");

    const existing = await query(
      "SELECT id FROM reviews WHERE provider_id = ? AND customer_id = ? LIMIT 1",
      [provider_id, req.user.sub],
    );

    if (existing.length) {
      await query(
        "UPDATE reviews SET rating = ?, comment = ?, booking_id = ? WHERE id = ?",
        [r, cleanComment, booking_id || null, existing[0].id],
      );
      const out = await query(
        `SELECT r.*, c.full_name AS customer_name
         FROM reviews r LEFT JOIN customers c ON c.id = r.customer_id
         WHERE r.id = ?`,
        [existing[0].id],
      );
      return res.json({ data: shape(out[0]) });
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO reviews (id, provider_id, customer_id, booking_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, provider_id, req.user.sub, booking_id || null, r, cleanComment],
    );
    const out = await query(
      `SELECT r.*, c.full_name AS customer_name
       FROM reviews r LEFT JOIN customers c ON c.id = r.customer_id
       WHERE r.id = ?`,
      [id],
    );
    res.status(201).json({ data: shape(out[0]) });
  }),
];

exports.update = [
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "");
    const { rating, comment } = req.body || {};
    const rows = await query("SELECT customer_id FROM reviews WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) throw new HttpError(404, "Review not found");
    if (rows[0].customer_id !== req.user.sub) throw new HttpError(403, "Not your review");

    const updates = [];
    const params = [];
    if (rating !== undefined) {
      const r = parseInt(rating, 10);
      if (!Number.isInteger(r) || r < 1 || r > 5) throw new HttpError(400, "rating must be 1-5");
      updates.push("rating = ?");
      params.push(r);
    }
    if (comment !== undefined) {
      updates.push("comment = ?");
      params.push(typeof comment === "string" ? comment.slice(0, 2000) : null);
    }
    if (!updates.length) throw new HttpError(400, "No fields to update");
    params.push(id);
    await query(`UPDATE reviews SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ ok: true });
  }),
];

exports.remove = [
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "");
    const rows = await query("SELECT customer_id FROM reviews WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) throw new HttpError(404, "Review not found");
    if (rows[0].customer_id !== req.user.sub && req.user.role === "customer") {
      throw new HttpError(403, "Not your review");
    }
    await query("DELETE FROM reviews WHERE id = ?", [id]);
    res.status(204).end();
  }),
];
