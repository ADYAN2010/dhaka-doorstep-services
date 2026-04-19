/**
 * Tiny CRUD factory — generates list/getOne/create/update/remove handlers
 * for a table with a UUID or auto-increment primary key.
 *
 *   const crud = makeCrud({
 *     table: "customers",
 *     idColumn: "id",          // PK column name
 *     idType: "uuid",          // "uuid" → generated server-side, "int" → AUTO_INCREMENT
 *     selectColumns: "id, full_name, email, phone, area, is_active, created_at, updated_at",
 *     allowedColumns: ["full_name", "email", "phone", "area", "is_active"],
 *     required: ["full_name"], // for POST validation
 *     defaultOrder: "created_at DESC",
 *   });
 *
 *   router.get("/",   crud.list);
 *   router.post("/",  crud.create);
 *   router.get("/:id",   crud.getOne);
 *   router.patch("/:id", crud.update);
 *   router.delete("/:id", crud.remove);
 *
 * All queries are parameterised. Unknown columns in req.body are ignored.
 */
const crypto = require("crypto");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

function uuid() {
  // RFC4122 v4 using crypto.randomUUID (Node 14.17+)
  return crypto.randomUUID();
}

function pickAllowed(body, allowed) {
  const out = {};
  for (const k of allowed) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

function validateRequired(payload, required) {
  const missing = required.filter(
    (k) => payload[k] === undefined || payload[k] === null || payload[k] === "",
  );
  if (missing.length) {
    throw new HttpError(400, "Validation failed", {
      missing_fields: missing,
    });
  }
}

function makeCrud(opts) {
  const {
    table,
    idColumn = "id",
    idType = "uuid", // "uuid" | "int"
    selectColumns = "*",
    allowedColumns,
    required = [],
    defaultOrder = `${idColumn} DESC`,
    searchableColumns = [], // for ?q=foo LIKE search
  } = opts;

  if (!Array.isArray(allowedColumns) || !allowedColumns.length) {
    throw new Error(`makeCrud(${table}): allowedColumns is required`);
  }

  function parseId(raw) {
    if (idType === "int") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) throw new HttpError(400, "Invalid id");
      return n;
    }
    // uuid — basic shape check
    if (typeof raw !== "string" || !/^[0-9a-fA-F-]{32,36}$/.test(raw)) {
      throw new HttpError(400, "Invalid id");
    }
    return raw;
  }

  const list = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const q = (req.query.q || "").toString().trim();

    const params = [];
    let where = "";
    if (q && searchableColumns.length) {
      const like = `%${q}%`;
      where =
        "WHERE " + searchableColumns.map((c) => `${c} LIKE ?`).join(" OR ");
      for (let i = 0; i < searchableColumns.length; i++) params.push(like);
    }

    const sql = `SELECT ${selectColumns} FROM ${table} ${where} ORDER BY ${defaultOrder} LIMIT ? OFFSET ?`;
    const rows = await query(sql, [...params, limit, offset]);
    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM ${table} ${where}`,
      params,
    );
    res.json({ data: rows, total, limit, offset });
  });

  const getOne = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const rows = await query(
      `SELECT ${selectColumns} FROM ${table} WHERE ${idColumn} = ? LIMIT 1`,
      [id],
    );
    if (!rows.length) throw new HttpError(404, `${table} not found`);
    res.json({ data: rows[0] });
  });

  const create = asyncHandler(async (req, res) => {
    const payload = pickAllowed(req.body || {}, allowedColumns);
    validateRequired(payload, required);

    let id;
    let columns = Object.keys(payload);
    let values = columns.map((c) => payload[c]);

    if (idType === "uuid") {
      id = uuid();
      columns = [idColumn, ...columns];
      values = [id, ...values];
    }

    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
    const result = await query(sql, values);

    if (idType === "int") id = result.insertId;

    const rows = await query(
      `SELECT ${selectColumns} FROM ${table} WHERE ${idColumn} = ?`,
      [id],
    );
    res.status(201).json({ data: rows[0] });
  });

  const update = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const payload = pickAllowed(req.body || {}, allowedColumns);
    const fields = Object.keys(payload);
    if (!fields.length) throw new HttpError(400, "No fields to update");

    const setSql = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => payload[f]);
    const result = await query(
      `UPDATE ${table} SET ${setSql} WHERE ${idColumn} = ?`,
      [...values, id],
    );
    if (result.affectedRows === 0) throw new HttpError(404, `${table} not found`);

    const rows = await query(
      `SELECT ${selectColumns} FROM ${table} WHERE ${idColumn} = ?`,
      [id],
    );
    res.json({ data: rows[0] });
  });

  const remove = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = await query(
      `DELETE FROM ${table} WHERE ${idColumn} = ?`,
      [id],
    );
    if (result.affectedRows === 0) throw new HttpError(404, `${table} not found`);
    res.status(204).end();
  });

  return { list, getOne, create, update, remove };
}

module.exports = { makeCrud };
