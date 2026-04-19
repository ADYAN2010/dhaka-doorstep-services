/**
 * /api/locations — combined cities + areas helpers for dropdowns.
 *
 *   GET /api/locations             → { cities: [{...}], areas_by_city: { [cityId]: [...] } }
 *   GET /api/locations/cities      → cities list (active only)
 *   GET /api/locations/areas?city_id=...  → areas for a city
 */
const router = require("express").Router();
const { query } = require("../config/db");
const { asyncHandler } = require("../middleware/error-handler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cities = await query(
      "SELECT id, slug, name, country, launch_status, display_order FROM cities WHERE is_active = 1 ORDER BY display_order ASC, name ASC",
    );
    const areas = await query(
      "SELECT id, city_id, slug, name, display_order FROM areas WHERE is_active = 1 ORDER BY display_order ASC, name ASC",
    );
    const areas_by_city = {};
    for (const a of areas) (areas_by_city[a.city_id] ||= []).push(a);
    res.json({ cities, areas_by_city });
  }),
);

router.get(
  "/cities",
  asyncHandler(async (req, res) => {
    const rows = await query(
      "SELECT id, slug, name, country, launch_status, display_order FROM cities WHERE is_active = 1 ORDER BY display_order ASC, name ASC",
    );
    res.json({ data: rows });
  }),
);

router.get(
  "/areas",
  asyncHandler(async (req, res) => {
    const cityId = req.query.city_id;
    if (cityId) {
      const rows = await query(
        "SELECT id, city_id, slug, name, display_order FROM areas WHERE is_active = 1 AND city_id = ? ORDER BY display_order ASC, name ASC",
        [cityId],
      );
      return res.json({ data: rows });
    }
    const rows = await query(
      "SELECT id, city_id, slug, name, display_order FROM areas WHERE is_active = 1 ORDER BY display_order ASC, name ASC",
    );
    res.json({ data: rows });
  }),
);

module.exports = router;
