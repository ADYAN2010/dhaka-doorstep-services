/**
 * Simple forward-only SQL migrator.
 *
 *  - Reads every *.sql file in backend/sql/ in lexical order (001_, 002_, …).
 *  - Tracks applied files in a `_migrations` table so each runs exactly once.
 *  - Splits files on `;` at end of line so multi-statement files work.
 *
 * Run with:   npm --prefix backend run migrate
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const { getPool, closePool } = require("../config/db");

const SQL_DIR = path.join(__dirname, "..", "sql");

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function appliedSet(conn) {
  const [rows] = await conn.query("SELECT filename FROM _migrations");
  return new Set(rows.map((r) => r.filename));
}

function splitStatements(sql) {
  // Strip line comments, then split on ; at line end. Good enough for plain DDL/DML.
  const cleaned = sql
    .split("\n")
    .filter((l) => !/^\s*--/.test(l))
    .join("\n");
  return cleaned
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function run() {
  if (!fs.existsSync(SQL_DIR)) {
    console.error(`✖ SQL directory not found: ${SQL_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(SQL_DIR)
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort();

  if (!files.length) {
    console.log("No .sql files in backend/sql/ — nothing to do.");
    return;
  }

  const conn = await getPool().getConnection();
  try {
    await ensureMigrationsTable(conn);
    const done = await appliedSet(conn);

    let ran = 0;
    for (const file of files) {
      if (done.has(file)) {
        console.log(`• skip   ${file}  (already applied)`);
        continue;
      }
      const full = path.join(SQL_DIR, file);
      const sql = fs.readFileSync(full, "utf8");
      const statements = splitStatements(sql);

      console.log(`→ apply  ${file}  (${statements.length} statement${statements.length === 1 ? "" : "s"})`);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.query("INSERT INTO _migrations (filename) VALUES (?)", [file]);
      ran += 1;
    }

    console.log(`\n✅ Migration complete — ${ran} new file(s) applied, ${files.length - ran} already up to date.`);
  } finally {
    conn.release();
  }
}

run()
  .catch((err) => {
    console.error("\n✖ Migration failed:");
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
