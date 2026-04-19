const crypto = require("crypto");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

const SELECT =
  "id, customer_id, full_name, email, phone, message, handled, created_at, updated_at";

exports.create = asyncHandler(async (req, res) => {
  const { full_name, email, phone, message, customer_id } = req.body || {};
  if (typeof full_name !== "string" || !full_name.trim())
    throw new HttpError(400, "full_name is required");
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))
    throw new HttpError(400, "valid email is required");
  if (typeof message !== "string" || message.trim().length < 10)
    throw new HttpError(400, "message must be at least 10 characters");

  const id = crypto.randomUUID();
  await query(
    `INSERT INTO contact_messages (id, customer_id, full_name, email, phone, message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      customer_id || null,
      full_name.trim().slice(0, 150),
      email.trim().toLowerCase().slice(0, 255),
      (phone || "").trim().slice(0, 40) || null,
      message.trim().slice(0, 4000),
    ],
  );
  const rows = await query(`SELECT ${SELECT} FROM contact_messages WHERE id = ?`, [id]);
  res.status(201).json({ data: rows[0] });
});

exports.list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const rows = await query(
    `SELECT ${SELECT} FROM contact_messages ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  res.json({ data: rows, total: rows.length, limit, offset: 0 });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { handled } = req.body || {};
  if (typeof handled !== "boolean") {
    throw new HttpError(400, "handled (boolean) is required");
  }
  const result = await query(
    `UPDATE contact_messages SET handled = ? WHERE id = ?`,
    [handled ? 1 : 0, id],
  );
  if (!result.affectedRows) throw new HttpError(404, "message not found");
  const rows = await query(`SELECT ${SELECT} FROM contact_messages WHERE id = ?`, [id]);
  res.json({ data: rows[0] });
});
