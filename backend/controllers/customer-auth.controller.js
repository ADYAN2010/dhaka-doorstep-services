/**
 * /api/customer-auth — end-customer auth (separate from admin auth).
 *
 *   POST /signup           { email, password, full_name, phone? }   → { token, user }
 *   POST /login            { email, password }                      → { token, user }
 *   GET  /me                                                        → { user }
 *   POST /change-password  { current_password, new_password }
 *   POST /forgot-password  { email }                                → { ok: true } (always)
 *   POST /reset-password   { token, new_password }                  → { ok: true }
 *
 * JWTs use { sub, email, role: 'customer' } so the same requireAuth
 * middleware works, but admin endpoints can require role !== 'customer'.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");
const { signToken, requireAuth, JWT_EXPIRES_IN } = require("../middleware/auth");

const SELECT = "id, full_name, email, phone, area, is_active, last_login_at, created_at, updated_at";

function publicUser(row) {
  if (!row) return null;
  const { password_hash, password_reset_token, password_reset_expires_at, ...safe } = row;
  return { ...safe, role: "customer" };
}

function validateEmail(email) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Invalid email address");
  }
  return email.toLowerCase().trim();
}

exports.signup = asyncHandler(async (req, res) => {
  const { email, password, full_name, phone, area } = req.body || {};
  if (typeof full_name !== "string" || !full_name.trim()) {
    throw new HttpError(400, "full_name is required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new HttpError(400, "password must be at least 8 characters");
  }
  const cleanEmail = validateEmail(email);

  const existing = await query("SELECT id FROM customers WHERE email = ? LIMIT 1", [cleanEmail]);
  if (existing.length) throw new HttpError(409, "An account with that email already exists");

  const id = crypto.randomUUID();
  const password_hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO customers (id, full_name, email, phone, area, password_hash, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [id, full_name.trim(), cleanEmail, phone || null, area || null, password_hash],
  );

  const token = signToken({ sub: id, email: cleanEmail, role: "customer" });
  const rows = await query(`SELECT ${SELECT} FROM customers WHERE id = ?`, [id]);
  res.status(201).json({ token, expires_in: JWT_EXPIRES_IN, user: publicUser(rows[0]) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    throw new HttpError(400, "email and password are required");
  }
  const rows = await query(
    `SELECT id, password_hash, is_active FROM customers WHERE email = ? LIMIT 1`,
    [email.toLowerCase().trim()],
  );
  const row = rows[0];

  // Constant-ish time: always run bcrypt
  const ok = row
    ? await bcrypt.compare(password, row.password_hash || "")
    : await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");

  if (!row || !ok || !row.password_hash) throw new HttpError(401, "Invalid email or password");
  if (!row.is_active) throw new HttpError(403, "Account is disabled");

  await query("UPDATE customers SET last_login_at = NOW() WHERE id = ?", [row.id]);
  const fresh = await query(`SELECT ${SELECT} FROM customers WHERE id = ?`, [row.id]);
  const token = signToken({ sub: row.id, email: fresh[0].email, role: "customer" });
  res.json({ token, expires_in: JWT_EXPIRES_IN, user: publicUser(fresh[0]) });
});

exports.me = [
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") throw new HttpError(403, "Not a customer account");
    const rows = await query(`SELECT ${SELECT} FROM customers WHERE id = ? LIMIT 1`, [req.user.sub]);
    if (!rows.length || !rows[0].is_active) throw new HttpError(401, "Account no longer active");
    res.json({ user: publicUser(rows[0]) });
  }),
];

exports.changePassword = [
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "customer") throw new HttpError(403, "Not a customer account");
    const { current_password, new_password } = req.body || {};
    if (typeof new_password !== "string" || new_password.length < 8) {
      throw new HttpError(400, "new_password must be at least 8 characters");
    }
    const rows = await query("SELECT password_hash FROM customers WHERE id = ? LIMIT 1", [req.user.sub]);
    if (!rows.length) throw new HttpError(404, "Account not found");
    const ok = await bcrypt.compare(current_password || "", rows[0].password_hash || "");
    if (!ok) throw new HttpError(401, "Current password is incorrect");

    const password_hash = await bcrypt.hash(new_password, 12);
    await query("UPDATE customers SET password_hash = ?, password_reset_token = NULL WHERE id = ?", [
      password_hash,
      req.user.sub,
    ]);
    res.json({ ok: true });
  }),
];

/**
 * Always returns ok:true to avoid leaking which emails exist.
 * In production, dispatch the reset link via your email provider.
 * For now we return the token in the JSON response when NODE_ENV !== 'production'
 * so you can wire it up locally.
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== "string") throw new HttpError(400, "email is required");
  const cleanEmail = email.toLowerCase().trim();

  const rows = await query("SELECT id FROM customers WHERE email = ? LIMIT 1", [cleanEmail]);
  if (rows.length) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await query(
      "UPDATE customers SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?",
      [token, expires, rows[0].id],
    );
    if (process.env.NODE_ENV !== "production") {
      return res.json({ ok: true, dev_token: token });
    }
  }
  res.json({ ok: true });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, new_password } = req.body || {};
  if (typeof token !== "string" || typeof new_password !== "string" || new_password.length < 8) {
    throw new HttpError(400, "token and new_password (>= 8 chars) are required");
  }
  const rows = await query(
    "SELECT id, password_reset_expires_at FROM customers WHERE password_reset_token = ? LIMIT 1",
    [token],
  );
  if (!rows.length) throw new HttpError(400, "Invalid or expired reset token");
  const expires = rows[0].password_reset_expires_at ? new Date(rows[0].password_reset_expires_at) : null;
  if (!expires || expires.getTime() < Date.now()) throw new HttpError(400, "Reset token has expired");

  const password_hash = await bcrypt.hash(new_password, 12);
  await query(
    "UPDATE customers SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = ?",
    [password_hash, rows[0].id],
  );
  res.json({ ok: true });
});
