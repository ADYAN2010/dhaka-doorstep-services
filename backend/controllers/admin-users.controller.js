/**
 * /api/admin-users — manage the admin team (superadmin only).
 *
 *   GET    /api/admin-users          list
 *   POST   /api/admin-users          create   { email, password, full_name, role? }
 *   GET    /api/admin-users/:id      get one
 *   PATCH  /api/admin-users/:id      update   { full_name?, role?, is_active?, password? }
 *   DELETE /api/admin-users/:id      delete   (cannot delete self / last superadmin)
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

const SELECT = "id, email, full_name, role, is_active, last_login_at, created_at, updated_at";
const ROLES = ["superadmin", "admin", "staff"];

function publicUser(row) {
  return row || null;
}

function validateEmail(email) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Invalid email address");
  }
  return email.toLowerCase().trim();
}

function validateRole(role) {
  if (!ROLES.includes(role)) {
    throw new HttpError(400, `role must be one of: ${ROLES.join(", ")}`);
  }
  return role;
}

exports.list = asyncHandler(async (_req, res) => {
  const rows = await query(`SELECT ${SELECT} FROM admin_users ORDER BY created_at DESC`);
  res.json({ data: rows, total: rows.length });
});

exports.getOne = asyncHandler(async (req, res) => {
  const rows = await query(`SELECT ${SELECT} FROM admin_users WHERE id = ? LIMIT 1`, [req.params.id]);
  if (!rows.length) throw new HttpError(404, "Admin not found");
  res.json({ data: publicUser(rows[0]) });
});

exports.create = asyncHandler(async (req, res) => {
  const { email, password, full_name, role } = req.body || {};
  if (typeof full_name !== "string" || !full_name.trim()) {
    throw new HttpError(400, "full_name is required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new HttpError(400, "password must be at least 8 characters");
  }
  const cleanEmail = validateEmail(email);
  const cleanRole = role ? validateRole(role) : "admin";

  const existing = await query("SELECT id FROM admin_users WHERE email = ? LIMIT 1", [cleanEmail]);
  if (existing.length) throw new HttpError(409, "An admin with that email already exists");

  const id = crypto.randomUUID();
  const password_hash = await bcrypt.hash(password, 12);
  await query(
    "INSERT INTO admin_users (id, email, full_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)",
    [id, cleanEmail, full_name.trim(), password_hash, cleanRole],
  );

  const rows = await query(`SELECT ${SELECT} FROM admin_users WHERE id = ?`, [id]);
  res.status(201).json({ data: publicUser(rows[0]) });
});

exports.update = asyncHandler(async (req, res) => {
  const { full_name, role, is_active, password } = req.body || {};
  const id = req.params.id;

  const rows = await query("SELECT id, role FROM admin_users WHERE id = ? LIMIT 1", [id]);
  if (!rows.length) throw new HttpError(404, "Admin not found");
  const target = rows[0];

  const updates = [];
  const values = [];

  if (full_name !== undefined) {
    if (typeof full_name !== "string" || !full_name.trim()) throw new HttpError(400, "full_name cannot be empty");
    updates.push("full_name = ?");
    values.push(full_name.trim());
  }

  if (role !== undefined) {
    const cleanRole = validateRole(role);
    // Prevent demoting the last superadmin
    if (target.role === "superadmin" && cleanRole !== "superadmin") {
      const [{ n }] = await query("SELECT COUNT(*) AS n FROM admin_users WHERE role = 'superadmin' AND is_active = 1");
      if (n <= 1) throw new HttpError(409, "Cannot demote the last active superadmin");
    }
    updates.push("role = ?");
    values.push(cleanRole);
  }

  if (is_active !== undefined) {
    const flag = is_active ? 1 : 0;
    if (!flag && target.role === "superadmin") {
      const [{ n }] = await query("SELECT COUNT(*) AS n FROM admin_users WHERE role = 'superadmin' AND is_active = 1");
      if (n <= 1) throw new HttpError(409, "Cannot disable the last active superadmin");
    }
    if (!flag && id === req.user.sub) throw new HttpError(409, "You cannot disable your own account");
    updates.push("is_active = ?");
    values.push(flag);
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
      throw new HttpError(400, "password must be at least 8 characters");
    }
    updates.push("password_hash = ?");
    values.push(await bcrypt.hash(password, 12));
  }

  if (!updates.length) throw new HttpError(400, "No fields to update");

  values.push(id);
  await query(`UPDATE admin_users SET ${updates.join(", ")} WHERE id = ?`, values);

  const updated = await query(`SELECT ${SELECT} FROM admin_users WHERE id = ?`, [id]);
  res.json({ data: publicUser(updated[0]) });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (id === req.user.sub) throw new HttpError(409, "You cannot delete your own account");

  const rows = await query("SELECT role, is_active FROM admin_users WHERE id = ? LIMIT 1", [id]);
  if (!rows.length) throw new HttpError(404, "Admin not found");

  if (rows[0].role === "superadmin") {
    const [{ n }] = await query("SELECT COUNT(*) AS n FROM admin_users WHERE role = 'superadmin' AND is_active = 1");
    if (n <= 1) throw new HttpError(409, "Cannot delete the last active superadmin");
  }

  await query("DELETE FROM admin_users WHERE id = ?", [id]);
  res.status(204).end();
});
