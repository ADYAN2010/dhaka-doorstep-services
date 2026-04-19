/**
 * Sample module: full CRUD for a `services` table.
 * Schema (MySQL):
 *   CREATE TABLE services (
 *     id           INT AUTO_INCREMENT PRIMARY KEY,
 *     name         VARCHAR(150) NOT NULL,
 *     description  TEXT,
 *     base_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
 *     is_active    TINYINT(1) NOT NULL DEFAULT 1,
 *     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *     updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 *   );
 */
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

function validatePayload(body, { partial = false } = {}) {
  const errors = {};
  const out = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.length > 150) {
      errors.name = "Required, 1–150 chars";
    } else out.name = body.name.trim();
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      errors.description = "Must be string or null";
    } else out.description = body.description;
  }
  if (body.base_price !== undefined) {
    const n = Number(body.base_price);
    if (!Number.isFinite(n) || n < 0) errors.base_price = "Must be a non-negative number";
    else out.base_price = n;
  }
  if (body.is_active !== undefined) {
    out.is_active = body.is_active ? 1 : 0;
  }

  if (Object.keys(errors).length) throw new HttpError(400, "Validation failed", errors);
  return out;
}

exports.list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const rows = await query(
    "SELECT id, name, description, base_price, is_active, created_at, updated_at FROM services ORDER BY id DESC LIMIT ? OFFSET ?",
    [limit, offset],
  );
  res.json({ data: rows, limit, offset });
});

exports.getOne = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid id");
  const rows = await query("SELECT * FROM services WHERE id = ?", [id]);
  if (!rows.length) throw new HttpError(404, "Service not found");
  res.json({ data: rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const payload = validatePayload(req.body);
  const result = await query(
    "INSERT INTO services (name, description, base_price, is_active) VALUES (?, ?, ?, ?)",
    [payload.name, payload.description ?? null, payload.base_price ?? 0, payload.is_active ?? 1],
  );
  const rows = await query("SELECT * FROM services WHERE id = ?", [result.insertId]);
  res.status(201).json({ data: rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid id");
  const payload = validatePayload(req.body, { partial: true });
  const fields = Object.keys(payload);
  if (!fields.length) throw new HttpError(400, "No fields to update");

  const setSql = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => payload[f]);
  const result = await query(`UPDATE services SET ${setSql} WHERE id = ?`, [...values, id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Service not found");

  const rows = await query("SELECT * FROM services WHERE id = ?", [id]);
  res.json({ data: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid id");
  const result = await query("DELETE FROM services WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Service not found");
  res.status(204).end();
});
