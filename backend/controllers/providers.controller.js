/**
 * /api/providers — public-facing provider directory + admin CRUD.
 *
 *  Public:
 *    GET  /api/providers                 → filtered list (status='approved' only)
 *      ?q=         search name / business name
 *      ?category=  provider_category_links.category_slug
 *      ?area=      provider_area_links.area_slug
 *      ?minRating= 0..5
 *      ?sort=      rating_desc | reviews_desc | jobs_desc | newest
 *      ?page=1     1-indexed
 *      ?pageSize=  default 12, max 48
 *    GET  /api/providers/by-slug/:slug   → full detail bundle
 *    GET  /api/providers/:id             → admin single
 *
 *  Admin (write): create / patch / delete.
 */
const crypto = require("crypto");
const { query } = require("../config/db");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

const PUBLIC_COLS = `
  p.id, p.slug, p.full_name, p.business_name, p.provider_type,
  p.primary_area, p.primary_category, p.avatar_url, p.bio,
  p.pricing_label, p.response_time, p.years_experience, p.jobs_completed,
  p.languages, p.gallery, p.is_verified, p.is_top_rated,
  p.rating, p.review_count, p.created_at
`;

function shapeProvider(row) {
  if (!row) return null;
  let gallery = [];
  if (row.gallery) {
    try {
      gallery = typeof row.gallery === "string" ? JSON.parse(row.gallery) : row.gallery;
      if (!Array.isArray(gallery)) gallery = [];
    } catch {
      gallery = [];
    }
  }
  return {
    id: row.id,
    slug: row.slug,
    full_name: row.full_name,
    business_name: row.business_name,
    provider_type: row.provider_type,
    primary_area: row.primary_area,
    primary_category: row.primary_category,
    avatar_url: row.avatar_url,
    bio: row.bio,
    pricing_label: row.pricing_label,
    response_time: row.response_time,
    years_experience: row.years_experience,
    jobs_completed: row.jobs_completed,
    languages: row.languages
      ? String(row.languages)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    gallery,
    is_verified: !!row.is_verified,
    is_top_rated: !!row.is_top_rated,
    rating: Number(row.rating || 0),
    review_count: row.review_count || 0,
    created_at: row.created_at,
  };
}

// ---------- Public list ----------

const SORTS = {
  rating_desc: "p.rating DESC, p.review_count DESC, p.id ASC",
  reviews_desc: "p.review_count DESC, p.rating DESC, p.id ASC",
  jobs_desc: "p.jobs_completed DESC, p.rating DESC, p.id ASC",
  newest: "p.created_at DESC, p.id ASC",
};

exports.list = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  const category = (req.query.category || "").toString().trim();
  const area = (req.query.area || "").toString().trim();
  const minRating = Math.max(0, Math.min(5, parseFloat(req.query.minRating) || 0));
  const sort = SORTS[req.query.sort] || SORTS.rating_desc;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(48, Math.max(1, parseInt(req.query.pageSize, 10) || 12));
  const offset = (page - 1) * pageSize;

  // Admin variant returns all statuses; public default is approved only.
  const isAdmin = req.user && req.user.role && req.user.role !== "customer";
  const includeAll = isAdmin && req.query.all === "1";

  const joins = [];
  const wheres = ["1=1"];
  const params = [];

  if (!includeAll) wheres.push("p.status = 'approved'");

  if (category) {
    joins.push("INNER JOIN provider_category_links pcl ON pcl.provider_id = p.id");
    wheres.push("pcl.category_slug = ?");
    params.push(category);
  }
  if (area) {
    joins.push("INNER JOIN provider_area_links pal ON pal.provider_id = p.id");
    wheres.push("pal.area_slug = ?");
    params.push(area);
  }
  if (q) {
    wheres.push("(p.full_name LIKE ? OR p.business_name LIKE ? OR p.bio LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (minRating > 0) {
    wheres.push("p.rating >= ?");
    params.push(minRating);
  }

  const joinSql = joins.join(" ");
  const whereSql = wheres.join(" AND ");

  const rows = await query(
    `SELECT ${PUBLIC_COLS}
     FROM providers p
     ${joinSql}
     WHERE ${whereSql}
     GROUP BY p.id
     ORDER BY ${sort}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  const [{ total }] = await query(
    `SELECT COUNT(DISTINCT p.id) AS total
     FROM providers p
     ${joinSql}
     WHERE ${whereSql}`,
    params,
  );

  const ids = rows.map((r) => r.id);
  const cats = ids.length
    ? await query(
        `SELECT provider_id, category_slug FROM provider_category_links
         WHERE provider_id IN (${ids.map(() => "?").join(",")})`,
        ids,
      )
    : [];
  const areas = ids.length
    ? await query(
        `SELECT provider_id, area_slug FROM provider_area_links
         WHERE provider_id IN (${ids.map(() => "?").join(",")})`,
        ids,
      )
    : [];

  const catMap = new Map();
  for (const r of cats) {
    if (!catMap.has(r.provider_id)) catMap.set(r.provider_id, []);
    catMap.get(r.provider_id).push(r.category_slug);
  }
  const areaMap = new Map();
  for (const r of areas) {
    if (!areaMap.has(r.provider_id)) areaMap.set(r.provider_id, []);
    areaMap.get(r.provider_id).push(r.area_slug);
  }

  res.json({
    data: rows.map((r) => ({
      ...shapeProvider(r),
      categories: catMap.get(r.id) || [],
      areas: areaMap.get(r.id) || [],
    })),
    total,
    page,
    pageSize,
  });
});

// ---------- Detail by slug or id ----------

async function loadDetail(whereClause, value) {
  const rows = await query(
    `SELECT ${PUBLIC_COLS}, p.status FROM providers p WHERE ${whereClause} LIMIT 1`,
    [value],
  );
  if (!rows.length) throw new HttpError(404, "Provider not found");
  const provider = shapeProvider(rows[0]);
  provider.status = rows[0].status;

  const [cats, areas, availability, reviewStats, recentReviews] = await Promise.all([
    query("SELECT category_slug FROM provider_category_links WHERE provider_id = ?", [provider.id]),
    query("SELECT area_slug FROM provider_area_links WHERE provider_id = ?", [provider.id]),
    query(
      `SELECT weekday, TIME_FORMAT(start_time, '%H:%i') AS start_time,
              TIME_FORMAT(end_time, '%H:%i') AS end_time, is_active
       FROM provider_availability WHERE provider_id = ?
       ORDER BY weekday ASC, start_time ASC`,
      [provider.id],
    ),
    query(
      `SELECT
         COUNT(*) AS count,
         COALESCE(ROUND(AVG(rating), 2), 0) AS avg_rating,
         SUM(rating = 5) AS r5,
         SUM(rating = 4) AS r4,
         SUM(rating = 3) AS r3,
         SUM(rating = 2) AS r2,
         SUM(rating = 1) AS r1
       FROM reviews WHERE provider_id = ?`,
      [provider.id],
    ),
    query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              c.full_name AS customer_name
       FROM reviews r
       LEFT JOIN customers c ON c.id = r.customer_id
       WHERE r.provider_id = ?
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [provider.id],
    ),
  ]);

  return {
    ...provider,
    categories: cats.map((r) => r.category_slug),
    areas: areas.map((r) => r.area_slug),
    availability: availability.map((r) => ({
      weekday: r.weekday,
      start_time: r.start_time,
      end_time: r.end_time,
      is_active: !!r.is_active,
    })),
    review_stats: {
      count: Number(reviewStats[0]?.count || 0),
      avg_rating: Number(reviewStats[0]?.avg_rating || 0),
      breakdown: {
        5: Number(reviewStats[0]?.r5 || 0),
        4: Number(reviewStats[0]?.r4 || 0),
        3: Number(reviewStats[0]?.r3 || 0),
        2: Number(reviewStats[0]?.r2 || 0),
        1: Number(reviewStats[0]?.r1 || 0),
      },
    },
    recent_reviews: recentReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      customer_name: r.customer_name || "Customer",
    })),
  };
}

exports.getBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").trim();
  if (!slug) throw new HttpError(400, "slug is required");
  const detail = await loadDetail("p.slug = ? AND p.status = 'approved'", slug);
  res.json({ data: detail });
});

exports.getOne = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!/^[0-9a-fA-F-]{32,36}$/.test(id)) throw new HttpError(400, "Invalid id");
  const detail = await loadDetail("p.id = ?", id);
  res.json({ data: detail });
});

// ---------- Admin write ----------

const ALLOWED = [
  "slug", "full_name", "business_name", "provider_type", "email", "phone",
  "primary_area", "primary_category", "avatar_url", "bio", "pricing_label",
  "response_time", "years_experience", "jobs_completed", "languages",
  "is_verified", "is_top_rated", "status",
];

function pick(body) {
  const out = {};
  for (const k of ALLOWED) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

exports.create = asyncHandler(async (req, res) => {
  const payload = pick(req.body || {});
  if (!payload.full_name) throw new HttpError(400, "full_name is required");
  const id = crypto.randomUUID();
  const cols = ["id", ...Object.keys(payload)];
  const vals = [id, ...Object.values(payload)];
  await query(
    `INSERT INTO providers (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  res.status(201).json({ data: { id } });
});

exports.update = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "");
  const payload = pick(req.body || {});
  const fields = Object.keys(payload);
  if (!fields.length) throw new HttpError(400, "No fields to update");
  const result = await query(
    `UPDATE providers SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    [...Object.values(payload), id],
  );
  if (!result.affectedRows) throw new HttpError(404, "Provider not found");
  res.json({ ok: true });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "");
  const result = await query("DELETE FROM providers WHERE id = ?", [id]);
  if (!result.affectedRows) throw new HttpError(404, "Provider not found");
  res.status(204).end();
});
