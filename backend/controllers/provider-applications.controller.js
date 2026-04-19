const crypto = require("crypto");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

const SELECT =
  "id, customer_id, full_name, phone, email, applicant_type, category, experience, coverage_area, team_size, availability, about, status, created_at, updated_at";

const APPLICANT_TYPES = ["Individual professional", "Small agency / team", "Established company"];
const EXPERIENCE = ["0–1 years", "2–5 years", "6–10 years", "10+ years"];
const TEAM_SIZES = ["Just me", "2–5", "6–15", "16+"];
const AVAILABILITIES = ["Full-time", "Part-time", "Weekends only"];

exports.create = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (typeof b.full_name !== "string" || b.full_name.trim().length < 2)
    throw new HttpError(400, "full_name is required");
  if (typeof b.phone !== "string" || b.phone.trim().length < 7)
    throw new HttpError(400, "phone is required");
  if (typeof b.email !== "string" || !/^\S+@\S+\.\S+$/.test(b.email))
    throw new HttpError(400, "valid email is required");
  if (typeof b.category !== "string" || !b.category.trim())
    throw new HttpError(400, "category is required");
  if (typeof b.coverage_area !== "string" || !b.coverage_area.trim())
    throw new HttpError(400, "coverage_area is required");
  if (b.applicant_type && !APPLICANT_TYPES.includes(b.applicant_type))
    throw new HttpError(400, "invalid applicant_type");
  if (b.experience && !EXPERIENCE.includes(b.experience))
    throw new HttpError(400, "invalid experience");
  if (b.team_size && !TEAM_SIZES.includes(b.team_size))
    throw new HttpError(400, "invalid team_size");
  if (b.availability && !AVAILABILITIES.includes(b.availability))
    throw new HttpError(400, "invalid availability");

  const id = crypto.randomUUID();
  await query(
    `INSERT INTO provider_applications
       (id, customer_id, full_name, phone, email, applicant_type, category, experience,
        coverage_area, team_size, availability, about)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      b.customer_id || null,
      b.full_name.trim().slice(0, 150),
      b.phone.trim().slice(0, 40),
      b.email.trim().toLowerCase().slice(0, 255),
      b.applicant_type || APPLICANT_TYPES[0],
      b.category.trim().slice(0, 150),
      b.experience || EXPERIENCE[0],
      b.coverage_area.trim().slice(0, 150),
      b.team_size || null,
      b.availability || null,
      typeof b.about === "string" ? b.about.slice(0, 2000) : null,
    ],
  );
  const rows = await query(`SELECT ${SELECT} FROM provider_applications WHERE id = ?`, [id]);
  res.status(201).json({ data: rows[0] });
});

exports.list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const rows = await query(
    `SELECT ${SELECT} FROM provider_applications ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  res.json({ data: rows, total: rows.length, limit, offset: 0 });
});

const STATUSES = ["new", "reviewing", "approved", "rejected"];

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
  }
  const result = await query(
    `UPDATE provider_applications SET status = ? WHERE id = ?`,
    [status, id],
  );
  if (!result.affectedRows) throw new HttpError(404, "application not found");
  const rows = await query(`SELECT ${SELECT} FROM provider_applications WHERE id = ?`, [id]);
  res.json({ data: rows[0] });
});
