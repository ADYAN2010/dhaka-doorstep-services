const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

const SELECT =
  "id, slug, title, excerpt, body, cover_image_url, tag, read_minutes, published, published_at, created_at, updated_at";

exports.listPublished = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT id, slug, title, excerpt, cover_image_url, tag, read_minutes, published_at
     FROM blog_posts
     WHERE published = 1
     ORDER BY published_at DESC
     LIMIT 200`,
  );
  res.json({ data: rows });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) throw new HttpError(400, "slug required");
  const rows = await query(
    `SELECT ${SELECT} FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1`,
    [slug],
  );
  if (!rows.length) throw new HttpError(404, "post not found");
  res.json({ data: rows[0] });
});

exports.listSlugs = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT slug, updated_at FROM blog_posts WHERE published = 1 ORDER BY published_at DESC LIMIT 1000`,
  );
  res.json({ data: rows });
});
