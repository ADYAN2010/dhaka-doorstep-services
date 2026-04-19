/**
 * /api/auth — login + current user.
 *
 *   POST /api/auth/login   { email, password }  → { token, user }
 *   GET  /api/auth/me                            → { user }   (requires Bearer)
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");
const { signToken, requireAuth, JWT_EXPIRES_IN } = require("../middleware/auth");

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    last_login_at: row.last_login_at,
  };
}

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const rows = await query(
    "SELECT id, email, full_name, password_hash, role, is_active, last_login_at FROM admin_users WHERE email = ? LIMIT 1",
    [email.toLowerCase().trim()],
  );
  const user = rows[0];

  // Constant-ish time: always run bcrypt even if user missing
  const ok = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");

  if (!user || !ok) throw new HttpError(401, "Invalid email or password");
  if (!user.is_active) throw new HttpError(403, "Account is disabled");

  await query("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [user.id]);

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    expires_in: JWT_EXPIRES_IN,
    user: publicUser({ ...user, last_login_at: new Date() }),
  });
});

exports.me = [
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query(
      "SELECT id, email, full_name, role, is_active, last_login_at FROM admin_users WHERE id = ? LIMIT 1",
      [req.user.sub],
    );
    if (!rows.length || !rows[0].is_active) throw new HttpError(401, "Account no longer active");
    res.json({ user: publicUser(rows[0]) });
  }),
];

/**
 * One-shot bootstrap: create the first super admin if zero exist.
 *   POST /api/auth/bootstrap  { email, password, full_name }
 * Returns 409 once any admin exists. Useful right after first migration.
 */
exports.bootstrap = asyncHandler(async (req, res) => {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM admin_users");
  if (n > 0) throw new HttpError(409, "An admin already exists. Use /api/auth/login instead.");

  const { email, password, full_name } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string" || typeof full_name !== "string") {
    throw new HttpError(400, "email, password, full_name are required");
  }
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");

  const id = crypto.randomUUID();
  const password_hash = await bcrypt.hash(password, 12);
  await query(
    "INSERT INTO admin_users (id, email, full_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'superadmin', 1)",
    [id, email.toLowerCase().trim(), full_name.trim(), password_hash],
  );

  const token = signToken({ sub: id, email: email.toLowerCase().trim(), role: "superadmin" });
  res.status(201).json({
    token,
    expires_in: JWT_EXPIRES_IN,
    user: { id, email: email.toLowerCase().trim(), full_name, role: "superadmin" },
  });
});
